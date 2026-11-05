"""Create a fully offline, one-file ChatGPT sandbox preview from the ES module project.
No dependencies; isolates each module to avoid duplicate top-level bindings.
"""
from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
order=['data','avatars','domain','requests','request-ui','app']
modules=[]
for name in order:
    source=(root/'src'/f'{name}.mjs').read_text(encoding='utf-8')
    names=re.findall(r'^export\s+(?:const|let|function|async function|class)\s+(\w+)',source,re.M)
    source=re.sub(r'^import\s+\{([^}]+)\}\s+from\s+\'\./([^\']+)\';?\s*$',lambda m:f'const {{{m.group(1)}}} = __modules["{m.group(2).removesuffix(".mjs")}"];',source,flags=re.M)
    if re.search(r'^import\b',source,re.M):raise ValueError(f'Unbundled import in {name}')
    source=re.sub(r'^export\s+(?=const|let|function|async function|class)', '',source,flags=re.M)
    if re.search(r'^export\s+',source,re.M):raise ValueError(f'Unbundled export in {name}')
    modules.append(f'// {name}.mjs\n__modules["{name}"] = (() => {{\n{source}\nreturn {{{", ".join(names)}}};\n}})();')
js='\n'.join(['const __modules = {};']+modules)
if '</script' in js.lower():raise ValueError('Unsafe closing script sequence')
idx=(root/'index.html').read_text(encoding='utf-8')
css=(root/'src/styles.css').read_text(encoding='utf-8')+'\n'+(root/'src/request-ui.css').read_text(encoding='utf-8')
idx=re.sub(r'<link rel="stylesheet" href="\./src/styles.css"\s*/>\s*<link rel="stylesheet" href="\./src/request-ui.css"\s*/>',f'<style>\n{css}\n</style>',idx)
idx=re.sub(r'<link rel="icon"[^>]+>', '',idx)
idx=idx.replace('<script type="module" src="./src/app.mjs"></script>', '')
idx=idx.replace('</body>', f'<script>\n{js}\n</script>\n</body>')
assert '<script>\nconst __modules' in idx
out=Path(__import__('os').environ.get('AGENT_OFFICE_STANDALONE_OUTPUT') or str(root/'dist'/'mind-agent-office-sandbox.html'))
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(idx,encoding='utf-8')
print('Created',out,'bytes',out.stat().st_size)
assert out.stat().st_size < 262144
