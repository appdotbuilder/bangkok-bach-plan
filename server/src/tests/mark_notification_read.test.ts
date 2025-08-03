
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notificationsTable } from '../db/schema';
import { markNotificationRead } from '../handlers/mark_notification_read';
import { eq } from 'drizzle-orm';

describe('markNotificationRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark notification as read when it belongs to the user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test notification
    const notificationResult = await db.insert(notificationsTable)
      .values({
        user_id: userId,
        type: 'booking_update',
        title: 'Test Notification',
        message: 'This is a test notification',
        is_read: false
      })
      .returning()
      .execute();
    const notificationId = notificationResult[0].id;

    // Mark notification as read
    const result = await markNotificationRead(notificationId, userId);

    // Should return true for successful update
    expect(result).toBe(true);

    // Verify notification is marked as read in database
    const updatedNotification = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .execute();

    expect(updatedNotification).toHaveLength(1);
    expect(updatedNotification[0].is_read).toBe(true);
  });

  it('should return false when notification does not belong to user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create notification for user1
    const notificationResult = await db.insert(notificationsTable)
      .values({
        user_id: user1Id,
        type: 'booking_update',
        title: 'Test Notification',
        message: 'This is a test notification',
        is_read: false
      })
      .returning()
      .execute();
    const notificationId = notificationResult[0].id;

    // Try to mark notification as read using user2's ID
    const result = await markNotificationRead(notificationId, user2Id);

    // Should return false since notification doesn't belong to user2
    expect(result).toBe(false);

    // Verify notification remains unread
    const notification = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .execute();

    expect(notification).toHaveLength(1);
    expect(notification[0].is_read).toBe(false);
  });

  it('should return false when notification does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Try to mark non-existent notification as read
    const result = await markNotificationRead(99999, userId);

    // Should return false for non-existent notification
    expect(result).toBe(false);
  });

  it('should not affect already read notifications', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create already read notification
    const notificationResult = await db.insert(notificationsTable)
      .values({
        user_id: userId,
        type: 'group_message',
        title: 'Already Read',
        message: 'This notification is already read',
        is_read: true
      })
      .returning()
      .execute();
    const notificationId = notificationResult[0].id;

    // Mark notification as read again
    const result = await markNotificationRead(notificationId, userId);

    // Should still return true for successful operation
    expect(result).toBe(true);

    // Verify notification remains read
    const notification = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .execute();

    expect(notification).toHaveLength(1);
    expect(notification[0].is_read).toBe(true);
  });
});
