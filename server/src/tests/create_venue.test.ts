
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { venuesTable, usersTable } from '../db/schema';
import { type CreateVenueInput } from '../schema';
import { createVenue } from '../handlers/create_venue';
import { eq } from 'drizzle-orm';

describe('createVenue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let venueOwnerId: number;
  let regularUserId: number;

  const setupUsers = async () => {
    // Create venue owner
    const venueOwnerResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Venue',
        last_name: 'Owner',
        role: 'venue_owner'
      })
      .returning()
      .execute();
    venueOwnerId = venueOwnerResult[0].id;

    // Create regular user
    const regularUserResult = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Regular',
        last_name: 'User',
        role: 'user'
      })
      .returning()
      .execute();
    regularUserId = regularUserResult[0].id;
  };

  const testInput: CreateVenueInput = {
    name: 'Test Nightclub',
    description: 'A great place for nightlife',
    category: 'nightlife',
    address: '123 Party Street, City',
    latitude: 40.7128,
    longitude: -74.0060,
    phone: '+1234567890',
    email: 'info@testnightclub.com',
    website_url: 'https://testnightclub.com',
    price_range_min: 50.00,
    price_range_max: 150.00,
    owner_id: 0 // Will be set in tests
  };

  it('should create a venue with all fields', async () => {
    await setupUsers();
    const input = { ...testInput, owner_id: venueOwnerId };

    const result = await createVenue(input);

    // Basic field validation
    expect(result.name).toEqual('Test Nightclub');
    expect(result.description).toEqual(testInput.description);
    expect(result.category).toEqual('nightlife');
    expect(result.address).toEqual(testInput.address);
    expect(result.latitude).toEqual(40.7128);
    expect(result.longitude).toEqual(-74.0060);
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('info@testnightclub.com');
    expect(result.website_url).toEqual('https://testnightclub.com');
    expect(result.price_range_min).toEqual(50.00);
    expect(result.price_range_max).toEqual(150.00);
    expect(typeof result.price_range_min).toBe('number');
    expect(typeof result.price_range_max).toBe('number');
    expect(result.owner_id).toEqual(venueOwnerId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.rating).toEqual(0);
    expect(result.review_count).toEqual(0);
    expect(result.is_active).toEqual(true);
    expect(result.thumbnail_image_url).toBeNull();
  });

  it('should create venue with minimal fields', async () => {
    await setupUsers();
    const minimalInput: CreateVenueInput = {
      name: 'Simple Restaurant',
      description: 'A simple restaurant',
      category: 'restaurants',
      address: '456 Food Street',
      price_range_min: 25.00,
      price_range_max: 75.00,
      owner_id: venueOwnerId
    };

    const result = await createVenue(minimalInput);

    expect(result.name).toEqual('Simple Restaurant');
    expect(result.category).toEqual('restaurants');
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.website_url).toBeNull();
    expect(result.price_range_min).toEqual(25.00);
    expect(result.price_range_max).toEqual(75.00);
  });

  it('should save venue to database', async () => {
    await setupUsers();
    const input = { ...testInput, owner_id: venueOwnerId };

    const result = await createVenue(input);

    // Query database to verify venue was saved
    const venues = await db.select()
      .from(venuesTable)
      .where(eq(venuesTable.id, result.id))
      .execute();

    expect(venues).toHaveLength(1);
    expect(venues[0].name).toEqual('Test Nightclub');
    expect(venues[0].category).toEqual('nightlife');
    expect(parseFloat(venues[0].price_range_min)).toEqual(50.00);
    expect(parseFloat(venues[0].price_range_max)).toEqual(150.00);
    expect(venues[0].owner_id).toEqual(venueOwnerId);
    expect(venues[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when owner does not exist', async () => {
    const nonExistentOwnerId = 99999;
    const input = { ...testInput, owner_id: nonExistentOwnerId };

    await expect(createVenue(input)).rejects.toThrow(/owner not found/i);
  });

  it('should throw error when user is not venue owner or admin', async () => {
    await setupUsers();
    const input = { ...testInput, owner_id: regularUserId };

    await expect(createVenue(input)).rejects.toThrow(/does not have permission/i);
  });

  it('should allow admin to create venues', async () => {
    await setupUsers();
    
    // Create admin user
    const adminResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      })
      .returning()
      .execute();

    const input = { ...testInput, owner_id: adminResult[0].id };

    const result = await createVenue(input);

    expect(result.name).toEqual('Test Nightclub');
    expect(result.owner_id).toEqual(adminResult[0].id);
  });

  it('should handle different venue categories', async () => {
    await setupUsers();

    const categories = ['nightlife', 'hotels', 'daytime_activities', 'evening_activities', 'transport', 'restaurants'] as const;

    for (const category of categories) {
      const input = {
        ...testInput,
        name: `Test ${category}`,
        category,
        owner_id: venueOwnerId
      };

      const result = await createVenue(input);
      expect(result.category).toEqual(category);
    }
  });
});
