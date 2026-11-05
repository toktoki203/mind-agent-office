import { AGENTS, STATUSES, PRIORITIES, getAgent, getStatus, seedWorkspace } from './data.mjs';
import { STORAGE_KEY, readWorkspace, saveWorkspace, createTask, updateTask, moveTask, deleteTask, getStats, buildAgentPrompt } from './domain.mjs';
import { avatarSvg } from './avatars.mjs';
import { createRequestUI } from './request-ui.mjs';

const icons = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  board: '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="10" rx="2"/><path d="M14 18h7"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m2 9v-2a6 6 0 0 0-2-4.5"/>',
  messages: '<path d="M4 5h16v12H9l-5 4V5z"/><path d="M8 10h8M8 14h5"/>',
  activity: '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="7" cy="5" r="2" fill="currentColor"/><circle cx="13" cy="12" r="2" fill="currentColor"/><circle cx="9" cy="19" r="2" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  spark: '<path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  edit: '<path d="M4 20h5l11-11-5-5L4 15v5zm9-14 5 5"/>',
  trash: '<path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 10v7M14 10v7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  bolt: '<path d="m13 2-9 12h8l-1 8 9-12h-8z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  dot: '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
  document: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7m-7 4h7"/>',
  external: '<path d="M13 5h6v6M19 5l-9 9M19 13v6H5V5h6"/>',
  reset: '<path d="M3 11a9 9 0 1 1 3 7M3 4v7h7"/>'
};

function icon(name, size = 19) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.circle}</svg>`;
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dateLabel = () => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const fmtDate = date => { try { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(date)); } catch { return ''; } };
const relTime = date => {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (!Number.isFinite(m)) return '';
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  if (m < 1440) return `${Math.floor(m / 60)} giờ trước`;
  return `${Math.floor(m / 1440)} ngày trước`;
};

let storage;
try { storage = window.localStorage; } catch { storage = undefined; }
let workspace = readWorkspace(storage);
const ui = { view: 'office', agentId: null, modalTaskId: null, modalAgentId: null, modalOpen: false, filterAgent: 'all', search: '', toast: '' };
let toastTimeout;
let dragTaskId = null;
const app = document.getElementById('app');
const requestUI = createRequestUI({ getWorkspace: () => workspace, persist, render, showToast });

function persist(next) {
  workspace = next;
  if (!saveWorkspace(storage, workspace)) showToast('Chưa thể lưu vào trình duyệt; dữ liệu có thể mất khi tải lại.', true);
  render();
}
function showToast(text, warning = false) {
  ui.toast = text;
  const el = document.getElementById('global-toast');
  if (el) { el.textContent = text; el.className = `toast is-visible ${warning ? 'warning' : ''}`; }
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => { ui.toast = ''; const toast = document.getElementById('global-toast'); if (toast) toast.className = 'toast'; }, 3400);
}
function navigate(view) {
  ui.view = view;
  ui.agentId = null;
  ui.search = '';
  ui.filterAgent = 'all';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function agentBadge(agentId, label = true) {
  const agent = getAgent(agentId);
  return `<span class="assignee"><span class="assignee-dot" style="background:${agent.tint}">${avatarSvg(agent, 'mini')}</span>${label ? `<span>${esc(agent.name)}</span>` : ''}</span>`;
}
function priorityBadge(priority) {
  const label = PRIORITIES.find(item => item.id === priority)?.label || 'Trung bình';
  return `<span class="priority priority-${esc(priority)}"><span class="priority-mark"></span>${esc(label)}</span>`;
}
function statusPill(statusId) {
  const status = getStatus(statusId);
  return `<span class="status-pill status-${status.id}"><span class="status-indicator"></span>${esc(status.label)}</span>`;
}
function sectionHeading(eyebrow, title, description = '') {
  return `<div class="section-header"><div><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ''}</div></div>`;
}
function sideBar(stats) {
  const menu = [
    ['office', 'dashboard', 'Văn phòng'], ['requests', 'messages', 'Yêu cầu Agent'], ['board', 'board', 'Bảng nhiệm vụ'],
    ['agents', 'users', 'Đội ngũ Agent'], ['activity', 'activity', 'Nhật ký hoạt động']
  ];
  return `<aside class="sidebar">
    <div class="brand"><span class="brand-symbol"><span>m</span><i></i></span><div><strong>MinD<span class="brand-dot">.</span></strong><small>AGENT OFFICE</small></div></div>
    <div class="side-section-label">WORKSPACE</div>
    <nav class="side-nav" aria-label="Điều hướng chính">${menu.map(([route, symbol, name]) => `<button class="nav-item ${ui.view === route ? 'active' : ''}" data-action="nav" data-view="${route}" ${ui.view === route ? 'aria-current="page"' : ''}>${icon(symbol, 19)}<span>${name}</span>${route === 'board' ? `<em>${stats.total}</em>` : ''}</button>`).join('')}</nav>
    <div class="side-divider"></div>
    <div class="side-section-label">YOUR CREW <span>05</span></div>
    <div class="side-agents">${AGENTS.map(agent => `<button class="mini-agent" data-action="agent" data-id="${agent.id}"><span class="mini-agent-avatar" style="background:${agent.tint}">${avatarSvg(agent, 'mini')}</span><span class="mini-agent-name">${esc(agent.name)}<small>${esc(agent.group)}</small></span><span class="mini-agent-status" aria-label="Có hồ sơ Agent"></span></button>`).join('')}</div>
    <div class="sidebar-bottom"><div class="demo-note"><span class="demo-note-icon">${icon('spark', 18)}</span><strong>Local Demo Mode</strong><p>Có hộp yêu cầu offline. AI thật cần cấu hình API bảo mật.</p></div><button class="sidebar-help" data-action="nav" data-view="about">${icon('gear', 17)} Cấu hình & lộ trình ${icon('chevron', 15)}</button></div>
  </aside>`;
}
function topbar() {
  const labels = { office: 'Văn phòng', requests: 'Yêu cầu Agent', board: 'Bảng nhiệm vụ', agents: 'Đội ngũ Agent', activity: 'Nhật ký hoạt động', about: 'Giới thiệu MVP' };
  return `<header class="topbar"><div class="breadcrumbs"><span>Workspace</span>${icon('chevron', 14)}<strong>${labels[ui.view] || 'Văn phòng'}</strong></div><div class="top-actions"><span class="date-chip">${icon('clock', 15)} ${esc(dateLabel())}</span><span class="system-chip"><span></span> Local MVP</span><button class="btn btn-primary btn-sm" data-action="new-task">${icon('plus', 17)} <span>Tạo nhiệm vụ</span></button></div></header>`;
}
function mobileNav() {
  return `<nav class="mobile-nav" aria-label="Điều hướng di động">${[['office', 'dashboard', 'Văn phòng'], ['requests', 'messages', 'Yêu cầu'], ['board', 'board', 'Nhiệm vụ'], ['agents', 'users', 'Agents'], ['activity', 'activity', 'Lịch sử']].map(([route, sym, label]) => `<button data-action="nav" data-view="${route}" class="${ui.view === route ? 'active' : ''}">${icon(sym, 20)}<span>${label}</span></button>`).join('')}</nav>`;
}
function statCards(stats) {
  const cards = [
    ['ĐỘI NGŨ', '05', 'agents', '5 vai trò sẵn sàng', 'users'],
    ['ĐANG THỰC HIỆN', String(stats.progress).padStart(2, '0'), 'progress', 'Công việc đang xử lý', 'bolt'],
    ['CHỜ BẠN DUYỆT', String(stats.review).padStart(2, '0'), 'review', 'Cần kiểm tra đầu ra', 'clock'],
    ['HOÀN TẤT', String(stats.done).padStart(2, '0'), 'done', `Trong ${stats.total} nhiệm vụ`, 'check']
  ];
  return `<div class="stats-grid">${cards.map(([title, number, variant, sub, symbol]) => `<div class="stat-card"><div class="stat-header"><span>${title}</span><span class="stat-icon stat-${variant}">${icon(symbol, 18)}</span></div><strong>${number}</strong><small>${sub}</small></div>`).join('')}</div>`;
}
function desk(agent, index) {
  const tasks = workspace.tasks.filter(item => item.agentId === agent.id && item.status !== 'done');
  const status = tasks.some(item => item.status === 'progress') ? 'Đang có việc' : 'Sẵn sàng nhận việc';
  return `<button class="desk desk-${agent.id}" data-action="agent" data-id="${agent.id}" style="--desk-tint:${agent.tint};--desk-accent:${agent.color};--desk-index:${index}" aria-label="Xem hồ sơ ${agent.name}">
     <span class="desk-halo"></span><span class="desk-avatar">${avatarSvg(agent)}</span><span class="desk-counter"><span class="desk-monitor"><span></span><span></span><span></span></span><span class="desk-coffee"></span></span>
     <span class="desk-label"><strong>${esc(agent.name)}</strong><small>${esc(agent.group)}</small></span><span class="desk-status"><span></span>${status}</span>
  </button>`;
}
function officeScene() {
  return `<section class="scene-card"><div class="scene-titlebar"><div><span class="scene-live"><span></span> YOUR LITTLE OFFICE</span><strong>MinD Studio <span>✳</span></strong></div><button class="scene-view-btn" data-action="nav" data-view="agents">Xem đội ngũ ${icon('arrow', 15)}</button></div>
    <div class="scene-world"><div class="scene-dots"></div><div class="scene-cloud cloud-one"></div><div class="scene-cloud cloud-two"></div><div class="scene-window"><span></span><span></span></div><div class="scene-plant plant-left"><i></i></div><div class="scene-plant plant-right"><i></i></div><div class="scene-wall-sign">made of ideas <span>✳</span></div><div class="scene-floor"></div><div class="desk-grid">${AGENTS.map(desk).join('')}</div></div>
    <div class="scene-footer"><span>${icon('spark', 15)} Bấm vào nhân vật để xem nhiệm vụ và phạm vi công việc</span><span><span class="scene-legend-dot"></span> 5 Agent profiles</span></div></section>`;
}
function taskPreview(task, index) {
  const agent = getAgent(task.agentId);
  return `<button class="preview-task" data-action="edit-task" data-id="${esc(task.id)}"><span class="preview-index">${String(index + 1).padStart(2, '0')}</span><span class="preview-body"><strong>${esc(task.title)}</strong><small>${esc(agent.name)} · ${relTime(task.updatedAt)}</small></span>${statusPill(task.status)}${icon('chevron', 17)}</button>`;
}
function activityItem(entry, compact = false) {
  const agent = getAgent(entry.agentId);
  return `<div class="timeline-item ${compact ? 'compact' : ''}"><span class="timeline-icon" style="background:${agent.tint}">${avatarSvg(agent, 'mini')}</span><div class="timeline-info"><p><strong>${esc(agent.name)}</strong> <span>${esc(entry.label.toLowerCase())}</span></p><div class="timeline-detail">${esc(entry.detail)}</div><time title="${esc(fmtDate(entry.at))}">${relTime(entry.at)}</time></div></div>`;
}
function officeView(stats) {
  const active = workspace.tasks.filter(item => item.status !== 'done').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);
  return `<div class="page-intro"><div><div class="top-eyebrow">✦ MINDS AT WORK / YOUR AI HQ</div><h1>Chào mừng trở lại <span class="hello-wave">✳</span></h1><p>Văn phòng nhỏ, ý tưởng lớn. Mọi người và mọi đầu việc — gọn trong một nơi.</p></div><button class="btn btn-light" data-action="nav" data-view="requests">${icon('messages', 18)} Gửi yêu cầu Agent</button></div>
    ${statCards(stats)}${officeScene()}
    <div class="bottom-grid"><section class="surface-panel"><div class="panel-heading"><div><span class="eyebrow">AT A GLANCE</span><h3>Nhiệm vụ gần đây</h3></div><button class="text-link" data-action="nav" data-view="board">Tất cả ${icon('arrow', 16)}</button></div><div class="task-preview-list">${active.length ? active.map(taskPreview).join('') : '<div class="empty-inline">Tất cả nhiệm vụ đã hoàn tất. Tuyệt vời!</div>'}</div></section>
    <section class="surface-panel activity-preview"><div class="panel-heading"><div><span class="eyebrow">WHAT’S HAPPENING</span><h3>Hoạt động mới</h3></div><button class="text-link" data-action="nav" data-view="activity">Xem thêm ${icon('arrow', 16)}</button></div><div class="timeline">${workspace.activities.slice(0, 4).map(entry => activityItem(entry, true)).join('') || '<p class="empty-inline">Chưa có hoạt động.</p>'}</div></section></div>`;
}
function taskCard(task) {
  const agent = getAgent(task.agentId);
  return `<article class="task-card" draggable="true" data-drag-id="${esc(task.id)}" data-filter-agent="${esc(task.agentId)}" data-search="${esc((task.title + ' ' + task.description + ' ' + agent.name).toLowerCase())}"><div class="task-card-top">${priorityBadge(task.priority)}<button class="icon-btn task-card-edit" data-action="edit-task" data-id="${esc(task.id)}" aria-label="Chỉnh sửa ${esc(task.title)}">${icon('edit', 16)}</button></div><button class="task-card-title" data-action="edit-task" data-id="${esc(task.id)}">${esc(task.title)}</button><p>${esc(task.description || 'Chưa có mô tả.').slice(0, 170)}</p><div class="task-card-bottom">${agentBadge(task.agentId)}<span title="Cập nhật ${esc(fmtDate(task.updatedAt))}">${relTime(task.updatedAt)}</span></div><div class="task-card-actions"><select data-status-change data-id="${esc(task.id)}" aria-label="Trạng thái ${esc(task.title)}">${STATUSES.map(status => `<option value="${status.id}" ${status.id === task.status ? 'selected' : ''}>${esc(status.label)}</option>`).join('')}</select><button class="copy-mini" data-action="request-from-task" data-id="${esc(task.id)}" title="Mở hội thoại và gửi yêu cầu">${icon('messages', 14)} Yêu cầu</button></div></article>`;
}
function boardView() {
  return `<div class="subpage-header"><div><span class="eyebrow">MISSION CONTROL</span><h1>Bảng nhiệm vụ<span class="heading-spark"> ✳</span></h1><p>Phân công, kéo thả và cập nhật tiến độ theo thời gian thực trong trình duyệt của bạn.</p></div><button class="btn btn-primary" data-action="new-task">${icon('plus', 17)} Tạo nhiệm vụ</button></div>
  <div class="board-controls"><label class="search-box">${icon('search', 18)}<input id="task-search" type="search" placeholder="Tìm nhiệm vụ..." aria-label="Tìm nhiệm vụ" value="${esc(ui.search)}" /></label><label class="filter-box">Lọc Agent <select id="agent-filter"> <option value="all">Tất cả Agent</option>${AGENTS.map(agent => `<option value="${agent.id}" ${ui.filterAgent === agent.id ? 'selected' : ''}>${esc(agent.name)}</option>`).join('')}</select></label><span class="board-tip">${icon('bolt', 16)} Kéo thả để đổi trạng thái</span></div>
  <div class="kanban">${STATUSES.map(status => { const tasks = workspace.tasks.filter(task => task.status === status.id && (ui.filterAgent === 'all' || task.agentId === ui.filterAgent) && (task.title + ' ' + task.description + ' ' + getAgent(task.agentId).name).toLowerCase().includes(ui.search.toLowerCase())); return `<section class="kanban-column" data-drop-status="${status.id}"><div class="column-header"><div><span class="column-dot" style="background:${status.color}"></span><strong>${esc(status.label)}</strong><em>${tasks.length}</em></div><span class="column-icon">${status.icon}</span></div><div class="column-tasks">${tasks.map(taskCard).join('')}${!tasks.length ? '<div class="empty-column">Chưa có nhiệm vụ</div>' : ''}</div><button class="column-add" data-action="new-task-status" data-status="${status.id}">${icon('plus', 15)} Thêm nhiệm vụ</button></section>`; }).join('')}</div><div class="board-bottom-note">${icon('lock', 16)} Dữ liệu chỉ lưu trong trình duyệt hiện tại. Đây là bảng điều phối, chưa phải hệ thống AI tự chạy.</div>`;
}
function agentsView() {
  return `<div class="subpage-header"><div><span class="eyebrow">MEET THE TEAM</span><h1>Đội ngũ Agent<span class="heading-spark"> ✳</span></h1><p>5 nhân sự số, 5 chuyên môn. Chọn một Agent để xem scope và giao nhiệm vụ.</p></div></div><div class="roster-grid">${AGENTS.map(agent => { const assigned = workspace.tasks.filter(task => task.agentId === agent.id); const open = assigned.filter(task => task.status !== 'done').length; return `<button class="roster-card" data-action="agent" data-id="${agent.id}" style="--roster-accent:${agent.color};--roster-tint:${agent.tint}"><span class="roster-portrait">${avatarSvg(agent)}</span><span class="roster-heading"><strong>${esc(agent.name)}</strong><small>${esc(agent.title)}</small></span><span class="roster-bio">${esc(agent.bio)}</span><span class="roster-foot"><span>${icon('board', 16)} ${open} việc đang mở</span><span>Xem hồ sơ ${icon('arrow', 16)}</span></span></button>`; }).join('')}</div><div class="team-hint">${icon('spark', 18)} Mỗi Agent có bộ prompt vai trò riêng, có thể sao chép để giao việc thủ công vào ChatGPT.</div>`;
}
function activityView() {
  return `<div class="subpage-header"><div><span class="eyebrow">ACTIVITY FEED</span><h1>Nhật ký hoạt động<span class="heading-spark"> ✳</span></h1><p>Mọi thay đổi nhiệm vụ được ghi nhận để bạn dễ theo dõi và kiểm tra.</p></div><button class="btn btn-outline" data-action="reset-demo">${icon('reset', 17)} Khôi phục dữ liệu mẫu</button></div><div class="activity-layout"><section class="surface-panel full-timeline"><div class="panel-heading"><div><span class="eyebrow">LATEST UPDATES</span><h3>${workspace.activities.length} sự kiện gần đây</h3></div><span class="quiet-tag">Lưu tối đa 250 sự kiện</span></div><div class="timeline">${workspace.activities.length ? workspace.activities.map(entry => activityItem(entry)).join('') : '<div class="empty-inline">Chưa có sự kiện nào.</div>'}</div></section><aside class="history-info"><div class="history-icon">${icon('document', 26)}</div><h3>Ghi lại mỗi thay đổi</h3><p>Khi bạn thêm, sửa, chuyển trạng thái hoặc xoá nhiệm vụ, nhật ký sẽ cập nhật ngay.</p><div class="history-hint">Chưa tích hợp nhật ký máy chủ, người thực hiện và kiểm toán đa người dùng. Các sự kiện mẫu chỉ minh hoạ giao diện.</div></aside></div>`;
}
function aboutView() {
  return `<div class="subpage-header"><div><span class="eyebrow">PROJECT STATUS</span><h1>Về Agent Office V1.1</h1><p>Phiên bản MVP điều phối nhiệm vụ — nền móng cho đội ngũ AI hoạt động thực tế.</p></div></div><div class="about-grid"><section class="surface-panel"><div class="feature-symbol green">${icon('check', 27)}</div><h3>Đã có trong V1.0</h3><ul class="feature-list"><li>Văn phòng chibi với 5 nhân vật và hồ sơ vai trò</li><li>Tạo, sửa, phân công và xoá nhiệm vụ</li><li>Bảng Kanban có kéo thả, tìm kiếm và lọc</li><li>Nhật ký hoạt động khi thao tác</li><li>Gửi request, xem phản hồi offline theo quy tắc và sao chép prompt</li><li>Thiết kế responsive cho desktop và mobile</li></ul></section><section class="surface-panel"><div class="feature-symbol amber">${icon('bolt', 27)}</div><h3>Sẽ cần ở V2.0</h3><ul class="feature-list"><li>AI backend đã chuẩn bị; cần OPENAI_API_KEY và mã truy cập trên Vercel</li><li>GitHub / Drive / Gmail tools và quyền truy cập</li><li>Phê duyệt trước khi Agent thực hiện hành động</li><li>Đăng nhập, cơ sở dữ liệu và đồng bộ nhiều thiết bị</li><li>Job queue, lịch tự động, lưu dấu vết thực thi</li><li>Bảo mật, giới hạn chi phí và giám sát</li></ul></section></div><div class="about-banner"><div><span class="eyebrow">HANDOFF READY</span><h3>Từ prototype đến agent thật</h3><p>Offline chỉ trả về checklist theo quy tắc, không tự nghiên cứu hay gửi email. Sau khi cấu hình backend, các Agent có thể trả lời qua API, vẫn không tự thực hiện tác vụ bên ngoài.</p></div><button class="btn btn-primary" data-action="nav" data-view="board">Quản lý nhiệm vụ ${icon('arrow', 17)}</button></div>`;
}
function agentDrawer() {
  if (!ui.agentId) return '';
  const agent = getAgent(ui.agentId);
  const tasks = workspace.tasks.filter(task => task.agentId === agent.id && task.status !== 'done').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return `<div class="drawer-overlay" data-action="close-agent"></div><aside class="agent-drawer" aria-label="Hồ sơ Agent ${esc(agent.name)}"><div class="drawer-head"><span class="eyebrow">AGENT PROFILE · 0${AGENTS.findIndex(item => item.id === agent.id) + 1}</span><button class="icon-btn" data-action="close-agent" aria-label="Đóng hồ sơ">${icon('close', 20)}</button></div><div class="drawer-hero" style="--drawer-accent:${agent.color};--drawer-tint:${agent.tint}"><div class="drawer-avatar">${avatarSvg(agent)}</div><span class="drawer-status"><span></span> Sẵn sàng nhận nhiệm vụ</span></div><div class="drawer-content"><span class="drawer-role">${esc(agent.title)}</span><h2>${esc(agent.name)} <span>✳</span></h2><p>${esc(agent.bio)}</p><h4>PHẠM VI CÔNG VIỆC</h4><ul class="capability-list">${agent.capabilities.map(capability => `<li>${icon('check', 15)} ${esc(capability)}</li>`).join('')}</ul><div class="drawer-task-head"><h4>NHIỆM VỤ ĐANG MỞ (${tasks.length})</h4></div><div class="drawer-tasks">${tasks.length ? tasks.slice(0, 5).map(task => `<button data-action="edit-task" data-id="${esc(task.id)}" class="drawer-task"><span>${esc(task.title)}</span>${statusPill(task.status)}</button>`).join('') : '<p class="empty-inline">Chưa có việc đang mở.</p>'}</div><button class="btn btn-primary drawer-assign" data-action="request-agent-open" data-id="${agent.id}">${icon('messages', 17)} Gửi yêu cầu cho ${esc(agent.name)}</button><button class="btn btn-outline drawer-assign" style="margin-top:9px" data-action="new-task-agent" data-id="${agent.id}">${icon('plus', 17)} Tạo nhiệm vụ</button><p class="drawer-footnote">Xem quy trình, nguyên tắc và phản hồi ở mục Yêu cầu Agent. Chế độ offline không phải AI thật.</p></div></aside>`;
}
function taskModal() {
  if (!ui.modalOpen) return '';
  const task = workspace.tasks.find(item => item.id === ui.modalTaskId);
  const activeAgent = task?.agentId || ui.modalAgentId || AGENTS[0].id;
  const activeStatus = task?.status || ui.modalStatus || 'todo';
  return `<div class="modal-backdrop" data-action="close-modal"></div><div class="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="task-modal-title"><form id="task-form" class="task-modal"><div class="modal-top"><div><span class="eyebrow">${task ? 'EDIT MISSION' : 'CREATE MISSION'}</span><h2 id="task-modal-title">${task ? 'Chỉnh sửa nhiệm vụ' : 'Giao một nhiệm vụ mới'} <span>✳</span></h2></div><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">${icon('close', 21)}</button></div><div class="form-stack"><label for="task-title">Tên nhiệm vụ <span>*</span></label><input id="task-title" name="title" maxlength="120" required placeholder="Ví dụ: Phân tích đối thủ cạnh tranh" value="${esc(task?.title || '')}" /><label for="task-desc">Mô tả / đầu ra mong muốn</label><textarea id="task-desc" name="description" rows="4" maxlength="3000" placeholder="Mục tiêu, yêu cầu, tài liệu tham khảo...">${esc(task?.description || '')}</textarea><div class="form-row"><div><label for="task-agent">Giao cho Agent</label><select id="task-agent" name="agentId">${AGENTS.map(agent => `<option value="${agent.id}" ${activeAgent === agent.id ? 'selected' : ''}>${esc(agent.name)} — ${esc(agent.group)}</option>`).join('')}</select></div><div><label for="task-priority">Mức ưu tiên</label><select id="task-priority" name="priority">${PRIORITIES.map(priority => `<option value="${priority.id}" ${(task?.priority || 'medium') === priority.id ? 'selected' : ''}>${esc(priority.label)}</option>`).join('')}</select></div></div><label for="task-status">Trạng thái</label><select id="task-status" name="status">${STATUSES.map(status => `<option value="${status.id}" ${activeStatus === status.id ? 'selected' : ''}>${esc(status.label)}</option>`).join('')}</select></div><div class="modal-actions"><div>${task ? `<button type="button" class="danger-link" data-action="delete-task" data-id="${esc(task.id)}">${icon('trash', 17)} Xoá</button>` : '<span class="form-footnote">* Bắt buộc</span>'}</div><div class="modal-buttons"><button type="button" class="btn btn-outline" data-action="close-modal">Huỷ</button><button type="submit" class="btn btn-primary">${icon('check', 17)} ${task ? 'Lưu thay đổi' : 'Tạo nhiệm vụ'}</button></div></div></form></div>`;
}
function render() {
  const stats = getStats(workspace.tasks);
  const views = { office: () => officeView(stats), requests: () => requestUI.renderView(workspace), board: boardView, agents: agentsView, activity: activityView, about: aboutView };
  app.innerHTML = `<div class="app-shell">${sideBar(stats)}<div class="app-main">${topbar()}<main class="page-content" id="main-content">${(views[ui.view] || views.office)()}</main><footer class="app-footer"><span>© ${new Date().getFullYear()} MinD Agent Office</span><span>V1.1 · Built with curiosity <span class="footer-heart">♥</span></span></footer></div>${mobileNav()}</div>${agentDrawer()}${taskModal()}<div id="global-toast" role="status" aria-live="polite" class="toast ${ui.toast ? 'is-visible' : ''}">${esc(ui.toast)}</div>`;
  document.body.classList.toggle('modal-open', ui.modalOpen || Boolean(ui.agentId));
  if (ui.modalOpen) queueMicrotask(() => document.getElementById('task-title')?.focus());
}
function openModal(id = null, agentId = null, status = 'todo') {
  ui.modalTaskId = id; ui.modalAgentId = agentId; ui.modalStatus = status; ui.modalOpen = true;
  render();
}
function closeModal() { ui.modalOpen = false; ui.modalTaskId = null; ui.modalAgentId = null; render(); }
function closeAgent() { ui.agentId = null; render(); }
async function copyPrompt(taskId) {
  const task = workspace.tasks.find(item => item.id === taskId);
  if (!task) return;
  const prompt = buildAgentPrompt(getAgent(task.agentId), task);
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(prompt);
    else { const field = document.createElement('textarea'); field.value = prompt; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); field.select(); if (!document.execCommand('copy')) throw new Error('Clipboard unsupported'); field.remove(); }
    showToast('Đã sao chép prompt! Dán vào ChatGPT để Agent hỗ trợ xử lý.');
  } catch { window.prompt('Sao chép prompt này và dán vào ChatGPT:', prompt); }
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, id, view, status } = target.dataset;
  if (requestUI.handleClick(action, target.dataset)) return;
  switch (action) {
    case 'nav': navigate(view); break;
    case 'agent': ui.agentId = id; render(); break;
    case 'request-agent-open': requestUI.selectAgent(id); ui.agentId = null; navigate('requests'); break;
    case 'request-from-task': { const task = workspace.tasks.find(item => item.id === id); if (task) { requestUI.fromTask(task); navigate('requests'); } break; }
    case 'close-agent': closeAgent(); break;
    case 'new-task': openModal(); break;
    case 'new-task-agent': ui.agentId = null; openModal(null, id); break;
    case 'new-task-status': openModal(null, null, status); break;
    case 'edit-task': ui.agentId = null; openModal(id); break;
    case 'close-modal': closeModal(); break;
    case 'copy-prompt': void copyPrompt(id); break;
    case 'delete-task': if (window.confirm('Bạn muốn xoá nhiệm vụ này? Nhật ký vẫn sẽ ghi nhận thao tác.')) { persist(deleteTask(workspace, id)); closeModal(); showToast('Đã xoá nhiệm vụ.'); } break;
    case 'reset-demo': if (window.confirm('Khôi phục toàn bộ nhiệm vụ và nhật ký mẫu? Dữ liệu bạn đã tạo sẽ bị thay thế.')) { persist(seedWorkspace()); showToast('Đã khôi phục dữ liệu mẫu.'); } break;
  }
});
document.addEventListener('submit', event => {
  if (event.target.id === 'request-form') { event.preventDefault(); void requestUI.submit(event.target); return; }
  if (event.target.id !== 'task-form') return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  try {
    const next = ui.modalTaskId ? updateTask(workspace, ui.modalTaskId, data) : createTask(workspace, data);
    ui.modalOpen = false; ui.modalTaskId = null; ui.modalAgentId = null;
    persist(next);
    showToast('Đã lưu nhiệm vụ và cập nhật nhật ký.');
  } catch (error) { showToast(error.message || 'Không thể lưu nhiệm vụ.', true); }
});
document.addEventListener('change', event => {
  if (requestUI.handleChange(event)) return;
  if (event.target.matches('[data-status-change]')) {
    const { id } = event.target.dataset;
    persist(moveTask(workspace, id, event.target.value));
    showToast('Đã chuyển trạng thái nhiệm vụ.');
  }
  if (event.target.id === 'agent-filter') { ui.filterAgent = event.target.value; render(); }
});
document.addEventListener('input', event => {
  requestUI.rememberDraft(event);
  if (event.target.id !== 'task-search') return;
  ui.search = event.target.value;
  const cursor = event.target.selectionStart;
  render();
  const field = document.getElementById('task-search');
  field?.focus();
  if (cursor !== null) field?.setSelectionRange(cursor, cursor);
});
document.addEventListener('dragstart', event => {
  const card = event.target.closest('[data-drag-id]');
  if (!card) return;
  dragTaskId = card.dataset.dragId;
  event.dataTransfer?.setData('text/plain', dragTaskId);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  card.classList.add('dragging');
});
document.addEventListener('dragend', () => { dragTaskId = null; document.querySelectorAll('.dragging, .drag-over').forEach(item => item.classList.remove('dragging', 'drag-over')); });
document.addEventListener('dragover', event => { const zone = event.target.closest('[data-drop-status]'); if (zone) { event.preventDefault(); zone.classList.add('drag-over'); } });
document.addEventListener('dragleave', event => { const zone = event.target.closest('[data-drop-status]'); if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('drag-over'); });
document.addEventListener('drop', event => {
  const zone = event.target.closest('[data-drop-status]');
  if (!zone) return;
  event.preventDefault();
  const taskId = dragTaskId || event.dataTransfer?.getData('text/plain');
  dragTaskId = null;
  if (!workspace.tasks.some(task => task.id === taskId)) return;
  persist(moveTask(workspace, taskId, zone.dataset.dropStatus));
  showToast('Đã cập nhật bảng nhiệm vụ.');
});
document.addEventListener('keydown', event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && event.target.id === 'request-message') { event.preventDefault(); event.target.form?.requestSubmit(); } if (event.key === 'Escape') { if (ui.modalOpen) closeModal(); else if (ui.agentId) closeAgent(); } });
render();
