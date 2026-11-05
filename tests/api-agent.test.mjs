import test from 'node:test';
import assert from 'node:assert/strict';
import agentHandler from '../api/agent.js';

const makeRequest = (body, code = 'office-demo-code') => new Request('https://example.com/api/agent', { method:'POST', headers:{ 'content-type':'application/json','x-office-access-code':code,'x-forwarded-for':'192.0.2.3' },body: JSON.stringify(body) });

test('API refuses unsupported methods and unconfigured AI', async () => {
  const get = await agentHandler.fetch(new Request('https://example.com/api/agent'));
  assert.equal(get.status, 405);
  const previousKey = process.env.OPENAI_API_KEY;
  const previousCode = process.env.AGENT_OFFICE_ACCESS_CODE;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AGENT_OFFICE_ACCESS_CODE;
  const r = await agentHandler.fetch(makeRequest({agentId:'nova', messages:[{role:'user',content:'Hello'}]}));
  assert.equal(r.status, 503);
  if(previousKey!==undefined) process.env.OPENAI_API_KEY=previousKey;
  if(previousCode!==undefined) process.env.AGENT_OFFICE_ACCESS_CODE=previousCode;
});

test('API protects the model with access code and validates input', async () => {
  const priorKey=process.env.OPENAI_API_KEY,priorCode=process.env.AGENT_OFFICE_ACCESS_CODE;
  process.env.OPENAI_API_KEY='test-only';
  process.env.AGENT_OFFICE_ACCESS_CODE='office-demo-code';
  try {
    assert.equal((await agentHandler.fetch(makeRequest({agentId:'nova',messages:[{role:'user',content:'Hi'}]},'invalid'))).status, 403);
    assert.equal((await agentHandler.fetch(makeRequest({agentId:'invalid',messages:[{role:'user',content:'Hi'}]}))).status, 400);
    assert.equal((await agentHandler.fetch(makeRequest({agentId:'nova',messages:[{role:'assistant',content:'Hi'}]}))).status, 400);
  } finally {
    if(priorKey===undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=priorKey;
    if(priorCode===undefined) delete process.env.AGENT_OFFICE_ACCESS_CODE; else process.env.AGENT_OFFICE_ACCESS_CODE=priorCode;
  }
});

test('API consumes Responses output and returns an explicit AI mode', async () => {
  const key=process.env.OPENAI_API_KEY,code=process.env.AGENT_OFFICE_ACCESS_CODE;
  const originalFetch=globalThis.fetch;
  process.env.OPENAI_API_KEY='test-only'; process.env.AGENT_OFFICE_ACCESS_CODE='office-demo-code';
  globalThis.fetch=async (_url,options) => {
    const req=JSON.parse(options.body);
    assert.match(req.instructions, /không có web, email, GitHub/i);
    assert.equal(req.store,false);
    return Response.json({model:'gpt-5-mini',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Đề xuất hai bước có kiểm tra.'}]}]});
  };
  try {
    const r=await agentHandler.fetch(makeRequest({agentId:'nova',messages:[{role:'user',content:'Tạo đề xuất dự án'}]}));
    assert.equal(r.status,200);
    assert.deepEqual((await r.json()).mode,'ai');
  } finally {
    globalThis.fetch=originalFetch;
    if(key===undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY=key;
    if(code===undefined) delete process.env.AGENT_OFFICE_ACCESS_CODE; else process.env.AGENT_OFFICE_ACCESS_CODE=code;
  }
});
