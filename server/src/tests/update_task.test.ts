
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let taskId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create another user for ownership tests
    const otherUserResult = await db.insert(usersTable)
      .values({
        username: 'otheruser',
        email: 'other@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    otherUserId = otherUserResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        completed: false,
        priority: 'low',
        due_date: new Date('2024-12-31'),
        user_id: userId
      })
      .returning()
      .execute();
    taskId = taskResult[0].id;
  });

  it('should update task title', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(input, userId);

    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.completed).toEqual(false); // Unchanged
    expect(result.priority).toEqual('low'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const newDueDate = new Date('2025-01-15');
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true,
      priority: 'high',
      due_date: newDueDate
    };

    const result = await updateTask(input, userId);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.priority).toEqual('high');
    expect(result.due_date).toEqual(newDueDate);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      description: null,
      due_date: null
    };

    const result = await updateTask(input, userId);

    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.title).toEqual('Original Task'); // Unchanged
  });

  it('should persist changes to database', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Persisted Title',
      completed: true
    };

    await updateTask(input, userId);

    // Verify changes persisted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Persisted Title');
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const input: UpdateTaskInput = {
      id: 99999,
      title: 'Non-existent task'
    };

    await expect(updateTask(input, userId)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when user tries to update another users task', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Unauthorized update'
    };

    await expect(updateTask(input, otherUserId)).rejects.toThrow(/not found or access denied/i);
  });

  it('should update only updated_at when no fields provided', async () => {
    const originalUpdatedAt = (await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute())[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateTaskInput = {
      id: taskId
    };

    const result = await updateTask(input, userId);

    expect(result.title).toEqual('Original Task'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});
