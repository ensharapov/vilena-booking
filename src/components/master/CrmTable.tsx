import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, User, TrendingUp, CalendarDays } from "lucide-react";

interface CrmProps {
    masterId?: string;
}

interface ClientStats {
    id: string;
    name: string;
    phone: string;
    ltv: number;
    visits: number;
    lastVisit: string | null;
}

export function CrmTable({ masterId }: CrmProps) {
    const [search, setSearch] = useState("");

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["crm", masterId],
        queryFn: async () => {
            if (!masterId) return [];

            const { data, error } = await supabase
                .from("bookings")
                .select(`
          client_id,
          client_name,
          client_phone,
          total_price,
          status,
          date
        `)
                .eq("master_id", masterId)
                .in("status", ["completed", "upcoming"]);

            if (error) throw error;

            const clientMap = new Map<string, ClientStats>();

            data?.forEach((b) => {
                const uid = b.client_id || b.client_phone || "unknown";

                if (!clientMap.has(uid)) {
                    clientMap.set(uid, {
                        id: uid,
                        name: b.client_name || "Неизвестный",
                        phone: b.client_phone || "",
                        ltv: 0,
                        visits: 0,
                        lastVisit: null,
                    });
                }

                const client = clientMap.get(uid)!;
                client.visits += 1;
                client.ltv += b.total_price;

                if (!client.lastVisit || new Date(b.date) > new Date(client.lastVisit)) {
                    client.lastVisit = b.date;
                }
            });

            return Array.from(clientMap.values()).sort((a, b) => b.ltv - a.ltv);
        },
        enabled: !!masterId,
    });

    const filteredClients = useMemo(() => {
        if (!search) return clients;
        return clients.filter(
            (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.phone.includes(search)
        );
    }, [clients, search]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Поиск */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Поиск по имени или телефону"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>

            {/* Список клиентов — iOS-стиль */}
            {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    Клиенты не найдены
                </div>
            ) : (
                <div className="bg-card rounded-2xl overflow-hidden">
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 last:border-b-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-heading text-sm font-semibold text-foreground">
                                        {client.name}
                                    </h3>
                                    <p className="text-muted-foreground text-xs">{client.phone}</p>
                                </div>
                            </div>

                            <div className="text-right flex flex-col items-end">
                                <div className="flex items-center gap-1 text-whatsapp font-bold text-sm">
                                    <span>{client.ltv.toLocaleString("ru-RU")} ₽</span>
                                    <TrendingUp className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground text-[11px]">
                                    <CalendarDays className="w-3 h-3" />
                                    Визитов: {client.visits}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
