
import { db } from '../db';
import { reviewsTable, venuesTable } from '../db/schema';
import { type CreateReviewInput, type Review } from '../schema';
import { eq } from 'drizzle-orm';

export async function createReview(input: CreateReviewInput, userId: number): Promise<Review> {
  try {
    // Check if venue exists
    const venue = await db.select()
      .from(venuesTable)
      .where(eq(venuesTable.id, input.venue_id))
      .execute();

    if (venue.length === 0) {
      throw new Error('Venue not found');
    }

    // Insert review record
    const result = await db.insert(reviewsTable)
      .values({
        venue_id: input.venue_id,
        user_id: userId,
        rating: input.rating,
        title: input.title || null,
        content: input.content,
        image_urls: input.image_urls || []
      })
      .returning()
      .execute();

    // Get all reviews for this venue to calculate new rating
    const allReviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.venue_id, input.venue_id))
      .execute();

    // Calculate new average rating and review count
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;
    const reviewCount = allReviews.length;

    // Update venue rating and review count
    await db.update(venuesTable)
      .set({
        rating: averageRating,
        review_count: reviewCount,
        updated_at: new Date()
      })
      .where(eq(venuesTable.id, input.venue_id))
      .execute();

    // Convert the database result to match the Review type
    const review = result[0];
    return {
      ...review,
      image_urls: review.image_urls as string[]
    };
  } catch (error) {
    console.error('Review creation failed:', error);
    throw error;
  }
}
