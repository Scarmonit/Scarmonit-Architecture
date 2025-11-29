/**
 * AsyncTaskQueue - Producer-Consumer Pattern for Cloudflare Workers
 * 
 * This implements an asynchronous task queue pattern that allows:
 * - Adding tasks to a queue (producer pattern)
 * - Processing tasks concurrently with configurable concurrency (consumer pattern)
 * - Waiting for all tasks to complete
 * - Error handling and task status tracking
 */

/**
 * Represents the status of a task in the queue
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Represents the result of a task execution
 */
export interface TaskResult<T = unknown> {
  id: string;
  status: TaskStatus;
  result?: T;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Represents a task to be executed
 */
export interface Task<T = unknown> {
  id: string;
  execute: () => Promise<T>;
  priority?: number;
}

/**
 * Configuration options for the AsyncTaskQueue
 */
export interface TaskQueueOptions {
  maxConcurrency?: number;
  maxQueueSize?: number;
  timeout?: number;
}

/**
 * AsyncTaskQueue class implementing the producer-consumer pattern
 * Designed for use in Cloudflare Workers environment
 */
export class AsyncTaskQueue<T = unknown> {
  private queue: Task<T>[] = [];
  private results: Map<string, TaskResult<T>> = new Map();
  private runningCount = 0;
  private readonly maxConcurrency: number;
  private readonly maxQueueSize: number;
  private readonly timeout: number;

  constructor(options: TaskQueueOptions = {}) {
    this.maxConcurrency = options.maxConcurrency ?? 5;
    this.maxQueueSize = options.maxQueueSize ?? 100;
    this.timeout = options.timeout ?? 30000; // 30 seconds default timeout
  }

  /**
   * Add a task to the queue (producer)
   * @param task - The task to add
   * @returns boolean indicating if the task was added successfully
   */
  enqueue(task: Task<T>): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      return false;
    }

    // Insert based on priority (higher priority first)
    const priority = task.priority ?? 0;
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if ((this.queue[i].priority ?? 0) < priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, task);
    this.results.set(task.id, { id: task.id, status: 'pending' });
    return true;
  }

  /**
   * Process tasks from the queue (consumer)
   * @returns Promise that resolves when all current tasks are processed
   */
  async processAll(): Promise<Map<string, TaskResult<T>>> {
    const processingPromises: Promise<void>[] = [];

    while (this.queue.length > 0 || this.runningCount > 0) {
      // Start new tasks if we have capacity
      while (this.queue.length > 0 && this.runningCount < this.maxConcurrency) {
        const task = this.queue.shift();
        if (task) {
          processingPromises.push(this.executeTask(task));
        }
      }

      // Wait for at least one task to complete if we're at max concurrency
      if (this.runningCount >= this.maxConcurrency && processingPromises.length > 0) {
        await Promise.race(processingPromises);
      } else if (processingPromises.length > 0) {
        // Give pending tasks a chance to start
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // Wait for all tasks to complete
    await Promise.all(processingPromises);
    return this.results;
  }

  /**
   * Execute a single task with timeout handling
   * @param task - The task to execute
   */
  private async executeTask(task: Task<T>): Promise<void> {
    this.runningCount++;
    const result = this.results.get(task.id);
    if (result) {
      result.status = 'running';
      result.startedAt = Date.now();
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), this.timeout);
      });

      const taskResult = await Promise.race([task.execute(), timeoutPromise]);
      
      if (result) {
        result.status = 'completed';
        result.result = taskResult;
        result.completedAt = Date.now();
      }
    } catch (error) {
      if (result) {
        result.status = 'failed';
        result.error = error instanceof Error ? error.message : String(error);
        result.completedAt = Date.now();
      }
    } finally {
      this.runningCount--;
    }
  }

  /**
   * Get the status of a specific task
   * @param taskId - The ID of the task
   * @returns The task result or undefined if not found
   */
  getTaskStatus(taskId: string): TaskResult<T> | undefined {
    return this.results.get(taskId);
  }

  /**
   * Get all task results
   * @returns Map of all task results
   */
  getAllResults(): Map<string, TaskResult<T>> {
    return new Map(this.results);
  }

  /**
   * Get the current queue size
   * @returns The number of pending tasks in the queue
   */
  get queueSize(): number {
    return this.queue.length;
  }

  /**
   * Get the number of currently running tasks
   * @returns The number of running tasks
   */
  get runningTasks(): number {
    return this.runningCount;
  }

  /**
   * Clear all completed/failed tasks from results
   */
  clearCompletedResults(): void {
    for (const [id, result] of this.results) {
      if (result.status === 'completed' || result.status === 'failed') {
        this.results.delete(id);
      }
    }
  }
}
