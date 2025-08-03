
import { db } from '../db';
import { groupsTable, groupMembersTable } from '../db/schema';
import { type CreateGroupInput, type Group } from '../schema';

export const createGroup = async (input: CreateGroupInput, organizerId: number): Promise<Group> => {
  try {
    // Insert group record
    const groupResult = await db.insert(groupsTable)
      .values({
        name: input.name,
        description: input.description || null,
        organizer_id: organizerId,
        event_date: input.event_date || null,
        total_budget: input.total_budget ? input.total_budget.toString() : null, // Convert number to string for numeric column
        member_count: 1, // Default to 1 for the organizer
        is_active: true
      })
      .returning()
      .execute();

    const group = groupResult[0];

    // Add organizer as the first group member with 'organizer' role
    await db.insert(groupMembersTable)
      .values({
        group_id: group.id,
        user_id: organizerId,
        role: 'organizer'
      })
      .execute();

    // Convert numeric fields back to numbers before returning
    return {
      ...group,
      total_budget: group.total_budget ? parseFloat(group.total_budget) : null
    };
  } catch (error) {
    console.error('Group creation failed:', error);
    throw error;
  }
};
