import { useNavigate } from "react-router-dom";
import { mockMaster } from "@/data/mock";
import { ArrowRight, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container bg-background min-h-screen flex flex-col">
      {/* Hero */}
      <div className="relative flex-1 flex flex-col justify-center px-6 py-12">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ background: "hsl(var(--primary))" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-primary text-sm font-medium">Красота рядом</span>
          </div>
          <h1 className="text-heading text-5xl font-bold text-foreground leading-tight">
            Вилена
          </h1>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed max-w-xs">
            Онлайн-запись к лучшим мастерам красоты вашего города
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate("/master/1")}
              className="w-full btn-gradient h-14 text-sm flex items-center justify-center gap-2"
            >
              Смотреть мастера
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="w-full h-14 rounded-xl border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center active:scale-[0.98] transition-transform"
            >
              Войти в аккаунт
            </button>
          </div>
        </div>

        {/* Preview card */}
        <div className="mt-10 card-elevated p-4 flex items-center gap-4 animate-fade-in">
          <img
            src={mockMaster.avatar}
            alt={mockMaster.name}
            className="w-14 h-14 rounded-2xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{mockMaster.name}</p>
            <p className="text-muted-foreground text-xs truncate">{mockMaster.specialty}</p>
            <p className="text-primary text-xs font-medium mt-0.5">★ {mockMaster.rating} · {mockMaster.reviewCount} отзывов</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default Index;
