
import { type Task } from '../schema';

export declare function getTaskById(taskId: number, userId: number): Promise<Task>;
