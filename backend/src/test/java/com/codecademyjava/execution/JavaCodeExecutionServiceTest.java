package com.codecademyjava.execution;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JavaCodeExecutionServiceTest {

    private final JavaCodeExecutionService javaCodeExecutionService =
            new JavaCodeExecutionService(new CodeExecutionProperties(3000, 64, 1024, 2, 1000));

    private static String wrapInMainClass(String mainMethodBody) {
        return "public class Main { public static void main(String[] args) throws Exception { " + mainMethodBody + " } }";
    }

    @Test
    void returnsStandardOutputWhenProgramSucceeds() {
        CodeExecutionResult executionResult = javaCodeExecutionService.compileAndRun(wrapInMainClass("System.out.println(\"Olá\");"));
        assertThat(executionResult.status()).isEqualTo(ExecutionStatus.SUCCESS);
        assertThat(executionResult.standardOutput()).isEqualTo("Olá\n");
    }

    @Test
    void returnsCompilationErrorWithLineNumber() {
        CodeExecutionResult executionResult = javaCodeExecutionService.compileAndRun(wrapInMainClass("int x = \"texto\";"));
        assertThat(executionResult.status()).isEqualTo(ExecutionStatus.COMPILATION_ERROR);
        assertThat(executionResult.compilationErrors()).startsWith("Linha 1:");
    }

    @Test
    void returnsRuntimeErrorWhenExceptionIsThrown() {
        CodeExecutionResult executionResult = javaCodeExecutionService.compileAndRun(wrapInMainClass("int[] a = new int[1]; a[5] = 1;"));
        assertThat(executionResult.status()).isEqualTo(ExecutionStatus.RUNTIME_ERROR);
        assertThat(executionResult.standardError()).contains("ArrayIndexOutOfBoundsException");
    }

    @Test
    void killsInfiniteLoopAfterTimeout() {
        CodeExecutionResult executionResult = javaCodeExecutionService.compileAndRun(wrapInMainClass("while (true) {}"));
        assertThat(executionResult.status()).isEqualTo(ExecutionStatus.TIMEOUT);
    }

    @Test
    void stopsProgramThatExceedsOutputLimit() {
        CodeExecutionResult executionResult = javaCodeExecutionService.compileAndRun(wrapInMainClass("while (true) System.out.println(\"spam\");"));
        assertThat(executionResult.status()).isEqualTo(ExecutionStatus.OUTPUT_LIMIT_EXCEEDED);
        assertThat(executionResult.standardOutput().length()).isLessThanOrEqualTo(1024);
    }
}
