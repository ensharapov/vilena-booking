/**
 * Форматирует дату в строку YYYY-MM-DD в локальном часовом поясе.
 * Решает баг с toISOString().split('T')[0], который в UTC+3 после полуночи
 * возвращает предыдущий день.
 */
export function formatLocalDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
