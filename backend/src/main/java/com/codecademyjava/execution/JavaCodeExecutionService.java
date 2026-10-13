package com.codecademyjava.execution;

import org.springframework.stereotype.Service;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class JavaCodeExecutionService {

    private static final String MAIN_CLASS_NAME = "Main";
    private static final long STREAM_DRAIN_TIMEOUT_MILLIS = 2000;

    private final CodeExecutionProperties codeExecutionProperties;
    private final Semaphore concurrentExecutionPermits;
    private final JavaCompiler systemJavaCompiler;
    private final String javaExecutablePath;

    public JavaCodeExecutionService(CodeExecutionProperties codeExecutionProperties) {
        this.codeExecutionProperties = codeExecutionProperties;
        this.concurrentExecutionPermits = new Semaphore(codeExecutionProperties.maxConcurrentExecutions(), true);
        this.systemJavaCompiler = ToolProvider.getSystemJavaCompiler();
        if (systemJavaCompiler == null) {
            throw new IllegalStateException("JDK obrigatório: javax.tools.JavaCompiler indisponível (rodando em JRE?)");
        }
        this.javaExecutablePath = Path.of(System.getProperty("java.home"), "bin", "java").toString();
    }

    public CodeExecutionResult compileAndRun(String sourceCode) {
        if (!tryAcquireExecutionPermit()) {
            return CodeExecutionResult.serverBusy();
        }
        Path temporaryWorkingDirectory = null;
        long startTimeNanos = System.nanoTime();
        try {
            temporaryWorkingDirectory = Files.createTempDirectory("codecademy-java-");
            Path sourceFile = temporaryWorkingDirectory.resolve(MAIN_CLASS_NAME + ".java");
            Files.writeString(sourceFile, sourceCode, StandardCharsets.UTF_8);

            String compilationErrors = compileSourceFile(sourceFile, temporaryWorkingDirectory);
            if (compilationErrors != null) {
                return CodeExecutionResult.compilationFailed(compilationErrors, elapsedMillisSince(startTimeNanos));
            }
            return runCompiledMainClass(temporaryWorkingDirectory, startTimeNanos);
        } catch (IOException ioException) {
            throw new UncheckedIOException(ioException);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Execução interrompida", interruptedException);
        } finally {
            deleteDirectoryRecursivelyQuietly(temporaryWorkingDirectory);
            concurrentExecutionPermits.release();
        }
    }

    private boolean tryAcquireExecutionPermit() {
        try {
            return concurrentExecutionPermits.tryAcquire(
                    codeExecutionProperties.permitAcquireTimeoutMillis(), TimeUnit.MILLISECONDS);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    private String compileSourceFile(Path sourceFile, Path outputDirectory) throws IOException {
        DiagnosticCollector<JavaFileObject> diagnosticCollector = new DiagnosticCollector<>();
        try (StandardJavaFileManager fileManager =
                     systemJavaCompiler.getStandardFileManager(diagnosticCollector, Locale.forLanguageTag("pt-BR"), StandardCharsets.UTF_8)) {
            Iterable<? extends JavaFileObject> compilationUnits = fileManager.getJavaFileObjects(sourceFile);
            List<String> compilerOptions = List.of("-encoding", "UTF-8", "-d", outputDirectory.toString(), "-Xlint:none");
            boolean compilationSucceeded = systemJavaCompiler
                    .getTask(null, fileManager, diagnosticCollector, compilerOptions, null, compilationUnits)
                    .call();
            if (compilationSucceeded) {
                return null;
            }
            return diagnosticCollector.getDiagnostics().stream()
                    .filter(diagnostic -> diagnostic.getKind() == Diagnostic.Kind.ERROR)
                    .map(diagnostic -> "Linha %d: %s".formatted(diagnostic.getLineNumber(), diagnostic.getMessage(Locale.forLanguageTag("pt-BR"))))
                    .collect(Collectors.joining("\n"));
        }
    }

    private CodeExecutionResult runCompiledMainClass(Path classesDirectory, long startTimeNanos)
            throws IOException, InterruptedException {
        List<String> runCommand = List.of(
                javaExecutablePath,
                "-Xmx" + codeExecutionProperties.maxHeapMegabytes() + "m",
                "-Xss1m",
                "-XX:+UseSerialGC",
                "-XX:TieredStopAtLevel=1",
                "-Xshare:auto",
                "-Dfile.encoding=UTF-8",
                "-Dstdout.encoding=UTF-8",
                "-Dstderr.encoding=UTF-8",
                "-cp", classesDirectory.toString(),
                MAIN_CLASS_NAME
        );
        Process studentProcess = new ProcessBuilder(runCommand).directory(classesDirectory.toFile()).start();
        studentProcess.getOutputStream().close();

        AtomicBoolean outputLimitExceeded = new AtomicBoolean(false);
        ExecutorService streamReaderExecutor = Executors.newVirtualThreadPerTaskExecutor();
        try {
            Future<String> standardOutputFuture = streamReaderExecutor.submit(
                    () -> readStreamWithinByteBudget(studentProcess.getInputStream(), studentProcess, outputLimitExceeded));
            Future<String> standardErrorFuture = streamReaderExecutor.submit(
                    () -> readStreamWithinByteBudget(studentProcess.getErrorStream(), studentProcess, outputLimitExceeded));

            boolean finishedWithinTimeout = studentProcess.waitFor(codeExecutionProperties.runTimeoutMillis(), TimeUnit.MILLISECONDS);
            if (!finishedWithinTimeout) {
                killProcessTree(studentProcess);
            }

            String standardOutput = awaitStreamContent(standardOutputFuture);
            String standardError = awaitStreamContent(standardErrorFuture);
            long durationMillis = elapsedMillisSince(startTimeNanos);

            ExecutionStatus executionStatus;
            if (outputLimitExceeded.get()) {
                executionStatus = ExecutionStatus.OUTPUT_LIMIT_EXCEEDED;
            } else if (!finishedWithinTimeout) {
                executionStatus = ExecutionStatus.TIMEOUT;
            } else if (studentProcess.exitValue() != 0) {
                executionStatus = ExecutionStatus.RUNTIME_ERROR;
            } else {
                executionStatus = ExecutionStatus.SUCCESS;
            }
            return new CodeExecutionResult(executionStatus, standardOutput, standardError, "", durationMillis);
        } finally {
            killProcessTree(studentProcess);
            streamReaderExecutor.shutdownNow();
        }
    }

    private String readStreamWithinByteBudget(InputStream processStream, Process owningProcess, AtomicBoolean outputLimitExceeded)
            throws IOException {
        int maxOutputBytes = codeExecutionProperties.maxOutputBytes();
        ByteArrayOutputStream collectedBytes = new ByteArrayOutputStream();
        byte[] readBuffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = processStream.read(readBuffer)) != -1) {
            int remainingBudget = maxOutputBytes - collectedBytes.size();
            if (bytesRead > remainingBudget) {
                collectedBytes.write(readBuffer, 0, Math.max(remainingBudget, 0));
                outputLimitExceeded.set(true);
                killProcessTree(owningProcess);
                break;
            }
            collectedBytes.write(readBuffer, 0, bytesRead);
        }
        return collectedBytes.toString(StandardCharsets.UTF_8);
    }

    private String awaitStreamContent(Future<String> streamContentFuture) throws InterruptedException {
        try {
            return streamContentFuture.get(STREAM_DRAIN_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS);
        } catch (ExecutionException | TimeoutException streamReadFailure) {
            streamContentFuture.cancel(true);
            return "";
        }
    }

    private static void killProcessTree(Process process) {
        process.descendants().forEach(ProcessHandle::destroyForcibly);
        process.destroyForcibly();
    }

    private static long elapsedMillisSince(long startTimeNanos) {
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTimeNanos);
    }

    private static void deleteDirectoryRecursivelyQuietly(Path directory) {
        if (directory == null) {
            return;
        }
        try (Stream<Path> directoryEntries = Files.walk(directory)) {
            directoryEntries.sorted(Comparator.reverseOrder()).forEach(path -> path.toFile().delete());
        } catch (IOException ignored) {
        }
    }
}
