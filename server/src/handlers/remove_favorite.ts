
import { db } from '../db';
import { favoritesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function removeFavorite(userId: number, venueId: number): Promise<boolean> {
  try {
    const result = await db.delete(favoritesTable)
      .where(and(
        eq(favoritesTable.user_id, userId),
        eq(favoritesTable.venue_id, venueId)
      ))
      .execute();

    // Return true if a row was deleted (rowCount > 0)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Remove favorite failed:', error);
    throw error;
  }
}
