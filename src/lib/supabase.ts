import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ===== Типы БД =====

export interface DBMaster {
    id: string
    user_id: string | null
    slug: string | null
    name: string
    specialty: string | null
    city: string | null
    address: string | null
    phone: string | null
    social_links: Record<string, string>
    avatar_url: string | null
    cover_url: string | null
    rating: number
    review_count: number
    is_active: boolean
    created_at: string
}

export interface DBService {
    id: string
    master_id: string
    name: string
    duration_minutes: number
    price: number
    price_from: boolean
    category: string | null
    sort_order: number
    is_active: boolean
}

export interface DBClient {
    id: string
    phone: string
    name: string | null
    created_at: string
}

export interface DBBooking {
    id: string
    master_id: string
    client_id: string | null
    client_name: string | null
    client_phone: string | null
    date: string
    start_time: string
    end_time: string
    total_minutes: number
    total_price: number
    status: 'upcoming' | 'completed' | 'cancelled' | 'no_show'
    notes: string | null
    created_at: string
}

export interface DBWorkingShift {
    id: string
    master_id: string
    date: string
    start_time: string
    end_time: string
    is_active: boolean
}
