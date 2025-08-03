
import { db } from '../db';
import { bookingsTable, venuesTable, groupsTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export async function createBooking(input: CreateBookingInput, userId: number): Promise<Booking> {
  try {
    // Verify venue exists
    const venue = await db.select()
      .from(venuesTable)
      .where(eq(venuesTable.id, input.venue_id))
      .execute();

    if (venue.length === 0) {
      throw new Error('Venue not found');
    }

    // Verify group exists if group_id is provided
    if (input.group_id) {
      const group = await db.select()
        .from(groupsTable)
        .where(eq(groupsTable.id, input.group_id))
        .execute();

      if (group.length === 0) {
        throw new Error('Group not found');
      }
    }

    // Calculate total amount based on venue price range and guest count
    const venueData = venue[0];
    const pricePerPerson = parseFloat(venueData.price_range_min);
    const totalAmount = pricePerPerson * input.guest_count;

    // Generate unique confirmation code
    const confirmationCode = 'BB' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Insert booking record
    const result = await db.insert(bookingsTable)
      .values({
        venue_id: input.venue_id,
        user_id: userId,
        group_id: input.group_id || null,
        booking_date: input.booking_date,
        start_time: input.start_time,
        end_time: input.end_time || null,
        guest_count: input.guest_count,
        total_amount: totalAmount.toString(),
        special_requests: input.special_requests || null,
        confirmation_code: confirmationCode
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const booking = result[0];
    return {
      ...booking,
      total_amount: parseFloat(booking.total_amount)
    };
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
}
