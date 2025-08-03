
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable, favoritesTable } from '../db/schema';
import { removeFavorite } from '../handlers/remove_favorite';
import { eq, and } from 'drizzle-orm';

describe('removeFavorite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove favorite and return true when favorite exists', async () => {
    // Create test user
    const users = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User'
    }).returning().execute();
    const userId = users[0].id;

    // Create venue owner
    const owners = await db.insert(usersTable).values({
      email: 'owner@example.com',
      password_hash: 'hashed_password',
      first_name: 'Owner',
      last_name: 'User',
      role: 'venue_owner'
    }).returning().execute();
    const ownerId = owners[0].id;

    // Create test venue
    const venues = await db.insert(venuesTable).values({
      name: 'Test Venue',
      description: 'A test venue',
      category: 'restaurants',
      address: '123 Test St',
      price_range_min: '10.00',
      price_range_max: '50.00',
      owner_id: ownerId
    }).returning().execute();
    const venueId = venues[0].id;

    // Create favorite
    await db.insert(favoritesTable).values({
      user_id: userId,
      venue_id: venueId
    }).execute();

    // Remove favorite
    const result = await removeFavorite(userId, venueId);

    expect(result).toBe(true);

    // Verify favorite was removed from database
    const favorites = await db.select()
      .from(favoritesTable)
      .where(and(
        eq(favoritesTable.user_id, userId),
        eq(favoritesTable.venue_id, venueId)
      ))
      .execute();

    expect(favorites).toHaveLength(0);
  });

  it('should return false when favorite does not exist', async () => {
    // Create test user
    const users = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User'
    }).returning().execute();
    const userId = users[0].id;

    // Create venue owner
    const owners = await db.insert(usersTable).values({
      email: 'owner@example.com',
      password_hash: 'hashed_password',
      first_name: 'Owner',
      last_name: 'User',
      role: 'venue_owner'
    }).returning().execute();
    const ownerId = owners[0].id;

    // Create test venue
    const venues = await db.insert(venuesTable).values({
      name: 'Test Venue',
      description: 'A test venue',
      category: 'restaurants',
      address: '123 Test St',
      price_range_min: '10.00',
      price_range_max: '50.00',
      owner_id: ownerId
    }).returning().execute();
    const venueId = venues[0].id;

    // Try to remove non-existent favorite
    const result = await removeFavorite(userId, venueId);

    expect(result).toBe(false);
  });

  it('should return false when user does not exist', async () => {
    // Create venue owner
    const owners = await db.insert(usersTable).values({
      email: 'owner@example.com',
      password_hash: 'hashed_password',
      first_name: 'Owner',
      last_name: 'User',
      role: 'venue_owner'
    }).returning().execute();
    const ownerId = owners[0].id;

    // Create test venue
    const venues = await db.insert(venuesTable).values({
      name: 'Test Venue',
      description: 'A test venue',
      category: 'restaurants',
      address: '123 Test St',
      price_range_min: '10.00',
      price_range_max: '50.00',
      owner_id: ownerId
    }).returning().execute();
    const venueId = venues[0].id;

    // Try to remove favorite with non-existent user
    const result = await removeFavorite(99999, venueId);

    expect(result).toBe(false);
  });

  it('should return false when venue does not exist', async () => {
    // Create test user
    const users = await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      first_name: 'Test',
      last_name: 'User'
    }).returning().execute();
    const userId = users[0].id;

    // Try to remove favorite with non-existent venue
    const result = await removeFavorite(userId, 99999);

    expect(result).toBe(false);
  });

  it('should not affect other user favorites for same venue', async () => {
    // Create test users
    const user1 = await db.insert(usersTable).values({
      email: 'user1@example.com',
      password_hash: 'hashed_password',
      first_name: 'User',
      last_name: 'One'
    }).returning().execute();
    const userId1 = user1[0].id;

    const user2 = await db.insert(usersTable).values({
      email: 'user2@example.com',
      password_hash: 'hashed_password',
      first_name: 'User',
      last_name: 'Two'
    }).returning().execute();
    const userId2 = user2[0].id;

    // Create venue owner
    const owners = await db.insert(usersTable).values({
      email: 'owner@example.com',
      password_hash: 'hashed_password',
      first_name: 'Owner',
      last_name: 'User',
      role: 'venue_owner'
    }).returning().execute();
    const ownerId = owners[0].id;

    // Create test venue
    const venues = await db.insert(venuesTable).values({
      name: 'Test Venue',
      description: 'A test venue',
      category: 'restaurants',
      address: '123 Test St',
      price_range_min: '10.00',
      price_range_max: '50.00',
      owner_id: ownerId
    }).returning().execute();
    const venueId = venues[0].id;

    // Create favorites for both users
    await db.insert(favoritesTable).values([
      { user_id: userId1, venue_id: venueId },
      { user_id: userId2, venue_id: venueId }
    ]).execute();

    // Remove favorite for user1
    const result = await removeFavorite(userId1, venueId);

    expect(result).toBe(true);

    // Verify user1's favorite was removed
    const user1Favorites = await db.select()
      .from(favoritesTable)
      .where(and(
        eq(favoritesTable.user_id, userId1),
        eq(favoritesTable.venue_id, venueId)
      ))
      .execute();

    expect(user1Favorites).toHaveLength(0);

    // Verify user2's favorite still exists
    const user2Favorites = await db.select()
      .from(favoritesTable)
      .where(and(
        eq(favoritesTable.user_id, userId2),
        eq(favoritesTable.venue_id, venueId)
      ))
      .execute();

    expect(user2Favorites).toHaveLength(1);
  });
});
