import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Scissors, Clock, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useServices, useAddService, useUpdateService, useDeleteService, useImportDefaultServices } from '@/hooks/useServices'
import { getDefaultServices } from '@/lib/defaultServices'
import type { DBService } from '@/lib/supabase'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

// ─── Форма добавления/редактирования ────────────────────────────────────────
interface ServiceFormProps {
  masterId: string
  service?: DBService | null
  onClose: () => void
}

function ServiceForm({ masterId, service, onClose }: ServiceFormProps) {
  const { toast } = useToast()
  const addService = useAddService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  const [name, setName] = useState(service?.name ?? '')
  const [category, setCategory] = useState(service?.category ?? '')
  const [duration, setDuration] = useState(String(service?.duration_minutes ?? 60))
  const [price, setPrice] = useState(String(service?.price ?? ''))
  const [priceFrom, setPriceFrom] = useState(service?.price_from ?? false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isEditing = !!service
  const isPending = addService.isPending || updateService.isPending || deleteService.isPending

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Введите название услуги', variant: 'destructive' })
      return
    }
    const durationNum = parseInt(duration)
    const priceNum = parseInt(price)
    if (isNaN(durationNum) || durationNum <= 0) {
      toast({ title: 'Введите корректную длительность', variant: 'destructive' })
      return
    }
    if (isNaN(priceNum) || priceNum < 0) {
      toast({ title: 'Введите корректную цену', variant: 'destructive' })
      return
    }

    try {
      if (isEditing && service) {
        await updateService.mutateAsync({
          id: service.id,
          master_id: masterId,
          name: name.trim(),
          category: category.trim() || undefined,
          duration_minutes: durationNum,
          price: priceNum,
          price_from: priceFrom,
        })
        toast({ title: 'Услуга обновлена' })
      } else {
        await addService.mutateAsync({
          master_id: masterId,
          name: name.trim(),
          category: category.trim() || undefined,
          duration_minutes: durationNum,
          price: priceNum,
          price_from: priceFrom,
        })
        toast({ title: 'Услуга добавлена' })
      }
      onClose()
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить услугу', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!service) return
    try {
      await deleteService.mutateAsync({ id: service.id, master_id: masterId })
      toast({ title: 'Услуга удалена' })
      onClose()
    } catch {
      toast({ title: 'Ошибка при удалении', variant: 'destructive' })
    }
  }

  return (
    <div className="px-5 space-y-4">
      {/* Название */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
          Название
        </label>
        <input
          className="w-full h-11 rounded-xl bg-secondary border-0 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Например: Мужская стрижка"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Категория */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
          Категория
        </label>
        <input
          className="w-full h-11 rounded-xl bg-secondary border-0 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Например: Стрижки"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      {/* Длительность + Цена */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Длительность (мин)
          </label>
          <input
            type="number"
            min={5}
            step={5}
            className="w-full h-11 rounded-xl bg-secondary border-0 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
            Цена (₽)
          </label>
          <input
            type="number"
            min={0}
            step={50}
            className="w-full h-11 rounded-xl bg-secondary border-0 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
      </div>

      {/* Тоггл «Цена от» */}
      <button
        onClick={() => setPriceFrom((v) => !v)}
        className={`w-full flex items-center justify-between h-11 rounded-xl px-4 transition-colors ${
          priceFrom ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
        }`}
      >
        <span className="text-sm font-medium">Цена от (минимальная)</span>
        <div
          className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
            priceFrom ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              priceFrom ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </button>

      {/* Удалить (только при редактировании) */}
      {isEditing && (
        confirmDelete ? (
          <div className="rounded-xl bg-destructive/10 p-3 space-y-2">
            <p className="text-sm text-destructive text-center font-medium">Удалить услугу?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 h-9 rounded-lg bg-secondary text-sm font-medium text-foreground"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 h-9 rounded-lg bg-destructive text-sm font-medium text-white"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Удалить'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center gap-2 justify-center h-10 rounded-xl text-destructive text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Удалить услугу
          </button>
        )
      )}

      {/* Сохранить */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full btn-gradient h-12 flex items-center justify-center gap-2 font-semibold"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          isEditing ? 'Сохранить изменения' : 'Добавить услугу'
        )}
      </button>
    </div>
  )
}

// ─── Основная страница ───────────────────────────────────────────────────────
export default function Services() {
  const navigate = useNavigate()
  const { master } = useAuth()
  const { toast } = useToast()

  const { data: services = [], isLoading } = useServices(master?.id)
  const importDefaults = useImportDefaultServices()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingService, setEditingService] = useState<DBService | null>(null)

  // Только активные услуги для отображения
  const activeServices = useMemo(() => services.filter((s) => s.is_active), [services])

  // Группировка по категориям
  const grouped = useMemo(() => {
    const map = new Map<string, DBService[]>()
    for (const s of activeServices) {
      const cat = s.category || 'Без категории'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(s)
    }
    return map
  }, [activeServices])

  const defaultTemplates = getDefaultServices(master?.specialty)
  const hasDefaults = !!defaultTemplates && activeServices.length === 0

  const handleImportDefaults = async () => {
    if (!master?.id || !defaultTemplates) return
    try {
      await importDefaults.mutateAsync({ master_id: master.id, templates: defaultTemplates })
      toast({ title: `Загружено ${defaultTemplates.length} услуг`, description: 'Вы можете редактировать их в любой момент' })
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' })
    }
  }

  const openAdd = () => {
    setEditingService(null)
    setDrawerOpen(true)
  }

  const openEdit = (service: DBService) => {
    setEditingService(service)
    setDrawerOpen(true)
  }

  return (
    <div className="app-container bg-background min-h-screen">
      {/* Заголовок */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/more')} className="active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-heading text-2xl font-bold text-foreground">Мои услуги</h1>
          {activeServices.length > 0 && (
            <p className="text-muted-foreground text-xs mt-0.5">{activeServices.length} услуг</p>
          )}
        </div>
        <button
          onClick={openAdd}
          className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {/* Загрузка */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      )}

      {/* Предложение загрузить дефолтные */}
      {!isLoading && hasDefaults && (
        <div className="px-5 mt-4">
          <div className="card-premium p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Список услуг пуст</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Загрузить стандартный набор для специальности «{master?.specialty}»?
              </p>
            </div>
            <button
              onClick={handleImportDefaults}
              disabled={importDefaults.isPending}
              className="w-full btn-gradient h-11 flex items-center justify-center gap-2 font-semibold text-sm"
            >
              {importDefaults.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Загрузить {defaultTemplates.length} услуг
                </>
              )}
            </button>
            <button onClick={openAdd} className="w-full text-sm text-muted-foreground py-1">
              Добавить вручную
            </button>
          </div>
        </div>
      )}

      {/* Пустое состояние без дефолтных */}
      {!isLoading && !hasDefaults && activeServices.length === 0 && (
        <div className="px-5 mt-4">
          <div className="card-premium p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Scissors className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Услуги не добавлены</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Добавьте услуги, чтобы клиенты могли выбрать их при записи
              </p>
            </div>
            <button
              onClick={openAdd}
              className="w-full btn-gradient h-11 flex items-center justify-center gap-2 font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Добавить первую услугу
            </button>
          </div>
        </div>
      )}

      {/* Список услуг */}
      {!isLoading && activeServices.length > 0 && (
        <div className="px-5 pb-24 space-y-5">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {category}
              </p>
              <div className="space-y-2">
                {items.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => openEdit(service)}
                    className="w-full card-premium p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Scissors className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{service.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatMinutes(service.duration_minutes)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {service.price_from && <span className="font-normal text-muted-foreground">от </span>}
                        {service.price.toLocaleString('ru-RU')} ₽
                      </p>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground mt-1 ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      {!isLoading && activeServices.length > 0 && (
        <button
          onClick={openAdd}
          className="fixed bottom-20 right-1/2 translate-x-[185px] w-12 h-12 rounded-2xl btn-gradient flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Drawer для добавления/редактирования */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-w-[430px] mx-auto">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-heading text-xl">
              {editingService ? 'Редактировать услугу' : 'Новая услуга'}
            </DrawerTitle>
          </DrawerHeader>
          {master?.id && (
            <ServiceForm
              masterId={master.id}
              service={editingService}
              onClose={() => setDrawerOpen(false)}
            />
          )}
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <button className="w-full h-11 rounded-xl bg-secondary text-sm font-medium text-muted-foreground">
                Отмена
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
