
import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type Booking } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function cancelBooking(bookingId: number, userId: number): Promise<Booking | null> {
  try {
    // Update booking status to cancelled and payment status to refunded
    const result = await db.update(bookingsTable)
      .set({ 
        status: 'cancelled',
        payment_status: 'refunded',
        updated_at: new Date()
      })
      .where(and(
        eq(bookingsTable.id, bookingId),
        eq(bookingsTable.user_id, userId)
      ))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    const booking = result[0];
    return {
      ...booking,
      total_amount: parseFloat(booking.total_amount)
    };
  } catch (error) {
    console.error('Booking cancellation failed:', error);
    throw error;
  }
}
