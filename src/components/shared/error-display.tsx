"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorDisplay({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div className="text-center">
        <p className="font-medium text-foreground">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="rounded-xl">
          Try Again
        </Button>
      )}
    </div>
  );
}
