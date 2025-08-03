
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password_123',
  first_name: 'John',
  last_name: 'Doe',
  phone: '555-0123',
  role: 'user' as const,
  is_verified: true
};

const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when valid email is provided', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(loginInput);

    expect(result).toBeDefined();
    expect(result?.email).toEqual('test@example.com');
    expect(result?.first_name).toEqual('John');
    expect(result?.last_name).toEqual('Doe');
    expect(result?.phone).toEqual('555-0123');
    expect(result?.role).toEqual('user');
    expect(result?.is_verified).toEqual(true);
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const result = await loginUser({
      email: 'nonexistent@example.com',
      password: 'password123'
    });

    expect(result).toBeNull();
  });

  it('should return null when password is empty', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser({
      email: 'test@example.com',
      password: ''
    });

    expect(result).toBeNull();
  });

  it('should handle multiple users with different emails', async () => {
    // Create multiple test users
    await db.insert(usersTable)
      .values([
        testUser,
        {
          ...testUser,
          email: 'other@example.com',
          first_name: 'Jane'
        }
      ])
      .execute();

    const result = await loginUser({
      email: 'other@example.com',
      password: 'password123'
    });

    expect(result).toBeDefined();
    expect(result?.email).toEqual('other@example.com');
    expect(result?.first_name).toEqual('Jane');
  });

  it('should return user with all required fields', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(loginInput);

    expect(result).toBeDefined();
    expect(typeof result?.id).toBe('number');
    expect(typeof result?.email).toBe('string');
    expect(typeof result?.password_hash).toBe('string');
    expect(typeof result?.first_name).toBe('string');
    expect(typeof result?.last_name).toBe('string');
    expect(typeof result?.role).toBe('string');
    expect(typeof result?.is_verified).toBe('boolean');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });
});
