import store from '@/lib/store';

export async function POST(req) {
  const { sessionId, duration } = await req.json();
  if (duration) {
    store.metrics.callDurations.push(duration);
    store.metrics.avgCallDuration = Math.round(
      store.metrics.callDurations.reduce((a, b) => a + b, 0) / store.metrics.callDurations.length
    );
  }
  store.conversations.delete(sessionId);
  return Response.json({ success: true });
}
