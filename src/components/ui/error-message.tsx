import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
  showIcon?: boolean;
}

export function ErrorMessage({
  message,
  className,
  showIcon = true,
}: ErrorMessageProps) {
  return (
    <div
      className={cn("rounded-md bg-red-50 p-4 text-sm text-red-700", className)}
    >
      <div className="flex items-start">
        {showIcon && (
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
        )}
        <div>{message}</div>
      </div>
    </div>
  );
}
