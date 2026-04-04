"use client";

export default function LoadingScreen({ message = "กำลังโหลดข้อมูล..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-[var(--bg-subtle)]" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[var(--brand-red)] animate-spin" />
      </div>
      <p className="text-[13px] text-[var(--text-secondary)] animate-pulse">{message}</p>
    </div>
  );
}
