import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Scissors, User } from "lucide-react";

const RoleSelect = () => {
  const { setRole } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (role: "master" | "client") => {
    setRole(role);
    navigate(role === "master" ? "/dashboard/master" : "/dashboard/client");
  };

  return (
    <div className="app-container bg-background flex flex-col min-h-screen justify-center px-6">
      <div className="text-center mb-10">
        <h1 className="text-heading text-4xl font-bold text-foreground">Добро пожаловать!</h1>
        <p className="text-muted-foreground mt-3 text-sm">Выберите, как вы хотите использовать приложение</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleSelect("master")}
          className="w-full card-elevated p-6 flex items-center gap-4 text-left hover:bg-accent/30 transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Scissors className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-heading text-xl font-semibold text-foreground">Я мастер</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Управляйте записями, услугами и расписанием
            </p>
          </div>
        </button>

        <button
          onClick={() => handleSelect("client")}
          className="w-full card-elevated p-6 flex items-center gap-4 text-left hover:bg-accent/30 transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-heading text-xl font-semibold text-foreground">Я клиент</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Находите мастеров и записывайтесь онлайн
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default RoleSelect;
