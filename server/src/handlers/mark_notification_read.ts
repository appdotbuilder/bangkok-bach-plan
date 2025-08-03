
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function markNotificationRead(notificationId: number, userId: number): Promise<boolean> {
  try {
    // Update the notification as read only if it belongs to the user
    const result = await db.update(notificationsTable)
      .set({ is_read: true })
      .where(and(
        eq(notificationsTable.id, notificationId),
        eq(notificationsTable.user_id, userId)
      ))
      .returning()
      .execute();

    // Return true if a notification was updated, false if not found or doesn't belong to user
    return result.length > 0;
  } catch (error) {
    console.error('Mark notification read failed:', error);
    throw error;
  }
}
