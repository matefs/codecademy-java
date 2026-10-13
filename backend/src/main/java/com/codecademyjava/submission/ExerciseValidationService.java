package com.codecademyjava.submission;

import com.codecademyjava.execution.CodeExecutionResult;
import com.codecademyjava.lessons.LessonDefinition;
import com.codecademyjava.lessons.RequiredCodePattern;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExerciseValidationService {

    public record ValidationResult(boolean passed, List<String> feedbackMessages) {
    }

    public ValidationResult validate(LessonDefinition lesson, String sourceCode, CodeExecutionResult executionResult) {
        List<String> feedbackMessages = new ArrayList<>();

        for (RequiredCodePattern requiredCodePattern : lesson.requiredCodePatterns()) {
            if (!requiredCodePattern.isSatisfiedBy(sourceCode)) {
                feedbackMessages.add(requiredCodePattern.failureMessage());
            }
        }

        if (!executionResult.finishedSuccessfully()) {
            feedbackMessages.add("Seu programa não terminou com sucesso (" + executionResult.status() + ").");
        } else if (!normalizeOutput(executionResult.standardOutput()).equals(normalizeOutput(lesson.expectedOutput()))) {
            feedbackMessages.add("A saída não bate com o esperado. Confira maiúsculas, espaços e quebras de linha.");
        }

        return new ValidationResult(feedbackMessages.isEmpty(), feedbackMessages);
    }

    private static String normalizeOutput(String rawOutput) {
        return Arrays.stream(rawOutput.replace("\r\n", "\n").split("\n"))
                .map(String::stripTrailing)
                .collect(Collectors.joining("\n"))
                .strip();
    }
}
