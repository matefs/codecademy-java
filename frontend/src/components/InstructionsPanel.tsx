import Markdown from "react-markdown";
import type { LessonDetail } from "../api/lessonsApi";

interface InstructionsPanelProps {
  lessonDetail: LessonDetail;
  revealedHintCount: number;
  onRevealNextHint: () => void;
}

export function InstructionsPanel({ lessonDetail, revealedHintCount, onRevealNextHint }: InstructionsPanelProps) {
  const hasMoreHints = revealedHintCount < lessonDetail.hints.length;

  return (
    <section className="instructions-panel">
      <Markdown>{lessonDetail.instructionsMarkdown}</Markdown>
      <div className="hints">
        {lessonDetail.hints.slice(0, revealedHintCount).map((hintText, hintIndex) => (
          <p key={hintIndex} className="hint">
            💡 {hintText}
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
