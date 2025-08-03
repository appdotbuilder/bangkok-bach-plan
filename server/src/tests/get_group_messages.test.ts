
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groupsTable, groupMembersTable, groupMessagesTable } from '../db/schema';
import { getGroupMessages } from '../handlers/get_group_messages';

describe('getGroupMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return messages for a specific group in chronological order', async () => {
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

    // Create test group
    const [group] = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        description: 'A test group',
        organizer_id: user.id
      })
      .returning()
      .execute();

    // Create test messages with different timestamps
    const message1 = await db.insert(groupMessagesTable)
      .values({
        group_id: group.id,
        user_id: user.id,
        message: 'First message'
      })
      .returning()
      .execute();

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const message2 = await db.insert(groupMessagesTable)
      .values({
        group_id: group.id,
        user_id: user.id,
        message: 'Second message'
      })
      .returning()
      .execute();

    const result = await getGroupMessages(group.id);

    expect(result).toHaveLength(2);
    expect(result[0].message).toBe('First message');
    expect(result[1].message).toBe('Second message');
    expect(result[0].group_id).toBe(group.id);
    expect(result[0].user_id).toBe(user.id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Verify chronological order
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });

  it('should return empty array for group with no messages', async () => {
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

    // Create test group without messages
    const [group] = await db.insert(groupsTable)
      .values({
        name: 'Empty Group',
        description: 'A group with no messages',
        organizer_id: user.id
      })
      .returning()
      .execute();

    const result = await getGroupMessages(group.id);

    expect(result).toHaveLength(0);
  });

  it('should only return messages for the specified group', async () => {
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

    // Create two test groups
    const [group1] = await db.insert(groupsTable)
      .values({
        name: 'Group 1',
        description: 'First group',
        organizer_id: user.id
      })
      .returning()
      .execute();

    const [group2] = await db.insert(groupsTable)
      .values({
        name: 'Group 2',
        description: 'Second group',
        organizer_id: user.id
      })
      .returning()
      .execute();

    // Create messages for both groups
    await db.insert(groupMessagesTable)
      .values({
        group_id: group1.id,
        user_id: user.id,
        message: 'Message for group 1'
      })
      .execute();

    await db.insert(groupMessagesTable)
      .values({
        group_id: group2.id,
        user_id: user.id,
        message: 'Message for group 2'
      })
      .execute();

    const result = await getGroupMessages(group1.id);

    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('Message for group 1');
    expect(result[0].group_id).toBe(group1.id);
  });

  it('should handle multiple users in the same group', async () => {
    // Create test users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'One'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    // Create test group
    const [group] = await db.insert(groupsTable)
      .values({
        name: 'Multi-user Group',
        description: 'A group with multiple users',
        organizer_id: user1.id
      })
      .returning()
      .execute();

    // Create messages from different users
    await db.insert(groupMessagesTable)
      .values({
        group_id: group.id,
        user_id: user1.id,
        message: 'Message from user 1'
      })
      .execute();

    await db.insert(groupMessagesTable)
      .values({
        group_id: group.id,
        user_id: user2.id,
        message: 'Message from user 2'
      })
      .execute();

    const result = await getGroupMessages(group.id);

    expect(result).toHaveLength(2);
    expect(result.some(msg => msg.user_id === user1.id && msg.message === 'Message from user 1')).toBe(true);
    expect(result.some(msg => msg.user_id === user2.id && msg.message === 'Message from user 2')).toBe(true);
  });
});
