
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  registerInputSchema, 
  loginInputSchema, 
  createTaskInputSchema,
  updateTaskInputSchema,
  deleteTaskInputSchema,
  getTasksInputSchema
} from './schema';
import { register } from './handlers/register';
import { login } from './handlers/login';
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { getTaskById } from './handlers/get_task_by_id';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Mock authentication context - in real app, implement JWT verification
const authenticatedProcedure = publicProcedure.use(async ({ next, ctx }) => {
  // This is a simplified auth check - implement proper JWT verification
  const userId = 1; // Mock user ID - replace with actual token verification
  return next({
    ctx: {
      ...ctx,
      userId,
    },
  });
});

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Auth routes
  register: publicProcedure
    .input(registerInputSchema)
    .mutation(({ input }) => register(input)),
  
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  
  // Task routes (authenticated)
  createTask: authenticatedProcedure
    .input(createTaskInputSchema)
    .mutation(({ input, ctx }) => createTask(input, ctx.userId)),
  
  getTasks: authenticatedProcedure
    .input(getTasksInputSchema)
    .query(({ input, ctx }) => getTasks(input, ctx.userId)),
  
  getTaskById: authenticatedProcedure
    .input(deleteTaskInputSchema) // Reuse schema with just id
    .query(({ input, ctx }) => getTaskById(input.id, ctx.userId)),
  
  updateTask: authenticatedProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input, ctx }) => updateTask(input, ctx.userId)),
  
  deleteTask: authenticatedProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input, ctx }) => deleteTask(input, ctx.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
