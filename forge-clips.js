(function(){
"use strict";
const F=window.FORGE=window.FORGE||{};
const DB_NAME="forge_daily_clips";
const DB_VERSION=2;
const STORE="clips";
let dbPromise=null;
function open(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      let store;
      if(!db.objectStoreNames.contains(STORE))store=db.createObjectStore(STORE,{keyPath:"id"});
      else store=req.transaction.objectStore(STORE);
      if(!store.indexNames.contains("game"))store.createIndex("game","game",{unique:false});
      if(!store.indexNames.contains("createdAt"))store.createIndex("createdAt","createdAt",{unique:false});
      if(!store.indexNames.contains("favorite"))store.createIndex("favorite","favorite",{unique:false});
      if(!store.indexNames.contains("date"))store.createIndex("date","date",{unique:false});
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>{dbPromise=null;reject(req.error)};
    req.onblocked=()=>console.warn("FORGE clip database upgrade is blocked by another tab.");
  });
  return dbPromise;
}
function tx(mode,fn){return open().then(db=>new Promise((resolve,reject)=>{
  const t=db.transaction(STORE,mode),s=t.objectStore(STORE);let result;
  try{result=fn(s,t)}catch(err){reject(err);return}
  t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error("Clip transaction aborted"));
}))}
const C=F.Clips={
  async put(record){await tx("readwrite",s=>s.put(record));return record},
  async get(id){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})},
  async all(){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})},
  async delete(id){await tx("readwrite",s=>s.delete(id))},
  async clear(){await tx("readwrite",s=>s.clear())},
  async update(id,patch){const item=await this.get(id);if(!item)return null;Object.assign(item,patch,{updatedAt:new Date().toISOString()});await this.put(item);return item},
  async favorite(id,value){const item=await this.get(id);if(!item)return null;item.favorite=value===undefined?!item.favorite:!!value;item.updatedAt=new Date().toISOString();await this.put(item);return item},
  async count(){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).count();r.onsuccess=()=>resolve(r.result||0);r.onerror=()=>reject(r.error)})},
  async stats(){const all=await this.all();return{count:all.length,bytes:all.reduce((a,c)=>a+(Number(c.size)||Number(c.blob?.size)||0),0),favorites:all.filter(c=>c.favorite).length,val:all.filter(c=>c.game==="VALORANT").length,vrfs:all.filter(c=>c.game==="VRFS").length}},
  async removeOrphans(){const valid=new Set(F.completedQuests().map(q=>q.clipId).filter(Boolean)),all=await this.all();const orphans=all.filter(c=>!valid.has(c.id));for(const c of orphans)await this.delete(c.id);return orphans.length},
  makeRecord({file,quest,note=""}){return{id:F.util.uid(),questId:quest.id,sourceId:quest.sourceId||null,questTitle:quest.title,questDescription:quest.description,category:quest.category||"Other",difficulty:quest.difficulty||"Normal",rarity:quest.rarity||"Common",game:quest.game,date:F.util.day(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),name:file.name||"proof",type:file.type||"application/octet-stream",size:file.size||0,note:String(note||"").slice(0,120),favorite:false,blob:file}},
  canStore(file){const max=500*1024*1024;if(!file)return{ok:false,reason:"Choose a clip first."};if(file.size>max)return{ok:false,reason:"That file is over 500 MB. Trim the clip first."};if(!/^(video|image)\//.test(file.type||""))return{ok:false,reason:"Use a video or screenshot."};return{ok:true}},
  async usage(){
    const own=await this.stats();let quota=null,used=null;
    try{if(navigator.storage?.estimate){const e=await navigator.storage.estimate();quota=e.quota||null;used=e.usage||null}}catch{}
    return{...own,quota,used,pct:quota&&used?Math.min(100,used/quota*100):null};
  },
  async requestPersistence(){try{return navigator.storage?.persist?await navigator.storage.persist():false}catch{return false}},
  close(){if(dbPromise){dbPromise.then(db=>db.close()).catch(()=>{});dbPromise=null}}
};
})();
