import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type DBService } from '@/lib/supabase'
import type { ServiceTemplate } from '@/lib/defaultServices'

// Список всех услуг мастера (включая неактивные, для управления)
export function useServices(masterId: string | undefined) {
    return useQuery({
        queryKey: ['services_all', masterId],
        queryFn: async (): Promise<DBService[]> => {
            if (!masterId) return []
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('master_id', masterId)
                .order('sort_order')
            if (error) throw error
            return data ?? []
        },
        enabled: !!masterId,
        staleTime: 30_000,
    })
}

interface AddServicePayload {
    master_id: string
    name: string
    duration_minutes: number
    price: number
    price_from?: boolean
    category?: string
    sort_order?: number
}

// Добавить одну услугу
export function useAddService() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: AddServicePayload) => {
            const { data, error } = await supabase
                .from('services')
                .insert({ ...payload, is_active: true })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['services_all', variables.master_id] })
            queryClient.invalidateQueries({ queryKey: ['services', variables.master_id] })
        },
    })
}

interface UpdateServicePayload {
    id: string
    master_id: string
    name?: string
    duration_minutes?: number
    price?: number
    price_from?: boolean
    category?: string
    is_active?: boolean
}

// Обновить услугу
export function useUpdateService() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, master_id, ...updates }: UpdateServicePayload) => {
            const { data, error } = await supabase
                .from('services')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['services_all', variables.master_id] })
            queryClient.invalidateQueries({ queryKey: ['services', variables.master_id] })
        },
    })
}

// Мягкое удаление (is_active = false)
export function useDeleteService() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, master_id }: { id: string; master_id: string }) => {
            const { error } = await supabase
                .from('services')
                .update({ is_active: false })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['services_all', variables.master_id] })
            queryClient.invalidateQueries({ queryKey: ['services', variables.master_id] })
        },
    })
}

// Массовый импорт дефолтных услуг
export function useImportDefaultServices() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            master_id,
            templates,
        }: {
            master_id: string
            templates: ServiceTemplate[]
        }) => {
            const rows = templates.map((t, i) => ({
                master_id,
                name: t.name,
                duration_minutes: t.duration_minutes,
                price: t.price,
                price_from: t.price_from ?? false,
                category: t.category,
                sort_order: i,
                is_active: true,
            }))
            const { error } = await supabase.from('services').insert(rows)
            if (error) throw error
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['services_all', variables.master_id] })
            queryClient.invalidateQueries({ queryKey: ['services', variables.master_id] })
        },
    })
}
