import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  text?: string;
  fullPage?: boolean;
}

export function Loading({
  className,
  size = "default",
  text,
  fullPage = false,
}: LoadingProps) {
  const sizeMap = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const Container = fullPage ? "div" : "div";
  const containerClass = fullPage
    ? "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    : "flex items-center justify-center p-4";

  return (
    <Container className={cn(containerClass, className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    </Container>
  );
}

export function LoadingPage() {
  return <Loading fullPage size="lg" text="読み込み中..." className="z-50" />;
}

export function LoadingSpinner({
  className,
  size = "default",
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const sizeMap = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeMap[size], className)}
    />
  );
}
