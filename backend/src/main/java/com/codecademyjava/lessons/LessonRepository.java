package com.codecademyjava.lessons;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Repository
public class LessonRepository {

    private static final String LESSON_METADATA_PATTERN = "classpath*:lessons/*/lesson.json";

    private final Map<String, LessonDefinition> lessonsById;

    public LessonRepository(ObjectMapper objectMapper) {
        this.lessonsById = loadAllLessonsFromClasspath(objectMapper);
    }

    public List<LessonDefinition> findAllOrdered() {
        return List.copyOf(lessonsById.values());
    }

    public Optional<LessonDefinition> findById(String lessonId) {
        return Optional.ofNullable(lessonsById.get(lessonId));
    }

    private static Map<String, LessonDefinition> loadAllLessonsFromClasspath(ObjectMapper objectMapper) {
        try {
            Resource[] lessonMetadataResources = new PathMatchingResourcePatternResolver().getResources(LESSON_METADATA_PATTERN);
            return Arrays.stream(lessonMetadataResources)
                    .map(metadataResource -> loadLesson(metadataResource, objectMapper))
                    .sorted(Comparator.comparingInt(LessonDefinition::order))
                    .collect(Collectors.toMap(LessonDefinition::id, Function.identity(),
                            (firstLesson, duplicateLesson) -> {
                                throw new IllegalStateException("ID de lição duplicado: " + firstLesson.id());
                            },
                            LinkedHashMap::new));
        } catch (IOException ioException) {
            throw new UncheckedIOException("Falha ao carregar lições", ioException);
        }
    }

    private static LessonDefinition loadLesson(Resource metadataResource, ObjectMapper objectMapper) {
        try {
            LessonMetadata lessonMetadata = objectMapper.readValue(metadataResource.getInputStream(), LessonMetadata.class);
            return new LessonDefinition(
                    lessonMetadata.id(),
                    lessonMetadata.order(),
                    lessonMetadata.title(),
                    readSiblingResource(metadataResource, "instructions.md"),
                    readSiblingResource(metadataResource, "Starter.java"),
                    Optional.ofNullable(lessonMetadata.hints()).orElse(List.of()),
                    readSiblingResource(metadataResource, "expected_output.txt"),
                    Optional.ofNullable(lessonMetadata.requiredCodePatterns()).orElse(List.of())
            );
        } catch (IOException ioException) {
            throw new UncheckedIOException("Falha ao carregar lição: " + metadataResource.getDescription(), ioException);
        }
    }

    private static String readSiblingResource(Resource metadataResource, String siblingFileName) throws IOException {
        return metadataResource.createRelative(siblingFileName).getContentAsString(StandardCharsets.UTF_8);
    }
}
