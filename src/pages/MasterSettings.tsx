import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Loader2, Link as LinkIcon, Phone, Bell } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Фиксированные 4 канала связи
const CONTACT_FIELDS = [
  { key: "telegram",  label: "Telegram",  placeholder: "@username или ссылка t.me/..." },
  { key: "whatsapp",  label: "WhatsApp",  placeholder: "+7 (999) 000-00-00" },
  { key: "max",       label: "Max / TenChat", placeholder: "@username или ссылка" },
  { key: "phone",     label: "Телефон",   placeholder: "+7 (999) 000-00-00" },
] as const;

type ContactKey = typeof CONTACT_FIELDS[number]["key"];

export default function MasterSettings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [telegramChatId, setTelegramChatId] = useState("");
    const [contacts, setContacts] = useState<Record<ContactKey, string>>({
        telegram: "",
        whatsapp: "",
        max: "",
        phone: "",
    });

    // Получаем запись мастера по user_id из сессии
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

    useEffect(() => {
        if (master) {
            setName(master.name || "");
            setSlug(master.slug || "");
            setTelegramChatId(master.telegram_chat_id || "");
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

            // Сохраняем только заполненные контакты
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
                    telegram_chat_id: telegramChatId.trim() || null,
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="app-container bg-background min-h-screen pb-24">
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-5 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-secondary">
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </button>
                <h1 className="text-lg font-bold">Настройки профиля</h1>
            </header>

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
                                beautybooking.app/
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
                            Введите ваш Telegram Chat ID и при каждой новой записи бот пришлёт вам алерт.
                        </p>
                    </div>

                    <div className="card-premium p-4 space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground ml-1">Telegram Chat ID</label>
                            <input
                                type="text"
                                value={telegramChatId}
                                onChange={(e) => setTelegramChatId(e.target.value.replace(/[^0-9-]/g, ""))}
                                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm font-mono"
                                placeholder="123456789"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Чтобы узнать свой Chat ID: напишите <span className="text-primary font-medium">@userinfobot</span> в Telegram — он ответит вашим ID.
                        </p>
                    </div>
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
        </div>
    );
}
