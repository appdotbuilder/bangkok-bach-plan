
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable, groupsTable, bookingsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq } from 'drizzle-orm';

describe('createBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testVenueId: number;
  let testGroupId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash123',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create venue owner
    const ownerResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hash123',
        first_name: 'Owner',
        last_name: 'User',
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
        price_range_min: '25.00',
        price_range_max: '50.00',
        owner_id: ownerResult[0].id
      })
      .returning()
      .execute();
    testVenueId = venueResult[0].id;

    // Create test group
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        organizer_id: testUserId
      })
      .returning()
      .execute();
    testGroupId = groupResult[0].id;
  });

  const testInput: CreateBookingInput = {
    venue_id: 0, // Will be set in tests
    booking_date: new Date('2024-12-25'),
    start_time: '19:00',
    end_time: '22:00',
    guest_count: 4,
    special_requests: 'Window table please'
  };

  it('should create a booking successfully', async () => {
    const input = { ...testInput, venue_id: testVenueId };
    
    const result = await createBooking(input, testUserId);

    expect(result.venue_id).toEqual(testVenueId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.group_id).toBeNull();
    expect(result.booking_date).toEqual(new Date('2024-12-25'));
    expect(result.start_time).toEqual('19:00');
    expect(result.end_time).toEqual('22:00');
    expect(result.guest_count).toEqual(4);
    expect(result.total_amount).toEqual(100); // 25 * 4 guests
    expect(result.status).toEqual('pending');
    expect(result.special_requests).toEqual('Window table please');
    expect(result.confirmation_code).toMatch(/^BB[A-Z0-9]{6}$/);
    expect(result.payment_status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.total_amount).toBe('number');
  });

  it('should create a booking with group', async () => {
    const input = { ...testInput, venue_id: testVenueId, group_id: testGroupId };
    
    const result = await createBooking(input, testUserId);

    expect(result.group_id).toEqual(testGroupId);
    expect(result.venue_id).toEqual(testVenueId);
    expect(result.user_id).toEqual(testUserId);
  });

  it('should save booking to database', async () => {
    const input = { ...testInput, venue_id: testVenueId };
    
    const result = await createBooking(input, testUserId);

    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, result.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].venue_id).toEqual(testVenueId);
    expect(bookings[0].user_id).toEqual(testUserId);
    expect(parseFloat(bookings[0].total_amount)).toEqual(100);
    expect(bookings[0].confirmation_code).toMatch(/^BB[A-Z0-9]{6}$/);
  });

  it('should calculate total amount correctly', async () => {
    const input = { ...testInput, venue_id: testVenueId, guest_count: 6 };
    
    const result = await createBooking(input, testUserId);

    expect(result.total_amount).toEqual(150); // 25 * 6 guests
  });

  it('should handle optional fields correctly', async () => {
    const minimalInput: CreateBookingInput = {
      venue_id: testVenueId,
      booking_date: new Date('2024-12-25'),
      start_time: '19:00',
      guest_count: 2
    };
    
    const result = await createBooking(minimalInput, testUserId);

    expect(result.end_time).toBeNull();
    expect(result.special_requests).toBeNull();
    expect(result.group_id).toBeNull();
  });

  it('should throw error for non-existent venue', async () => {
    const input = { ...testInput, venue_id: 99999 };
    
    await expect(createBooking(input, testUserId)).rejects.toThrow(/venue not found/i);
  });

  it('should throw error for non-existent group', async () => {
    const input = { ...testInput, venue_id: testVenueId, group_id: 99999 };
    
    await expect(createBooking(input, testUserId)).rejects.toThrow(/group not found/i);
  });
});
