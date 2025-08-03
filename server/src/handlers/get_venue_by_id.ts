
import { db } from '../db';
import { venuesTable } from '../db/schema';
import { type Venue } from '../schema';
import { eq } from 'drizzle-orm';

export const getVenueById = async (venueId: number): Promise<Venue | null> => {
  try {
    const results = await db.select()
      .from(venuesTable)
      .where(eq(venuesTable.id, venueId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const venue = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...venue,
      price_range_min: parseFloat(venue.price_range_min),
      price_range_max: parseFloat(venue.price_range_max)
    };
  } catch (error) {
    console.error('Failed to get venue by ID:', error);
    throw error;
  }
};
