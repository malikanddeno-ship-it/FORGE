
const STORE_KEY = "forge_daily_v2";
const DB_NAME = "forge_daily_clips";
const DB_VERSION = 1;
const BONUS_XP = 250;

const VALORANT_POOL = [
  ["Two Piece","Get 2 eliminations in the same round.",90],
  ["First Contact","Get first blood in a round.",85],
  ["Clean Headshot","Land a headshot elimination.",75],
  ["Clutch It","Win a 1v1 or harder clutch.",150],
  ["Utility Assist","Use utility that directly helps a teammate get an elimination.",110],
  ["Spike Duty","Plant or defuse the spike.",70],
  ["Trade Up","Trade a teammate within a few seconds of them going down.",95],
  ["Hold The Site","Get 2 eliminations while defending the same site.",115],
  ["Entry Time","Get the opening elimination while entering a site.",110],
  ["Multi-Kill","Get 3 eliminations in one round.",140],
  ["Save The Round","Win a round where your team started at a player disadvantage.",150],
  ["Wallbang","Get an elimination through penetrable cover.",120],
  ["Ability Finish","Get an elimination using an agent ability.",115],
  ["Anti-Eco Punish","Get 2 eliminations in a round without dying.",90],
  ["Last One Standing","Be the final surviving teammate and win the round.",160],
  ["Team Player","Get an assist that clearly helps win the round.",80],
  ["Retake","Get an elimination during a successful retake.",120],
  ["Post-Plant","Get an elimination after your team plants the spike.",100],
  ["Sheriff Moment","Get a Sheriff elimination.",110],
  ["No Scope Needed","Get an Operator or Outlaw elimination.",100],
  ["One Tap","Get a clean single-bullet headshot elimination.",130],
  ["Double Utility","Use two abilities in the same successful fight.",95],
  ["Anchor","Stop a push with at least 2 eliminations.",125],
  ["Fast Round","Get an elimination within the first 20 seconds of the round.",100],
  ["Comeback Round","Help win a round after your team falls behind early.",100],
  ["Knife Out? Nope","Catch an enemy off guard and eliminate them before they can respond.",95],
  ["Perfect Support","Use utility to protect, heal, reveal for, smoke for, or otherwise save a teammate.",85],
  ["Ace Watch","Get 4 or more eliminations in one round.",210],
  ["Pistol Power","Get 2 eliminations in a pistol round.",115],
  ["Defuse Pressure","Get an elimination while your team is trying to defuse.",120]
];

const VRFS_POOL = [
  ["Top Bins","Score a goal into the upper part of the net.",110],
  ["Playmaker","Record an assist.",90],
  ["Big Save","Make a clear goal-saving stop.",100],
  ["Clean Tackle","Win the ball with a clean tackle.",80],
  ["Interception","Read a pass and intercept it.",75],
  ["One-Two","Complete a quick give-and-go with a teammate.",90],
  ["Counter Attack","Help create a shot or goal from a fast counter.",105],
  ["Outside The Box","Score from outside the box.",150],
  ["Near Post","Score at the near post.",110],
  ["Far Post","Score at the far post.",110],
  ["Through Ball","Play a through ball that creates a clear chance.",100],
  ["Last-Ditch Stop","Stop a dangerous chance as the final defender.",120],
  ["Quick Passing","Complete 3 fast passes in one attacking move.",90],
  ["First Touch","Control a difficult ball cleanly and keep possession.",75],
  ["Cross It","Deliver a cross that reaches a teammate in the box.",95],
  ["Keeper Distribution","Start an attack with a successful goalkeeper pass or throw.",85],
  ["Pressure Win","Win possession high up the field.",90],
  ["Goal Line","Make a save or clearance right near the goal line.",140],
  ["Assist + Goal","Get a goal and an assist in the same match.",180],
  ["Brace","Score 2 goals in one match.",170],
  ["Hat Trick","Score 3 goals in one match.",240],
  ["Wall Pass","Use the wall/boards in a successful pass or move.",95],
  ["Perfect Clearance","Clear a dangerous ball out of the box.",80],
  ["Switch The Play","Send the ball successfully from one side of the field to the other.",90],
  ["Set-Up Touch","Make the touch or pass directly before an assist.",85],
  ["Recovery","Lose the ball, then win it back yourself.",80],
  ["Long Pass","Complete a long pass to a teammate.",95],
  ["One-On-One","Beat an opponent in a 1v1 and keep possession.",100],
  ["Keeper Denial","Save a close-range shot.",125],
  ["Team Move","Be involved in a 4+ pass move that ends in a shot.",120]
];

const TITLES = [
  {name:"First Proof",desc:"Complete your first quest.",need:s=>s.completed>=1,icon:"▶"},
  {name:"Locked In",desc:"Complete 10 quests.",need:s=>s.completed>=10,icon:"✦"},
  {name:"Clip Machine",desc:"Complete 25 quests.",need:s=>s.completed>=25,icon:"◫"},
  {name:"Perfect Day",desc:"Complete all 5 quests in one day.",need:s=>s.perfect>=1,icon:"★"},
  {name:"On A Run",desc:"Reach a 3-day daily streak.",need:s=>s.longest>=3,icon:"↗"},
  {name:"Week Warrior",desc:"Reach a 7-day daily streak.",need:s=>s.longest>=7,icon:"VII"},
  {name:"VAL Hunter",desc:"Complete 20 VALORANT quests.",need:s=>s.val>=20,icon:"V"},
  {name:"Pitch Hunter",desc:"Complete 20 VRFS quests.",need:s=>s.vrfs>=20,icon:"⚽"}
];

let state = loadState();
let clipFilter = "all";
let activeQuestId = null;
let selectedFile = null;
let activeObjectUrls = [];

function defaultState(){
  return {
    profile:{name:"Player One",theme:"dark",mix:"balanced"},
    xp:0,
    boards:{},
    rerolls:{},
    bonusClaimed:{},
    createdAt:new Date().toISOString()
  };
}
function loadState(){
  try{
    const p=JSON.parse(localStorage.getItem(STORE_KEY)||"null");
    if(!p)return defaultState();
    return {...defaultState(),...p,profile:{...defaultState().profile,...(p.profile||{})}};
  }catch{return defaultState()}
}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll()}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function localDayKey(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function fmtDay(key){
  const [y,m,d]=key.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
}
function hash(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
  return h>>>0;
}
function rng(seed){
  let t=seed>>>0;
  return ()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296}
}
function shuffled(arr,rand){
  const out=[...arr];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  return out;
}
function questCounts(rand){
  const mix=state.profile.mix;
  if(mix==="valorant") return [3,2];
  if(mix==="vrfs") return [2,3];
  if(mix==="balanced") return rand()<.5?[3,2]:[2,3];
  let val=1+Math.floor(rand()*4);
  return [val,5-val];
}
function generateBoard(key,reroll=0){
  const rand=rng(hash(`${key}|${reroll}|${state.profile.mix}|FORGE`));
  const [vCount,rCount]=questCounts(rand);
  const vals=shuffled(VALORANT_POOL,rand).slice(0,vCount).map((q,i)=>questFrom(q,"VALORANT",`v${i}`));
  const vrfs=shuffled(VRFS_POOL,rand).slice(0,rCount).map((q,i)=>questFrom(q,"VRFS",`r${i}`));
  return shuffled([...vals,...vrfs],rand).map((q,i)=>({...q,id:`${key}-${reroll}-${i}-${hash(q.title+q.game)}`,slot:i+1,completed:false,clipId:null,completedAt:null}));
}
function questFrom(q,game,suffix){return {title:q[0],description:q[1],xp:q[2],game}}
function ensureToday(){
  const key=localDayKey();
  if(!state.boards[key]) state.boards[key]=generateBoard(key,state.rerolls[key]||0);
  return state.boards[key];
}
function levelInfo(xp=state.xp){
  let level=1,need=100,current=xp;
  while(current>=need){current-=need;level++;need=100+(level-1)*40}
  return {level,current,need,pct:Math.min(100,current/need*100)}
}
function allBoards(){return Object.entries(state.boards).sort((a,b)=>b[0].localeCompare(a[0]))}
function allCompleted(){
  return allBoards().flatMap(([date,qs])=>qs.filter(q=>q.completed).map(q=>({...q,date})));
}
function stats(){
  const c=allCompleted();
  const perfect=allBoards().filter(([k,qs])=>qs.length===5&&qs.every(q=>q.completed)).length;
  const completionDays=allBoards().filter(([k,qs])=>qs.some(q=>q.completed)).map(([k])=>k).sort();
  const streaks=calculateStreaks(completionDays);
  return {
    completed:c.length,
    val:c.filter(q=>q.game==="VALORANT").length,
    vrfs:c.filter(q=>q.game==="VRFS").length,
    perfect,
    streak:streaks.current,
    longest:streaks.longest
  };
}
function dateObj(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)}
function daysBetween(a,b){return Math.round((dateObj(b)-dateObj(a))/86400000)}
function calculateStreaks(days){
  if(!days.length)return {current:0,longest:0};
  let longest=1,run=1;
  for(let i=1;i<days.length;i++){if(daysBetween(days[i-1],days[i])===1){run++;longest=Math.max(longest,run)}else run=1}
  const today=localDayKey();
  const last=days[days.length-1];
  let current=0;
  if(last===today||daysBetween(last,today)===1){
    current=1;
    for(let i=days.length-1;i>0;i--){if(daysBetween(days[i-1],days[i])===1)current++;else break}
  }
  return {current,longest};
}
function toast(msg){
  const el=document.createElement("div");el.className="toast";el.textContent=msg;document.getElementById("toastWrap").appendChild(el);setTimeout(()=>el.remove(),2400)
}

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("clips"))db.createObjectStore("clips",{keyPath:"id"})};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function dbPut(record){
  const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("clips","readwrite");tx.objectStore("clips").put(record);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})
}
async function dbGet(id){
  const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction("clips").objectStore("clips").get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
}
async function dbAll(){
  const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction("clips").objectStore("clips").getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})
}
async function dbDelete(id){
  const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("clips","readwrite");tx.objectStore("clips").delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})
}
async function dbClear(){
  const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction("clips","readwrite");tx.objectStore("clips").clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})
}
function revokeUrls(){activeObjectUrls.forEach(u=>URL.revokeObjectURL(u));activeObjectUrls=[]}
function objectUrl(blob){const u=URL.createObjectURL(blob);activeObjectUrls.push(u);return u}

function switchView(v){
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  document.getElementById(v+"View").classList.add("active");
  document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
  const titles={today:["5 QUESTS. ONE DAY.","Today"],clips:["YOUR PROOF VAULT","Clips"],progress:["QUESTS BECOME PROGRESSION","Progress"],history:["PAST RUNS","History"],settings:["LOCAL CONTROL","Settings"]};
  document.getElementById("pageKicker").textContent=titles[v][0];document.getElementById("pageTitle").textContent=titles[v][1];
  if(v==="clips")renderClips();
  window.scrollTo({top:0,behavior:"smooth"})
}
function renderAll(){
  ensureToday();
  document.documentElement.classList.toggle("light",state.profile.theme==="light");
  renderHeader();renderToday();renderProgress();renderHistory();renderSettings();
}
function renderHeader(){
  const l=levelInfo();
  document.getElementById("sideLevel").textContent=l.level;
  document.getElementById("sideXp").textContent=`${l.current} / ${l.need} XP`;
  document.getElementById("sideBar").style.width=l.pct+"%";
  document.getElementById("dayLabel").textContent=localDayKey();
}
async function renderToday(){
  const key=localDayKey(),board=ensureToday(),done=board.filter(q=>q.completed).length,l=levelInfo(),s=stats();
  document.getElementById("heroDate").textContent=fmtDay(key);
  document.getElementById("doneCount").textContent=done;
  document.getElementById("homeLevel").textContent=l.level;
  document.getElementById("homeXp").textContent=state.xp.toLocaleString();
  document.getElementById("homeStreak").textContent=s.streak;
  let clipCount=0;try{clipCount=(await dbAll()).length}catch{}
  document.getElementById("homeClips").textContent=clipCount;
  document.getElementById("dailyRewardText").textContent=done===5?(state.bonusClaimed[key]?"Perfect board bonus claimed ✓":"Perfect board! Bonus ready."):`Complete all 5 for +${BONUS_XP} bonus XP`;

  document.getElementById("questBoard").innerHTML=board.map((q,i)=>{
    const cls=i===0?"quest-card featured "+(q.completed?"done":""):"quest-card "+(q.completed?"done":"");
    const tag=q.game==="VALORANT"?"val":"vrfs";
    const action=q.completed
      ? `<div class="done-stamp">✓ CLIPPED</div><button class="ghost" data-view-proof="${q.clipId}">View Proof</button>`
      : `<button class="primary" data-submit="${q.id}">▶ Submit Clip</button>`;
    if(i===0){
      return `<article class="${cls}">
        <div><span class="game-tag ${tag}">${q.game}</span><span class="quest-number">0${i+1}</span><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p></div>
        <div class="featured-action"><span class="xp">+${q.xp} XP</span><div>${action}</div></div>
      </article>`;
    }
    return `<article class="${cls}"><span class="game-tag ${tag}">${q.game}</span><span class="quest-number">0${i+1}</span><h3>${esc(q.title)}</h3><p>${esc(q.description)}</p>
      <div class="quest-bottom"><span class="xp">+${q.xp} XP</span><div style="display:flex;gap:6px;align-items:center">${action}</div></div></article>`;
  }).join("");

  if(done===5&&!state.bonusClaimed[key]){
    state.bonusClaimed[key]=true;state.xp+=BONUS_XP;localStorage.setItem(STORE_KEY,JSON.stringify(state));toast(`PERFECT DAY +${BONUS_XP} XP`);setTimeout(renderAll,100)
  }
}
function renderProgress(){
  const l=levelInfo(),s=stats();
  document.getElementById("progressLevel").textContent=l.level;document.getElementById("profileName").textContent=state.profile.name;
  document.getElementById("progressXpText").textContent=`${l.current} / ${l.need} XP`;document.getElementById("progressPct").textContent=Math.round(l.pct)+"%";document.getElementById("progressBar").style.width=l.pct+"%";
  document.getElementById("statQuests").textContent=s.completed;document.getElementById("statVal").textContent=s.val;document.getElementById("statVrfs").textContent=s.vrfs;document.getElementById("statPerfect").textContent=s.perfect;document.getElementById("statLongest").textContent=s.longest;
  document.getElementById("titleList").innerHTML=TITLES.map(t=>{const ok=t.need(s);return `<div class="title-row ${ok?"":"locked"}"><div class="title-icon">${t.icon}</div><div><strong>${esc(t.name)} ${ok?"✓":""}</strong><small>${esc(t.desc)}</small></div></div>`}).join("");
  const road=[
    [1,"Rookie","Start the run"],[3,"Clipper","New profile mark"],[5,"Challenger","Level badge"],[10,"Hunter","Purple frame"],[15,"Veteran","Gold mark"],[20,"Forged","Prestige title"]
  ];
  document.getElementById("levelRoad").innerHTML=road.map(r=>`<div class="level-node ${l.level>=r[0]?"unlocked":""} ${l.level===r[0]?"current":""}"><span>LEVEL ${r[0]}</span><strong>${r[1]}</strong><small>${r[2]}</small></div>`).join("");
}
function renderHistory(){
  const entries=allBoards();
  const wrap=document.getElementById("historyList");
  if(!entries.length){wrap.innerHTML=`<div class="panel muted">No daily boards yet.</div>`;return}
  wrap.innerHTML=entries.map(([date,qs])=>{
    const done=qs.filter(q=>q.completed).length;
    return `<article class="history-day"><div class="history-day-top"><div><h3>${esc(fmtDay(date))}</h3><small>${done}/5 completed ${done===5?"• PERFECT DAY":""}</small></div><strong>${qs.reduce((a,q)=>a+(q.completed?q.xp:0),0)} XP</strong></div>
      <div class="history-quests">${qs.map(q=>`<div class="history-q ${q.completed?"done":""}">${q.completed?"✓":"○"} ${esc(q.game)} — ${esc(q.title)}</div>`).join("")}</div></article>`;
  }).join("");
}
function renderSettings(){
  const n=document.getElementById("nameInput"),m=document.getElementById("mixSelect");
  if(document.activeElement!==n)n.value=state.profile.name;
  if(document.activeElement!==m)m.value=state.profile.mix;
}
async function renderClips(){
  revokeUrls();
  let clips=[];try{clips=await dbAll()}catch{}
  clips.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  if(clipFilter!=="all")clips=clips.filter(c=>c.game===clipFilter);
  document.querySelectorAll("[data-clip-filter]").forEach(b=>b.classList.toggle("active",b.dataset.clipFilter===clipFilter));
  const wrap=document.getElementById("clipGrid");
  if(!clips.length){wrap.innerHTML=`<div class="panel muted">No clips here yet. Complete a quest and its proof will show up here.</div>`;return}
  wrap.innerHTML=clips.map(c=>{
    const url=objectUrl(c.blob),isVideo=(c.type||"").startsWith("video");
    const media=isVideo?`<video src="${url}" muted preload="metadata"></video><div class="play-mark">▶</div>`:`<img src="${url}" alt="">`;
    return `<article class="clip-card"><div class="clip-preview" data-play="${c.id}">${media}</div><div class="clip-body"><span class="game-tag ${c.game==="VALORANT"?"val":"vrfs"}">${c.game}</span><h4>${esc(c.questTitle)}</h4><p>${new Date(c.createdAt).toLocaleString()}${c.note?` • ${esc(c.note)}`:""}</p><div class="clip-actions"><button class="primary" data-play="${c.id}">Play</button><button class="ghost" data-delete-clip="${c.id}">Delete</button></div></div></article>`;
  }).join("");
}
function updateCountdown(){
  const now=new Date(),next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  let ms=next-now;const h=Math.floor(ms/3600000);ms%=3600000;const m=Math.floor(ms/60000);const s=Math.floor((ms%60000)/1000);
  document.getElementById("countdown").textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function openSubmit(questId){
  const q=ensureToday().find(x=>x.id===questId);if(!q)return;
  activeQuestId=questId;selectedFile=null;
  document.getElementById("submitTitle").textContent=`${q.game} Quest`;
  document.getElementById("submitQuestText").textContent=`${q.title} — ${q.description}`;
  document.getElementById("clipInput").value="";document.getElementById("clipNote").value="";
  document.getElementById("dropTitle").textContent="Choose your clip";document.getElementById("dropSubtitle").textContent="Video or screenshot from this quest";document.getElementById("dropZone").classList.remove("has-file");document.getElementById("finishSubmit").disabled=true;
  document.getElementById("submitBackdrop").classList.remove("hidden");
}
function closeSubmit(){document.getElementById("submitBackdrop").classList.add("hidden");activeQuestId=null;selectedFile=null}
async function finishSubmit(){
  const q=ensureToday().find(x=>x.id===activeQuestId);if(!q||!selectedFile)return;
  const clipId=crypto.randomUUID();
  const record={id:clipId,questId:q.id,questTitle:q.title,game:q.game,date:localDayKey(),createdAt:new Date().toISOString(),name:selectedFile.name,type:selectedFile.type||"application/octet-stream",size:selectedFile.size,note:document.getElementById("clipNote").value.trim(),blob:selectedFile};
  try{await dbPut(record)}catch(err){alert("Your browser could not store that clip. Try a shorter/smaller clip or free some browser storage.");return}
  q.completed=true;q.clipId=clipId;q.completedAt=new Date().toISOString();state.xp+=q.xp;
  localStorage.setItem(STORE_KEY,JSON.stringify(state));closeSubmit();toast(`QUEST COMPLETE +${q.xp} XP`);renderAll();
}
async function playClip(id){
  const c=await dbGet(id);if(!c){toast("That clip is no longer stored on this device.");return}
  revokeUrls();const url=objectUrl(c.blob),isVideo=(c.type||"").startsWith("video");
  document.getElementById("playerTitle").textContent=c.questTitle;
  document.getElementById("playerBody").innerHTML=`${isVideo?`<video src="${url}" controls autoplay playsinline></video>`:`<img src="${url}">`}<div class="player-meta">${esc(c.game)} • ${new Date(c.createdAt).toLocaleString()}${c.note?` • ${esc(c.note)}`:""}</div>`;
  document.getElementById("playerBackdrop").classList.remove("hidden");
}
function closePlayer(){document.getElementById("playerBackdrop").classList.add("hidden");document.getElementById("playerBody").innerHTML="";revokeUrls()}
async function deleteClip(id){
  if(!confirm("Delete this clip? The quest will stay completed."))return;
  await dbDelete(id);for(const [date,qs] of Object.entries(state.boards)){const q=qs.find(x=>x.clipId===id);if(q)q.clipId=null}
  localStorage.setItem(STORE_KEY,JSON.stringify(state));renderClips();toast("Clip deleted");
}

document.getElementById("nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)switchView(b.dataset.view)});
document.getElementById("themeBtn").onclick=()=>{state.profile.theme=state.profile.theme==="dark"?"light":"dark";save()};
document.getElementById("rerollBtn").onclick=()=>{
  const key=localDayKey(),board=ensureToday();
  if(board.some(q=>q.completed)){toast("You can't reroll after completing a quest.");return}
  if(!confirm("Reroll all 5 quests?"))return;
  state.rerolls[key]=(state.rerolls[key]||0)+1;state.boards[key]=generateBoard(key,state.rerolls[key]);save();toast("New board generated");
};
document.getElementById("questBoard").addEventListener("click",e=>{
  const s=e.target.closest("[data-submit]");if(s)openSubmit(s.dataset.submit);
  const p=e.target.closest("[data-view-proof]");if(p&&p.dataset.viewProof!=="null")playClip(p.dataset.viewProof);
});
document.getElementById("clipInput").onchange=e=>{
  selectedFile=e.target.files?.[0]||null;
  const z=document.getElementById("dropZone");
  if(selectedFile){z.classList.add("has-file");document.getElementById("dropTitle").textContent=selectedFile.name;document.getElementById("dropSubtitle").textContent=`${(selectedFile.size/1024/1024).toFixed(1)} MB • ready`;document.getElementById("finishSubmit").disabled=false}
};
document.getElementById("finishSubmit").onclick=finishSubmit;
document.getElementById("cancelSubmit").onclick=closeSubmit;document.getElementById("closeSubmit").onclick=closeSubmit;document.getElementById("submitBackdrop").onclick=e=>{if(e.target.id==="submitBackdrop")closeSubmit()};
document.getElementById("clipsView").addEventListener("click",e=>{
  const f=e.target.closest("[data-clip-filter]");if(f){clipFilter=f.dataset.clipFilter;renderClips()}
  const p=e.target.closest("[data-play]");if(p)playClip(p.dataset.play);
  const d=e.target.closest("[data-delete-clip]");if(d)deleteClip(d.dataset.deleteClip);
});
document.getElementById("closePlayer").onclick=closePlayer;document.getElementById("playerBackdrop").onclick=e=>{if(e.target.id==="playerBackdrop")closePlayer()};
document.getElementById("saveNameBtn").onclick=()=>{state.profile.name=document.getElementById("nameInput").value.trim()||"Player One";save();toast("Name saved")};
document.getElementById("saveMixBtn").onclick=()=>{state.profile.mix=document.getElementById("mixSelect").value;save();toast("Quest mix saved. It affects new/rerolled boards.")};
document.getElementById("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),data:state},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`forge-daily-backup-${localDayKey()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exported");
};
document.getElementById("importInput").onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{const p=JSON.parse(await f.text());if(!confirm("Replace FORGE progression with this backup?"))return;const incoming=p.data||p;state={...defaultState(),...incoming,profile:{...defaultState().profile,...(incoming.profile||{})}};localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll();toast("Backup restored")}catch{alert("Could not read that backup.")}finally{e.target.value=""}
};
document.getElementById("resetBtn").onclick=async()=>{
  if(!confirm("Delete all FORGE progression AND all locally stored clips?"))return;
  if(!confirm("Final check: reset everything?"))return;
  state=defaultState();localStorage.setItem(STORE_KEY,JSON.stringify(state));try{await dbClear()}catch{}renderAll();toast("FORGE reset");
};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeSubmit();closePlayer()}});

ensureToday();renderAll();updateCountdown();setInterval(updateCountdown,1000);
setInterval(()=>{const before=Object.keys(state.boards).includes(localDayKey());ensureToday();if(!before)renderAll()},30000);

if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
