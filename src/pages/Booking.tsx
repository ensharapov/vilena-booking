import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, CalendarDays, Check, Clock, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAvailableSlots } from '@/hooks/useAvailableSlots'
import { useWorkingDates, useMasterData } from '@/hooks/useMasterData'
import type { DBService } from '@/lib/supabase'

const RUSSIAN_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const RUSSIAN_MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]
const RUSSIAN_WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  const rh = Math.floor(total / 60) % 24
  const rm = total % 60
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`
}

const Booking = () => {
  const navigate = useNavigate()
  const { id: masterId = '1' } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [step, setStep] = useState(0)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  // ─── Данные из Supabase ───────────────────────────────────────
  const { masterQuery, servicesQuery } = useMasterData(masterId)
  const master = masterQuery.data
  const services: DBService[] = servicesQuery.data ?? []

  const { data: workingDates = [] } = useWorkingDates(master?.id ?? masterId, calYear, calMonth)

  // Итоговая длительность выбранных услуг (минуты)
  const totalMinutes = useMemo(() => {
    return services
      .filter((s) => selectedServiceIds.includes(s.id))
      .reduce((sum, s) => sum + s.duration_minutes, 0)
  }, [selectedServiceIds, services])

  // Итоговая цена
  const totalPrice = useMemo(() => {
    return services
      .filter((s) => selectedServiceIds.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0)
  }, [selectedServiceIds, services])

  // Доступные слоты для выбранной даты
  const { data: availableSlots = [], isLoading: slotsLoading } = useAvailableSlots({
    masterId: master?.id ?? masterId,
    date: selectedDate,
    sessionMinutes: totalMinutes,
  })

  const canBook =
    selectedServiceIds.length > 0 &&
    selectedDate !== null &&
    selectedTime !== null &&
    clientName.trim().length > 0 &&
    clientPhone.trim().length >= 10

  // ─── Действия ────────────────────────────────────────────────
  const toggleService = useCallback((id: string) => {
    setSelectedTime(null) // сбросить время при смене услуг
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }, [])

  const handleDateSelect = (day: number) => {
    setSelectedTime(null)
    setSelectedDate(new Date(calYear, calMonth, day))
  }

  const handleBook = async () => {
    if (!canBook || !selectedDate || !selectedTime) return
    setIsSubmitting(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const endTime = addMinutesToTime(selectedTime, totalMinutes)

      // Создаём запись
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          master_id: masterId,
          client_name: clientName,
          client_phone: clientPhone,
          date: dateStr,
          start_time: selectedTime,
          end_time: endTime,
          total_minutes: totalMinutes,
          total_price: totalPrice,
          status: 'upcoming',
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Привязываем услуги к записи
      const selectedServices = services.filter((s) =>
        selectedServiceIds.includes(s.id)
      )
      const bookingServices = selectedServices.map((s) => ({
        booking_id: booking.id,
        service_id: s.id,
        name: s.name,
        price: s.price,
        duration_minutes: s.duration_minutes,
      }))

      await supabase.from('booking_services').insert(bookingServices)

      toast({
        title: '✅ Запись подтверждена!',
        description: `${selectedDate.getDate()} ${RUSSIAN_MONTHS_GEN[calMonth]} в ${selectedTime}, ${formatMinutes(totalMinutes)}`,
      })
      navigate(`/master/${masterId}`)
    } catch (err: unknown) {
      toast({
        title: 'Ошибка записи',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Календарь ───────────────────────────────────────────────
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setSelectedDate(null); setSelectedTime(null)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setSelectedDate(null); setSelectedTime(null)
  }

  // ─── Loading state ────────────────────────────────────────────
  if (masterQuery.isLoading || servicesQuery.isLoading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // ─── Рендер ──────────────────────────────────────────────────
  return (
    <div className="app-container bg-background min-h-screen pb-36 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
          className="active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-heading text-lg font-bold text-foreground">
            {master?.name ?? 'Онлайн-запись'}
          </h1>
          <p className="text-muted-foreground text-xs">{master?.address}</p>
        </div>
      </div>

      {/* ── Step 0: Обзор шагов ── */}
      {step === 0 && (
        <div className="flex-1 px-5 pt-6 space-y-3 animate-fade-in">
          <h2 className="text-heading text-xl font-bold text-foreground mb-4">
            Онлайн-запись
          </h2>

          {/* Услуги */}
          <button
            onClick={() => setStep(1)}
            className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm">Услуги</h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                {selectedServiceIds.length > 0
                  ? `Выбрано: ${selectedServiceIds.length} · ${formatMinutes(totalMinutes)}`
                  : 'Выберите услугу'}
              </p>
            </div>
            {selectedServiceIds.length > 0 && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
          </button>

          {/* Дата и время */}
          <button
            onClick={() => setStep(2)}
            className="w-full card-premium p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm">День и время</h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                {selectedDate && selectedTime
                  ? `${selectedDate.getDate()} ${RUSSIAN_MONTHS_GEN[calMonth]}, ${selectedTime}`
                  : 'Выберите день и время'}
              </p>
            </div>
            {selectedDate && selectedTime && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
          </button>

          {/* Контактные данные */}
          {selectedServiceIds.length > 0 && selectedDate && selectedTime && (
            <div className="card-premium p-4 space-y-3 animate-fade-in">
              <h3 className="font-semibold text-foreground text-sm">Ваши данные</h3>
              <input
                type="text"
                placeholder="Ваше имя"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Выбор услуг ── */}
      {step === 1 && (
        <div className="flex-1 px-5 pt-6 animate-fade-in">
          <h2 className="text-heading text-xl font-bold text-foreground mb-4">
            Выберите услуги
          </h2>

          {/* Суммарное время */}
          {totalMinutes > 0 && (
            <div className="flex items-center gap-2 mb-4 text-sm text-primary font-medium">
              <Clock className="w-4 h-4" />
              Общее время: {formatMinutes(totalMinutes)}
            </div>
          )}

          <div className="space-y-0">
            {services.map((service, i) => {
              const isSelected = selectedServiceIds.includes(service.id)
              return (
                <div key={service.id}>
                  <button
                    onClick={() => toggleService(service.id)}
                    className={`w-full flex items-center justify-between py-4 text-left transition-colors ${isSelected ? 'bg-accent/30 -mx-2 px-2 rounded-xl' : ''
                      }`}
                  >
                    <div className="flex-1 pr-3">
                      <p className="font-medium text-foreground text-sm">{service.name}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {formatMinutes(service.duration_minutes)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-semibold text-sm whitespace-nowrap">
                        {service.price_from && 'от '}
                        {service.price.toLocaleString('ru-RU')} ₽
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-border'
                          }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  </button>
                  {i < services.length - 1 && <div className="h-px bg-border" />}
                </div>
              )
            })}
          </div>

          <button onClick={() => setStep(0)} className="w-full btn-gradient h-12 text-sm mt-6">
            Готово ({selectedServiceIds.length})
            {totalMinutes > 0 && ` · ${formatMinutes(totalMinutes)}`}
          </button>
        </div>
      )}

      {/* ── Step 2: Календарь + время ── */}
      {step === 2 && (
        <div className="flex-1 px-5 pt-6 animate-fade-in">
          {/* Заголовок с навигацией */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading text-xl font-bold text-foreground">
              {RUSSIAN_MONTHS[calMonth]} {calYear}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                ‹
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                ›
              </button>
            </div>
          </div>

          {/* Календарная сетка */}
          <div className="grid grid-cols-7 gap-0">
            {RUSSIAN_WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isAvailable = workingDates.includes(day)
              const isPast =
                new Date(calYear, calMonth, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate())
              const isSelected =
                selectedDate?.getDate() === day &&
                selectedDate?.getMonth() === calMonth &&
                selectedDate?.getFullYear() === calYear
              const isToday =
                day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear()

              return (
                <button
                  key={day}
                  onClick={() => !isPast && isAvailable && handleDateSelect(day)}
                  disabled={!isAvailable || isPast}
                  className={`relative flex flex-col items-center justify-center py-2 text-sm transition-all ${isSelected
                    ? 'bg-primary text-primary-foreground rounded-xl font-semibold'
                    : isToday
                      ? 'bg-accent rounded-xl font-semibold text-foreground'
                      : isAvailable && !isPast
                        ? 'text-foreground hover:bg-accent/50 rounded-xl cursor-pointer'
                        : 'text-muted-foreground/40 cursor-not-allowed'
                    }`}
                >
                  {day}
                  {day <= daysInMonth && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${isSelected
                        ? 'bg-primary-foreground'
                        : isAvailable && !isPast
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30'
                        }`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Легенда */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Запись открыта
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              Запись закрыта
            </div>
          </div>

          {/* Временные слоты */}
          {selectedDate && (
            <div className="mt-6 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">Доступное время</h3>
                {totalMinutes > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Сессия: {formatMinutes(totalMinutes)}
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Нет доступного времени на выбранную дату
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${selectedTime === slot
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-foreground hover:border-primary'
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {selectedTime && (
                <button onClick={() => setStep(0)} className="w-full btn-gradient h-12 text-sm mt-6">
                  Готово · {selectedTime}
                  {totalMinutes > 0 && ` — ${addMinutesToTime(selectedTime, totalMinutes)}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-md border-t border-border px-5 py-4 z-50">
        {selectedServiceIds.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-muted-foreground text-xs">Итого</span>
              {totalMinutes > 0 && (
                <span className="text-muted-foreground text-xs ml-2">
                  · {formatMinutes(totalMinutes)}
                </span>
              )}
            </div>
            <span className="text-foreground font-bold text-lg">
              {totalPrice > 0 ? `${totalPrice.toLocaleString('ru-RU')} ₽` : '—'}
            </span>
          </div>
        )}
        <button
          onClick={step === 0 ? handleBook : undefined}
          disabled={step === 0 ? !canBook || isSubmitting : false}
          className={`w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${step !== 0 || canBook
            ? 'btn-gradient'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {step === 0 ? 'Записаться' : 'Далее'}
        </button>
      </div>
    </div>
  )
}

export default Booking
