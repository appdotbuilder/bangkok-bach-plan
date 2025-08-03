
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable, favoritesTable } from '../db/schema';
import { type CreateUserInput, type CreateVenueInput } from '../schema';
import { getUserFavorites } from '../handlers/get_user_favorites';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'Test',
  last_name: 'User',
  phone: '555-0123'
};

const testVenue1: CreateVenueInput = {
  name: 'Test Restaurant',
  description: 'A great restaurant',
  category: 'restaurants',
  address: '123 Main St',
  latitude: 40.7128,
  longitude: -74.0060,
  phone: '555-0123',
  email: 'restaurant@example.com',
  website_url: 'https://restaurant.com',
  price_range_min: 20.00,
  price_range_max: 50.00,
  owner_id: 1
};

const testVenue2: CreateVenueInput = {
  name: 'Night Club',
  description: 'Popular nightclub',
  category: 'nightlife',
  address: '456 Party Ave',
  price_range_min: 30.00,
  price_range_max: 80.00,
  owner_id: 1
};

describe('getUserFavorites', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no favorites', async () => {
    // Create user but no favorites
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const result = await getUserFavorites(userResult[0].id);
    expect(result).toEqual([]);
  });

  it('should return user favorites with full venue details', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create venues
    const venue1Result = await db.insert(venuesTable)
      .values({
        ...testVenue1,
        price_range_min: testVenue1.price_range_min.toString(),
        price_range_max: testVenue1.price_range_max.toString()
      })
      .returning()
      .execute();

    const venue2Result = await db.insert(venuesTable)
      .values({
        ...testVenue2,
        price_range_min: testVenue2.price_range_min.toString(),
        price_range_max: testVenue2.price_range_max.toString()
      })
      .returning()
      .execute();

    // Add venues to favorites
    await db.insert(favoritesTable)
      .values([
        { user_id: userId, venue_id: venue1Result[0].id },
        { user_id: userId, venue_id: venue2Result[0].id }
      ])
      .execute();

    const result = await getUserFavorites(userId);

    expect(result).toHaveLength(2);
    
    // Check first venue
    const restaurant = result.find(v => v.name === 'Test Restaurant');
    expect(restaurant).toBeDefined();
    expect(restaurant!.name).toEqual('Test Restaurant');
    expect(restaurant!.description).toEqual('A great restaurant');
    expect(restaurant!.category).toEqual('restaurants');
    expect(restaurant!.address).toEqual('123 Main St');
    expect(restaurant!.latitude).toEqual(40.7128);
    expect(restaurant!.longitude).toEqual(-74.0060);
    expect(restaurant!.phone).toEqual('555-0123');
    expect(restaurant!.email).toEqual('restaurant@example.com');
    expect(restaurant!.website_url).toEqual('https://restaurant.com');
    expect(restaurant!.price_range_min).toEqual(20.00);
    expect(restaurant!.price_range_max).toEqual(50.00);
    expect(typeof restaurant!.price_range_min).toBe('number');
    expect(typeof restaurant!.price_range_max).toBe('number');
    expect(restaurant!.rating).toEqual(0);
    expect(restaurant!.review_count).toEqual(0);
    expect(restaurant!.is_active).toBe(true);
    expect(restaurant!.owner_id).toEqual(1);
    expect(restaurant!.id).toBeDefined();
    expect(restaurant!.created_at).toBeInstanceOf(Date);
    expect(restaurant!.updated_at).toBeInstanceOf(Date);

    // Check second venue
    const nightclub = result.find(v => v.name === 'Night Club');
    expect(nightclub).toBeDefined();
    expect(nightclub!.name).toEqual('Night Club');
    expect(nightclub!.category).toEqual('nightlife');
    expect(nightclub!.price_range_min).toEqual(30.00);
    expect(nightclub!.price_range_max).toEqual(80.00);
    expect(typeof nightclub!.price_range_min).toBe('number');
    expect(typeof nightclub!.price_range_max).toBe('number');
  });

  it('should not return favorites of other users', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create venue
    const venueResult = await db.insert(venuesTable)
      .values({
        ...testVenue1,
        price_range_min: testVenue1.price_range_min.toString(),
        price_range_max: testVenue1.price_range_max.toString()
      })
      .returning()
      .execute();

    // Add venue to user2's favorites only
    await db.insert(favoritesTable)
      .values({ user_id: user2Result[0].id, venue_id: venueResult[0].id })
      .execute();

    // User1 should have no favorites
    const result = await getUserFavorites(user1Result[0].id);
    expect(result).toHaveLength(0);
  });

  it('should verify favorites are saved in database', async () => {
    // Create user and venue
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const venueResult = await db.insert(venuesTable)
      .values({
        ...testVenue1,
        price_range_min: testVenue1.price_range_min.toString(),
        price_range_max: testVenue1.price_range_max.toString()
      })
      .returning()
      .execute();

    // Add to favorites
    await db.insert(favoritesTable)
      .values({ user_id: userResult[0].id, venue_id: venueResult[0].id })
      .execute();

    // Verify in database
    const favorites = await db.select()
      .from(favoritesTable)
      .where(eq(favoritesTable.user_id, userResult[0].id))
      .execute();

    expect(favorites).toHaveLength(1);
    expect(favorites[0].user_id).toEqual(userResult[0].id);
    expect(favorites[0].venue_id).toEqual(venueResult[0].id);
    expect(favorites[0].created_at).toBeInstanceOf(Date);

    // Verify handler returns the same data
    const result = await getUserFavorites(userResult[0].id);
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(venueResult[0].id);
  });
});
