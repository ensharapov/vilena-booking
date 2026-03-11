-- ================================================================
-- МИГРАЦИЯ: Добавить telegram_chat_id в таблицу masters
-- Запустите этот файл ВМЕСТО полного supabase_schema.sql,
-- если база данных уже создана и содержит данные!
-- ================================================================

ALTER TABLE public.masters
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

COMMENT ON COLUMN public.masters.telegram_chat_id
  IS 'Telegram Chat ID мастера для отправки уведомлений о новых записях';
