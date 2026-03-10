// In-memory store (resets on redeploy — fine for demo)
const store = {
  conversations: new Map(),
  metrics: {
    totalCalls: 0,
    totalReservations: 0,
    totalCancellations: 0,
    avgCallDuration: 0,
    callDurations: [],
    keywords: {},
    queries: {},
    callLog: [],
    dailyCalls: {},
    peakHours: {},
  },
  reservations: [
    { id: 1, name: 'María García', date: '2026-03-12', time: '14:00', guests: 4, phone: '+34 612 345 678', status: 'confirmada', notes: 'Cumpleaños', source: 'agente-voz' },
    { id: 2, name: 'Carlos López', date: '2026-03-12', time: '21:00', guests: 2, phone: '+34 698 765 432', status: 'confirmada', notes: '', source: 'agente-voz' },
    { id: 3, name: 'Ana Martínez', date: '2026-03-13', time: '13:30', guests: 6, phone: '+34 655 123 456', status: 'pendiente', notes: 'Terraza si es posible', source: 'agente-voz' },
    { id: 4, name: 'Pedro Ruiz', date: '2026-03-13', time: '14:00', guests: 3, phone: '+34 611 222 333', status: 'confirmada', notes: 'Menú degustación', source: 'agente-voz' },
    { id: 5, name: 'Laura Sánchez', date: '2026-03-14', time: '21:00', guests: 8, phone: '+34 677 888 999', status: 'confirmada', notes: 'Aniversario - mesa privada', source: 'agente-voz' },
    { id: 6, name: 'Roberto Fernández', date: '2026-03-14', time: '13:00', guests: 2, phone: '+34 644 555 666', status: 'cancelada', notes: '', source: 'agente-voz' },
    { id: 7, name: 'Isabel Torres', date: '2026-03-15', time: '14:00', guests: 5, phone: '+34 633 444 555', status: 'pendiente', notes: 'Preguntó por mascotas', source: 'agente-voz' },
  ],
  clients: [
    { id: 1, name: 'María García', phone: '+34 612 345 678', visits: 3, lastVisit: '2026-03-05', totalSpent: 285, tags: ['cumpleaños', 'habitual'] },
    { id: 2, name: 'Carlos López', phone: '+34 698 765 432', visits: 1, lastVisit: '2026-02-20', totalSpent: 75, tags: ['nuevo'] },
    { id: 3, name: 'Ana Martínez', phone: '+34 655 123 456', visits: 5, lastVisit: '2026-03-01', totalSpent: 420, tags: ['terraza', 'habitual', 'grupos'] },
    { id: 4, name: 'Pedro Ruiz', phone: '+34 611 222 333', visits: 2, lastVisit: '2026-02-28', totalSpent: 190, tags: ['degustación'] },
    { id: 5, name: 'Laura Sánchez', phone: '+34 677 888 999', visits: 4, lastVisit: '2026-03-08', totalSpent: 560, tags: ['eventos', 'habitual', 'aniversario'] },
  ],
};

// Keyword detection
const KEYWORDS_MAP = {
  'mascota': 'Mascotas', 'mascotas': 'Mascotas', 'perro': 'Mascotas', 'gato': 'Mascotas', 'animal': 'Mascotas',
  'terraza': 'Terraza', 'exterior': 'Terraza', 'fuera': 'Terraza',
  'evento': 'Eventos', 'eventos': 'Eventos', 'celebración': 'Eventos', 'fiesta': 'Eventos', 'boda': 'Eventos',
  'cumpleaños': 'Cumpleaños', 'aniversario': 'Aniversario',
  'grupo': 'Grupos', 'grupos': 'Grupos',
  'vegetariano': 'Vegetariano', 'vegetariana': 'Vegetariano', 'vegano': 'Vegano',
  'alergia': 'Alergias', 'alergias': 'Alergias', 'celiaco': 'Alergias', 'sin gluten': 'Alergias',
  'niño': 'Niños', 'niños': 'Niños', 'infantil': 'Niños', 'trona': 'Niños',
  'parking': 'Parking', 'aparcamiento': 'Parking',
  'degustación': 'Menú Degustación', 'degustacion': 'Menú Degustación',
  'bodega': 'Bodega/Vinos', 'vino': 'Bodega/Vinos', 'vinos': 'Bodega/Vinos',
  'privado': 'Sala Privada', 'sala privada': 'Sala Privada', 'reservado': 'Sala Privada',
  'ternasco': 'Ternasco', 'picasso': 'Les Perdius',
  'precio': 'Precios', 'precios': 'Precios',
  'celíaco': 'Alergias', 'celiaca': 'Alergias', 'intolerancia': 'Alergias', 'intolerante': 'Alergias',
  'marisco': 'Alergias', 'lactosa': 'Alergias', 'frutos secos': 'Alergias',
  'cumple': 'Cumpleaños', 'comunión': 'Eventos', 'comunion': 'Eventos', 'bautizo': 'Eventos',
  'trona': 'Niños', 'bebé': 'Niños', 'bebe': 'Niños',
  'accesible': 'Accesibilidad', 'silla de ruedas': 'Accesibilidad', 'movilidad reducida': 'Accesibilidad',
};

export function detectKeywords(text) {
  const lower = text.toLowerCase();
  const detected = new Set();
  for (const [trigger, category] of Object.entries(KEYWORDS_MAP)) {
    if (lower.includes(trigger)) {
      detected.add(category);
      store.metrics.keywords[category] = (store.metrics.keywords[category] || 0) + 1;
    }
  }
  return [...detected];
}

export function detectIntent(text) {
  const l = text.toLowerCase();
  // Check modification BEFORE reservation (more specific)
  if (l.match(/modificar|cambiar.*reserva|mover.*reserva|reagendar|recolocar|cambiar.*hora|cambiar.*día|cambiar.*dia|mover.*mesa|pasar.*otro día|pasar.*otro dia/)) return 'modificación';
  // Check cancellation (including colloquial expressions)
  if (l.match(/cancel|anular|no puedo ir|quitar.*reserva|borrar.*reserva|no vamos a ir|al final no|olvídate|olvidate|no hace falta|se nos ha complicado|déjalo|dejalo/)) return 'cancelación';
  // Check reservation (including colloquial expressions)
  if (l.match(/reserv|mesa para|quiero mesa|disponibilidad|apartar mesa|coger sitio|guardar.*mesa|apuntarme|hay hueco|hay algo libre|hay sitio/)) return 'reserva';
  if (l.match(/horario|abierto|cerrado|hora.*abr|qué días|que dias|cuándo abr|cuando abr/)) return 'consulta_horario';
  if (l.match(/carta|menú|menu|plato|comer|cenar|recomiend|vegetarian|vegano|sin gluten|celíac|celiac|alérg|alerg/)) return 'consulta_carta';
  if (l.match(/dirección|dónde|donde.*está|llegar|ubicación|ubicacion|cómo llego|como llego/)) return 'consulta_ubicación';
  if (l.match(/precio|cuánto|cuanto|cuesta/)) return 'consulta_precio';
  if (l.match(/terraza|exterior|fuera/)) return 'consulta_terraza';
  if (l.match(/evento|celebra|cumpleaños|grupo|boda|comunión|comunion|aniversario/)) return 'consulta_eventos';
  if (l.match(/mascota|perro|gato|animal/)) return 'consulta_mascotas';
  return 'consulta_general';
}

export default store;
