import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/agent.js';

async function call(method='GET',body=null,token='test-code'){
 const headers={authorization:'Bearer '+token};
 const req={method,headers,body};
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}};
 await handler(req,res);
 return res;
}
test('GET readiness and unsupported method',async()=>{
 const a=await call('GET');assert.equal(a.statusCode,200);assert.equal(typeof a.body.ready,'boolean');
 const b=await call('DELETE');assert.equal(b.statusCode,405);
});
test('POST requires configured credentials',async()=>{
 const key=process.env.OPENAI_API_KEY,code=process.env.AGENT_OFFICE_ACCESS_KEY;
 delete process.env.OPENAI_API_KEY;delete process.env.AGENT_OFFICE_ACCESS_KEY;
 try{const r=await call('POST',{step:'intake',agentId:'nova',mission:'test'});assert.equal(r.statusCode,503);}
 finally{if(key!==undefined)process.env.OPENAI_API_KEY=key; if(code!==undefined)process.env.AGENT_OFFICE_ACCESS_KEY=code;}
});
test('auth and agent validation enforced',async()=>{
 const key=process.env.OPENAI_API_KEY,code=process.env.AGENT_OFFICE_ACCESS_KEY;
 process.env.OPENAI_API_KEY='test-api-key';process.env.AGENT_OFFICE_ACCESS_KEY='test-code';
 try{
  assert.equal((await call('POST',{step:'intake',agentId:'nova',mission:'test'},'wrong')).statusCode,401);
  assert.equal((await call('POST',{step:'research',agentId:'nova',mission:'test'})).statusCode,400);
 }finally{if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;if(code===undefined)delete process.env.AGENT_OFFICE_ACCESS_KEY;else process.env.AGENT_OFFICE_ACCESS_KEY=code;}
});
test('Responses output is returned and no external writes',async()=>{
 const key=process.env.OPENAI_API_KEY,code=process.env.AGENT_OFFICE_ACCESS_KEY,fetchOld=globalThis.fetch;
 process.env.OPENAI_API_KEY='test-api-key';process.env.AGENT_OFFICE_ACCESS_KEY='test-code';
 globalThis.fetch=async(_,opts)=>{const req=JSON.parse(opts.body);assert.equal(req.store,false);assert.equal(req.tools,undefined);return Response.json({output:[{type:'message',content:[{type:'output_text',text:'Mission ready'}]}]});};
 try{const r=await call('POST',{step:'intake',agentId:'nova',mission:'Help define this mission'});assert.equal(r.statusCode,200);assert.equal(r.body.output,'Mission ready');}
 finally{globalThis.fetch=fetchOld;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;if(code===undefined)delete process.env.AGENT_OFFICE_ACCESS_KEY;else process.env.AGENT_OFFICE_ACCESS_KEY=code;}
});
