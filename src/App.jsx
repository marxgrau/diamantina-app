import { useState, useEffect } from "react";

const TUBE=3.00, B5=2.60, B10=4.10, KEY="dia_v1";
let uid=1;
const row=()=>({id:uid++,nTubos:"",perforado:"",recuperado:"",terreno:"",recFluido:"",bov:""});
const emptyH={empresa:"",fecha:"",proyecto:"",sondaje:"",maquina:"",ubicacion:"",
  inclinacion:"90",azimut:"",turno:"Día",diametro:"HQ",constante:"",broca:"",brocaSerie:"",
  brocaCodigo:"",brocaDesde:"",brocaHasta:"",rshell:"",rshellSerie:"",rshellCodigo:"",
  rshellDesde:"",rshellHasta:"",zapata:"",mtsProgram:"",horometroIni:"",horometroFin:"",
  combustible:"",agua:"",aditivo1:"",aditivo1Cant:"",aditivo2:"",aditivo2Cant:"",
  profIni:"",sobranteIni:"",observaciones:"",supervisor:"",perforista:"",ayudante1:"",ayudante2:"",casingDiam:"",casingDesde:"",casingHasta:"",dt:Array(20).fill("")};
const DT=["Perforado con broca","Perforado con tricono","Inspección equipo - Charla",
  "Mantenimiento y reparación","Traslado, Instalación, Desinstalación de máquina",
  "Instalación, retiro de casing en cambio de línea","Rimado con protección de casing",
  "Reperforando (derrumbe)","Acondicionamiento de sondaje","Sacado y bajado de tubería",
  "Medición de inclinación","Atrapamiento de tubería (recuperación)",
  "Cementado, fraguado. Perforando cemento","Refrigerio","Tormenta eléctrica (Stand By)",
  "Demora por cliente (Stand By)","Evacuación y retorno por Voladura (Stand By)",
  "Auditorías de seguridad por SMCV (Stand By)","Horas operativas","Otro."];

// ── Dark theme ──────────────────────────────────────────────────────
const DARK={
  bg:"#000000",card:"#1c1c1e",card2:"#2c2c2e",card3:"#3a3a3c",
  border:"#48484a",input:"#1c1c1e",inputBdr:"#636366",
  text:"#ffffff",text2:"#ebebf5",text3:"#8e8e93",
  row1:"#1c1c1e",row2:"#2c2c2e",
  blue:"#0a84ff",green:"#30d158",yellow:"#ffd60a",orange:"#ff9f0a",red:"#ff453a",
  th:"#2c2c2e",thTxt:"#ebebf5",secH:"#2c2c2e",secHTxt:"#ebebf5",
  appBar:"linear-gradient(160deg,#1c1c1e,#2c2c2e)",
};
// ── Light theme ─────────────────────────────────────────────────────
const LIGHT={
  bg:"#f2f2f7",card:"#ffffff",card2:"#f2f2f7",card3:"#e5e5ea",
  border:"#c6c6c8",input:"#ffffff",inputBdr:"#c6c6c8",
  text:"#000000",text2:"#3c3c43",text3:"#8e8e93",
  row1:"#ffffff",row2:"#f2f2f7",
  blue:"#007aff",green:"#34c759",yellow:"#ff9500",orange:"#ff9500",red:"#ff3b30",
  th:"#e5e5ea",thTxt:"#3c3c43",secH:"#e5e5ea",secHTxt:"#3c3c43",
  appBar:"linear-gradient(160deg,#1c1c1e,#2c2c2e)",
};

function inp(t,extra){return{background:t.input,border:`1px solid ${t.inputBdr}`,borderRadius:8,
  padding:"8px 10px",color:t.text,fontSize:13,outline:"none",
  width:"100%",boxSizing:"border-box",fontFamily:"inherit",...extra};}
function ci(t,extra){return{background:t.input,border:`1px solid ${t.border}`,borderRadius:6,
  padding:"5px 2px",color:t.text,fontSize:12,outline:"none",
  textAlign:"center",boxSizing:"border-box",fontFamily:"inherit",...extra};}

export default function App(){
  const [h,setH]=useState(emptyH);
  const [rows,setRows]=useState([row(),row(),row()]);
  const [barrel,setBarrel]=useState("5");
  const [tab,setTab]=useState("calc");
  const [dark,setDark]=useState(true);
  const [saved,setSaved]=useState(false);
  const [savedList,setSavedList]=useState([]);

  useEffect(()=>{try{setSavedList(JSON.parse(localStorage.getItem(KEY)||"[]"));}catch(e){}});

  const t=dark?DARK:LIGHT;
  const sh=k=>v=>setH(p=>({...p,[k]:v}));
  const sdt=i=>v=>setH(p=>{const d=[...p.dt];d[i]=v;return{...p,dt:d};});
  const addRow=()=>setRows(r=>[...r,row()]);
  const delRow=id=>setRows(r=>r.filter(x=>x.id!==id));
  const upd=(id,k,v)=>setRows(r=>r.map(x=>x.id===id?{...x,[k]:v}:x));
  const cte=parseFloat(h.constante)||0;
  const bLen=barrel==="5"?B5:B10;

  const save=()=>{
    try{
      const e={id:Date.now(),label:`${h.sondaje||"Sin sondaje"} — ${h.fecha||"Sin fecha"}`,h,rows,barrel};
      const list=[e,...(()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]");}catch(e){return[];}})()].slice(0,20);
      try{localStorage.setItem(KEY,JSON.stringify(list));}catch(e){}
      setSavedList(list);setSaved(true);setTimeout(()=>setSaved(false),2000);
    }catch(e){}
  };
  const load=e=>{if(window.confirm(`¿Cargar "${e.label}"?`)){uid=Math.max(...e.rows.map(r=>r.id),0)+1;setH(e.h);setRows(e.rows);setBarrel(e.barrel||"5");setTab("calc");}};
  const reset=()=>{if(window.confirm("¿Limpiar todo?")){uid=1;setH(emptyH);setRows([row(),row(),row()]);setBarrel("5");setTab("calc");}};

  // ── Compute rows ───────────────────────────────────────────────────
  const profIniVal = parseFloat(h.profIni)||0;
  const sobIniVal = parseFloat(h.sobranteIni)||null;
  // Suggested tube: profIni / 3m only (no barrel, no constante)
  const suggestedTube = profIniVal>0 ? Math.ceil(profIniVal/TUBE) : null;
  let pAcum=profIniVal,prevN=null,prevSob=sobIniVal,curSob=sobIniVal,actBarrel=barrel,actBLen=bLen;
  const comp=rows.map(r=>{
    const nT=parseFloat(r.nTubos),perf=parseFloat(r.perforado)||0;
    if(r.bov!==""){
      const nbl=r.bov==="5"?B5:B10;
      if(nbl!==actBLen&&curSob!=null){curSob=+(curSob+(nbl-actBLen)).toFixed(2);}
      actBarrel=r.bov;actBLen=nbl;
    }
    const tub=!isNaN(nT)&&nT>0?+(nT*TUBE+actBLen).toFixed(2):null;
    if(r.nTubos!==""&&r.nTubos!==prevN){
      const add=(!isNaN(nT)?nT:0)-(parseFloat(prevN)||0);
      if(prevN===null&&sobIniVal!=null){
        // Primer tubo del nuevo turno - sobrante viene del turno anterior, no recalcular
        curSob=sobIniVal;
      } else {
        curSob=prevSob!=null?+(prevSob+add*TUBE).toFixed(2):(tub!=null?+(tub-cte).toFixed(2):null);
      }
      prevN=r.nTubos;
    }
    // If no nTubos but we have sobranteIni, keep using it
    const sob=curSob!=null&&perf>0?+(curSob-perf).toFixed(2):curSob;
    if(perf>0)curSob=sob;
    prevSob=sob;pAcum+=perf;
    const rec=parseFloat(r.recuperado)||0;
    const pct=perf>0?Math.min(100,(rec/perf)*100).toFixed(0):null;
    return{tub,sob,prof:pAcum,pct,perf,actBarrel,needTube:sob!=null&&sob<=0.001&&perf>0};
  });

  const totP=comp.reduce((a,c)=>a+c.perf,0);
  const totR=rows.reduce((a,r)=>a+(parseFloat(r.recuperado)||0),0);
  const pctG=totP>0?((totR/totP)*100).toFixed(1):null;
  const vRows=rows.map((r,i)=>({r,c:comp[i],i})).filter(x=>x.c.perf>0);
  const hTrab=h.horometroIni&&h.horometroFin?(parseFloat(h.horometroFin)-parseFloat(h.horometroIni)).toFixed(1):null;

  // ── Styles ─────────────────────────────────────────────────────────
  const root={minHeight:"100vh",background:t.bg,color:t.text,
    fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    maxWidth:700,margin:"0 auto",fontSize:12};
  const appBar={background:t.appBar,padding:"48px 16px 12px",display:"flex",
    justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${t.border}`};
  const tabBar={display:"flex",background:t.card,borderBottom:`2px solid ${t.border}`};
  const tabBtn=(active)=>({flex:1,padding:"12px 4px",background:"none",border:"none",
    color:active?t.blue:t.text3,fontSize:11,fontWeight:700,cursor:"pointer",
    borderBottom:active?`3px solid ${t.blue}`:"3px solid transparent",
    display:"flex",alignItems:"center",justifyContent:"center",gap:4});
  const card=(extra={})=>({background:t.card,border:`1px solid ${t.border}`,
    borderRadius:12,padding:"12px",marginBottom:8,...extra});
  const hGrid={display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8};
  const hCell=(span=1)=>({display:"flex",flexDirection:"column",gap:4,gridColumn:`span ${span}`});
  const lbl={fontSize:9,color:t.text3,textTransform:"uppercase",letterSpacing:0.5,fontWeight:700};
  const th={background:t.th,color:t.thTxt,fontSize:9,textTransform:"uppercase",
    fontWeight:700,padding:"7px 3px",textAlign:"center",borderBottom:`2px solid ${t.border}`,whiteSpace:"nowrap"};
  const td={padding:"4px 2px",borderBottom:`1px solid ${t.border}`,textAlign:"center",verticalAlign:"middle"};
  const secH={background:t.secH,color:t.secHTxt,fontSize:9,fontWeight:800,
    textTransform:"uppercase",padding:"5px 8px",border:`1px solid ${t.border}`,
    letterSpacing:0.5,marginTop:6};
  const rField={background:t.card2,border:`1px solid ${t.border}`,borderRadius:6,
    padding:"6px 10px",display:"flex",flexDirection:"column",gap:2};
  const rGrid={display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8};

  return(
    <div style={root}>

      {/* ── APP BAR ── */}
      <div style={appBar}>
        <div>
          <div style={{fontSize:17,fontWeight:800,letterSpacing:2,color:"#ffffff"}}>💎 DIAMANTINA</div>
          <div style={{fontSize:10,color:"#8e8e93",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Calculadora de Muestreo</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{background:saved?"#002d0a":"#2c2c2e",border:saved?"1px solid #30d158":"1px solid #48484a",
            color:saved?"#30d158":"#0a84ff",borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontWeight:700}}
            onClick={save}>{saved?"✓ Guardado":"💾 Guardar"}</button>
          <button style={{background:"#2c2c2e",border:"1px solid #48484a",color:"#ffffff",
            borderRadius:8,padding:"7px 12px",fontSize:16,cursor:"pointer"}} onClick={()=>setDark(d=>!d)}>
            {dark?"☀️":"🌙"}</button>
          <button style={{background:"#2c2c2e",border:"1px solid #48484a",color:"#ffffff",
            borderRadius:8,padding:"7px 12px",fontSize:16,cursor:"pointer"}} onClick={reset}>↺</button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={tabBar}>
        {[["calc","⛏️","Campo"],["tiempo","⏱️","Tiempo"],["saved","📂","Guardados"],["report","📋","Reporte"]].map(([id,ic,lb])=>(
          <button key={id} style={tabBtn(tab===id)} onClick={()=>setTab(id)}>
            {ic} {lb}
            {id==="saved"&&savedList.length>0&&<span style={{background:t.blue,color:"#fff",borderRadius:10,
              padding:"1px 6px",fontSize:9,fontWeight:800}}>{savedList.length}</span>}
          </button>
        ))}
      </div>

      {/* ══ CAMPO ══ */}
      {tab==="calc"&&<div>
        {/* Barrel */}
        <div style={{background:t.card,borderBottom:`1px solid ${t.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,color:t.text3,fontWeight:700,whiteSpace:"nowrap"}}>Inner Barrel:</span>
          <button style={{flex:1,padding:"9px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
            background:barrel==="5"?"#3a2800":"#2c2c2e",border:barrel==="5"?"2px solid #ff9f0a":"1px solid #48484a",
            color:barrel==="5"?"#ff9f0a":t.text3}}
            onClick={()=>{setBarrel("5");setRows(r=>r.map(x=>({...x,bov:""})));}}>5 pies — 2.60 m</button>
          <button style={{flex:1,padding:"9px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
            background:barrel==="10"?"#002d0a":"#2c2c2e",border:barrel==="10"?"2px solid #30d158":"1px solid #48484a",
            color:barrel==="10"?"#30d158":t.text3}}
            onClick={()=>{setBarrel("10");setRows(r=>r.map(x=>({...x,bov:""})));}}>10 pies — 4.10 m</button>
        </div>

        {/* Formula */}
        <div style={{background:t.card,padding:"8px 14px",borderBottom:`1px solid ${t.border}`,
          display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
          {[["Tubos×3",t.text2],["+"+" Barrel "+bLen+"m",t.orange],["− Cte "+(cte||"?"),t.red],["= Sobrante",t.green]].map(([txt,col],i)=>(
            <span key={i} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:6,
              padding:"3px 8px",fontSize:11,color:col,fontWeight:600}}>{txt}</span>
          ))}
        </div>

        {/* Encabezado */}
        <div style={{background:t.card,borderBottom:`1px solid ${t.border}`,padding:"12px"}}>
          <div style={hGrid}>
            <div style={hCell(4)}>
              <div style={lbl}>Empresa</div>
              <input style={{...inp(t),fontWeight:700,color:t.blue}} value={h.empresa}
                placeholder="Nombre de la empresa..." onChange={e=>sh("empresa")(e.target.value)}/>
            </div>
            {[["sondaje","Sondaje","506-62",1],["maquina","N° Máquina","ED20-08",1],
              ["proyecto","Proyecto","Cerro Verde",2],["ubicacion","Ubicación","Santa Rosa 9",2],
              ["fecha","Fecha","",1,"date"],["turno","Turno","",1,"sel"],["diametro","Diámetro Tubería","",1,"diam"],
              ["mtsProgram","Mts Program.","",1],["profIni","Prof. Inicio Turno (m)","",1],["sobranteIni","Sobrante Inicial (m)","",1],["constante","Constante (m)","1.60",1],
              ["inclinacion","Inclinación°","90",1],["azimut","Azimut°","000",1],
              ["broca","Broca","HA-111492",1],["rshell","R. Shell","61-7205",1],
              ["zapata","Zapata","553185",1],["casingDiam","Casing Ø","HWT",1,"casingsel"],["casingDesde","Casing Desde","",1],["casingHasta","Casing Hasta","",1],
              ["horometroIni","Horómetro Ini (h)","",1],["horometroFin","Horómetro Fin (h)","",1],
              ["combustible","Combustible (gln)","",1],["agua","Agua (gln)","",1],
              ["aditivo1","Aditivo 1","Bentonita",1],["aditivo1Cant","Cantidad","",1],
              ["aditivo2","Aditivo 2","",1],["aditivo2Cant","Cantidad","",1],
              ["observaciones","Observaciones","",4],["supervisor","Supervisor","",2],["perforista","Perforista","",2],["ayudante1","Ayudante 1","",2],["ayudante2","Ayudante 2","",2],
            ].map(([k,lb,ph,sp,ty])=>(
              <div key={k} style={hCell(sp)}>
                <div style={lbl}>{lb}</div>
                {ty==="sel"?(
                  <select style={inp(t)} value={h[k]} onChange={e=>sh(k)(e.target.value)}>
                    <option>Día</option><option>Noche</option>
                  </select>
                ):ty==="date"?(
                  <input style={inp(t)} type="date" value={h[k]} onChange={e=>sh(k)(e.target.value)}/>
                ):(
                  <input style={inp(t)} value={h[k]} placeholder={ph} onChange={e=>sh(k)(e.target.value)}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div style={{overflowX:"auto",padding:"8px 0"}}>
          <table style={{borderCollapse:"collapse",width:"100%",minWidth:520}}>
            <thead>
              <tr style={{background:t.th}}>
                {[["#","#555"],["N° Tub.",t.thTxt],["T.Tub",t.blue],["Prof.",t.blue],
                  ["Perforado",t.green],["Recuperado",t.thTxt],["Sobrante",t.orange],
                  ["Terreno",t.thTxt],["% Rec",t.thTxt],["% Flu",t.thTxt],["Barrel",t.thTxt],["",t.thTxt]
                ].map(([lb,col],i)=>(
                  <th key={i} style={{...th,color:col}}>{lb}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,idx)=>{
                const c=comp[idx];
                const bg=idx%2===0?t.row1:t.row2;
                const pCol=!c.pct?t.text3:+c.pct>=90?t.green:+c.pct>=70?t.yellow:t.red;
                const sCol=c.sob==null?t.text3:c.sob>1?t.green:c.sob>0?t.yellow:t.red;
                const actB=c.actBarrel||barrel;
                return(<>
                  <tr key={r.id} style={{background:bg}}>
                    <td style={td}><span style={{background:t.blue,color:"#fff",borderRadius:10,
                      padding:"2px 6px",fontSize:10,fontWeight:700}}>{idx}</span></td>
                    <td style={td}><input style={ci(t,{width:42})} type="number" inputMode="numeric"
                      value={r.nTubos} placeholder="–" onChange={e=>upd(r.id,"nTubos",e.target.value)}/></td>
                    <td style={td}><div style={{color:t.blue,fontWeight:700,fontSize:12,padding:"4px"}}>
                      {c.tub!=null?c.tub.toFixed(2):"–"}</div></td>
                    <td style={td}><div style={{color:t.blue,fontWeight:800,fontSize:12,padding:"4px"}}>
                      {c.perf>0?c.prof.toFixed(2):profIniVal>0?profIniVal.toFixed(2):"–"}</div></td>
                    <td style={td}><input style={ci(t,{width:48,color:t.green,fontWeight:700})} type="number" inputMode="decimal"
                      value={r.perforado} placeholder="0.00" onChange={e=>upd(r.id,"perforado",e.target.value)}/></td>
                    <td style={td}><input style={ci(t,{width:48})} type="number" inputMode="decimal"
                      value={r.recuperado} placeholder="0.00" onChange={e=>upd(r.id,"recuperado",e.target.value)}/></td>
                    <td style={td}><div style={{color:sCol,fontWeight:700,fontSize:12,padding:"4px"}}>
                      {c.sob!=null?c.sob.toFixed(2):sobIniVal!=null?sobIniVal.toFixed(2):"–"}</div></td>
                    <td style={td}><input style={ci(t,{width:52})} value={r.terreno} placeholder="–"
                      onChange={e=>upd(r.id,"terreno",e.target.value)}/></td>
                    <td style={td}><div style={{color:pCol,fontWeight:700,fontSize:12,padding:"4px"}}>
                      {c.pct!=null?c.pct+"%":"–"}</div></td>
                    <td style={td}><input style={ci(t,{width:42})} type="number" inputMode="decimal"
                      value={r.recFluido||""} placeholder="0.00" onChange={e=>upd(r.id,"recFluido",e.target.value)}/></td>
                    <td style={td}>
                      <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center"}}>
                        <button style={{background:actB==="5"?"#3a2800":"transparent",border:actB==="5"?"1px solid #ff9f0a":`1px solid ${t.border}`,
                          color:actB==="5"?"#ff9f0a":t.text3,borderRadius:4,padding:"2px 5px",fontSize:8,fontWeight:700,cursor:"pointer"}}
                          onClick={()=>setRows(r2=>{const i=r2.findIndex(x=>x.id===r.id);return r2.map((x,j)=>j>=i?{...x,bov:"5"}:x);})}>5'</button>
                        <button style={{background:actB==="10"?"#002d0a":"transparent",border:actB==="10"?"1px solid #30d158":`1px solid ${t.border}`,
                          color:actB==="10"?"#30d158":t.text3,borderRadius:4,padding:"2px 5px",fontSize:8,fontWeight:700,cursor:"pointer"}}
                          onClick={()=>setRows(r2=>{const i=r2.findIndex(x=>x.id===r.id);return r2.map((x,j)=>j>=i?{...x,bov:"10"}:x);})}>10'</button>
                      </div>
                    </td>
                    <td style={td}><button style={{background:"none",border:"none",color:t.text3,cursor:"pointer",fontSize:12}}
                      onClick={()=>delRow(r.id)}>✕</button></td>
                  </tr>
                  {c.needTube&&<tr key={r.id+"_a"} style={{background:bg}}>
                    <td colSpan={12} style={{padding:"2px 8px 5px"}}>
                      <div style={{background:"#1a0808",border:`1px solid ${t.red}`,borderRadius:6,
                        padding:"4px 10px",fontSize:10,color:t.red,fontWeight:600}}>
                        ⚠️ Sobrante agotado — agregar tubo (+3m → sobrante {(((c.tub||0)+3)-cte).toFixed(2)}m)</div>
                    </td>
                  </tr>}
                </>);
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:"6px 10px"}}>
          <button style={{background:t.blue,border:"none",color:"#fff",borderRadius:10,
            padding:"13px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}
            onClick={addRow}>+ Agregar corrida</button>
        </div>

        {/* Resumen */}
        <div style={{...card(),margin:"10px 10px 0"}}>
          <div style={{fontSize:11,fontWeight:700,color:t.text3,textTransform:"uppercase",
            letterSpacing:1,paddingBottom:8,borderBottom:`1px solid ${t.border}`,marginBottom:8}}>Resumen del turno</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["Corridas",rows.length,t.blue],["Total perf.",totP.toFixed(2)+" m",t.green],
              ["Total recup.",totR.toFixed(2)+" m",t.blue],
              ["% Global",pctG?pctG+"%":"—",!pctG?t.text3:+pctG>=90?t.green:+pctG>=70?t.yellow:t.red],
              ["Prof. final",totP>0?totP.toFixed(2)+" m":"—",t.orange]
            ].map(([lb,val,col])=>(
              <div key={lb} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontSize:17,fontWeight:800,color:col,lineHeight:1.1}}>{val}</div>
                <div style={{fontSize:9,color:t.text3,textTransform:"uppercase",letterSpacing:0.3,marginTop:4}}>{lb}</div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* ══ TIEMPO ══ */}
      {tab==="tiempo"&&<div style={{padding:"10px 12px"}}>
        <div style={{fontSize:13,fontWeight:800,color:t.blue,marginBottom:10}}>⏱️ Distribución de Tiempo</div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,overflow:"hidden",marginBottom:10}}>
          {DT.map((d,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
              borderBottom:i<DT.length-1?`1px solid ${t.border}`:"none",
              background:i%2===0?t.row1:t.row2}}>
              <span style={{fontSize:11,color:t.text3,fontWeight:700,minWidth:18}}>{i+1}.</span>
              <span style={{fontSize:11,color:t.text,flex:1,lineHeight:1.3}}>{d}</span>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <input style={{...inp(t),width:52,textAlign:"center",padding:"5px 4px",fontSize:13,fontWeight:700}}
                  type="number" inputMode="decimal" placeholder="0.0"
                  value={h.dt[i]||""} onChange={e=>sdt(i)(e.target.value)}/>
                <span style={{fontSize:10,color:t.text3}}>h</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:10,
          padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:700,color:t.text}}>Total Horas de Turno</span>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:800,color:t.yellow}}>
              {hTrab?hTrab+" h":h.dt.reduce((a,v)=>a+(parseFloat(v)||0),0).toFixed(1)+" h"}
            </div>
            {hTrab&&<div style={{fontSize:9,color:t.text3}}>Calculado del horómetro</div>}
          </div>
        </div>
      </div>}

      {/* ══ GUARDADOS ══ */}
      {tab==="saved"&&<div style={{padding:"14px 12px"}}>
        <div style={{fontSize:14,fontWeight:800,color:t.blue,marginBottom:14}}>📂 Reportes Guardados</div>
        {savedList.length===0?(
          <div style={{color:t.text3,fontSize:13,textAlign:"center",padding:"30px 0"}}>
            No hay reportes guardados aún.<br/>Usa 💾 Guardar en la pestaña Campo.</div>
        ):savedList.map(e=>(
          <div key={e.id} style={{...card(),marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:t.text}}>{e.label}</div>
            <div style={{fontSize:10,color:t.text3,marginTop:2}}>{new Date(e.id).toLocaleString("es-PE")}</div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button style={{background:t.card2,border:`1px solid ${t.blue}`,color:t.blue,
                borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}
                onClick={()=>load(e)}>📂 Cargar</button>
              <button style={{background:t.card2,border:`1px solid ${t.red}`,color:t.red,
                borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}
                onClick={()=>{const l=savedList.filter(x=>x.id!==e.id);try{localStorage.setItem(KEY,JSON.stringify(l));}catch(e){}setSavedList(l);}}>
                🗑 Borrar</button>
            </div>
          </div>
        ))}
      </div>}

      {/* ══ REPORTE ══ */}
      {tab==="report"&&<div>
        <div style={{background:t.card,padding:"10px 14px",borderBottom:`1px solid ${t.border}`}} className="no-print">
          <button style={{background:t.blue,border:"none",color:"#fff",borderRadius:10,
            padding:"12px 20px",fontSize:13,fontWeight:700,cursor:"pointer",width:"100%"}}
            onClick={()=>{
              const content = document.getElementById('report-content');
              if(content){
                const w = window.open('','_blank');
                w.document.write(`<html><head><title>Reporte Diamantina</title><style>
                  *{box-sizing:border-box;margin:0;padding:0;}
                  body{font-family:Arial,sans-serif;font-size:6.5px;background:white;color:black;}
                  @page{size:A4 portrait;margin:4mm;}
                  table{border-collapse:collapse;width:100%;}
                  th,td{border:0.4px solid #333;padding:1px 2px;font-size:6px;vertical-align:middle;}
                  th{background:#ccc!important;font-weight:bold;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
                  .sec-head{background:#333!important;color:white!important;font-weight:bold;font-size:6px;padding:1px 3px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
                  .hdr-top{background:#eee!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
                </style></head><body>`);
                w.document.write(content.outerHTML);
                w.document.write('</body></html>');
                w.document.close();
                w.focus();
                setTimeout(()=>{w.print();w.close();},800);
              }
            }}>🖨️ Imprimir / Guardar PDF</button>
        </div>

        <div id="report-content" style={{padding:"6px",background:t.reportBg,fontSize:10}}>

          {/* ENCABEZADO */}
          <table style={{borderCollapse:"collapse",width:"100%",marginBottom:2,border:`1px solid ${t.reportBorder}`}}>
            <tbody>
              <tr>
                <td rowSpan={2} style={{width:80,border:`1px solid ${t.reportBorder}`,padding:"3px 6px",background:t.secH,textAlign:"center"}}>
                  <div style={{fontSize:10,fontWeight:900,color:t.blue,lineHeight:1.1}}>{h.empresa||"EXPLO DRILLING"}</div>

                </td>
                <td style={{border:`1px solid ${t.reportBorder}`,padding:"4px 6px",textAlign:"center"}}>
                  <div style={{fontSize:9,fontWeight:900,color:t.blue,textTransform:"uppercase"}}>REPORTE DIARIO DE PERFORACIÓN DIAMANTINA SUPERFICIE</div>
                </td>
                <td style={{width:70,border:`1px solid ${t.reportBorder}`,padding:"3px",background:t.secH,textAlign:"right"}}>
                  {["EDP-SIG-OP-RE-PO-007","13","1","Oct-25"].map((s,i)=>(
                    <div key={i} style={{fontSize:7,color:t.text3}}>{s}</div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>

          {/* DATOS GENERALES */}
          <table style={{borderCollapse:"collapse",width:"100%",marginBottom:2,border:`1px solid ${t.reportBorder}`}}>
            <tbody>
              <tr>
                {[["FECHA",h.fecha||"___/___/____"],["N° DE MAQUINA",h.maquina||""],["N° SONDAJE",h.sondaje||""],["AZIMUT",h.azimut||""],["INCLINACIÓN",h.inclinacion?h.inclinacion+"°":""]].map(([k,v])=>(
                  <td key={k} style={{border:`1px solid ${t.reportBorder}`,padding:"2px 4px"}}>
                    <div style={{fontSize:7,color:t.text3,fontWeight:700}}>{k}:</div>
                    <div style={{fontSize:9,color:t.text,fontWeight:600}}>{v}</div>
                  </td>
                ))}
              </tr>
              <tr>
                {[["PROYECTO",h.proyecto||"",2],["UBICACIÓN SONDAJE",h.ubicacion||"",2],["Mts PROGRAMADOS",h.mtsProgram||"",1]].map(([k,v,sp])=>(
                  <td key={k} colSpan={sp} style={{border:`1px solid ${t.reportBorder}`,padding:"2px 4px"}}>
                    <div style={{fontSize:7,color:t.text3,fontWeight:700}}>{k}:</div>
                    <div style={{fontSize:9,color:t.text,fontWeight:600}}>{v}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <td colSpan={5} style={{border:`1px solid ${t.reportBorder}`,padding:"2px 4px"}}>
                  <span style={{fontSize:7,color:t.text3,fontWeight:700}}>TURNO: </span>
                  <span style={{fontSize:9,color:t.text,fontWeight:600}}>{h.turno}</span>
                  <span style={{fontSize:7,color:t.text3,marginLeft:16}}>DÍA: □  NOCHE: □</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* CONTROL AVANCES + DISTRIBUCION TIEMPO */}
          <div style={{display:"flex",gap:3,marginBottom:2}}>
            {/* Control Avances */}
            <div style={{flex:"0 0 42%"}}>
              <div style={{background:t.secH,color:t.secHTxt,fontSize:7,fontWeight:800,padding:"1px 4px",border:`1px solid ${t.reportBorder}`,textTransform:"uppercase"}}>CONTROL DE AVANCES</div>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}></th>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}>Ø</th>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}>CANTIDAD</th>
                </tr></thead>
                <tbody>
                  {[
                    ["1. Profundidad al inicio del turno:",h.diametro||"HQ",h.profIni?h.profIni+" mt":""],
                    ["2. Profundidad al final del turno:",h.diametro||"HQ",(profIniVal+totP)>0?(profIniVal+totP).toFixed(2)+" mt":""],
                    ["3. Sobrante al final del turno:",h.diametro||"HQ",comp[comp.length-1]?.sob!=null?comp[comp.length-1].sob.toFixed(2)+" mt":""],
                    ["4. Longitud de tubería al final del turno:",h.diametro||"HQ",(()=>{const lastSob=comp[comp.length-1]?.sob;return (totP>0&&lastSob!=null&&cte>0)?+(profIniVal+totP+lastSob+cte).toFixed(2)+" mt":""})()],
                    ["5. Metros perforados:",h.diametro||"HQ",totP.toFixed(2)+" mt"],
                    ["6. Muestra recuperada:",h.diametro||"HQ",totR.toFixed(2)+" mt"],
                  ].map(([d,o,v],i)=>(
                    <tr key={i} style={{background:i%2===0?t.row1:t.row2}}>
                      <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,color:t.text}}>{d}</td>
                      <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.blue,fontWeight:700,textAlign:"center"}}>{o}</td>
                      <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,color:t.text,textAlign:"right"}}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Datos de Control */}
              <div style={{background:t.secH,color:t.secHTxt,fontSize:7,fontWeight:800,padding:"1px 4px",border:`1px solid ${t.reportBorder}`,marginTop:2,textTransform:"uppercase"}}>DATOS DE CONTROL</div>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}></th>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}>CANTIDAD</th>
                </tr></thead>
                <tbody>
                  {[
                    ["1. Horómetro inicial de maquina diamantina:",h.horometroIni?h.horometroIni+" h":""],
                    ["2. Consumo de combustible de maquina turno:",h.combustible?h.combustible+" gln":""],
                    ["3. Consumo de agua en la perforación turno:",h.agua?h.agua+" gln":""],
                    ["4. Horómetro final de maquina diamantina:",h.horometroFin?h.horometroFin+" h":""],
                  ].map(([d,v],i)=>(
                    <tr key={i} style={{background:i%2===0?t.row1:t.row2}}>
                      <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,color:t.text}}>{d}</td>
                      <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,color:t.text,textAlign:"right"}}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Aditivos */}
              <div style={{background:t.secH,color:t.secHTxt,fontSize:7,fontWeight:800,padding:"1px 4px",border:`1px solid ${t.reportBorder}`,marginTop:2,textTransform:"uppercase"}}>ADITIVOS</div>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}>ADITIVOS</th>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}>CANTIDAD</th>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}>ADITIVOS</th>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}>CANTIDAD</th>
                </tr></thead>
                <tbody>
                  {[[h.aditivo1,h.aditivo1Cant,h.aditivo2,h.aditivo2Cant],["","","",""],["","","",""]].map((row2,i)=>(
                    <tr key={i} style={{background:i%2===0?t.row1:t.row2}}>
                      {row2.map((v,j)=><td key={j} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,color:t.text,height:12}}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Distribucion Tiempo */}
            <div style={{flex:1}}>
              <div style={{background:t.secH,color:t.secHTxt,fontSize:7,fontWeight:800,padding:"1px 4px",border:`1px solid ${t.reportBorder}`,textTransform:"uppercase"}}>DISTRIBUCIÓN DE TIEMPO</div>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt,width:12}}>#</th>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt}}>DESCRIPCIÓN</th>
                  <th style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,background:t.th,color:t.thTxt,width:30}}>HORAS</th>
                </tr></thead>
                <tbody>
                  {DT.map((d,i)=>(
                    <tr key={i} style={{background:i%2===0?t.row1:t.row2}}>
                      <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text3,textAlign:"center"}}>{i+1}</td>
                      <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,color:t.text}}>{d}</td>
                      <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text}}>{h.dt[i]||""}</td>
                    </tr>
                  ))}
                  <tr style={{background:t.th}}>
                    <td colSpan={2} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,fontWeight:800,color:t.thTxt}}>TOTAL HORAS DE TURNO</td>
                    <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,fontWeight:800,color:t.yellow}}>{hTrab?hTrab+" h":""}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ACCESORIOS */}
          <div style={{background:t.secH,color:t.secHTxt,fontSize:7,fontWeight:800,padding:"1px 4px",border:`1px solid ${t.reportBorder}`,marginBottom:0,textTransform:"uppercase"}}>CONTROL DE RECORD ACCESORIOS DE PERFORACIÓN</div>
          <div style={{display:"flex",gap:3,marginBottom:2}}>
            <div style={{flex:"0 0 60%"}}>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr>
                  {["ACCESORIO","Ø","MARCA","SERIE","CÓDIGO","DESDE","HASTA","RECORD ACUM."].map(h2=>(
                    <th key={h2} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:6,background:t.th,color:t.thTxt}}>{h2}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[["BROCA",h.diametro||"HQ","HA9",h.brocaSerie,h.brocaCodigo,h.brocaDesde,h.brocaHasta,
                      h.brocaDesde&&h.brocaHasta?(parseFloat(h.brocaHasta)-parseFloat(h.brocaDesde)).toFixed(2):""],
                    ["R. SHELL",h.diametro||"HQ","",h.rshellSerie,h.rshellCodigo,h.rshellDesde,h.rshellHasta,
                      h.rshellDesde&&h.rshellHasta?(parseFloat(h.rshellHasta)-parseFloat(h.rshellDesde)).toFixed(2):""],
                    ["CASING SHOE",h.casingDiam||"",""," ","",h.casingDesde||"",h.casingHasta||"",h.casingDesde&&h.casingHasta?(parseFloat(h.casingHasta)-parseFloat(h.casingDesde)).toFixed(2):""],
                  ].map((row2,i)=>(
                    <tr key={i} style={{background:i%2===0?t.row1:t.row2}}>
                      {row2.map((v,j)=><td key={j} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text,height:13}}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Perforacion con Tricono */}
            <div style={{flex:1}}>
              <div style={{background:t.secH,color:t.secHTxt,fontSize:6,fontWeight:800,padding:"1px 3px",border:`1px solid ${t.reportBorder}`,textTransform:"uppercase"}}>PERFORACIÓN CON TRICONO</div>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr>
                  {["Ø","CÓDIGO","DESDE","HASTA","ACUMULADO"].map(h2=>(
                    <th key={h2} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 1px",fontSize:6,background:t.th,color:t.thTxt}}>{h2}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {Array(3).fill(null).map((_,i)=>(
                    <tr key={i} style={{background:i%2===0?t.row1:t.row2}}>
                      {Array(5).fill("").map((v,j)=><td key={j} style={{border:`1px solid ${t.reportBorder}`,padding:"1px",fontSize:7,height:13}}></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Instalacion Casing */}
              <div style={{background:t.secH,color:t.secHTxt,fontSize:6,fontWeight:800,padding:"1px 3px",border:`1px solid ${t.reportBorder}`,marginTop:2,textTransform:"uppercase"}}>INSTALACIÓN DE TUBERÍA CASING</div>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr>
                  {["Ø","DESDE","HASTA","ACUMULADO"].map(h2=>(
                    <th key={h2} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 1px",fontSize:6,background:t.th,color:t.thTxt}}>{h2}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {Array(2).fill(null).map((_,i)=>(
                    <tr key={i}><td colSpan={4} style={{border:`1px solid ${t.reportBorder}`,height:13}}></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PERFORACION + PRUEBAS */}
          <div style={{display:"flex",gap:3,marginBottom:2}}>
            {/* Tabla Perforacion */}
            <div style={{flex:"0 0 60%"}}>
              <div style={{background:t.secH,color:t.secHTxt,fontSize:7,fontWeight:800,padding:"1px 4px",border:`1px solid ${t.reportBorder}`,textTransform:"uppercase"}}>PERFORACIÓN (m)</div>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr>
                  {["N°","DESDE","HASTA","PERFOR.","RECUPERADO","% RECUP","% REC FLUIDO","TIPO DE ROCA"].map(h2=>(
                    <th key={h2} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 1px",fontSize:6,background:t.th,color:t.thTxt}}>{h2}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {vRows.map(({r,c:rc,i},n)=>{
                    const desde=n===0?0:(comp[i>0?i-1:0]?.prof||0);
                    const pCol2=!rc.pct?t.text3:+rc.pct>=90?t.green:+rc.pct>=70?t.yellow:t.red;
                    return(
                      <tr key={i} style={{background:n%2===0?t.row1:t.row2}}>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text,textAlign:"center"}}>{n+1}</td>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text}}>{desde.toFixed(2)}</td>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text}}>{rc.prof.toFixed(2)}</td>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text}}>{rc.perf.toFixed(2)}</td>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text}}>{r.recuperado||""}</td>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:pCol2,fontWeight:700}}>{rc.pct?rc.pct+"%":""}</td>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text}}>{r.recFluido||""}</td>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,color:t.text}}>{r.terreno||""}</td>
                      </tr>
                    );
                  })}
                  {Array(Math.max(0,22-vRows.length)).fill(null).map((_,i)=>(
                    <tr key={"e"+i} style={{background:i%2===0?t.row1:t.row2}}>
                      {Array(8).fill(null).map((_,j)=><td key={j} style={{border:`1px solid ${t.reportBorder}`,height:10,fontSize:7}}></td>)}
                    </tr>
                  ))}
                  <tr style={{background:t.th}}>
                    <td colSpan={3} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 3px",fontSize:7,fontWeight:800,color:t.thTxt}}>TOTAL</td>
                    <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,fontWeight:800,color:t.green}}>{totP.toFixed(2)}</td>
                    <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,fontWeight:800,color:t.blue}}>{totR.toFixed(2)}</td>
                    <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:7,fontWeight:800,color:!pctG?t.text3:+pctG>=90?t.green:+pctG>=70?t.yellow:t.red}}>{pctG?pctG+"%":"—"}</td>
                    <td style={{border:`1px solid ${t.reportBorder}`}}></td>
                    <td style={{border:`1px solid ${t.reportBorder}`}}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pruebas Geotecnicas + Piezometro + Cementado */}
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
              {/* Pruebas Geotecnicas */}
              <div>
                <div style={{background:t.secH,color:t.secHTxt,fontSize:6,fontWeight:800,padding:"1px 3px",border:`1px solid ${t.reportBorder}`,textTransform:"uppercase"}}>PRUEBAS GEOTÉCNICAS</div>
                <table style={{borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr>
                    {["DESCRIPCIÓN","DESDE","HASTA","CANTIDAD"].map(h2=>(
                      <th key={h2} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 1px",fontSize:6,background:t.th,color:t.thTxt}}>{h2}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {["Ensayos de SPT","Ensayos de LPT","Ensayos con Conopeck","Ensayos de Lugeon","Ensayos de Lefranc"].map((d,i)=>(
                      <tr key={i} style={{background:i%2===0?t.row1:t.row2}}>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:6,color:t.text}}>{d}</td>
                        {Array(3).fill("").map((_,j)=><td key={j} style={{border:`1px solid ${t.reportBorder}`,height:11,fontSize:7}}></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Piezometro */}
              <div>
                <div style={{background:t.secH,color:t.secHTxt,fontSize:6,fontWeight:800,padding:"1px 3px",border:`1px solid ${t.reportBorder}`,textTransform:"uppercase"}}>INSTALACIÓN DE PIEZÓMETRO</div>
                <table style={{borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr>
                    {["Ø","TIPO","DESDE","HASTA","CANTIDAD"].map(h2=>(
                      <th key={h2} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 1px",fontSize:6,background:t.th,color:t.thTxt}}>{h2}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {Array(3).fill(null).map((_,i)=>(
                      <tr key={i}><td colSpan={5} style={{border:`1px solid ${t.reportBorder}`,height:11}}></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cementado */}
              <div>
                <div style={{background:t.secH,color:t.secHTxt,fontSize:6,fontWeight:800,padding:"1px 3px",border:`1px solid ${t.reportBorder}`,textTransform:"uppercase"}}>CEMENTADO</div>
                <table style={{borderCollapse:"collapse",width:"100%"}}>
                  <thead><tr>
                    {["MATERIALES","Ø","DESDE","HASTA"].map(h2=>(
                      <th key={h2} style={{border:`1px solid ${t.reportBorder}`,padding:"1px 1px",fontSize:6,background:t.th,color:t.thTxt}}>{h2}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {["Cemento Bls","Sika Gln"].map((m,i)=>(
                      <tr key={i} style={{background:i%2===0?t.row1:t.row2}}>
                        <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 2px",fontSize:6,color:t.text}}>{m}</td>
                        {Array(3).fill("").map((_,j)=><td key={j} style={{border:`1px solid ${t.reportBorder}`,height:11,fontSize:7}}></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div style={{border:`1px solid ${t.reportBorder}`,marginBottom:2}}>
            <div style={{background:t.secH,color:t.secHTxt,fontSize:7,fontWeight:800,padding:"1px 4px",textTransform:"uppercase"}}>OBSERVACIONES IMPORTANTES:</div>
            <div style={{padding:"3px 4px",minHeight:28,fontSize:8,color:t.text,borderTop:`1px solid ${t.reportBorder}`}}>
              {h.observaciones||" "}
            </div>
          </div>

          {/* FIRMAS */}
          <table style={{borderCollapse:"collapse",width:"100%",border:`1px solid ${t.reportBorder}`}}>
            <tbody>
              <tr style={{background:t.secH}}>
                <td colSpan={2} style={{border:`1px solid ${t.reportBorder}`,padding:"2px 6px",textAlign:"center"}}>
                  <div style={{fontSize:7,fontWeight:800,color:t.secHTxt,textTransform:"uppercase"}}>PERSONAL DE TURNO</div>
                </td>
                <td style={{border:`1px solid ${t.reportBorder}`,padding:"2px 6px",textAlign:"center"}}>
                  <div style={{fontSize:7,fontWeight:800,color:t.secHTxt,textTransform:"uppercase"}}>{h.empresa||""}</div>
                </td>
                <td style={{border:`1px solid ${t.reportBorder}`,padding:"2px 6px",textAlign:"center"}}>
                  <div style={{fontSize:7,fontWeight:800,color:t.secHTxt,textTransform:"uppercase"}}>CLIENTE</div>
                </td>
              </tr>
              {[["SUPERVISOR:"],["PERFORISTA:"],["AYUDANTE 1:"],["AYUDANTE 2:"]].map(([rol],i)=>(
                <tr key={rol}>
                  <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 4px",width:"12%",whiteSpace:"nowrap"}}>
                    <div style={{fontSize:7,fontWeight:700,color:t.text3}}>{rol}</div>
                  </td>
                  <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 4px",width:"38%",height:18}}>
                    <div style={{fontSize:8,color:t.text}}>{i===0?h.supervisor:i===1?h.perforista:i===2?h.ayudante1:h.ayudante2}</div>
                  </td>
                  <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 4px",width:"25%",textAlign:"center",verticalAlign:"middle"}}>
                    {i===2&&<div style={{fontSize:7,fontWeight:700,color:t.text3}}>V° B° SUPERVISOR</div>}
                  </td>
                  <td style={{border:`1px solid ${t.reportBorder}`,padding:"1px 4px",width:"25%",textAlign:"center",verticalAlign:"middle"}}>
                    {i===2&&<div style={{fontSize:7,fontWeight:700,color:t.text3}}>V° B° SUPERVISOR</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>}

      <div style={{height:40}}/>
    </div>
  );
}
