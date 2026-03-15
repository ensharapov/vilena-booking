import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-16">{children}</div>
      <BottomNav />
    </>
  );
}
