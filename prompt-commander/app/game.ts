export type Lang = "zh" | "en";
export type PromptChip = { id: string; text: Record<Lang,string>; kind: "goal" | "context" | "constraint" | "order" | "check" | "noise" };
export type Mission = { id: string; title: Record<Lang,string>; vague: Record<Lang,string>; scene: string[]; required: string[]; budget: number; chips: PromptChip[]; lesson: Record<Lang,string> };
const MISSIONS: Mission[] = [
 {id:"delivery",title:{zh:"档案快递",en:"FILE DELIVERY"},vague:{zh:"把东西送过去。",en:"Take the thing over there."},scene:["🤖","📦","⬜","🔥","⬜","📍"],required:["object","destination","avoid"],budget:4,lesson:{zh:"目标、对象和限制条件越明确，执行越可检验。",en:"A clear goal, object and constraint make execution testable."},chips:[
  {id:"object",kind:"context",text:{zh:"搬运蓝色档案箱",en:"carry the blue file box"}},{id:"destination",kind:"goal",text:{zh:"送到右侧蓝旗",en:"deliver it to the right flag"}},{id:"avoid",kind:"constraint",text:{zh:"不能经过熔岩格",en:"never cross a lava tile"}},{id:"fast",kind:"noise",text:{zh:"越快越好",en:"as fast as possible"}},{id:"polite",kind:"noise",text:{zh:"请开心地完成",en:"do it cheerfully"}}
 ]},
 {id:"sort",title:{zh:"样本归档",en:"SAMPLE SORT"},vague:{zh:"整理这些样本。",en:"Organize these samples."},scene:["🤖","🔺","🔵","🟨","🗃️","✅"],required:["groups","order","check"],budget:4,lesson:{zh:"复杂任务要拆步骤，还要说明完成标准。",en:"Break complex work into steps and define what done means."},chips:[
  {id:"groups",kind:"goal",text:{zh:"按形状分成三组",en:"make three groups by shape"}},{id:"order",kind:"order",text:{zh:"先分类，再逐组放入柜子",en:"classify first, then store each group"}},{id:"check",kind:"check",text:{zh:"最后报告每组数量",en:"report each group count at the end"}},{id:"pretty",kind:"noise",text:{zh:"摆得好看一点",en:"make it look nice"}},{id:"now",kind:"noise",text:{zh:"立刻开始",en:"start right now"}}
 ]},
 {id:"map",title:{zh:"像素地图",en:"PIXEL MAP"},vague:{zh:"画一张寻宝地图。",en:"Draw a treasure map."},scene:["🤖","🗺️","🌲","🌊","❌","🏴"],required:["size","route","format"],budget:4,lesson:{zh:"输出格式、尺寸和必要元素能减少来回修改。",en:"Format, size and required elements reduce rework."},chips:[
  {id:"size",kind:"constraint",text:{zh:"使用 6×6 像素网格",en:"use a 6×6 pixel grid"}},{id:"route",kind:"context",text:{zh:"标出树林、河流和安全路线",en:"mark forest, river and safe route"}},{id:"format",kind:"goal",text:{zh:"只输出网格和三项图例",en:"output only the grid and three legends"}},{id:"epic",kind:"noise",text:{zh:"做得史诗一点",en:"make it epic"}},{id:"detail",kind:"noise",text:{zh:"加很多细节",en:"add lots of detail"}}
 ]},
 {id:"verify",title:{zh:"事实播报",en:"FACT BULLETIN"},vague:{zh:"告诉大家这个消息。",en:"Tell everyone this news."},scene:["🤖","📰","❓","📚","📅","📣"],required:["audience","source","uncertain","length"],budget:4,lesson:{zh:"对事实任务，要主动要求来源、日期和不确定性说明。",en:"For factual tasks, request sources, dates and uncertainty."},chips:[
  {id:"audience",kind:"context",text:{zh:"写给初一学生看",en:"write for grade-seven students"}},{id:"source",kind:"check",text:{zh:"列出来源和发布日期",en:"list sources and publication dates"}},{id:"uncertain",kind:"constraint",text:{zh:"不确定就明确说不知道",en:"say when the answer is uncertain"}},{id:"length",kind:"goal",text:{zh:"用 80 字以内三点说明",en:"explain in three points under 80 words"}},{id:"confident",kind:"noise",text:{zh:"语气一定要自信",en:"always sound confident"}}
 ]}
];
function hash(input:string){let h=1779033703^input.length;for(let i=0;i<input.length;i++){h=Math.imul(h^input.charCodeAt(i),3432918353);h=h<<13|h>>>19}return h>>>0}
export function missionsForSeed(seed:string){const rows=[...MISSIONS];let n=hash(seed);for(let i=rows.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[rows[i],rows[j]]=[rows[j],rows[i]]}return rows}
export function evaluatePrompt(mission:Mission,selected:string[]){const matched=mission.required.filter(id=>selected.includes(id));const missing=mission.required.filter(id=>!selected.includes(id));const noise=selected.filter(id=>mission.chips.find(c=>c.id===id)?.kind==="noise").length;const pct=Math.max(0,Math.round((matched.length/mission.required.length)*100-noise*10));return{success:missing.length===0,matched,missing,pct,noise}}
export function finalMastery(results:{pct:number}[]){return Math.round(results.reduce((sum,row)=>sum+row.pct,0)/Math.max(1,results.length))}
export function resultKey(value:number){return value>=90?"architect":value>=68?"commander":"apprentice"}

