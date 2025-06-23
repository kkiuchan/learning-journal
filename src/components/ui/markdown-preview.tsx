"use client";

import { cn } from "@/lib/utils";
import "github-markdown-css/github-markdown-dark.css";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./mermaid-diagram";

interface MarkdownPreviewProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MarkdownPreview({
  children,
  className,
  style = { backgroundColor: "transparent" },
}: MarkdownPreviewProps) {
  return (
    <div className={cn("markdown-body", className)} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            if (!props.inline && match) {
              // Mermaid図の処理
              if (language === "mermaid") {
                return (
                  <MermaidDiagram
                    chart={String(children).replace(/\n$/, "")}
                    id={`mermaid-${Math.random().toString(36).substr(2, 9)}`}
                  />
                );
              }

              // 通常のシンタックスハイライト
              return (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
