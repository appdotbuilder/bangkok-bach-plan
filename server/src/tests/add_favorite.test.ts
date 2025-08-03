
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable, favoritesTable } from '../db/schema';
import { addFavorite } from '../handlers/add_favorite';
import { eq, and } from 'drizzle-orm';

describe('addFavorite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a favorite successfully', async () => {
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

    // Create test venue
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'nightlife',
        address: '123 Test St',
        price_range_min: '50.00',
        price_range_max: '100.00',
        owner_id: userResult[0].id
      })
      .returning()
      .execute();

    const result = await addFavorite(userResult[0].id, venueResult[0].id);

    // Basic field validation
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.venue_id).toEqual(venueResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save favorite to database', async () => {
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

    // Create test venue
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'nightlife',
        address: '123 Test St',
        price_range_min: '50.00',
        price_range_max: '100.00',
        owner_id: userResult[0].id
      })
      .returning()
      .execute();

    const result = await addFavorite(userResult[0].id, venueResult[0].id);

    // Query database to verify favorite was saved
    const favorites = await db.select()
      .from(favoritesTable)
      .where(eq(favoritesTable.id, result.id))
      .execute();

    expect(favorites).toHaveLength(1);
    expect(favorites[0].user_id).toEqual(userResult[0].id);
    expect(favorites[0].venue_id).toEqual(venueResult[0].id);
    expect(favorites[0].created_at).toBeInstanceOf(Date);
  });

  it('should return existing favorite if already exists', async () => {
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

    // Create test venue
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'nightlife',
        address: '123 Test St',
        price_range_min: '50.00',
        price_range_max: '100.00',
        owner_id: userResult[0].id
      })
      .returning()
      .execute();

    // Add favorite first time
    const firstResult = await addFavorite(userResult[0].id, venueResult[0].id);

    // Add favorite second time
    const secondResult = await addFavorite(userResult[0].id, venueResult[0].id);

    // Should return the same favorite
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.user_id).toEqual(userResult[0].id);
    expect(secondResult.venue_id).toEqual(venueResult[0].id);

    // Verify only one favorite exists in database
    const favorites = await db.select()
      .from(favoritesTable)
      .where(and(
        eq(favoritesTable.user_id, userResult[0].id),
        eq(favoritesTable.venue_id, venueResult[0].id)
      ))
      .execute();

    expect(favorites).toHaveLength(1);
  });

  it('should throw error if user does not exist', async () => {
    // Create test venue
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

    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'nightlife',
        address: '123 Test St',
        price_range_min: '50.00',
        price_range_max: '100.00',
        owner_id: userResult[0].id
      })
      .returning()
      .execute();

    const nonExistentUserId = 99999;

    await expect(addFavorite(nonExistentUserId, venueResult[0].id))
      .rejects.toThrow(/user with id.*not found/i);
  });

  it('should throw error if venue does not exist', async () => {
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

    const nonExistentVenueId = 99999;

    await expect(addFavorite(userResult[0].id, nonExistentVenueId))
      .rejects.toThrow(/venue with id.*not found/i);
  });
});
