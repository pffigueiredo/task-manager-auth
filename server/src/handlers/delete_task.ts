
import { type DeleteTaskInput } from '../schema';

export declare function deleteTask(input: DeleteTaskInput, userId: number): Promise<{ success: boolean }>;
