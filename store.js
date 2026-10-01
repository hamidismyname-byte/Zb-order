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
    subDoc(path,cb){const [col,id]=path.split('/');return sub({col,id,cb})},
    subCol(col,field,value,cb){return sub({col,field,value,cb})},
    async setDoc(path,data,merge){const [col,id]=path.split('/');const o=getCol(col);o[id]=merge?{...(o[id]||{}),...data}:data;putCol(col,o);emit(col)},
    async updDoc(path,patch){const [col,id]=path.split('/');const o=getCol(col);if(!o[id])throw new Error('Dokument fehlt: '+path);for(const k in patch)setPath(o[id],k,patch[k]);putCol(col,o);emit(col)},
    async batchUpd(list){const cols=new Set();for(const [path,patch] of list){const [col,id]=path.split('/');const o=getCol(col);if(!o[id])continue;for(const k in patch)setPath(o[id],k,patch[k]);putCol(col,o);cols.add(col)}cols.forEach(emit)},
    async claimSession(t){const o=getCol('tables');if(o[t]&&o[t].session)return o[t].session;const s=uid();o[t]={...(o[t]||{}),session:s,openedMs:Date.now()};putCol('tables',o);emit('tables');return s}
  };
}

function fb(cfg){
  let f,db;
  return{
    mode:'fb',
    async init(){
      const B='https://www.gstatic.com/firebasejs/10.12.2/';
      const [A,Au,fs]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
      f=fs;const app=A.initializeApp(cfg.fb);
      try{db=fs.initializeFirestore(app,{localCache:fs.persistentLocalCache({tabManager:fs.persistentMultipleTabManager()})})}catch(e){db=fs.getFirestore(app)}
      await Au.signInAnonymously(Au.getAuth(app));
    },
    // cb(null) = existiert sicher nicht; undefined = noch unbekannt (Cache)
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
export function isOpenNow(hours,d=new Date()){if(!hours||!hours.open||!hours.close)return true;
  const m=d.getHours()*60+d.getMinutes(),[oh,om]=hours.open.split(':').map(Number),[ch,cm]=hours.close.split(':').map(Number);
  const o=oh*60+om,c=ch*60+cm;return c>o?(m>=o&&m<c):(m>=o||m<c)}
export const ZONES=[{id:'bar',name:'Bar & Eingang',from:1,to:9},{id:'saal',name:'Hauptsaal',from:11,to:29},{id:'fenster',name:'Panorama-Fenster',from:31,to:39},{id:'neben',name:'Nebenraum',from:41,to:49},{id:'terr',name:'Dachterrasse',from:51,to:69},{id:'terr2',name:'Terrasse überdacht',from:71,to:79},{id:'togo',name:'To-go / Theke',from:99,to:99}];
export const zoneOf=t=>ZONES.find(z=>+t>=z.from&&+t<=z.to);
export const isTerrace=t=>{const z=zoneOf(t);return !!z&&(z.id==='terr'||z.id==='terr2')};
