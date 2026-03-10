import store from '@/lib/store';

export async function GET() {
  return Response.json({
    totalCalls: store.metrics.totalCalls,
    totalReservations: store.metrics.totalReservations,
    totalCancellations: store.metrics.totalCancellations,
    avgCallDuration: store.metrics.avgCallDuration,
    keywords: store.metrics.keywords,
    queries: store.metrics.queries,
    callLog: store.metrics.callLog.slice(-50),
    dailyCalls: store.metrics.dailyCalls,
    peakHours: store.metrics.peakHours,
    reservations: store.reservations,
    clients: store.clients,
  });
}
