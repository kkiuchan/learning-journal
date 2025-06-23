"use client";

import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  id?: string;
  className?: string;
}

// HTMLエンティティをデコードする関数
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

// Mermaid構文を前処理する関数
function preprocessMermaidChart(chart: string): string {
  // HTMLエンティティをデコード
  let processedChart = decodeHtmlEntities(chart);

  // 改行を正規化
  processedChart = processedChart.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 前後の空白を除去
  processedChart = processedChart.trim();

  return processedChart;
}

export function MermaidDiagram({
  chart,
  id = "mermaid-diagram",
  className = "",
}: MermaidDiagramProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!elementRef.current || !chart.trim()) return;

      try {
        setIsLoading(true);
        setError(null);

        // チャートを前処理
        const processedChart = preprocessMermaidChart(chart);

        // 空のチャートをチェック
        if (!processedChart) {
          throw new Error("Empty chart content");
        }

        // Mermaidの初期化（GitHubスタイル）
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          fontFamily:
            '-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif',
          fontSize: 14,
          themeVariables: {
            // GitHubライクなカラーパレット
            primaryColor: "#0969da",
            primaryTextColor: "#24292f",
            primaryBorderColor: "#d1d9e0",
            lineColor: "#656d76",
            secondaryColor: "#f6f8fa",
            tertiaryColor: "#ffffff",
            background: "#ffffff",
            mainBkg: "#f6f8fa",
            secondBkg: "#ffffff",
            tertiaryBkg: "#f6f8fa",
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
            padding: 15,
          },
          sequence: {
            useMaxWidth: true,
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
          },
          gantt: {
            useMaxWidth: true,
            leftPadding: 75,
            rightPadding: 20,
            gridLineStartPadding: 35,
            fontSize: 11,
            sectionFontSize: 24,
            numberSectionStyles: 4,
          },
          pie: {
            useMaxWidth: true,
          },
          journey: {
            useMaxWidth: true,
          },
          timeline: {
            useMaxWidth: true,
          },
          class: {
            useMaxWidth: true,
          },
          state: {
            useMaxWidth: true,
          },
          er: {
            useMaxWidth: true,
          },
        });

        // ユニークなIDを生成
        const diagramId = `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        console.log("Rendering Mermaid chart:", processedChart);

        // 図の描画
        const { svg } = await mermaid.render(diagramId, processedChart);

        if (isMounted && elementRef.current) {
          elementRef.current.innerHTML = svg;
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        if (isMounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to render diagram";
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className={`github-mermaid-error ${className}`}>
        <div className="github-error-header">
          <svg
            className="octicon octicon-alert"
            viewBox="0 0 16 16"
            width="16"
            height="16"
          >
            <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
          </svg>
          図の描画エラー
        </div>
        <div className="github-error-message">{error}</div>
        <details className="github-error-details">
          <summary>元のコード</summary>
          <pre className="github-error-code">{chart}</pre>
        </details>
        <details className="github-error-details">
          <summary>処理後のコード</summary>
          <pre className="github-error-code">
            {preprocessMermaidChart(chart)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className={`github-mermaid-container ${className}`}>
      {isLoading && (
        <div className="github-mermaid-loading">
          <svg
            className="github-loading-spinner"
            viewBox="0 0 16 16"
            width="16"
            height="16"
          >
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray="11"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                dur="1s"
                type="rotate"
                values="0 8 8;360 8 8"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
          <span>図を描画中...</span>
        </div>
      )}
      <div
        ref={elementRef}
        className="github-mermaid-content"
        style={{
          display: isLoading ? "none" : "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      />
    </div>
  );
}
