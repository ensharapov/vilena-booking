import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Users, Settings, Link as LinkIcon, LogOut, Calendar, Scissors, ChevronRight } from "lucide-react";
import { ShiftManager } from "@/components/master/ShiftManager";

export default function More() {
  const { master, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const copyBookingLink = () => {
    const slug = master?.slug || master?.id;
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована", description: url });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="app-container bg-background min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-6">
        <h1 className="text-heading text-2xl font-bold text-foreground">
          {master?.name || "Мастер"}
        </h1>
        {master?.specialty && (
          <p className="text-muted-foreground text-sm mt-1">{master.specialty}</p>
        )}
      </div>

      {/* Основное меню — iOS-стиль, один блок с разделителями */}
      <div className="mx-5 bg-card rounded-2xl overflow-hidden">
        <button
          onClick={() => navigate("/services")}
          className="w-full flex items-center gap-4 px-5 py-4 border-b border-border/40 active:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <span className="font-medium text-foreground text-sm flex-1 text-left">Мои услуги</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        <ShiftManager masterId={master?.id}>
          <button className="w-full flex items-center gap-4 px-5 py-4 border-b border-border/40 active:bg-secondary/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-foreground text-sm flex-1 text-left">Управление сменами</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </ShiftManager>

        <button
          onClick={() => navigate("/clients")}
          className="w-full flex items-center gap-4 px-5 py-4 border-b border-border/40 active:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-telegram/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-telegram" />
          </div>
          <span className="font-medium text-foreground text-sm flex-1 text-left">Клиенты</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-4 px-5 py-4 border-b border-border/40 active:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground text-sm flex-1 text-left">Настройки</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        <button
          onClick={copyBookingLink}
          className="w-full flex items-center gap-4 px-5 py-4 active:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-whatsapp/10 flex items-center justify-center shrink-0">
            <LinkIcon className="w-5 h-5 text-whatsapp" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="font-medium text-foreground text-sm block">Ссылка для записи</span>
            <span className="text-muted-foreground text-xs truncate block">
              {master?.slug ? `${window.location.host}/${master.slug}` : "Настройте slug в настройках"}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* Выход — отдельный блок */}
      <div className="mx-5 mt-4 bg-card rounded-2xl overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-5 py-4 active:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="font-medium text-destructive text-sm flex-1 text-left">Выйти</span>
          <ChevronRight className="w-4 h-4 text-destructive/40 shrink-0" />
        </button>
      </div>
    </div>
  );
}
