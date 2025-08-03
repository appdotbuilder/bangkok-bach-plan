
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable } from '../db/schema';
import { getVenueById } from '../handlers/get_venue_by_id';

describe('getVenueById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return venue by ID', async () => {
    // Create a user first (foreign key requirement)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'venue_owner'
      })
      .returning()
      .execute();

    const ownerId = userResult[0].id;

    // Create a venue
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A great test venue',
        category: 'nightlife',
        address: '123 Test Street, Bangkok',
        latitude: 13.7563,
        longitude: 100.5018,
        phone: '+66123456789',
        email: 'venue@example.com',
        website_url: 'https://testvenue.com',
        price_range_min: '1500.00',
        price_range_max: '3000.00',
        rating: 4.2,
        review_count: 75,
        is_active: true,
        thumbnail_image_url: 'https://example.com/thumb.jpg',
        owner_id: ownerId
      })
      .returning()
      .execute();

    const venueId = venueResult[0].id;

    // Test getting the venue
    const result = await getVenueById(venueId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(venueId);
    expect(result!.name).toBe('Test Venue');
    expect(result!.description).toBe('A great test venue');
    expect(result!.category).toBe('nightlife');
    expect(result!.address).toBe('123 Test Street, Bangkok');
    expect(result!.latitude).toBe(13.7563);
    expect(result!.longitude).toBe(100.5018);
    expect(result!.phone).toBe('+66123456789');
    expect(result!.email).toBe('venue@example.com');
    expect(result!.website_url).toBe('https://testvenue.com');
    expect(result!.price_range_min).toBe(1500);
    expect(result!.price_range_max).toBe(3000);
    expect(typeof result!.price_range_min).toBe('number');
    expect(typeof result!.price_range_max).toBe('number');
    expect(result!.rating).toBe(4.2);
    expect(result!.review_count).toBe(75);
    expect(result!.is_active).toBe(true);
    expect(result!.thumbnail_image_url).toBe('https://example.com/thumb.jpg');
    expect(result!.owner_id).toBe(ownerId);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent venue', async () => {
    const result = await getVenueById(999);
    expect(result).toBeNull();
  });

  it('should handle venue with minimal data', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'minimal@example.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'venue_owner'
      })
      .returning()
      .execute();

    const ownerId = userResult[0].id;

    // Create venue with minimal required data
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Minimal Venue',
        description: 'Basic venue',
        category: 'restaurants',
        address: '456 Simple St',
        price_range_min: '500.00',
        price_range_max: '1000.00',
        owner_id: ownerId
      })
      .returning()
      .execute();

    const venueId = venueResult[0].id;

    const result = await getVenueById(venueId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(venueId);
    expect(result!.name).toBe('Minimal Venue');
    expect(result!.category).toBe('restaurants');
    expect(result!.latitude).toBeNull();
    expect(result!.longitude).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.email).toBeNull();
    expect(result!.website_url).toBeNull();
    expect(result!.thumbnail_image_url).toBeNull();
    expect(result!.price_range_min).toBe(500);
    expect(result!.price_range_max).toBe(1000);
    expect(result!.rating).toBe(0); // Default value
    expect(result!.review_count).toBe(0); // Default value
    expect(result!.is_active).toBe(true); // Default value
  });
});
