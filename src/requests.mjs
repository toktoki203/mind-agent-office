import { AGENTS } from './data.mjs';

export const GENERAL_PRINCIPLES = [
  'Chỉ xử lý yêu cầu trong phạm vi được giao; làm rõ mục tiêu và đầu ra trước khi thực hiện.',
  'Phân biệt thông tin đã xác minh, giả định và đề xuất. Không bịa số liệu, nguồn hoặc kết quả.',
  'Không tự gửi email, đăng bài, sửa repository hoặc truy cập dữ liệu riêng tư khi chưa được cấp quyền và phê duyệt.',
  'Báo rõ chế độ hoạt động: hướng dẫn offline hay phản hồi AI qua API.',
  'Kết quả chỉ được xem là hoàn tất khi có bằng chứng và được người dùng chấp thuận.'
];

export const AGENT_POLICIES = {
  nova: {
    mission: 'Nhận mục tiêu, phân rã công việc và điều phối thứ tự ưu tiên.',
    workflow: ['Tóm tắt mục tiêu và giới hạn', 'Chia thành đầu việc có chủ sở hữu', 'Đề xuất thứ tự ưu tiên và tiêu chí nghiệm thu', 'Trình phương án cần phê duyệt'],
    deliverable: 'Kế hoạch hành động, người phụ trách, mức ưu tiên và điểm cần quyết định.',
    caution: 'Không tự giao việc ra ngoài hệ thống hoặc cam kết thời hạn thay người dùng.'
  },
  ivy: {
    mission: 'Nghiên cứu, kiểm chứng thông tin và chuyển dữ liệu thành insight.',
    workflow: ['Xác định câu hỏi nghiên cứu', 'Lập danh sách nguồn cần kiểm tra', 'Phân biệt dữ kiện và giả thuyết', 'Đề xuất cấu trúc báo cáo có trích dẫn'],
    deliverable: 'Báo cáo với nguồn, kết luận, mức độ chắc chắn và lỗ hổng dữ liệu.',
    caution: 'Không tự nhận đã duyệt nguồn, truy cập web hay đọc tài liệu khi chưa thực hiện.'
  },
  momo: {
    mission: 'Sáng tạo concept, thông điệp, kịch bản và hướng thể hiện.',
    workflow: ['Làm rõ đối tượng và insight', 'Đưa 2–3 concept khác biệt', 'Đề xuất thông điệp và chất liệu triển khai', 'Kiểm tra tính nhất quán với thương hiệu'],
    deliverable: 'Creative brief, các concept, hướng visual và checklist sản xuất.',
    caution: 'Không khẳng định sản phẩm đã được phê duyệt thương hiệu hoặc dùng nội dung có bản quyền trái phép.'
  },
  byte: {
    mission: 'Phân tích kỹ thuật, xây tính năng và kiểm thử sản phẩm.',
    workflow: ['Xác định lỗi hoặc yêu cầu', 'Đề xuất kiến trúc và phạm vi thay đổi', 'Liệt kê bước triển khai và test', 'Kiểm tra rủi ro, rollback và bàn giao'],
    deliverable: 'Technical plan, tiêu chí nghiệm thu, test cases và phạm vi triển khai.',
    caution: 'Không tuyên bố đã sửa code, chạy test hoặc push GitHub nếu chưa có bằng chứng công cụ.'
  },
  kai: {
    mission: 'Chuẩn hóa quy trình, checklist và giám sát tiến độ.',
    workflow: ['Xác định đầu vào và đầu ra', 'Chia quy trình thành các bước rõ ràng', 'Gắn người chịu trách nhiệm và mốc kiểm tra', 'Đề xuất điểm kiểm soát rủi ro'],
    deliverable: 'SOP, checklist, lịch theo dõi và tiêu chí bàn giao.',
    caution: 'Không tự gửi nhắc việc hoặc cập nhật lịch/calendar khi chưa có quyền.'
  }
};

const MAX_REQUESTS = 80;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_SIZE = 4000;
const validAgents = new Set(AGENTS.map(agent => agent.id));

export function normalizeRequests(workspace) {
  const raw = Array.isArray(workspace?.requests) ? workspace.requests : [];
  return { ...workspace, requests: raw.slice(0, MAX_REQUESTS) };
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function recordActivity(workspace, label, detail, agentId, kind = 'request') {
  const entry = { id: makeId(), at: new Date().toISOString(), label, detail, agentId, kind };
  return { ...workspace, activities: [entry, ...(workspace.activities || [])].slice(0, 250) };
}
function content(value) {
  const message = String(value ?? '').trim();
  if (message.length < 4) throw new Error('Hãy nhập yêu cầu ít nhất 4 ký tự.');
  if (message.length > MAX_MESSAGE_SIZE) throw new Error('Yêu cầu tối đa 4.000 ký tự.');
  return message;
}
function message(role, body, mode = null) {
  return { id: makeId(), role, content: body, mode, at: new Date().toISOString() };
}
export function createAgentRequest(workspace, agentId, userMessage) {
  const text = content(userMessage);
  if (!validAgents.has(agentId)) throw new Error('Agent không hợp lệ.');
  const now = new Date().toISOString();
  const thread = {
    id: makeId(), agentId, title: text.split('\n')[0].slice(0, 78),
    status: 'pending', createdAt: now, updatedAt: now,
    messages: [message('user', text)]
  };
  const next = normalizeRequests(workspace);
  return recordActivity({ ...next, requests: [thread, ...next.requests].slice(0, MAX_REQUESTS) }, 'Đã gửi yêu cầu', thread.title, agentId);
}
export function addAgentMessage(workspace, threadId, userMessage) {
  const text = content(userMessage);
  const next = normalizeRequests(workspace);
  const thread = next.requests.find(item => item.id === threadId);
  if (!thread) throw new Error('Không tìm thấy hội thoại.');
  const updated = { ...thread, status: 'pending', updatedAt: new Date().toISOString(), messages: [...thread.messages, message('user', text)].slice(-MAX_MESSAGES) };
  return recordActivity({ ...next, requests: next.requests.map(item => item.id === threadId ? updated : item) }, 'Đã gửi tiếp yêu cầu', thread.title, thread.agentId);
}
export function completeAgentReply(workspace, threadId, answer, mode = 'offline') {
  const next = normalizeRequests(workspace);
  const thread = next.requests.find(item => item.id === threadId);
  if (!thread) return next;
  const text = String(answer || '').trim().slice(0, 12000);
  if (!text) throw new Error('Agent không trả về nội dung.');
  if (!['offline','ai'].includes(mode)) throw new Error('Chế độ không hợp lệ.');
  const updated = { ...thread, status: 'answered', updatedAt: new Date().toISOString(), messages: [...thread.messages, message('assistant', text, mode)].slice(-MAX_MESSAGES) };
  return recordActivity({ ...next, requests: next.requests.map(item => item.id === threadId ? updated : item) }, mode === 'ai' ? 'Đã nhận phản hồi AI' : 'Đã tạo hướng dẫn offline', thread.title, thread.agentId, 'reply');
}
export function markAgentError(workspace, threadId, reason) {
  const next = normalizeRequests(workspace);
  const thread = next.requests.find(item => item.id === threadId);
  if (!thread) return next;
  const updated = { ...thread, status: 'error', updatedAt: new Date().toISOString(), error: String(reason ?? 'Lỗi kết nối').slice(0, 300) };
  return { ...next, requests: next.requests.map(item => item.id === threadId ? updated : item) };
}
export function createOfflineGuidance(agentId, userText) {
  const agent = AGENTS.find(item => item.id === agentId);
  const policy = AGENT_POLICIES[agentId];
  if (!agent || !policy) throw new Error('Agent không hợp lệ.');
  const text = String(userText || '').trim();
  const shortText = text.length > 220 ? `${text.slice(0, 220)}…` : text;
  return [
    'HƯỚNG DẪN THEO QUY TẮC (OFFLINE — KHÔNG PHẢI KẾT QUẢ AI)',
    '',
    `Đã ghi nhận yêu cầu: “${shortText}”`,
    '',
    `Phạm vi ${agent.name}: ${policy.mission}`,
    '',
    'Các bước đề xuất:',
    ...policy.workflow.map((step, index) => `${index + 1}. ${step}`),
    '',
    `Đầu ra cần chuẩn bị: ${policy.deliverable}`,
    '',
    'Điểm cần xác nhận: Đối tượng sử dụng, deadline, tài liệu đầu vào và tiêu chí đạt.',
    `Nguyên tắc: ${policy.caution}`,
    '',
    'Chế độ hiện tại chỉ lập khung xử lý từ quy tắc định sẵn; không nghiên cứu, không gọi AI và không tự thực hiện hành động. Chọn chế độ AI thật khi đã kết nối backend bảo mật.'
  ].join('\n');
}
export function buildConversationPrompt(thread) {
  const agent = AGENTS.find(item => item.id === thread?.agentId);
  const policy = AGENT_POLICIES[thread?.agentId];
  if (!agent || !policy) return '';
  return [
    `Bạn là ${agent.name}, ${agent.title} trong MinD Agent Office.`,
    `Nhiệm vụ: ${policy.mission}`,
    `Quy trình: ${policy.workflow.join('; ')}.`,
    `Đầu ra: ${policy.deliverable}`,
    `Giới hạn: ${policy.caution}`,
    ...GENERAL_PRINCIPLES.map((line, i) => `${i+1}. ${line}`),
    '', 'YÊU CẦU NGƯỜI DÙNG:',
    ...(thread.messages || []).filter(item => item.role === 'user').map((item, i) => `${i + 1}. ${item.content}`),
    '', 'Trả lời tiếng Việt; chỉ nêu điều đã xác minh; không tuyên bố đã thực hiện hành động ngoài hệ thống.'
  ].join('\n');
}
