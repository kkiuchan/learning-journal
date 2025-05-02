"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock } from "lucide-react";
import Link from "next/link";

interface LogData {
  title: string;
  date: string;
  duration: number | null;
  content: string | null;
  unitId: number;
  unitTitle: string;
}

interface RecentLogsProps {
  data: LogData[];
}

function truncateText(text: string | null, maxLength: number = 100): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function RecentLogs({ data }: RecentLogsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>最近の学習ログ</CardTitle>
        <Button variant="ghost" size="icon">
          <Icons.pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((log) => (
            <Link
              key={log.title}
              href={`/units/${log.unitId}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{log.title}</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {((log.duration || 0) / 60).toFixed(1)}時間
                  </div>
                </div>
                {log.content && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm text-muted-foreground cursor-default">
                          {truncateText(log.content)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px] whitespace-pre-wrap">
                        <p>{log.content}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <div className="text-xs text-muted-foreground">
                  {new Date(log.date).toLocaleDateString()} • {log.unitTitle}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
