
import { db } from '../db';
import { favoritesTable, venuesTable } from '../db/schema';
import { type Venue } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserFavorites(userId: number): Promise<Venue[]> {
  try {
    const results = await db.select()
      .from(favoritesTable)
      .innerJoin(venuesTable, eq(favoritesTable.venue_id, venuesTable.id))
      .where(eq(favoritesTable.user_id, userId))
      .execute();

    // Convert joined results to Venue objects with proper numeric conversions
    return results.map(result => ({
      ...result.venues,
      price_range_min: parseFloat(result.venues.price_range_min),
      price_range_max: parseFloat(result.venues.price_range_max)
    }));
  } catch (error) {
    console.error('Get user favorites failed:', error);
    throw error;
  }
}
