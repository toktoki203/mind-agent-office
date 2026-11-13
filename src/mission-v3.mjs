import {CREW, getCrew} from './crew-v3.mjs';

export const STORE_KEY = 'mind-agent-office:v3:no-api';
const ID = () => globalThis.crypto?.randomUUID?.() || 'm-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
const match = (s,r) => r.test(s);
export function routeMission(brief) {
  const s=String(brief||'').toLowerCase();
  const content=match(s,/(caption|content|seo|bài viết|viết bài|kịch bản|voiceover|lời thoại|storytelling|social|newsletter|description|tiêu đề|viết nội dung)/i);
  const media=match(s,/(thiết kế|video|clip|hình ảnh|ảnh|poster|banner|thumbnail|motion|animation|artwork|pixel|sprite|giao diện|ui|ux|visual|design|render)/i);
  const dev=match(s,/(website|web app|webapp|trang web|công cụ|phần mềm|lập trình|code|coding|backend|frontend|database|repo|github|integration|tích hợp|indicator|chỉ báo|tradingview|api|develop|debug)/i);
  const optimize=match(s,/(tối ưu|optimiz|backtest|đánh giá|hiệu suất|a\/b|so sánh|kiểm thử|kiểm định|lỗi|test|qa|phân tích)/i);
  const specialists=[];
  if(content || (media && match(s,/(video|clip|short|reel|tiktok|youtube)/i))) specialists.push('momo');
  if(media) specialists.push('lumi');
  if(dev) specialists.push('byte');
  if(!specialists.length && !optimize) specialists.push('momo');
  return specialists;
}
function stage(id,agentId,title,dependsOn=[]) {
  return {id,agentId,title,dependsOn,status:'queued',result:'',completedAt:null};
}
export function createMission(input) {
  const brief=String(input||'').trim();
  if(brief.length<10||brief.length>4000) throw new Error('Brief phải có 10–4.000 ký tự.');
  const specialists=routeMission(brief);
  const stages=[
    stage('intake','nova','Phân tích brief và tiêu chí nghiệm thu'),
    stage('research','ivy','Nghiên cứu và tạo Evidence Pack',['intake']),
    ...specialists.map(id=>stage('execute-'+id,id,'Thực hiện nhiệm vụ '+getCrew(id).team,['research'])),
    stage('quality','ada','Kiểm định output',['research',...specialists.map(id=>'execute-'+id)]),
    stage('report','kai','Tổng hợp báo cáo',['quality']),
    stage('final','nova','Final review & bàn giao',['report'])
  ];
  return {id:ID(),brief,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),stages,origin:'local-no-api'};
}
export const readyStages = mission => (mission?.stages||[]).filter(s=>s.status==='queued' && s.dependsOn.every(id=>mission.stages.some(p=>p.id===id && p.status==='done')));
export function completeStage(mission,stageId,result) {
  const text=String(result||'').trim();
  if(text.length<20||text.length>40000) throw new Error('Dán kết quả thực tế (20–40.000 ký tự) để nghiệm thu.');
  const current=(mission?.stages||[]).find(s=>s.id===stageId);
  if(!current) throw new Error('Không tìm thấy công việc.');
  if(!readyStages(mission).some(s=>s.id===stageId)) throw new Error('Bước này còn phụ thuộc vào đầu ra trước đó hoặc đã hoàn tất.');
  return {...mission,updatedAt:new Date().toISOString(),stages:mission.stages.map(s=>s.id===stageId?{...s,status:'done',result:text,completedAt:new Date().toISOString()}:s)};
}
export function buildWorkPrompt(mission,stageId) {
  const s=mission?.stages?.find(item=>item.id===stageId);
  const a=s&&getCrew(s.agentId);
  if(!a) return '';
  const previous=mission.stages.filter(p=>p.status==='done').map(p=>{
    const agent=getCrew(p.agentId);
    return '### '+agent.name+' / '+p.title+'\n'+p.result.slice(0,12000);
  }).join('\n\n');
  return [
    '# MinD Agent Office — Work handoff','',
    'Hãy thực hiện nhiệm vụ bằng ChatGPT Work, sử dụng các công cụ đã được cấp quyền trong phiên Work hiện tại.',
    'Đây không phải lời gọi API tự động từ website. Không sử dụng token phiên, cookie hoặc OPENAI_API_KEY.',
    '',
    '## Agent: '+a.name+' — '+a.team+' / '+a.title,
    'Nhiệm vụ: '+a.mission,
    'Kỹ năng: '+a.skills.join('; '),
    'Đầu ra cần có: '+a.output,
    'Giới hạn: '+a.restrictions,
    '',
    '## User brief',mission.brief,
    '',
    '## Stage',s.title,
    '',
    '## Upstream evidence / results',previous||'(Chưa có)',
    '',
    '## Execution rules',
    '- Thực hiện thực chất trong phạm vi quyền hiện có; nếu không thể truy cập một nguồn/công cụ, báo rõ.',
    '- Dẫn nguồn hoặc dẫn chứng cho dữ kiện và kết quả kiểm thử; không tự nhận đã xuất bản hay sửa hệ thống.',
    '- Không thực hiện hành động bên ngoài có ảnh hưởng nếu chưa được phép.',
    '- Trả về deliverable hoàn chỉnh và checklist kiểm định, không chỉ kế hoạch.',
    '- Đưa ra một phần văn bản có thể dán lại vào Agent Office để lưu kết quả.',
    '',
    'Sau khi Work trả kết quả, người dùng dán đầu ra vào đúng stage trên website.'
  ].join('\n');
}
export function blankState(){return {schema:3,missions:[]};}
export function loadState(storage) {
  try{
    const raw=storage?.getItem(STORE_KEY);
    if(!raw)return blankState();
    const parsed=JSON.parse(raw);
    if(parsed.schema===3 && Array.isArray(parsed.missions))return {schema:3,missions:parsed.missions.slice(0,100)};
  }catch{}
  return blankState();
}
export function saveState(storage,state) {
  try {storage.setItem(STORE_KEY,JSON.stringify(state));return true;}catch{return false;}
}
export function getMissionStats(mission) {
  const total=mission?.stages?.length||0;
  const done=mission?.stages?.filter(s=>s.status==='done').length||0;
  return {total,done,percent:total?Math.round(100*done/total):0,completed:total>0&&total===done};
}
