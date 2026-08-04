import type { WorkshopConfig } from "./workshop-spec";
import type { Lang } from "./types";

export type OfficialRemix = {
  id: string;
  emoji: string;
  name: Record<Lang, string>;
  skill: Record<Lang, string>;
  config: Record<Lang, WorkshopConfig>;
};

const CSS = "body{background:#fff7e7;color:#221a2b;font-family:ui-monospace,monospace}.game{height:100%;display:grid;place-items:center;align-content:center;gap:14px;padding:18px;text-align:center}.card{width:min(92vw,560px);background:#fff;border:4px solid #221a2b;box-shadow:7px 7px 0 #221a2b;padding:18px}h1{font-size:clamp(24px,7vw,42px);margin:0 0 8px}button{border:3px solid #221a2b;box-shadow:3px 3px 0 #221a2b;background:#ff5f57;color:#fff;padding:12px 16px;font:700 16px ui-monospace,monospace;margin:5px}button:active{transform:translate(3px,3px);box-shadow:none}.meter{height:22px;border:3px solid #221a2b;background:#eee;margin:12px 0}.meter i{display:block;height:100%;background:#12b7a6}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.cell{aspect-ratio:1;display:grid;place-items:center;border:2px solid #221a2b;background:#fff;font-size:28px}.note{font-size:14px;color:#5f5368}";
function make(intro: string, html: string, js: string): WorkshopConfig {
  return { intro, html, css: CSS, js, turnsUsed: 0, messages: [] };
}

const ROUTE_HTML_ZH = "<main class=\"game\"><section class=\"card\"><h1>机器人路线</h1><p id=\"status\">把机器人送到旗帜，别撞墙。</p><div class=\"grid\"><div class=\"cell\" id=\"bot\">🤖</div><div class=\"cell\">⬜</div><div class=\"cell\">🧱</div><div class=\"cell\">🏁</div></div><button data-step=\"1\">→ 前进</button><button data-step=\"2\">↗ 绕行</button><p class=\"note\">试着修改地图和正确指令。</p></section></main>";
const ROUTE_HTML_EN = "<main class=\"game\"><section class=\"card\"><h1>Robot Route</h1><p id=\"status\">Reach the flag without hitting a wall.</p><div class=\"grid\"><div class=\"cell\" id=\"bot\">🤖</div><div class=\"cell\">⬜</div><div class=\"cell\">🧱</div><div class=\"cell\">🏁</div></div><button data-step=\"1\">→ FORWARD</button><button data-step=\"2\">↗ DETOUR</button></section></main>";
const ROUTE_JS = "let done=false;document.querySelectorAll('button').forEach(function(button){button.addEventListener('click',function(){if(done)return;if(button.dataset.step==='2'){done=true;document.getElementById('bot').textContent='🏁';document.getElementById('status').textContent='Mission complete!';parent.postMessage({type:'dx3xb-workshop-complete'},'*')}else{document.getElementById('status').textContent='Wall hit. Check the constraint.'}})});";

const SORT_HTML_ZH = "<main class=\"game\"><section class=\"card\"><h1>数据分类擂台</h1><p>把样本分到正确标签</p><div id=\"sample\" style=\"font-size:70px\">🔺</div><button data-label=\"shape\">形状</button><button data-label=\"color\">颜色</button><p id=\"score\">得分 0/3</p></section></main>";
const SORT_HTML_EN = "<main class=\"game\"><section class=\"card\"><h1>Data Sorting Arena</h1><p>Send each sample to the right label</p><div id=\"sample\" style=\"font-size:70px\">🔺</div><button data-label=\"shape\">SHAPE</button><button data-label=\"color\">COLOR</button><p id=\"score\">Score 0/3</p></section></main>";
const SORT_JS = "const samples=[['🔺','shape'],['🔵','color'],['⬛','shape']];let i=0,score=0;document.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){if(b.dataset.label===samples[i][1])score++;i++;if(i>=samples.length){document.getElementById('sample').textContent='🏆';parent.postMessage({type:'dx3xb-workshop-complete'},'*')}else{document.getElementById('sample').textContent=samples[i][0]}document.getElementById('score').textContent='Score '+score+'/3'})});";

const FEED_HTML_ZH = "<main class=\"game\"><section class=\"card\"><h1>信息流平衡器</h1><p>选 3 个不同主题，让信息流更丰富。</p><div><button data-topic=\"science\">🔬 科学</button><button data-topic=\"art\">🎨 艺术</button><button data-topic=\"sport\">🏀 运动</button><button data-topic=\"game\">🎮 游戏</button></div><div class=\"meter\"><i id=\"bar\" style=\"width:0%\"></i></div><p id=\"status\">多样度 0%</p></section></main>";
const FEED_HTML_EN = "<main class=\"game\"><section class=\"card\"><h1>Feed Balancer</h1><p>Pick 3 different topics to widen the feed.</p><div><button data-topic=\"science\">🔬 SCIENCE</button><button data-topic=\"art\">🎨 ART</button><button data-topic=\"sport\">🏀 SPORTS</button><button data-topic=\"game\">🎮 GAMES</button></div><div class=\"meter\"><i id=\"bar\" style=\"width:0%\"></i></div><p id=\"status\">Diversity 0%</p></section></main>";
const FEED_JS = "const chosen=new Set();document.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){chosen.add(b.dataset.topic);const value=Math.min(100,chosen.size*34);document.getElementById('bar').style.width=value+'%';document.getElementById('status').textContent='Diversity '+value+'%';if(chosen.size>=3)parent.postMessage({type:'dx3xb-workshop-complete'},'*')})});";

const FAIR_HTML_ZH = "<main class=\"game\"><section class=\"card\"><h1>公平阈值实验</h1><p>选择阈值，观察两组通过率。</p><input id=\"range\" type=\"range\" min=\"1\" max=\"5\" value=\"3\" style=\"width:90%\"><div><b id=\"a\">A 组 60%</b> · <b id=\"b\">B 组 40%</b></div><p id=\"note\">差距 20%</p><button id=\"done\">提交并人工复核</button></section></main>";
const FAIR_HTML_EN = "<main class=\"game\"><section class=\"card\"><h1>Fair Threshold Lab</h1><p>Choose a threshold and watch both selection rates.</p><input id=\"range\" type=\"range\" min=\"1\" max=\"5\" value=\"3\" style=\"width:90%\"><div><b id=\"a\">GROUP A 60%</b> · <b id=\"b\">GROUP B 40%</b></div><p id=\"note\">Gap 20%</p><button id=\"done\">SUBMIT WITH HUMAN REVIEW</button></section></main>";
const FAIR_JS = "const r=document.getElementById('range');function draw(){const v=Number(r.value),a=Math.max(0,120-v*20),b=Math.max(0,100-v*20);document.getElementById('a').textContent='A '+a+'%';document.getElementById('b').textContent='B '+b+'%';document.getElementById('note').textContent='Gap '+Math.abs(a-b)+'%'}r.addEventListener('input',draw);document.getElementById('done').addEventListener('click',function(){parent.postMessage({type:'dx3xb-workshop-complete'},'*')});draw();";

export const OFFICIAL_REMIXES: OfficialRemix[] = [
  { id: "robot-route", emoji: "🤖", name: { zh: "机器人路线挑战", en: "Robot Route Challenge" }, skill: { zh: "改地图、障碍和指令预算", en: "Change the map, obstacles and command budget" }, config: { zh: make("改造机器人地图、终点与可用指令。", ROUTE_HTML_ZH, ROUTE_JS), en: make("Remix the robot map, goal and instruction budget.", ROUTE_HTML_EN, ROUTE_JS) } },
  { id: "data-sorter", emoji: "🧬", name: { zh: "数据分类擂台", en: "Data Sorting Arena" }, skill: { zh: "改标签规则、样本与得分", en: "Change labels, samples and scoring" }, config: { zh: make("改造样本标签和分类规则。", SORT_HTML_ZH, SORT_JS), en: make("Remix sample labels and classification rules.", SORT_HTML_EN, SORT_JS) } },
  { id: "feed-balancer", emoji: "🧭", name: { zh: "信息流平衡器", en: "Feed Balancer" }, skill: { zh: "改主题、权重与多样度目标", en: "Change topics, weights and diversity target" }, config: { zh: make("改造内容主题与信息流多样度目标。", FEED_HTML_ZH, FEED_JS), en: make("Remix feed topics and the diversity goal.", FEED_HTML_EN, FEED_JS) } },
  { id: "threshold-lab", emoji: "⚖️", name: { zh: "公平阈值实验", en: "Fair Threshold Lab" }, skill: { zh: "改群体数据、阈值与解释", en: "Change group data, thresholds and explanations" }, config: { zh: make("改造两组数据与公平阈值。", FAIR_HTML_ZH, FAIR_JS), en: make("Remix two groups and a fairness threshold.", FAIR_HTML_EN, FAIR_JS) } },
];

