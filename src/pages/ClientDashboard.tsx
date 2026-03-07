import { useNavigate } from "react-router-dom";
import { mockBookings, mockMaster } from "@/data/mock";
import { Heart, Clock, RotateCcw, LogOut, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ClientDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const upcomingBookings = mockBookings.filter((b) => b.status === "upcoming");
  const pastBookings: typeof mockBookings = [
    {
      id: "p1",
      clientName: "Анна Виленова",
      clientAvatar: mockMaster.avatar,
      serviceName: "Маникюр с покрытием",
      date: "15 февраля",
      time: "14:00",
      price: 2500,
      status: "completed",
    },
    {
      id: "p2",
      clientName: "Анна Виленова",
      clientAvatar: mockMaster.avatar,
      serviceName: "Педикюр с покрытием",
      date: "1 февраля",
      time: "11:00",
      price: 3000,
      status: "completed",
    },
  ];

  return (
    <div className="app-container bg-background min-h-screen pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Привет!</p>
          <h1 className="text-heading text-2xl font-bold text-foreground">Мои записи</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/master/1")}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => { logout(); navigate("/auth"); }}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Upcoming */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-heading text-lg font-bold text-foreground">Ближайшие записи</h2>
        </div>
        <div className="space-y-3">
          {upcomingBookings.map((booking) => (
            <div key={booking.id} className="card-premium p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <img src={booking.clientAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{booking.serviceName}</p>
                  <p className="text-muted-foreground text-xs">
                    {booking.date}, {booking.time}
                  </p>
                </div>
                <span className="text-foreground font-semibold text-sm">
                  {booking.price.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-destructive" />
          <h2 className="text-heading text-lg font-bold text-foreground">Избранные мастера</h2>
        </div>
        <button
          onClick={() => navigate("/master/1")}
          className="w-full card-premium p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <img src={mockMaster.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">{mockMaster.name}</p>
            <p className="text-muted-foreground text-xs">{mockMaster.specialty}</p>
          </div>
          <Heart className="w-4 h-4 fill-destructive text-destructive" />
        </button>
      </div>

      {/* History */}
      <div className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-4 h-4 text-primary" />
          <h2 className="text-heading text-lg font-bold text-foreground">История</h2>
        </div>
        <div className="space-y-3">
          {pastBookings.map((booking) => (
            <div key={booking.id} className="card-premium p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <img src={booking.clientAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{booking.serviceName}</p>
                  <p className="text-muted-foreground text-xs">{booking.date}</p>
                </div>
                <button className="text-primary text-xs font-medium whitespace-nowrap">
                  Повторить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
