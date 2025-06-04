
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login with valid credentials', async () => {
    // Create test user with hashed password
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: passwordHash
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUser.email,
      password: testUser.password
    };

    const result = await login(loginInput);

    // Verify user data (without password_hash)
    expect(result.user.username).toEqual(testUser.username);
    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect((result.user as any).password_hash).toBeUndefined();

    // Verify token exists
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });

  it('should reject login with invalid email', async () => {
    // Create test user
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: passwordHash
      })
      .execute();

    const loginInput: LoginInput = {
      email: 'wrong@example.com',
      password: testUser.password
    };

    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should reject login with invalid password', async () => {
    // Create test user
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: passwordHash
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should reject login with non-existent user', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });
});
