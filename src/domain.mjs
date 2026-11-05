import { AGENTS, STATUSES, seedWorkspace } from './data.mjs';

export const STORAGE_KEY = 'mind-agent-office:v1';
const validStatus = new Set(STATUSES.map(item => item.id));
const validAgent = new Set(AGENTS.map(item => item.id));
const validPriority = new Set(['high', 'medium', 'low']);

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function readWorkspace(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return seedWorkspace();
    const parsed = JSON.parse(raw);
    if (parsed?.schema === 1 && Array.isArray(parsed.tasks) && Array.isArray(parsed.activities)) return parsed;
  } catch { /* Private mode, corrupt JSON or blocked storage: use a fresh workspace. */ }
  return seedWorkspace();
}

export function saveWorkspace(storage, workspace) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(workspace)); return true; }
  catch { return false; }
}

function event(label, detail, agentId, kind) {
  return { id: makeId(), at: new Date().toISOString(), agentId, label, detail, kind };
}

function appendActivity(workspace, item) {
  return { ...workspace, activities: [item, ...workspace.activities].slice(0, 250) };
}

export function createTask(workspace, input) {
  const title = String(input.title ?? '').trim().slice(0, 120);
  if (!title) throw new Error('Vui lòng nhập tên nhiệm vụ.');
  const agentId = validAgent.has(input.agentId) ? input.agentId : AGENTS[0].id;
  const status = validStatus.has(input.status) ? input.status : 'todo';
  const now = new Date().toISOString();
  const task = {
    id: makeId(), title,
    description: String(input.description ?? '').trim().slice(0, 3000),
    agentId, status,
    priority: validPriority.has(input.priority) ? input.priority : 'medium',
    createdAt: now, updatedAt: now
  };
  const next = { ...workspace, tasks: [task, ...workspace.tasks] };
  return appendActivity(next, event('Đã tạo nhiệm vụ', title, agentId, 'create'));
}

export function updateTask(workspace, taskId, patch) {
  const old = workspace.tasks.find(task => task.id === taskId);
  if (!old) return workspace;
  const title = String(patch.title ?? old.title).trim().slice(0, 120);
  if (!title) throw new Error('Vui lòng nhập tên nhiệm vụ.');
  const agentId = validAgent.has(patch.agentId) ? patch.agentId : old.agentId;
  const status = validStatus.has(patch.status) ? patch.status : old.status;
  const priority = validPriority.has(patch.priority) ? patch.priority : old.priority;
  const updated = {
    ...old, title, agentId, status, priority,
    description: String(patch.description ?? old.description).trim().slice(0, 3000),
    updatedAt: new Date().toISOString()
  };
  if (['title', 'agentId', 'status', 'priority', 'description'].every(key => old[key] === updated[key])) return workspace;
  const next = { ...workspace, tasks: workspace.tasks.map(task => task.id === taskId ? updated : task) };
  const label = old.status !== status ? `Chuyển sang ${STATUSES.find(item => item.id === status).label}` : 'Đã cập nhật nhiệm vụ';
  return appendActivity(next, event(label, title, agentId, old.status !== status ? 'move' : 'edit'));
}

export function moveTask(workspace, taskId, status) {
  if (!validStatus.has(status)) return workspace;
  return updateTask(workspace, taskId, { status });
}

export function deleteTask(workspace, taskId) {
  const task = workspace.tasks.find(item => item.id === taskId);
  if (!task) return workspace;
  const next = { ...workspace, tasks: workspace.tasks.filter(item => item.id !== taskId) };
  return appendActivity(next, event('Đã xoá nhiệm vụ', task.title, task.agentId, 'delete'));
}

export function getStats(tasks) {
  return {
    total: tasks.length,
    todo: tasks.filter(task => task.status === 'todo').length,
    progress: tasks.filter(task => task.status === 'progress').length,
    review: tasks.filter(task => task.status === 'review').length,
    done: tasks.filter(task => task.status === 'done').length
  };
}

export function buildAgentPrompt(agent, task) {
  if (!agent || !task) return '';
  return [
    `# Giao việc cho ${agent.name} — ${agent.title}`,
    '', agent.promptRole, '',
    `NHIỆM VỤ: ${task.title}`,
    `MÔ TẢ: ${task.description || 'Chưa có mô tả bổ sung.'}`,
    `MỨC ƯU TIÊN: ${task.priority === 'high' ? 'Cao' : task.priority === 'low' ? 'Linh hoạt' : 'Trung bình'}`,
    '', 'YÊU CẦU ĐẦU RA:',
    '1. Đề xuất hướng thực hiện rõ ràng và từng bước.',
    '2. Nêu giả định, rủi ro, điều cần xác minh.',
    '3. Trả về sản phẩm cụ thể hoặc checklist bàn giao.',
    '4. Không tự nhận đã thực hiện hành động ngoài hệ thống nếu chưa được kết nối và cho phép.',
    '', 'Ngôn ngữ: Tiếng Việt. Ưu tiên rõ ràng, ngắn gọn, có thể triển khai.'
  ].join('\n');
}
