
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groupsTable, groupMembersTable } from '../db/schema';
import { getUserGroups } from '../handlers/get_user_groups';

describe('getUserGroups', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return groups where user is organizer', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create group where user is organizer
    const [group] = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        description: 'A test group',
        organizer_id: user.id,
        total_budget: '1000.00'
      })
      .returning()
      .execute();

    const result = await getUserGroups(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(group.id);
    expect(result[0].name).toEqual('Test Group');
    expect(result[0].description).toEqual('A test group');
    expect(result[0].organizer_id).toEqual(user.id);
    expect(result[0].total_budget).toEqual(1000);
    expect(result[0].member_count).toEqual(1);
    expect(result[0].is_active).toEqual(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return groups where user is member', async () => {
    // Create test users
    const [organizer] = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashed_password',
        first_name: 'Organizer',
        last_name: 'User'
      })
      .returning()
      .execute();

    const [member] = await db.insert(usersTable)
      .values({
        email: 'member@example.com',
        password_hash: 'hashed_password',
        first_name: 'Member',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create group with organizer
    const [group] = await db.insert(groupsTable)
      .values({
        name: 'Member Group',
        description: 'A group where user is member',
        organizer_id: organizer.id
      })
      .returning()
      .execute();

    // Add member to group
    await db.insert(groupMembersTable)
      .values({
        group_id: group.id,
        user_id: member.id,
        role: 'member'
      })
      .execute();

    const result = await getUserGroups(member.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(group.id);
    expect(result[0].name).toEqual('Member Group');
    expect(result[0].organizer_id).toEqual(organizer.id);
  });

  it('should return groups where user is both organizer and member', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create group where user is organizer
    const [group] = await db.insert(groupsTable)
      .values({
        name: 'Dual Role Group',
        description: 'User is both organizer and member',
        organizer_id: user.id
      })
      .returning()
      .execute();

    // Add user as member too (edge case)
    await db.insert(groupMembersTable)
      .values({
        group_id: group.id,
        user_id: user.id,
        role: 'organizer'
      })
      .execute();

    const result = await getUserGroups(user.id);

    // Should return only one group (no duplicates)
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(group.id);
    expect(result[0].name).toEqual('Dual Role Group');
  });

  it('should return multiple groups for user', async () => {
    // Create test users
    const [organizer] = await db.insert(usersTable)
      .values({
        email: 'organizer@example.com',
        password_hash: 'hashed_password',
        first_name: 'Organizer',
        last_name: 'User'
      })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create group where user is organizer
    const [ownGroup] = await db.insert(groupsTable)
      .values({
        name: 'Own Group',
        description: 'User organizes this',
        organizer_id: user.id
      })
      .returning()
      .execute();

    // Create group where user is member
    const [memberGroup] = await db.insert(groupsTable)
      .values({
        name: 'Member Group',
        description: 'User is member here',
        organizer_id: organizer.id
      })
      .returning()
      .execute();

    // Add user as member to second group
    await db.insert(groupMembersTable)
      .values({
        group_id: memberGroup.id,
        user_id: user.id,
        role: 'member'
      })
      .execute();

    const result = await getUserGroups(user.id);

    expect(result).toHaveLength(2);
    
    const groupNames = result.map(g => g.name).sort();
    expect(groupNames).toEqual(['Member Group', 'Own Group']);
  });

  it('should return empty array for user with no groups', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    const result = await getUserGroups(user.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle numeric conversion for total_budget', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',  
        first_name: 'Test',
        last_name: 'User'
      })
      .returning()
      .execute();

    // Create group with numeric budget
    await db.insert(groupsTable)
      .values({
        name: 'Budget Group',
        description: 'Has a budget',
        organizer_id: user.id,
        total_budget: '2500.75'
      })
      .execute();

    const result = await getUserGroups(user.id);

    expect(result).toHaveLength(1);
    expect(typeof result[0].total_budget).toBe('number');
    expect(result[0].total_budget).toEqual(2500.75);
  });
});
