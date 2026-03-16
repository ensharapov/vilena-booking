import { BottomNav } from "./BottomNav";

// pb-28 живёт в PageLayout каждой страницы — здесь не нужен
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
