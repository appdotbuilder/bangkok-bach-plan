
import { db } from '../db';
import { expensesTable, groupsTable } from '../db/schema';
import { type CreateExpenseInput, type Expense } from '../schema';
import { eq } from 'drizzle-orm';

export async function createExpense(input: CreateExpenseInput, payerId: number): Promise<Expense> {
  try {
    // Verify that the group exists
    const group = await db.select()
      .from(groupsTable)
      .where(eq(groupsTable.id, input.group_id))
      .execute();

    if (group.length === 0) {
      throw new Error(`Group with id ${input.group_id} not found`);
    }

    // Insert expense record
    const result = await db.insert(expensesTable)
      .values({
        group_id: input.group_id,
        payer_id: payerId,
        description: input.description,
        amount: input.amount.toString(), // Convert number to string for numeric column
        category: input.category,
        receipt_url: input.receipt_url || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const expense = result[0];
    return {
      ...expense,
      amount: parseFloat(expense.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Expense creation failed:', error);
    throw error;
  }
}
