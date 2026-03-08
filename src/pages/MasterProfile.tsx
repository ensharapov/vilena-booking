import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Star, Phone, MapPin, ChevronRight, MessageCircle, Loader2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMasterData } from "@/hooks/useMasterData";

const MasterProfile = () => {
  const { id = '1' } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  const { masterQuery, servicesQuery } = useMasterData(id);
  const master = masterQuery.data;
  const services = servicesQuery.data ?? [];

  if (masterQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!master) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground p-5 text-center">
        Мастер не найден или ссылка недействительна.
      </div>
    );
  }

  const socialLinks = master.social_links as Record<string, string> || {};


  return (
    <div className="app-container bg-background min-h-screen pb-24">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={master.cover_url || "https://images.unsplash.com/photo-1620052328701-41dbd28d002a?q=80&w=600&auto=format"}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "blur(2px) brightness(0.7)" }}
        />
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${isFavorite ? "fill-destructive text-destructive" : "text-foreground"}`}
          />
        </button>
        {/* Avatar */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden shadow-lg bg-secondary flex items-center justify-center">
            {master.avatar_url ? (
              <img src={master.avatar_url} alt={master.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground">{master.name[0]}</span>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="pt-16 px-5 text-center">
        <h1 className="text-heading text-2xl font-bold text-foreground">{master.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{master.specialty}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground text-xs">{master.city}</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < Math.floor(master.rating) ? "fill-primary text-primary" : "text-border"}`}
            />
          ))}
          <span className="text-sm font-medium text-foreground ml-1">{master.rating}</span>
          <span className="text-xs text-muted-foreground">({master.review_count})</span>
        </div>
      </div>

      {/* Contact buttons */}
      <div className="flex gap-3 px-5 mt-6">
        {socialLinks.whatsapp && (
          <a
            href={`https://wa.me/${socialLinks.whatsapp}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-whatsapp/10 text-whatsapp font-medium text-sm active:scale-[0.98] transition-transform"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
        {socialLinks.telegram && (
          <a
            href={`https://t.me/${socialLinks.telegram.replace('@', '')}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-telegram/10 text-telegram font-medium text-sm active:scale-[0.98] transition-transform"
          >
            <MessageCircle className="w-4 h-4" />
            Telegram
          </a>
        )}
        {Object.keys(socialLinks).length === 0 && (
          <div className="flex-1 py-3 px-4 rounded-xl bg-secondary text-muted-foreground text-center text-sm">
            Нет доступных контактов
          </div>
        )}
      </div>

      {/* Services */}
      <div className="px-5 mt-6">
        <Drawer>
          <DrawerTrigger asChild>
            <button className="w-full card-premium p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
              <div>
                <h3 className="text-heading text-lg font-semibold text-foreground">Услуги</h3>
                <p className="text-muted-foreground text-sm">{services.length} услуг</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <div className="drag-indicator mt-3" />
            <div className="px-5 pb-8 overflow-y-auto">
              <h2 className="text-heading text-2xl font-bold text-foreground mb-4">Услуги</h2>
              <div className="space-y-0">
                {services.map((service, i) => (
                  <div key={service.id}>
                    <div className="flex items-center justify-between py-4">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-foreground text-sm">{service.name}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{service.duration_minutes} мин</p>
                      </div>
                      <span className="text-foreground font-semibold text-sm whitespace-nowrap">
                        {service.price_from && "от "}
                        {service.price.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                    {i < services.length - 1 && <div className="h-px bg-border" />}
                  </div>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Address */}
      <div className="px-5 mt-4">
        <div className="card-premium p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="text-heading text-lg font-semibold text-foreground">Адрес</h3>
              <p className="text-muted-foreground text-sm mt-1">{master.address || "Не указан"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews are removed */}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-md border-t border-border px-5 py-4 flex gap-3 z-50">
        <button
          onClick={() => navigate(`/booking/${master.slug || master.id}`)}
          className="flex-1 btn-gradient h-12 text-sm flex items-center justify-center font-medium"
        >
          Онлайн-запись
        </button>
        {master.phone && (
          <a
            href={`tel:${master.phone}`}
            className="w-12 h-12 rounded-xl border border-border bg-card flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <Phone className="w-5 h-5 text-foreground" />
          </a>
        )}
      </div>
    </div>
  );
};

export default MasterProfile;
