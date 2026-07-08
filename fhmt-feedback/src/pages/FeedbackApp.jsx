import { useState, useEffect, useCallback, useRef } from "react";
import { dbGet, dbSet } from "../firebase";
import logoImg from '../Logo/Logo.png';

// 「管理員回覆」總開關。
// false = 這一輪關閉「管理員回覆」功能：測試員只送出回饋，不會被引導去看/等回覆
//         （登入頁、送出後、左側 Nav、replies 檢視畫面全部隱藏）。
// 要恢復「查看管理員回覆」流程時，把它設回 true 即可，其餘程式碼原封不動。
const REPLIES_ENABLED = false;

const safeId = s => s.replace(/[.#$[\]]/g, '_');

function compressToDataUrl(file, maxW = 600, quality = 0.70) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const webp = canvas.toDataURL('image/webp', quality);
      // 若瀏覽器不支援 WebP 則退回 JPEG
      resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

const SCALES = {
  default: { options:["ok","confused"], labels:{ok:"✅ 通過",confused:"❌ 不通過"}, colors:{ok:"#5a8a3c",confused:"#a05520"} },
  like:    { options:["ok","weird","confused"], labels:{ok:"😍 很好",weird:"🙂 還行",confused:"😕 怪怪的"}, colors:{ok:"#5a8a3c",weird:"#b0953a",confused:"#a05520"} },
  speed:   { options:["ok","weird","confused"], labels:{ok:"⚡ 很順",weird:"🙂 普通",confused:"🐌 有點卡"}, colors:{ok:"#5a8a3c",weird:"#b0953a",confused:"#a05520"} },
  easy:    { options:["ok","weird","confused"], labels:{ok:"👍 很直覺",weird:"🙂 還 OK",confused:"😕 卡住"}, colors:{ok:"#5a8a3c",weird:"#b0953a",confused:"#a05520"} },
};

const parseVal = r => { if (!r) return null; return typeof r === 'string' ? JSON.parse(r) : r; };
async function loadQ()        { return parseVal(await dbGet('kv/questions')); }
async function loadPasscode() { return await dbGet('kv/passcode'); }
async function loadGroupCodes() { return parseVal(await dbGet('kv/groupCodes')); }
async function loadFormStatus() { return parseVal(await dbGet('kv/formStatus')); }
async function saveF(uid, d)  { return await dbSet(`kv/feedbacks/${safeId(uid)}`, JSON.stringify(d)); }
async function loadF(uid)     { return parseVal(await dbGet(`kv/feedbacks/${safeId(uid)}`)); }
async function loadAllF()      { return await dbGet('kv/feedbacks'); }

function PasscodeGate({ onPass }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const handleSubmit = async () => {
    if (!code.trim()) return;
    setChecking(true); setError("");
    const entered = code.trim();
    const groupCodes = await loadGroupCodes();   // { A:"碼", B:"碼", ... } 或 null
    const master = await loadPasscode();         // 舊版單一總通行碼（可看全部）或 null
    // 1) 比對組別通行碼 → 只看到該組的關卡
    if (groupCodes && typeof groupCodes === 'object') {
      const hit = Object.entries(groupCodes).find(([, c]) => c && String(c).trim() === entered);
      if (hit) { onPass(hit[0]); setChecking(false); return; }
    }
    // 2) 比對總通行碼 → 看得到全部關卡（管理方預覽用）
    if (master && entered === String(master).trim()) { onPass(null); setChecking(false); return; }
    // 3) 完全沒設定任何通行碼 → 開放進入
    if ((!groupCodes || Object.keys(groupCodes).length === 0) && !master) { onPass(null); setChecking(false); return; }
    setError("通行碼不正確，請確認後再試");
    setChecking(false);
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)",padding:20}}>
      <div style={{width:"100%",maxWidth:400,padding:"44px 32px",borderRadius:20,background:"rgba(255,255,255,.75)",backdropFilter:"blur(20px)",boxShadow:"0 8px 40px rgba(91,58,31,.08)",border:"1px solid rgba(255,255,255,.6)",textAlign:"center"}}>
        <img src={logoImg} alt="Logo" style={{width:60,height:60,objectFit:"contain",marginBottom:12}}/>
        <h1 style={{margin:"0 0 6px",fontSize:22,color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif"}}>方壺山道場</h1>
        <p style={{margin:"0 0 24px",fontSize:14,color:"#9a8a6e"}}>請輸入通行碼以進入測試回饋系統</p>
        <input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="請輸入通行碼" type="password" autoFocus style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`2px solid ${error?"#c44028":"rgba(0,0,0,.12)"}`,fontSize:15,textAlign:"center",background:"rgba(255,255,255,.8)",boxSizing:"border-box",outline:"none",letterSpacing:2,fontFamily:"monospace"}} />
        {error && <p style={{margin:"8px 0 0",fontSize:13,color:"#c44028"}}>{error}</p>}
        <button onClick={handleSubmit} disabled={checking||!code.trim()} style={{width:"100%",marginTop:16,padding:"12px 0",borderRadius:12,background:code.trim()?"linear-gradient(135deg,#8B5A2B,#A67B5B)":"#d5cfc3",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:code.trim()?"pointer":"default",letterSpacing:1}}>{checking?"驗證中...":"進入"}</button>
        <p style={{margin:"16px 0 0",fontSize:12,color:"#b8ad9c"}}>通行碼由管理方提供</p>
      </div>
    </div>
  );
}

function Chip({value,scale="default",onChange}) {
  const s=SCALES[scale]||SCALES.default;
  return (<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{s.options.map(o=>{const a=value===o;return(<button key={o} onClick={()=>onChange(a?null:o)} style={{padding:"6px 14px",borderRadius:20,border:`2px solid ${s.colors[o]}`,background:a?s.colors[o]:"transparent",color:a?"#fff":s.colors[o],fontWeight:600,fontSize:13,cursor:"pointer",transition:"all .15s",opacity:value&&!a?0.45:1,whiteSpace:"nowrap"}}>{s.labels[o]}</button>);})}</div>);
}

function Item({item,answer,scale,onAnswer,uid,submitAttempted}) {
  const [exp,setExp]=useState(false);
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef(null);
  const status=answer?.status;
  const hc=answer?.comment?.trim().length>0;
  const needReason=status==="confused";          // 最負面選項 → 必填原因
  const hasStatus=status==="weird"||status==="confused";
  const showComment=exp||needReason;             // 不通過 → 原因框自動展開
  const missingReason=needReason&&!hc;
  const showErr=missingReason&&submitAttempted;   // 按過送出才轉紅
  const images=answer?.images||[];

  const handleUpload=async(e)=>{
    const files=Array.from(e.target.files).slice(0,2-images.length);
    if(!files.length)return;
    e.target.value='';
    setUploading(true);
    const dataUrls=[];
    for(const f of files){
      const du=await compressToDataUrl(f);
      if(du)dataUrls.push(du);
    }
    onAnswer({...answer,images:[...images,...dataUrls]});
    setUploading(false);
  };

  const removeImg=(idx)=>onAnswer({...answer,images:images.filter((_,i)=>i!==idx)});

  return(<div id={"item-"+item.id} style={{padding:"14px 16px",borderRadius:10,background:showErr?"rgba(196,64,40,.08)":status==="weird"?"rgba(196,144,0,.07)":status==="confused"?"rgba(160,85,32,.07)":"rgba(255,255,255,.5)",border:`1px solid ${showErr?"#c44028":status==="weird"?"rgba(196,144,0,.25)":status==="confused"?"rgba(160,85,32,.2)":"rgba(0,0,0,.06)"}`,transition:"all .2s"}}>
    <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
      <span style={{fontSize:12,color:"#9a8a6e",fontWeight:700,minWidth:36,paddingTop:2,fontFamily:"monospace"}}>{item.id}</span>
      <div style={{flex:1,minWidth:200}}><p style={{margin:0,fontSize:14,lineHeight:1.6,color:"#3d3225"}}>{item.text}</p></div>
      <Chip value={answer?.status} scale={scale} onChange={v=>onAnswer({...answer,status:v})} />
    </div>
    {hasStatus&&(<div style={{marginTop:10}}>
      {needReason
        ? <div style={{fontSize:12.5,fontWeight:700,color:missingReason?(showErr?"#c44028":"#b5651d"):"#5a8a3c",padding:"2px 0"}}>{missingReason?"⚠ 請說明哪裡不通過（必填）":"✓ 已填寫原因"}</div>
        : <button onClick={()=>setExp(!exp)} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:hc?"#8B5A2B":"#a09880",display:"flex",alignItems:"center",gap:4,padding:"2px 0"}}><span>{exp?"▾":"▸"}</span><span>{hc?"✎ 已留言":"想說的話...（可不填）"}</span></button>}
      {showComment&&<textarea value={answer?.comment||""} onChange={e=>onAnswer({...answer,comment:e.target.value})} placeholder={needReason?"請簡單說明哪裡不通過、你怎麼操作的…":"有什麼想說的？"} style={{width:"100%",marginTop:6,padding:10,borderRadius:8,fontSize:13,border:`1px solid ${showErr?"#c44028":"rgba(0,0,0,.1)"}`,background:"rgba(255,255,255,.8)",resize:"vertical",minHeight:60,fontFamily:"inherit",lineHeight:1.5,boxSizing:"border-box",outline:"none"}} />}
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
        {images.map((url,i)=>(
          <div key={i} style={{position:"relative"}}>
            <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="" style={{width:72,height:54,objectFit:"cover",borderRadius:6,border:"1px solid rgba(0,0,0,.1)",display:"block"}}/></a>
            <button onClick={()=>removeImg(i)} style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:9,background:"#c44028",border:"none",color:"#fff",fontSize:11,cursor:"pointer",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>×</button>
          </div>
        ))}
        {images.length<2&&(
          <label style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:8,border:"1px dashed rgba(0,0,0,.18)",cursor:"pointer",fontSize:12,color:"#9a8a6e",background:"rgba(255,255,255,.5)"}}>
            {uploading?"上傳中...":"📷 附圖"}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{display:"none"}} disabled={uploading}/>
          </label>
        )}
      </div>
    </div>)}
  </div>);
}

function PartView({part,answers,onAnswer,uid,submitAttempted}) {
  return(<div>
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:28}}>{part.icon}</span><h2 style={{margin:0,fontSize:20,color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif"}}>{part.subtitle}</h2></div>
      {part.description&&<div style={{padding:"12px 16px",borderRadius:10,background:"rgba(255,249,230,.8)",border:"1px solid rgba(212,160,23,.2)",fontSize:13,color:"#6b5830",lineHeight:1.7,whiteSpace:"pre-line",marginTop:8}}>{part.description}</div>}
    </div>
    {part.sections.map((sec,si)=>(<div key={si} style={{marginBottom:28}}>
      <h3 style={{margin:"0 0 6px",fontSize:15,color:"#6B4E2E",borderLeft:"3px solid #C89B7B",paddingLeft:10}}>{sec.title}</h3>
      {sec.note&&<p style={{margin:"0 0 10px",fontSize:12.5,color:"#9a8a6e",lineHeight:1.6,paddingLeft:14}}>{sec.note}</p>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{sec.items.map(item=><Item key={item.id} item={item} answer={answers[item.id]} scale={sec.scale||"default"} onAnswer={a=>onAnswer(item.id,a)} uid={uid} submitAttempted={submitAttempted}/>)}</div>
    </div>))}
  </div>);
}

function Freeform({answers,onAnswer}) {
  const fs=[{key:"other",title:"💬 其他想說的話",ph:"任何想法都歡迎"}];
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}><span style={{fontSize:28}}>💬</span><h2 style={{margin:0,fontSize:20,color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif"}}>自由回饋</h2></div>
    <p style={{color:"#6b5830",fontSize:13.5,marginBottom:20}}>這是最後一段，你的心聲最重要。</p>
    {fs.map(f=>(<div key={f.key} style={{marginBottom:24}}><h3 style={{fontSize:15,color:"#6B4E2E",borderLeft:"3px solid #C89B7B",paddingLeft:10,margin:"0 0 8px"}}>{f.title}</h3><textarea value={answers?.[f.key]||""} onChange={e=>onAnswer(f.key,e.target.value)} placeholder={f.ph} style={{width:"100%",padding:12,borderRadius:10,fontSize:14,border:"1px solid rgba(0,0,0,.1)",background:"rgba(255,255,255,.7)",resize:"vertical",minHeight:90,fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box",outline:"none"}} /></div>))}
  </div>);
}

function RepliesView({answers,parts,freeform,freeformReplies}) {
  const items=[];
  const seen=new Set();
  for(const p of parts)for(const sec of p.sections)for(const it of sec.items){if(seen.has(it.id))continue;seen.add(it.id);const a=answers[it.id];const has=(a?.reply&&String(a.reply).trim())||(a?.replyImages&&a.replyImages.length>0);if(has)items.push({type:"item",id:it.id,text:it.text,part:p,a});}
  // 自由回饋的回覆
  if(freeformReplies){
    Object.entries(freeformReplies).forEach(([k,fr])=>{
      const has=(fr?.text&&String(fr.text).trim())||(fr?.images&&fr.images.length>0);
      if(has)items.push({type:"freeform",id:k,key:k,fr,userText:freeform?.[k]});
    });
  }
  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:28}}>📣</span><h2 style={{margin:0,fontSize:20,color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif"}}>管理員回覆</h2></div>
    <p style={{color:"#6b5830",fontSize:13.5,marginBottom:20}}>謝謝你的回報！下面是管理員針對你回報項目的回覆。</p>
    {items.length===0?<p style={{color:"#9a8a6e",fontSize:14}}>目前還沒有回覆，過幾天再回來看看 🙏</p>
    :<div style={{display:"flex",flexDirection:"column",gap:12}}>{items.map((it,idx)=>{
      if(it.type==="item"){
        const {id,text,part,a}=it;
        return(<div key={"i-"+id} style={{padding:"14px 16px",borderRadius:12,background:"rgba(255,255,255,.6)",border:"1px solid rgba(0,0,0,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <span style={{fontSize:11.5,fontWeight:700,color:"#8B5A2B",background:"rgba(139,90,43,.1)",padding:"3px 11px",borderRadius:20}}>{part.icon} {part.subtitle}</span>
            <span style={{fontSize:11.5,fontFamily:"monospace",color:"#9a8a6e"}}>#{id}</span>
          </div>
          <div style={{fontSize:14,lineHeight:1.6,color:"#3d3225",fontWeight:500}}>{text}</div>
          {a.comment&&<div style={{marginTop:8,fontSize:13,lineHeight:1.6,color:"#6b5830",fontStyle:"italic"}}>你的回報：「{a.comment}」</div>}
          <div style={{marginTop:10,padding:"10px 13px",borderRadius:8,background:"rgba(107,142,78,.08)",borderLeft:"3px solid #6B8E4E"}}>
            <div style={{fontSize:11.5,fontWeight:700,color:"#5a8a3c",marginBottom:4}}>📣 管理員回覆</div>
            {a.reply&&<div style={{fontSize:14,lineHeight:1.65,color:"#3d4a2e",whiteSpace:"pre-wrap"}}>{a.reply}</div>}
            {a.replyImages?.length>0&&<div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>{a.replyImages.map((u,i)=>(<a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{width:120,height:90,objectFit:"cover",borderRadius:6,border:"1px solid rgba(0,0,0,.1)",display:"block"}}/></a>))}</div>}
          </div>
        </div>);
      } else {
        const {key,fr,userText}=it;
        return(<div key={"f-"+key} style={{padding:"14px 16px",borderRadius:12,background:"rgba(255,255,255,.6)",border:"1px solid rgba(0,0,0,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <span style={{fontSize:11.5,fontWeight:700,color:"#8B5A2B",background:"rgba(139,90,43,.1)",padding:"3px 11px",borderRadius:20}}>💬 自由回饋</span>
          </div>
          {userText&&<div style={{marginTop:4,fontSize:13,lineHeight:1.6,color:"#6b5830",fontStyle:"italic",whiteSpace:"pre-wrap"}}>你的回報：「{userText}」</div>}
          <div style={{marginTop:10,padding:"10px 13px",borderRadius:8,background:"rgba(107,142,78,.08)",borderLeft:"3px solid #6B8E4E"}}>
            <div style={{fontSize:11.5,fontWeight:700,color:"#5a8a3c",marginBottom:4}}>📣 管理員回覆</div>
            {fr.text&&<div style={{fontSize:14,lineHeight:1.65,color:"#3d4a2e",whiteSpace:"pre-wrap"}}>{fr.text}</div>}
            {fr.images?.length>0&&<div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>{fr.images.map((u,i)=>(<a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{width:120,height:90,objectFit:"cover",borderRadius:6,border:"1px solid rgba(0,0,0,.1)",display:"block"}}/></a>))}</div>}
          </div>
        </div>);
      }
    })}</div>}
  </div>);
}

function Ring({progress,size=32,stroke=2.5}) {
  const r=(size-stroke)/2,c=2*Math.PI*r;
  return(<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#6B8E4E" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c*(1-progress)} strokeLinecap="round" style={{transition:"stroke-dashoffset .4s"}}/></svg>);
}

function Nav({parts,cur,onSelect,answers,freeform,repliesCount}) {
  const fd=freeform?Object.values(freeform).filter(v=>v?.length>0).length:0;
  return(<nav style={{display:"flex",flexDirection:"column",gap:4,padding:"6px 0"}}>
    {repliesCount>0&&<button onClick={()=>onSelect("replies")} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:cur==="replies"?"rgba(107,142,78,.15)":"rgba(107,142,78,.06)",border:"none",borderRadius:10,cursor:"pointer",textAlign:"left",borderLeft:cur==="replies"?"3px solid #6B8E4E":"3px solid transparent"}}>
      <span style={{fontSize:20,width:32,textAlign:"center"}}>📣</span><div><div style={{fontSize:13,fontWeight:700,color:"#5a8a3c"}}>管理員回覆</div><div style={{fontSize:11,color:"#a09880"}}>{repliesCount} 則</div></div>
    </button>}
    {parts.map(p=>{const total=p.sections.reduce((t,s)=>t+s.items.length,0);const done=p.sections.reduce((t,s)=>t+s.items.filter(i=>answers[i.id]?.status).length,0);const active=cur===p.id;return(
      <button key={p.id} onClick={()=>onSelect(p.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:active?"rgba(139,90,43,.1)":"transparent",border:"none",borderRadius:10,cursor:"pointer",textAlign:"left",borderLeft:active?"3px solid #8B5A2B":"3px solid transparent"}}>
        <Ring progress={total>0?done/total:0}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:active?"#5B3A1F":"#7a6a55"}}>{p.icon} {p.subtitle}</div><div style={{fontSize:11,color:"#a09880"}}>{done}/{total}</div></div>
      </button>);})}
    <button onClick={()=>onSelect("freeform")} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:cur==="freeform"?"rgba(139,90,43,.1)":"transparent",border:"none",borderRadius:10,cursor:"pointer",textAlign:"left",borderLeft:cur==="freeform"?"3px solid #8B5A2B":"3px solid transparent"}}>
      <span style={{fontSize:20,width:32,textAlign:"center"}}>💬</span><div><div style={{fontSize:13,fontWeight:600,color:cur==="freeform"?"#5B3A1F":"#7a6a55"}}>自由回饋</div><div style={{fontSize:11,color:"#a09880"}}>{fd}/1</div></div>
    </button>
  </nav>);
}

function Welcome({onStart,initialNick,formClosed}) {
  const [nick,setNick]=useState(initialNick||"");const [device,setDevice]=useState("");const [browser,setBrowser]=useState("");
  const ok=formClosed?nick.trim().length>0:(nick.trim().length>0&&device.length>0&&browser.length>0);
  const Btn=({items,val,set})=>(<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{items.map(d=><button key={d} onClick={()=>set(d)} style={{padding:"7px 16px",borderRadius:20,border:`2px solid ${val===d?"#8B5A2B":"rgba(0,0,0,.1)"}`,background:val===d?"#8B5A2B":"transparent",color:val===d?"#fff":"#6b5830",cursor:"pointer",fontSize:13,fontWeight:500}}>{d}</button>)}</div>);
  return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)",padding:20}}>
    <div style={{width:"100%",maxWidth:480,padding:"40px 32px",borderRadius:20,background:"rgba(255,255,255,.75)",backdropFilter:"blur(20px)",boxShadow:"0 8px 40px rgba(91,58,31,.08)",border:"1px solid rgba(255,255,255,.6)"}}>
      <div style={{textAlign:"center",marginBottom:28}}><img src={logoImg} alt="Logo" style={{width:72,height:72,objectFit:"contain",marginBottom:8,display:"block",margin:"0 auto 8px"}}/><h1 style={{margin:0,fontSize:24,color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif"}}>方壺山道場</h1><p style={{margin:"6px 0 0",fontSize:14,color:"#9a8a6e"}}>{formClosed?"測試已結束，輸入清信號查看管理員回覆":"網站測試回饋系統"}</p></div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div><label style={{fontSize:13,fontWeight:600,color:"#6B4E2E",display:"block",marginBottom:4}}>清信號 <span style={{color:"#c49000"}}>*</span><span style={{fontWeight:400,color:"#9a8a6e",fontSize:12}}>（換裝置請填一樣的清信號）</span></label><input value={nick} onChange={e=>setNick(e.target.value)} placeholder="ex. 清000" style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid rgba(0,0,0,.12)",fontSize:14,background:"rgba(255,255,255,.8)",boxSizing:"border-box",outline:"none"}}/></div>
        {!formClosed&&<><div><label style={{fontSize:13,fontWeight:600,color:"#6B4E2E",display:"block",marginBottom:6}}>使用裝置 <span style={{color:"#c49000"}}>*</span><span style={{fontWeight:400,color:"#9a8a6e",fontSize:12}}>（本次「電腦」和「手機或平板」都要測）</span></label><Btn items={["電腦","手機","平板"]} val={device} set={setDevice}/></div>
        <div><label style={{fontSize:13,fontWeight:600,color:"#6B4E2E",display:"block",marginBottom:6}}>瀏覽器 <span style={{color:"#c49000"}}>*</span></label><Btn items={["Chrome","Safari","Firefox","Edge","其他"]} val={browser} set={setBrowser}/></div></>}
      </div>
      <button onClick={()=>ok&&onStart({nickname:nick.trim(),device,browser})} disabled={!ok} style={{width:"100%",marginTop:24,padding:"14px 0",borderRadius:12,background:ok?"linear-gradient(135deg,#8B5A2B,#A67B5B)":"#d5cfc3",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:ok?"pointer":"default",letterSpacing:1}}>{formClosed?"查看回覆 →":"開始填寫 →"}</button>
      <p style={{textAlign:"center",marginTop:16,fontSize:12,color:"#b8ad9c"}}>{formClosed?"只需填入當初測試用的清信號即可":"預計 40–60 分鐘，可分次完成"}</p>
    </div>
  </div>);
}

export default function FeedbackApp() {
  const [authed,setAuthed]=useState(false);
  const [group,setGroup]=useState(null);   // 該測試員的組別（null = 看全部）
  const [view,setView]=useState("welcome");
  const [parts,setParts]=useState(null);
  const allPartsRef=useRef(null);
  const [loading,setLoading]=useState(true);
  const [userInfo,setUserInfo]=useState(null);
  const [answers,setAnswers]=useState({});
  const [freeform,setFreeform]=useState({});
  const [freeformReplies,setFreeformReplies]=useState({});
  const [cur,setCur]=useState(null);
  const [mobNav,setMobNav]=useState(false);
  const [saveStatus,setSaveStatus]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const [submitAttempted,setSubmitAttempted]=useState(false);
  const [fontScale,setFontScale]=useState(1);
  const [formClosed,setFormClosed]=useState(false);
  const [closedShowReplies,setClosedShowReplies]=useState(false);
  const [coverage,setCoverage]=useState(null);   // 此清信號的裝置涵蓋 {pc,mobile}
  const [prefillNick,setPrefillNick]=useState("");
  const saveT=useRef(null);
  const contentRef=useRef(null);
  const activeSecRef=useRef(0);   // 累計「實際停留在頁面」的秒數

  useEffect(()=>{ document.title="方壺山捉蟲小隊Testing"; const f=parseFloat(localStorage.getItem('fhmt_fontscale')); if(f>0) setFontScale(f); },[]);
  useEffect(()=>{(async()=>{
    const fs=await loadFormStatus();
    setFormClosed(fs ? (fs.open===false || (fs.deadline && Date.now()>=new Date(fs.deadline).getTime())) : false);
    const groupCodes=await loadGroupCodes();
    const pc=await loadPasscode();
    const noCodes=(!groupCodes||Object.keys(groupCodes).length===0)&&!pc;
    const wasAuthed=localStorage.getItem('fhmt_authed');
    if(wasAuthed||noCodes){
      setAuthed(true);
      const g=localStorage.getItem('fhmt_group');
      setGroup(g?g:null);
    }
    const q=await loadQ();
    if(q){ allPartsRef.current=q; setParts(q); setCur(q[0]?.id||null); }
    // 自動恢復上次的填寫者
    const saved=localStorage.getItem('fhmt_user');
    if(saved){
      try{
        const info=JSON.parse(saved);
        setUserInfo(info);
        if(q){
          // parts 維持全部，cur 校正到「該組別 + 該裝置」的第一個關卡（顯示交由 visibleParts 過濾）
          const dt=info.device==='電腦'?'desktop':'mobile';
          const g=localStorage.getItem('fhmt_group');
          const first=q.find(p=>(!g||p.group===g)&&(!p.device||p.device==='both'||p.device===dt));
          if(first) setCur(first.id);
        }
        const u=`${info.nickname}-${info.device}-${info.browser}`;
        const ex=await loadF(u);
        if(ex){setAnswers(ex.answers||{});setFreeform(ex.freeform||{});setFreeformReplies(ex.freeformReplies||{});activeSecRef.current=ex.activeSec||0;}
        setView("form");if(REPLIES_ENABLED&&ex&&Object.values(ex.answers||{}).some(a=>a?.reply&&String(a.reply).trim()))setCur("replies");
      }catch(e){ localStorage.removeItem('fhmt_user'); }
    }
    setLoading(false);
  })();},[]);

  // 依「組別 + 裝置」過濾出這位測試員看得到的關卡
  // device：電腦→desktop，手機/平板→mobile；題目沒標 device 或標 both 則兩種都顯示
  const dt = userInfo?.device==='電腦' ? 'desktop' : (userInfo?.device ? 'mobile' : null);
  const filterParts = (list) => list.filter(p =>
    (!group || p.group===group) &&
    (!dt || !p.device || p.device==='both' || p.device===dt)
  );
  const visibleParts = parts ? filterParts(parts) : [];

  // 把目前選到的關卡（cur）校正到可見範圍內
  useEffect(()=>{
    if(!parts)return;
    const vp = filterParts(parts);
    if(vp.length===0)return;
    if(cur==="freeform"||cur==="replies")return;
    if(!cur||!vp.some(p=>p.id===cur)) setCur(vp[0].id);
  },[parts,group,cur,userInfo]);

  const totalItems=visibleParts.reduce((t,p)=>t+p.sections.reduce((s,sec)=>s+sec.items.length,0),0);
  const uid=userInfo?`${userInfo.nickname}-${userInfo.device}-${userInfo.browser}`:null;

  const doSave=useCallback(async()=>{
    if(!uid||formClosed)return;
    setSaveStatus("saving");
    // 先撈 DB 最新狀態，把管理員可能剛寫的回覆欄位合併進來，避免覆寫
    const remote=await loadF(uid);
    // 規則：
    //  - status / comment / images（測試員寫的）→ 以「本地 state」為準
    //  - reply / replyImages（管理員寫的）→ 以「DB」為準（避免覆寫管理員最新回覆）
    //  - 任一邊有題目就保留，不會掉題
    const mergedAnswers={};
    const allIds=new Set([...Object.keys(answers||{}),...Object.keys(remote?.answers||{})]);
    allIds.forEach(id=>{
      const la=answers?.[id]||{};
      const ra=remote?.answers?.[id]||{};
      mergedAnswers[id]={
        ...ra,           // 先以 DB 為底（保留所有可能存在的欄位）
        ...la,           // 再用本地覆蓋測試員相關欄位
        reply:ra.reply!==undefined?ra.reply:la.reply,            // 強制以 DB 為準
        replyImages:ra.replyImages!==undefined?ra.replyImages:la.replyImages,
      };
      // 把 undefined 欄位清掉（避免 Firebase 出錯）
      Object.keys(mergedAnswers[id]).forEach(k=>{ if(mergedAnswers[id][k]===undefined)delete mergedAnswers[id][k]; });
    });
    // freeformReplies 全是管理員寫的，以 DB 為準
    const safeFreeformReplies=remote?.freeformReplies||freeformReplies||{};
    await saveF(uid,{
      ...userInfo,group,activeSec:activeSecRef.current,
      answers:mergedAnswers,freeform,
      freeformReplies:safeFreeformReplies,
      updatedAt:new Date().toISOString(),odName:uid
    });
    setSaveStatus("saved");
    setTimeout(()=>setSaveStatus(""),2000);
  },[uid,userInfo,group,answers,freeform,freeformReplies,formClosed]);

  useEffect(()=>{
    if(!uid||formClosed)return;
    if(saveT.current)clearTimeout(saveT.current);
    saveT.current=setTimeout(doSave,1200);
    return()=>{if(saveT.current)clearTimeout(saveT.current);};
  },[answers,freeform,doSave,uid,formClosed]);

  // 送出後讀取此清信號的裝置涵蓋（電腦 / 手機平板 有沒有都測過）
  useEffect(()=>{
    if(!submitted||!userInfo)return;
    (async()=>{ const c=parseVal(await dbGet(`kv/personDevices/${safeId(userInfo.nickname)}`)); setCoverage(c||{}); })();
  },[submitted,userInfo]);

  // 實際操作時間：只在「正在填寫且分頁可見」時，每 5 秒累加 5 秒
  useEffect(()=>{
    if(view!=="form")return;
    const t=setInterval(()=>{
      if(typeof document==="undefined"||document.visibilityState==="visible") activeSecRef.current+=5;
    },5000);
    return()=>clearInterval(t);
  },[view]);

  const handleStart=async(info)=>{
    localStorage.setItem('fhmt_user',JSON.stringify(info));
    localStorage.setItem('fhmt_authed','1');
    setUserInfo(info);
    if(formClosed){
      // 表單已關閉：只用清信號撈該會員「所有裝置」的回覆，合併顯示（不需比對裝置/瀏覽器）
      const all=await loadAllF();
      const ma={}; const mfr={};
      Object.values(all||{}).forEach(raw=>{
        let d; try{ d=typeof raw==='string'?JSON.parse(raw):raw; }catch{ return; }
        if(!d||d.nickname!==info.nickname)return;
        const dev=d.device||'';               // 標示這則回覆來自哪個裝置
        const tag=dev?`【${dev}】`:'';
        Object.entries(d.answers||{}).forEach(([id,a])=>{
          const hasR=a?.reply&&String(a.reply).trim();
          const hasI=a?.replyImages&&a.replyImages.length>0;
          if(!hasR&&!hasI)return;
          // 同題號、不同裝置都各有回覆 → 串接，避免互蓋
          if(!ma[id])ma[id]={reply:'',replyImages:[],comment:a.comment};
          if(hasR)ma[id].reply+=(ma[id].reply?'\n\n':'')+tag+a.reply;
          if(hasI)ma[id].replyImages=[...ma[id].replyImages,...a.replyImages];
        });
        Object.entries(d.freeformReplies||{}).forEach(([k,fr])=>{
          const hasR=fr?.text&&String(fr.text).trim();
          const hasI=fr?.images&&fr.images.length>0;
          if(!hasR&&!hasI)return;
          if(!mfr[k])mfr[k]={text:'',images:[]};
          if(hasR)mfr[k].text+=(mfr[k].text?'\n\n':'')+tag+fr.text;
          if(hasI)mfr[k].images=[...mfr[k].images,...fr.images];
        });
      });
      setParts(allPartsRef.current||[]);
      setAnswers(ma);setFreeform({});setFreeformReplies(mfr);
      setView("form");
      return;
    }
    const allQ=allPartsRef.current||[];
    // parts 維持全部，cur 校正到「該組別 + 該裝置」的第一個關卡（顯示交由 visibleParts 過濾）
    setParts(allQ);
    const dt=info.device==='電腦'?'desktop':'mobile';
    const first=allQ.find(p=>(!group||p.group===group)&&(!p.device||p.device==='both'||p.device===dt));
    setCur(first?first.id:(allQ[0]?.id||null));
    const u=`${info.nickname}-${info.device}-${info.browser}`;
    const ex=await loadF(u);
    if(ex){setAnswers(ex.answers||{});setFreeform(ex.freeform||{});setFreeformReplies(ex.freeformReplies||{});activeSecRef.current=ex.activeSec||0;}
    setView("form");if(REPLIES_ENABLED&&ex&&Object.values(ex.answers||{}).some(a=>a?.reply&&String(a.reply).trim()))setCur("replies");
  };

  const handleSwitch=()=>{
    setPrefillNick(userInfo?.nickname||"");
    localStorage.removeItem('fhmt_user');
    localStorage.removeItem('fhmt_authed');
    setUserInfo(null);setAnswers({});setFreeform({});setFreeformReplies({});setCoverage(null);setView("welcome");
  };

  const totalDone=Object.values(answers).filter(a=>a?.status).length;
  const replyCount=REPLIES_ENABLED?(Object.values(answers).filter(a=>(a?.reply&&String(a.reply).trim())||(a?.replyImages&&a.replyImages.length>0)).length
    +Object.values(freeformReplies||{}).filter(fr=>(fr?.text&&String(fr.text).trim())||(fr?.images&&fr.images.length>0)).length):0;
  const pct=totalItems>0?Math.round(totalDone/totalItems*100):0;
  const scrollTop=()=>{contentRef.current?.scrollTo({top:0,behavior:"smooth"});};

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)"}}><div style={{textAlign:"center",color:"#9a8a6e"}}><img src={logoImg} alt="Logo" style={{width:56,height:56,objectFit:"contain",marginBottom:12}}/><p>載入中...</p></div></div>);
  if(!authed)return <PasscodeGate onPass={(g)=>{ setGroup(g||null); setAuthed(true); localStorage.setItem('fhmt_authed','1'); localStorage.setItem('fhmt_group', g||''); }} />;
  if(!parts||parts.length===0)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)"}}><div style={{textAlign:"center",color:"#9a8a6e",maxWidth:400,padding:20}}><div style={{fontSize:40,marginBottom:12}}>📋</div><h2 style={{color:"#5B3A1F"}}>題目尚未設定</h2><p style={{fontSize:14,lineHeight:1.7}}>請聯絡管理員到 /admin 初始化題目。</p></div></div>);
  if(visibleParts.length===0)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)"}}><div style={{textAlign:"center",color:"#9a8a6e",maxWidth:400,padding:20}}><div style={{fontSize:40,marginBottom:12}}>🔑</div><h2 style={{color:"#5B3A1F"}}>這組通行碼目前沒有題目</h2><p style={{fontSize:14,lineHeight:1.7}}>請聯絡管理方確認你的通行碼，或稍後再試。</p><button onClick={()=>{localStorage.removeItem('fhmt_authed');localStorage.removeItem('fhmt_group');location.reload();}} style={{marginTop:16,padding:"10px 20px",borderRadius:10,background:"linear-gradient(135deg,#8B5A2B,#A67B5B)",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>重新輸入通行碼</button></div></div>);
  // REPLIES_ENABLED=false 且表單已關閉：不引導看回覆，只顯示單純的結束致謝畫面。
  if(formClosed&&!REPLIES_ENABLED)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@700&display=swap" rel="stylesheet" />
      <div style={{textAlign:"center",maxWidth:420}}>
        <img src={logoImg} alt="Logo" style={{width:90,height:90,objectFit:"contain",display:"block",margin:"0 auto 20px"}}/>
        <h2 style={{color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif",fontSize:24,margin:"0 0 14px"}}>本次測試已結束</h2>
        <p style={{color:"#9a8a6e",fontSize:15,lineHeight:1.9,margin:0}}>謝謝你的參與 🙏</p>
      </div>
    </div>);
  if(view==="welcome")return <Welcome onStart={handleStart} initialNick={prefillNick} formClosed={formClosed} />;
  if(formClosed){
    if(closedShowReplies&&replyCount>0)return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)",fontFamily:"'Noto Sans TC',-apple-system,sans-serif"}}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@700&display=swap" rel="stylesheet" />
        <div style={{maxWidth:800,margin:"0 auto",padding:"24px 20px 60px"}}>
          <button onClick={()=>setClosedShowReplies(false)} style={{marginBottom:16,padding:"8px 16px",borderRadius:10,background:"rgba(255,255,255,.7)",border:"1px solid rgba(0,0,0,.1)",cursor:"pointer",fontSize:13,color:"#6b5830"}}>← 返回</button>
          <RepliesView answers={answers} parts={parts||[]} freeform={freeform} freeformReplies={freeformReplies}/>
        </div>
      </div>);
    return(
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)",padding:20}}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@700&display=swap" rel="stylesheet" />
        <div style={{textAlign:"center",maxWidth:420}}>
          <img src={logoImg} alt="Logo" style={{width:90,height:90,objectFit:"contain",display:"block",margin:"0 auto 20px"}}/>
          <h2 style={{color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif",fontSize:24,margin:"0 0 14px"}}>本次測試已結束</h2>
          <p style={{color:"#9a8a6e",fontSize:15,lineHeight:1.9,margin:"0 0 24px"}}>{replyCount>0?"謝謝你的參與 🙏 以下是管理員的回覆。":"謝謝你的參與 🙏"}</p>
          {replyCount>0
            ? <button onClick={()=>setClosedShowReplies(true)} style={{padding:"12px 28px",borderRadius:12,background:"linear-gradient(135deg,#6B8E4E,#8aad6a)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer"}}>📣 查看管理員回覆（{replyCount}）</button>
            : <button onClick={handleSwitch} style={{padding:"12px 28px",borderRadius:12,background:"rgba(255,255,255,.7)",border:"1px solid rgba(0,0,0,.1)",color:"#6b5830",fontSize:14,fontWeight:600,cursor:"pointer"}}>用其他清信號 / 裝置查看回覆</button>}
        </div>
      </div>);
  }
  if(submitted){
    const bothDone=coverage&&coverage.pc&&coverage.mobile;
    const missing=coverage?(!coverage.pc?"電腦":!coverage.mobile?"手機或平板":null):null;
    return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@700&display=swap" rel="stylesheet" />
      <div style={{textAlign:"center",maxWidth:440}}>
        <img src={logoImg} alt="Logo" style={{width:90,height:90,objectFit:"contain",display:"block",margin:"0 auto 20px"}}/>
        <h2 style={{color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif",fontSize:24,margin:"0 0 16px"}}>感謝除蟲小夥伴</h2>
        {bothDone
          ? <p style={{color:"#6B8E4E",fontSize:15,lineHeight:1.9,margin:"0 0 28px",fontWeight:600}}>🎉 你已經用「電腦」和「手機／平板」兩種都測完了，太感謝了！</p>
          : <>
              <p style={{color:"#9a8a6e",fontSize:15,lineHeight:1.9,margin:"0 0 16px"}}>你這次的回報已收到 🙏</p>
              {missing&&<div style={{margin:"0 auto 24px",maxWidth:390,padding:"14px 16px",borderRadius:12,background:"rgba(196,144,0,.1)",border:"1px solid rgba(196,144,0,.3)",color:"#8a6d1a",fontSize:14,lineHeight:1.8,textAlign:"left"}}>⚠️ 本次「電腦」和「手機或平板」<b>兩種都要測</b>。<br/>你還差用「<b>{missing}</b>」測一次 —— 請用<b>一樣的清信號</b>，點下面換裝置再測一次。</div>}
            </>}
        <button onClick={()=>{setPrefillNick(userInfo?.nickname||"");localStorage.removeItem('fhmt_user');setUserInfo(null);setAnswers({});setFreeform({});setFreeformReplies({});setSubmitted(false);setCoverage(null);setView("welcome");}} style={{padding:"12px 32px",borderRadius:12,background:"linear-gradient(135deg,#8B5A2B,#A67B5B)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",letterSpacing:1}}>{bothDone?"用其他裝置再測（選填）":"換另一種裝置再測一次 →"}</button>
      </div>
    </div>
    );
  }

  const active=visibleParts.find(p=>p.id===cur);
  const allIds=[...(replyCount>0?["replies"]:[]),...visibleParts.map(p=>p.id),"freeform"];
  const isMob=typeof window!=="undefined"&&window.innerWidth<768;

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)",fontFamily:"'Noto Sans TC',-apple-system,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@700&display=swap" rel="stylesheet" />
      <header style={{position:"sticky",top:0,zIndex:100,padding:"10px 16px",background:"rgba(247,240,227,.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(0,0,0,.06)",display:"flex",alignItems:"center",gap:12}}>
        {isMob&&<button onClick={()=>setMobNav(!mobNav)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#8B5A2B",padding:4}}>☰</button>}
        <img src={logoImg} alt="Logo" style={{width:24,height:24,objectFit:"contain"}}/><span style={{fontSize:14,fontWeight:700,color:"#5B3A1F",fontFamily:"'Noto Serif TC',serif"}}>方壺山道場 測試回饋</span><div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:3}}>
            <span style={{fontSize:11,color:"#9a8a6e"}}>字級</span>
            {[["小",1],["中",1.18],["大",1.4]].map(([lbl,f])=>(<button key={lbl} onClick={()=>{setFontScale(f);localStorage.setItem('fhmt_fontscale',String(f));}} style={{padding:"3px 9px",borderRadius:8,border:`1px solid ${Math.abs(fontScale-f)<0.01?"#8B5A2B":"rgba(0,0,0,.15)"}`,background:Math.abs(fontScale-f)<0.01?"#8B5A2B":"transparent",color:Math.abs(fontScale-f)<0.01?"#fff":"#6b5830",cursor:"pointer",fontSize:12,fontWeight:600}}>{lbl}</button>))}
          </div>
          {saveStatus==="saving"&&<span style={{fontSize:11,color:"#c49000"}}>儲存中...</span>}
          {saveStatus==="saved"&&<span style={{fontSize:11,color:"#6B8E4E"}}>✓ 已儲存</span>}
          <div style={{padding:"4px 12px",borderRadius:16,background:pct>=100?"#6B8E4E":"rgba(139,90,43,.12)",fontSize:12,fontWeight:700,color:pct>=100?"#fff":"#8B5A2B"}}>{totalDone}/{totalItems}　{pct}%</div>
          <button onClick={handleSwitch} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#a09880",padding:"2px 4px"}}>換裝置測試</button>
        </div>
      </header>
      <div style={{display:"flex",flex:1,minHeight:0}}>
        {!isMob&&<aside style={{width:240,minWidth:240,borderRight:"1px solid rgba(0,0,0,.06)",background:"rgba(255,255,255,.4)",overflowY:"auto",padding:"8px 6px"}}><Nav parts={visibleParts} cur={cur} onSelect={id=>{setCur(id);scrollTop();}} answers={answers} freeform={freeform} repliesCount={replyCount}/></aside>}
        {mobNav&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,background:"rgba(0,0,0,.3)",backdropFilter:"blur(4px)"}} onClick={()=>setMobNav(false)}><div style={{width:280,height:"100%",background:"rgba(247,240,227,.98)",overflowY:"auto",padding:"60px 10px 20px",boxShadow:"4px 0 20px rgba(0,0,0,.1)"}} onClick={e=>e.stopPropagation()}><Nav parts={visibleParts} cur={cur} onSelect={id=>{setCur(id);setMobNav(false);scrollTop();}} answers={answers} freeform={freeform} repliesCount={replyCount}/></div></div>}
        <main ref={contentRef} style={{flex:1,overflowY:"auto",padding:"24px 20px 60px",maxWidth:800,margin:"0 auto",width:"100%",zoom:fontScale}}>
          {cur==="freeform"?<Freeform answers={freeform} onAnswer={(k,v)=>setFreeform(p=>({...p,[k]:v}))}/>:REPLIES_ENABLED&&cur==="replies"?<RepliesView answers={answers} parts={visibleParts} freeform={freeform} freeformReplies={freeformReplies}/>:active?<PartView part={active} answers={answers} onAnswer={(id,a)=>setAnswers(p=>({...p,[id]:a}))} uid={uid} submitAttempted={submitAttempted}/>:null}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:32,paddingTop:20,borderTop:"1px solid rgba(0,0,0,.08)"}}>
            {cur!==allIds[0]?<button onClick={()=>{const i=allIds.indexOf(cur);if(i>0){setCur(allIds[i-1]);scrollTop();}}} style={{padding:"10px 20px",borderRadius:10,background:"rgba(255,255,255,.6)",border:"1px solid rgba(0,0,0,.1)",cursor:"pointer",fontSize:13,color:"#6b5830"}}>← 上一段</button>:<div/>}
            {cur!=="freeform"?<button onClick={()=>{const i=allIds.indexOf(cur);if(i<allIds.length-1){setCur(allIds[i+1]);scrollTop();}}} style={{padding:"10px 20px",borderRadius:10,background:"linear-gradient(135deg,#8B5A2B,#A67B5B)",border:"none",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:600}}>下一段 →</button>
            :<button onClick={async()=>{
              const missing=[];
              for(const p of visibleParts)for(const sec of p.sections)for(const it of sec.items){const a=answers[it.id];if(a?.status==="confused"&&!(a.comment&&a.comment.trim()))missing.push({id:it.id,partId:p.id});}
              if(missing.length){
                setSubmitAttempted(true);
                const first=missing[0];
                setCur(first.partId);
                setTimeout(()=>{document.getElementById("item-"+first.id)?.scrollIntoView({behavior:"smooth",block:"center"});},150);
                alert(`還有 ${missing.length} 題標為「不通過」但沒填原因。\n請補上原因才能送出（畫面已跳到第一題）。`);
                return;
              }
              await doSave();
              const cat=userInfo.device==="電腦"?"pc":"mobile";
              await dbSet(`kv/personDevices/${safeId(userInfo.nickname)}/${cat}`,true);
              setSubmitted(true);
            }} style={{padding:"10px 24px",borderRadius:10,background:"linear-gradient(135deg,#6B8E4E,#8aad6a)",border:"none",cursor:"pointer",fontSize:14,color:"#fff",fontWeight:700}}>🙏 完成送出</button>}
          </div>
        </main>
      </div>
    </div>
  );
}
