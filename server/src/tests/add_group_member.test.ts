
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groupsTable, groupMembersTable } from '../db/schema';
import { addGroupMember } from '../handlers/add_group_member';
import { eq, and } from 'drizzle-orm';

describe('addGroupMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a member to a group', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create organizer user
    const organizerResult = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Organizer',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create test group
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        organizer_id: organizerResult[0].id,
        member_count: 1
      })
      .returning()
      .execute();

    const result = await addGroupMember(groupResult[0].id, userResult[0].id);

    // Verify member was added correctly
    expect(result.group_id).toEqual(groupResult[0].id);
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.role).toEqual('member');
    expect(result.id).toBeDefined();
    expect(result.joined_at).toBeInstanceOf(Date);
  });

  it('should save member to database and update group member count', async () => {
    // Create test user and organizer
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const organizerResult = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Organizer',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create test group with initial member count of 1
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        organizer_id: organizerResult[0].id,
        member_count: 1
      })
      .returning()
      .execute();

    await addGroupMember(groupResult[0].id, userResult[0].id);

    // Verify member was saved to database
    const members = await db.select()
      .from(groupMembersTable)
      .where(and(
        eq(groupMembersTable.group_id, groupResult[0].id),
        eq(groupMembersTable.user_id, userResult[0].id)
      ))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].role).toEqual('member');
    expect(members[0].joined_at).toBeInstanceOf(Date);

    // Verify group member count was updated
    const updatedGroup = await db.select()
      .from(groupsTable)
      .where(eq(groupsTable.id, groupResult[0].id))
      .execute();

    expect(updatedGroup[0].member_count).toEqual(2);
    expect(updatedGroup[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error if group does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    await expect(addGroupMember(999, userResult[0].id)).rejects.toThrow(/group not found/i);
  });

  it('should throw error if user is already a member', async () => {
    // Create test user and organizer
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const organizerResult = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Organizer',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create test group
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        organizer_id: organizerResult[0].id,
        member_count: 1
      })
      .returning()
      .execute();

    // Add member first time
    await addGroupMember(groupResult[0].id, userResult[0].id);

    // Try to add same member again
    await expect(addGroupMember(groupResult[0].id, userResult[0].id)).rejects.toThrow(/already a member/i);
  });

  it('should handle multiple members being added sequentially', async () => {
    // Create multiple test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    const organizerResult = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Organizer',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create test group
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        organizer_id: organizerResult[0].id,
        member_count: 1
      })
      .returning()
      .execute();

    // Add first member
    await addGroupMember(groupResult[0].id, user1Result[0].id);

    // Add second member
    await addGroupMember(groupResult[0].id, user2Result[0].id);

    // Verify both members exist and member count is correct
    const members = await db.select()
      .from(groupMembersTable)
      .where(eq(groupMembersTable.group_id, groupResult[0].id))
      .execute();

    expect(members).toHaveLength(2);

    const updatedGroup = await db.select()
      .from(groupsTable)
      .where(eq(groupsTable.id, groupResult[0].id))
      .execute();

    expect(updatedGroup[0].member_count).toEqual(3); // 1 organizer + 2 added members
  });
});
