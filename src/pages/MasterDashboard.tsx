import { useNavigate } from "react-router-dom";
import { Calendar, Users, TrendingUp, ClipboardList, Star, Settings, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMasterData } from "@/hooks/useMasterData";
import { useUpcomingBookings, useMasterStats } from "@/hooks/useMasterDashboard";
import { ShiftManager } from "@/components/master/ShiftManager";
import { CrmTable } from "@/components/master/CrmTable";
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from "@/components/ui/drawer";

const MasterDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Пока берем первого мастера из БД (ID '1' -> превратится в реальный UUID)
  const { masterQuery } = useMasterData('1');
  const master = masterQuery.data;

  const { data: bookings = [], isLoading: bookingsLoading } = useUpcomingBookings(master?.id);
  const { data: stats, isLoading: statsLoading } = useMasterStats(master?.id);

  const displayStats = [
    { label: "Записи сегодня", value: stats?.todayCount ?? 0, icon: Calendar, color: "bg-primary/10 text-primary" },
    { label: "Доход за неделю", value: `${(stats?.weekIncome ?? 0).toLocaleString("ru-RU")} ₽`, icon: TrendingUp, color: "bg-whatsapp/10 text-whatsapp" },
    { label: "Всего клиентов", value: stats?.totalClients ?? 0, icon: Users, color: "bg-telegram/10 text-telegram" },
  ];

  if (masterQuery.isLoading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="app-container bg-background min-h-screen pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Добрый день,</p>
          <h1 className="text-heading text-2xl font-bold text-foreground">{master?.name || "Мастер"}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/dashboard/master/settings")}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
          >
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
        {displayStats.map((stat) => (
          <div key={stat.label} className="card-premium p-3 text-center">
            <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className="w-4 h-4" />
            </div>
            {statsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
            ) : (
              <p className="text-foreground font-bold text-lg">{stat.value}</p>
            )}
            <p className="text-muted-foreground text-[10px] mt-0.5 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="px-5 mt-6">
        <h2 className="text-heading text-lg font-bold text-foreground mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-3 gap-3">
          <ShiftManager masterId={master?.id}>
            <button className="card-premium p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform text-left">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-foreground text-xs font-medium">Смены</span>
            </button>
          </ShiftManager>

          <Drawer>
            <DrawerTrigger asChild>
              <button className="card-premium p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform text-left">
                <Users className="w-5 h-5 text-telegram" />
                <span className="text-foreground text-xs font-medium">Клиенты</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] px-5 pb-8">
              <DrawerTitle className="text-heading text-xl font-bold mb-4 mt-2">База клиентов (CRM)</DrawerTitle>
              <CrmTable masterId={master?.id} />
            </DrawerContent>
          </Drawer>

          {[
            { label: "Профиль", icon: Star, onClick: () => navigate(`/master/${master?.slug || master?.id || '1'}`) },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
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
        <h2 className="text-heading text-lg font-bold text-foreground mb-3">Предстоящие записи</h2>
        <div className="space-y-3">
          {bookingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              Нет предстоящих записей
            </p>
          ) : (
            bookings.map((booking) => {
              const servicesList = booking.booking_services?.map(s => s.name).join(', ') || 'Без названий';
              // Форматирование даты
              const d = new Date(booking.date);
              const formattedDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;

              return (
                <div key={booking.id} className="card-premium p-4 flex items-center gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">{booking.client_name?.charAt(0) || '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{booking.client_name || 'Клиент'}</p>
                    <p className="text-muted-foreground text-xs truncate max-w-[180px]">{servicesList}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-foreground font-semibold text-sm">{booking.start_time.slice(0, 5)}</p>
                    <p className="text-muted-foreground text-xs">{formattedDate}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div >
  );
};

export default MasterDashboard;
