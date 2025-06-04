
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  try {
    // Check if user already exists with this email
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Check if username is already taken
    const existingUsername = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (existingUsername.length > 0) {
      throw new Error('Username is already taken');
    }

    // Hash the password using Bun's built-in password hashing
    const password_hash = await Bun.password.hash(input.password);

    // Create new user
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: password_hash
      })
      .returning()
      .execute();

    const user = result[0];

    // Generate a simple JWT-like token (in real app, use proper JWT library)
    const token = btoa(JSON.stringify({
      userId: user.id,
      email: user.email,
      timestamp: Date.now()
    }));

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token: token
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};
