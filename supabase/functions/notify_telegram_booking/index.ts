import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

interface BookingPayload {
  record: {
    id: string;
    master_id: string;
    client_name: string | null;
    client_phone: string | null;
    date: string;
    start_time: string;
    end_time: string;
    total_price: number;
    total_minutes: number;
    status: string;
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function getMasterChatId(masterId: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/masters?id=eq.${masterId}&select=telegram_chat_id`,
    {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  const data = await res.json();
  return data?.[0]?.telegram_chat_id ?? null;
}

async function sendMessage(chatId: string, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU");
}

Deno.serve(async (req: Request) => {
  try {
    const payload: BookingPayload = await req.json();
    const booking = payload.record;

    if (booking.status !== "upcoming") {
      return new Response("Skipped (not upcoming)", { status: 200 });
    }

    const chatId = await getMasterChatId(booking.master_id);
    if (!chatId) {
      return new Response("No telegram_chat_id for this master", { status: 200 });
    }

    const message =
      `🎉 <b>Новая запись!</b>\n\n` +
      `👤 <b>Клиент:</b> ${booking.client_name ?? "Без имени"}\n` +
      `📞 <b>Телефон:</b> ${booking.client_phone ?? "Не указан"}\n` +
      `📅 <b>Дата:</b> ${formatDate(booking.date)}\n` +
      `⏰ <b>Время:</b> ${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}\n` +
      `💰 <b>Сумма:</b> ${formatPrice(booking.total_price)} ₽`;

    await sendMessage(chatId, message);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
