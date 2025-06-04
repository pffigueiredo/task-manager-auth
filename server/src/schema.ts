
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.coerce.date().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Auth schemas
export const registerInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6)
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authResponseSchema = z.object({
  user: userSchema.omit({ password_hash: true }),
  token: z.string()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Task input schemas
export const createTaskInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.coerce.date().nullable().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.coerce.date().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

export const getTasksInputSchema = z.object({
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

export type GetTasksInput = z.infer<typeof getTasksInputSchema>;
