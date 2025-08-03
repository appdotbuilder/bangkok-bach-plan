
import { db } from '../db';
import { groupMembersTable, groupsTable } from '../db/schema';
import { type GroupMember } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function addGroupMember(groupId: number, userId: number): Promise<GroupMember> {
  try {
    // First verify the group exists
    const existingGroup = await db.select()
      .from(groupsTable)
      .where(eq(groupsTable.id, groupId))
      .execute();

    if (existingGroup.length === 0) {
      throw new Error('Group not found');
    }

    // Check if user is already a member
    const existingMember = await db.select()
      .from(groupMembersTable)
      .where(and(
        eq(groupMembersTable.group_id, groupId),
        eq(groupMembersTable.user_id, userId)
      ))
      .execute();

    if (existingMember.length > 0) {
      throw new Error('User is already a member of this group');
    }

    // Add the new member
    const result = await db.insert(groupMembersTable)
      .values({
        group_id: groupId,
        user_id: userId,
        role: 'member'
      })
      .returning()
      .execute();

    // Update the group's member count
    await db.update(groupsTable)
      .set({
        member_count: existingGroup[0].member_count + 1,
        updated_at: new Date()
      })
      .where(eq(groupsTable.id, groupId))
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add group member failed:', error);
    throw error;
  }
}
