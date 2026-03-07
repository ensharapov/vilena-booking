export interface Master {
  id: string;
  name: string;
  specialty: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  avatar: string;
  coverImage: string;
  phone: string;
  whatsapp: string;
  telegram: string;
}

export interface Service {
  id: string;
  name: string;
  duration: string;
  price: number;
  priceFrom?: boolean;
  category: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface Booking {
  id: string;
  clientName: string;
  clientAvatar: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: "upcoming" | "completed" | "cancelled";
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export const mockMaster: Master = {
  id: "1",
  name: "Вилена",
  specialty: "Мастер-парикмахер",
  city: "Сочи",
  address: "Краснодонская, 6/1",
  rating: 0,
  reviewCount: 0,
  avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face",
  coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop",
  phone: "+7 (999) 000-00-00",
  whatsapp: "79990000000",
  telegram: "vilena_master",
};

export const mockServices: Service[] = [
  { id: "1",  name: "Стрижка",                          duration: "1 ч 20 мин", price: 1500, priceFrom: true,  category: "Стрижки" },
  { id: "2",  name: "Челка",                            duration: "15 мин",      price: 500,  priceFrom: false, category: "Стрижки" },
  { id: "3",  name: "Уход волос",                       duration: "1 ч 15 мин", price: 2000, priceFrom: false, category: "Уход" },
  { id: "4",  name: "Женская стрижка ( До плеч )",      duration: "1 ч",         price: 1000, priceFrom: false, category: "Стрижки" },
  { id: "5",  name: "Женская стрижка ( по плечи )",     duration: "1 ч",         price: 1200, priceFrom: false, category: "Стрижки" },
  { id: "6",  name: "Женская стрижка ( до лопаток )",   duration: "1 ч",         price: 1500, priceFrom: true,  category: "Стрижки" },
  { id: "7",  name: "Женская стрижка ( до талии )",     duration: "1 ч 10 мин", price: 1800, priceFrom: true,  category: "Стрижки" },
  { id: "8",  name: "Укладка ( короткий волос)",        duration: "40 мин",      price: 1000, priceFrom: true,  category: "Укладка" },
  { id: "9",  name: "Укладка ( средняя длина )",        duration: "50 мин",      price: 1500, priceFrom: true,  category: "Укладка" },
  { id: "10", name: "Укладка ( длинный волос )",        duration: "1 ч",         price: 1800, priceFrom: true,  category: "Укладка" },
  { id: "11", name: "Прическа ( на любой длины )",      duration: "1 ч",         price: 3000, priceFrom: true,  category: "Прически" },
];

export const mockReviews: Review[] = [
  {
    id: "1",
    author: "Мария К.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    rating: 5,
    text: "Прекрасный мастер! Делала маникюр с покрытием, результат просто идеальный. Обязательно приду ещё раз.",
    date: "2 дня назад",
  },
  {
    id: "2",
    author: "Елена С.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    rating: 5,
    text: "Очень аккуратная работа, приятная атмосфера. Рекомендую!",
    date: "1 неделю назад",
  },
  {
    id: "3",
    author: "Ольга П.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
    rating: 4,
    text: "Хороший мастер, но пришлось немного подождать. В остальном всё отлично.",
    date: "2 недели назад",
  },
];

export const mockBookings: Booking[] = [
  {
    id: "1",
    clientName: "Мария Козлова",
    clientAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    serviceName: "Маникюр с покрытием",
    date: "Сегодня",
    time: "14:00",
    price: 2500,
    status: "upcoming",
  },
  {
    id: "2",
    clientName: "Елена Смирнова",
    clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    serviceName: "Педикюр с покрытием",
    date: "Сегодня",
    time: "16:30",
    price: 3000,
    status: "upcoming",
  },
  {
    id: "3",
    clientName: "Ольга Петрова",
    clientAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
    serviceName: "Наращивание ногтей",
    date: "Завтра",
    time: "10:00",
    price: 5000,
    status: "upcoming",
  },
];

export const mockTimeSlots: TimeSlot[] = [
  { time: "09:00", available: true },
  { time: "09:30", available: false },
  { time: "10:00", available: true },
  { time: "10:30", available: true },
  { time: "11:00", available: false },
  { time: "11:30", available: true },
  { time: "12:00", available: false },
  { time: "13:00", available: true },
  { time: "13:30", available: true },
  { time: "14:00", available: false },
  { time: "14:30", available: true },
  { time: "15:00", available: true },
  { time: "15:30", available: false },
  { time: "16:00", available: true },
  { time: "16:30", available: true },
  { time: "17:00", available: true },
];

export const availableDates = [3, 5, 6, 8, 10, 12, 13, 15, 17, 19, 20, 22, 24, 26, 27];
export const unavailableDates = [1, 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25, 28];
