import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function saveChatId(masterId: string, chatId: number): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/masters?id=eq.${masterId}`,
    {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ telegram_chat_id: String(chatId) }),
    }
  );
  return res.ok;
}

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

Deno.serve(async (req: Request) => {
  try {
    const update = await req.json();

    // Обрабатываем только текстовые сообщения
    const message = update?.message;
    if (!message?.text) {
      return new Response("ok", { status: 200 });
    }

    const chatId: number = message.chat.id;
    const text: string = message.text;
    const firstName: string = message.from?.first_name ?? "Мастер";

    // /start MASTER_UUID — автоподключение уведомлений
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const masterId = parts[1]?.trim();

      if (!masterId) {
        await sendMessage(chatId,
          `👋 Привет, ${firstName}!\n\nЯ буду присылать тебе уведомления о новых записях.\n\nЧтобы подключить уведомления — открой приложение и нажми кнопку «Подключить Telegram» в настройках.`
        );
        return new Response("ok", { status: 200 });
      }

      const saved = await saveChatId(masterId, chatId);

      if (saved) {
        await sendMessage(chatId,
          `🎉 <b>Уведомления подключены!</b>\n\nТеперь я буду присылать тебе сообщение каждый раз, когда придёт новая запись.\n\n✅ Всё готово — можешь закрыть Telegram и вернуться в приложение.`
        );
      } else {
        await sendMessage(chatId,
          `😔 Что-то пошло не так. Попробуй ещё раз через приложение.`
        );
      }

      return new Response("ok", { status: 200 });
    }

    // Любое другое сообщение
    await sendMessage(chatId,
      `👋 Этот бот отправляет уведомления о новых записях.\n\nОткрой приложение и нажми «Подключить Telegram» в настройках — я сам всё настрою.`
    );

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("ok", { status: 200 }); // всегда 200 для Telegram
  }
});
