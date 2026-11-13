import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(match,'Pixel RPG must expose a client-side module');
assert.match(html,/id="world"/,'Game world canvas must exist');
assert.match(html,/MISSION BOARD/,'Mission board must be inside the game map');
assert.match(html,/src\/crew-v3\.mjs/,'Character registry should feed the game');
assert.match(html,/src\/mission-v3\.mjs/,'Mission contracts should feed the game');
assert.doesNotMatch(html,/<aside[^>]+class=["']sidebar/,'Do not re-introduce a sidebar');
assert.doesNotMatch(html,/fetch\s*\(\s*["']\/api\/agent/,'V3 must not call a legacy API endpoint');
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:match[1],encoding:'utf8'});
if(syntax.status!==0){process.stderr.write(syntax.stderr||'Inline RPG module parse failed\n');process.exit(1)}
console.log('Pixel RPG inline ES module syntax and no-API invariants: OK');
