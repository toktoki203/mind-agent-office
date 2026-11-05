export const AGENTS = [
  {
    id: 'nova', name: 'Nova', title: 'CEO Agent', group: 'Điều phối',
    emoji: '✦', color: '#8d84f6', tint: '#eeebff', hair: '#483d83', skin: '#ffcfb7', variant: 'leader',
    bio: 'Trợ lý trưởng giữ nhịp toàn bộ văn phòng, phân chia ưu tiên và kiểm tra chất lượng đầu ra.',
    capabilities: ['Phân rã mục tiêu thành đầu việc', 'Ưu tiên và phân công', 'Đề xuất quyết định, xin phê duyệt'],
    promptRole: 'Bạn là Chief of Staff chuyên điều phối đội ngũ AI. Hãy phân rã vấn đề, nêu ưu tiên và đầu ra kiểm chứng được.'
  },
  {
    id: 'ivy', name: 'Ivy', title: 'Research Agent', group: 'Nghiên cứu',
    emoji: '◈', color: '#52baa5', tint: '#e3f8f0', hair: '#634b45', skin: '#f7c5a9', variant: 'glasses',
    bio: 'Chuyên viên nghiên cứu, tổng hợp tài liệu và biến thông tin phức tạp thành insight rõ ràng.',
    capabilities: ['Research & kiểm chứng nguồn', 'Phân tích thị trường và đối thủ', 'Tóm tắt báo cáo có dẫn chứng'],
    promptRole: 'Bạn là Research Analyst. Tách rõ dữ kiện, nguồn, giả định và những điều chưa xác minh; không bịa nguồn.'
  },
  {
    id: 'momo', name: 'Momo', title: 'Creative Agent', group: 'Sáng tạo',
    emoji: '✿', color: '#f092b7', tint: '#ffebf2', hair: '#82415e', skin: '#ffd7c1', variant: 'beret',
    bio: 'Creative partner phụ trách ý tưởng, kịch bản, thương hiệu và cách trình bày hấp dẫn.',
    capabilities: ['Brainstorm concept', 'Viết content & storytelling', 'Creative brief và moodboard'],
    promptRole: 'Bạn là Creative Director. Đưa ra các ý tưởng khả thi, có insight và tiêu chí chất lượng rõ ràng.'
  },
  {
    id: 'byte', name: 'Byte', title: 'Developer Agent', group: 'Kỹ thuật',
    emoji: '</>', color: '#eeb36d', tint: '#fff3e1', hair: '#4f485e', skin: '#f1c4ab', variant: 'headset',
    bio: 'Kỹ sư sản phẩm chuyên biến ý tưởng thành tính năng, kiểm thử và tối ưu ứng dụng.',
    capabilities: ['Thiết kế kiến trúc', 'Lập trình & kiểm thử', 'Review code và xử lý lỗi'],
    promptRole: 'Bạn là Senior Full-stack Engineer. Đưa ra giải pháp an toàn, mã dễ bảo trì, các bước kiểm thử và rủi ro.'
  },
  {
    id: 'kai', name: 'Kai', title: 'Operations Agent', group: 'Vận hành',
    emoji: '☷', color: '#74a9ef', tint: '#e9f2ff', hair: '#343e62', skin: '#ffceb0', variant: 'cap',
    bio: 'Người giữ quy trình: chuẩn hóa checklist, theo dõi deadline và chuẩn bị báo cáo tiến độ.',
    capabilities: ['Thiết kế quy trình & SOP', 'Checklist triển khai', 'Theo dõi tiến độ và bàn giao'],
    promptRole: 'Bạn là Operations Manager. Ưu tiên quy trình ngắn gọn, trách nhiệm rõ ràng và cách đo tiến độ.'
  }
];

export const STATUSES = [
  { id: 'todo', label: 'Cần làm', color: '#a5a5b7', icon: '◌' },
  { id: 'progress', label: 'Đang thực hiện', color: '#7b8cf0', icon: '◴' },
  { id: 'review', label: 'Chờ duyệt', color: '#e9ac63', icon: '◈' },
  { id: 'done', label: 'Hoàn tất', color: '#67bb99', icon: '✓' }
];

export const PRIORITIES = [
  { id: 'high', label: 'Ưu tiên cao' },
  { id: 'medium', label: 'Trung bình' },
  { id: 'low', label: 'Linh hoạt' }
];

const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

export function seedWorkspace() {
  return {
    schema: 1,
    tasks: [
      { id: 'sample-1', title: 'Lên kế hoạch Agent Office V1.0', description: 'Xác định phạm vi, luồng giao việc và mốc phát triển MVP.', agentId: 'nova', status: 'done', priority: 'high', createdAt: ago(2600), updatedAt: ago(450) },
      { id: 'sample-2', title: 'Khảo sát 5 mô hình AI Office', description: 'Tổng hợp best practices và trade-off từ các mô hình agent workplace.', agentId: 'ivy', status: 'review', priority: 'high', createdAt: ago(1400), updatedAt: ago(128) },
      { id: 'sample-3', title: 'Thiết kế concept văn phòng chibi', description: 'Xây style guide pastel, avatar và các trạng thái nhiệm vụ.', agentId: 'momo', status: 'progress', priority: 'medium', createdAt: ago(950), updatedAt: ago(82) },
      { id: 'sample-4', title: 'Xây giao diện Dashboard', description: 'Office overview, task board, agent profiles và activity log.', agentId: 'byte', status: 'progress', priority: 'high', createdAt: ago(810), updatedAt: ago(55) },
      { id: 'sample-5', title: 'Chuẩn hóa checklist nghiệm thu', description: 'Viết các tiêu chí test và quy trình bàn giao phiên bản MVP.', agentId: 'kai', status: 'todo', priority: 'medium', createdAt: ago(380), updatedAt: ago(380) },
      { id: 'sample-6', title: 'Định nghĩa quy tắc duyệt công việc', description: 'Các hành động ngoại bộ phải được người dùng chấp thuận.', agentId: 'nova', status: 'todo', priority: 'high', createdAt: ago(260), updatedAt: ago(260) },
      { id: 'sample-7', title: 'Phác thảo cấu trúc dữ liệu', description: 'Thiết kế Task, Agent và Activity Event cho phiên bản MVP.', agentId: 'byte', status: 'done', priority: 'medium', createdAt: ago(1450), updatedAt: ago(510) }
    ],
    activities: [
      { id: 'event-1', at: ago(55), agentId: 'byte', label: 'Đang thực hiện', detail: 'Xây giao diện Dashboard', kind: 'move' },
      { id: 'event-2', at: ago(82), agentId: 'momo', label: 'Đang thực hiện', detail: 'Thiết kế concept văn phòng chibi', kind: 'move' },
      { id: 'event-3', at: ago(128), agentId: 'ivy', label: 'Chờ duyệt', detail: 'Khảo sát 5 mô hình AI Office', kind: 'review' },
      { id: 'event-4', at: ago(450), agentId: 'nova', label: 'Hoàn tất', detail: 'Lên kế hoạch Agent Office V1.0', kind: 'done' },
      { id: 'event-5', at: ago(510), agentId: 'byte', label: 'Hoàn tất', detail: 'Phác thảo cấu trúc dữ liệu', kind: 'done' }
    ]
  };
}

export function getAgent(id) { return AGENTS.find(agent => agent.id === id) || AGENTS[0]; }
export function getStatus(id) { return STATUSES.find(status => status.id === id) || STATUSES[0]; }
