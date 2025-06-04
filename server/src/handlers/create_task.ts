
import { type CreateTaskInput, type Task } from '../schema';

export declare function createTask(input: CreateTaskInput, userId: number): Promise<Task>;
