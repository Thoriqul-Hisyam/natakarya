"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
// Import Quill styles
import "react-quill-new/dist/quill.snow.css";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
}

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export const Editor = ({
  onChange,
  value,
  placeholder,
  readOnly,
}: EditorProps) => {

  return (
    <div className="bg-white dark:bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-md border border-[var(--color-border)] overflow-hidden">
      <ReactQuill
        // @ts-ignore
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Write something..."}
        readOnly={readOnly}
        className="h-full min-h-[120px]"
        modules={{
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "code-block"],
            ["clean"] // remove formatting button
          ],
        }}
      />
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid var(--color-border);
          background-color: var(--color-background);
        }
        .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 14px;
        }
        .ql-editor.ql-blank::before {
          color: var(--color-muted-foreground);
          font-style: normal;
        }
        /* Dark mode overrides for toolbar icons */
        html.dark .ql-stroke {
          stroke: var(--color-foreground) !important;
        }
        html.dark .ql-fill {
          fill: var(--color-foreground) !important;
        }
        html.dark .ql-picker {
          color: var(--color-foreground) !important;
        }
      `}</style>
    </div>
  );
};
