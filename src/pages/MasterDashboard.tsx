import { useNavigate } from "react-router-dom";
import { mockBookings, mockMaster } from "@/data/mock";
import { Calendar, Users, TrendingUp, ClipboardList, Star, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const stats = [
  { label: "Записи сегодня", value: "3", icon: Calendar, color: "bg-primary/10 text-primary" },
  { label: "Доход за неделю", value: "32 500 ₽", icon: TrendingUp, color: "bg-whatsapp/10 text-whatsapp" },
  { label: "Всего клиентов", value: "127", icon: Users, color: "bg-telegram/10 text-telegram" },
];

const MasterDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-container bg-background min-h-screen pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Добрый день,</p>
          <h1 className="text-heading text-2xl font-bold text-foreground">{mockMaster.name}</h1>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => { logout(); navigate("/auth"); }}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card-premium p-3 text-center">
            <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-foreground font-bold text-lg">{stat.value}</p>
            <p className="text-muted-foreground text-[10px] mt-0.5 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="px-5 mt-6">
        <h2 className="text-heading text-lg font-bold text-foreground mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Расписание", icon: Calendar },
            { label: "Услуги", icon: ClipboardList },
            { label: "Отзывы", icon: Star },
          ].map((action) => (
            <button
              key={action.label}
              className="card-premium p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <action.icon className="w-5 h-5 text-primary" />
              <span className="text-foreground text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="px-5 mt-6">
        <h2 className="text-heading text-lg font-bold text-foreground mb-3">Ближайшие записи</h2>
        <div className="space-y-3">
          {mockBookings.map((booking) => (
            <div key={booking.id} className="card-premium p-4 flex items-center gap-3 animate-fade-in">
              <img src={booking.clientAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{booking.clientName}</p>
                <p className="text-muted-foreground text-xs truncate">{booking.serviceName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-foreground font-semibold text-sm">{booking.time}</p>
                <p className="text-muted-foreground text-xs">{booking.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MasterDashboard;
