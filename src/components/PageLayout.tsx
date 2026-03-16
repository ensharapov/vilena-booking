import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageLayoutProps {
  children: React.ReactNode;
  /** Основной заголовок страницы */
  title?: React.ReactNode;
  /** Мелкий текст под заголовком */
  subtitle?: React.ReactNode;
  /** Текст над заголовком (например, приветствие на Today) */
  titlePrefix?: React.ReactNode;
  /** Правая часть шапки (например, кнопки ← → в Calendar) */
  headerRight?: React.ReactNode;
  /**
   * "page"    — обычная страница, шапка не sticky (default)
   * "subpage" — страница с кнопкой «назад», sticky-шапка с blur
   */
  variant?: "page" | "subpage";
  className?: string;
}

export function PageLayout({
  children,
  title,
  subtitle,
  titlePrefix,
  headerRight,
  variant = "page",
  className,
}: PageLayoutProps) {
  const navigate = useNavigate();
  const isSubpage = variant === "subpage";
  const hasHeader = title || subtitle || titlePrefix || headerRight || isSubpage;

  return (
    <div className={`app-container bg-background min-h-screen pb-28 ${className ?? ""}`}>
      {hasHeader && (
        <header
          className={
            isSubpage
              ? "sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50 px-5 py-4 flex items-center gap-3"
              : "px-5 pt-6 pb-4 flex items-start justify-between"
          }
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isSubpage && (
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-secondary shrink-0"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              {titlePrefix && (
                <p className="text-muted-foreground text-sm">{titlePrefix}</p>
              )}
              {title && (
                <h1
                  className={`text-heading font-bold text-foreground ${
                    isSubpage ? "text-lg" : "text-2xl"
                  }`}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {headerRight && (
            <div className="shrink-0 ml-2 flex items-center">{headerRight}</div>
          )}
        </header>
      )}

      {children}
    </div>
  );
}
