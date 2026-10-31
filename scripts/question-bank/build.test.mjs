import { it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const builder=fileURLToPath(new URL('./build.mjs',import.meta.url));
function rejectedBuildPreservesFiles(data, expectedError) {
 const dir=mkdtempSync(join(tmpdir(),'enggame-bank-preflight-'));
 try {
  mkdirSync(join(dir,'scripts/question-bank/sources'),{recursive:true});
  mkdirSync(join(dir,'src/game/questions/bank'),{recursive:true});
  writeFileSync(join(dir,'scripts/question-bank/sources/001-fixture.mjs'),`export const data=${JSON.stringify(data)};`);
  const files=[6,7,8].flatMap(r=>[`r${r}.json`,`vocab-r${r}.json`]);
  for(const file of files)writeFileSync(join(dir,'src/game/questions/bank',file),`original:${file}`);
  const result=spawnSync(process.execPath,[builder],{cwd:dir,encoding:'utf8'});
  expect(result.error).toBeUndefined();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain(expectedError);
  for(const file of files)expect(readFileSync(join(dir,'src/game/questions/bank',file),'utf8')).toBe(`original:${file}`);
 } finally {rmSync(dir,{recursive:true,force:true});}
}
it('rejects a spaced fill target before replacing any existing bank',()=>{
 rejectedBuildPreservesFiles({6:{reading:[[1,'A valid earlier region','right|wrong|other|last','fixture']]},7:{fills:[['BOTTLE NECK','n.','fixture','A fixture.','測試。']]}},'001-fixture.mjs: r7 fills: expected one uppercase word');
});
it('keeps every existing file intact when the last region has duplicate questions',()=>{
 const duplicate=[1,'A repeated final-region question','right|wrong|other|last','fixture'];
 rejectedBuildPreservesFiles({6:{reading:[[1,'A valid earlier region','right|wrong|other|last','fixture']]},8:{reading:[duplicate,duplicate]}},'r8: duplicate questions');
});
