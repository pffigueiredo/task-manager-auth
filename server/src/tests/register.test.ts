
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterInput } from '../schema';
import { register } from '../handlers/register';
import { eq } from 'drizzle-orm';

const testInput: RegisterInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

describe('register', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user', async () => {
    const result = await register(testInput);

    // Verify user data
    expect(result.user.username).toEqual('testuser');
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  it('should save user to database with hashed password', async () => {
    const result = await register(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].password_hash).not.toEqual('password123'); // Password should be hashed
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate a valid token', async () => {
    const result = register(testInput);

    expect(result).resolves.toHaveProperty('token');
    const response = await result;
    expect(typeof response.token).toBe('string');
    expect(response.token.length).toBeGreaterThan(0);
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await register(testInput);

    // Try to create another user with same email
    const duplicateInput: RegisterInput = {
      username: 'differentuser',
      email: 'test@example.com', // Same email
      password: 'password456'
    };

    await expect(register(duplicateInput)).rejects.toThrow(/email already exists/i);
  });

  it('should reject duplicate username', async () => {
    // Create first user
    await register(testInput);

    // Try to create another user with same username
    const duplicateInput: RegisterInput = {
      username: 'testuser', // Same username
      email: 'different@example.com',
      password: 'password456'
    };

    await expect(register(duplicateInput)).rejects.toThrow(/username is already taken/i);
  });

  it('should not include password hash in response', async () => {
    const result = await register(testInput);

    // Ensure password_hash is not included in the user object
    expect(result.user).not.toHaveProperty('password_hash');
    expect(Object.keys(result.user)).toEqual(['id', 'username', 'email', 'created_at']);
  });
});
