
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a task that belongs to the user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Task to be deleted',
        priority: 'medium',
        user_id: userId
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    const input: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(input, userId);

    expect(result.success).toBe(true);

    // Verify task was actually deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when task does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: DeleteTaskInput = { id: 999 }; // Non-existent task ID
    const result = await deleteTask(input, userId);

    expect(result.success).toBe(false);
  });

  it('should return false when task belongs to different user', async () => {
    // Create first user and their task
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'User 1 Task',
        description: 'Task belonging to user 1',
        priority: 'high',
        user_id: user1Id
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Try to delete user1's task as user2
    const input: DeleteTaskInput = { id: taskId };
    const result = await deleteTask(input, user2Id);

    expect(result.success).toBe(false);

    // Verify task still exists
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('User 1 Task');
  });

  it('should only delete the specified task', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create multiple test tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        priority: 'low',
        user_id: userId
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        priority: 'high',
        user_id: userId
      })
      .returning()
      .execute();

    const task1Id = task1Result[0].id;
    const task2Id = task2Result[0].id;

    // Delete only the first task
    const input: DeleteTaskInput = { id: task1Id };
    const result = await deleteTask(input, userId);

    expect(result.success).toBe(true);

    // Verify only task1 was deleted
    const task1Check = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1Id))
      .execute();

    const task2Check = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2Id))
      .execute();

    expect(task1Check).toHaveLength(0);
    expect(task2Check).toHaveLength(1);
    expect(task2Check[0].title).toEqual('Task 2');
  });
});
