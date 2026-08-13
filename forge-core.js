(function(){
"use strict";
const F=window.FORGE=window.FORGE||{};
F.VERSION=3;
F.STORE_KEY="forge_daily_v2";
F.BONUS_XP=250;
const U=F.util={
  esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))},
  clamp(n,a,b){return Math.min(b,Math.max(a,n))},
  day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`},
  date(k){const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)},
  fmt(k,opts={weekday:"long",month:"long",day:"numeric"}){return this.date(k).toLocaleDateString(undefined,opts)},
  daysBetween(a,b){return Math.round((this.date(b)-this.date(a))/86400000)},
  hash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0},
  rng(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296}},
  shuffle(a,r=Math.random){const o=[...a];for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]]}return o},
  uid(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`},
  bytes(n=0){n=Number(n)||0;if(n<1024)return`${n} B`;if(n<1048576)return`${(n/1024).toFixed(1)} KB`;if(n<1073741824)return`${(n/1048576).toFixed(1)} MB`;return`${(n/1073741824).toFixed(2)} GB`},
  debounce(fn,ms=150){let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms)}}
};
function defaults(){return{
  schemaVersion:3,
  profile:{name:"Player One",theme:"dark",mix:"balanced",difficulty:"mixed",motion:true,sound:false,seed:U.uid(),activeTitle:"Rookie",activeAccent:"#875cff",activeAccentName:"Violet Core",activeFrame:"default"},
  xp:0,boards:{},rerolls:{},bonusClaimed:{},achievementUnlocks:{},createdAt:new Date().toISOString()
}}
F.defaultState=defaults;
F.migrate=function(raw){
  const b=defaults(),s={...b,...(raw||{})};s.profile={...b.profile,...((raw||{}).profile||{})};
  s.boards=s.boards||{};s.rerolls=s.rerolls||{};s.bonusClaimed=s.bonusClaimed||{};s.achievementUnlocks=s.achievementUnlocks||{};
  if(!s.profile.seed)s.profile.seed=U.uid();
  Object.values(s.boards).forEach(qs=>Array.isArray(qs)&&qs.forEach((q,i)=>{q.slot=q.slot||i+1;q.difficulty=q.difficulty||"Normal";q.rarity=q.rarity||"Common";q.category=q.category||"Legacy Quest";q.proofHint=q.proofHint||"Attach a clip that clearly shows this quest.";q.tags=Array.isArray(q.tags)?q.tags:[];q.weight=Number(q.weight)||1}));
  s.schemaVersion=3;return s
};
F.load=function(){try{F.state=F.migrate(JSON.parse(localStorage.getItem(F.STORE_KEY)||"null"))}catch{F.state=defaults()}F.save(false);return F.state};
F.save=function(render=true){localStorage.setItem(F.STORE_KEY,JSON.stringify(F.state));if(render&&F.UI)F.UI.renderAll()};
F.levelInfo=function(xp=F.state.xp){let level=1,current=Math.max(0,+xp||0),need=100;while(current>=need){current-=need;level++;need=100+(level-1)*40;if(level>999)break}return{level,current,need,pct:U.clamp(current/need*100,0,100),prestige:Math.floor((level-1)/50)}};
F.titleForLevel=function(l){if(l>=50)return"Forged";if(l>=40)return"Overdrive";if(l>=30)return"Veteran";if(l>=25)return"Clip Machine";if(l>=20)return"Quest Engine";if(l>=15)return"Hunter";if(l>=10)return"Challenger";if(l>=5)return"Clipper";return"Rookie"};
F.rankForScore=function(s){if(s>=50000)return"MYTHIC";if(s>=25000)return"FORGED";if(s>=15000)return"ELITE";if(s>=8000)return"VETERAN";if(s>=3500)return"CHALLENGER";if(s>=1200)return"RISING";return"INITIATE"};
F.completedQuests=function(){return Object.entries(F.state.boards).flatMap(([date,qs])=>(qs||[]).filter(q=>q.completed).map(q=>({...q,date})))};
F.allBoards=function(){return Object.entries(F.state.boards).sort((a,b)=>b[0].localeCompare(a[0]))};
F.streaks=function(days){if(!days.length)return{current:0,longest:0};let longest=1,run=1;for(let i=1;i<days.length;i++){if(U.daysBetween(days[i-1],days[i])===1){run++;longest=Math.max(longest,run)}else run=1}const today=U.day(),last=days.at(-1);let current=0;if(last===today||U.daysBetween(last,today)===1){current=1;for(let i=days.length-1;i>0;i--){if(U.daysBetween(days[i-1],days[i])===1)current++;else break}}return{current,longest}};
F.stats=function(){const completed=F.completedQuests(),boards=F.allBoards(),perfect=boards.filter(([,q])=>q.length===5&&q.every(x=>x.completed)).length,days=boards.filter(([,q])=>q.some(x=>x.completed)).map(([d])=>d).sort(),streak=F.streaks(days),val=completed.filter(q=>q.game==="VALORANT").length,vrfs=completed.filter(q=>q.game==="VRFS").length,diff={Easy:0,Normal:0,Hard:0,Elite:0},categories={};completed.forEach(q=>{diff[q.difficulty]=(diff[q.difficulty]||0)+1;categories[q.category||"Other"]=(categories[q.category||"Other"]||0)+1});const score=Math.round(F.state.xp+perfect*250+streak.longest*75+completed.length*35);return{completed,completedCount:completed.length,boards,perfect,days,streak,val,vrfs,diff,categories,score}};
F.questEngine={
  counts(rand){const m=F.state.profile.mix;if(m==="valorant")return[4,1];if(m==="vrfs")return[1,4];if(m==="balanced")return rand()<.5?[3,2]:[2,3];const v=1+Math.floor(rand()*4);return[v,5-v]},
  allowed(q,rand){const b=F.state.profile.difficulty||"mixed";if(b==="chill"&&q.difficulty==="Elite")return rand()<.06;if(b==="chill"&&q.difficulty==="Hard")return rand()<.3;if(b==="hard"&&q.difficulty==="Easy")return rand()<.16;if(b==="hard"&&q.difficulty==="Normal")return rand()<.62;return true},
  pick(game,count,rand,used){let pool=(window.FORGE_QUESTS?.[game]||[]).filter(q=>this.allowed(q,rand)),out=[],ids=new Set(),guard=0;while(out.length<count&&guard++<1000){const q=pool[Math.floor(rand()*pool.length)];if(!q||ids.has(q.id))continue;const key=`${game}:${q.category}`;if(used.has(key)&&rand()<.68)continue;ids.add(q.id);used.add(key);out.push({...q})}return out},
  generate(date,reroll=0){const rand=U.rng(U.hash(`${date}|${reroll}|${F.state.profile.seed}|${F.state.profile.mix}|${F.state.profile.difficulty}|OVERDRIVE`)),[v,r]=this.counts(rand),used=new Set();let qs=[...this.pick("VALORANT",v,rand,used),...this.pick("VRFS",r,rand,used)];qs=U.shuffle(qs,rand).sort((a,b)=>b.xp-a.xp);return qs.map((q,i)=>({...q,id:`${date}-${reroll}-${i}-${q.id}`,sourceId:q.id,slot:i+1,completed:false,clipId:null,completedAt:null,generatedAt:new Date().toISOString()}))},
  ensure(){const d=U.day();if(!F.state.boards[d])F.state.boards[d]=this.generate(d,F.state.rerolls[d]||0);return F.state.boards[d]},
  reroll(){const d=U.day(),b=this.ensure();if(b.some(q=>q.completed))return{ok:false,reason:"You can't reroll after submitting the first proof."};F.state.rerolls[d]=(F.state.rerolls[d]||0)+1;F.state.boards[d]=this.generate(d,F.state.rerolls[d]);F.save();return{ok:true}}
};
F.addXp=function(n){n=Math.max(0,+n||0);const before=F.levelInfo();F.state.xp+=n;return{before,after:F.levelInfo()}};
F.checkPerfect=function(){const d=U.day(),b=F.questEngine.ensure();if(b.length===5&&b.every(q=>q.completed)&&!F.state.bonusClaimed[d]){F.state.bonusClaimed[d]=true;const levels=F.addXp(F.BONUS_XP);return{claimed:true,...levels}}return{claimed:false}};
F.achievements=[
  ["first-proof","▶","First Proof","Complete your first clipped quest.",s=>s.completedCount>=1],
  ["five-proofs","V","Five Deep","Complete 5 quests.",s=>s.completedCount>=5],
  ["ten-proofs","X","Double Digits","Complete 10 quests.",s=>s.completedCount>=10],
  ["twenty-five","◆","Proof Collector","Complete 25 quests.",s=>s.completedCount>=25],
  ["fifty","✦","Clip Machine","Complete 50 quests.",s=>s.completedCount>=50],
  ["hundred","100","Century","Complete 100 quests.",s=>s.completedCount>=100],
  ["two-fifty","250","Archive Monster","Complete 250 quests.",s=>s.completedCount>=250],
  ["perfect-one","★","Perfect Five","Complete all five quests in one day.",s=>s.perfect>=1],
  ["perfect-five","★5","Five Perfects","Record 5 perfect days.",s=>s.perfect>=5],
  ["perfect-ten","★X","Ten Perfects","Record 10 perfect days.",s=>s.perfect>=10],
  ["streak-three","III","Three Day Run","Reach a 3-day active streak.",s=>s.streak.longest>=3],
  ["streak-seven","VII","Week Warrior","Reach a 7-day active streak.",s=>s.streak.longest>=7],
  ["streak-fourteen","14","Two Weeks Locked","Reach a 14-day active streak.",s=>s.streak.longest>=14],
  ["streak-thirty","30","Month Run","Reach a 30-day active streak.",s=>s.streak.longest>=30],
  ["val-five","V","VAL Warmup","Complete 5 VALORANT quests.",s=>s.val>=5],
  ["val-twenty-five","V25","VAL Hunter","Complete 25 VALORANT quests.",s=>s.val>=25],
  ["val-hundred","V100","VAL Archive","Complete 100 VALORANT quests.",s=>s.val>=100],
  ["vrfs-five","⚽","Pitch Warmup","Complete 5 VRFS quests.",s=>s.vrfs>=5],
  ["vrfs-twenty-five","⚽25","Pitch Hunter","Complete 25 VRFS quests.",s=>s.vrfs>=25],
  ["vrfs-hundred","⚽100","VRFS Archive","Complete 100 VRFS quests.",s=>s.vrfs>=100],
  ["level-five","L5","Level Five","Reach account level 5.",()=>F.levelInfo().level>=5],
  ["level-ten","L10","Double Digit Level","Reach account level 10.",()=>F.levelInfo().level>=10],
  ["level-twenty","L20","Forging Ahead","Reach account level 20.",()=>F.levelInfo().level>=20],
  ["level-fifty","L50","Prestige Ready","Reach account level 50.",()=>F.levelInfo().level>=50]
].map(([id,icon,name,desc,test])=>({id,icon,name,desc,test}));
F.evaluateAchievements=function(){const s=F.stats(),fresh=[];F.achievements.forEach(a=>{if(a.test(s)&&!F.state.achievementUnlocks[a.id]){F.state.achievementUnlocks[a.id]=new Date().toISOString();fresh.push(a)}});if(fresh.length)F.save(false);return fresh};
F.rewardAtLevel=l=>(window.FORGE_REWARDS||[]).find(r=>r.level===l);
F.applyAppearance=function(){const p=F.state.profile;document.documentElement.classList.toggle("light",p.theme==="light");document.body.classList.toggle("reduce-motion",p.motion===false);document.documentElement.style.setProperty("--accent",p.activeAccent||"#875cff");const h=(p.activeAccent||"#875cff").replace("#","");if(h.length===6)document.documentElement.style.setProperty("--accent-rgb",`${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`)};
})();