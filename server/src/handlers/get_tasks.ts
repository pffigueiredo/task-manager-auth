
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTasksInput, type Task } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const getTasks = async (input: GetTasksInput, userId: number): Promise<Task[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(tasksTable.user_id, userId)
    ];

    // Add optional filters
    if (input.completed !== undefined) {
      conditions.push(eq(tasksTable.completed, input.completed));
    }

    if (input.priority) {
      conditions.push(eq(tasksTable.priority, input.priority));
    }

    // Execute query with conditions
    const results = await db.select()
      .from(tasksTable)
      .where(and(...conditions))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw error;
  }
};
