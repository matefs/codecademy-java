import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  fetchLessonDetail,
  fetchLessonSummaries,
  submitLessonSolution,
  type LessonDetail,
  type LessonSummary,
  type SubmissionResponse,
} from "./api/lessonsApi";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { LessonSidebar } from "./components/LessonSidebar";
import { InstructionsPanel } from "./components/InstructionsPanel";
import { OutputConsole } from "./components/OutputConsole";
import { registerJavaCompletionProvider } from "./editor/registerJavaCompletionProvider";

export default function App() {
  const [lessonSummaries, setLessonSummaries] = useState<LessonSummary[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useLocalStorageState<string | null>("selectedLessonId", null);
  const [completedLessonIds, setCompletedLessonIds] = useLocalStorageState<string[]>("completedLessonIds", []);
  const [codeDraftsByLessonId, setCodeDraftsByLessonId] = useLocalStorageState<Record<string, string>>("codeDraftsByLessonId", {});
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [submissionResponse, setSubmissionResponse] = useState<SubmissionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null);
  const currentLessonIdRef = useRef<string | null>(selectedLessonId);

  useEffect(() => {
    fetchLessonSummaries()
      .then((loadedSummaries) => {
        setLessonSummaries(loadedSummaries);
        const selectedLessonStillExists = loadedSummaries.some((lesson) => lesson.id === selectedLessonId);
        if (!selectedLessonStillExists && loadedSummaries.length > 0) {
          setSelectedLessonId(loadedSummaries[0].id);
        }
      })
      .catch((loadError: Error) => setRequestErrorMessage(`Backend indisponível: ${loadError.message}`));
  }, []);

  useEffect(() => {
    currentLessonIdRef.current = selectedLessonId;
    if (!selectedLessonId) return;
    const lessonDetailAbortController = new AbortController();
    setLessonDetail(null);
    setSubmissionResponse(null);
    setRequestErrorMessage(null);
    setRevealedHintCount(0);
    fetchLessonDetail(selectedLessonId, lessonDetailAbortController.signal)
      .then(setLessonDetail)
      .catch((loadError: Error) => {
        if (loadError.name !== "AbortError") setRequestErrorMessage(loadError.message);
      });
    return () => lessonDetailAbortController.abort();
  }, [selectedLessonId]);

  const currentSourceCode = lessonDetail ? codeDraftsByLessonId[lessonDetail.id] ?? lessonDetail.starterCode : "";

  function updateCurrentDraft(updatedSourceCode: string | undefined) {
    if (!lessonDetail) return;
    setCodeDraftsByLessonId((previousDrafts) => ({ ...previousDrafts, [lessonDetail.id]: updatedSourceCode ?? "" }));
  }

  function resetCurrentDraftToStarterCode() {
    if (!lessonDetail) return;
    setCodeDraftsByLessonId(({ [lessonDetail.id]: _discardedDraft, ...remainingDrafts }) => remainingDrafts);
    setSubmissionResponse(null);
  }

  async function runCurrentSolution() {
    if (!lessonDetail || isSubmitting) return;
    const submittedLessonId = lessonDetail.id;
    setIsSubmitting(true);
    setRequestErrorMessage(null);
    try {
      const receivedResponse = await submitLessonSolution(submittedLessonId, currentSourceCode);
      if (receivedResponse.validation.passed) {
        setCompletedLessonIds((previousIds) => (previousIds.includes(submittedLessonId) ? previousIds : [...previousIds, submittedLessonId]));
      }
      if (currentLessonIdRef.current === submittedLessonId) setSubmissionResponse(receivedResponse);
    } catch (submitError) {
      if (currentLessonIdRef.current === submittedLessonId) setRequestErrorMessage((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentLessonIndex = lessonSummaries.findIndex((lesson) => lesson.id === selectedLessonId);
  const nextLesson = currentLessonIndex >= 0 ? lessonSummaries[currentLessonIndex + 1] : undefined;
  const isCurrentLessonCompleted = selectedLessonId !== null && completedLessonIds.includes(selectedLessonId);

  return (
    <div className="app-layout">
      <LessonSidebar
        lessonSummaries={lessonSummaries}
        selectedLessonId={selectedLessonId}
        completedLessonIds={completedLessonIds}
        onSelectLesson={setSelectedLessonId}
      />
      {lessonDetail ? (
        <>
          <InstructionsPanel
            lessonDetail={lessonDetail}
            revealedHintCount={revealedHintCount}
            onRevealNextHint={() => setRevealedHintCount((previousCount) => previousCount + 1)}
          />
          <main className="workspace">
            <div className="editor-toolbar">
              <span className="file-name">Main.java</span>
              <div className="toolbar-actions">
                <button className="secondary-button" onClick={resetCurrentDraftToStarterCode}>
                  Resetar
                </button>
                <button className="primary-button" onClick={runCurrentSolution} disabled={isSubmitting}>
                  {isSubmitting ? "Executando..." : "▶ Executar"}
                </button>
                {isCurrentLessonCompleted && nextLesson && (
                  <button className="primary-button" onClick={() => setSelectedLessonId(nextLesson.id)}>
                    Próxima →
                  </button>
                )}
              </div>
            </div>
            <div className="editor-container">
              <Editor
                language="java"
                theme="vs-dark"
                beforeMount={registerJavaCompletionProvider}
                value={currentSourceCode}
                onChange={updateCurrentDraft}
                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 4, tabCompletion: "on" }}
              />
            </div>
            <OutputConsole
              submissionResponse={submissionResponse}
              isSubmitting={isSubmitting}
              requestErrorMessage={requestErrorMessage}
            />
          </main>
        </>
      ) : (
        <main className="workspace loading-state">{requestErrorMessage ?? "Carregando..."}</main>
      )}
    </div>
  );
}
