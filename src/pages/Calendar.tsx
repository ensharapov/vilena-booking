import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useWorkingDates } from "@/hooks/useMasterData";
import type { BookingWithServices } from "@/hooks/useMasterDashboard";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const RUSSIAN_MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
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

  const { data: bookings = [], isLoading } = useMonthBookings(master?.id, calYear, calMonth);
  const { data: workingDates = [] } = useWorkingDates(master?.id ?? "", calYear, calMonth);

  // Group bookings by day
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

  // Calendar grid
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

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
    <div className="app-container bg-background min-h-screen">
      {/* Month header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-heading text-xl font-bold text-foreground">
          {RUSSIAN_MONTHS[calMonth]} {calYear}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="px-5 mt-2">
        <div className="grid grid-cols-7 gap-0">
          {RUSSIAN_WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">
              {d}
            </div>
          ))}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
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
                className={`relative flex flex-col items-center justify-center py-2 text-sm transition-all rounded-xl ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isToday
                      ? "bg-accent font-semibold text-foreground"
                      : isPast
                        ? "text-muted-foreground/40"
                        : "text-foreground hover:bg-accent/50"
                }`}
              >
                {day}
                <div className="flex gap-0.5 mt-0.5 h-1.5">
                  {isWorking && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      }`}
                    />
                  )}
                  {hasBookings && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? "bg-primary-foreground" : "bg-whatsapp"
                      }`}
                    />
                  )}
                </div>
                {bookingCount > 0 && !isSelected && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {bookingCount}
                  </span>
                )}
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

      {/* Bookings for selected day */}
      <div className="px-5 mt-6">
        {selectedDay && (
          <>
            <h2 className="text-heading text-base font-bold text-foreground mb-3">
              {selectedDay} {RUSSIAN_MONTHS[calMonth].toLowerCase()}
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : selectedBookings.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                {workingDates.includes(selectedDay) ? "Нет записей" : "Нерабочий день"}
              </p>
            ) : (
              <div className="space-y-3">
                {selectedBookings.map((booking) => {
                  const servicesList = booking.booking_services?.map((s) => s.name).join(", ") || "Без услуг";
                  return (
                    <div key={booking.id} className="card-premium p-4 flex items-center gap-3 animate-fade-in">
                      <div className="w-14 text-center shrink-0">
                        <p className="text-foreground font-bold text-sm">{booking.start_time.slice(0, 5)}</p>
                        <p className="text-muted-foreground text-[10px]">{booking.end_time.slice(0, 5)}</p>
                      </div>
                      <div className="w-px h-10 bg-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {booking.client_name || "Клиент"}
                        </p>
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
          </>
        )}
      </div>
    </div>
  );
}
