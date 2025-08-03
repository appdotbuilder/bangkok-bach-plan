
import { db } from '../db';
import { groupMessagesTable } from '../db/schema';
import { type GroupMessage } from '../schema';
import { eq, asc } from 'drizzle-orm';

export async function getGroupMessages(groupId: number): Promise<GroupMessage[]> {
  try {
    const results = await db.select()
      .from(groupMessagesTable)
      .where(eq(groupMessagesTable.group_id, groupId))
      .orderBy(asc(groupMessagesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch group messages:', error);
    throw error;
  }
}
