
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { getTaskById } from '../handlers/get_task_by_id';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

const testTask = {
  title: 'Test Task',
  description: 'A task for testing',
  completed: false,
  priority: 'high' as const,
  due_date: new Date('2024-12-31'),
  user_id: 1
};

describe('getTaskById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a task by ID', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: userId
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    // Get the task
    const result = await getTaskById(taskId, userId);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.completed).toEqual(false);
    expect(result.priority).toEqual('high');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when task does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Try to get non-existent task
    await expect(getTaskById(999, userId)).rejects.toThrow(/task not found/i);
  });

  it('should throw error when task belongs to different user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com',
        password_hash: 'hashed_password2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create task for user1
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: user1Id
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    // Try to get task as user2
    await expect(getTaskById(taskId, user2Id)).rejects.toThrow(/task not found/i);
  });

  it('should handle task with null description and due_date', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create task with null optional fields
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Simple Task',
        description: null,
        completed: true,
        priority: 'low' as const,
        due_date: null,
        user_id: userId
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    // Get the task
    const result = await getTaskById(taskId, userId);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Simple Task');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(true);
    expect(result.priority).toEqual('low');
    expect(result.due_date).toBeNull();
    expect(result.user_id).toEqual(userId);
  });
});
