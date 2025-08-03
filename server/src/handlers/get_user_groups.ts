
import { db } from '../db';
import { groupsTable, groupMembersTable } from '../db/schema';
import { type Group } from '../schema';
import { eq, or } from 'drizzle-orm';

export async function getUserGroups(userId: number): Promise<Group[]> {
  try {
    // Get groups where user is organizer OR member
    const results = await db.select({
      id: groupsTable.id,
      name: groupsTable.name,
      description: groupsTable.description,
      organizer_id: groupsTable.organizer_id,
      event_date: groupsTable.event_date,
      total_budget: groupsTable.total_budget,
      member_count: groupsTable.member_count,
      is_active: groupsTable.is_active,
      created_at: groupsTable.created_at,
      updated_at: groupsTable.updated_at
    })
    .from(groupsTable)
    .leftJoin(groupMembersTable, eq(groupsTable.id, groupMembersTable.group_id))
    .where(
      or(
        eq(groupsTable.organizer_id, userId),
        eq(groupMembersTable.user_id, userId)
      )
    )
    .execute();

    // Remove duplicates (user could be both organizer and member)
    const uniqueGroups = new Map();
    
    results.forEach(result => {
      if (!uniqueGroups.has(result.id)) {
        uniqueGroups.set(result.id, {
          id: result.id,
          name: result.name,
          description: result.description,
          organizer_id: result.organizer_id,
          event_date: result.event_date,
          total_budget: result.total_budget ? parseFloat(result.total_budget) : null,
          member_count: result.member_count,
          is_active: result.is_active,
          created_at: result.created_at,
          updated_at: result.updated_at
        });
      }
    });

    return Array.from(uniqueGroups.values());
  } catch (error) {
    console.error('Failed to get user groups:', error);
    throw error;
  }
}
