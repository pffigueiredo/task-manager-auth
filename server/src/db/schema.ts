
import { serial, text, pgTable, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Priority enum
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  completed: boolean('completed').notNull().default(false),
  priority: priorityEnum('priority').notNull().default('medium'),
  due_date: timestamp('due_date'), // Nullable by default
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  tasks: many(tasksTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [tasksTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  tasks: tasksTable 
};
