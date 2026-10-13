export interface LessonSummary {
  id: string;
  order: number;
  title: string;
}

export interface LessonDetail extends LessonSummary {
  instructionsMarkdown: string;
  starterCode: string;
  hints: string[];
}

export type ExecutionStatus =
  | "SUCCESS"
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "TIMEOUT"
  | "OUTPUT_LIMIT_EXCEEDED"
  | "SERVER_BUSY";

export interface SubmissionResponse {
  execution: {
    status: ExecutionStatus;
    standardOutput: string;
    standardError: string;
    compilationErrors: string;
    durationMillis: number;
  };
  validation: {
    passed: boolean;
    feedbackMessages: string[];
  };
}

async function fetchJsonOrThrow<ResponseBody>(url: string, requestInit?: RequestInit): Promise<ResponseBody> {
  const httpResponse = await fetch(url, requestInit);
  if (!httpResponse.ok) {
    throw new Error(`Erro ${httpResponse.status} ao chamar ${url}`);
  }
  return httpResponse.json() as Promise<ResponseBody>;
}

export function fetchLessonSummaries(): Promise<LessonSummary[]> {
  return fetchJsonOrThrow("/api/lessons");
}

export function fetchLessonDetail(lessonId: string, abortSignal?: AbortSignal): Promise<LessonDetail> {
  return fetchJsonOrThrow(`/api/lessons/${encodeURIComponent(lessonId)}`, { signal: abortSignal });
}

export function submitLessonSolution(lessonId: string, sourceCode: string): Promise<SubmissionResponse> {
  return fetchJsonOrThrow(`/api/lessons/${encodeURIComponent(lessonId)}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceCode }),
  });
}
