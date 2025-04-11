import { cn } from "@/lib/utils";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export function ErrorMessage({
  message,
  className,
  ...props
}: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-x-2 rounded-md bg-destructive/15 p-3",
        className
      )}
      {...props}
    >
      <ExclamationTriangleIcon className="h-4 w-4 text-destructive" />
      <p className="text-sm font-medium text-destructive">{message}</p>
    </div>
  );
}
