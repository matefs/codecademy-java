import type { LessonSummary } from "../api/lessonsApi";

interface LessonSidebarProps {
  lessonSummaries: LessonSummary[];
  selectedLessonId: string | null;
  completedLessonIds: string[];
  onSelectLesson: (lessonId: string) => void;
}

export function LessonSidebar({ lessonSummaries, selectedLessonId, completedLessonIds, onSelectLesson }: LessonSidebarProps) {
  const completedCount = lessonSummaries.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
  const progressPercentage = lessonSummaries.length === 0 ? 0 : Math.round((completedCount / lessonSummaries.length) * 100);

  return (
    <aside className="lesson-sidebar">
      <h1 className="brand">☕ Java Academy</h1>
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
              <span className="lesson-status-icon">{completedLessonIds.includes(lesson.id) ? "✅" : lesson.order}</span>
              {lesson.title}
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
