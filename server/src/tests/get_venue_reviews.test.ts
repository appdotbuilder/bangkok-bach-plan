
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable, reviewsTable } from '../db/schema';
import { getVenueReviews } from '../handlers/get_venue_reviews';

describe('getVenueReviews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when venue has no reviews', async () => {
    // Create user and venue without reviews
    const [user] = await db.insert(usersTable).values({
      email: 'owner@test.com',
      password_hash: 'hashed',
      first_name: 'Owner',
      last_name: 'User',
      role: 'venue_owner'
    }).returning().execute();

    const [venue] = await db.insert(venuesTable).values({
      name: 'Test Venue',
      description: 'A test venue',
      category: 'restaurants',
      address: '123 Test St',
      price_range_min: '10.00',
      price_range_max: '50.00',
      owner_id: user.id
    }).returning().execute();

    const reviews = await getVenueReviews(venue.id);

    expect(reviews).toEqual([]);
  });

  it('should return reviews for a venue ordered by helpfulness then date', async () => {
    // Create user and venue
    const [user] = await db.insert(usersTable).values({
      email: 'owner@test.com',
      password_hash: 'hashed',
      first_name: 'Owner',
      last_name: 'User',
      role: 'venue_owner'
    }).returning().execute();

    // Create multiple reviewers since each user can only review a venue once
    const reviewers = await db.insert(usersTable).values([
      {
        email: 'reviewer1@test.com',
        password_hash: 'hashed',
        first_name: 'Reviewer',
        last_name: 'One'
      },
      {
        email: 'reviewer2@test.com',
        password_hash: 'hashed',
        first_name: 'Reviewer',
        last_name: 'Two'
      },
      {
        email: 'reviewer3@test.com',
        password_hash: 'hashed',
        first_name: 'Reviewer',
        last_name: 'Three'
      }
    ]).returning().execute();

    const [venue] = await db.insert(venuesTable).values({
      name: 'Test Venue',
      description: 'A test venue',
      category: 'restaurants',
      address: '123 Test St',
      price_range_min: '10.00',
      price_range_max: '50.00',
      owner_id: user.id
    }).returning().execute();

    // Create reviews with different helpful counts and dates
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    await db.insert(reviewsTable).values([
      {
        venue_id: venue.id,
        user_id: reviewers[0].id,
        rating: 5,
        title: 'Great place!',
        content: 'Really enjoyed this venue',
        helpful_count: 10,
        created_at: yesterday
      },
      {
        venue_id: venue.id,
        user_id: reviewers[1].id,
        rating: 4,
        title: 'Good experience',
        content: 'Pretty good overall',
        helpful_count: 15,
        created_at: now
      },
      {
        venue_id: venue.id,
        user_id: reviewers[2].id,
        rating: 3,
        title: 'Average',
        content: 'Nothing special',
        helpful_count: 5,
        created_at: now
      }
    ]).execute();

    const reviews = await getVenueReviews(venue.id);

    expect(reviews).toHaveLength(3);
    
    // Should be ordered by helpful_count DESC, then created_at DESC
    expect(reviews[0].helpful_count).toBe(15);
    expect(reviews[0].title).toBe('Good experience');
    
    expect(reviews[1].helpful_count).toBe(10);
    expect(reviews[1].title).toBe('Great place!');
    
    expect(reviews[2].helpful_count).toBe(5);
    expect(reviews[2].title).toBe('Average');
  });

  it('should handle reviews with image URLs correctly', async () => {
    // Create user and venue
    const [user] = await db.insert(usersTable).values({
      email: 'owner@test.com',
      password_hash: 'hashed',
      first_name: 'Owner',
      last_name: 'User',
      role: 'venue_owner'
    }).returning().execute();

    const [reviewer] = await db.insert(usersTable).values({
      email: 'reviewer@test.com',
      password_hash: 'hashed',
      first_name: 'Reviewer',
      last_name: 'User'
    }).returning().execute();

    const [venue] = await db.insert(venuesTable).values({
      name: 'Test Venue',
      description: 'A test venue',
      category: 'restaurants',
      address: '123 Test St',
      price_range_min: '10.00',
      price_range_max: '50.00',
      owner_id: user.id
    }).returning().execute();

    await db.insert(reviewsTable).values({
      venue_id: venue.id,
      user_id: reviewer.id,
      rating: 5,
      content: 'Great venue with photos',
      image_urls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
    }).execute();

    const reviews = await getVenueReviews(venue.id);

    expect(reviews).toHaveLength(1);
    expect(reviews[0].image_urls).toEqual(['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']);
    expect(Array.isArray(reviews[0].image_urls)).toBe(true);
  });

  it('should only return reviews for the specified venue', async () => {
    // Create users and venues
    const [user] = await db.insert(usersTable).values({
      email: 'owner@test.com',
      password_hash: 'hashed',
      first_name: 'Owner',
      last_name: 'User',
      role: 'venue_owner'
    }).returning().execute();

    const [reviewer] = await db.insert(usersTable).values({
      email: 'reviewer@test.com',
      password_hash: 'hashed',
      first_name: 'Reviewer',
      last_name: 'User'
    }).returning().execute();

    const venues = await db.insert(venuesTable).values([
      {
        name: 'Venue 1',
        description: 'First venue',
        category: 'restaurants',
        address: '123 Test St',
        price_range_min: '10.00',
        price_range_max: '50.00',
        owner_id: user.id
      },
      {
        name: 'Venue 2',
        description: 'Second venue',
        category: 'nightlife',
        address: '456 Test Ave',
        price_range_min: '15.00',
        price_range_max: '60.00',
        owner_id: user.id
      }
    ]).returning().execute();

    // Create reviews for both venues (same user can review different venues)
    await db.insert(reviewsTable).values([
      {
        venue_id: venues[0].id,
        user_id: reviewer.id,
        rating: 5,
        content: 'Review for venue 1'
      },
      {
        venue_id: venues[1].id,
        user_id: reviewer.id,
        rating: 4,
        content: 'Review for venue 2'
      }
    ]).execute();

    const reviewsVenue1 = await getVenueReviews(venues[0].id);
    const reviewsVenue2 = await getVenueReviews(venues[1].id);

    expect(reviewsVenue1).toHaveLength(1);
    expect(reviewsVenue1[0].content).toBe('Review for venue 1');
    expect(reviewsVenue1[0].venue_id).toBe(venues[0].id);

    expect(reviewsVenue2).toHaveLength(1);
    expect(reviewsVenue2[0].content).toBe('Review for venue 2');
    expect(reviewsVenue2[0].venue_id).toBe(venues[1].id);
  });
});
