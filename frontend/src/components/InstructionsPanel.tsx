import { isValidElement, type ReactElement, type ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import Markdown, { type Components } from "react-markdown";
import type { LessonDetail } from "../api/lessonsApi";
import { MonacoHighlightedCodeBlock } from "./MonacoHighlightedCodeBlock";

const markdownComponentsWithMonacoCodeBlocks: Components = {
  pre({ children }) {
    if (!isValidElement(children)) return <pre>{children}</pre>;
    const codeElement = children as ReactElement<{ className?: string; children?: ReactNode }>;
    const languageMatch = /language-([\w-]+)/.exec(codeElement.props.className ?? "");
    const sourceCode = String(codeElement.props.children ?? "").replace(/\n$/, "");
    return <MonacoHighlightedCodeBlock sourceCode={sourceCode} languageId={languageMatch?.[1] ?? "java"} />;
  },
};

interface InstructionsPanelProps {
  lessonDetail: LessonDetail;
  revealedHintCount: number;
  onRevealNextHint: () => void;
}

export function InstructionsPanel({ lessonDetail, revealedHintCount, onRevealNextHint }: InstructionsPanelProps) {
  const hasMoreHints = revealedHintCount < lessonDetail.hints.length;

  return (
    <section className="instructions-panel">
      <Markdown components={markdownComponentsWithMonacoCodeBlocks}>{lessonDetail.instructionsMarkdown}</Markdown>
      <div className="hints">
        {lessonDetail.hints.slice(0, revealedHintCount).map((hintText, hintIndex) => (
          <p key={hintIndex} className="hint">
            <Lightbulb size={16} className="hint-icon" />
            <span>{hintText}</span>
          </p>
        ))}
        {hasMoreHints && (
          <button className="secondary-button" onClick={onRevealNextHint}>
            Mostrar dica ({revealedHintCount + 1}/{lessonDetail.hints.length})
          </button>
        )}
      </div>
    </section>
  );
}
