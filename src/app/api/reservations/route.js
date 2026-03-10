import store from '@/lib/store';

// PATCH - Update reservation (notes, status, etc.)
export async function PATCH(req) {
  try {
    const { id, ...updates } = await req.json();
    const reservation = store.reservations.find(r => r.id === id);
    if (!reservation) {
      return Response.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Only allow updating specific fields
    const allowedFields = ['notes', 'status', 'name', 'date', 'time', 'guests', 'phone'];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        reservation[key] = value;
      }
    }

    return Response.json({ success: true, reservation });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove reservation permanently
export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const index = store.reservations.findIndex(r => r.id === id);
    if (index === -1) {
      return Response.json({ error: 'Reservation not found' }, { status: 404 });
    }

    store.reservations.splice(index, 1);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
