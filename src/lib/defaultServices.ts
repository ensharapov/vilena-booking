export interface ServiceTemplate {
  name: string
  duration_minutes: number
  price: number
  price_from?: boolean
  category: string
}

export const DEFAULT_SERVICES: Record<string, ServiceTemplate[]> = {
  барбер: [
    { name: 'Мужская стрижка', duration_minutes: 45, price: 800, category: 'Стрижки' },
    { name: 'Детская стрижка', duration_minutes: 30, price: 500, category: 'Стрижки' },
    { name: 'Стрижка + борода', duration_minutes: 60, price: 1200, category: 'Стрижки' },
    { name: 'Оформление бороды', duration_minutes: 30, price: 500, category: 'Борода' },
    { name: 'Бритьё опасной бритвой', duration_minutes: 40, price: 600, category: 'Борода' },
    { name: 'Укладка', duration_minutes: 20, price: 300, category: 'Укладка' },
  ],
  'мастер ногтевого сервиса': [
    { name: 'Маникюр', duration_minutes: 60, price: 1200, category: 'Маникюр' },
    { name: 'Маникюр + покрытие гель-лаком', duration_minutes: 90, price: 1800, category: 'Маникюр' },
    { name: 'Педикюр', duration_minutes: 60, price: 1500, category: 'Педикюр' },
    { name: 'Педикюр + покрытие', duration_minutes: 90, price: 2000, category: 'Педикюр' },
    { name: 'Снятие покрытия', duration_minutes: 20, price: 300, category: 'Маникюр' },
    { name: 'Наращивание ногтей', duration_minutes: 120, price: 3000, price_from: true, category: 'Наращивание' },
  ],
  парикмахер: [
    { name: 'Женская стрижка', duration_minutes: 60, price: 1200, price_from: true, category: 'Стрижки' },
    { name: 'Мужская стрижка', duration_minutes: 40, price: 700, category: 'Стрижки' },
    { name: 'Детская стрижка', duration_minutes: 30, price: 500, category: 'Стрижки' },
    { name: 'Укладка', duration_minutes: 45, price: 1000, price_from: true, category: 'Укладка' },
    { name: 'Прическа', duration_minutes: 60, price: 2500, price_from: true, category: 'Укладка' },
    { name: 'Окрашивание', duration_minutes: 120, price: 3000, price_from: true, category: 'Окрашивание' },
    { name: 'Мелирование', duration_minutes: 90, price: 2500, price_from: true, category: 'Окрашивание' },
    { name: 'Уход за волосами', duration_minutes: 60, price: 1500, price_from: true, category: 'Уход' },
  ],
  косметолог: [
    { name: 'Чистка лица', duration_minutes: 60, price: 2000, category: 'Уход за лицом' },
    { name: 'Пилинг', duration_minutes: 45, price: 1500, category: 'Уход за лицом' },
    { name: 'Массаж лица', duration_minutes: 45, price: 1500, category: 'Уход за лицом' },
    { name: 'Коррекция бровей', duration_minutes: 30, price: 600, category: 'Брови/ресницы' },
    { name: 'Окрашивание бровей', duration_minutes: 30, price: 500, category: 'Брови/ресницы' },
    { name: 'Наращивание ресниц', duration_minutes: 120, price: 2500, price_from: true, category: 'Брови/ресницы' },
  ],
  массажист: [
    { name: 'Массаж спины', duration_minutes: 30, price: 1000, category: 'Массаж' },
    { name: 'Массаж всего тела', duration_minutes: 60, price: 2000, category: 'Массаж' },
    { name: 'Антицеллюлитный массаж', duration_minutes: 60, price: 2000, category: 'Массаж' },
    { name: 'Расслабляющий массаж', duration_minutes: 60, price: 1800, category: 'Массаж' },
    { name: 'Массаж лица и шеи', duration_minutes: 30, price: 1000, category: 'Массаж лица' },
  ],
}

/**
 * Найти дефолтные услуги по специальности мастера (регистронезависимо).
 * Возвращает массив шаблонов или null, если специальность не найдена.
 */
export function getDefaultServices(specialty: string | null | undefined): ServiceTemplate[] | null {
  if (!specialty) return null
  const key = specialty.toLowerCase().trim()
  // Точное совпадение
  if (DEFAULT_SERVICES[key]) return DEFAULT_SERVICES[key]
  // Частичное совпадение (например "барбер-стилист" → "барбер")
  const match = Object.keys(DEFAULT_SERVICES).find((k) => key.includes(k) || k.includes(key))
  return match ? DEFAULT_SERVICES[match] : null
}
