package com.codecademyjava.lessons;

import java.util.List;

record LessonMetadata(
        String id,
        int order,
        String title,
        List<String> hints,
        List<RequiredCodePattern> requiredCodePatterns
) {
}
