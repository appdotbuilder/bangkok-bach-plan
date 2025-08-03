
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable, usersTable, groupsTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

describe('createExpense', () => {
  let userId: number;
  let groupId: number;

  beforeEach(async () => {
    await createDB();

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
    userId = userResult[0].id;

    // Create test group
    const groupResult = await db.insert(groupsTable)
      .values({
        name: 'Test Group',
        organizer_id: userId
      })
      .returning()
      .execute();
    groupId = groupResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateExpenseInput = {
    group_id: 0, // Will be set in tests
    description: 'Dinner at restaurant',
    amount: 150.75,
    category: 'food',
    receipt_url: 'https://example.com/receipt.jpg'
  };

  it('should create an expense', async () => {
    const input = { ...testInput, group_id: groupId };
    const result = await createExpense(input, userId);

    // Basic field validation
    expect(result.group_id).toEqual(groupId);
    expect(result.payer_id).toEqual(userId);
    expect(result.description).toEqual('Dinner at restaurant');
    expect(result.amount).toEqual(150.75);
    expect(typeof result.amount).toEqual('number');
    expect(result.category).toEqual('food');
    expect(result.receipt_url).toEqual('https://example.com/receipt.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    const input = { ...testInput, group_id: groupId };
    const result = await createExpense(input, userId);

    // Query using proper drizzle syntax
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].group_id).toEqual(groupId);
    expect(expenses[0].payer_id).toEqual(userId);
    expect(expenses[0].description).toEqual('Dinner at restaurant');
    expect(parseFloat(expenses[0].amount)).toEqual(150.75);
    expect(expenses[0].category).toEqual('food');
    expect(expenses[0].receipt_url).toEqual('https://example.com/receipt.jpg');
    expect(expenses[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null receipt_url', async () => {
    const input = { 
      ...testInput, 
      group_id: groupId,
      receipt_url: undefined
    };
    const result = await createExpense(input, userId);

    expect(result.receipt_url).toBeNull();

    // Verify in database
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses[0].receipt_url).toBeNull();
  });

  it('should throw error for non-existent group', async () => {
    const input = { ...testInput, group_id: 99999 };

    await expect(createExpense(input, userId)).rejects.toThrow(/Group with id 99999 not found/i);
  });

  it('should handle decimal amounts correctly', async () => {
    const input = { 
      ...testInput, 
      group_id: groupId,
      amount: 25.99
    };
    const result = await createExpense(input, userId);

    expect(result.amount).toEqual(25.99);
    expect(typeof result.amount).toEqual('number');

    // Verify precise decimal storage in database
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(parseFloat(expenses[0].amount)).toEqual(25.99);
  });
});
