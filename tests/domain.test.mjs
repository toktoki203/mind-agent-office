import test from 'node:test';
import assert from 'node:assert/strict';
import { seedWorkspace, AGENTS } from '../src/data.mjs';
import { createTask, updateTask, moveTask, deleteTask, getStats, buildAgentPrompt, readWorkspace, saveWorkspace, STORAGE_KEY } from '../src/domain.mjs';

test('seed contains five agents and valid demo tasks', () => {
  assert.equal(AGENTS.length, 5);
  assert.equal(seedWorkspace().tasks.length, 7);
});

test('create, assign, move and delete tasks leave auditable activity', () => {
  let state = seedWorkspace();
  state = createTask(state, { title: 'Viết báo cáo', description: 'Tóm tắt', agentId: 'ivy', priority: 'high' });
  const id = state.tasks[0].id;
  assert.equal(state.tasks[0].agentId, 'ivy');
  assert.equal(state.tasks[0].status, 'todo');
  state = moveTask(state, id, 'review');
  assert.equal(state.tasks[0].status, 'review');
  state = updateTask(state, id, { title: 'Viết báo cáo mới', agentId: 'nova' });
  assert.equal(state.tasks[0].agentId, 'nova');
  state = deleteTask(state, id);
  assert.equal(state.tasks.length, 7);
  assert.equal(state.activities.length, 9);
});

test('empty task titles are rejected and invalid status is ignored', () => {
  const state = seedWorkspace();
  assert.throws(() => createTask(state, { title: '    ' }), /tên nhiệm vụ/);
  assert.equal(moveTask(state, 'sample-1', 'unknown'), state);
});

test('stats and prompt are accurate', () => {
  const state = seedWorkspace();
  const stats = getStats(state.tasks);
  assert.deepEqual(stats, { total: 7, todo: 2, progress: 2, review: 1, done: 2 });
  const prompt = buildAgentPrompt(AGENTS[1], state.tasks[1]);
  assert.match(prompt, /Khảo sát 5 mô hình/);
  assert.match(prompt, /không bịa nguồn/i);
});

test('local storage is durable and gracefully recovers corrupt data', () => {
  const map = new Map();
  const storage = { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value) };
  const workspace = seedWorkspace();
  assert.equal(saveWorkspace(storage, workspace), true);
  assert.equal(readWorkspace(storage).tasks.length, 7);
  map.set(STORAGE_KEY, '{invalid-json');
  assert.equal(readWorkspace(storage).tasks.length, 7);
});
