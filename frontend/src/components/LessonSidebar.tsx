import { CircleCheck, Coffee, X } from "lucide-react";
import type { LessonSummary } from "../api/lessonsApi";

interface LessonSidebarProps {
  lessonSummaries: LessonSummary[];
  selectedLessonId: string | null;
  completedLessonIds: string[];
  isOpenOnSmallScreens: boolean;
  onSelectLesson: (lessonId: string) => void;
  onCloseSidebar: () => void;
}

export function LessonSidebar({ lessonSummaries, selectedLessonId, completedLessonIds, isOpenOnSmallScreens, onSelectLesson, onCloseSidebar }: LessonSidebarProps) {
  const completedCount = lessonSummaries.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const progressPercentage = lessonSummaries.length === 0 ? 0 : Math.round((completedCount / lessonSummaries.length) * 100);

  return (
    <aside className={`lesson-sidebar ${isOpenOnSmallScreens ? "is-open" : ""}`}>
      <div className="sidebar-header">
        <h1 className="brand">
          <Coffee size={20} />
          Java Academy
        </h1>
        <button className="icon-button sidebar-close-button" aria-label="Fechar lista de lições" onClick={onCloseSidebar}>
          <X size={18} />
        </button>
      </div>
      <div className="progress-bar" aria-label={`Progresso ${progressPercentage}%`}>
        <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
      </div>
      <p className="progress-label">
        {completedCount}/{lessonSummaries.length} lições concluídas
      </p>
      <ol className="lesson-list">
        {lessonSummaries.map((lesson) => (
          <li key={lesson.id}>
            <button
              className={`lesson-list-item ${lesson.id === selectedLessonId ? "is-selected" : ""}`}
              onClick={() => onSelectLesson(lesson.id)}
            >
              <span className="lesson-status-icon">{completedLessonIds.includes(lesson.id) ? <CircleCheck size={18} className="lesson-completed-icon" /> : lesson.order}</span>
              {lesson.title}
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
