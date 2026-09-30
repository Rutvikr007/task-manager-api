const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

beforeEach(() => {
  taskService._reset();
});

describe('POST /tasks', () => {
  test('creates a task', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'New Task', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Task');
    expect(res.body.id).toBeDefined();
  });

  test('returns 400 when title is missing', async () => {
    const res = await request(app).post('/tasks').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid status', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Task', status: 'invalid' });
    expect(res.status).toBe(400);
  });
});

describe('GET /tasks', () => {
  test('returns empty array when no tasks', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Task 1' });
    await request(app).post('/tasks').send({ title: 'Task 2' });
    const res = await request(app).get('/tasks');
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /tasks with status filter', () => {
  beforeEach(async () => {
    await request(app).post('/tasks').send({ title: 'Todo 1', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'Done 1', status: 'done' });
  });

  test('filters by status', async () => {
    const res = await request(app).get('/tasks?status=todo');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('todo');
  });

  test('should not match partial strings', async () => {
    const res = await request(app).get('/tasks?status=do');
    expect(res.body).toHaveLength(0);
  });
});

describe('GET /tasks with pagination', () => {
  beforeEach(async () => {
    for (let i = 1; i <= 15; i++) {
      await request(app).post('/tasks').send({ title: `Task ${i}` });
    }
  });

  test('page 1 returns first 10 tasks', async () => {
    const res = await request(app).get('/tasks?page=1&limit=10');
    expect(res.body).toHaveLength(10);
    expect(res.body[0].title).toBe('Task 1');
  });

  test('page 2 returns remaining tasks', async () => {
    const res = await request(app).get('/tasks?page=2&limit=10');
    expect(res.body).toHaveLength(5);
  });
});

describe('PUT /tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app).post('/tasks').send({ title: 'Original' });
    taskId = res.body.id;
  });

  test('updates a task', async () => {
    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  test('returns 404 for bad id', async () => {
    const res = await request(app)
      .put('/tasks/bad-id')
      .send({ title: 'Nope' });
    expect(res.status).toBe(404);
  });

  test('returns 400 for empty title', async () => {
    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /tasks/:id', () => {
  test('deletes a task', async () => {
    const createRes = await request(app).post('/tasks').send({ title: 'Delete Me' });
    const res = await request(app).delete(`/tasks/${createRes.body.id}`);
    expect(res.status).toBe(204);
  });

  test('returns 404 for bad id', async () => {
    const res = await request(app).delete('/tasks/bad-id');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /tasks/:id/complete', () => {
  test('marks task as done', async () => {
    const createRes = await request(app).post('/tasks').send({ title: 'Complete Me' });
    const res = await request(app).patch(`/tasks/${createRes.body.id}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(res.body.completedAt).toBeDefined();
  });

  test('should not change priority', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .send({ title: 'High Task', priority: 'high' });
    const res = await request(app).patch(`/tasks/${createRes.body.id}/complete`);
    expect(res.body.priority).toBe('high');
  });

  test('returns 404 for bad id', async () => {
    const res = await request(app).patch('/tasks/bad-id/complete');
    expect(res.status).toBe(404);
  });
});

describe('GET /tasks/stats', () => {
  test('returns zeros when empty', async () => {
    const res = await request(app).get('/tasks/stats');
    expect(res.body).toEqual({ todo: 0, in_progress: 0, done: 0, overdue: 0 });
  });

  test('counts tasks correctly', async () => {
    await request(app).post('/tasks').send({ title: 'T1', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'T2', status: 'done' });
    const res = await request(app).get('/tasks/stats');
    expect(res.body.todo).toBe(1);
    expect(res.body.done).toBe(1);
  });
});

describe('PATCH /tasks/:id/assign', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app).post('/tasks').send({ title: 'Task to assign' });
    taskId = res.body.id;
  });

  test('assigns a task to a user', async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: 'Alice' });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('Alice');
  });

  test('reassigns a task to another user', async () => {
    await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: 'Alice' });
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: 'Bob' });
    expect(res.status).toBe(200);
    expect(res.body.assignee).toBe('Bob');
  });

  test('returns 400 when assignee is missing', async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 when assignee is empty string', async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: '' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when assignee is whitespace only', async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}/assign`)
      .send({ assignee: '   ' });
    expect(res.status).toBe(400);
  });

  test('returns 404 for bad id', async () => {
    const res = await request(app)
      .patch('/tasks/bad-id/assign')
      .send({ assignee: 'Alice' });
    expect(res.status).toBe(404);
  });
});

