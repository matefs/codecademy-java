package com.codecademyjava.submission;

import com.codecademyjava.execution.CodeExecutionResult;
import com.codecademyjava.execution.JavaCodeExecutionService;
import com.codecademyjava.lessons.LessonDefinition;
import com.codecademyjava.lessons.LessonRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/lessons/{lessonId}/submissions")
public class SubmissionController {

    public record SubmissionRequest(@NotBlank @Size(max = 20_000) String sourceCode) {
    }

    public record SubmissionResponse(CodeExecutionResult execution, ExerciseValidationService.ValidationResult validation) {
    }

    private final LessonRepository lessonRepository;
    private final JavaCodeExecutionService javaCodeExecutionService;
    private final ExerciseValidationService exerciseValidationService;

    public SubmissionController(LessonRepository lessonRepository,
                                JavaCodeExecutionService javaCodeExecutionService,
                                ExerciseValidationService exerciseValidationService) {
        this.lessonRepository = lessonRepository;
        this.javaCodeExecutionService = javaCodeExecutionService;
        this.exerciseValidationService = exerciseValidationService;
    }

    @PostMapping
    public SubmissionResponse submit(@PathVariable String lessonId, @Valid @RequestBody SubmissionRequest submissionRequest) {
        LessonDefinition lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lição não encontrada"));
        CodeExecutionResult executionResult = javaCodeExecutionService.compileAndRun(submissionRequest.sourceCode());
        ExerciseValidationService.ValidationResult validationResult =
                exerciseValidationService.validate(lesson, submissionRequest.sourceCode(), executionResult);
        return new SubmissionResponse(executionResult, validationResult);
    }
}
