import { useLocation, useNavigate } from "react-router-dom";
import { Sun, CalendarDays, Menu } from "lucide-react";

const tabs = [
  { path: "/today", label: "Сегодня", icon: Sun },
  { path: "/calendar", label: "Календарь", icon: CalendarDays },
  { path: "/more", label: "Ещё", icon: Menu },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/more"
              ? ["/more", "/clients", "/settings"].some((p) =>
                  location.pathname.startsWith(p)
                )
              : location.pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
