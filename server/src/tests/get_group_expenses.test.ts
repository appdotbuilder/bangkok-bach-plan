
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, groupsTable, expensesTable } from '../db/schema';
import { getGroupExpenses } from '../handlers/get_group_expenses';

describe('getGroupExpenses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return expenses for a specific group', async () => {
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
    const userId = userResult[0].id;

    // Create test group
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        organizer_id: userId
      })
      .returning()
      .execute();
    const groupId = groupResult[0].id;

    // Create test expenses
    await db.insert(expensesTable)
      .values([
        {
          group_id: groupId,
          payer_id: userId,
          description: 'Dinner',
          amount: '50.00',
          category: 'food'
        },
        {
          group_id: groupId,
          payer_id: userId,
          description: 'Drinks',
          amount: '25.50',
          category: 'beverages'
        }
      ])
      .execute();

    const expenses = await getGroupExpenses(groupId);

    expect(expenses).toHaveLength(2);
    expect(expenses[0].description).toEqual('Dinner');
    expect(expenses[0].amount).toEqual(50.00);
    expect(typeof expenses[0].amount).toBe('number');
    expect(expenses[0].category).toEqual('food');
    expect(expenses[1].description).toEqual('Drinks');
    expect(expenses[1].amount).toEqual(25.50);
    expect(typeof expenses[1].amount).toBe('number');
    expect(expenses[1].category).toEqual('beverages');
  });

  it('should return empty array for group with no expenses', async () => {
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
    const userId = userResult[0].id;

    // Create test group
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Empty Group',
        organizer_id: userId
      })
      .returning()
      .execute();
    const groupId = groupResult[0].id;

    const expenses = await getGroupExpenses(groupId);

    expect(expenses).toHaveLength(0);
    expect(expenses).toEqual([]);
  });

  it('should only return expenses for the specified group', async () => {
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
    const userId = userResult[0].id;

    // Create two test groups
    const group1Result = await db.insert(groupsTable)
      .values({
        name: 'Group 1',
        organizer_id: userId
      })
      .returning()
      .execute();
    const group1Id = group1Result[0].id;

    const group2Result = await db.insert(groupsTable)
      .values({
        name: 'Group 2',
        organizer_id: userId
      })
      .returning()
      .execute();
    const group2Id = group2Result[0].id;

    // Create expenses for both groups
    await db.insert(expensesTable)
      .values([
        {
          group_id: group1Id,
          payer_id: userId,
          description: 'Group 1 Expense',
          amount: '30.00',
          category: 'food'
        },
        {
          group_id: group2Id,
          payer_id: userId,
          description: 'Group 2 Expense',
          amount: '40.00',
          category: 'drinks'
        }
      ])
      .execute();

    const group1Expenses = await getGroupExpenses(group1Id);

    expect(group1Expenses).toHaveLength(1);
    expect(group1Expenses[0].description).toEqual('Group 1 Expense');
    expect(group1Expenses[0].group_id).toEqual(group1Id);
  });
});
