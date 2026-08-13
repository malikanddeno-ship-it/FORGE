
const KEY = "forge_solo_v1";
const VERSION = 1;

const DEFAULT = {
  profile: { name: "Player One", tagline: "One player. Every game. One absurdly overbuilt career.", theme: "dark" },
  xp: 0,
  skillPointsSpent: 0,
  season: { name: "Season Zero", subtitle: "Your first personal season.", xp: 0 },
  games: [],
  quests: [],
  sessions: [],
  clips: [],
  records: [],
  vault: [],
  timeline: [],
  skills: {},
  nowPlayingId: null,
  createdAt: new Date().toISOString()
};

const SKILL_BRANCHES = [
  { name:"Consistency", kicker:"DISCIPLINE", nodes:[
    {id:"streaker",name:"Streak Engine",desc:"Build a habit of logging sessions and quests.",max:5},
    {id:"closer",name:"Closer",desc:"Finish what you start. More completed quests, less abandoned stuff.",max:5},
    {id:"grinder",name:"Long Game",desc:"Track long-term mastery across your biggest games.",max:5}
  ]},
  { name:"Performance", kicker:"COMPETE", nodes:[
    {id:"aim",name:"Precision",desc:"For shooters, mechanics, reaction, execution, and clean reps.",max:5},
    {id:"brain",name:"Game Sense",desc:"Decision-making, strategy, awareness, and adaptation.",max:5},
    {id:"clutch",name:"Pressure",desc:"Track the moments where you actually show up.",max:5}
  ]},
  { name:"Collector", kicker:"ARCHIVE", nodes:[
    {id:"clipper",name:"Clip Hunter",desc:"Build a library of your best, funniest, or weirdest moments.",max:5},
    {id:"record",name:"Record Chaser",desc:"Turn random good runs into actual personal records.",max:5},
    {id:"vault",name:"Archivist",desc:"Save builds, notes, loadouts, links, and game ideas.",max:5}
  ]}
];

const ACHIEVEMENTS = [
  {id:"first_game", icon:"▦", name:"First Entry", desc:"Add your first game.", test:s=>s.games.length>=1},
  {id:"five_games", icon:"◫", name:"Library Builder", desc:"Add 5 games.", test:s=>s.games.length>=5},
  {id:"first_session", icon:"◷", name:"Logged In", desc:"Log your first gaming session.", test:s=>s.sessions.length>=1},
  {id:"ten_sessions", icon:"⌁", name:"Regular", desc:"Log 10 sessions.", test:s=>s.sessions.length>=10},
  {id:"first_quest", icon:"✦", name:"Quest Accepted", desc:"Create your first quest.", test:s=>s.quests.length>=1},
  {id:"quest_done", icon:"✓", name:"Mission Complete", desc:"Complete a quest.", test:s=>s.quests.some(q=>q.completed)},
  {id:"ten_quests", icon:"✧", name:"Task Slayer", desc:"Complete 10 quests.", test:s=>s.quests.filter(q=>q.completed).length>=10},
  {id:"first_clip", icon:"▶", name:"Roll It Back", desc:"Add your first clip.", test:s=>s.clips.length>=1},
  {id:"first_record", icon:"◆", name:"Personal Best", desc:"Add your first record.", test:s=>s.records.length>=1},
  {id:"level5", icon:"V", name:"Level Five", desc:"Reach account level 5.", test:s=>levelFromXp(s.xp).level>=5},
  {id:"level10", icon:"X", name:"Double Digits", desc:"Reach account level 10.", test:s=>levelFromXp(s.xp).level>=10},
  {id:"vault10", icon:"▣", name:"Hoarder", desc:"Save 10 items in the Vault.", test:s=>s.vault.length>=10}
];

let state = load();
let currentView = "home";
let questTab = "active";
let vaultTab = "all";

function clone(v){return JSON.parse(JSON.stringify(v))}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return clone(DEFAULT);
    const p = JSON.parse(raw);
    return {...clone(DEFAULT),...p,profile:{...DEFAULT.profile,...(p.profile||{})},season:{...DEFAULT.season,...(p.season||{})}};
  }catch{return clone(DEFAULT)}
}
function persist(render=true){localStorage.setItem(KEY,JSON.stringify(state));if(render) renderAll()}
function now(){return new Date().toISOString()}
function dayKey(d=new Date()){return d.toISOString().slice(0,10)}
function id(){return crypto.randomUUID()}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function initials(name=""){return name.split(/\s+/).filter(Boolean).slice(0,3).map(x=>x[0]).join("").toUpperCase()||"?"}
function formatMinutes(m=0){m=Number(m)||0; if(m<60)return `${m}m`; const h=Math.floor(m/60),r=m%60;return r?`${h}h ${r}m`:`${h}h`}
function levelFromXp(xp){
  let level=1, need=100, spent=0;
  while(xp>=need){xp-=need;spent+=need;level++;need=100+Math.floor((level-1)*35);}
  return {level,current:xp,need,totalForLevel:spent};
}
function seasonLevel(xp){const per=250; return {level:Math.floor(xp/per)+1,current:xp%per,need:per};}
function careerScore(){
  return Math.round(
    state.xp +
    state.sessions.reduce((a,s)=>a+(Number(s.minutes)||0)*.8,0) +
    state.records.length*70 +
    state.clips.length*25 +
    state.games.length*45 +
    state.quests.filter(q=>q.completed).length*55
  );
}
function careerTier(score){
  if(score>=12000)return "Mythic";
  if(score>=7000)return "Elite";
  if(score>=4000)return "Veteran";
  if(score>=2000)return "Contender";
  if(score>=800)return "Rising";
  return "Rookie";
}
function skillPointsEarned(){return Math.max(0,levelFromXp(state.xp).level-1)}
function skillPointsAvailable(){
  const spent=Object.values(state.skills||{}).reduce((a,n)=>a+(Number(n)||0),0);
  return Math.max(0,skillPointsEarned()-spent);
}
function timeline(text,type="event"){
  state.timeline.unshift({id:id(),text,type,at:now()});
  state.timeline=state.timeline.slice(0,300);
}
function toast(msg){
  const e=document.createElement("div");e.className="toast";e.textContent=msg;
  document.getElementById("toastWrap").appendChild(e);setTimeout(()=>e.remove(),2300);
}
function addXp(amount,source="progress"){
  amount=Math.max(0,Number(amount)||0);
  if(!amount)return;
  const before=levelFromXp(state.xp).level;
  state.xp+=amount;state.season.xp+=amount;
  const after=levelFromXp(state.xp).level;
  timeline(`+${amount} XP — ${source}`,"xp");
  if(after>before){timeline(`Account level increased to ${after}`,"level");toast(`LEVEL UP → ${after}`);}
}

function switchView(v){
  currentView=v;
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  document.getElementById(v+"View")?.classList.add("active");
  document.querySelectorAll(".nav-btn[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
  const map={
    home:["PERSONAL GAMING UNIVERSE","Command Deck"],games:["YOUR ENTIRE LIBRARY","Games"],
    quests:["PROGRESSION ENGINE","Quest Board"],career:["PRIVATE PLAYER PROFILE","Career"],
    skills:["ACCOUNT PROGRESSION","Skill Tree"],clips:["MOMENT ARCHIVE","Clips"],
    records:["PERSONAL BESTS","Record Book"],vault:["COLLECTIONS","The Vault"],
    seasons:["PRIVATE BATTLE PASS","Seasons"],timeline:["CAREER HISTORY","Timeline"],
    settings:["LOCAL CONTROL","Settings"]
  };
  document.getElementById("pageKicker").textContent=map[v]?.[0]||"FORGE";
  document.getElementById("pageTitle").textContent=map[v]?.[1]||"FORGE";
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderAll(){
  document.documentElement.classList.toggle("light",state.profile.theme==="light");
  renderLevel();
  renderHome();
  renderGames();
  renderQuests();
  renderCareer();
  renderSkills();
  renderClips();
  renderRecords();
  renderVault();
  renderSeason();
  renderTimeline();
  renderSettings();
}

function renderLevel(){
  const l=levelFromXp(state.xp),pct=(l.current/l.need)*100;
  document.getElementById("miniLevel").textContent=l.level;
  document.getElementById("miniXpText").textContent=`${l.current} / ${l.need}`;
  document.getElementById("miniXpBar").style.width=pct+"%";
}

function renderHome(){
  const l=levelFromXp(state.xp),score=careerScore(),tier=careerTier(score);
  document.getElementById("heroName").textContent=state.profile.name;
  document.getElementById("heroTagline").textContent=state.profile.tagline;
  document.getElementById("heroLevel").textContent=l.level;
  document.getElementById("heroXp").textContent=state.xp.toLocaleString();
  document.getElementById("heroGames").textContent=state.games.length;
  document.getElementById("heroQuests").textContent=state.quests.filter(q=>q.completed).length;
  document.getElementById("heroTier").textContent=tier;
  document.getElementById("heroTierSub").textContent=`${score.toLocaleString()} career score`;
  document.getElementById("homeSessions").textContent=state.sessions.length;
  const mins=state.sessions.reduce((a,s)=>a+(Number(s.minutes)||0),0);
  document.getElementById("homePlaytime").textContent=mins>=60?`${Math.floor(mins/60)}h`:mins+"m";
  document.getElementById("homeAchievements").textContent=ACHIEVEMENTS.filter(a=>a.test(state)).length;
  document.getElementById("homeRecords").textContent=state.records.length;

  const active=state.quests.filter(q=>!q.completed).slice(0,5);
  const qwrap=document.getElementById("homeQuestList");
  if(!active.length){qwrap.className="stack empty";qwrap.textContent="No active quests. Create one and give yourself something to chase."}
  else{
    qwrap.className="stack";
    qwrap.innerHTML=active.map(q=>`<div class="quest-mini">
      <span class="qdot"></span><div><div class="qtitle">${esc(q.title)}</div><div class="qmeta">${esc(q.type)} • ${q.progress||0}/${q.target||1}</div></div><span class="xp-pill">+${q.xp} XP</span>
    </div>`).join("");
  }

  const g=state.games.find(g=>g.id===state.nowPlayingId)||state.games.find(g=>g.status==="playing")||state.games[0];
  const np=document.getElementById("nowPlaying");
  if(!g){np.className="now-playing empty";np.textContent="No game selected."}
  else{
    const sessions=state.sessions.filter(s=>s.gameId===g.id);
    const mins=sessions.reduce((a,s)=>a+(Number(s.minutes)||0),0);
    np.className="now-playing";
    np.innerHTML=`<div class="now-playing-card"><div class="kicker">${esc(g.status.toUpperCase())}</div><div class="title">${esc(g.name)}</div>
      <div class="meta">${sessions.length} sessions • ${formatMinutes(mins)} logged • mastery ${gameMastery(g.id).level}</div>
      <div class="now-playing-actions"><button class="primary" data-log-game="${g.id}">Log Session</button><button class="ghost" data-edit-game="${g.id}">Edit</button></div></div>`;
  }

  const sl=seasonLevel(state.season.xp);
  document.getElementById("seasonLevelMini").textContent=sl.level;
  document.getElementById("seasonNameMini").textContent=state.season.name;
  document.getElementById("seasonXpMini").textContent=`${sl.current} / ${sl.need} XP`;
  document.getElementById("seasonBarMini").style.width=(sl.current/sl.need*100)+"%";

  const tl=document.getElementById("homeTimeline");
  if(!state.timeline.length){tl.className="timeline-list empty";tl.textContent="Nothing has happened yet."}
  else{
    tl.className="timeline-list";
    tl.innerHTML=state.timeline.slice(0,6).map(e=>`<div class="timeline-item"><span>${esc(e.text)}</span><time>${new Date(e.at).toLocaleDateString([], {month:"short",day:"numeric"})}</time></div>`).join("");
  }
  renderHeatmap();
}
function renderHeatmap(){
  const counts={};state.sessions.forEach(s=>{const d=(s.at||"").slice(0,10);counts[d]=(counts[d]||0)+1});
  const days=[];let d=new Date();d.setDate(d.getDate()-34);
  for(let i=0;i<35;i++){const k=dayKey(d);days.push({k,c:counts[k]||0});d.setDate(d.getDate()+1)}
  document.getElementById("heatmap").innerHTML=days.map(x=>`<div title="${x.k}: ${x.c} session(s)" class="heat-cell ${x.c>=4?"l4":x.c===3?"l3":x.c===2?"l2":x.c===1?"l1":""}"></div>`).join("");
}

function gameMastery(gameId){
  const s=state.sessions.filter(x=>x.gameId===gameId);
  const minutes=s.reduce((a,x)=>a+(Number(x.minutes)||0),0);
  const records=state.records.filter(x=>x.gameId===gameId).length;
  const clips=state.clips.filter(x=>x.gameId===gameId).length;
  const score=minutes+records*180+clips*60;
  const level=Math.max(1,Math.floor(score/300)+1);
  return {level,score,minutes,sessions:s.length};
}
function renderGames(){
  const q=document.getElementById("gameSearch").value.trim().toLowerCase();
  const f=document.getElementById("gameFilter").value;
  const games=state.games.filter(g=>(!q||`${g.name} ${g.genre||""} ${g.platform||""}`.toLowerCase().includes(q))&&(f==="all"||g.status===f));
  const wrap=document.getElementById("gameGrid");
  if(!games.length){wrap.innerHTML=`<div class="panel empty">No games here yet. Add the games you actually play.</div>`;return}
  wrap.innerHTML=games.map(g=>{
    const m=gameMastery(g.id);
    return `<article class="game-card">
      <div class="game-cover"><div class="game-initials">${esc(initials(g.name))}</div></div>
      <div class="game-body"><div class="game-top"><div class="game-name">${esc(g.name)}</div><span class="status-badge">${esc(g.status)}</span></div>
      <div class="muted" style="font-size:10px;margin-top:4px">${esc(g.platform||"Unknown platform")} ${g.genre?`• ${esc(g.genre)}`:""}</div>
      <div class="game-meta"><div><span>MASTERY</span><strong>${m.level}</strong></div><div><span>SESSIONS</span><strong>${m.sessions}</strong></div><div><span>TIME</span><strong>${formatMinutes(m.minutes)}</strong></div></div>
      <div class="game-actions"><button class="primary" data-log-game="${g.id}">Log Session</button><button class="ghost" data-set-current="${g.id}">${state.nowPlayingId===g.id?"Current":"Set Current"}</button><button class="ghost" data-edit-game="${g.id}">✎</button></div>
      </div></article>`;
  }).join("");
}

function renderQuests(){
  document.querySelectorAll("#questTabs .tab").forEach(b=>b.classList.toggle("active",b.dataset.qtab===questTab));
  let qs=state.quests;
  if(questTab==="active")qs=qs.filter(q=>!q.completed&&!["daily","weekly"].includes(q.type));
  if(questTab==="daily")qs=qs.filter(q=>!q.completed&&q.type==="daily");
  if(questTab==="weekly")qs=qs.filter(q=>!q.completed&&q.type==="weekly");
  if(questTab==="completed")qs=qs.filter(q=>q.completed);
  const wrap=document.getElementById("questGrid");
  if(!qs.length){wrap.innerHTML=`<div class="panel empty">No quests in this section.</div>`;return}
  wrap.innerHTML=qs.map(q=>{
    const pct=Math.min(100,((q.progress||0)/(q.target||1))*100);
    return `<article class="quest-card ${q.completed?"completed":""}">
      <div class="quest-card-top"><div><div class="kicker">${esc(q.type.toUpperCase())}</div><h4>${esc(q.title)}</h4></div><span class="xp-pill">+${q.xp} XP</span></div>
      <p>${esc(q.description||"No description.")}</p>
      <div class="quest-progress"><div class="quest-progress-top"><span>${q.progress||0} / ${q.target||1}</span><span>${Math.round(pct)}%</span></div><div class="xp-bar"><i style="width:${pct}%"></i></div></div>
      <div class="quest-actions">${q.completed?`<button class="ghost" disabled>Completed ✓</button>`:`<button class="primary" data-progress-quest="${q.id}">+ Progress</button><button class="ghost" data-complete-quest="${q.id}">Complete</button>`}<button class="ghost" data-delete-quest="${q.id}">×</button></div>
    </article>`;
  }).join("");
}

function renderCareer(){
  const l=levelFromXp(state.xp),score=careerScore();
  document.getElementById("careerName").textContent=state.profile.name;
  document.getElementById("careerScore").textContent=score.toLocaleString();
  document.getElementById("careerLevel").textContent=l.level;
  document.getElementById("careerLevelText").textContent=`${l.current} / ${l.need} XP`;
  document.getElementById("careerLevelBar").style.width=(l.current/l.need*100)+"%";
  const totals=state.games.map(g=>({g,m:gameMastery(g.id)})).sort((a,b)=>b.m.minutes-a.m.minutes);
  const fav=totals[0];
  document.getElementById("careerFavorite").textContent=fav?fav.g.name:"None yet";
  document.getElementById("careerFavoriteSub").textContent=fav?`${formatMinutes(fav.m.minutes)} logged`:"Log sessions to determine";
  const longest=[...state.sessions].sort((a,b)=>(b.minutes||0)-(a.minutes||0))[0];
  document.getElementById("careerLongest").textContent=longest?formatMinutes(longest.minutes):"0m";
  document.getElementById("careerLongestSub").textContent=longest?(state.games.find(g=>g.id===longest.gameId)?.name||"Unknown game"):"No sessions logged";

  const ml=document.getElementById("masteryList");
  if(!totals.length){ml.className="mastery-list empty";ml.textContent="Add games to begin."}
  else{
    ml.className="mastery-list";
    ml.innerHTML=totals.map(({g,m})=>{
      const pct=Math.min(100,(m.score%300)/300*100);
      return `<div class="mastery-row"><div><div class="mastery-name">${esc(g.name)}</div><div class="mastery-sub">${m.sessions} sessions • ${formatMinutes(m.minutes)}</div></div><div class="xp-bar"><i style="width:${pct}%"></i></div><div class="mastery-level">Mastery ${m.level}</div></div>`;
    }).join("");
  }
  document.getElementById("achievementList").innerHTML=ACHIEVEMENTS.map(a=>{
    const unlocked=a.test(state);
    return `<div class="achievement ${unlocked?"":"locked"}"><div class="achievement-icon">${a.icon}</div><div><div class="achievement-name">${esc(a.name)} ${unlocked?"✓":""}</div><div class="achievement-desc">${esc(a.desc)}</div></div></div>`;
  }).join("");
}

function renderSkills(){
  document.getElementById("skillPoints").textContent=skillPointsAvailable();
  document.getElementById("skillTree").innerHTML=SKILL_BRANCHES.map(branch=>`<article class="skill-branch"><div class="kicker">${branch.kicker}</div><h3>${branch.name}</h3>
    ${branch.nodes.map(n=>{
      const rank=Number(state.skills[n.id]||0);
      return `<div class="skill-node ${rank>0?"unlocked":""} ${rank>=n.max?"maxed":""}">
        <div class="skill-node-head"><div class="skill-node-name">${n.name}</div><div class="skill-node-rank">${rank}/${n.max}</div></div>
        <p>${n.desc}</p><button class="${rank>=n.max?"ghost":"primary"}" data-skill="${n.id}" ${rank>=n.max||skillPointsAvailable()<=0?"disabled":""}>${rank>=n.max?"MAXED":"Upgrade"}</button>
      </div>`;
    }).join("")}</article>`).join("");
}

function renderClips(){
  const gameSel=document.getElementById("clipGameFilter");
  const prev=gameSel.value;
  gameSel.innerHTML=`<option value="all">All games</option>`+state.games.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("");
  if([...gameSel.options].some(o=>o.value===prev))gameSel.value=prev;
  const q=document.getElementById("clipSearch").value.trim().toLowerCase(),f=gameSel.value;
  const clips=state.clips.filter(c=>(!q||`${c.title} ${c.notes||""}`.toLowerCase().includes(q))&&(f==="all"||c.gameId===f));
  const wrap=document.getElementById("clipGrid");
  if(!clips.length){wrap.innerHTML=`<div class="panel empty">No clips saved yet. You can store a title plus a local/file/link reference.</div>`;return}
  wrap.innerHTML=clips.map(c=>`<article class="clip-card"><div class="clip-preview">▶</div><div class="clip-body"><div class="clip-title">${esc(c.title)}</div><div class="clip-meta">${esc(state.games.find(g=>g.id===c.gameId)?.name||"No game")} • ${new Date(c.createdAt).toLocaleDateString()}</div>
    ${c.url?`<div style="margin-top:10px"><a class="link-btn" href="${esc(c.url)}" target="_blank" rel="noopener">Open clip ↗</a></div>`:""}
    <div style="margin-top:10px"><button class="ghost" data-delete-clip="${c.id}">Delete</button></div></div></article>`).join("");
}
function renderRecords(){
  const wrap=document.getElementById("recordGrid");
  if(!state.records.length){wrap.innerHTML=`<div class="panel empty">No personal records yet.</div>`;return}
  wrap.innerHTML=state.records.map(r=>`<article class="record-card"><div class="record-game">${esc((state.games.find(g=>g.id===r.gameId)?.name||"GENERAL").toUpperCase())}</div><div class="record-title">${esc(r.title)}</div><div class="record-value">${esc(r.value)}</div><div class="record-note">${esc(r.note||"Personal best")}</div><div style="margin-top:12px"><button class="ghost" data-delete-record="${r.id}">Delete</button></div></article>`).join("");
}
function renderVault(){
  document.querySelectorAll("#vaultTabs .tab").forEach(b=>b.classList.toggle("active",b.dataset.vtab===vaultTab));
  const items=state.vault.filter(v=>vaultTab==="all"||v.type===vaultTab);
  const wrap=document.getElementById("vaultGrid");
  if(!items.length){wrap.innerHTML=`<div class="panel empty">Nothing in this part of the Vault.</div>`;return}
  wrap.innerHTML=items.map(v=>`<article class="vault-card"><div class="vault-type">${esc(v.type.toUpperCase())}</div><div class="vault-title">${esc(v.title)}</div><div class="vault-body">${v.type==="link"&&v.body?`<a class="link-btn" href="${esc(v.body)}" target="_blank" rel="noopener">${esc(v.body)}</a>`:esc(v.body||"")}</div><div class="vault-actions"><button class="ghost" data-delete-vault="${v.id}">Delete</button></div></article>`).join("");
}
function renderSeason(){
  const sl=seasonLevel(state.season.xp),pct=sl.current/sl.need*100;
  document.getElementById("seasonTitle").textContent=state.season.name;
  document.getElementById("seasonSubtitle").textContent=state.season.subtitle;
  document.getElementById("seasonLevelLarge").textContent=sl.level;
  document.getElementById("seasonXpLarge").textContent=`${sl.current} / ${sl.need} XP`;
  document.getElementById("seasonPct").textContent=Math.round(pct)+"%";
  document.getElementById("seasonBarLarge").style.width=pct+"%";
  const rewards=["Starter Mark","Profile Frame","Title: Locked In","Vault Slot","Purple Token","Title: Grinder","Frame II","Archive Badge","Season Crest","Prestige Mark"];
  const start=Math.max(1,sl.level-2);
  document.getElementById("seasonTrack").innerHTML=Array.from({length:10},(_,i)=>start+i).map((lvl,i)=>`<div class="season-node ${lvl<sl.level?"unlocked":lvl===sl.level?"current":""}"><div class="lvl">LEVEL ${lvl}</div><strong>${esc(rewards[i])}</strong><span>${lvl<sl.level?"UNLOCKED":lvl===sl.level?"IN PROGRESS":"LOCKED"}</span></div>`).join("");
}
function renderTimeline(){
  const wrap=document.getElementById("timelineFull");
  if(!state.timeline.length){wrap.innerHTML=`<div class="panel empty">Your career timeline is empty.</div>`;return}
  wrap.innerHTML=state.timeline.map(e=>`<div class="timeline-event"><div class="timeline-date">${new Date(e.at).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div><div class="timeline-event-card">${esc(e.text)}</div></div>`).join("");
}
function renderSettings(){
  const a=document.getElementById("settingsName"),b=document.getElementById("settingsTagline");
  if(document.activeElement!==a)a.value=state.profile.name;
  if(document.activeElement!==b)b.value=state.profile.tagline;
}

function modal(title,kicker,body,onSubmit){
  document.getElementById("modalTitle").textContent=title;
  document.getElementById("modalKicker").textContent=kicker;
  document.getElementById("modalBody").innerHTML=body;
  document.getElementById("modalBackdrop").classList.remove("hidden");
  const f=document.getElementById("modalForm");
  if(f){f.addEventListener("submit",e=>{e.preventDefault();onSubmit(new FormData(f))});setTimeout(()=>f.querySelector("input,textarea,select")?.focus(),20)}
}
function closeModal(){document.getElementById("modalBackdrop").classList.add("hidden")}

function gameOptions(selected=""){
  return `<option value="">General / No Game</option>`+state.games.map(g=>`<option value="${g.id}" ${selected===g.id?"selected":""}>${esc(g.name)}</option>`).join("");
}
function showGameModal(game=null){
  modal(game?"Edit Game":"Add Game","GAME LIBRARY",`<form id="modalForm" class="modal-form">
    <div class="field"><label>GAME NAME</label><input name="name" required value="${game?esc(game.name):""}" placeholder="VALORANT"></div>
    <div class="form-row"><div class="field"><label>PLATFORM</label><input name="platform" value="${game?esc(game.platform||""):""}" placeholder="PC"></div><div class="field"><label>GENRE</label><input name="genre" value="${game?esc(game.genre||""):""}" placeholder="Shooter"></div></div>
    <div class="field"><label>STATUS</label><select name="status">${["playing","backlog","completed","dropped"].map(s=>`<option value="${s}" ${(game?.status||"playing")===s?"selected":""}>${s}</option>`).join("")}</select></div>
    <div class="field"><label>NOTES</label><textarea name="notes" placeholder="Why you play it, goals, whatever...">${game?esc(game.notes||""):""}</textarea></div>
    <div class="form-actions"><button type="button" class="ghost" data-close>Cancel</button><button class="primary">${game?"Save":"Add Game"}</button></div>
  </form>`,fd=>{
    const item={id:game?.id||id(),name:fd.get("name").trim(),platform:fd.get("platform").trim(),genre:fd.get("genre").trim(),status:fd.get("status"),notes:fd.get("notes").trim(),createdAt:game?.createdAt||now()};
    if(game){Object.assign(game,item);timeline(`Updated game: ${item.name}`)}
    else{state.games.push(item);if(!state.nowPlayingId)state.nowPlayingId=item.id;timeline(`Added ${item.name} to the library`);addXp(25,"new game added")}
    closeModal();persist();toast(game?"Game updated":"Game added");
  });
}
function showSessionModal(gameId=state.nowPlayingId||state.games[0]?.id||""){
  if(!state.games.length){toast("Add a game first.");switchView("games");showGameModal();return}
  modal("Log Session","CAREER LOG",`<form id="modalForm" class="modal-form">
    <div class="field"><label>GAME</label><select name="gameId" required>${state.games.map(g=>`<option value="${g.id}" ${g.id===gameId?"selected":""}>${esc(g.name)}</option>`).join("")}</select></div>
    <div class="form-row"><div class="field"><label>MINUTES</label><input name="minutes" type="number" min="1" max="1440" value="60" required></div><div class="field"><label>RATING / 10</label><input name="rating" type="number" min="1" max="10" value="7"></div></div>
    <div class="field"><label>WHAT HAPPENED?</label><textarea name="note" placeholder="Ranked, practiced, beat a boss, rage quit, popped off..."></textarea></div>
    <div class="form-actions"><button type="button" class="ghost" data-close>Cancel</button><button class="primary">Log Session</button></div>
  </form>`,fd=>{
    const gid=fd.get("gameId"),minutes=Number(fd.get("minutes"));
    state.sessions.unshift({id:id(),gameId:gid,minutes,rating:Number(fd.get("rating")||0),note:fd.get("note").trim(),at:now()});
    state.nowPlayingId=gid;
    const g=state.games.find(x=>x.id===gid);
    timeline(`Logged ${formatMinutes(minutes)} in ${g?.name||"a game"}`,"session");
    addXp(Math.max(10,Math.round(minutes/3)),`${g?.name||"game"} session`);
    closeModal();persist();toast("Session logged");
  });
}
function showQuestModal(){
  modal("Create Quest","QUEST BOARD",`<form id="modalForm" class="modal-form">
    <div class="field"><label>QUEST TITLE</label><input name="title" required placeholder="Win 3 ranked games"></div>
    <div class="field"><label>DESCRIPTION</label><textarea name="description" placeholder="What counts?"></textarea></div>
    <div class="form-row"><div class="field"><label>TYPE</label><select name="type"><option value="normal">Normal</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div><div class="field"><label>GAME</label><select name="gameId">${gameOptions()}</select></div></div>
    <div class="form-row"><div class="field"><label>TARGET</label><input name="target" type="number" min="1" value="1"></div><div class="field"><label>XP REWARD</label><input name="xp" type="number" min="5" max="1000" value="100"></div></div>
    <div class="form-actions"><button type="button" class="ghost" data-close>Cancel</button><button class="primary">Create Quest</button></div>
  </form>`,fd=>{
    const q={id:id(),title:fd.get("title").trim(),description:fd.get("description").trim(),type:fd.get("type"),gameId:fd.get("gameId")||null,target:Number(fd.get("target")||1),progress:0,xp:Number(fd.get("xp")||100),completed:false,createdAt:now(),completedAt:null};
    state.quests.unshift(q);timeline(`Created quest: ${q.title}`);closeModal();persist();toast("Quest created");
  });
}
function showClipModal(){
  modal("Add Clip","MOMENT ARCHIVE",`<form id="modalForm" class="modal-form">
    <div class="field"><label>TITLE</label><input name="title" required placeholder="1v3 clutch"></div>
    <div class="field"><label>GAME</label><select name="gameId">${gameOptions()}</select></div>
    <div class="field"><label>LINK / FILE REFERENCE</label><input name="url" placeholder="https://... or filename"></div>
    <div class="field"><label>NOTES</label><textarea name="notes" placeholder="Why this clip matters"></textarea></div>
    <div class="form-actions"><button type="button" class="ghost" data-close>Cancel</button><button class="primary">Add Clip</button></div>
  </form>`,fd=>{
    const c={id:id(),title:fd.get("title").trim(),gameId:fd.get("gameId")||null,url:fd.get("url").trim(),notes:fd.get("notes").trim(),createdAt:now()};
    state.clips.unshift(c);timeline(`Saved clip: ${c.title}`);addXp(20,"clip archived");closeModal();persist();toast("Clip saved");
  });
}
function showRecordModal(){
  modal("Add Personal Record","RECORD BOOK",`<form id="modalForm" class="modal-form">
    <div class="field"><label>RECORD</label><input name="title" required placeholder="Most kills in a match"></div>
    <div class="field"><label>VALUE</label><input name="value" required placeholder="31"></div>
    <div class="field"><label>GAME</label><select name="gameId">${gameOptions()}</select></div>
    <div class="field"><label>NOTE</label><input name="note" placeholder="Ranked • Aug 12"></div>
    <div class="form-actions"><button type="button" class="ghost" data-close>Cancel</button><button class="primary">Save Record</button></div>
  </form>`,fd=>{
    const r={id:id(),title:fd.get("title").trim(),value:fd.get("value").trim(),gameId:fd.get("gameId")||null,note:fd.get("note").trim(),createdAt:now()};
    state.records.unshift(r);timeline(`New personal record: ${r.title} — ${r.value}`);addXp(50,"personal record");closeModal();persist();toast("Record saved");
  });
}
function showVaultModal(){
  modal("Vault Item","PRIVATE ARCHIVE",`<form id="modalForm" class="modal-form">
    <div class="field"><label>TITLE</label><input name="title" required placeholder="Best Vandal setup"></div>
    <div class="form-row"><div class="field"><label>TYPE</label><select name="type"><option value="loadout">Loadout</option><option value="build">Build</option><option value="note">Note</option><option value="link">Link</option><option value="idea">Idea</option></select></div><div class="field"><label>GAME</label><select name="gameId">${gameOptions()}</select></div></div>
    <div class="field"><label>CONTENT</label><textarea name="body" placeholder="Put the actual thing here..."></textarea></div>
    <div class="form-actions"><button type="button" class="ghost" data-close>Cancel</button><button class="primary">Store Item</button></div>
  </form>`,fd=>{
    const v={id:id(),title:fd.get("title").trim(),type:fd.get("type"),gameId:fd.get("gameId")||null,body:fd.get("body").trim(),createdAt:now()};
    state.vault.unshift(v);timeline(`Stored ${v.type} in the Vault: ${v.title}`);addXp(10,"vault item");closeModal();persist();toast("Stored in Vault");
  });
}
function showSeasonModal(){
  modal("Edit Season","SEASON CONTROL",`<form id="modalForm" class="modal-form">
    <div class="field"><label>SEASON NAME</label><input name="name" required value="${esc(state.season.name)}"></div>
    <div class="field"><label>SUBTITLE</label><input name="subtitle" value="${esc(state.season.subtitle)}"></div>
    <div class="form-actions"><button type="button" class="ghost" data-close>Cancel</button><button class="primary">Save Season</button></div>
  </form>`,fd=>{
    state.season.name=fd.get("name").trim();state.season.subtitle=fd.get("subtitle").trim();timeline(`Season renamed to ${state.season.name}`);closeModal();persist();toast("Season updated");
  });
}

const COMMANDS = [
  ["Home","Go to",()=>switchView("home")],["Games","Go to",()=>switchView("games")],["Quests","Go to",()=>switchView("quests")],
  ["Career","Go to",()=>switchView("career")],["Skill Tree","Go to",()=>switchView("skills")],["Clips","Go to",()=>switchView("clips")],
  ["Records","Go to",()=>switchView("records")],["Vault","Go to",()=>switchView("vault")],["Seasons","Go to",()=>switchView("seasons")],
  ["Timeline","Go to",()=>switchView("timeline")],["Add Game","Create",showGameModal],["Log Session","Create",showSessionModal],
  ["Create Quest","Create",showQuestModal],["Add Clip","Create",showClipModal],["Add Record","Create",showRecordModal],["Vault Item","Create",showVaultModal]
];
function openCommand(){document.getElementById("commandBackdrop").classList.remove("hidden");document.getElementById("commandInput").value="";renderCommands("");setTimeout(()=>document.getElementById("commandInput").focus(),20)}
function closeCommand(){document.getElementById("commandBackdrop").classList.add("hidden")}
function renderCommands(q){q=q.toLowerCase().trim();const m=COMMANDS.map((c,i)=>({c,i})).filter(x=>!q||x.c[0].toLowerCase().includes(q));document.getElementById("commandResults").innerHTML=m.map(x=>`<button class="command-item" data-command="${x.i}"><span>${esc(x.c[0])}</span><span>${x.c[1]}</span></button>`).join("")||`<div class="empty" style="padding:12px">No command found.</div>`}
function runCommand(i){const c=COMMANDS[Number(i)];if(c){closeCommand();c[2]()}}

document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-view]");if(nav&&nav.classList.contains("nav-btn"))switchView(nav.dataset.view);
  const goto=e.target.closest("[data-goto]");if(goto)switchView(goto.dataset.goto);
  if(e.target.closest("[data-close]"))closeModal();

  const log=e.target.closest("[data-log-game]");if(log)showSessionModal(log.dataset.logGame);
  const edit=e.target.closest("[data-edit-game]");if(edit)showGameModal(state.games.find(g=>g.id===edit.dataset.editGame));
  const current=e.target.closest("[data-set-current]");if(current){state.nowPlayingId=current.dataset.setCurrent;timeline(`Set current game to ${state.games.find(g=>g.id===state.nowPlayingId)?.name||"game"}`);persist();toast("Current game updated")}

  const qp=e.target.closest("[data-progress-quest]");if(qp){const q=state.quests.find(x=>x.id===qp.dataset.progressQuest);if(q&&!q.completed){q.progress=Math.min(q.target,(q.progress||0)+1);timeline(`Quest progress: ${q.title} (${q.progress}/${q.target})`);if(q.progress>=q.target)completeQuest(q);persist()}}
  const qc=e.target.closest("[data-complete-quest]");if(qc){const q=state.quests.find(x=>x.id===qc.dataset.completeQuest);if(q&&!q.completed){q.progress=q.target;completeQuest(q);persist()}}
  const qd=e.target.closest("[data-delete-quest]");if(qd){const q=state.quests.find(x=>x.id===qd.dataset.deleteQuest);if(q&&confirm(`Delete quest "${q.title}"?`)){state.quests=state.quests.filter(x=>x.id!==q.id);timeline(`Deleted quest: ${q.title}`);persist()}}

  const skill=e.target.closest("[data-skill]");if(skill){const node=SKILL_BRANCHES.flatMap(b=>b.nodes).find(n=>n.id===skill.dataset.skill);if(node&&skillPointsAvailable()>0&&(state.skills[node.id]||0)<node.max){state.skills[node.id]=(state.skills[node.id]||0)+1;timeline(`Upgraded skill: ${node.name} to rank ${state.skills[node.id]}`);persist();toast(`${node.name} upgraded`)}}

  const dc=e.target.closest("[data-delete-clip]");if(dc&&confirm("Delete this clip?")){state.clips=state.clips.filter(x=>x.id!==dc.dataset.deleteClip);persist()}
  const dr=e.target.closest("[data-delete-record]");if(dr&&confirm("Delete this record?")){state.records=state.records.filter(x=>x.id!==dr.dataset.deleteRecord);persist()}
  const dv=e.target.closest("[data-delete-vault]");if(dv&&confirm("Delete this Vault item?")){state.vault=state.vault.filter(x=>x.id!==dv.dataset.deleteVault);persist()}
  const cmd=e.target.closest("[data-command]");if(cmd)runCommand(cmd.dataset.command);
});
function completeQuest(q){
  q.completed=true;q.completedAt=now();timeline(`Completed quest: ${q.title}`,"quest");addXp(q.xp||100,`quest: ${q.title}`);toast(`Quest complete +${q.xp} XP`);
}

document.getElementById("addGameBtn").onclick=()=>showGameModal();
document.getElementById("quickLogBtn").onclick=()=>showSessionModal();
document.getElementById("addQuestBtn").onclick=showQuestModal;
document.getElementById("addClipBtn").onclick=showClipModal;
document.getElementById("addRecordBtn").onclick=showRecordModal;
document.getElementById("addVaultBtn").onclick=showVaultModal;
document.getElementById("editSeasonBtn").onclick=showSeasonModal;
document.getElementById("closeModalBtn").onclick=closeModal;
document.getElementById("modalBackdrop").onclick=e=>{if(e.target.id==="modalBackdrop")closeModal()};
document.getElementById("openCommand").onclick=openCommand;
document.getElementById("commandBackdrop").onclick=e=>{if(e.target.id==="commandBackdrop")closeCommand()};
document.getElementById("commandInput").oninput=e=>renderCommands(e.target.value);
document.getElementById("themeBtn").onclick=()=>{state.profile.theme=state.profile.theme==="dark"?"light":"dark";persist()};
document.getElementById("gameSearch").oninput=renderGames;
document.getElementById("gameFilter").onchange=renderGames;
document.getElementById("clipSearch").oninput=renderClips;
document.getElementById("clipGameFilter").onchange=renderClips;
document.getElementById("questTabs").onclick=e=>{const b=e.target.closest("[data-qtab]");if(b){questTab=b.dataset.qtab;renderQuests()}};
document.getElementById("vaultTabs").onclick=e=>{const b=e.target.closest("[data-vtab]");if(b){vaultTab=b.dataset.vtab;renderVault()}};
document.getElementById("saveProfileBtn").onclick=()=>{state.profile.name=document.getElementById("settingsName").value.trim()||"Player One";state.profile.tagline=document.getElementById("settingsTagline").value.trim();timeline("Updated player profile");persist();toast("Profile saved")};
document.getElementById("clearTimelineBtn").onclick=()=>{if(confirm("Clear the career timeline?")){state.timeline=[];persist()}};
document.getElementById("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({version:VERSION,exportedAt:now(),data:state},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`forge-solo-backup-${dayKey()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exported");
};
document.getElementById("importInput").onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{const p=JSON.parse(await f.text());const incoming=p.data||p;if(!confirm("Replace current FORGE data with this backup?"))return;state={...clone(DEFAULT),...incoming,profile:{...DEFAULT.profile,...(incoming.profile||{})},season:{...DEFAULT.season,...(incoming.season||{})}};persist();toast("Backup restored")}catch{alert("That backup could not be read.")}finally{e.target.value=""}
};
document.getElementById("resetBtn").onclick=()=>{if(confirm("Delete EVERYTHING in FORGE on this device?")&&confirm("Final check — reset FORGE completely?")){state=clone(DEFAULT);persist();toast("FORGE reset")}};

document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommand()}
  if(e.key==="Escape"){closeModal();closeCommand()}
});

renderAll();

if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
