import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUpcomingBookings, useMasterStats, type BookingWithServices } from "@/hooks/useMasterDashboard";
import { formatLocalDate } from "@/lib/formatLocalDate";
import { BookingDetailDrawer } from "@/components/BookingDetailDrawer";
import { PageLayout } from "@/components/PageLayout";
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
  const [selectedBooking, setSelectedBooking] = useState<BookingWithServices | null>(null);

  const now = new Date();
  const todayStr = formatLocalDate(now);
  const dateLabel = `${now.getDate()} ${RUSSIAN_MONTHS_GEN[now.getMonth()]}, ${WEEKDAYS[now.getDay()]}`;

  const todayBookings = useMemo(
    () => allBookings.filter((b) => b.date === todayStr),
    [allBookings, todayStr]
  );

  const nextBooking = useMemo(() => {
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return todayBookings.find((b) => b.start_time >= nowTime) ?? null;
  }, [todayBookings, now]);

  const todayIncome = useMemo(
    () => todayBookings.reduce((sum, b) => sum + b.total_price, 0),
    [todayBookings]
  );

  return (
    <PageLayout
      titlePrefix={`${getGreeting()},`}
      title={master?.name || "Мастер"}
      subtitle={dateLabel}
    >
      {/* Summary strip */}
      <div className="mx-5 bg-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3">
          <div className="p-4 text-center border-r border-border/40">
            <CalendarCheck className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="text-foreground font-bold text-lg leading-none">{stats?.todayCount ?? 0}</p>
            <p className="text-muted-foreground text-[10px] mt-1">Записей</p>
          </div>
          <div className="p-4 text-center border-r border-border/40">
            <Clock className="w-4 h-4 text-telegram mx-auto mb-1.5" />
            <p className="text-foreground font-bold text-sm leading-none">
              {nextBooking ? nextBooking.start_time.slice(0, 5) : "—"}
            </p>
            <p className="text-muted-foreground text-[10px] mt-1">Следующая</p>
          </div>
          <div className="p-4 text-center">
            <TrendingUp className="w-4 h-4 text-whatsapp mx-auto mb-1.5" />
            <p className="text-foreground font-bold text-sm leading-none">
              {todayIncome > 0 ? `${todayIncome.toLocaleString("ru-RU")} ₽` : "—"}
            </p>
            <p className="text-muted-foreground text-[10px] mt-1">Сегодня</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 px-5">
        <h2 className="text-heading text-lg font-bold text-foreground mb-3">Расписание</h2>

        {bookingsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Нет записей на сегодня</p>
            <p className="text-muted-foreground text-xs mt-1">Клиенты могут записаться по вашей ссылке</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl overflow-hidden">
            {todayBookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} onClick={() => setSelectedBooking(booking)} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {allBookings.filter((b) => b.date > todayStr).length > 0 && (
        <div className="mt-8 px-5 mb-4">
          <h2 className="text-heading text-lg font-bold text-foreground mb-3">Ближайшие</h2>
          <div className="bg-card rounded-2xl overflow-hidden">
            {allBookings
              .filter((b) => b.date > todayStr)
              .slice(0, 5)
              .map((booking) => (
                <BookingRow key={booking.id} booking={booking} showDate onClick={() => setSelectedBooking(booking)} />
              ))}
          </div>
        </div>
      )}

      <BookingDetailDrawer
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}
      />
    </PageLayout>
  );
}

function BookingRow({
  booking,
  showDate,
  onClick,
}: {
  booking: BookingWithServices;
  showDate?: boolean;
  onClick?: () => void;
}) {
  const servicesList = booking.booking_services?.map((s) => s.name).join(", ") || "Без услуг";
  const d = new Date(booking.date);
  const formattedDate = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}`;

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 border-b border-border/40 last:border-b-0 cursor-pointer active:bg-secondary/50 transition-colors"
      onClick={onClick}
    >
      <div className="w-14 shrink-0 text-center">
        <p className="text-foreground font-bold text-sm">{booking.start_time.slice(0, 5)}</p>
        <p className="text-muted-foreground text-[10px]">{booking.end_time.slice(0, 5)}</p>
      </div>
      <div className="w-px h-8 bg-border/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">{booking.client_name || "Клиент"}</p>
        <p className="text-muted-foreground text-xs truncate">{servicesList}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-foreground font-semibold text-sm">{booking.total_price.toLocaleString("ru-RU")} ₽</p>
        {showDate && <p className="text-muted-foreground text-xs">{formattedDate}</p>}
      </div>
    </div>
  );
}
