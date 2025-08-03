
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable, reviewsTable } from '../db/schema';
import { type CreateReviewInput } from '../schema';
import { createReview } from '../handlers/create_review';
import { eq } from 'drizzle-orm';

describe('createReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testVenueId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'user'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create venue owner
    const ownerResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashed_password',
        first_name: 'Venue',
        last_name: 'Owner',
        role: 'venue_owner'
      })
      .returning()
      .execute();

    // Create test venue
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A venue for testing',
        category: 'restaurants',
        address: '123 Test St',
        price_range_min: '10.00',
        price_range_max: '50.00',
        owner_id: ownerResult[0].id
      })
      .returning()
      .execute();
    testVenueId = venueResult[0].id;
  });

  const testInput: CreateReviewInput = {
    venue_id: 0, // Will be set in tests
    rating: 4,
    title: 'Great experience',
    content: 'Had a wonderful time at this venue.',
    image_urls: ['https://example.com/image1.jpg']
  };

  it('should create a review', async () => {
    const input = { ...testInput, venue_id: testVenueId };
    const result = await createReview(input, testUserId);

    expect(result.venue_id).toEqual(testVenueId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.rating).toEqual(4);
    expect(result.title).toEqual('Great experience');
    expect(result.content).toEqual('Had a wonderful time at this venue.');
    expect(result.image_urls).toEqual(['https://example.com/image1.jpg']);
    expect(result.is_verified).toEqual(false);
    expect(result.helpful_count).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save review to database', async () => {
    const input = { ...testInput, venue_id: testVenueId };
    const result = await createReview(input, testUserId);

    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, result.id))
      .execute();

    expect(reviews).toHaveLength(1);
    expect(reviews[0].venue_id).toEqual(testVenueId);
    expect(reviews[0].user_id).toEqual(testUserId);
    expect(reviews[0].rating).toEqual(4);
    expect(reviews[0].content).toEqual('Had a wonderful time at this venue.');
  });

  it('should update venue rating and review count', async () => {
    const input = { ...testInput, venue_id: testVenueId };
    await createReview(input, testUserId);

    const venues = await db.select()
      .from(venuesTable)
      .where(eq(venuesTable.id, testVenueId))
      .execute();

    expect(venues).toHaveLength(1);
    expect(venues[0].rating).toEqual(4);
    expect(venues[0].review_count).toEqual(1);
    expect(venues[0].updated_at).toBeInstanceOf(Date);
  });

  it('should calculate correct average rating with multiple reviews', async () => {
    // Create first review (rating: 4)
    const input1 = { ...testInput, venue_id: testVenueId, rating: 4 };
    await createReview(input1, testUserId);

    // Create another user for second review
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'Two',
        role: 'user'
      })
      .returning()
      .execute();

    // Create second review (rating: 2)
    const input2 = { ...testInput, venue_id: testVenueId, rating: 2 };
    await createReview(input2, user2Result[0].id);

    const venues = await db.select()
      .from(venuesTable)
      .where(eq(venuesTable.id, testVenueId))
      .execute();

    expect(venues).toHaveLength(1);
    expect(venues[0].rating).toEqual(3); // (4 + 2) / 2 = 3
    expect(venues[0].review_count).toEqual(2);
  });

  it('should handle review with minimal data', async () => {
    const minimalInput: CreateReviewInput = {
      venue_id: testVenueId,
      rating: 5,
      content: 'Excellent!'
    };

    const result = await createReview(minimalInput, testUserId);

    expect(result.rating).toEqual(5);
    expect(result.title).toBeNull();
    expect(result.content).toEqual('Excellent!');
    expect(result.image_urls).toEqual([]);
  });

  it('should throw error for non-existent venue', async () => {
    const input = { ...testInput, venue_id: 99999 };

    await expect(createReview(input, testUserId))
      .rejects.toThrow(/venue not found/i);
  });
});
