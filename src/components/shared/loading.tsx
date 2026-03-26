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

export function LiffPageLoading({
  title = "Preparing your trip",
  subtitle = "Loading the latest routes and seats...",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-[58vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-4">
        <div className="h-14 w-14 rounded-full border-2 border-[#cfd7fb] border-t-[#4f62d3] animate-spin" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#e9edff] to-[#d9e2ff]" />
      </div>
      <p className="text-sm font-semibold text-[#22339a]">{title}</p>
      <p className="mt-1 text-xs text-[#6f7cb6]">{subtitle}</p>
    </div>
  );
}
