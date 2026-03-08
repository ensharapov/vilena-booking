import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Plus, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const COMMON_MESSENGERS = ["whatsapp", "telegram", "instagram", "vk"];

export default function MasterSettings() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [socialLinks, setSocialLinks] = useState<{ key: string; value: string }[]>([]);

    // Fetch current master data
    const { data: master, isLoading } = useQuery({
        queryKey: ["master", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("masters").select("*").eq("id", id).single();
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    useEffect(() => {
        if (master) {
            setName(master.name || "");
            setSlug(master.slug || "");

            const linksObj = master.social_links || {};
            const linksArray = Object.entries(linksObj).map(([key, value]) => ({ key, value: String(value) }));
            setSocialLinks(linksArray.length > 0 ? linksArray : [{ key: "whatsapp", value: "" }]);
        }
    }, [master]);

    // Mutation to save changes
    const updateProfile = useMutation({
        mutationFn: async () => {
            // Обновляем алиас в URL, он должен быть уникальным
            // Конвертируем массив обратно в объект
            const linksObj = socialLinks.reduce((acc, curr) => {
                if (curr.value.trim() !== "") {
                    acc[curr.key] = curr.value.trim();
                }
                return acc;
            }, {} as Record<string, string>);

            const { error } = await supabase
                .from("masters")
                .update({
                    name,
                    slug: slug.trim() || null,
                    social_links: linksObj,
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Профиль обновлен", description: "Настройки успешно сохранены" });
            queryClient.invalidateQueries({ queryKey: ["master", id] });
        },
        onError: (error: any) => {
            if (error.code === '23505') {
                toast({ title: "Ошибка", description: "Эта персональная ссылка (URL) уже занята", variant: "destructive" });
            } else {
                toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
            }
        }
    });

    const addSocialLink = () => {
        setSocialLinks([...socialLinks, { key: "telegram", value: "" }]);
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const updateSocialLink = (index: number, field: "key" | "value", newValue: string) => {
        const newLinks = [...socialLinks];
        newLinks[index][field] = newValue;
        setSocialLinks(newLinks);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="app-container bg-background min-h-screen pb-20">
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-5 py-4 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-secondary">
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </button>
                <h1 className="text-lg font-bold">Настройки профиля</h1>
            </header>

            <div className="p-5 space-y-6">
                {/* Basic Info */}
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Основная информация</h2>

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
                            Персональная ссылка (Алиас)
                        </label>
                        <div className="flex items-center">
                            <span className="h-12 px-3 flex items-center bg-secondary/50 border border-border border-r-0 rounded-l-xl text-muted-foreground text-sm">
                                beautybooking.app/
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className="flex-1 h-12 px-3 rounded-r-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                                placeholder="anna-nails"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground ml-1">Используйте только латинские буквы, цифры и дефис</p>
                    </div>
                </section>

                {/* Social Links */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Мессенджеры и соцсети</h2>
                    </div>

                    <div className="space-y-3">
                        {socialLinks.map((link, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <select
                                    value={link.key}
                                    onChange={(e) => updateSocialLink(index, "key", e.target.value)}
                                    className="h-11 px-2 rounded-lg bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm w-1/3"
                                >
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="telegram">Telegram</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="vk">ВКонтакте</option>
                                    <option value="other">Другое</option>
                                </select>
                                <input
                                    type="text"
                                    value={link.value}
                                    onChange={(e) => updateSocialLink(index, "value", e.target.value)}
                                    className="h-11 px-3 flex-1 rounded-lg bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                                    placeholder="Номер или @никнейм"
                                />
                                <button
                                    onClick={() => removeSocialLink(index)}
                                    className="w-11 h-11 flex items-center justify-center bg-destructive/10 text-destructive rounded-lg active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addSocialLink}
                        className="w-full h-11 rounded-lg border border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-2 active:bg-primary/5"
                    >
                        <Plus className="w-4 h-4" />
                        Добавить контакт
                    </button>
                </section>

                <button
                    onClick={() => updateProfile.mutate()}
                    disabled={updateProfile.isPending}
                    className="w-full h-14 btn-gradient rounded-xl text-[15px] font-medium mt-6 flex items-center justify-center gap-2 sticky bottom-6"
                >
                    {updateProfile.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Сохранить настройки
                </button>
            </div>
        </div>
    );
}
