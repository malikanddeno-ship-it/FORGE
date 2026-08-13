(function(){
"use strict";
const F=window.FORGE,U=F.util;
let activeQuestId=null,selectedFile=null,previewUrl=null,commandQuery="";
const COMMANDS=[
  ["Today","Jump","today"],["Clips","Jump","clips"],["Progress","Jump","progress"],["Achievements","Jump","achievements"],["History","Jump","history"],["Analytics","Jump","analytics"],["Collection","Jump","collection"],["Settings","Jump","settings"],
  ["Reroll today's board","Action","reroll"],["Toggle theme","Action","theme"],["Toggle UI sounds","Action","sound"],["Export backup","Action","export"]
];
function $(id){return document.getElementById(id)}
function findQuest(id){for(const [,qs] of Object.entries(F.state.boards)){const q=(qs||[]).find(x=>x.id===id);if(q)return q}return null}
function todayQuest(id){return F.questEngine.ensure().find(q=>q.id===id)||null}
function closePreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}}
function openSubmit(id){
  const q=todayQuest(id);if(!q||q.completed)return;activeQuestId=id;selectedFile=null;closePreview();
  $("submitTitle").textContent=`${q.game} // ${q.title}`;$("submitQuest").innerHTML=`<strong>${U.esc(q.title)}</strong>${U.esc(q.description)}<br><span class="subtle">${U.esc(q.proofHint||"Attach proof.")}</span>`;
  $("clipInput").value="";$("clipNote").value="";$("clipDrop").classList.remove("has-file");$("clipDropTitle").textContent="Choose your clip";$("clipDropSub").textContent="Video or screenshot. Stored locally on this device.";$("selectedPreview").classList.add("hidden");$("selectedPreview").innerHTML="";$("completeQuestBtn").disabled=true;$("submitBackdrop").classList.remove("hidden");F.Effects.sound("tap")
}
function closeSubmit(){closePreview();selectedFile=null;activeQuestId=null;$("submitBackdrop").classList.add("hidden")}
function selectFile(file){
  const check=F.Clips.canStore(file);if(!check.ok){F.Effects.toast(check.reason,"error");F.Effects.sound("error");return}
  selectedFile=file;closePreview();previewUrl=URL.createObjectURL(file);$("clipDrop").classList.add("has-file");$("clipDropTitle").textContent=file.name||"Quest proof";$("clipDropSub").textContent=`${U.bytes(file.size)} • ready to forge`;const box=$("selectedPreview");box.innerHTML=file.type.startsWith("video")?`<video src="${previewUrl}" muted controls playsinline></video>`:`<img src="${previewUrl}" alt="Selected proof">`;box.classList.remove("hidden");$("completeQuestBtn").disabled=false;F.Effects.sound("toggle")
}
async function completeQuest(){
  const q=todayQuest(activeQuestId);if(!q||q.completed||!selectedFile)return;const btn=$("completeQuestBtn");btn.disabled=true;btn.innerHTML="FORGING...";
  const before=F.levelInfo();
  try{
    const rec=F.Clips.makeRecord({file:selectedFile,quest:q,note:$("clipNote").value});await F.Clips.put(rec);q.completed=true;q.clipId=rec.id;q.completedAt=new Date().toISOString();F.addXp(q.xp||0);const perfect=F.checkPerfect();const after=F.levelInfo();const fresh=F.evaluateAchievements();F.save(false);closeSubmit();F.UI.renderAll();F.Effects.sound("success");F.Effects.confetti(perfect.claimed?110:55);F.Effects.toast(`${q.title} // +${q.xp} XP`,"success");fresh.slice(0,2).forEach((a,i)=>setTimeout(()=>F.Effects.toast(`Achievement unlocked: ${a.name}`,"success",3400),500+i*500));if(after.level>before.level)setTimeout(()=>F.Effects.showLevelUp(after.level),700);if(perfect.claimed)setTimeout(()=>F.Effects.toast(`Perfect board bonus +${F.BONUS_XP} XP`,"success",3600),350)
  }catch(err){console.error(err);btn.disabled=false;btn.innerHTML="<span>✓</span> Complete Quest";F.Effects.toast("Couldn't store that clip. Try a smaller file or free browser storage.","error");F.Effects.sound("error")}
}
async function playClip(id){
  if(!id){F.Effects.toast("This proof file is no longer stored here.","error");return}let c;try{c=await F.Clips.get(id)}catch{}if(!c){F.Effects.toast("This proof file isn't on this device.","error");return}
  F.UI.revokeUrls();const url=F.UI.makeUrl(c.blob),video=String(c.type||"").startsWith("video");$("playerTitle").textContent=c.questTitle||"Quest proof";$("playerStage").innerHTML=video?`<video src="${url}" controls autoplay playsinline></video>`:`<img src="${url}" alt="Quest proof">`;$("playerInfo").innerHTML=`<span class="game-chip ${c.game==="VALORANT"?"val":"vrfs"}">${U.esc(c.game||"FORGE")}</span> &nbsp; ${new Date(c.createdAt).toLocaleString()} &nbsp; • &nbsp; ${U.bytes(c.size||c.blob?.size||0)}${c.note?`<br><br>${U.esc(c.note)}`:""}`;$("playerBackdrop").classList.remove("hidden");F.Effects.sound("tap")
}
function closePlayer(){$("playerBackdrop").classList.add("hidden");$("playerStage").innerHTML="";$("playerInfo").innerHTML="";F.UI.revokeUrls()}
async function removeClip(id){
  const c=await F.Clips.get(id);if(!c)return;if(!confirm(`Delete proof for “${c.questTitle}”? This will also undo that quest's XP.`))return;
  let target=null,targetDate=null;for(const [d,qs] of Object.entries(F.state.boards)){const q=(qs||[]).find(x=>x.clipId===id);if(q){target=q;targetDate=d;break}}
  const wasPerfect=targetDate&&F.state.boards[targetDate]?.length===5&&F.state.boards[targetDate].every(q=>q.completed);
  await F.Clips.delete(id);
  if(target){target.completed=false;target.clipId=null;target.completedAt=null;F.state.xp=Math.max(0,F.state.xp-(target.xp||0));if(wasPerfect&&F.state.bonusClaimed[targetDate]){delete F.state.bonusClaimed[targetDate];F.state.xp=Math.max(0,F.state.xp-F.BONUS_XP)}}
  F.save(false);await F.UI.renderClips();F.UI.renderHeader();F.UI.renderToday();F.UI.renderProgress();F.Effects.toast("Proof deleted. Quest progress rolled back.","normal")
}
function reroll(){const r=F.questEngine.reroll();if(!r.ok){F.Effects.toast(r.reason,"error");F.Effects.sound("error");return}F.Effects.sound("toggle");F.Effects.toast("Five fresh quests generated.","success");F.UI.renderAll();F.Effects.burst($("questBoard"))}
function updateCountdown(){
  const n=new Date(),next=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1),ms=next-n,h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);$("countdown").textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
}
function toggleTheme(){F.state.profile.theme=F.state.profile.theme==="light"?"dark":"light";F.save(false);F.applyAppearance();F.UI.renderAll();F.Effects.sound("toggle")}
function toggleSound(){F.state.profile.sound=!F.state.profile.sound;F.save(false);F.UI.renderAll();if(F.state.profile.sound)F.Effects.sound("success");F.Effects.toast(`UI sounds ${F.state.profile.sound?"on":"off"}.`)}
function exportBackup(){
  Promise.resolve(F.Clips.all()).then(clips=>{const metadata=clips.map(({blob,...rest})=>rest),payload={app:"FORGE OVERDRIVE",version:F.VERSION,exportedAt:new Date().toISOString(),data:F.state,clipMetadata:metadata,note:"Clip media blobs stay in the browser and are not included in this JSON."},blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`forge-overdrive-backup-${U.day()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);F.Effects.toast("Backup exported.","success")}).catch(()=>F.Effects.toast("Backup export failed.","error"))
}
async function importBackup(file){
  if(!file)return;try{const parsed=JSON.parse(await file.text()),incoming=parsed.data||parsed;if(!incoming||typeof incoming!=="object")throw new Error("Invalid backup");if(!confirm("Replace your current FORGE progression with this backup? Local clip files will stay on this device."))return;F.state=F.migrate(incoming);F.save(false);F.questEngine.ensure();F.applyAppearance();F.UI.renderAll();F.Effects.toast("Backup restored.","success")}catch(err){console.error(err);F.Effects.toast("That backup couldn't be read.","error")}finally{$("importInput").value=""}
}
async function resetAll(){
  if(!confirm("Reset FORGE progression and delete all locally stored proof clips?"))return;if(!confirm("Final check — this cannot be undone unless you exported a backup."))return;try{await F.Clips.clear()}catch{}F.state=F.defaultState();F.save(false);F.questEngine.ensure();F.applyAppearance();F.UI.renderAll();F.Effects.toast("FORGE reset.")
}
function equip(level){
  const r=F.rewardAtLevel(Number(level)),l=F.levelInfo();if(!r||r.level>l.level)return;if(r.kind==="title")F.state.profile.activeTitle=r.value;if(r.kind==="accent"){F.state.profile.activeAccent=r.value;F.state.profile.activeAccentName=r.name}if(r.kind==="frame")F.state.profile.activeFrame=r.value;F.save(false);F.applyAppearance();F.UI.renderAll();F.Effects.sound("success");F.Effects.toast(`${r.name} equipped.`,"success")
}
function resetCosmetics(){F.state.profile.activeTitle="Rookie";F.state.profile.activeAccent="#875cff";F.state.profile.activeAccentName="Violet Core";F.state.profile.activeFrame="default";F.save(false);F.applyAppearance();F.UI.renderAll();F.Effects.toast("Cosmetics reset.")}
function openCommand(){commandQuery="";$("commandInput").value="";renderCommands();$("commandBackdrop").classList.remove("hidden");setTimeout(()=>$("commandInput").focus(),20)}
function closeCommand(){$("commandBackdrop").classList.add("hidden")}
function renderCommands(){
  const q=commandQuery.trim().toLowerCase(),items=COMMANDS.map((c,i)=>({c,i})).filter(x=>!q||x.c[0].toLowerCase().includes(q));$("commandResults").innerHTML=items.length?items.map((x,i)=>`<button class="command-item ${i===0?"active":""}" data-command="${x.i}"><span>${U.esc(x.c[0])}</span><em>${U.esc(x.c[1])}</em></button>`).join(""):`<div class="empty-command">No command found.</div>`
}
function runCommand(i){const c=COMMANDS[Number(i)];if(!c)return;closeCommand();const action=c[2];if(["today","clips","progress","achievements","history","analytics","collection","settings"].includes(action))F.UI.switchView(action);else if(action==="reroll")reroll();else if(action==="theme")toggleTheme();else if(action==="sound")toggleSound();else if(action==="export")exportBackup()}
function saveQuestSettings(){const oldMix=F.state.profile.mix,oldDiff=F.state.profile.difficulty;F.state.profile.mix=$("mixSelect").value;F.state.profile.difficulty=$("difficultySelect").value;F.save(false);F.UI.renderAll();F.Effects.toast("Quest engine settings saved. New or rerolled boards use them.","success");if(oldMix!==F.state.profile.mix||oldDiff!==F.state.profile.difficulty)F.Effects.sound("toggle")}
function bind(){
  document.addEventListener("click",async e=>{
    const nav=e.target.closest("[data-view]");if(nav){F.UI.switchView(nav.dataset.view);return}
    const jump=e.target.closest("[data-view-jump]");if(jump){F.UI.switchView(jump.dataset.viewJump);return}
    const submit=e.target.closest("[data-submit-quest]");if(submit){openSubmit(submit.dataset.submitQuest);return}
    const proof=e.target.closest("[data-proof]");if(proof){await playClip(proof.dataset.proof);return}
    const fav=e.target.closest("[data-favorite]");if(fav){e.stopPropagation();await F.Clips.favorite(fav.dataset.favorite);F.Effects.sound("toggle");F.UI.renderClips();return}
    const del=e.target.closest("[data-delete-clip]");if(del){await removeClip(del.dataset.deleteClip);return}
    const equipBtn=e.target.closest("[data-equip]");if(equipBtn){equip(equipBtn.dataset.equip);return}
    const ach=e.target.closest("[data-achievement-filter]");if(ach){F.UI.achievementFilter=ach.dataset.achievementFilter;F.UI.renderAchievements();F.Effects.refresh();return}
    const hist=e.target.closest("[data-history-filter]");if(hist){F.UI.historyFilter=hist.dataset.historyFilter;F.UI.renderHistory();F.Effects.refresh();return}
    const cg=e.target.closest("[data-clip-game]");if(cg){F.UI.clipGame=cg.dataset.clipGame;F.UI.renderClips();return}
    const col=e.target.closest("[data-collection-filter]");if(col){F.UI.collectionFilter=col.dataset.collectionFilter;F.UI.renderCollection();F.Effects.refresh();return}
    const cmd=e.target.closest("[data-command]");if(cmd){runCommand(cmd.dataset.command);return}
  });
  $("rerollBoardBtn").addEventListener("click",reroll);$("themeBtn").addEventListener("click",toggleTheme);$("soundBtn").addEventListener("click",toggleSound);$("openCommand").addEventListener("click",openCommand);
  $("clipInput").addEventListener("change",e=>selectFile(e.target.files?.[0]));$("completeQuestBtn").addEventListener("click",completeQuest);$("closeSubmit").addEventListener("click",closeSubmit);$("cancelSubmit").addEventListener("click",closeSubmit);$("submitBackdrop").addEventListener("click",e=>{if(e.target.id==="submitBackdrop")closeSubmit()});
  $("closePlayer").addEventListener("click",closePlayer);$("playerBackdrop").addEventListener("click",e=>{if(e.target.id==="playerBackdrop")closePlayer()});$("closeLevelUp").addEventListener("click",()=>$("levelBackdrop").classList.add("hidden"));
  $("clipSearch").addEventListener("input",U.debounce(e=>{F.UI.clipQuery=e.target.value;F.UI.renderClips()},100));$("clipSort").addEventListener("change",e=>{F.UI.clipSort=e.target.value;F.UI.renderClips()});
  $("saveProfileBtn").addEventListener("click",()=>{F.state.profile.name=$("nameInput").value.trim()||"Player One";F.save(false);F.UI.renderAll();F.Effects.toast("Profile saved.","success")});$("saveQuestSettingsBtn").addEventListener("click",saveQuestSettings);
  $("motionToggle").addEventListener("click",()=>{F.state.profile.motion=F.state.profile.motion===false;F.save(false);F.applyAppearance();F.UI.renderSettings();F.Effects.toast(`Motion ${F.state.profile.motion?"on":"off"}.`)});$("soundToggle").addEventListener("click",toggleSound);
  $("exportBtn").addEventListener("click",exportBackup);$("importInput").addEventListener("change",e=>importBackup(e.target.files?.[0]));$("resetBtn").addEventListener("click",resetAll);$("resetCosmeticsBtn").addEventListener("click",resetCosmetics);
  $("commandInput").addEventListener("input",e=>{commandQuery=e.target.value;renderCommands()});$("commandBackdrop").addEventListener("click",e=>{if(e.target.id==="commandBackdrop")closeCommand()});
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommand()}if(e.key==="Escape"){closeSubmit();closePlayer();closeCommand();$("levelBackdrop").classList.add("hidden")}if(e.key==="Enter"&&!$("commandBackdrop").classList.contains("hidden")){document.querySelector(".command-item")?.click()}});
  addEventListener("resize",U.debounce(()=>{if(F.UI.view==="analytics")F.UI.renderAnalytics()},120));
}
async function boot(){
  F.load();F.questEngine.ensure();F.applyAppearance();bind();F.evaluateAchievements();F.UI.renderAll();updateCountdown();setInterval(updateCountdown,1000);setInterval(()=>{const d=U.day();if(!F.state.boards[d]){F.questEngine.ensure();F.save(false);F.UI.renderAll();F.Effects.toast("A new daily board is live.","success")}},30000);
  try{await F.Clips.requestPersistence()}catch{}F.UI.renderHeader();F.Effects.refresh();
  if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register("sw.js").catch(()=>{});
}
boot();
})();
