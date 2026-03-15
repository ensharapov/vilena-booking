import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatLocalDate } from '@/lib/formatLocalDate'
import type { DBBooking, DBWorkingShift, DBService } from '@/lib/supabase'

export interface BookingWithServices extends DBBooking {
    booking_services: {
        id: string
        service_id: string
        name: string
        price: number
        duration_minutes: number
    }[]
}

// 1. Получение предстоящих записей мастера (сегодня и будущее)
export function useUpcomingBookings(masterId: string | undefined) {
    return useQuery({
        queryKey: ['upcoming_bookings', masterId],
        queryFn: async (): Promise<BookingWithServices[]> => {
            if (!masterId) return []

            const today = formatLocalDate()

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    booking_services (*)
                `)
                .eq('master_id', masterId)
                .gte('date', today)
                .neq('status', 'cancelled')
                .order('date', { ascending: true })
                .order('start_time', { ascending: true })

            if (error) throw error
            return data as BookingWithServices[]
        },
        enabled: !!masterId,
        refetchInterval: 30000 // обновляем раз в 30 секунд
    })
}

// 2. Получение базовой статистики мастера (суммарный доход, клиенты, записи сегодня)
export function useMasterStats(masterId: string | undefined) {
    return useQuery({
        queryKey: ['master_stats', masterId],
        queryFn: async () => {
            if (!masterId) return { todayCount: 0, weekIncome: 0, totalClients: 0 }

            const today = new Date()
            const todayStr = formatLocalDate(today)

            // Начало недели (Понедельник)
            const weekStart = new Date(today)
            const day = weekStart.getDay() || 7 // 1-7
            if (day !== 1) weekStart.setDate(weekStart.getDate() - (day - 1))
            const weekStartStr = formatLocalDate(weekStart)

            // 1. Записи сегодня
            const { count: todayCount, error: err1 } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('master_id', masterId)
                .eq('date', todayStr)
                .neq('status', 'cancelled')

            if (err1) throw err1

            // 2. Доход за неделю (все успешные и предстоящие записи на этой неделе)
            const { data: weekBookings, error: err2 } = await supabase
                .from('bookings')
                .select('total_price')
                .eq('master_id', masterId)
                .gte('date', weekStartStr)
                .neq('status', 'cancelled')

            if (err2) throw err2
            const weekIncome = weekBookings.reduce((sum, b) => sum + (b.total_price || 0), 0)

            // 3. Уникальные клиенты за все время
            // Пока считаем просто по кол-ву уникальных client_phone в bookings
            const { data: allBookings, error: err3 } = await supabase
                .from('bookings')
                .select('client_phone')
                .eq('master_id', masterId)
                .neq('status', 'cancelled')

            if (err3) throw err3
            const uniquePhones = new Set(allBookings.filter(b => b.client_phone).map(b => b.client_phone))

            return {
                todayCount: todayCount || 0,
                weekIncome,
                totalClients: uniquePhones.size
            }
        },
        enabled: !!masterId
    })
}

// 3. Получение рабочих смен мастера
export function useMasterShifts(masterId: string | undefined, limit = 10) {
    return useQuery({
        queryKey: ['master_shifts', masterId],
        queryFn: async (): Promise<DBWorkingShift[]> => {
            if (!masterId) return []

            const today = formatLocalDate()

            const { data, error } = await supabase
                .from('working_shifts')
                .select('*')
                .eq('master_id', masterId)
                .gte('date', today)
                .order('date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(limit)

            if (error) throw error
            return data
        },
        enabled: !!masterId
    })
}
