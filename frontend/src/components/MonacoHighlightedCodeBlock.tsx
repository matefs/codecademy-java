import { useEffect, useState } from "react";
import { loader } from "@monaco-editor/react";

interface MonacoHighlightedCodeBlockProps {
  sourceCode: string;
  languageId: string;
}

export function MonacoHighlightedCodeBlock({ sourceCode, languageId }: MonacoHighlightedCodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    let isStillMounted = true;
    loader
      .init()
      .then((monacoInstance) => {
        monacoInstance.editor.setTheme("vs-dark");
        return monacoInstance.editor.colorize(sourceCode, languageId, { tabSize: 4 });
      })
      .then((colorizedHtml) => {
        if (isStillMounted) setHighlightedHtml(colorizedHtml);
      })
      .catch(() => {
        if (isStillMounted) setHighlightedHtml(null);
      });
    return () => {
      isStillMounted = false;
    };
  }, [sourceCode, languageId]);

  return (
    <pre className="monaco-code-block">
      {highlightedHtml === null ? <code>{sourceCode}</code> : <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />}
    </pre>
  );
}
