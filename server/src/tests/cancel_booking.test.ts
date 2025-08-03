
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, venuesTable, bookingsTable } from '../db/schema';
import { cancelBooking } from '../handlers/cancel_booking';
import { eq } from 'drizzle-orm';

describe('cancelBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should cancel a booking successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_verified: true
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create venue owner
    const ownerResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Owner',
        last_name: 'User',
        role: 'venue_owner',
        is_verified: true
      })
      .returning()
      .execute();
    const ownerId = ownerResult[0].id;

    // Create test venue
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'nightlife',
        address: '123 Test St',
        price_range_min: '50.00',
        price_range_max: '200.00',
        owner_id: ownerId
      })
      .returning()
      .execute();
    const venueId = venueResult[0].id;

    // Create test booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        venue_id: venueId,
        user_id: userId,
        booking_date: new Date('2024-12-25'),
        start_time: '20:00',
        end_time: '23:00',
        guest_count: 8,
        total_amount: '250.00',
        status: 'confirmed',
        confirmation_code: 'TEST123456',
        payment_status: 'paid'
      })
      .returning()
      .execute();
    const bookingId = bookingResult[0].id;

    const result = await cancelBooking(bookingId, userId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(bookingId);
    expect(result!.status).toEqual('cancelled');
    expect(result!.payment_status).toEqual('refunded');
    expect(result!.total_amount).toEqual(250);
    expect(typeof result!.total_amount).toEqual('number');
  });

  it('should update booking in database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_verified: true
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create venue owner
    const ownerResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Owner',
        last_name: 'User',
        role: 'venue_owner',
        is_verified: true
      })
      .returning()
      .execute();
    const ownerId = ownerResult[0].id;

    // Create test venue
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'nightlife',
        address: '123 Test St',
        price_range_min: '50.00',
        price_range_max: '200.00',
        owner_id: ownerId
      })
      .returning()
      .execute();
    const venueId = venueResult[0].id;

    // Create test booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        venue_id: venueId,
        user_id: userId,
        booking_date: new Date('2024-12-25'),
        start_time: '20:00',
        end_time: '23:00',
        guest_count: 8,
        total_amount: '250.00',
        status: 'pending',
        confirmation_code: 'TEST123456',
        payment_status: 'pending'
      })
      .returning()
      .execute();
    const bookingId = bookingResult[0].id;

    await cancelBooking(bookingId, userId);

    // Verify database was updated
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].status).toEqual('cancelled');
    expect(bookings[0].payment_status).toEqual('refunded');
  });

  it('should return null when booking does not exist', async () => {
    const result = await cancelBooking(999, 1);
    expect(result).toBeNull();
  });

  it('should return null when booking belongs to different user', async () => {
    // Create test users
    const userResult1 = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        first_name: 'User',
        last_name: 'One',
        role: 'user',
        is_verified: true
      })
      .returning()
      .execute();
    const userId1 = userResult1[0].id;

    const userResult2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        first_name: 'User',
        last_name: 'Two',
        role: 'user',
        is_verified: true
      })
      .returning()
      .execute();
    const userId2 = userResult2[0].id;

    // Create venue owner
    const ownerResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Owner',
        last_name: 'User',
        role: 'venue_owner',
        is_verified: true
      })
      .returning()
      .execute();
    const ownerId = ownerResult[0].id;

    // Create test venue
    const venueResult = await db.insert(venuesTable)
      .values({
        name: 'Test Venue',
        description: 'A test venue',
        category: 'nightlife',
        address: '123 Test St',
        price_range_min: '50.00',
        price_range_max: '200.00',
        owner_id: ownerId
      })
      .returning()
      .execute();
    const venueId = venueResult[0].id;

    // Create booking for userId1
    const bookingResult = await db.insert(bookingsTable)
      .values({
        venue_id: venueId,
        user_id: userId1,
        booking_date: new Date('2024-12-25'),
        start_time: '20:00',
        end_time: '23:00',
        guest_count: 8,
        total_amount: '250.00',
        status: 'confirmed',
        confirmation_code: 'TEST123456',
        payment_status: 'paid'
      })
      .returning()
      .execute();
    const bookingId = bookingResult[0].id;

    // Try to cancel with userId2
    const result = await cancelBooking(bookingId, userId2);
    expect(result).toBeNull();

    // Verify booking was not updated
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .execute();

    expect(bookings[0].status).toEqual('confirmed');
    expect(bookings[0].payment_status).toEqual('paid');
  });
});
