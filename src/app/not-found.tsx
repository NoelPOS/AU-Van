import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="text-8xl font-bold text-border">404</div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Page Not Found</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      </div>
      <Button asChild className="rounded-xl">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
