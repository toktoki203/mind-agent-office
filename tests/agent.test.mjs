import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRequest,normalizePlan} from '../api/agent.js';
test('BA role receives analysis',()=>{assert.equal(validateRequest({step:'analysis',agentId:'ada',mission:'A problem'}).agentId,'ada');});
test('rejects wrong agent in stage',()=>{assert.throws(()=>validateRequest({step:'research',agentId:'nova',mission:'A problem'}));});
test('rejects oversized request',()=>{assert.throws(()=>validateRequest({step:'intake',agentId:'nova',mission:'a'.repeat(3001)}));});
test('filters duplicate and invalid assignments',()=>{const x=normalizePlan({summary:'test',assignments:[{agentId:'byte',task:'build'},{agentId:'byte',task:'duplicate'},{agentId:'ivy',task:'research'},{agentId:'kai',task:'SOP'}]});assert.deepEqual(x.assignments.map(y=>y.agentId),['byte','kai']);});
test('rejects empty assignment',()=>{assert.throws(()=>normalizePlan({assignments:[]}));});
