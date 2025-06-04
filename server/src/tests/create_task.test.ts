
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashed_password'
};

const testTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  priority: 'high',
  due_date: new Date('2024-12-31')
};

describe('createTask', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testTaskInput, userId);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.priority).toEqual('high');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.user_id).toEqual(userId);
    expect(result.completed).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields', async () => {
    const minimalInput: CreateTaskInput = {
      title: 'Minimal Task',
      priority: 'medium'
    };

    const result = await createTask(minimalInput, userId);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.priority).toEqual('medium');
    expect(result.due_date).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.completed).toEqual(false);
  });

  it('should save task to database', async () => {
    const result = await createTask(testTaskInput, userId);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].priority).toEqual('high');
    expect(tasks[0].user_id).toEqual(userId);
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const inputWithNullDesc: CreateTaskInput = {
      title: 'Task with null description',
      description: null,
      priority: 'low'
    };

    const result = await createTask(inputWithNullDesc, userId);

    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.priority).toEqual('low');
  });

  it('should handle null due_date correctly', async () => {
    const inputWithNullDate: CreateTaskInput = {
      title: 'Task with null due date',
      priority: 'medium',
      due_date: null
    };

    const result = await createTask(inputWithNullDate, userId);

    expect(result.title).toEqual('Task with null due date');
    expect(result.due_date).toBeNull();
    expect(result.priority).toEqual('medium');
  });
});
