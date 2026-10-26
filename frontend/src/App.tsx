import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { ArrowRight, BookOpen, ChevronDown, ChevronUp, Loader2, Menu, PanelLeftClose, PanelLeftOpen, Play, RotateCcw } from "lucide-react";
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
  const [isLessonSidebarOpen, setIsLessonSidebarOpen] = useState(false);
  const [isLessonSidebarCollapsed, setIsLessonSidebarCollapsed] = useLocalStorageState("isLessonSidebarCollapsed", false);
  const [isInstructionsPanelCollapsed, setIsInstructionsPanelCollapsed] = useLocalStorageState("isInstructionsPanelCollapsed", false);
  const [isOutputConsoleCollapsed, setIsOutputConsoleCollapsed] = useLocalStorageState("isOutputConsoleCollapsed", false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<"instructions" | "code">("instructions");
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

  function selectLessonAndCloseSidebar(lessonId: string) {
    setSelectedLessonId(lessonId);
    setIsLessonSidebarOpen(false);
    setActiveMobilePanel("instructions");
  }

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
      if (currentLessonIdRef.current === submittedLessonId) {
        setActiveMobilePanel("code");
        setIsOutputConsoleCollapsed(false);
      }
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
    <div
      className={[
        "app-layout",
        `mobile-panel-${activeMobilePanel}`,
        isLessonSidebarCollapsed ? "is-sidebar-collapsed" : "",
        isInstructionsPanelCollapsed ? "is-instructions-collapsed" : "",
      ].join(" ")}
    >
      <header className="mobile-header">
        <button
          className="icon-button"
          aria-label="Abrir lista de lições"
          aria-expanded={isLessonSidebarOpen}
          onClick={() => setIsLessonSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <span className="mobile-header-title">{lessonDetail?.title ?? "Java Academy"}</span>
      </header>
      <nav className="mobile-panel-tabs" aria-label="Alternar painel">
        <button
          className={`mobile-panel-tab ${activeMobilePanel === "instructions" ? "is-active" : ""}`}
          onClick={() => setActiveMobilePanel("instructions")}
        >
          Instruções
        </button>
        <button
          className={`mobile-panel-tab ${activeMobilePanel === "code" ? "is-active" : ""}`}
          onClick={() => setActiveMobilePanel("code")}
        >
          Código
        </button>
      </nav>
      {isLessonSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsLessonSidebarOpen(false)} />}
      <LessonSidebar
        lessonSummaries={lessonSummaries}
        selectedLessonId={selectedLessonId}
        completedLessonIds={completedLessonIds}
        isOpenOnSmallScreens={isLessonSidebarOpen}
        onSelectLesson={selectLessonAndCloseSidebar}
        onCloseSidebar={() => setIsLessonSidebarOpen(false)}
      />
      {lessonDetail ? (
        <>
          <InstructionsPanel
            lessonDetail={lessonDetail}
            revealedHintCount={revealedHintCount}
            onRevealNextHint={() => setRevealedHintCount((previousCount) => previousCount + 1)}
          />
          <main className={`workspace ${isOutputConsoleCollapsed ? "is-console-collapsed" : ""}`}>
            <div className="editor-toolbar">
              <div className="toolbar-panel-toggles">
                <button
                  className="icon-button desktop-sidebar-toggle"
                  title={isLessonSidebarCollapsed ? "Mostrar lições" : "Recolher lições"}
                  aria-pressed={!isLessonSidebarCollapsed}
                  onClick={() => setIsLessonSidebarCollapsed((wasCollapsed) => !wasCollapsed)}
                >
                  {isLessonSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
                <button
                  className="icon-button instructions-toggle"
                  title={isInstructionsPanelCollapsed ? "Mostrar instruções" : "Recolher instruções"}
                  aria-pressed={!isInstructionsPanelCollapsed}
                  onClick={() => setIsInstructionsPanelCollapsed((wasCollapsed) => !wasCollapsed)}
                >
                  <BookOpen size={18} />
                </button>
                <span className="file-name">Main.java</span>
              </div>
              <div className="toolbar-actions">
                <button className="secondary-button" onClick={resetCurrentDraftToStarterCode}>
                  <RotateCcw size={16} />
                  Resetar
                </button>
                <button className="primary-button" onClick={runCurrentSolution} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="spinning-icon" /> : <Play size={16} />}
                  {isSubmitting ? "Executando..." : "Executar"}
                </button>
                {isCurrentLessonCompleted && nextLesson && (
                  <button className="primary-button" onClick={() => selectLessonAndCloseSidebar(nextLesson.id)}>
                    Próxima
                    <ArrowRight size={16} />
                  </button>
                )}
                <button
                  className="icon-button"
                  title={isOutputConsoleCollapsed ? "Mostrar console" : "Recolher console"}
                  aria-pressed={!isOutputConsoleCollapsed}
                  onClick={() => setIsOutputConsoleCollapsed((wasCollapsed) => !wasCollapsed)}
                >
                  {isOutputConsoleCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>
            <div className="editor-container">
              <Editor
                language="java"
                theme="vs-dark"
                beforeMount={registerJavaCompletionProvider}
                value={currentSourceCode}
                onChange={updateCurrentDraft}
                options={{ fontSize: 14, automaticLayout: true, wordWrap: "on", scrollbar: { alwaysConsumeMouseWheel: false }, minimap: { enabled: false }, scrollBeyondLastLine: false, tabSize: 4, tabCompletion: "on" }}
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
