import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, Link as LinkIcon, Phone, Bell, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PageLayout } from "@/components/PageLayout";

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? "";

// Фиксированные 4 канала связи
const CONTACT_FIELDS = [
  { key: "telegram",  label: "Telegram",  placeholder: "@username или ссылка t.me/..." },
  { key: "whatsapp",  label: "WhatsApp",  placeholder: "+7 (999) 000-00-00" },
  { key: "max",       label: "Max / TenChat", placeholder: "@username или ссылка" },
  { key: "phone",     label: "Телефон",   placeholder: "+7 (999) 000-00-00" },
] as const;

type ContactKey = typeof CONTACT_FIELDS[number]["key"];

export default function MasterSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [contacts, setContacts] = useState<Record<ContactKey, string>>({
        telegram: "",
        whatsapp: "",
        max: "",
        phone: "",
    });

    const { data: master, isLoading } = useQuery({
        queryKey: ["master_settings"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) throw new Error("Не авторизован");
            const { data, error } = await supabase
                .from("masters")
                .select("*")
                .eq("user_id", session.user.id)
                .single();
            if (error) throw error;
            return data;
        },
    });

    // Автообновление при возврате из Telegram
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                queryClient.invalidateQueries({ queryKey: ["master_settings"] });
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [queryClient]);

    useEffect(() => {
        if (master) {
            setName(master.name || "");
            setSlug(master.slug || "");
            const links = master.social_links as Record<string, string> || {};
            setContacts({
                telegram: links.telegram || "",
                whatsapp: links.whatsapp || "",
                max: links.max || "",
                phone: links.phone || master.phone || "",
            });
        }
    }, [master]);

    const updateProfile = useMutation({
        mutationFn: async () => {
            if (!master?.id) throw new Error("Мастер не найден");
            const linksObj: Record<string, string> = {};
            (Object.keys(contacts) as ContactKey[]).forEach((k) => {
                if (contacts[k].trim()) linksObj[k] = contacts[k].trim();
            });
            const { error } = await supabase
                .from("masters")
                .update({
                    name: name.trim(),
                    slug: slug.trim() || null,
                    social_links: linksObj,
                })
                .eq("id", master.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Профиль обновлён", description: "Настройки успешно сохранены" });
            queryClient.invalidateQueries({ queryKey: ["master"] });
        },
        onError: (error: any) => {
            if (error.code === "23505") {
                toast({ title: "Ошибка", description: "Эта ссылка уже занята другим мастером", variant: "destructive" });
            } else {
                toast({ title: "Ошибка", description: error.message, variant: "destructive" });
            }
        },
    });

    const disconnectTelegram = useMutation({
        mutationFn: async () => {
            if (!master?.id) throw new Error("Мастер не найден");
            const { error } = await supabase
                .from("masters")
                .update({ telegram_chat_id: null })
                .eq("id", master.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Telegram отключён", description: "Уведомления больше не будут приходить" });
            queryClient.invalidateQueries({ queryKey: ["master_settings"] });
            queryClient.invalidateQueries({ queryKey: ["master"] });
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <PageLayout variant="subpage" title="Настройки профиля">
            <div className="p-5 space-y-7">
                {/* Основная информация */}
                <section className="space-y-4">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Основная информация</h2>

                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground ml-1">Имя или название студии</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                            placeholder="Анна Иванова"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" />
                            Персональная ссылка
                        </label>
                        <div className="flex items-center">
                            <span className="h-12 px-3 flex items-center bg-secondary/50 border border-border border-r-0 rounded-l-xl text-muted-foreground text-xs">
                                vilena.app/
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                className="flex-1 h-12 px-3 rounded-r-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                                placeholder="anna-nails"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1">Только латинские буквы, цифры и дефис. Уникальный адрес вашей страницы записи.</p>
                    </div>
                </section>

                {/* Контакты для связи */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Контакты для связи</h2>
                        <p className="text-[11px] text-muted-foreground mt-1">Отображаются на странице для уточнений от клиента. Заполните те, которые хотите показать.</p>
                    </div>
                    <div className="space-y-3">
                        {CONTACT_FIELDS.map(({ key, label, placeholder }) => (
                            <div key={key} className="space-y-1">
                                <label className="text-xs text-muted-foreground ml-1 flex items-center gap-1.5">
                                    {key === "phone" ? <Phone className="w-3 h-3" /> : null}
                                    {label}
                                </label>
                                <input
                                    type={key === "phone" ? "tel" : "text"}
                                    value={contacts[key]}
                                    onChange={(e) => setContacts(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full h-11 px-4 rounded-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                                    placeholder={placeholder}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Уведомления Telegram */}
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Bell className="w-3 h-3" />
                            Уведомления о записях
                        </h2>
                        <p className="text-[11px] text-muted-foreground mt-1">
                            Подключите Telegram — и при каждой новой записи вы получите мгновенное уведомление.
                        </p>
                    </div>

                    {master?.telegram_chat_id ? (
                        <div className="card-premium p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">Уведомления подключены</p>
                                <p className="text-xs text-muted-foreground">Каждая новая запись придёт в Telegram</p>
                            </div>
                            <button
                                onClick={() => disconnectTelegram.mutate()}
                                disabled={disconnectTelegram.isPending}
                                className="text-xs text-destructive shrink-0 px-2 py-1"
                            >
                                {disconnectTelegram.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Отключить"}
                            </button>
                        </div>
                    ) : (
                        <a
                            href={`https://t.me/${BOT_USERNAME}?start=${master?.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
                        >
                            <div className="w-10 h-10 rounded-xl bg-telegram/10 flex items-center justify-center shrink-0">
                                <Bell className="w-5 h-5 text-telegram" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Подключить уведомления</p>
                                <p className="text-xs text-muted-foreground">Нажмите — откроется Telegram, нажмите Start</p>
                            </div>
                        </a>
                    )}
                </section>

                <button
                    onClick={() => updateProfile.mutate()}
                    disabled={updateProfile.isPending}
                    className="w-full h-14 btn-gradient rounded-xl text-[15px] font-medium flex items-center justify-center gap-2"
                >
                    {updateProfile.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Сохранить настройки
                </button>
            </div>
        </PageLayout>
    );
}
