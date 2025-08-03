
import { db } from '../db';
import { favoritesTable, usersTable, venuesTable } from '../db/schema';
import { type Favorite } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function addFavorite(userId: number, venueId: number): Promise<Favorite> {
  try {
    // Verify user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Verify venue exists
    const venueExists = await db.select()
      .from(venuesTable)
      .where(eq(venuesTable.id, venueId))
      .execute();

    if (venueExists.length === 0) {
      throw new Error(`Venue with id ${venueId} not found`);
    }

    // Check if favorite already exists
    const existingFavorite = await db.select()
      .from(favoritesTable)
      .where(and(
        eq(favoritesTable.user_id, userId),
        eq(favoritesTable.venue_id, venueId)
      ))
      .execute();

    if (existingFavorite.length > 0) {
      return existingFavorite[0];
    }

    // Insert new favorite
    const result = await db.insert(favoritesTable)
      .values({
        user_id: userId,
        venue_id: venueId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add favorite failed:', error);
    throw error;
  }
}
