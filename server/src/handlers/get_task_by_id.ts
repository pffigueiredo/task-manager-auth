
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getTaskById = async (taskId: number, userId: number): Promise<Task> => {
  try {
    const results = await db.select()
      .from(tasksTable)
      .where(and(
        eq(tasksTable.id, taskId),
        eq(tasksTable.user_id, userId)
      ))
      .execute();

    if (results.length === 0) {
      throw new Error('Task not found');
    }

    return results[0];
  } catch (error) {
    console.error('Get task by ID failed:', error);
    throw error;
  }
};
