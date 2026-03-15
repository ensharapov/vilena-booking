import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Парсинг строки длительности в минуты (например "1 ч 20 мин" → 80)
export function parseDurationToMinutes(duration: string): number {
    let total = 0
    const hoursMatch = duration.match(/(\d+)\s*ч/)
    const minsMatch = duration.match(/(\d+)\s*мин/)
    if (hoursMatch) total += parseInt(hoursMatch[1]) * 60
    if (minsMatch) total += parseInt(minsMatch[1])
    return total || 60
}

interface UseAvailableSlotsParams {
    masterId: string | null
    date: Date | null
    sessionMinutes: number
}

export function useAvailableSlots({
    masterId,
    date,
    sessionMinutes,
}: UseAvailableSlotsParams) {
    const dateStr = date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : null

    return useQuery({
        queryKey: ['available_slots', masterId, dateStr, sessionMinutes],
        queryFn: async (): Promise<string[]> => {
            if (!masterId || !dateStr || sessionMinutes <= 0) return []

            const { data, error } = await supabase.rpc('get_available_slots', {
                p_master_id: masterId,
                p_date: dateStr,
                p_session_minutes: sessionMinutes,
            })

            if (error) throw error

            // rpc возвращает [{slot_time: "10:00:00"}, ...]
            return (data as { slot_time: string }[]).map((row) =>
                row.slot_time.slice(0, 5)
            )
        },
        enabled: !!masterId && !!dateStr && sessionMinutes > 0,
        staleTime: 30_000, // кеш 30 сек
    })
}
