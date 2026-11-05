import { AGENTS } from './data.mjs';
import { avatarSvg } from './avatars.mjs';
import { AGENT_POLICIES, GENERAL_PRINCIPLES, createAgentRequest, addAgentMessage, completeAgentReply, markAgentError, createOfflineGuidance, buildConversationPrompt } from './requests.mjs';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const dateLabel = date => { try { return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Ho_Chi_Minh' }).format(new Date(date)); } catch { return ''; } };
const previewMessage = message => String(message || '').slice(0, 110);
const suggestionByAgent = {
  nova: ['Lập kế hoạch triển khai Agent Office trong 2 tuần', 'Chia đầu việc theo 5 phòng ban', 'Đề xuất KPI vận hành tháng đầu'],
  ivy: ['Lên khung nghiên cứu thị trường cho sản phẩm mới', 'So sánh 3 phương án giải pháp AI Office', 'Lập checklist kiểm tra độ tin cậy của nguồn'],
  momo: ['Đề xuất 3 concept truyền thông sản phẩm', 'Viết creative brief cho chiến dịch tháng 11', 'Xây dựng thông điệp thương hiệu'],
  byte: ['Đề xuất luồng đăng nhập và lưu nhiệm vụ', 'Lập kế hoạch kiểm thử Agent Office', 'Phân tích kiến trúc backend an toàn'],
  kai: ['Tạo checklist nghiệm thu sản phẩm', 'Chuẩn hóa quy trình duyệt yêu cầu', 'Lập lịch báo cáo tiến độ hàng tuần']
};

/** View/controller of the Agent request inbox. Local mode does not impersonate AI. */
export function createRequestUI({ getWorkspace, persist, render, showToast }) {
  let selectedAgentId = 'nova';
  let selectedThreadId = null;
  let draft = '';
  let mode = 'offline';
  let sending = false;
  let accessCode = '';
  try { accessCode = window.sessionStorage.getItem('mind-office:access-code') || ''; } catch { /* sandbox storage can be disabled */ }

  const agentFor = id => AGENTS.find(item => item.id === id) || AGENTS[0];
  const currentThread = workspace => workspace.requests?.find(thread => thread.id === selectedThreadId) || null;
  function selectAgent(id) {
    selectedAgentId = agentFor(id).id;
    selectedThreadId = null;
    draft = '';
  }
  function selectThread(id) {
    const thread = getWorkspace().requests?.find(item => item.id === id);
    if (!thread) return;
    selectedThreadId = thread.id;
    selectedAgentId = thread.agentId;
    draft = '';
  }
  function fromTask(task) {
    selectAgent(task.agentId);
    draft = `Hãy hỗ trợ xử lý nhiệm vụ: ${task.title}.\nMô tả: ${task.description || 'Chưa có mô tả'}.\nĐề xuất đầu ra rõ ràng, cách kiểm chứng và các bước tiếp theo.`;
  }
  function hasRemoteHost() {
    const host = window.location?.hostname || '';
    return host !== 'localhost' && host !== '127.0.0.1' && host !== '' && !host.endsWith('chatgpt.com');
  }
  function modeLabel() { return mode === 'ai' ? 'AI qua API (cần cấu hình)' : 'Hướng dẫn offline'; }
  function messageHtml(entry) {
    const mine = entry.role === 'user';
    return `<div class="request-message ${mine ? 'from-user' : 'from-agent'}">
      <div class="request-message-top"><strong>${mine ? 'Bạn' : escapeHtml(agentFor(selectedAgentId).name)}</strong><span>${escapeHtml(dateLabel(entry.at))}</span></div>
      <div class="request-message-body">${escapeHtml(entry.content)}</div>
      ${!mine ? `<div class="request-message-mode ${entry.mode === 'ai' ? 'online' : 'offline'}">${entry.mode === 'ai' ? 'Phản hồi AI qua API' : 'Khung xử lý theo quy tắc · Không phải AI'}</div>` : ''}
    </div>`;
  }
  function renderRules(agentId) {
    const agent = agentFor(agentId);
    const policy = AGENT_POLICIES[agent.id];
    return `<div class="request-rule-head"><span class="eyebrow">AGENT CHARTER</span><h3>Nguyên tắc ${escapeHtml(agent.name)}</h3><p>${escapeHtml(policy.mission)}</p></div>
       <div class="rule-block"><h4>Quy trình 4 bước</h4><ol>${policy.workflow.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ol></div>
       <div class="rule-block"><h4>Đầu ra phải có</h4><p>${escapeHtml(policy.deliverable)}</p></div>
       <div class="rule-block caution"><h4>Giới hạn hành động</h4><p>${escapeHtml(policy.caution)}</p></div>
       <details class="global-rules"><summary>5 nguyên tắc chung</summary><ol>${GENERAL_PRINCIPLES.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ol></details>`;
  }
  function renderView(workspace) {
    const agent = agentFor(selectedAgentId);
    const policy = AGENT_POLICIES[agent.id];
    const threads = Array.isArray(workspace.requests) ? workspace.requests : [];
    const selected = currentThread(workspace);
    const visible = threads.filter(thread => thread.agentId === agent.id);
    const suggestions = suggestionByAgent[agent.id];
    return `<div class="request-view">
      <div class="request-page-heading"><div><span class="eyebrow">AGENT CONTROL CENTER · V1.1</span><h1>Giao yêu cầu & nhận phản hồi</h1><p>Tạo hội thoại riêng cho từng Agent, xem nguyên tắc xử lý và theo dõi nội dung trả lời.</p></div><span class="request-mode-tag">${mode === 'offline' ? '● Offline demo' : '● AI API'}</span></div>
      <div class="request-workspace">
        <aside class="request-roster"><div class="request-small-title">CHỌN AGENT <span>05</span></div><div class="request-agent-options">${AGENTS.map(item=>`<button type="button" class="request-agent-btn ${item.id === selectedAgentId ? 'active' : ''}" data-action="request-agent" data-id="${item.id}"><span class="request-avatar" style="background:${item.tint}">${avatarSvg(item,'mini')}</span><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.group)}</small></span><span class="request-agent-count">${threads.filter(t=>t.agentId===item.id).length}</span></button>`).join('')}</div>
        <div class="request-divider"></div><div class="request-small-title">HỘI THOẠI <span>${visible.length}</span></div><button class="request-new-btn" data-action="request-new" type="button">+ Yêu cầu mới</button><div class="request-thread-list">${visible.length ? visible.map(t=>`<button type="button" class="request-thread ${selected?.id === t.id ? 'active' : ''}" data-action="request-thread" data-id="${escapeHtml(t.id)}"><b>${escapeHtml(t.title)}</b><small>${t.status === 'answered' ? 'Đã phản hồi' : t.status === 'pending' ? 'Đang xử lý' : 'Cần thử lại'} · ${escapeHtml(dateLabel(t.updatedAt))}</small></button>`).join('') : '<p class="request-rail-empty">Chưa có yêu cầu. Chọn một gợi ý hoặc nhập nội dung bên cạnh.</p>'}</div></aside>
        <section class="request-chat"><div class="request-chat-header"><span class="request-chat-avatar" style="background:${agent.tint}">${avatarSvg(agent,'mini')}</span><div><strong>${escapeHtml(agent.name)} <span>· ${escapeHtml(agent.title)}</span></strong><small>${escapeHtml(policy.mission)}</small></div></div>
         <div class="request-conversation" id="request-conversation" aria-live="polite">
         ${selected ? `<div class="request-thread-intro"><span>Hội thoại: ${escapeHtml(selected.title)}</span><button class="request-copy" data-action="request-copy" type="button">Sao chép brief</button></div>${selected.messages.map(messageHtml).join('')}${selected.status === 'pending' ? `<p class="request-busy">Đang xử lý yêu cầu...</p>` : selected.status === 'error' ? `<div class="request-error">Lỗi kết nối AI: ${escapeHtml(selected.error || 'Không nhận được phản hồi')} Yêu cầu đã được giữ lại trong lịch sử.</div>` : ''}` : `<div class="request-welcome"><span class="request-welcome-avatar" style="background:${agent.tint}">${avatarSvg(agent)}</span><span class="eyebrow">START A NEW REQUEST</span><h2>Bạn muốn ${escapeHtml(agent.name)} hỗ trợ điều gì?</h2><p>Yêu cầu sẽ được lưu thành hội thoại, không chỉ là một thẻ công việc.</p><div class="request-suggestions">${suggestions.map((s,i)=>`<button type="button" data-action="request-suggest" data-index="${i}">${escapeHtml(s)} <span>↗</span></button>`).join('')}</div></div>`}
         </div>
         <form class="request-composer" id="request-form"><label for="request-message" class="sr-only">Nội dung yêu cầu Agent</label><textarea id="request-message" name="message" required rows="3" maxlength="4000" placeholder="Viết yêu cầu cụ thể, mục tiêu, tài liệu, kết quả mong muốn..." ${sending ? 'disabled' : ''}>${escapeHtml(draft)}</textarea><div class="request-compose-bottom"><span>Ctrl + Enter để gửi · Tối đa 4.000 ký tự</span><button class="btn btn-primary" type="submit" ${sending ? 'disabled' : ''}>${sending ? 'Đang xử lý...' : 'Gửi yêu cầu'} ↗</button></div></form>
        </section>
        <aside class="request-policy"><div class="request-policy-scroll">${renderRules(agent.id)}<div class="request-engine-settings"><h4>Chế độ phản hồi</h4><label for="request-mode">Cách Agent trả lời</label><select id="request-mode"><option value="offline" ${mode === 'offline' ? 'selected' : ''}>Offline · Khung xử lý theo quy tắc</option><option value="ai" ${mode === 'ai' ? 'selected' : ''}>AI thật · OpenAI qua backend</option></select>${mode === 'ai' ? `<label for="request-access">Mã truy cập AI Office</label><input id="request-access" type="password" autocomplete="off" placeholder="Mã do bạn cấu hình trên Vercel" value="${escapeHtml(accessCode)}" /><p class="request-mode-help">Cần triển khai API trên Vercel và đặt OPENAI_API_KEY cùng AGENT_OFFICE_ACCESS_CODE trên server. Mã truy cập được giữ trong phiên trình duyệt.</p>` : `<p class="request-mode-help">Có phản hồi ngay, nhưng chỉ dựa trên checklist định sẵn. Không gọi AI, không tự tìm tài liệu hay làm việc nền.</p>`}</div></div></aside>
      </div>
      <div class="request-footer-note">Dữ liệu hội thoại lưu trong trình duyệt hiện tại (nếu được phép); không nhập thông tin bí mật của công ty. AI thật chỉ hoạt động khi backend được cấu hình và cấp quyền.</div>
    </div>`;
  }
  async function runReply(threadId, userText) {
    const agentId = selectedAgentId;
    if (mode === 'offline') {
      const answer = createOfflineGuidance(agentId, userText);
      persist(completeAgentReply(getWorkspace(), threadId, answer, 'offline'));
      showToast('Đã tạo hướng dẫn offline. Để có phân tích AI, hãy kết nối backend.');
      return;
    }
    if (!hasRemoteHost()) {
      persist(markAgentError(getWorkspace(), threadId, 'Bản sandbox chưa có API. Hãy chạy trên Vercel và thiết lập key phía server.'));
      showToast('Chế độ AI yêu cầu website có backend.', true);
      return;
    }
    if (!accessCode) {
      persist(markAgentError(getWorkspace(), threadId, 'Hãy nhập mã truy cập AI Office ở cột Nguyên tắc bên phải.'));
      showToast('Chưa nhập mã truy cập AI Office.', true);
      return;
    }
    sending = true; render();
    try {
      const thread = getWorkspace().requests?.find(t => t.id === threadId);
      if (!thread) throw new Error('Không tìm thấy hội thoại.');
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 40000);
      let response;
      try {
        response = await fetch('/api/agent', {
          method:'POST', headers:{ 'Content-Type':'application/json', 'X-Office-Access-Code':accessCode },
          body:JSON.stringify({ agentId:thread.agentId, messages:thread.messages.slice(-10).map(m=>({role:m.role,content:m.content})) }),
          signal:controller.signal
        });
      } finally { window.clearTimeout(timer); }
      let result = {};
      try { result = await response.json(); } catch { /* non-JSON network response */ }
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}. Kiểm tra cấu hình backend.`);
      if (!result.reply || result.mode !== 'ai') throw new Error('Backend không trả về phản hồi AI hợp lệ.');
      persist(completeAgentReply(getWorkspace(), threadId, result.reply, 'ai'));
      showToast('Đã nhận phản hồi AI và lưu hội thoại.');
    } catch (error) {
      const reason = error.name === 'AbortError' ? 'Đã quá thời gian xử lý. Hãy thử lại.' : error.message;
      persist(markAgentError(getWorkspace(), threadId, reason));
      showToast(`Không nhận được AI: ${reason}`, true);
    } finally { sending = false; render(); }
  }
  async function submit(form) {
    if (sending) return;
    const field = form.querySelector('[name=message]');
    const text = field?.value?.trim() || '';
    try {
      if (text.length < 4) throw new Error('Nhập yêu cầu tối thiểu 4 ký tự.');
      let next;
      if (selectedThreadId && currentThread(getWorkspace())) {
        next = addAgentMessage(getWorkspace(), selectedThreadId, text);
      } else {
        next = createAgentRequest(getWorkspace(), selectedAgentId, text);
        selectedThreadId = next.requests[0].id;
      }
      draft = '';
      persist(next);
      const threadId = selectedThreadId;
      await runReply(threadId, text);
    } catch (error) { showToast(error.message || 'Không gửi được yêu cầu.', true); }
  }
  async function copyThread() {
    const thread = currentThread(getWorkspace());
    if (!thread) return;
    const prompt = buildConversationPrompt(thread);
    try {
      await navigator.clipboard.writeText(prompt);
      showToast('Đã sao chép brief.');
    } catch {
      window.prompt('Sao chép brief:', prompt);
    }
  }
  function handleClick(action, dataset) {
    if (action === 'request-agent') { selectAgent(dataset.id); render(); return true; }
    if (action === 'request-thread') { selectThread(dataset.id); render(); return true; }
    if (action === 'request-new') { selectedThreadId = null; draft=''; render(); return true; }
    if (action === 'request-suggest') {
      draft = suggestionByAgent[selectedAgentId]?.[Number(dataset.index)] || '';
      selectedThreadId = null;
      render(); document.getElementById('request-message')?.focus(); return true;
    }
    if (action === 'request-copy') { void copyThread(); return true; }
    return false;
  }
  function handleChange(event) {
    if (event.target.id === 'request-mode') { mode = event.target.value === 'ai' ? 'ai' : 'offline'; render(); return true; }
    if (event.target.id === 'request-access') {
      accessCode = event.target.value;
      try { window.sessionStorage.setItem('mind-office:access-code', accessCode); } catch { /* memory only */ }
      return true;
    }
    return false;
  }
  function rememberDraft(event) {
    if (event.target.id === 'request-message') draft = event.target.value;
    if (event.target.id === 'request-access') {
      accessCode = event.target.value;
      try { window.sessionStorage.setItem('mind-office:access-code', accessCode); } catch { /* memory only */ }
    }
  }
  return { renderView, selectAgent, selectThread, fromTask, submit, handleClick, handleChange, rememberDraft, getMode: modeLabel };
}
