import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

interface AdviceButtonProps {
  unitId: string;
  role?: "expert" | "mentor";
}

export function AdviceButton({ unitId, role = "expert" }: AdviceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchAdvice = async () => {
    setIsLoading(true);
    setAdvice("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ unitId, role }),
      });

      if (!response.ok) {
        throw new Error("アドバイスの取得に失敗しました");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("ストリームの読み取りに失敗しました");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // 最後の行は完全でない可能性があるため、バッファに残す
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));

              if (
                data.event === "content" &&
                data.data.choices?.[0]?.delta?.content
              ) {
                setAdvice((prev) => prev + data.data.choices[0].delta.content);
              } else if (data.event === "done") {
                // 完了イベントを受信したら生成中フラグをオフにする
                setIsGenerating(false);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      // バッファに残ったデータを処理
      if (buffer && buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.substring(6));
          if (
            data.event === "content" &&
            data.data.choices?.[0]?.delta?.content
          ) {
            setAdvice((prev) => prev + data.data.choices[0].delta.content);
          }
        } catch (e) {
          console.error("Error parsing remaining SSE data:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching advice:", error);
      toast.error("アドバイスの取得に失敗しました");
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={fetchAdvice} disabled={isLoading} className="w-full">
        {isLoading ? "アドバイスを取得中..." : "アドバイスを取得"}
      </Button>

      {isGenerating && (
        <div className="text-center text-sm text-muted-foreground">
          アドバイスを生成中...
        </div>
      )}

      {advice && (
        <Card>
          <CardHeader>
            <CardTitle>学習アドバイス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{advice}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
