import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useWorkingDates } from "@/hooks/useMasterData";
import type { BookingWithServices } from "@/hooks/useMasterDashboard";
import { BookingDetailDrawer } from "@/components/BookingDetailDrawer";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const RUSSIAN_MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const RUSSIAN_MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const RUSSIAN_WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function useMonthBookings(masterId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ["month_bookings", masterId, year, month],
    queryFn: async (): Promise<BookingWithServices[]> => {
      if (!masterId) return [];

      const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

      const { data, error } = await supabase
        .from("bookings")
        .select("*, booking_services (*)")
        .eq("master_id", masterId)
        .gte("date", firstDay)
        .lte("date", lastDay)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as BookingWithServices[];
    },
    enabled: !!masterId,
  });
}

export default function Calendar() {
  const { master } = useAuth();
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [selectedBooking, setSelectedBooking] = useState<BookingWithServices | null>(null);

  const { data: bookings = [], isLoading } = useMonthBookings(master?.id, calYear, calMonth);
  const { data: workingDates = [] } = useWorkingDates(master?.id ?? "", calYear, calMonth);

  const bookingsByDay = useMemo(() => {
    const map = new Map<number, BookingWithServices[]>();
    bookings.forEach((b) => {
      const day = new Date(b.date).getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(b);
    });
    return map;
  }, [bookings]);

  const selectedBookings = selectedDay ? bookingsByDay.get(selectedDay) ?? [] : [];

  // Всегда 42 ячейки (6 рядов × 7) — высота сетки не прыгает
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const totalCells = 42;

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth();

  return (
    <div className="app-container bg-background min-h-screen pb-28">
      {/* Month header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-heading text-xl font-bold text-foreground">
          {RUSSIAN_MONTHS[calMonth]} {calYear}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground active:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground active:bg-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid — всегда 6 рядов, не прыгает */}
      <div className="px-4">
        <div className="grid grid-cols-7">
          {RUSSIAN_WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">
              {d}
            </div>
          ))}
          {Array.from({ length: totalCells }).map((_, i) => {
            const day = i - startOffset + 1;
            const isValid = day >= 1 && day <= daysInMonth;

            if (!isValid) {
              return <div key={`empty-${i}`} className="h-11" />;
            }

            const hasBookings = bookingsByDay.has(day);
            const bookingCount = bookingsByDay.get(day)?.length ?? 0;
            const isWorking = workingDates.includes(day);
            const isToday = isCurrentMonth && day === now.getDate();
            const isSelected = selectedDay === day;
            const isPast = new Date(calYear, calMonth, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate());

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center justify-center h-11 w-full text-sm rounded-xl transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isToday
                      ? "bg-accent font-semibold text-foreground"
                      : isPast
                        ? "text-muted-foreground/40"
                        : "text-foreground active:bg-secondary"
                }`}
              >
                {bookingCount > 0 && !isSelected && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                    {bookingCount}
                  </span>
                )}
                <span className="leading-none">{day}</span>
                <div className="flex gap-0.5 mt-0.5 h-1.5">
                  {isWorking && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                  )}
                  {hasBookings && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-whatsapp"}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Рабочий день
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-whatsapp" />
            Есть записи
          </div>
        </div>
      </div>

      {/* Bookings — фиксированная min-height, не прыгает */}
      <div className="mt-5 px-5 pb-4 min-h-[220px]">
        <h2 className="text-heading text-base font-bold text-foreground mb-3">
          {selectedDay
            ? `${selectedDay} ${RUSSIAN_MONTHS_GEN[calMonth]}`
            : "Выберите день"}
        </h2>

        {!selectedDay ? (
          <p className="text-muted-foreground text-sm text-center py-6">Нажмите на дату</p>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : selectedBookings.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            {workingDates.includes(selectedDay) ? "Нет записей" : "Нерабочий день"}
          </p>
        ) : (
          <div className="bg-card rounded-2xl overflow-hidden">
            {selectedBookings.map((booking) => {
              const servicesList = booking.booking_services?.map((s) => s.name).join(", ") || "Без услуг";
              return (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-border/40 last:border-b-0 cursor-pointer active:bg-secondary/50 transition-colors"
                  onClick={() => setSelectedBooking(booking)}
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
                    <p className="text-foreground font-semibold text-sm">
                      {booking.total_price.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BookingDetailDrawer
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}
      />
    </div>
  );
}
