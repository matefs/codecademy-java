package com.codecademyjava.execution;

public record CodeExecutionResult(
        ExecutionStatus status,
        String standardOutput,
        String standardError,
        String compilationErrors,
        long durationMillis
) {

    public static CodeExecutionResult compilationFailed(String compilationErrors, long durationMillis) {
        return new CodeExecutionResult(ExecutionStatus.COMPILATION_ERROR, "", "", compilationErrors, durationMillis);
    }

    public static CodeExecutionResult serverBusy() {
        return new CodeExecutionResult(ExecutionStatus.SERVER_BUSY, "", "Servidor ocupado, tente novamente.", "", 0);
    }

    public boolean finishedSuccessfully() {
        return status == ExecutionStatus.SUCCESS;
    }
}
