
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type GetTasksInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  let testUserId: number;
  let otherUserId: number;

  beforeEach(async () => {
    await createDB();

    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'hashedpassword'
        },
        {
          username: 'otheruser',
          email: 'other@example.com',
          password_hash: 'hashedpassword'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test tasks for testUser
    await db.insert(tasksTable)
      .values([
        {
          title: 'Complete project',
          description: 'Finish the task management app',
          completed: false,
          priority: 'high',
          due_date: new Date('2024-12-31'),
          user_id: testUserId
        },
        {
          title: 'Buy groceries',
          description: 'Milk, bread, eggs',
          completed: true,
          priority: 'low',
          due_date: new Date('2024-01-15'),
          user_id: testUserId
        },
        {
          title: 'Call dentist',
          description: null,
          completed: false,
          priority: 'medium',
          due_date: null,
          user_id: testUserId
        }
      ])
      .execute();

    // Create task for other user to test isolation
    await db.insert(tasksTable)
      .values({
        title: 'Other user task',
        description: 'Should not appear in results',
        completed: false,
        priority: 'high',
        user_id: otherUserId
      })
      .execute();
  });

  afterEach(resetDB);

  it('should return all tasks for user when no filters applied', async () => {
    const input: GetTasksInput = {};
    const result = await getTasks(input, testUserId);

    expect(result).toHaveLength(3);
    
    // Verify all tasks belong to the correct user
    result.forEach(task => {
      expect(task.user_id).toEqual(testUserId);
    });

    // Verify task titles are present
    const titles = result.map(task => task.title).sort();
    expect(titles).toEqual(['Buy groceries', 'Call dentist', 'Complete project']);
  });

  it('should filter tasks by completed status', async () => {
    const completedInput: GetTasksInput = { completed: true };
    const completedResult = await getTasks(completedInput, testUserId);

    expect(completedResult).toHaveLength(1);
    expect(completedResult[0].title).toEqual('Buy groceries');
    expect(completedResult[0].completed).toBe(true);

    const incompleteInput: GetTasksInput = { completed: false };
    const incompleteResult = await getTasks(incompleteInput, testUserId);

    expect(incompleteResult).toHaveLength(2);
    incompleteResult.forEach(task => {
      expect(task.completed).toBe(false);
    });
  });

  it('should filter tasks by priority', async () => {
    const highPriorityInput: GetTasksInput = { priority: 'high' };
    const highPriorityResult = await getTasks(highPriorityInput, testUserId);

    expect(highPriorityResult).toHaveLength(1);
    expect(highPriorityResult[0].title).toEqual('Complete project');
    expect(highPriorityResult[0].priority).toEqual('high');

    const lowPriorityInput: GetTasksInput = { priority: 'low' };
    const lowPriorityResult = await getTasks(lowPriorityInput, testUserId);

    expect(lowPriorityResult).toHaveLength(1);
    expect(lowPriorityResult[0].title).toEqual('Buy groceries');
    expect(lowPriorityResult[0].priority).toEqual('low');
  });

  it('should filter tasks by both completed status and priority', async () => {
    const input: GetTasksInput = { completed: false, priority: 'high' };
    const result = await getTasks(input, testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Complete project');
    expect(result[0].completed).toBe(false);
    expect(result[0].priority).toEqual('high');
  });

  it('should return empty array when no tasks match filters', async () => {
    const input: GetTasksInput = { completed: true, priority: 'high' };
    const result = await getTasks(input, testUserId);

    expect(result).toHaveLength(0);
  });

  it('should only return tasks for the specified user', async () => {
    const input: GetTasksInput = {};
    const result = await getTasks(input, testUserId);

    // Should have 3 tasks for testUser, not 4 total
    expect(result).toHaveLength(3);
    
    // Verify no tasks from other user
    const otherUserTasks = result.filter(task => task.user_id === otherUserId);
    expect(otherUserTasks).toHaveLength(0);
  });

  it('should return tasks with correct data structure', async () => {
    const input: GetTasksInput = {};
    const result = await getTasks(input, testUserId);

    expect(result.length).toBeGreaterThan(0);
    
    const task = result[0];
    expect(task.id).toBeDefined();
    expect(typeof task.title).toBe('string');
    expect(typeof task.completed).toBe('boolean');
    expect(['low', 'medium', 'high']).toContain(task.priority);
    expect(typeof task.user_id).toBe('number');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });
});
