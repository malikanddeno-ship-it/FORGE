(function(){
"use strict";
const F=window.FORGE=window.FORGE||{};
let audioCtx=null;
function audio(){
  if(!F.state?.profile?.sound)return null;
  try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();return audioCtx}catch{return null}
}
function tone(freq=440,duration=.08,type="sine",gain=.025,delay=0){
  const ctx=audio();if(!ctx)return;
  const o=ctx.createOscillator(),g=ctx.createGain(),start=ctx.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(gain,start+.01);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
  o.connect(g);g.connect(ctx.destination);o.start(start);o.stop(start+duration+.02);
}
const E=F.Effects={
  sound(kind="tap"){
    if(kind==="success"){tone(520,.12,"sine",.035);tone(760,.16,"sine",.028,.08);tone(980,.18,"sine",.02,.16)}
    else if(kind==="level"){tone(392,.15,"triangle",.04);tone(523,.16,"triangle",.035,.1);tone(659,.18,"triangle",.03,.2);tone(784,.24,"triangle",.026,.3)}
    else if(kind==="error"){tone(180,.14,"sawtooth",.018);tone(140,.18,"sawtooth",.012,.07)}
    else if(kind==="toggle"){tone(640,.05,"sine",.018)}
    else tone(420,.045,"sine",.012)
  },
  toast(message,type="normal",timeout=2600){
    const wrap=document.getElementById("toastWrap");if(!wrap)return;
    const el=document.createElement("div");el.className=`toast ${type}`;el.innerHTML=`<span>${type==="success"?"✓":type==="error"?"!":"•"}</span><b>${F.util.esc(message)}</b>`;wrap.appendChild(el);
    requestAnimationFrame(()=>el.classList.add("show"));setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),260)},timeout)
  },
  confetti(count=80){
    if(F.state.profile.motion===false)return;const layer=document.getElementById("confettiLayer");if(!layer)return;
    const colors=[F.state.profile.activeAccent||"#875cff","#59d6ff","#57e3a4","#ffc85c","#ff6c7b","#ffffff"];
    for(let i=0;i<count;i++){
      const p=document.createElement("i");p.className="confetti";p.style.left=`${Math.random()*100}%`;p.style.setProperty("--dy",`${70+Math.random()*55}vh`);p.style.setProperty("--dx",`${-100+Math.random()*200}px`);p.style.setProperty("--rot",`${360+Math.random()*1080}deg`);p.style.animationDelay=`${Math.random()*.35}s`;p.style.animationDuration=`${1.8+Math.random()*1.8}s`;p.style.background=colors[Math.floor(Math.random()*colors.length)];p.style.width=`${5+Math.random()*6}px`;p.style.height=`${8+Math.random()*10}px`;layer.appendChild(p);setTimeout(()=>p.remove(),4200)
    }
  },
  burst(el){
    if(!el||F.state.profile.motion===false)return;el.animate([{transform:"scale(1)"},{transform:"scale(1.035)"},{transform:"scale(1)"}],{duration:320,easing:"cubic-bezier(.2,.9,.2,1)"})
  },
  reveal(){
    document.querySelectorAll(".reveal:not(.shown)").forEach((el,i)=>{el.style.setProperty("--reveal-delay",`${Math.min(i*35,240)}ms`);requestAnimationFrame(()=>el.classList.add("shown"))})
  },
  attachTilts(){
    if(F.state.profile.motion===false||matchMedia("(pointer: coarse)").matches)return;
    document.querySelectorAll(".quest-card,.clip-card,.collection-card,.achievement-card").forEach(card=>{
      if(card.dataset.tiltBound)return;card.dataset.tiltBound="1";
      card.addEventListener("pointermove",e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty("--rx",`${(-y*3.2).toFixed(2)}deg`);card.style.setProperty("--ry",`${(x*4.2).toFixed(2)}deg`);card.style.setProperty("--mx",`${((x+.5)*100).toFixed(1)}%`);card.style.setProperty("--my",`${((y+.5)*100).toFixed(1)}%`) });
      card.addEventListener("pointerleave",()=>{card.style.setProperty("--rx","0deg");card.style.setProperty("--ry","0deg")})
    })
  },
  showLevelUp(level){
    const reward=F.rewardAtLevel(level),back=document.getElementById("levelBackdrop");document.getElementById("levelUpNumber").textContent=level;document.getElementById("levelUpReward").textContent=reward?`${reward.name} unlocked — ${reward.kind}.`:"Another level forged.";back?.classList.remove("hidden");this.sound("level");this.confetti(120)
  },
  refresh(){this.reveal();this.attachTilts()}
};
})();
