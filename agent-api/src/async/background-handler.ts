/**
 * BackgroundTaskHandler - Handle background tasks using ctx.waitUntil()
 * 
 * This handler is designed for Cloudflare Workers to run tasks in the background
 * without blocking the response to the client. It uses ctx.waitUntil() to ensure
 * tasks complete even after the response is sent.
 */

/**
 * Represents a background task configuration
 */
export interface BackgroundTask<T = unknown> {
  id: string;
  task: () => Promise<T>;
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

/**
 * Configuration for the background task handler
 */
export interface BackgroundTaskConfig {
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * BackgroundTaskHandler class for managing background operations
 * Uses ctx.waitUntil() pattern for Cloudflare Workers
 */
export class BackgroundTaskHandler {
  private executionContext: ExecutionContext | undefined;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly pendingTasks: Map<string, Promise<void>> = new Map();

  constructor(config: BackgroundTaskConfig = {}, ctx?: ExecutionContext) {
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.executionContext = ctx;
  }

  /**
   * Set the execution context for waitUntil operations
   * @param ctx - The Cloudflare Workers ExecutionContext
   */
  setContext(ctx: ExecutionContext): void {
    if (!this.executionContext) {
      this.executionContext = ctx;
    }
  }

  /**
   * Check if an execution context is set
   * @returns boolean indicating if context is available
   */
  hasContext(): boolean {
    return this.executionContext !== undefined;
  }

  /**
   * Schedule a background task using ctx.waitUntil()
   * @param task - The background task to schedule
   */
  schedule<T>(task: BackgroundTask<T>): void {
    const taskPromise = this.executeWithRetry(task);
    this.pendingTasks.set(task.id, taskPromise);

    if (this.executionContext) {
      this.executionContext.waitUntil(
        taskPromise.finally(() => {
          this.pendingTasks.delete(task.id);
        })
      );
    }
  }

  /**
   * Execute a task with retry logic
   * @param task - The background task to execute
   * @param attempt - Current attempt number
   */
  private async executeWithRetry<T>(
    task: BackgroundTask<T>,
    attempt: number = 1
  ): Promise<void> {
    try {
      const result = await task.task();
      if (task.onSuccess) {
        await task.onSuccess(result);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < this.maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
        return this.executeWithRetry(task, attempt + 1);
      }
      
      if (task.onError) {
        await task.onError(err);
      }
    }
  }

  /**
   * Schedule multiple tasks in parallel
   * @param tasks - Array of background tasks to schedule
   */
  scheduleAll<T>(tasks: BackgroundTask<T>[]): void {
    for (const task of tasks) {
      this.schedule(task);
    }
  }

  /**
   * Get the number of pending tasks
   * @returns The count of tasks currently being processed
   */
  get pendingCount(): number {
    return this.pendingTasks.size;
  }

  /**
   * Check if a specific task is still pending
   * @param taskId - The ID of the task to check
   * @returns boolean indicating if the task is pending
   */
  isPending(taskId: string): boolean {
    return this.pendingTasks.has(taskId);
  }
}
