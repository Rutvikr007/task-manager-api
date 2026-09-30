const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

describe('create', () => {
  test('creates a task with title only', () => {
    const task = taskService.create({ title: 'My Task' });
    expect(task.title).toBe('My Task');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.id).toBeDefined();
  });

  test('creates a task with all fields', () => {
    const task = taskService.create({
      title: 'Full Task',
      description: 'Some details',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-12-31T00:00:00.000Z',
    });
    expect(task.status).toBe('in_progress');
    expect(task.priority).toBe('high');
  });
});

describe('getAll', () => {
  test('returns empty array when no tasks', () => {
    expect(taskService.getAll()).toEqual([]);
  });

  test('returns all tasks', () => {
    taskService.create({ title: 'Task 1' });
    taskService.create({ title: 'Task 2' });
    expect(taskService.getAll()).toHaveLength(2);
  });
});

describe('findById', () => {
  test('finds existing task', () => {
    const task = taskService.create({ title: 'Find Me' });
    expect(taskService.findById(task.id).title).toBe('Find Me');
  });

  test('returns undefined for bad id', () => {
    expect(taskService.findById('bad-id')).toBeUndefined();
  });
});

describe('getByStatus', () => {
  beforeEach(() => {
    taskService.create({ title: 'Todo 1', status: 'todo' });
    taskService.create({ title: 'Todo 2', status: 'todo' });
    taskService.create({ title: 'Done 1', status: 'done' });
  });

  test('returns tasks matching the status', () => {
    const todos = taskService.getByStatus('todo');
    expect(todos).toHaveLength(2);
  });

  test('should not match partial status strings', () => {
    const result = taskService.getByStatus('do');
    expect(result).toHaveLength(0);
  });
});

describe('getPaginated', () => {
  beforeEach(() => {
    for (let i = 1; i <= 15; i++) {
      taskService.create({ title: `Task ${i}` });
    }
  });

  test('page 1 should return first 10 tasks', () => {
    const result = taskService.getPaginated(1, 10);
    expect(result).toHaveLength(10);
    expect(result[0].title).toBe('Task 1');
  });

  test('page 2 should return remaining 5 tasks', () => {
    const result = taskService.getPaginated(2, 10);
    expect(result).toHaveLength(5);
    expect(result[0].title).toBe('Task 11');
  });
});

describe('getStats', () => {
  test('returns zeros when empty', () => {
    expect(taskService.getStats()).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
  });

  test('counts tasks by status', () => {
    taskService.create({ title: 'T1', status: 'todo' });
    taskService.create({ title: 'T2', status: 'done' });
    const stats = taskService.getStats();
    expect(stats.todo).toBe(1);
    expect(stats.done).toBe(1);
  });

  test('counts overdue tasks', () => {
    taskService.create({ title: 'Late', status: 'todo', dueDate: '2020-01-01T00:00:00.000Z' });
    taskService.create({ title: 'Future', status: 'todo', dueDate: '2099-12-31T00:00:00.000Z' });
    expect(taskService.getStats().overdue).toBe(1);
  });
});

describe('update', () => {
  test('updates a task', () => {
    const task = taskService.create({ title: 'Old' });
    const updated = taskService.update(task.id, { title: 'New' });
    expect(updated.title).toBe('New');
  });

  test('returns null for bad id', () => {
    expect(taskService.update('bad-id', { title: 'X' })).toBeNull();
  });
});

describe('remove', () => {
  test('removes a task', () => {
    const task = taskService.create({ title: 'Delete Me' });
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.getAll()).toHaveLength(0);
  });

  test('returns false for bad id', () => {
    expect(taskService.remove('bad-id')).toBe(false);
  });
});

describe('completeTask', () => {
  test('marks task as done', () => {
    const task = taskService.create({ title: 'Complete Me' });
    const done = taskService.completeTask(task.id);
    expect(done.status).toBe('done');
    expect(done.completedAt).toBeDefined();
  });

  test('returns null for bad id', () => {
    expect(taskService.completeTask('bad-id')).toBeNull();
  });

  test('should not change the priority', () => {
    const task = taskService.create({ title: 'Important', priority: 'high' });
    const done = taskService.completeTask(task.id);
    expect(done.priority).toBe('high');
  });
});

describe('assignTask', () => {
  test('assigns a task to an assignee', () => {
    const task = taskService.create({ title: 'Assign Me' });
    const assigned = taskService.assignTask(task.id, 'Alice');
    expect(assigned.assignee).toBe('Alice');
    expect(taskService.findById(task.id).assignee).toBe('Alice');
  });

  test('reassigns an already assigned task', () => {
    const task = taskService.create({ title: 'Reassign Me' });
    taskService.assignTask(task.id, 'Alice');
    const reassigned = taskService.assignTask(task.id, 'Bob');
    expect(reassigned.assignee).toBe('Bob');
  });

  test('returns null for bad id', () => {
    expect(taskService.assignTask('bad-id', 'Alice')).toBeNull();
  });
});

