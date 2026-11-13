import test from 'node:test';
import assert from 'node:assert/strict';
import {CREW} from '../src/crew-v3.mjs';
import {routeMission,createMission,readyStages,completeStage,buildWorkPrompt,loadState,saveState,getMissionStats,STORE_KEY} from '../src/mission-v3.mjs';

test('seven distinct specialists with grounded roles',()=>{
  assert.deepEqual(CREW.map(x=>x.id),['nova','ivy','momo','lumi','ada','byte','kai']);
  assert.equal(new Set(CREW.map(x=>x.station.x+':'+x.station.y)).size,7);
});
test('router does not assign dev to routine caption',()=>{
  assert.deepEqual(routeMission('Viết caption SEO cho nhạc K-R&B'),['momo']);
  assert.deepEqual(routeMission('Thiết kế thumbnail clip TikTok'),['momo','lumi']);
  assert.deepEqual(routeMission('Xây website Pixel RPG và tối ưu UI'),['lumi','byte']);
});
test('stages respect handoff, do not fabricate completion',()=>{
  let m=createMission('Thiết kế thumbnail clip TikTok cho content brand');
  assert.equal(m.stages.some(s=>s.status==='done'),false);
  assert.deepEqual(readyStages(m).map(s=>s.id),['intake']);
  assert.throws(()=>completeStage(m,'research','Data đã được hoàn tất tại đây.'),/phụ thuộc/);
  m=completeStage(m,'intake','Đã duyệt mission brief, xác định đối tượng người xem và yêu cầu đầu ra.');
  assert.deepEqual(readyStages(m).map(s=>s.id),['research']);
  assert.match(buildWorkPrompt(m,'research'),/không sử dụng token/i);
  assert.equal(getMissionStats(m).done,1);
});
test('no-api store roundtrip',()=>{
  const map=new Map();const store={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
  const mission=createMission('Làm một dashboard nghiên cứu thị trường');
  assert.equal(saveState(store,{schema:3,missions:[mission]}),true);
  assert.equal(loadState(store).missions.length,1);
  assert.ok(map.has(STORE_KEY));
});
