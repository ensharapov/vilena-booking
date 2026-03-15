import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Users, Settings, Link as LinkIcon, LogOut, Calendar, Scissors } from "lucide-react";
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
    <div className="app-container bg-background min-h-screen">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-heading text-2xl font-bold text-foreground">
          {master?.name || "Мастер"}
        </h1>
        {master?.specialty && (
          <p className="text-muted-foreground text-sm mt-1">{master.specialty}</p>
        )}
      </div>

      <div className="px-5 space-y-2">
        <button
          onClick={() => navigate("/services")}
          className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <span className="font-medium text-foreground text-sm">Мои услуги</span>
        </button>

        <ShiftManager masterId={master?.id}>
          <button className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-foreground text-sm">Управление сменами</span>
          </button>
        </ShiftManager>

        <button
          onClick={() => navigate("/clients")}
          className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-telegram/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-telegram" />
          </div>
          <span className="font-medium text-foreground text-sm">Клиенты</span>
        </button>

        <button
          onClick={() => navigate("/settings")}
          className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground text-sm">Настройки</span>
        </button>

        <button
          onClick={copyBookingLink}
          className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-whatsapp/10 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-whatsapp" />
          </div>
          <div>
            <span className="font-medium text-foreground text-sm block">Ссылка для записи</span>
            <span className="text-muted-foreground text-xs">
              {master?.slug ? `${window.location.host}/${master.slug}` : "Настройте slug в настройках"}
            </span>
          </div>
        </button>

        <button
          onClick={handleSignOut}
          className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform mt-4"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="font-medium text-destructive text-sm">Выйти</span>
        </button>
      </div>
    </div>
  );
}
