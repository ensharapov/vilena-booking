import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMasterShifts } from "@/hooks/useMasterDashboard";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/use-toast";

interface ShiftManagerProps {
    masterId: string | undefined;
    children: React.ReactNode;
}

export function ShiftManager({ masterId, children }: ShiftManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [startTime, setStartTime] = useState("10:00");
    const [endTime, setEndTime] = useState("19:00");

    const queryClient = useQueryClient();
    const { data: shifts = [], isLoading } = useMasterShifts(masterId);
    const { toast } = useToast();

    const handleAddShift = async () => {
        if (!masterId) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from("working_shifts").insert({
                master_id: masterId,
                date,
                start_time: startTime,
                end_time: endTime,
                is_active: true
            });

            if (error) throw error;

            toast({
                title: "Смена добавлена",
                description: `Рабочий день ${format(new Date(date), "d MMMM", { locale: ru })} открыт`,
            });

            queryClient.invalidateQueries({ queryKey: ["master_shifts", masterId] });
            // Увеличим дату на 1 день для удобства ввода следующей смены
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            setDate(format(nextDate, "yyyy-MM-dd"));

        } catch (error: any) {
            toast({
                title: "Ошибка",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteShift = async (id: string) => {
        try {
            const { error } = await supabase.from("working_shifts").delete().eq("id", id);
            if (error) throw error;

            toast({ title: "Смена удалена" });
            queryClient.invalidateQueries({ queryKey: ["master_shifts", masterId] });
        } catch (error: any) {
            toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                {children}
            </DrawerTrigger>
            <DrawerContent className="max-h-[90vh]">
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle>Управление сменами</DrawerTitle>
                        <DrawerDescription>Добавляйте рабочие дни для онлайн-записи.</DrawerDescription>
                    </DrawerHeader>

                    <div className="flex flex-col gap-4 p-4">
                        {/* Форма добавления */}
                        <div className="card-premium p-4 flex flex-col gap-3">
                            <h3 className="font-semibold text-sm">Добавить новую смену</h3>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Дата
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    min={format(new Date(), "yyyy-MM-dd")}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Начало
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Конец
                                    </label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddShift}
                                disabled={isSubmitting || !date || !startTime || !endTime}
                                className="w-full btn-gradient h-10 rounded-lg text-sm font-medium mt-1 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Создать смену
                            </button>
                        </div>

                        {/* Предстоящие смены */}
                        <div>
                            <h3 className="font-semibold text-sm mb-3">Предстоящие смены</h3>
                            {isLoading ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                            ) : shifts.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center p-4">Нет предстоящих смен</p>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
                                    {shifts.map(shift => (
                                        <div key={shift.id} className="flex flex-row items-center justify-between p-3 rounded-lg border border-border bg-card">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {format(new Date(shift.date), "d MMM yyyy", { locale: ru })}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {shift.start_time.slice(0, 5)} — {shift.end_time.slice(0, 5)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteShift(shift.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-destructive/10 text-destructive active:scale-95"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DrawerFooter>
                        <DrawerClose asChild>
                            <button className="w-full h-10 rounded-lg border border-border font-medium text-sm active:bg-muted">
                                Закрыть
                            </button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
