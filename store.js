// Zirlerberg – gemeinsamer Datenspeicher für Personal-App (index.html) und Gast-Seite (g.html)
// Firebase Firestore (live) oder Demo-Modus (nur dieses Gerät, localStorage)
export const DEFAULT_CFG={mode:'fb',topic:'zirlerberg-bkeg8h8y8',ntfy:'https://ntfy.sh',fb:{apiKey:"AIzaSyBCr5IslkKRXJPdpE_i_rGzVKlyW3FFPH8",authDomain:"zirlerberg-order.firebaseapp.com",projectId:"zirlerberg-order",storageBucket:"zirlerberg-order.firebasestorage.app",messagingSenderId:"915245253080",appId:"1:915245253080:web:da0f070e2fd201c22832ad"}};

export const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
export const dayKey=(ms=Date.now())=>{const d=new Date(ms-5*3600e3);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const setPath=(o,p,v)=>{const ks=p.split('.');let t=o;while(ks.length>1){const k=ks.shift();t=(t[k]??={})}t[ks[0]]=v};

function demo(){
  const subs=[];const key=c=>'zbd:'+c;
  const getCol=c=>LS.get(key(c),{}),putCol=(c,o)=>LS.set(key(c),o);
  const emit=col=>{const o=getCol(col);for(const s of subs.slice()){if(s.col!==col)continue;
    if(s.id)s.cb(o[s.id]?{...o[s.id],id:s.id}:null);
    else s.cb(Object.entries(o).map(([id,d])=>({...d,id})).filter(d=>!s.field||d[s.field]===s.value))}};
  addEventListener('storage',e=>{if(e.key&&e.key.startsWith('zbd:'))emit(e.key.slice(4))});
  const sub=s=>{subs.push(s);setTimeout(()=>emit(s.col));return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1)}};
  return{
    mode:'demo',async init(){},
    authUid(){let u=null;try{u=sessionStorage.getItem('zbd_uid')}catch(e){}if(!u){u='demo-'+uid();try{sessionStorage.setItem('zbd_uid',u)}catch(e){}}return u},
    async delDoc(path){const [col,id]=path.split('/');const o=getCol(col);delete o[id];putCol(col,o);emit(col)},
    subDoc(path,cb){const [col,id]=path.split('/');return sub({col,id,cb})},
    subCol(col,field,value,cb){return sub({col,field,value,cb})},
    async setDoc(path,data,merge){const [col,id]=path.split('/');const o=getCol(col);o[id]=merge?{...(o[id]||{}),...data}:data;putCol(col,o);emit(col)},
    async updDoc(path,patch){const [col,id]=path.split('/');const o=getCol(col);if(!o[id])throw new Error('Dokument fehlt: '+path);for(const k in patch)setPath(o[id],k,patch[k]);putCol(col,o);emit(col)},
    async batchUpd(list){const cols=new Set();for(const [path,patch] of list){const [col,id]=path.split('/');const o=getCol(col);if(!o[id])continue;for(const k in patch)setPath(o[id],k,patch[k]);putCol(col,o);cols.add(col)}cols.forEach(emit)},
    async claimSession(t){const o=getCol('tables');if(o[t]&&o[t].session)return o[t].session;const s=uid();o[t]={...(o[t]||{}),session:s,openedMs:Date.now()};putCol('tables',o);emit('tables');return s}
  };
}

function fb(cfg){
  let f,db,au;
  return{
    mode:'fb',
    async init(){
      const B='https://www.gstatic.com/firebasejs/10.12.2/';
      const [A,Au,fs]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
      f=fs;const app=A.initializeApp(cfg.fb);
      try{db=fs.initializeFirestore(app,{localCache:fs.persistentLocalCache({tabManager:fs.persistentMultipleTabManager()})})}catch(e){db=fs.getFirestore(app)}
      au=Au.getAuth(app);await Au.signInAnonymously(au);
    },
    // cb(null) = existiert sicher nicht; undefined = noch unbekannt (Cache)
    authUid(){return au&&au.currentUser?au.currentUser.uid:null},
    delDoc(path){return f.deleteDoc(f.doc(db,path))},
    subDoc(path,cb,err){return f.onSnapshot(f.doc(db,path),s=>cb(s.exists()?{...s.data(),id:s.id}:(s.metadata.fromCache?undefined:null)),err)},
    subCol(col,field,value,cb,err){const q=field?f.query(f.collection(db,col),f.where(field,'==',value)):f.collection(db,col);return f.onSnapshot(q,s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),err)},
    setDoc(path,data,merge){return f.setDoc(f.doc(db,path),data,merge?{merge:true}:{})},
    updDoc(path,patch){return f.updateDoc(f.doc(db,path),patch)},
    batchUpd(list){const b=f.writeBatch(db);for(const [p,patch] of list)b.update(f.doc(db,p),patch);return b.commit()},
    claimSession(t){const ref=f.doc(db,'tables/'+t);return f.runTransaction(db,async tx=>{const s=await tx.get(ref);if(s.exists()&&s.data().session)return s.data().session;const ns=uid();tx.set(ref,{session:ns,openedMs:Date.now()},{merge:true});return ns})}
  };
}
export function makeStore(cfg){return cfg&&cfg.mode==='fb'?fb(cfg):demo()}

// ntfy-Push (kostenlos, ohne Konto)
export function push(cfg,topic,title,message,tags){if(!cfg||!cfg.topic)return;
  fetch((cfg.ntfy||'https://ntfy.sh').replace(/\/$/,'')+'/',{method:'POST',body:JSON.stringify({topic,title,message,tags,priority:5,click:location.origin+location.pathname.replace(/[^/]*$/,'')})}).catch(()=>{})}

// Verfügbarkeit: Küchen-Gerichte nur wenn heute aktiviert; Bar/Shisha standardmäßig verfügbar (außer heute deaktiviert)
export function isAvail(item,cat,today){const fresh=today&&today.day===dayKey();
  if(cat&&cat.st==='kueche')return !!(fresh&&today.on&&today.on[item.id]);
  return !(fresh&&today.off&&today.off[item.id])}
// ---------- Öffnungszeiten pro Wochentag ----------
// conf.week = {0:{o:'10:30',c:'23:00'}, 1:null (Ruhetag), ...}  (0=So … 6=Sa)
export const DEFAULT_WEEK={0:{o:'10:30',c:'23:00'},1:null,2:{o:'10:30',c:'21:00'},3:{o:'10:30',c:'21:00'},4:{o:'10:30',c:'21:00'},5:{o:'10:30',c:'23:00'},6:{o:'10:30',c:'23:00'}};
const hm=s=>{const [h,m]=String(s||'0:0').split(':').map(Number);return h*60+(m||0)};
export function weekOf(conf){if(conf&&conf.week)return conf.week;const h=conf&&conf.hours;if(h&&h.open){const d={o:h.open,c:h.close};return {0:d,1:d,2:d,3:d,4:d,5:d,6:d}}return DEFAULT_WEEK}
export function dayHours(conf,d=new Date()){const w=weekOf(conf)[d.getDay()];return w&&w.o&&w.c?w:null}
// Zeitfenster eines Tages in Minuten (Schluss nach Mitternacht -> +1440)
function win(w,pre=0,post=0){const o=hm(w.o),c0=hm(w.c),c=c0<=o?c0+1440:c0;return [o-pre,c+post]}
function inWin(conf,d,pre,post){const m=d.getHours()*60+d.getMinutes();
  const t=dayHours(conf,d);if(t){const [a,b]=win(t,pre,post);if(m>=a&&m<b)return true}
  const y=new Date(d);y.setDate(d.getDate()-1);const p=dayHours(conf,y);if(p){const [a,b]=win(p,pre,post);if(b>1440&&m<b-1440)return true}
  return false}
export function isOpenNow(conf,d=new Date()){return inWin(conf,d,0,0)}
// Personal-App aktiv: 30 Min vor Öffnung bis 60 Min nach Schluss
export const PRE=30,POST=60;
export function staffActive(conf,d=new Date()){return inWin(conf,d,PRE,POST)}
// nächste Öffnung ab jetzt: {d:Date(Tag), o:'10:30', today:bool}
export function nextOpen(conf,d=new Date()){const m=d.getHours()*60+d.getMinutes();
  for(let i=0;i<8;i++){const x=new Date(d);x.setDate(d.getDate()+i);const t=dayHours(conf,x);if(!t)continue;if(i===0&&hm(t.o)<=m)continue;return {d:x,o:t.o,today:i===0,inDays:i}}return null}
export function closeToday(conf,d=new Date()){const t=dayHours(conf,d);return t?t.c:null}

// ---------- Bereiche & Tische ----------
export const ZONES=[{id:'bar',name:'Bar & Eingang',from:1,to:9},{id:'saal',name:'Hauptsaal',from:11,to:29},{id:'fenster',name:'Panorama-Fenster',from:31,to:39},{id:'neben',name:'Nebenraum',from:41,to:49},{id:'terr',name:'Dachterrasse',from:51,to:69,shisha:true},{id:'terr2',name:'Terrasse überdacht',from:71,to:79,shisha:true},{id:'togo',name:'To-go / Theke',from:99,to:99}];
// conf.zones = [{id,name,shisha,tables:['1','2',…]}]
export function zonesFromLegacy(tables){const tb=(tables||[]).map(String);const zs=ZONES.map(z=>({id:z.id,name:z.name,shisha:!!z.shisha,tables:tb.filter(t=>+t>=z.from&&+t<=z.to)}));
  const rest=tb.filter(t=>!zs.some(z=>z.tables.includes(t)));if(rest.length)zs.push({id:'misc',name:'Weitere',shisha:false,tables:rest});return zs}
export function zonesOf(conf){return conf&&Array.isArray(conf.zones)?conf.zones:zonesFromLegacy(conf&&conf.tables)}
export function zoneOf(t,conf){if(conf&&Array.isArray(conf.zones))return conf.zones.find(z=>(z.tables||[]).map(String).includes(String(t)))||null;
  return ZONES.find(z=>+t>=z.from&&+t<=z.to)||null}
export function allTablesOf(conf){return zonesOf(conf).flatMap(z=>(z.tables||[]).map(String))}
export const isTerrace=(t,conf)=>{const z=zoneOf(t,conf);return !!z&&(z.shisha===true||(!conf||!conf.zones)&&(z.id==='terr'||z.id==='terr2'))};

// ---------- Schicht & persönliche Push-Kanäle ----------
const hash=s=>{let h=5381;for(const c of String(s))h=(((h<<5)+h)^c.codePointAt(0))>>>0;return h.toString(36)};
export const personalTopic=(cfg,name)=>cfg.topic+'-p-'+hash(String(name||'').trim().toLowerCase());
// Push an alle Eingeloggten einer Rolle/Station; wenn niemand im Dienst: Sammel-Topic als Reserve
export function pushShift(cfg,shifts,filter,fallback,title,msg,tags){if(!cfg||!cfg.topic)return;
  const tps=[...new Set((shifts||[]).filter(filter).map(s=>s.topic).filter(Boolean))];
  if(!tps.length&&fallback)tps.push(fallback);for(const tp of tps)push(cfg,tp,title,msg,tags)}
