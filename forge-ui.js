(function(){
"use strict";
const F=window.FORGE=window.FORGE||{},U=F.util;
const UI=F.UI={
  view:"today",clipGame:"all",clipQuery:"",clipSort:"newest",achievementFilter:"all",historyFilter:"all",collectionFilter:"all",urls:[],
  $(id){return document.getElementById(id)},
  html(id,value){const el=this.$(id);if(el)el.innerHTML=value},
  text(id,value){const el=this.$(id);if(el)el.textContent=value},
  pct(id,value){const el=this.$(id);if(el)el.style.width=`${U.clamp(value,0,100)}%`},
  switchView(v){
    this.view=v;document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===`${v}View`));
    document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
    const map={today:["DAILY RUN // 5 QUESTS","Today"],clips:["PROOF VAULT // LOCAL","Clips"],progress:["ACCOUNT // PROGRESSION","Progress"],achievements:["PASSIVE // MILESTONES","Achievements"],history:["ARCHIVE // DAILY RUNS","History"],analytics:["AUTOMATIC // INSIGHTS","Analytics"],collection:["LEVEL // REWARDS","Collection"],settings:["LOCAL // CONTROL","Settings"]};
    this.text("pageEyebrow",map[v]?.[0]||"FORGE");this.text("pageTitle",map[v]?.[1]||"FORGE");
    if(v==="clips")this.renderClips();if(v==="analytics")requestAnimationFrame(()=>this.renderAnalytics());
    scrollTo({top:0,behavior:F.state.profile.motion===false?"auto":"smooth"});setTimeout(()=>F.Effects?.refresh(),20)
  },
  renderAll(){
    F.applyAppearance();this.renderHeader();this.renderToday();this.renderProgress();this.renderAchievements();this.renderHistory();this.renderCollection();this.renderSettings();
    if(this.view==="clips")this.renderClips();if(this.view==="analytics")requestAnimationFrame(()=>this.renderAnalytics());
    setTimeout(()=>F.Effects?.refresh(),20)
  },
  renderHeader(){
    const l=F.levelInfo(),s=F.stats(),title=F.state.profile.activeTitle||F.titleForLevel(l.level);
    this.text("sideLevel",l.level);this.text("sideXpLabel",`${Math.floor(l.current)} / ${l.need}`);this.pct("sideXpBar",l.pct);this.text("sideTitle",title);this.text("sideStreak",`${s.streak.current} day streak`);
    this.text("profileOrb",l.level);this.text("profileLevelTop",l.level);this.text("navTodayCount",`${F.questEngine.ensure().filter(q=>q.completed).length}/5`);
    F.Clips?.count().then(n=>{this.text("navClipCount",n);this.text("todayClips",n);this.text("clipHeroCount",n)}).catch(()=>{});
    const soundBtn=this.$("soundBtn");if(soundBtn){soundBtn.textContent=F.state.profile.sound?"◉":"◌";soundBtn.classList.toggle("active",F.state.profile.sound)}
  },
  questCard(q,index){
    const done=q.completed,featured=index===0,gameClass=q.game==="VALORANT"?"val":"vrfs",gameColor=q.game==="VALORANT"?"#ff6678":"#57e3a4";
    const action=done?(q.clipId?`<button class="secondary-btn mini" data-proof="${U.esc(q.clipId)}">▶ View Proof</button>`:`<span class="proof-missing">Proof removed</span>`):`<button class="primary-btn mini" data-submit-quest="${U.esc(q.id)}"><span>▶</span> Submit Clip</button>`;
    const body=`<div class="quest-main"><div class="quest-topline"><span class="game-chip ${gameClass}">${q.game}</span><span class="difficulty-chip">${U.esc(q.difficulty||"Normal")}</span><span class="rarity-chip">${U.esc(q.rarity||"Common")}</span></div><span class="quest-number">0${index+1}</span><h3>${U.esc(q.title)}</h3><p class="quest-description">${U.esc(q.description)}</p><div class="quest-proof"><span>⌁</span><div><b>${U.esc(q.category||"Quest")}</b><br>${U.esc(q.proofHint||"Attach a clip that proves it.")}</div></div></div>`;
    const footer=`<div class="quest-footer"><span class="quest-xp">+${q.xp} XP</span><div class="quest-actions">${done?`<span class="proof-complete">PROVEN</span>`:""}${action}</div></div>`;
    if(featured)return `<article class="quest-card featured ${done?"done":""} reveal" style="--game:${gameColor}">${body}<div class="featured-side"><span class="boss-mark">FEATURED // HIGHEST XP</span><span class="quest-xp">+${q.xp} XP</span>${done?`<span class="proof-complete">PROVEN</span>`:""}${action}</div></article>`;
    return `<article class="quest-card ${done?"done":""} reveal" style="--game:${gameColor}">${body}${footer}</article>`
  },
  renderToday(){
    const board=F.questEngine.ensure(),done=board.filter(q=>q.completed).length,p=done/5*100,s=F.stats(),l=F.levelInfo(),d=U.day();
    this.text("heroDate",U.fmt(d));this.text("heroDateKey",d);this.text("heroDone",done);this.text("heroProgressText",`${done} of 5 complete`);this.text("heroProgressPercent",`${Math.round(p)}%`);this.pct("heroProgressBar",p);
    const ring=this.$("scoreRing");if(ring)ring.style.setProperty("--p",`${p*3.6}deg`);
    this.text("heroBonus",done===5?(F.state.bonusClaimed[d]?"PERFECT BOARD // BONUS CLAIMED":"PERFECT BOARD // BONUS READY"):`PERFECT BOARD +${F.BONUS_XP} XP`);
    this.text("todayLevel",l.level);this.text("todayLevelTitle",F.state.profile.activeTitle||F.titleForLevel(l.level));this.text("todayXp",F.state.xp.toLocaleString());this.text("todayStreak",s.streak.current);this.text("todayPerfect",s.perfect);this.text("proofRuleCount",s.completedCount);
    this.text("boardSubline",`${board.filter(q=>q.game==="VALORANT").length} VALORANT • ${board.filter(q=>q.game==="VRFS").length} VRFS • ${F.state.rerolls[d]||0} reroll${(F.state.rerolls[d]||0)===1?"":"s"}`);
    this.html("questBoard",board.map((q,i)=>this.questCard(q,i)).join(""));
    const r=this.$("rerollBoardBtn");if(r){r.disabled=board.some(q=>q.completed);r.title=r.disabled?"Locked after your first completed quest":"Generate five different quests"}
  },
  renderProgress(){
    const l=F.levelInfo(),s=F.stats(),title=F.state.profile.activeTitle||F.titleForLevel(l.level),prestige=l.prestige;
    this.text("careerLevel",l.level);this.text("careerPrestige",prestige?`PRESTIGE ${prestige}`:"NO PRESTIGE");this.text("careerName",F.state.profile.name);this.text("careerTitleLine",`${title} // built from proof.`);this.text("careerXpText",`${Math.floor(l.current)} / ${l.need} XP`);this.text("careerXpPct",`${Math.round(l.pct)}%`);this.pct("careerXpBar",l.pct);this.text("forgeScore",s.score.toLocaleString());this.text("careerRank",F.rankForScore(s.score));
    const rows=[["Completed quests",s.completedCount],["Perfect days",s.perfect],["Current streak",`${s.streak.current} days`],["Longest streak",`${s.streak.longest} days`],["VALORANT proof",s.val],["VRFS proof",s.vrfs],["Total XP",F.state.xp.toLocaleString()]];
    this.html("careerStats",rows.map(r=>`<div class="stat-row"><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join(""));
    const mastery=[{game:"VALORANT",n:s.val},{game:"VRFS",n:s.vrfs}];
    this.html("masteryCards",mastery.map(x=>{const lvl=Math.floor(x.n/10)+1,pct=(x.n%10)*10;return `<div class="mastery-card"><span class="game-chip ${x.game==="VALORANT"?"val":"vrfs"}">${x.game}</span><h4>Mastery ${lvl}</h4><p>${x.n} completed quests • next mastery in ${10-(x.n%10||0)} proof${10-(x.n%10||0)===1?"":"s"}</p><div class="progress-track"><i style="width:${pct}%"></i></div></div>`}).join(""));
    const rewards=window.FORGE_REWARDS||[],near=rewards.filter(r=>r.level>=Math.max(1,l.level-2)&&r.level<=l.level+9).slice(0,12);
    this.html("levelRoad",near.map(r=>`<div class="level-node ${r.level<l.level?"unlocked":r.level===l.level?"current":""}"><span>LEVEL ${r.level}</span><strong>${U.esc(r.name)}</strong><small>${U.esc(r.kind.toUpperCase())}</small></div>`).join(""));
    const counts={};s.completed.forEach(q=>counts[q.date]=(counts[q.date]||0)+1);let cells=[],total=0,dte=new Date();dte.setDate(dte.getDate()-13);for(let i=0;i<14;i++){const k=U.day(dte),n=counts[k]||0;total+=n;cells.push(`<div class="heat-day" title="${k}: ${n} quest${n===1?"":"s"}"><i class="h${Math.min(5,n)}"></i><span>${dte.toLocaleDateString(undefined,{weekday:"narrow"})}</span></div>`);dte.setDate(dte.getDate()+1)}this.html("heatStrip",cells.join(""));this.text("heatSummary",`${total} quest${total===1?"":"s"}`)
  },
  renderAchievements(){
    const s=F.stats(),unlocked=F.achievements.filter(a=>a.test(s)),filter=this.achievementFilter;this.text("achievementUnlockedCount",unlocked.length);this.text("achievementProgressText",`${unlocked.length} / ${F.achievements.length}`);const pct=unlocked.length/F.achievements.length*100;this.text("achievementProgressPct",`${Math.round(pct)}%`);this.pct("achievementProgressBar",pct);
    document.querySelectorAll("[data-achievement-filter]").forEach(b=>b.classList.toggle("active",b.dataset.achievementFilter===filter));
    const items=F.achievements.filter(a=>filter==="all"||(filter==="unlocked"?a.test(s):!a.test(s)));
    this.html("achievementGrid",items.map(a=>{const ok=a.test(s),when=F.state.achievementUnlocks[a.id];return `<article class="achievement-card ${ok?"unlocked":"locked"} reveal"><span class="achievement-status">${ok?(when?new Date(when).toLocaleDateString():"UNLOCKED"):"LOCKED"}</span><div class="achievement-icon">${U.esc(a.icon)}</div><h4>${U.esc(a.name)}</h4><p>${U.esc(a.desc)}</p></article>`}).join(""))
  },
  renderHistory(){
    let boards=F.allBoards(),filter=this.historyFilter;document.querySelectorAll("[data-history-filter]").forEach(b=>b.classList.toggle("active",b.dataset.historyFilter===filter));
    if(filter==="perfect")boards=boards.filter(([,qs])=>qs.length===5&&qs.every(q=>q.completed));if(filter==="partial")boards=boards.filter(([,qs])=>qs.some(q=>q.completed)&&!qs.every(q=>q.completed));
    this.text("historyDayCount",boards.length);
    if(!boards.length){this.html("historyList",`<div class="empty-state"><strong>No runs here yet.</strong>Your daily boards will stack up here.</div>`);return}
    this.html("historyList",boards.map(([date,qs])=>{const done=qs.filter(q=>q.completed),perfect=done.length===5,xp=done.reduce((a,q)=>a+(q.xp||0),0)+(F.state.bonusClaimed[date]?F.BONUS_XP:0);return `<article class="history-day ${perfect?"perfect":""} reveal"><div class="history-top"><div><h3>${U.esc(U.fmt(date))}</h3><p>${done.length}/5 proof submitted ${perfect?"• PERFECT BOARD":""}</p></div><div class="history-score"><strong>${xp}</strong><span>XP EARNED</span></div></div><div class="history-quests">${qs.map(q=>`<div class="history-quest ${q.completed?"done":""}" ${q.clipId?`data-proof="${U.esc(q.clipId)}" role="button"`:""}><b>${U.esc(q.title)}</b><span>${q.completed?`✓ ${q.game}`:`○ ${q.game}`}</span></div>`).join("")}</div></article>`}).join(""))
  },
  revokeUrls(){this.urls.forEach(u=>URL.revokeObjectURL(u));this.urls=[]},
  makeUrl(blob){const u=URL.createObjectURL(blob);this.urls.push(u);return u},
  async renderClips(){
    this.revokeUrls();let clips=[];try{clips=await F.Clips.all()}catch(err){this.html("clipGrid",`<div class="empty-state"><strong>Clip storage unavailable.</strong>${U.esc(err.message||"Your browser blocked IndexedDB.")}</div>`);return}
    const q=this.clipQuery.trim().toLowerCase();clips=clips.filter(c=>(this.clipGame==="all"||c.game===this.clipGame)&&(!q||`${c.questTitle} ${c.note||""} ${c.game} ${c.category||""}`.toLowerCase().includes(q)));
    if(this.clipSort==="oldest")clips.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));else if(this.clipSort==="favorites")clips.sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)||String(b.createdAt).localeCompare(String(a.createdAt)));else clips.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    this.text("clipHeroCount",clips.length);document.querySelectorAll("[data-clip-game]").forEach(b=>b.classList.toggle("active",b.dataset.clipGame===this.clipGame));
    if(!clips.length){this.html("clipGrid",`<div class="empty-state"><strong>No proof matches this view.</strong>Complete a quest by attaching a video or screenshot.</div>`);return}
    this.html("clipGrid",clips.map(c=>{const url=this.makeUrl(c.blob),video=String(c.type||"").startsWith("video"),media=video?`<video src="${url}" muted preload="metadata"></video><span class="clip-play">▶</span>`:`<img src="${url}" alt="Quest proof">`;return `<article class="clip-card reveal"><div class="clip-thumb" data-proof="${U.esc(c.id)}">${media}<button class="clip-favorite ${c.favorite?"active":""}" data-favorite="${U.esc(c.id)}" title="Favorite">${c.favorite?"★":"☆"}</button></div><div class="clip-info"><span class="game-chip ${c.game==="VALORANT"?"val":"vrfs"}">${U.esc(c.game)}</span><h4>${U.esc(c.questTitle||"Quest proof")}</h4><p>${new Date(c.createdAt).toLocaleString()}${c.note?` • ${U.esc(c.note)}`:""}</p><div class="clip-info-bottom"><span class="clip-size">${U.bytes(c.size||c.blob?.size||0)}</span><button class="text-btn danger-text" data-delete-clip="${U.esc(c.id)}">Delete</button></div></div></article>`}).join(""));F.Effects?.refresh()
  },
  renderAnalytics(){
    const s=F.stats();this.text("analyticsQuestCount",s.completedCount);this.drawDonut(s.val,s.vrfs);this.drawOutput(s.completed);this.renderDifficulty(s);this.renderCategories(s);this.renderCalendar(s)
  },
  drawDonut(val,vrfs){
    const c=this.$("gameSplitCanvas");if(!c)return;const ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth||560,h=270;c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);const total=val+vrfs,accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#875cff",centerX=w/2,centerY=h/2,r=82;ctx.lineWidth=24;ctx.lineCap="round";ctx.strokeStyle="rgba(128,128,140,.12)";ctx.beginPath();ctx.arc(centerX,centerY,r,0,Math.PI*2);ctx.stroke();if(total){const a=val/total*Math.PI*2;ctx.strokeStyle="#ff6678";ctx.beginPath();ctx.arc(centerX,centerY,r,-Math.PI/2,-Math.PI/2+a);ctx.stroke();ctx.strokeStyle="#57e3a4";ctx.beginPath();ctx.arc(centerX,centerY,r,-Math.PI/2+a,-Math.PI/2+Math.PI*2);ctx.stroke()}ctx.textAlign="center";ctx.fillStyle=getComputedStyle(document.body).color;ctx.font="900 32px system-ui";ctx.fillText(total,centerX,centerY+4);ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--muted");ctx.font="700 10px system-ui";ctx.fillText("QUESTS",centerX,centerY+23);this.html("gameSplitLegend",`<span><i style="background:#ff6678"></i> VALORANT ${val}</span><span><i style="background:#57e3a4"></i> VRFS ${vrfs}</span>`)
  },
  drawOutput(completed){
    const c=this.$("outputCanvas");if(!c)return;const ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth||560,h=270;c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);const counts={};completed.forEach(q=>counts[q.date]=(counts[q.date]||0)+1);let arr=[],d=new Date();d.setDate(d.getDate()-29);for(let i=0;i<30;i++){const k=U.day(d);arr.push(counts[k]||0);d.setDate(d.getDate()+1)}const max=Math.max(5,...arr),gap=3,pad=20,bw=(w-pad*2)/30-gap,accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#875cff";ctx.fillStyle="rgba(128,128,140,.08)";for(let y=0;y<5;y++)ctx.fillRect(pad,pad+y*(h-pad*2)/4,w-pad*2,1);arr.forEach((n,i)=>{const bh=(h-pad*2)*(n/max),x=pad+i*((w-pad*2)/30),y=h-pad-bh;ctx.fillStyle=n?accent:"rgba(128,128,140,.11)";ctx.beginPath();ctx.roundRect(x,y,Math.max(2,bw),Math.max(2,bh),3);ctx.fill()})
  },
  renderDifficulty(s){
    const entries=["Easy","Normal","Hard","Elite"].map(k=>[k,s.diff[k]||0]),max=Math.max(1,...entries.map(x=>x[1]));this.html("difficultyBars",entries.map(([k,n])=>`<div class="difficulty-row"><span>${k}</span><div class="mini-track"><i style="width:${n/max*100}%"></i></div><b>${n}</b></div>`).join(""))
  },
  renderCategories(s){
    const items=Object.entries(s.categories).sort((a,b)=>b[1]-a[1]).slice(0,8),max=Math.max(1,...items.map(x=>x[1]));this.html("categoryList",items.length?items.map(([k,n])=>`<div class="category-row"><span title="${U.esc(k)}">${U.esc(k)}</span><div class="mini-track"><i style="width:${n/max*100}%"></i></div><b>${n}</b></div>`).join(""):`<div class="empty-state"><strong>No categories yet.</strong>Finish quests to build this chart.</div>`)
  },
  renderCalendar(s){
    const counts={};s.completed.forEach(q=>counts[q.date]=(counts[q.date]||0)+1);let arr=[],d=new Date();d.setDate(d.getDate()-89);for(let i=0;i<90;i++){const k=U.day(d),n=counts[k]||0;arr.push(`<div class="calendar-cell ${n?`h${Math.min(4,n)}`:""}" title="${k}: ${n} quest${n===1?"":"s"}"></div>`);d.setDate(d.getDate()+1)}this.html("calendarHeat",arr.join(""))
  },
  renderCollection(){
    const l=F.levelInfo(),filter=this.collectionFilter,rewards=window.FORGE_REWARDS||[],owned=rewards.filter(r=>r.level<=l.level);this.text("collectionCount",owned.length);this.text("activeTitleDisplay",F.state.profile.activeTitle||"Rookie");this.text("activeAccentDisplay",F.state.profile.activeAccentName||"Violet Core");document.querySelectorAll("[data-collection-filter]").forEach(b=>b.classList.toggle("active",b.dataset.collectionFilter===filter));
    const items=rewards.filter(r=>filter==="all"||r.kind===filter);this.html("collectionGrid",items.map(r=>{const isOwned=r.level<=l.level,active=(r.kind==="title"&&F.state.profile.activeTitle===r.value)||(r.kind==="accent"&&F.state.profile.activeAccent===r.value)||(r.kind==="frame"&&F.state.profile.activeFrame===r.value);const icon=r.kind==="accent"?`<i style="width:22px;height:22px;border-radius:50%;background:${U.esc(r.value)};display:block"></i>`:r.kind==="title"?"T":r.kind==="frame"?"▢":"◆";return `<article class="collection-card ${isOwned?"owned":"locked"} reveal"><span class="collection-level">LVL ${r.level}</span><div class="collection-preview">${icon}</div><h4>${U.esc(r.name)}</h4><p>${U.esc(r.description)}</p>${isOwned&&["title","accent","frame"].includes(r.kind)?`<button class="${active?"secondary-btn":"primary-btn"} mini" data-equip="${r.level}">${active?"Equipped":"Equip"}</button>`:`<button class="secondary-btn mini" disabled>${isOwned?"Owned":"Locked"}</button>`}</article>`}).join(""))
  },
  renderSettings(){
    const p=F.state.profile,name=this.$("nameInput"),mix=this.$("mixSelect"),diff=this.$("difficultySelect");if(name&&document.activeElement!==name)name.value=p.name;if(mix)mix.value=p.mix;if(diff)diff.value=p.difficulty;this.$("motionToggle")?.classList.toggle("on",p.motion!==false);this.$("soundToggle")?.classList.toggle("on",!!p.sound)
  }
};
})();
