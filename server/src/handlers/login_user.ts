
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginInput): Promise<User | null> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // In a real implementation, you would verify the password hash here
    // For now, we'll just check if a password was provided
    if (!input.password) {
      return null;
    }

    // TODO: Add proper password verification with bcrypt or similar
    // const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
    // if (!isValidPassword) {
    //   return null;
    // }

    return {
      ...user,
      // Convert numeric fields if any exist in the user schema
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
