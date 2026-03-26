import { LiffBottomNav } from "@/components/layout/liff-bottom-nav";
import { LiffAuthGate } from "@/components/liff/liff-auth-gate";

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#edf1fa]">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#f7f8fc] shadow-[0_0_0_1px_rgba(117,135,214,0.12)]">
        <main className="pb-20">
          <LiffAuthGate>{children}</LiffAuthGate>
        </main>
      </div>
      <LiffBottomNav />
    </div>
  );
}
