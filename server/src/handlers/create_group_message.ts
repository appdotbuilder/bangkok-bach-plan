
import { db } from '../db';
import { groupMessagesTable, groupMembersTable } from '../db/schema';
import { type CreateGroupMessageInput, type GroupMessage } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createGroupMessage(input: CreateGroupMessageInput, userId: number): Promise<GroupMessage> {
  try {
    // Verify user is a member of the group
    const membership = await db.select()
      .from(groupMembersTable)
      .where(and(
        eq(groupMembersTable.group_id, input.group_id),
        eq(groupMembersTable.user_id, userId)
      ))
      .execute();

    if (membership.length === 0) {
      throw new Error('User is not a member of this group');
    }

    // Insert the message
    const result = await db.insert(groupMessagesTable)
      .values({
        group_id: input.group_id,
        user_id: userId,
        message: input.message
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Group message creation failed:', error);
    throw error;
  }
}
