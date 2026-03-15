import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-24">{children}</div>
      <BottomNav />
    </>
  );
}
