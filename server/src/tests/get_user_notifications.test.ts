
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notificationsTable } from '../db/schema';
import { getUserNotifications } from '../handlers/get_user_notifications';

describe('getUserNotifications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return notifications for a user ordered by read status and creation time', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create notifications - mix of read and unread
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(notificationsTable)
      .values([
        {
          user_id: user.id,
          type: 'booking_update',
          title: 'Read Notification 1',
          message: 'This is a read notification',
          is_read: true,
          created_at: twoHoursAgo
        },
        {
          user_id: user.id,
          type: 'group_message',
          title: 'Unread Notification 1',
          message: 'This is an unread notification',
          is_read: false,
          created_at: oneHourAgo
        },
        {
          user_id: user.id,
          type: 'price_alert',
          title: 'Unread Notification 2',
          message: 'This is another unread notification',
          is_read: false,
          created_at: now
        },
        {
          user_id: user.id,
          type: 'payment_reminder',
          title: 'Read Notification 2',
          message: 'This is another read notification',
          is_read: true,
          created_at: now
        }
      ])
      .execute();

    const result = await getUserNotifications(user.id);

    expect(result).toHaveLength(4);

    // First two should be unread notifications, ordered by creation time descending
    expect(result[0].is_read).toBe(false);
    expect(result[0].title).toBe('Unread Notification 2');
    expect(result[1].is_read).toBe(false);
    expect(result[1].title).toBe('Unread Notification 1');

    // Last two should be read notifications, ordered by creation time descending
    expect(result[2].is_read).toBe(true);
    expect(result[2].title).toBe('Read Notification 2');
    expect(result[3].is_read).toBe(true);
    expect(result[3].title).toBe('Read Notification 1');
  });

  it('should return empty array for user with no notifications', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const result = await getUserNotifications(user.id);

    expect(result).toHaveLength(0);
  });

  it('should handle notifications with data field correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create notification with JSON data
    const testData = { booking_id: 123, venue_name: 'Test Venue' };
    await db.insert(notificationsTable)
      .values({
        user_id: user.id,
        type: 'booking_update',
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed',
        data: testData,
        is_read: false
      })
      .execute();

    const result = await getUserNotifications(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual(testData);
    expect(result[0].title).toBe('Booking Confirmed');
    expect(result[0].type).toBe('booking_update');
  });

  it('should only return notifications for the specified user', async () => {
    // Create two test users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    // Create notifications for both users
    await db.insert(notificationsTable)
      .values([
        {
          user_id: user1.id,
          type: 'booking_update',
          title: 'User 1 Notification',
          message: 'This is for user 1',
          is_read: false
        },
        {
          user_id: user2.id,
          type: 'group_message',
          title: 'User 2 Notification',
          message: 'This is for user 2',
          is_read: false
        }
      ])
      .execute();

    const result = await getUserNotifications(user1.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('User 1 Notification');
    expect(result[0].user_id).toBe(user1.id);
  });
});
