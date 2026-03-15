import { useState } from "react";
import type { BookingWithServices } from "@/hooks/useMasterDashboard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Phone, Calendar, Clock, User, Scissors, CreditCard, Loader2 } from "lucide-react";

const RUSSIAN_MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Предстоит",
  completed: "Завершена",
  cancelled: "Отменена",
  no_show: "Не пришёл",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-orange-100 text-orange-600",
};

interface Props {
  booking: BookingWithServices | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailDrawer({ booking, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upcoming_bookings"] });
      queryClient.invalidateQueries({ queryKey: ["month_bookings"] });
      queryClient.invalidateQueries({ queryKey: ["master_stats"] });
      onOpenChange(false);
      setConfirmCancel(false);
    },
  });

  if (!booking) return null;

  const d = new Date(booking.date + "T00:00:00");
  const formattedDate = `${d.getDate()} ${RUSSIAN_MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
  const servicesList = booking.booking_services?.map((s) => s.name) ?? [];
  const canCancel = booking.status === "upcoming";

  return (
    <Drawer open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setConfirmCancel(false); }}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">Детали записи</DrawerTitle>
          <DrawerDescription>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] ?? ""}`}>
              {STATUS_LABELS[booking.status] ?? booking.status}
            </span>
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-4">
          {/* Client */}
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{booking.client_name || "Клиент"}</p>
              {booking.client_phone && (
                <a href={`tel:${booking.client_phone}`} className="text-xs text-primary flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {booking.client_phone}
                </a>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-foreground">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-foreground">
                {booking.start_time.slice(0, 5)} — {booking.end_time.slice(0, 5)}
                <span className="text-muted-foreground text-xs ml-2">({booking.total_minutes} мин)</span>
              </p>
            </div>
          </div>

          {/* Services */}
          <div className="flex items-start gap-3">
            <Scissors className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              {servicesList.length > 0 ? (
                <ul className="space-y-1">
                  {booking.booking_services.map((s) => (
                    <li key={s.id} className="text-sm text-foreground flex justify-between gap-4">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground shrink-0">{s.price.toLocaleString("ru-RU")} ₽</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Без услуг</p>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm font-semibold text-foreground">
              Итого: {booking.total_price.toLocaleString("ru-RU")} ₽
            </p>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-accent/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Заметка</p>
              <p className="text-sm text-foreground">{booking.notes}</p>
            </div>
          )}
        </div>

        <DrawerFooter>
          {canCancel && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors"
            >
              Отменить запись
            </button>
          )}
          {canCancel && confirmCancel && (
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground">Вы уверены?</p>
              <button
                onClick={() => cancelMutation.mutate(booking.id)}
                disabled={cancelMutation.isPending}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Да, отменить
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="w-full py-2 text-sm text-muted-foreground"
              >
                Назад
              </button>
            </div>
          )}
          <DrawerClose asChild>
            <button className="w-full py-3 rounded-xl bg-accent text-foreground font-medium text-sm">
              Закрыть
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
