package com.codecademyjava.execution;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "code-execution")
public record CodeExecutionProperties(
        long runTimeoutMillis,
        int maxHeapMegabytes,
        int maxOutputBytes,
        int maxConcurrentExecutions,
        long permitAcquireTimeoutMillis
) {
}
