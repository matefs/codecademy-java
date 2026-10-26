import { PartyPopper } from "lucide-react";
import type { ExecutionStatus, SubmissionResponse } from "../api/lessonsApi";

interface OutputConsoleProps {
  submissionResponse: SubmissionResponse | null;
  isSubmitting: boolean;
  requestErrorMessage: string | null;
}

const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
  SUCCESS: "Executado",
  COMPILATION_ERROR: "Erro de compilação",
  RUNTIME_ERROR: "Erro em tempo de execução",
  TIMEOUT: "Tempo esgotado (loop infinito?)",
  OUTPUT_LIMIT_EXCEEDED: "Saída grande demais",
  SERVER_BUSY: "Servidor ocupado",
};

export function OutputConsole({ submissionResponse, isSubmitting, requestErrorMessage }: OutputConsoleProps) {
  if (isSubmitting) {
    return <section className="output-console">Compilando e executando...</section>;
  }
  if (requestErrorMessage) {
    return <section className="output-console console-error">{requestErrorMessage}</section>;
  }
  if (!submissionResponse) {
    return <section className="output-console console-muted">Clique em "Executar" para rodar seu código.</section>;
  }

  const { execution, validation } = submissionResponse;
  const consoleText = [execution.compilationErrors, execution.standardOutput, execution.standardError]
    .filter((outputSection) => outputSection.length > 0)
    .join("\n");

  return (
    <section className="output-console">
      <div className="console-status-line">
        {EXECUTION_STATUS_LABELS[execution.status]} · {execution.durationMillis} ms
      </div>
      <pre className="console-output">{consoleText || "(sem saída)"}</pre>
      <div className={`validation-banner ${validation.passed ? "is-passed" : "is-failed"}`}>
        {validation.passed ? (
          <span className="validation-passed-message">
            <PartyPopper size={18} />
            Correto! Lição concluída.
          </span>
        ) : (
          <ul>
            {validation.feedbackMessages.map((feedbackMessage) => (
              <li key={feedbackMessage}>{feedbackMessage}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
