
import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type Review } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getVenueReviews(venueId: number): Promise<Review[]> {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.venue_id, venueId))
      .orderBy(desc(reviewsTable.helpful_count), desc(reviewsTable.created_at))
      .execute();

    return results.map(review => ({
      ...review,
      image_urls: Array.isArray(review.image_urls) ? review.image_urls : []
    }));
  } catch (error) {
    console.error('Failed to fetch venue reviews:', error);
    throw error;
  }
}
