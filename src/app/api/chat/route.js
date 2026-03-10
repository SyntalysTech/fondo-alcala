import OpenAI from 'openai';
import store, { detectKeywords, detectIntent } from '@/lib/store';
import { SYSTEM_PROMPT } from '@/lib/prompt';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Background: extract reservation data from conversation and save to store
async function extractAndSaveReservation(conv, sessionId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const chatHistory = conv
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'Cliente' : 'Elena'}: ${m.content}`)
      .join('\n');

    const extraction = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extrae los datos de la reserva de esta conversación. Devuelve SOLO JSON válido con estos campos:
{"name":"nombre del cliente","date":"YYYY-MM-DD","time":"HH:MM","guests":número,"phone":null,"notes":"notas relevantes o null"}
Hoy es ${today}. Si dicen "mañana" usa el día siguiente. Si dicen "viernes" calcula la fecha. Si no hay dato claro, usa valores por defecto razonables.`
        },
        { role: 'user', content: chatHistory }
      ],
      temperature: 0,
      max_tokens: 120,
      response_format: { type: 'json_object' },
    });

    const data = JSON.parse(extraction.choices[0].message.content);

    // Add reservation
    store.reservations.push({
      id: Date.now(),
      name: data.name || 'Cliente',
      date: data.date || today,
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
      existing.lastVisit = data.date || today;
    } else {
      store.clients.push({
        id: Date.now(),
        name: clientName,
        phone: data.phone || '',
        visits: 1,
        lastVisit: data.date || today,
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
          content: 'Extrae el nombre del cliente que cancela la reserva. Devuelve SOLO JSON: {"name":"nombre"}'
        },
        { role: 'user', content: chatHistory }
      ],
      temperature: 0,
      max_tokens: 50,
      response_format: { type: 'json_object' },
    });

    const data = JSON.parse(extraction.choices[0].message.content);
    if (data.name) {
      const res = store.reservations.find(r =>
        r.name.toLowerCase() === data.name.toLowerCase() && r.status !== 'cancelada'
      );
      if (res) res.status = 'cancelada';
    }
  } catch (e) {
    console.error('Cancellation extraction error:', e);
  }
}

export async function POST(req) {
  try {
    const { message, sessionId } = await req.json();
    const isNewCall = !store.conversations.has(sessionId);

    if (isNewCall) {
      store.conversations.set(sessionId, [{ role: 'system', content: SYSTEM_PROMPT }]);
      store.metrics.totalCalls++;
      const today = new Date().toISOString().split('T')[0];
      store.metrics.dailyCalls[today] = (store.metrics.dailyCalls[today] || 0) + 1;
      const hour = new Date().getHours();
      store.metrics.peakHours[hour] = (store.metrics.peakHours[hour] || 0) + 1;
    }

    const conv = store.conversations.get(sessionId);
    conv.push({ role: 'user', content: message });

    const keywords = detectKeywords(message);
    const intent = detectIntent(message);
    store.metrics.queries[intent] = (store.metrics.queries[intent] || 0) + 1;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conv,
      temperature: 0.7,
      max_tokens: 80,
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

        const lower = fullText.toLowerCase();
        const isReservation = !!lower.match(/queda (anotada|registrada|confirmada)|les esperamos|os esperamos/);
        const isCancellation = !!lower.match(/cancelada|anulada/);

        if (isReservation) {
          store.metrics.totalReservations++;
          // Extract and save reservation in background (no await = no latency)
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

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, response: fullText, keywords, intent, isNewCall })}\n\n`));
        controller.close();
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
