import test from 'node:test';
import assert from 'node:assert/strict';
import { seedWorkspace, AGENTS } from '../src/data.mjs';
import { readWorkspace, saveWorkspace } from '../src/domain.mjs';
import { AGENT_POLICIES, GENERAL_PRINCIPLES, createAgentRequest, addAgentMessage, completeAgentReply, markAgentError, createOfflineGuidance, buildConversationPrompt } from '../src/requests.mjs';

test('five agent charters define distinct scope, workflow and guardrails', () => {
  assert.equal(AGENTS.length, 5);
  assert.equal(Object.keys(AGENT_POLICIES).length, 5);
  assert.equal(GENERAL_PRINCIPLES.length, 5);
  for (const agent of AGENTS) {
    const policy = AGENT_POLICIES[agent.id];
    assert.equal(policy.workflow.length, 4);
    assert.ok(policy.caution.length > 15);
    assert.ok(policy.mission.length > 15);
  }
});

test('requests are created, continued, replied and included in history', () => {
  let state = createAgentRequest(seedWorkspace(), 'ivy', 'Phân tích thị trường');
  assert.equal(state.requests.length, 1);
  assert.equal(state.requests[0].agentId, 'ivy');
  assert.equal(state.requests[0].status, 'pending');
  const id = state.requests[0].id;
  state = completeAgentReply(state, id, createOfflineGuidance('ivy', 'Phân tích thị trường'));
  assert.equal(state.requests[0].status, 'answered');
  assert.equal(state.requests[0].messages[1].mode, 'offline');
  assert.match(state.requests[0].messages[1].content, /KHÔNG PHẢI KẾT QUẢ AI/);
  state = addAgentMessage(state, id, 'Cho tôi các bước xác minh');
  assert.equal(state.requests[0].messages.length, 3);
  state = completeAgentReply(state, id, 'Cần kiểm tra nguồn chính thức', 'ai');
  assert.equal(state.requests[0].messages[3].mode, 'ai');
  assert.match(buildConversationPrompt(state.requests[0]), /Phân tích thị trường/);
  assert.ok(state.activities.some(item => item.label === 'Đã nhận phản hồi AI'));
});

test('invalid agent, short request and invalid reply mode are rejected', () => {
  const state = seedWorkspace();
  assert.throws(() => createAgentRequest(state, 'unknown', 'Xin chào')); 
  assert.throws(() => createAgentRequest(state, 'nova', 'a'));
  const valid = createAgentRequest(state, 'nova', 'Một yêu cầu hợp lệ');
  assert.throws(() => completeAgentReply(valid, valid.requests[0].id, 'test', 'pretend'));
});

test('errors do not fabricate a response; existing V1 tasks survive V1.1 migration', () => {
  const state = createAgentRequest(seedWorkspace(), 'byte', 'Viết test cases');
  const id = state.requests[0].id;
  const errorState = markAgentError(state, id, 'Chưa có API key');
  assert.equal(errorState.requests[0].status, 'error');
  assert.equal(errorState.requests[0].messages.length, 1);
  const map = new Map();
  const storage = { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value) };
  const oldState = { schema:1, tasks: seedWorkspace().tasks, activities:seedWorkspace().activities };
  assert.equal(saveWorkspace(storage, oldState), true);
  const upgraded = readWorkspace(storage);
  assert.equal(upgraded.tasks.length, 7);
  assert.deepEqual(upgraded.requests, []);
});
