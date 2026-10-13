package com.codecademyjava.lessons;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    public record LessonSummaryResponse(String id, int order, String title) {
    }

    public record LessonDetailResponse(String id, int order, String title, String instructionsMarkdown,
                                       String starterCode, List<String> hints) {
    }

    private final LessonRepository lessonRepository;

    public LessonController(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    @GetMapping
    public List<LessonSummaryResponse> listLessons() {
        return lessonRepository.findAllOrdered().stream()
                .map(lesson -> new LessonSummaryResponse(lesson.id(), lesson.order(), lesson.title()))
                .toList();
    }

    @GetMapping("/{lessonId}")
    public LessonDetailResponse getLesson(@PathVariable String lessonId) {
        LessonDefinition lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lição não encontrada"));
        return new LessonDetailResponse(lesson.id(), lesson.order(), lesson.title(),
                lesson.instructionsMarkdown(), lesson.starterCode(), lesson.hints());
    }
}
