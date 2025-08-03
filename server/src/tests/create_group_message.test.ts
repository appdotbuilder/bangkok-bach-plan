
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groupsTable, groupMembersTable, groupMessagesTable } from '../db/schema';
import { type CreateGroupMessageInput } from '../schema';
import { createGroupMessage } from '../handlers/create_group_message';
import { eq, and } from 'drizzle-orm';

// Test input
const testInput: CreateGroupMessageInput = {
  group_id: 1,
  message: 'Hello everyone! Looking forward to our trip.'
};

describe('createGroupMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testGroupId: number;
  let nonMemberUserId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'member@test.com',
          password_hash: 'hash123',
          first_name: 'John',
          last_name: 'Doe'
        },
        {
          email: 'nonmember@test.com',
          password_hash: 'hash456',
          first_name: 'Jane',
          last_name: 'Smith'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    nonMemberUserId = users[1].id;

    // Create test group
    const groups = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        organizer_id: testUserId,
        description: 'A test group for messaging'
      })
      .returning()
      .execute();

    testGroupId = groups[0].id;

    // Add user as group member
    await db.insert(groupMembersTable)
      .values({
        group_id: testGroupId,
        user_id: testUserId,
        role: 'organizer'
      })
      .execute();

    // Update test input with actual group ID
    testInput.group_id = testGroupId;
  });

  it('should create a group message', async () => {
    const result = await createGroupMessage(testInput, testUserId);

    expect(result.group_id).toEqual(testGroupId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.message).toEqual(testInput.message);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save message to database', async () => {
    const result = await createGroupMessage(testInput, testUserId);

    const messages = await db.select()
      .from(groupMessagesTable)
      .where(eq(groupMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].group_id).toEqual(testGroupId);
    expect(messages[0].user_id).toEqual(testUserId);
    expect(messages[0].message).toEqual(testInput.message);
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject message from non-member', async () => {
    await expect(
      createGroupMessage(testInput, nonMemberUserId)
    ).rejects.toThrow(/not a member of this group/i);
  });

  it('should reject message for non-existent group', async () => {
    const invalidInput: CreateGroupMessageInput = {
      group_id: 99999,
      message: 'Test message'
    };

    await expect(
      createGroupMessage(invalidInput, testUserId)
    ).rejects.toThrow(/not a member of this group/i);
  });

  it('should handle multiple messages in sequence', async () => {
    const message1 = await createGroupMessage({
      group_id: testGroupId,
      message: 'First message'
    }, testUserId);

    const message2 = await createGroupMessage({
      group_id: testGroupId,
      message: 'Second message'
    }, testUserId);

    expect(message1.id).not.toEqual(message2.id);
    expect(message1.message).toEqual('First message');
    expect(message2.message).toEqual('Second message');
    expect(message2.created_at.getTime()).toBeGreaterThanOrEqual(message1.created_at.getTime());
  });
});
