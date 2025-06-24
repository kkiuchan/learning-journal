import { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            {title}
          </h2>
        </div>
        <div className="mt-8 bg-card py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-border">
          {children}
          {footer && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    または
                  </span>
                </div>
              </div>
              <div className="mt-6">{footer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
