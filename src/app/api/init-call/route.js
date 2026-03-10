import store from '@/lib/store';
import { SYSTEM_PROMPT } from '@/lib/prompt';

const GREETING = 'Hola, buenas, le atiende Elena desde Fonda Alcalá. ¿En qué puedo ayudarle?';

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    // Create conversation with the exact hardcoded greeting so context stays in sync
    store.conversations.set(sessionId, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: 'Hola, acabo de llamar al restaurante.' },
      { role: 'assistant', content: GREETING },
    ]);

    store.metrics.totalCalls++;
    const today = new Date().toISOString().split('T')[0];
    store.metrics.dailyCalls[today] = (store.metrics.dailyCalls[today] || 0) + 1;
    const hour = new Date().getHours();
    store.metrics.peakHours[hour] = (store.metrics.peakHours[hour] || 0) + 1;

    store.metrics.callLog.push({
      timestamp: new Date().toISOString(),
      sessionId,
      userMessage: '(inicio de llamada)',
      agentResponse: GREETING,
      intent: 'consulta_general',
      keywords: [],
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
