
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable } from '../db/schema';
import { type SearchVenuesInput } from '../schema';
import { searchVenues } from '../handlers/search_venues';

describe('searchVenues', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user to own venues
    const userResult = await db.insert(usersTable)
      .values({
        email: 'owner@test.com',
        password_hash: 'hash123',
        first_name: 'Test',
        last_name: 'Owner',
        role: 'venue_owner'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create test venues with different categories and prices
    await db.insert(venuesTable)
      .values([
        {
          name: 'Downtown Club',
          description: 'Premier nightclub in the city center',
          category: 'nightlife',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.0060,
          price_range_min: '50.00',
          price_range_max: '100.00',
          rating: 4.5,
          review_count: 120,
          is_active: true,
          owner_id: testUserId
        },
        {
          name: 'Luxury Hotel',
          description: 'Five-star accommodations with spa',
          category: 'hotels',
          address: '456 Park Ave',
          latitude: 40.7589,
          longitude: -73.9851,
          price_range_min: '200.00',
          price_range_max: '500.00',
          rating: 4.8,
          review_count: 85,
          is_active: true,
          owner_id: testUserId
        },
        {
          name: 'Cozy Restaurant',
          description: 'Family-owned Italian restaurant',
          category: 'restaurants',
          address: '789 Side St',
          latitude: 40.7505,
          longitude: -73.9934,
          price_range_min: '25.00',
          price_range_max: '75.00',
          rating: 4.2,
          review_count: 200,
          is_active: true,
          owner_id: testUserId
        },
        {
          name: 'Inactive Venue',
          description: 'This venue is not active',
          category: 'nightlife',
          address: '999 Closed St',
          price_range_min: '30.00',
          price_range_max: '60.00',
          rating: 3.0,
          review_count: 10,
          is_active: false,
          owner_id: testUserId
        }
      ])
      .execute();
  });

  it('should return all active venues when no filters applied', async () => {
    const input: SearchVenuesInput = {};
    const result = await searchVenues(input);

    expect(result).toHaveLength(3);
    expect(result.every(venue => venue.is_active)).toBe(true);
    
    // Check numeric conversions
    result.forEach(venue => {
      expect(typeof venue.price_range_min).toBe('number');
      expect(typeof venue.price_range_max).toBe('number');
    });
  });

  it('should filter by keyword in name', async () => {
    const input: SearchVenuesInput = {
      keyword: 'Downtown'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Downtown Club');
  });

  it('should filter by keyword in description', async () => {
    const input: SearchVenuesInput = {
      keyword: 'Italian'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Cozy Restaurant');
  });

  it('should filter by category', async () => {
    const input: SearchVenuesInput = {
      category: 'hotels'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Luxury Hotel');
    expect(result[0].category).toBe('hotels');
  });

  it('should filter by minimum price (venues affordable at minimum budget)', async () => {
    const input: SearchVenuesInput = {
      min_price: 80
    };
    const result = await searchVenues(input);

    // Should return venues where max price >= 80 (Downtown Club: 100, Luxury Hotel: 500)
    expect(result).toHaveLength(2);
    expect(result.some(v => v.name === 'Downtown Club')).toBe(true);
    expect(result.some(v => v.name === 'Luxury Hotel')).toBe(true);
  });

  it('should filter by maximum price (venues with options within budget)', async () => {
    const input: SearchVenuesInput = {
      max_price: 60
    };
    const result = await searchVenues(input);

    // Should return venues where min price <= 60 (Downtown Club: 50, Cozy Restaurant: 25)
    expect(result).toHaveLength(2);
    expect(result.some(v => v.name === 'Downtown Club')).toBe(true);
    expect(result.some(v => v.name === 'Cozy Restaurant')).toBe(true);
  });

  it('should filter by price range (budget overlap)', async () => {
    const input: SearchVenuesInput = {
      min_price: 30,
      max_price: 150
    };
    const result = await searchVenues(input);

    // Should return venues where price ranges overlap with 30-150
    // Downtown Club (50-100): overlaps ✓
    // Cozy Restaurant (25-75): overlaps ✓
    // Luxury Hotel (200-500): no overlap ✗
    expect(result).toHaveLength(2);
    expect(result.some(v => v.name === 'Downtown Club')).toBe(true);
    expect(result.some(v => v.name === 'Cozy Restaurant')).toBe(true);
  });

  it('should filter by location with radius', async () => {
    const input: SearchVenuesInput = {
      latitude: 40.7128,
      longitude: -74.0060,
      radius_km: 5
    };
    const result = await searchVenues(input);

    // Should return venues within the radius
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(venue => venue.is_active)).toBe(true);
  });

  it('should sort by rating descending', async () => {
    const input: SearchVenuesInput = {
      sort_by: 'rating'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Luxury Hotel'); // 4.8 rating
    expect(result[1].name).toBe('Downtown Club'); // 4.5 rating
    expect(result[2].name).toBe('Cozy Restaurant'); // 4.2 rating
  });

  it('should sort by price low to high', async () => {
    const input: SearchVenuesInput = {
      sort_by: 'price_low'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Cozy Restaurant'); // 25.00 min
    expect(result[1].name).toBe('Downtown Club'); // 50.00 min
    expect(result[2].name).toBe('Luxury Hotel'); // 200.00 min
  });

  it('should sort by price high to low', async () => {
    const input: SearchVenuesInput = {
      sort_by: 'price_high'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Luxury Hotel'); // 500.00 max
    expect(result[1].name).toBe('Downtown Club'); // 100.00 max
    expect(result[2].name).toBe('Cozy Restaurant'); // 75.00 max
  });

  it('should combine multiple filters', async () => {
    const input: SearchVenuesInput = {
      category: 'nightlife',
      min_price: 40,
      keyword: 'club'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Downtown Club');
    expect(result[0].category).toBe('nightlife');
    expect(result[0].price_range_max).toBeGreaterThanOrEqual(40);
  });

  it('should return empty array when no venues match filters', async () => {
    const input: SearchVenuesInput = {
      category: 'transport'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(0);
  });

  it('should default to rating sort when no sort specified', async () => {
    const input: SearchVenuesInput = {};
    const result = await searchVenues(input);

    expect(result).toHaveLength(3);
    // Should be sorted by rating descending by default
    expect(result[0].rating).toBeGreaterThanOrEqual(result[1].rating);
    expect(result[1].rating).toBeGreaterThanOrEqual(result[2].rating);
  });

  it('should handle case-insensitive keyword search', async () => {
    const input: SearchVenuesInput = {
      keyword: 'DOWNTOWN'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Downtown Club');
  });

  it('should handle partial keyword matches', async () => {
    const input: SearchVenuesInput = {
      keyword: 'club'
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Downtown Club');
  });

  it('should handle edge case: very high minimum price', async () => {
    const input: SearchVenuesInput = {
      min_price: 1000
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(0);
  });

  it('should handle edge case: very low maximum price', async () => {
    const input: SearchVenuesInput = {
      max_price: 10
    };
    const result = await searchVenues(input);

    expect(result).toHaveLength(0);
  });
});
