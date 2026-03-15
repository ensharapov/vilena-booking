import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpcomingBookings, useMasterStats, type BookingWithServices } from "@/hooks/useMasterDashboard";
import { Loader2, Clock, CalendarCheck, TrendingUp } from "lucide-react";

const RUSSIAN_MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

export default function Today() {
  const { master } = useAuth();
  const { data: allBookings = [], isLoading: bookingsLoading } = useUpcomingBookings(master?.id);
  const { data: stats } = useMasterStats(master?.id);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const dateLabel = `${now.getDate()} ${RUSSIAN_MONTHS_GEN[now.getMonth()]}, ${WEEKDAYS[now.getDay()]}`;

  // Записи на сегодня
  const todayBookings = useMemo(
    () => allBookings.filter((b) => b.date === todayStr),
    [allBookings, todayStr]
  );

  // Следующая запись
  const nextBooking = useMemo(() => {
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return todayBookings.find((b) => b.start_time >= nowTime) ?? null;
  }, [todayBookings, now]);

  const todayIncome = useMemo(
    () => todayBookings.reduce((sum, b) => sum + b.total_price, 0),
    [todayBookings]
  );

  return (
    <div className="app-container bg-background min-h-screen">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-muted-foreground text-sm">{getGreeting()},</p>
        <h1 className="text-heading text-2xl font-bold text-foreground">{master?.name || "Мастер"}</h1>
        <p className="text-muted-foreground text-xs mt-1 capitalize">{dateLabel}</p>
      </div>

      {/* Summary strip */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-3">
        <div className="card-premium p-3 text-center">
          <CalendarCheck className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-foreground font-bold text-lg">{stats?.todayCount ?? 0}</p>
          <p className="text-muted-foreground text-[10px]">Записей</p>
        </div>
        <div className="card-premium p-3 text-center">
          <Clock className="w-4 h-4 text-telegram mx-auto mb-1" />
          <p className="text-foreground font-bold text-sm">
            {nextBooking ? nextBooking.start_time.slice(0, 5) : "—"}
          </p>
          <p className="text-muted-foreground text-[10px]">Следующая</p>
        </div>
        <div className="card-premium p-3 text-center">
          <TrendingUp className="w-4 h-4 text-whatsapp mx-auto mb-1" />
          <p className="text-foreground font-bold text-sm">
            {todayIncome > 0 ? `${todayIncome.toLocaleString("ru-RU")} ₽` : "—"}
          </p>
          <p className="text-muted-foreground text-[10px]">Сегодня</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 mt-6">
        <h2 className="text-heading text-lg font-bold text-foreground mb-3">Расписание</h2>

        {bookingsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Нет записей на сегодня</p>
            <p className="text-muted-foreground text-xs mt-1">
              Клиенты могут записаться по вашей ссылке
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming (other days) */}
      {allBookings.filter((b) => b.date > todayStr).length > 0 && (
        <div className="px-5 mt-8 mb-4">
          <h2 className="text-heading text-lg font-bold text-foreground mb-3">Ближайшие</h2>
          <div className="space-y-3">
            {allBookings
              .filter((b) => b.date > todayStr)
              .slice(0, 5)
              .map((booking) => (
                <BookingCard key={booking.id} booking={booking} showDate />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking, showDate }: { booking: BookingWithServices; showDate?: boolean }) {
  const servicesList = booking.booking_services?.map((s) => s.name).join(", ") || "Без услуг";

  const d = new Date(booking.date);
  const formattedDate = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;

  return (
    <div className="card-premium p-4 flex items-center gap-3 animate-fade-in">
      {/* Time block */}
      <div className="w-14 text-center shrink-0">
        <p className="text-foreground font-bold text-sm">{booking.start_time.slice(0, 5)}</p>
        <p className="text-muted-foreground text-[10px]">{booking.end_time.slice(0, 5)}</p>
      </div>

      <div className="w-px h-10 bg-border shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">
          {booking.client_name || "Клиент"}
        </p>
        <p className="text-muted-foreground text-xs truncate">{servicesList}</p>
      </div>

      {/* Price / Date */}
      <div className="text-right shrink-0">
        <p className="text-foreground font-semibold text-sm">
          {booking.total_price.toLocaleString("ru-RU")} ₽
        </p>
        {showDate && <p className="text-muted-foreground text-xs">{formattedDate}</p>}
      </div>
    </div>
  );
}
