"use client";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" }[size];

  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`${sizeClass} animate-spin rounded-full border-2 border-primary/20 border-t-primary`}
      />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-xs text-muted-foreground">Loading...</p>
    </div>
  );
}
