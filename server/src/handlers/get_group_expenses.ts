
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type Expense } from '../schema';
import { eq } from 'drizzle-orm';

export async function getGroupExpenses(groupId: number): Promise<Expense[]> {
  try {
    const results = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.group_id, groupId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount)
    }));
  } catch (error) {
    console.error('Get group expenses failed:', error);
    throw error;
  }
}
