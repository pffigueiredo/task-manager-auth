
import { type GetTasksInput, type Task } from '../schema';

export declare function getTasks(input: GetTasksInput, userId: number): Promise<Task[]>;
