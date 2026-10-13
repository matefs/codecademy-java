package com.codecademyjava.lessons;

import java.util.List;

public record LessonDefinition(
        String id,
        int order,
        String title,
        String instructionsMarkdown,
        String starterCode,
        List<String> hints,
        String expectedOutput,
        List<RequiredCodePattern> requiredCodePatterns
) {
}
