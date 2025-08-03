
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { type Notification } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserNotifications(userId: number): Promise<Notification[]> {
  try {
    const results = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.user_id, userId))
      .orderBy(
        // Unread notifications first (false < true), then by creation time descending
        notificationsTable.is_read,
        desc(notificationsTable.created_at)
      )
      .execute();

    return results.map(notification => ({
      ...notification,
      // Ensure data field is properly typed
      data: notification.data as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Failed to fetch user notifications:', error);
    throw error;
  }
}
