import { useQuery } from '@tanstack/react-query'
import { supabase, type DBMaster, type DBService } from '@/lib/supabase'

export function useMasterData(masterId: string) {
    const masterQuery = useQuery({
        queryKey: ['master', masterId],
        queryFn: async (): Promise<DBMaster | null> => {
            let query = supabase.from('masters').select('*')

            if (masterId === '1') {
                query = query.limit(1)
            } else {
                query = query.eq('id', masterId)
            }

            const { data, error } = await query.single()
            if (error) throw error
            return data
        },
        staleTime: 60_000,
    })

    // Используем реальный ID мастера из первого запроса для услуг
    const realMasterId = masterQuery.data?.id ?? masterId

    const servicesQuery = useQuery({
        queryKey: ['services', realMasterId],
        queryFn: async (): Promise<DBService[]> => {
            if (!realMasterId) return []
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('master_id', realMasterId)
                .eq('is_active', true)
                .order('sort_order')
            if (error) throw error
            return data ?? []
        },
        enabled: !!realMasterId,
        staleTime: 60_000,
    })

    return { masterQuery, servicesQuery }
}

// Получить список рабочих дат мастера на текущий месяц
export function useWorkingDates(masterId: string, year: number, month: number) {
    return useQuery({
        queryKey: ['working_dates', masterId, year, month],
        queryFn: async (): Promise<number[]> => {
            if (!masterId) return []

            const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`
            const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`

            const { data: shifts, error } = await supabase
                .from('working_shifts')
                .select('date')
                .eq('master_id', masterId)
                .eq('is_active', true)
                .gte('date', firstDay)
                .lte('date', lastDay)

            if (error) throw error

            const uniqueDays = new Set(
                (shifts ?? []).map((s) => new Date(s.date).getDate())
            )

            return Array.from(uniqueDays).sort((a, b) => a - b)
        },
        enabled: !!masterId,
        staleTime: 60_000,
    })
}
