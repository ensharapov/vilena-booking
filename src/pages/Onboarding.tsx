import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Check } from "lucide-react";

const STEPS = [
  { title: "Как вас зовут?", subtitle: "Имя или название студии" },
  { title: "Специальность", subtitle: "Чем вы занимаетесь?" },
  { title: "Город и адрес", subtitle: "Где вас найти" },
  { title: "Ссылка для записи", subtitle: "Клиенты будут записываться по этой ссылке" },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("masters").insert({
        user_id: user.id,
        name: name.trim(),
        specialty: specialty.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        slug: slug.trim() || null,
        social_links: {},
        is_active: true,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Ошибка", description: "Эта ссылка уже занята", variant: "destructive" });
          return;
        }
        throw error;
      }

      toast({ title: "Профиль создан!", description: "Добро пожаловать в Vilena Studio" });
      // Reload to refetch master in AuthContext
      window.location.href = "/today";
    } catch (err: unknown) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Попробуйте ещё раз",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length >= 2;
    return true; // other steps are optional
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <div className="app-container bg-background flex flex-col" style={{ height: "100dvh" }}>
      {/* Progress */}
      <div className="px-5 pt-6 flex gap-1.5 shrink-0">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col px-5 pt-8">
        <h1 className="text-heading text-2xl font-bold text-foreground">
          {STEPS[step].title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 mb-6">{STEPS[step].subtitle}</p>

        {/* Step 0: Name */}
        {step === 0 && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Анна Иванова"
            autoFocus
            className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-lg"
          />
        )}

        {/* Step 1: Specialty */}
        {step === 1 && (
          <div className="space-y-3">
            {["Парикмахер", "Мастер маникюра", "Косметолог", "Массажист", "Барбер", "Стилист"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setSpecialty(s)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    specialty === s
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm font-medium">{s}</span>
                </button>
              )
            )}
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Или введите свою"
              className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm"
            />
          </div>
        )}

        {/* Step 2: City + Address */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground ml-1">Город</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Москва"
                autoFocus
                className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground ml-1">Адрес (необязательно)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ул. Тверская, д. 1"
                className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 3: Slug */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="h-12 px-3 flex items-center bg-secondary/50 border border-border border-r-0 rounded-l-xl text-muted-foreground text-xs">
                vilena.app/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="anna-nails"
                autoFocus
                className="flex-1 h-12 px-3 rounded-r-xl bg-card border border-border focus:ring-1 focus:ring-primary focus:outline-none text-sm"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Латинские буквы, цифры и дефис. По этой ссылке клиенты будут записываться к вам.
            </p>
          </div>
        )}
      </div>

      {/* Bottom button — shrink-0 чтобы не сжималась при открытой клавиатуре */}
      <div className="shrink-0 px-5 py-6 bg-background">
        <button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="w-full h-12 btn-gradient rounded-xl text-sm font-medium flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : step === STEPS.length - 1 ? (
            <>
              <Check className="w-4 h-4" /> Создать профиль
            </>
          ) : (
            <>
              Далее <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full mt-2 h-10 text-muted-foreground text-sm"
          >
            Назад
          </button>
        )}
      </div>
    </div>
  );
}
