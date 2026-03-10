import OpenAI from 'openai';
import store, { detectKeywords, detectIntent } from '@/lib/store';
import { getSystemPrompt } from '@/lib/prompt';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache system prompt — recalculate only every 60s (date/time changes)
let _cachedPrompt = null;
let _promptCacheTime = 0;
function getCachedSystemPrompt() {
  const now = Date.now();
  if (!_cachedPrompt || now - _promptCacheTime > 60000) {
    _cachedPrompt = getSystemPrompt();
    _promptCacheTime = now;
  }
  return _cachedPrompt;
}

// Helper: get today and day-of-week info for extraction prompts
function getDateContext() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay();
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const todayName = dayNames[dayOfWeek];

  // Pre-calculate useful dates
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  // Next occurrence of each weekday
  const nextDays = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    const daysUntil = (i - dayOfWeek + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntil);
    nextDays[dayNames[i]] = d.toISOString().split('T')[0];
  }

  return { today, tomorrowStr, dayAfterTomorrowStr, todayName, nextDays, month: now.getMonth() + 1, year: now.getFullYear() };
}

// Background: extract reservation data from conversation and save to store
async function extractAndSaveReservation(conv, sessionId) {
  try {
    const ctx = getDateContext();
    const chatHistory = conv
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Elena'}: ${m.content}`)
      .join('\n');

    const extraction = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extrae los datos de la ÚLTIMA reserva confirmada en esta conversación. Devuelve SOLO JSON válido:
{"name":"nombre del cliente","date":"YYYY-MM-DD","time":"HH:MM","guests":número,"phone":null,"notes":"notas relevantes o null","is_reschedule":boolean,"old_name":"nombre si es reagenda"}

CONTEXTO DE FECHAS MUY IMPORTANTE:
- Hoy es ${ctx.today} (${ctx.todayName})
- "mañana" = ${ctx.tomorrowStr}
- "pasado mañana" = ${ctx.dayAfterTomorrowStr}
- "el lunes" = ${ctx.nextDays.lunes}, "el martes" = ${ctx.nextDays.martes}, "el miércoles" = ${ctx.nextDays.miércoles}, "el jueves" = ${ctx.nextDays.jueves}, "el viernes" = ${ctx.nextDays.viernes}, "el sábado" = ${ctx.nextDays.sábado}, "el domingo" = ${ctx.nextDays.domingo}
- Si mencionan "el día X" (ej: "el día 17"), usa ${ctx.year}-${String(ctx.month).padStart(2,'0')}-{dia con 2 dígitos}. Si ese día ya pasó, usa el mes siguiente.
- "la semana que viene" = 7 días después de hoy

REGLAS DE EXTRACCIÓN:
- Si dicen "los mismos" comensales, busca el número de la reserva anterior mencionada en la conversación.
- Si dicen "uno menos" o "uno más", ajusta desde el número original.
- Si dicen "con mi pareja/madre/padre/hijo/hermano/amigo" = 2 personas.
- Si la conversación muestra una reagenda (cancelar una y crear otra), pon is_reschedule=true y old_name con el nombre del cliente.
- El campo time debe ser en formato 24h (14:00, no 2:00).
- Para notas, incluye alergias, preferencias especiales, cumpleaños, etc. NO incluir datos básicos de la reserva.`
        },
        { role: 'user', content: chatHistory }
      ],
      temperature: 0,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const data = JSON.parse(extraction.choices[0].message.content);

    // If it's a reschedule, cancel the old reservation first
    if (data.is_reschedule && data.old_name) {
      const oldRes = store.reservations.find(r =>
        r.name.toLowerCase() === data.old_name.toLowerCase() && r.status !== 'cancelada'
      );
      if (oldRes) oldRes.status = 'cancelada';
    }

    // Add new reservation
    store.reservations.push({
      id: Date.now(),
      name: data.name || 'Cliente',
      date: data.date || ctx.today,
      time: data.time || '14:00',
      guests: data.guests || 2,
      phone: data.phone || '',
      status: 'confirmada',
      notes: data.notes || '',
      source: 'agente-voz',
    });

    // Add or update client
    const clientName = data.name || 'Cliente';
    const existing = store.clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (existing) {
      existing.visits++;
      existing.lastVisit = data.date || ctx.today;
    } else {
      store.clients.push({
        id: Date.now(),
        name: clientName,
        phone: data.phone || '',
        visits: 1,
        lastVisit: data.date || ctx.today,
        totalSpent: 0,
        tags: ['nuevo', 'agente-voz'],
      });
    }
  } catch (e) {
    console.error('Reservation extraction error:', e);
  }
}

// Background: handle cancellation from conversation
async function extractAndCancelReservation(conv) {
  try {
    const chatHistory = conv
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Elena'}: ${m.content}`)
      .join('\n');

    const extraction = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extrae los datos del cliente que cancela la reserva. Devuelve SOLO JSON: {"name":"nombre","date":"YYYY-MM-DD o null","time":"HH:MM o null"}
Si mencionan la fecha y/o hora de la reserva a cancelar, inclúyelos para identificar la reserva correcta.`
        },
        { role: 'user', content: chatHistory }
      ],
      temperature: 0,
      max_tokens: 80,
      response_format: { type: 'json_object' },
    });

    const data = JSON.parse(extraction.choices[0].message.content);
    if (data.name) {
      // Try to find the most specific match
      let res = null;
      const candidates = store.reservations.filter(r =>
        r.name.toLowerCase() === data.name.toLowerCase() && r.status !== 'cancelada'
      );

      if (candidates.length === 1) {
        res = candidates[0];
      } else if (candidates.length > 1) {
        // Try matching by date and/or time
        res = candidates.find(r =>
          (data.date ? r.date === data.date : true) &&
          (data.time ? r.time === data.time : true)
        ) || candidates[0];
      }

      if (res) res.status = 'cancelada';
    }
  } catch (e) {
    console.error('Cancellation extraction error:', e);
  }
}

export async function POST(req) {
  try {
    const { message, sessionId, history } = await req.json();
    const isNewCall = !store.conversations.has(sessionId);

    if (isNewCall) {
      store.metrics.totalCalls++;
      const today = new Date().toISOString().split('T')[0];
      store.metrics.dailyCalls[today] = (store.metrics.dailyCalls[today] || 0) + 1;
      const hour = new Date().getHours();
      store.metrics.peakHours[hour] = (store.metrics.peakHours[hour] || 0) + 1;
    }

    // Build conversation from client-sent history (serverless-safe: instances don't share memory)
    const conv = [
      { role: 'system', content: getCachedSystemPrompt() },
      ...(history || []).map(m => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.text,
      })),
      { role: 'user', content: message },
    ];

    // Store for extraction (best-effort on same instance)
    store.conversations.set(sessionId, conv);

    const keywords = detectKeywords(message);
    const intent = detectIntent(message);
    store.metrics.queries[intent] = (store.metrics.queries[intent] || 0) + 1;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conv,
      temperature: 0.3,
      max_tokens: 150,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullText = '';

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ d: delta })}\n\n`));
          }
        }

        conv.push({ role: 'assistant', content: fullText });

        // Send done event IMMEDIATELY — logging/extraction happens after (non-blocking)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, response: fullText, keywords, intent, isNewCall })}\n\n`));
        controller.close();

        // Background: metrics and extraction (after response is sent)
        const lower = fullText.toLowerCase();
        const isReservation = !!lower.match(/queda (anotada|registrada|confirmada)|les esperamos|os esperamos|reserva para \d+ persona/);
        const isCancellation = !!lower.match(/cancelada|anulada|queda cancelada/);

        if (isReservation) {
          store.metrics.totalReservations++;
          extractAndSaveReservation([...conv], sessionId);
        }
        if (isCancellation) {
          store.metrics.totalCancellations++;
          extractAndCancelReservation([...conv]);
        }

        store.metrics.callLog.push({
          timestamp: new Date().toISOString(),
          sessionId,
          userMessage: message,
          agentResponse: fullText,
          intent,
          keywords,
        });
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
