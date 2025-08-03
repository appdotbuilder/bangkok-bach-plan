
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { groupsTable, groupMembersTable, usersTable } from '../db/schema';
import { type CreateGroupInput } from '../schema';
import { createGroup } from '../handlers/create_group';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'organizer@test.com',
  password_hash: 'hashed_password',
  first_name: 'John',
  last_name: 'Doe',
  role: 'user' as const
};

// Test input
const testInput: CreateGroupInput = {
  name: 'Bachelor Party Vegas',
  description: 'Epic bachelor party weekend in Vegas',
  event_date: new Date('2024-06-15'),
  total_budget: 5000.00
};

describe('createGroup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a group with all fields', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await createGroup(testInput, userId);

    // Basic field validation
    expect(result.name).toEqual('Bachelor Party Vegas');
    expect(result.description).toEqual('Epic bachelor party weekend in Vegas');
    expect(result.organizer_id).toEqual(userId);
    expect(result.event_date).toEqual(new Date('2024-06-15'));
    expect(result.total_budget).toEqual(5000.00);
    expect(typeof result.total_budget).toBe('number');
    expect(result.member_count).toEqual(1);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a minimal group with optional fields', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const minimalInput: CreateGroupInput = {
      name: 'Simple Group',
      description: null,
      event_date: null,
      total_budget: null
    };

    const result = await createGroup(minimalInput, userId);

    expect(result.name).toEqual('Simple Group');
    expect(result.description).toBeNull();
    expect(result.event_date).toBeNull();
    expect(result.total_budget).toBeNull();
    expect(result.member_count).toEqual(1);
    expect(result.is_active).toBe(true);
  });

  it('should save group to database', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await createGroup(testInput, userId);

    // Query group from database
    const groups = await db.select()
      .from(groupsTable)
      .where(eq(groupsTable.id, result.id))
      .execute();

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toEqual('Bachelor Party Vegas');
    expect(groups[0].description).toEqual('Epic bachelor party weekend in Vegas');
    expect(groups[0].organizer_id).toEqual(userId);
    expect(parseFloat(groups[0].total_budget!)).toEqual(5000.00);
    expect(groups[0].member_count).toEqual(1);
    expect(groups[0].is_active).toBe(true);
    expect(groups[0].created_at).toBeInstanceOf(Date);
  });

  it('should add organizer as group member', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const result = await createGroup(testInput, userId);

    // Query group members from database
    const members = await db.select()
      .from(groupMembersTable)
      .where(eq(groupMembersTable.group_id, result.id))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].group_id).toEqual(result.id);
    expect(members[0].user_id).toEqual(userId);
    expect(members[0].role).toEqual('organizer');
    expect(members[0].joined_at).toBeInstanceOf(Date);
  });

  it('should handle numeric budget conversion correctly', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const budgetInput: CreateGroupInput = {
      name: 'Budget Test Group',
      description: null,
      event_date: null,
      total_budget: 1234.56
    };

    const result = await createGroup(budgetInput, userId);

    // Verify numeric conversion
    expect(typeof result.total_budget).toBe('number');
    expect(result.total_budget).toEqual(1234.56);

    // Verify database storage
    const groups = await db.select()
      .from(groupsTable)
      .where(eq(groupsTable.id, result.id))
      .execute();

    expect(parseFloat(groups[0].total_budget!)).toEqual(1234.56);
  });
});
