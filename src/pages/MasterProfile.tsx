import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Phone, MapPin, ChevronRight, MessageCircle } from "lucide-react";
import { mockMaster, mockServices } from "@/data/mock";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

const MasterProfile = () => {
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="app-container bg-background min-h-screen pb-24">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={mockMaster.coverImage}
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
          <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden shadow-lg">
            <img src={mockMaster.avatar} alt={mockMaster.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="pt-16 px-5 text-center">
        <h1 className="text-heading text-2xl font-bold text-foreground">{mockMaster.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{mockMaster.specialty}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground text-xs">{mockMaster.city}</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < Math.floor(mockMaster.rating) ? "fill-primary text-primary" : "text-border"}`}
            />
          ))}
          <span className="text-sm font-medium text-foreground ml-1">{mockMaster.rating}</span>
          <span className="text-xs text-muted-foreground">({mockMaster.reviewCount})</span>
        </div>
      </div>

      {/* Contact buttons */}
      <div className="flex gap-3 px-5 mt-6">
        <a
          href={`https://wa.me/${mockMaster.whatsapp}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-whatsapp/10 text-whatsapp font-medium text-sm active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
        <a
          href={`https://t.me/${mockMaster.telegram}`}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-telegram/10 text-telegram font-medium text-sm active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="w-4 h-4" />
          Telegram
        </a>
      </div>

      {/* Services */}
      <div className="px-5 mt-6">
        <Drawer>
          <DrawerTrigger asChild>
            <button className="w-full card-premium p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
              <div>
                <h3 className="text-heading text-lg font-semibold text-foreground">Услуги</h3>
                <p className="text-muted-foreground text-sm">{mockServices.length} услуг</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <div className="drag-indicator mt-3" />
            <div className="px-5 pb-8">
              <h2 className="text-heading text-2xl font-bold text-foreground mb-4">Услуги</h2>
              <div className="space-y-0">
                {mockServices.map((service, i) => (
                  <div key={service.id}>
                    <div className="flex items-center justify-between py-4">
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-foreground text-sm">{service.name}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{service.duration}</p>
                      </div>
                      <span className="text-foreground font-semibold text-sm whitespace-nowrap">
                        {service.priceFrom && "от "}
                        {service.price.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                    {i < mockServices.length - 1 && <div className="h-px bg-border" />}
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
              <p className="text-muted-foreground text-sm mt-1">{mockMaster.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews are removed */}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-md border-t border-border px-5 py-4 flex gap-3 z-50">
        <button
          onClick={() => navigate("/booking/1")}
          className="flex-1 btn-gradient h-12 text-sm flex items-center justify-center"
        >
          Онлайн-запись
        </button>
        <a
          href={`tel:${mockMaster.phone}`}
          className="w-12 h-12 rounded-xl border border-border bg-card flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <Phone className="w-5 h-5 text-foreground" />
        </a>
      </div>
    </div>
  );
};

export default MasterProfile;
