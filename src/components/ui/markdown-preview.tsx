"use client";

import { cn } from "@/lib/utils";
import "github-markdown-css/github-markdown-dark.css";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";

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
            return !props.inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
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
