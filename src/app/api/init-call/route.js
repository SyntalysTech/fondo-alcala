import store from '@/lib/store';
import { getSystemPrompt } from '@/lib/prompt';

const GREETING = 'Hola, buenas, le atiende Elena desde Fonda Alcalá. ¿En qué puedo ayudarle?';

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    // Create conversation with the exact hardcoded greeting so context stays in sync
    store.conversations.set(sessionId, [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: 'Hola, acabo de llamar al restaurante.' },
      { role: 'assistant', content: GREETING },
    ]);

    store.metrics.totalCalls++;
    const today = new Date().toISOString().split('T')[0];
    store.metrics.dailyCalls[today] = (store.metrics.dailyCalls[today] || 0) + 1;
    const hour = new Date().getHours();
    store.metrics.peakHours[hour] = (store.metrics.peakHours[hour] || 0) + 1;

    // Don't log the init greeting - it's not useful in the historial
    // Only real user interactions will be logged via /api/chat

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
