
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable, bookingsTable } from '../db/schema';
import { getUserBookings } from '../handlers/get_user_bookings';

describe('getUserBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return bookings for a specific user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create venue owner
    const [owner] = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashed_password',
        first_name: 'Owner',
        last_name: 'User',
        role: 'venue_owner'
      })
      .returning()
      .execute();

    // Create test venue
    const [venue] = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'nightlife',
        address: '123 Test St',
        price_range_min: '50.00',
        price_range_max: '100.00',
        owner_id: owner.id
      })
      .returning()
      .execute();

    // Create test bookings
    const bookingDate = new Date('2024-12-31');
    await db.insert(bookingsTable)
      .values([
        {
          venue_id: venue.id,
          user_id: user.id,
          booking_date: bookingDate,
          start_time: '19:00',
          end_time: '23:00',
          guest_count: 4,
          total_amount: '150.00',
          confirmation_code: 'CONF001',
          status: 'confirmed'
        },
        {
          venue_id: venue.id,
          user_id: user.id,
          booking_date: new Date('2025-01-01'),
          start_time: '20:00',
          guest_count: 2,
          total_amount: '75.50',
          confirmation_code: 'CONF002',
          status: 'pending'
        }
      ])
      .execute();

    const result = await getUserBookings(user.id);

    expect(result).toHaveLength(2);
    
    // Verify booking details
    const firstBooking = result.find(b => b.confirmation_code === 'CONF001');
    expect(firstBooking).toBeDefined();
    expect(firstBooking!.venue_id).toBe(venue.id);
    expect(firstBooking!.guest_count).toBe(4);
    expect(firstBooking!.total_amount).toBe(150.00);
    expect(typeof firstBooking!.total_amount).toBe('number');
    expect(firstBooking!.status).toBe('confirmed');
    expect(firstBooking!.booking_date).toEqual(bookingDate);

    const secondBooking = result.find(b => b.confirmation_code === 'CONF002');
    expect(secondBooking).toBeDefined();
    expect(secondBooking!.total_amount).toBe(75.50);
    expect(typeof secondBooking!.total_amount).toBe('number');
    expect(secondBooking!.status).toBe('pending');
  });

  it('should return empty array for user with no bookings', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const result = await getUserBookings(user.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return bookings for the specified user', async () => {
    // Create two test users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    // Create venue owner
    const [owner] = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashed_password',
        first_name: 'Owner',
        last_name: 'User',
        role: 'venue_owner'
      })
      .returning()
      .execute();

    // Create test venue
    const [venue] = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'restaurants',
        address: '123 Test St',
        price_range_min: '25.00',
        price_range_max: '75.00',
        owner_id: owner.id
      })
      .returning()
      .execute();

    // Create bookings for both users
    await db.insert(bookingsTable)
      .values([
        {
          venue_id: venue.id,
          user_id: user1.id,
          booking_date: new Date('2024-12-31'),
          start_time: '19:00',
          guest_count: 2,
          total_amount: '50.00',
          confirmation_code: 'USER1_BOOKING'
        },
        {
          venue_id: venue.id,
          user_id: user2.id,
          booking_date: new Date('2024-12-31'),
          start_time: '20:00',
          guest_count: 3,
          total_amount: '75.00',
          confirmation_code: 'USER2_BOOKING'
        }
      ])
      .execute();

    const user1Bookings = await getUserBookings(user1.id);
    const user2Bookings = await getUserBookings(user2.id);

    expect(user1Bookings).toHaveLength(1);
    expect(user1Bookings[0].confirmation_code).toBe('USER1_BOOKING');
    expect(user1Bookings[0].user_id).toBe(user1.id);

    expect(user2Bookings).toHaveLength(1);
    expect(user2Bookings[0].confirmation_code).toBe('USER2_BOOKING');
    expect(user2Bookings[0].user_id).toBe(user2.id);
  });
});
