
import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Booking } from '../schema';

export async function getUserBookings(userId: number): Promise<Booking[]> {
  try {
    const results = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.user_id, userId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(booking => ({
      ...booking,
      total_amount: parseFloat(booking.total_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch user bookings:', error);
    throw error;
  }
}
