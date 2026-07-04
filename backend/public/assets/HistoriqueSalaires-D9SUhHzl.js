import{r as y,j as e,M as B,J as A,T as i,D as W,G as c,B as v,V as J,p as T,C as X,a as E,S as L,aN as M,z as _,A as q,e as U,x as I,aL as K,F as Z,Y as H,Z as ee}from"./index-BGHuVC2V.js";import{C as te}from"./Container-DBeMkvoa.js";import{L as G}from"./LoadingOverlay-BBHRF3xP.js";import{S as re}from"./SimpleGrid-CK19Ay1I.js";import{T as g}from"./Table-DThD9mnL.js";import{T as ie}from"./Title-DBK6AsF7.js";import{h as ne}from"./html2pdf-D-GUOhS_.js";import{I as Y}from"./IconPrinter-CIGQVvWR.js";import{I as Q}from"./IconFile-CfNQVpGY.js";import{I as se}from"./IconInfoCircle-YFAtTVt0.js";import{I as oe}from"./IconTrendingUp-CyUlL3Oa.js";import{I as le}from"./IconFileWord-DNqc0IlQ.js";import{I as de}from"./IconCalendar-o8lvJQsf.js";import{I as ae}from"./IconUser-CQh-G5ME.js";import{I as O}from"./IconEye-DoRgnPIO.js";import"./get-base-value-CzvdkZld.js";const ce=({employeId:s,onClose:p})=>{const[t,C]=y.useState(null),[S,b]=y.useState(!0);y.useEffect(()=>{if(!s)return;(async()=>{try{b(!0);const h=await T(`/employes/${s}`);if(!h){b(!1);return}const $=await T("/atelier"),r=Array.isArray($)?$[0]:null,d=await T(`/salaires/employe/${s}`),j=Array.isArray(d)&&d.length>0?d[0]:null,n=await T(`/prestations-realisees/employe/${s}`),o=await T(`/emprunts/employe/${s}`);let f=[],k=0;h.type_remuneration==="fixe"?(f.push({code:"SALA",libelle:"Salaire de base mensuel",montant:Number(h.salaire_base||0)}),k=Number(h.salaire_base||0)):(n||[]).forEach((F,P)=>{f.push({code:`P${String(P+1).padStart(4,"0")}`,libelle:F.designation,montant:Number(F.total||0)}),k+=Number(F.total||0)});const N=[];let R=0;(o||[]).forEach((F,P)=>{N.push({code:`E${String(P+1).padStart(4,"0")}`,libelle:`Emprunt du ${new Date(F.date_emprunt).toLocaleDateString("fr-FR")}`,montant:Number(F.montant||0)}),R+=Number(F.montant||0)});const V=k-R;C({employe:h,atelier:r,salairePaye:j,avoirs:f,totalAvoirs:k,retenues:N,totalRetenues:R,netAPayer:V})}catch(h){console.error("Erreur bulletin:",h)}finally{b(!1)}})()},[s]);const w=()=>window.print(),a=()=>{const x=document.getElementById("bulletin-print");x&&ne().from(x).set({margin:8,filename:`decharge-${t?.employe.nom_prenom?.replace(/\s/g,"-")}.pdf`,html2canvas:{scale:2,letterRendering:!0},jsPDF:{format:"a4",orientation:"portrait"}}).save()};if(S)return e.jsx(B,{opened:!0,onClose:p,size:"xl",centered:!0,title:"Quittance de salaire",children:e.jsxs(A,{p:"lg",pos:"relative",children:[e.jsx(G,{visible:!0}),e.jsx(i,{children:"Chargement de la quittance..."})]})});if(!t)return null;const m=new Date,z=`MAT-${String(t.employe.id).padStart(6,"0")}`,u=`Q-${m.getFullYear()}${String(m.getMonth()+1).padStart(2,"0")}-${String(t.employe.id).padStart(4,"0")}`,l=t.salairePaye?new Date(t.salairePaye.date_paiement).toLocaleDateString("fr-FR"):"Non payé",D=t.salairePaye?.periode_debut&&t.salairePaye?.periode_fin?`du ${new Date(t.salairePaye.periode_debut).toLocaleDateString("fr-FR")} au ${new Date(t.salairePaye.periode_fin).toLocaleDateString("fr-FR")}`:"période concernée";return e.jsxs(B,{opened:!0,onClose:p,size:"1200px",centered:!0,padding:0,styles:{header:{display:"none"},body:{padding:0}},children:[e.jsxs("div",{id:"bulletin-print",style:{backgroundColor:"white",fontFamily:"Arial, Helvetica, sans-serif",fontSize:"11px"},children:[e.jsxs("div",{style:{padding:"20px 25px 15px 25px",borderBottom:"2px solid #1b365d"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsxs("div",{children:[t.atelier?.logo_base64&&e.jsx("img",{src:t.atelier.logo_base64,alt:"Logo",style:{height:"50px",marginBottom:"8px"}}),e.jsx("h2",{style:{margin:0,color:"#1b365d",fontSize:"18px",fontWeight:"bold"},children:t.atelier?.nom_atelier||"GESTION COUTURE"}),e.jsxs("div",{style:{marginTop:"5px",color:"#333",fontSize:"10px",lineHeight:"1.4"},children:[t.atelier?.adresse&&e.jsx("div",{children:t.atelier.adresse}),t.atelier?.ville&&e.jsxs("div",{children:[t.atelier.ville,", ",t.atelier?.pays]}),t.atelier?.telephone&&e.jsxs("div",{children:["Tél: ",t.atelier.telephone]}),t.atelier?.email&&e.jsxs("div",{children:["Email: ",t.atelier.email]}),t.atelier?.ifu&&e.jsxs("div",{children:["IFU: ",t.atelier.ifu]}),t.atelier?.rccm&&e.jsxs("div",{children:["RCCM: ",t.atelier.rccm]})]})]}),e.jsxs("div",{style:{textAlign:"right"},children:[e.jsxs("div",{style:{border:"2px solid #1b365d",padding:"10px 20px",backgroundColor:"#f8f9fa"},children:[e.jsx("h1",{style:{margin:0,fontSize:"20px",letterSpacing:"1px",color:"#1b365d"},children:"QUITTANCE"}),e.jsx("h2",{style:{margin:"3px 0 0 0",fontSize:"14px",fontWeight:"normal",color:"#333"},children:"DE SALAIRE"})]}),e.jsxs("div",{style:{marginTop:"8px",fontSize:"10px"},children:["N°: ",u]})]})]}),e.jsxs("div",{style:{textAlign:"center",marginTop:"15px"},children:[e.jsx("h3",{style:{margin:0,fontSize:"14px",textTransform:"uppercase"},children:"Quittance de paiement"}),e.jsxs("div",{style:{fontSize:"10px",color:"#666"},children:["Date d'édition : ",m.toLocaleDateString("fr-FR")]})]})]}),e.jsx("div",{style:{padding:"15px 25px",backgroundColor:"#fafafa",borderBottom:"1px solid #ddd"},children:e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:"10px",fontSize:"10px"},children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Matricule :"})," ",z]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Nom complet :"})," ",t.employe.nom_prenom]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Type :"})," ",t.employe.type_remuneration==="fixe"?"Salaire fixe":"Prestataire"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Téléphone :"})," ",t.employe.telephone||"Non renseigné"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Date d'embauche :"})," ",t.employe.date_embauche?new Date(t.employe.date_embauche).toLocaleDateString("fr-FR"):"Non renseignée"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Lieu de résidence :"})," ",t.employe.lieu_residence||"Non renseigné"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Personne à prévenir :"})," ",t.employe.personne_a_prevenir||"Non renseignée"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Date paiement :"})," ",l]})]})}),e.jsx("div",{style:{padding:"20px 25px"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:"10px"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{backgroundColor:"#1b365d",color:"white"},children:[e.jsx("th",{style:{padding:"8px",textAlign:"left",width:"10%"},children:"Code"}),e.jsx("th",{style:{padding:"8px",textAlign:"left",width:"50%"},children:"Libellés des éléments de paie"}),e.jsx("th",{style:{padding:"8px",textAlign:"right",width:"20%"},children:"Avoirs (FCFA)"}),e.jsx("th",{style:{padding:"8px",textAlign:"right",width:"20%"},children:"Retenues (FCFA)"})]})}),e.jsxs("tbody",{children:[t.avoirs.map((x,h)=>e.jsxs("tr",{style:{borderBottom:"1px solid #eee"},children:[e.jsx("td",{style:{padding:"6px"},children:x.code}),e.jsx("td",{style:{padding:"6px"},children:x.libelle}),e.jsx("td",{style:{padding:"6px",textAlign:"right",color:"#2e7d32"},children:x.montant.toLocaleString()}),e.jsx("td",{style:{padding:"6px",textAlign:"right"},children:"-"})]},`avoir-${h}`)),t.retenues.map((x,h)=>e.jsxs("tr",{style:{borderBottom:"1px solid #eee"},children:[e.jsx("td",{style:{padding:"6px"},children:x.code}),e.jsx("td",{style:{padding:"6px"},children:x.libelle}),e.jsx("td",{style:{padding:"6px",textAlign:"right"},children:"-"}),e.jsx("td",{style:{padding:"6px",textAlign:"right",color:"#d32f2f"},children:x.montant.toLocaleString()})]},`retenue-${h}`)),t.avoirs.length===0&&t.retenues.length===0&&e.jsx("tr",{children:e.jsx("td",{colSpan:4,style:{padding:"20px",textAlign:"center",color:"#999"},children:"Aucun élément de paie trouvé"})})]}),e.jsx("tfoot",{children:e.jsxs("tr",{style:{backgroundColor:"#f0f7ff",fontWeight:"bold"},children:[e.jsx("td",{colSpan:2,style:{padding:"8px",textAlign:"right"},children:"TOTAUX :"}),e.jsx("td",{style:{padding:"8px",textAlign:"right",color:"#2e7d32"},children:t.totalAvoirs.toLocaleString()}),e.jsx("td",{style:{padding:"8px",textAlign:"right",color:"#d32f2f"},children:t.totalRetenues.toLocaleString()})]})})]})}),e.jsx("div",{style:{padding:"15px 25px",backgroundColor:"#f8f9fa",borderTop:"1px solid #ddd",borderBottom:"1px solid #ddd"},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"15px"},children:[e.jsxs("div",{style:{fontSize:"10px"},children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Période :"})," ",D]}),t.salairePaye?.mode&&e.jsxs("div",{children:[e.jsx("strong",{children:"Mode de paiement :"})," ",t.salairePaye.mode]})]}),e.jsx("div",{style:{fontSize:"12px"},children:e.jsx("table",{style:{borderCollapse:"collapse"},children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{style:{padding:"4px 8px"},children:e.jsx("strong",{children:"Brut à payer :"})}),e.jsxs("td",{style:{padding:"4px 8px",textAlign:"right"},children:[t.totalAvoirs.toLocaleString()," FCFA"]})]}),e.jsxs("tr",{style:{borderTop:"2px solid #ddd"},children:[e.jsx("td",{style:{padding:"4px 8px"},children:e.jsx("strong",{children:"NET PAYÉ :"})}),e.jsxs("td",{style:{padding:"4px 8px",textAlign:"right",fontWeight:"bold",fontSize:"16px",color:"#1b365d"},children:[t.netAPayer.toLocaleString()," FCFA"]})]})]})})})]})}),e.jsx("div",{style:{padding:"20px 25px",textAlign:"center"},children:e.jsxs("div",{style:{border:"1px solid #ddd",padding:"20px",borderRadius:"8px",backgroundColor:"#fefce8"},children:[e.jsx("div",{style:{fontSize:"12px",fontWeight:"bold",marginBottom:"15px"},children:"DÉCHARGE"}),e.jsxs("div",{style:{fontSize:"11px",lineHeight:"1.6",textAlign:"justify"},children:["Je soussigné(e) ",e.jsx("strong",{children:t.employe.nom_prenom}),", reconnais avoir reçu ce jour ",e.jsx("strong",{children:l}),", la somme de ",e.jsxs("strong",{style:{fontSize:"14px"},children:[t.netAPayer.toLocaleString()," FCFA"]}),"(",xe(t.netAPayer).toUpperCase(),"), correspondant au paiement de mon salaire pour ",D,".",e.jsx("br",{}),e.jsx("br",{}),"Je déclare que ce paiement est complet et libératoire."]})]})}),e.jsxs("div",{style:{padding:"15px 25px",display:"flex",justifyContent:"space-between",alignItems:"flex-end"},children:[e.jsxs("div",{style:{fontSize:"9px",color:"#666",fontStyle:"italic",maxWidth:"60%"},children:[e.jsx("strong",{children:"Observations :"}),e.jsx("br",{}),t.salairePaye?.observation||t.atelier?.message_facture_defaut||"Merci pour votre travail."]}),e.jsxs("div",{style:{textAlign:"right"},children:[e.jsx("div",{style:{width:"180px",borderTop:"1px solid #000",marginBottom:"3px"}}),e.jsx("div",{style:{fontSize:"9px",color:"#666"},children:"Signature de l'employé"})]})]}),e.jsxs("div",{style:{padding:"10px 25px",backgroundColor:"#f0f0f0",textAlign:"center",borderTop:"1px solid #ddd"},children:[e.jsxs("div",{style:{fontSize:"8px",color:"#999"},children:["Document généré automatiquement par Gestion Couture - ",m.toLocaleString()]}),e.jsx("div",{style:{fontSize:"8px",color:"#999",marginTop:"3px"},children:"Cachet de l'atelier"})]})]}),e.jsx(W,{}),e.jsxs(c,{justify:"flex-end",p:"md",className:"no-print",children:[e.jsx(v,{variant:"light",onClick:p,leftSection:e.jsx(J,{size:16}),radius:"md",children:"Fermer"}),e.jsx(v,{onClick:w,variant:"outline",color:"teal",leftSection:e.jsx(Y,{size:16}),radius:"md",children:"Imprimer"}),e.jsx(v,{onClick:a,variant:"gradient",gradient:{from:"#1b365d",to:"#2a4a7a"},leftSection:e.jsx(Q,{size:16}),radius:"md",children:"PDF"})]}),e.jsx("style",{children:`
        @media print {
          .no-print { display: none !important; }
          #bulletin-print { margin: 0; padding: 0; }
          body { background: white; margin: 0; }
          .mantine-Modal-root { display: none; }
          @page { margin: 1cm; }
        }
      `})]})};function pe(s){if(s===0)return"zéro";const p=["","un","deux","trois","quatre","cinq","six","sept","huit","neuf"],t=["","dix","vingt","trente","quarante","cinquante","soixante","soixante-dix","quatre-vingt","quatre-vingt-dix"],C=a=>{if(a<10)return p[a];if(a<20)return a===11?"onze":a===12?"douze":`${t[1]}${a>10?"-"+p[a-10]:""}`;const m=Math.floor(a/10),z=a%10;return m===7||m===9?`${t[m-1]}${z>0?"-"+p[z]:""}`:`${t[m]}${z>0?"-"+p[z]:""}`},S=Math.floor(s/1e3),b=s%1e3;let w="";return S>0&&(S===1?w+="mille ":w+=`${C(S)} mille `),b>0&&(w+=C(b)),w.trim()}function xe(s){const p=Math.floor(s);return p===0?"zéro francs":`${pe(p)} francs`}const Te=()=>{const[s,p]=y.useState([]),[t,C]=y.useState(!0),[S,b]=y.useState(null),[w,a]=y.useState(!1),m=y.useRef(null);y.useEffect(()=>{z()},[]);const z=async()=>{C(!0);try{const r=await T("/historique-salaires");p(r||[])}catch(r){console.error("Erreur chargement:",r)}finally{C(!1)}},u=s.reduce((r,d)=>r+(d.montant||0),0),l=s.length,D=()=>{const r=m.current?.cloneNode(!0);if(!r)return;const d=document.querySelectorAll('style, link[rel="stylesheet"]');let j="";d.forEach(f=>{f.tagName==="STYLE"?j+=f.outerHTML:f.tagName==="LINK"&&(j+=`<link rel="stylesheet" href="${f.href}">`)});const n=document.createElement("iframe");n.style.position="absolute",n.style.width="0",n.style.height="0",n.style.border="none",document.body.appendChild(n);const o=n.contentWindow?.document;o&&(o.open(),o.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Historique des salaires</title>
        ${j}
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 20px;
            margin: 0;
            background: white;
          }
          .print-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1b365d;
          }
          .print-header h1 {
            color: #1b365d;
            margin-bottom: 10px;
          }
          .print-stats {
            margin-bottom: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #1b365d;
            color: white;
            padding: 12px;
            border: 1px solid #2a4a7a;
            text-align: left;
          }
          td {
            padding: 10px;
            border: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .print-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #999;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .print-container {
              margin: 0;
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="print-header">
            <h1>📋 Historique des salaires</h1>
            <p>Document généré le ${new Date().toLocaleString("fr-FR")}</p>
          </div>
          <div class="print-stats">
            <p><strong>Total des paiements :</strong> ${l}</p>
            <p><strong>Montant total :</strong> ${u.toLocaleString()} FCFA</p>
            <p><strong>Moyenne par paiement :</strong> ${(l>0?Math.round(u/l):0).toLocaleString()} FCFA</p>
          </div>
          ${r.querySelector("table")?.outerHTML||""}
          <div class="print-footer">
            <p>Document généré par Gestion Couture - Application de gestion d'atelier professionnel</p>
            <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `),o.close(),n.onload=()=>{n.contentWindow?.focus(),n.contentWindow?.print(),setTimeout(()=>document.body.removeChild(n),1e3)})},x=async()=>{const r=[["Date","Employé","Montant (FCFA)"],...s.map(o=>[new Date(o.date).toLocaleDateString("fr-FR"),o.nom,o.montant.toString()])].map(o=>o.join(",")).join(`
`),d=new Blob([r],{type:"text/csv;charset=utf-8;"}),j=URL.createObjectURL(d),n=document.createElement("a");n.href=j,n.download=`salaires_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(j)},h=()=>{const r=window.open("","","width=800,height=600");r&&(r.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Historique des salaires</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1b365d; border-bottom: 2px solid #1b365d; }
          .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1b365d; color: white; padding: 10px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .total { margin-top: 20px; text-align: right; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <h1>📋 Historique des salaires</h1>
        <div class="stats">
          <p><strong>Date d'export :</strong> ${new Date().toLocaleString("fr-FR")}</p>
          <p><strong>Nombre de paiements :</strong> ${l}</p>
          <p><strong>Montant total :</strong> ${u.toLocaleString()} FCFA</p>
          <p><strong>Moyenne :</strong> ${(l>0?Math.round(u/l):0).toLocaleString()} FCFA</p>
        </div>
        <tr>
          <thead><tr><th>Date</th><th>Employé</th><th>Montant (FCFA)</th></tr></thead>
          <tbody>
            ${s.map(d=>`
              <tr>
                <td>${new Date(d.date).toLocaleDateString("fr-FR")}</td>
                <td>${d.nom}</td>
                <td style="text-align: right">${d.montant.toLocaleString()} FCFA</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="total">Total général : ${u.toLocaleString()} FCFA</div>
        <div class="footer">Document généré par Gestion Couture - © ${new Date().getFullYear()}</div>
      </body>
      </html>
    `),r.document.close(),r.print())},$=async()=>{const r=s.map(f=>`
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(f.date).toLocaleDateString("fr-FR")}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${f.nom}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${f.montant.toLocaleString()} FCFA</td>
      </tr>
    `).join(""),d=`<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Historique des salaires</title>
      <style>
        body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; }
        h1 { color: #1b365d; border-bottom: 3px solid #1b365d; padding-bottom: 10px; }
        .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1b365d; color: white; padding: 12px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
      </style>
    </head>
    <body>
      <h1>📋 Historique des salaires</h1>
      <div class="stats">
        <p><strong>Date d'export :</strong> ${new Date().toLocaleString("fr-FR")}</p>
        <p><strong>Nombre de paiements :</strong> ${l}</p>
        <p><strong>Montant total :</strong> ${u.toLocaleString()} FCFA</p>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Employé</th><th>Montant (FCFA)</th></tr></thead>
        <tbody>${r}</tbody>
      </table>
      <div class="footer">
        <p>Total général : <strong>${u.toLocaleString()} FCFA</strong></p>
        <p>Document généré par Gestion Couture - © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>`,j=new Blob([d],{type:"application/msword"}),n=URL.createObjectURL(j),o=document.createElement("a");o.href=n,o.download=`salaires_${new Date().toISOString().slice(0,10)}.doc`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(n)};return t?e.jsx(X,{style:{height:"50vh"},children:e.jsxs(E,{withBorder:!0,radius:"lg",p:"xl",children:[e.jsx(G,{visible:!0}),e.jsxs(L,{align:"center",gap:"md",children:[e.jsx(M,{size:40,stroke:1.5}),e.jsx(i,{children:"Chargement de l'historique..."})]})]})}):e.jsx(_,{p:"md",children:e.jsx(te,{size:"full",children:e.jsxs(L,{gap:"lg",children:[e.jsx(E,{withBorder:!0,radius:"lg",p:"xl",style:{background:"linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)"},children:e.jsxs(c,{justify:"space-between",align:"center",children:[e.jsxs(c,{gap:"md",children:[e.jsx(q,{size:60,radius:"md",style:{backgroundColor:"rgba(255,255,255,0.2)"},children:e.jsx(M,{size:30,color:"white"})}),e.jsxs(_,{children:[e.jsx(ie,{order:1,c:"white",size:"h2",children:"Historique des salaires"}),e.jsx(i,{c:"gray.3",size:"sm",mt:4,children:"Suivi de tous les paiements de salaires"}),e.jsx(c,{gap:"xs",mt:8,children:e.jsxs(U,{size:"sm",variant:"white",color:"blue",children:[l," paiement",l>1?"s":""]})})]})]}),e.jsx(v,{variant:"light",color:"white",leftSection:e.jsx(se,{size:18}),onClick:()=>a(!0),radius:"md",children:"Instructions"})]})}),e.jsxs(re,{cols:{base:1,md:3},spacing:"md",children:[e.jsxs(A,{p:"md",radius:"lg",withBorder:!0,style:{backgroundColor:"#e8f4fd"},children:[e.jsxs(c,{justify:"space-between",mb:"xs",children:[e.jsx(i,{size:"xs",c:"dimmed",tt:"uppercase",fw:600,children:"Total versé"}),e.jsx(I,{size:"lg",radius:"md",color:"blue",variant:"light",children:e.jsx(K,{size:18})})]}),e.jsxs(i,{fw:700,size:"xl",c:"blue",children:[u.toLocaleString()," FCFA"]})]}),e.jsxs(A,{p:"md",radius:"lg",withBorder:!0,style:{backgroundColor:"#ebfbee"},children:[e.jsxs(c,{justify:"space-between",mb:"xs",children:[e.jsx(i,{size:"xs",c:"dimmed",tt:"uppercase",fw:600,children:"Nombre de paiements"}),e.jsx(I,{size:"lg",radius:"md",color:"green",variant:"light",children:e.jsx(Z,{size:18})})]}),e.jsx(i,{fw:700,size:"xl",c:"green",children:l})]}),e.jsxs(A,{p:"md",radius:"lg",withBorder:!0,children:[e.jsxs(c,{justify:"space-between",mb:"xs",children:[e.jsx(i,{size:"xs",c:"dimmed",tt:"uppercase",fw:600,children:"Moyenne par paiement"}),e.jsx(I,{size:"lg",radius:"md",color:"orange",variant:"light",children:e.jsx(oe,{size:18})})]}),e.jsxs(i,{fw:700,size:"xl",c:"orange",children:[l>0?Math.round(u/l).toLocaleString():0," FCFA"]})]})]}),e.jsx(E,{withBorder:!0,radius:"lg",shadow:"sm",p:"md",children:e.jsxs(c,{justify:"flex-end",gap:"sm",children:[e.jsx(v,{variant:"subtle",color:"teal",leftSection:e.jsx(Y,{size:16}),onClick:D,size:"compact-sm",children:"Imprimer"}),e.jsx(v,{variant:"subtle",color:"green",leftSection:e.jsx(H,{size:16}),onClick:x,size:"compact-sm",children:"Excel"}),e.jsx(v,{variant:"subtle",color:"red",leftSection:e.jsx(Q,{size:16}),onClick:h,size:"compact-sm",children:"PDF"}),e.jsx(v,{variant:"subtle",color:"blue",leftSection:e.jsx(le,{size:16}),onClick:$,size:"compact-sm",children:"Word"})]})}),e.jsx("div",{ref:m,children:e.jsx(E,{withBorder:!0,radius:"lg",shadow:"sm",p:0,style:{overflow:"hidden"},children:s.length===0?e.jsxs(L,{align:"center",py:60,gap:"sm",children:[e.jsx(I,{size:"xl",radius:"xl",color:"gray",variant:"light",children:e.jsx(M,{size:30})}),e.jsx(i,{c:"dimmed",size:"lg",children:"Aucun paiement trouvé"})]}):e.jsxs(g,{striped:!0,highlightOnHover:!0,verticalSpacing:"xs",horizontalSpacing:"sm",children:[e.jsx(g.Thead,{style:{backgroundColor:"#1b365d"},children:e.jsxs(g.Tr,{children:[e.jsx(g.Th,{style:{color:"white",padding:"10px 12px",width:120},children:"Date"}),e.jsx(g.Th,{style:{color:"white",padding:"10px 12px"},children:"Employé"}),e.jsx(g.Th,{style:{color:"white",textAlign:"right",padding:"10px 12px",width:150},children:"Montant"}),e.jsx(g.Th,{style:{color:"white",textAlign:"center",padding:"10px 12px",width:100},children:"Actions"})]})}),e.jsx(g.Tbody,{children:s.map(r=>e.jsxs(g.Tr,{children:[e.jsx(g.Td,{style:{padding:"8px 12px"},children:e.jsxs(c,{gap:4,wrap:"nowrap",children:[e.jsx(de,{size:12,color:"#1b365d"}),e.jsx(i,{size:"sm",children:new Date(r.date).toLocaleDateString("fr-FR")})]})}),e.jsx(g.Td,{style:{padding:"8px 12px"},children:e.jsxs(c,{gap:4,wrap:"nowrap",children:[e.jsx(q,{size:24,radius:"xl",color:"blue",children:e.jsx(ae,{size:12})}),e.jsx(i,{size:"sm",children:r.nom})]})}),e.jsx(g.Td,{ta:"right",style:{padding:"8px 12px"},children:e.jsxs(U,{color:"green",variant:"light",size:"sm",children:[r.montant.toLocaleString()," FCFA"]})}),e.jsx(g.Td,{style:{padding:"8px 12px"},children:e.jsx(c,{justify:"center",children:e.jsx(ee,{label:"Voir le bulletin",children:e.jsx(v,{size:"compact-xs",variant:"light",color:"blue",leftSection:e.jsx(O,{size:14}),onClick:()=>b(r.employe_id),radius:"md",children:"Bulletin"})})})})]},r.id))})]})})}),e.jsx(A,{p:"md",radius:"lg",withBorder:!0,bg:"gray.0",children:e.jsx(c,{justify:"flex-end",children:e.jsxs(i,{fw:700,size:"lg",children:["Total général : ",e.jsxs("span",{style:{color:"#1b365d"},children:[u.toLocaleString()," FCFA"]})]})})}),e.jsx(B,{opened:w,onClose:()=>a(!1),title:"📋 Historique des salaires",size:"md",centered:!0,radius:"lg",styles:{header:{backgroundColor:"#1b365d",padding:"16px 20px"},title:{color:"white",fontWeight:600},body:{padding:"24px"}},children:e.jsxs(L,{gap:"md",children:[e.jsxs(A,{p:"md",radius:"md",withBorder:!0,bg:"blue.0",children:[e.jsx(i,{fw:600,size:"sm",mb:"md",children:"📌 Fonctionnalités :"}),e.jsxs(L,{gap:"xs",children:[e.jsx(i,{size:"sm",children:"1️⃣ Ce tableau montre l'historique complet des paiements de salaires"}),e.jsx(i,{size:"sm",children:"2️⃣ Utilisez les boutons d'export pour sauvegarder les données"}),e.jsx(i,{size:"sm",children:`3️⃣ Cliquez sur "Bulletin" pour voir le détail d'un paiement`}),e.jsx(i,{size:"sm",children:"4️⃣ Le total général est affiché en bas du tableau"})]})]}),e.jsxs(A,{p:"md",radius:"md",withBorder:!0,bg:"yellow.0",children:[e.jsx(i,{fw:600,size:"sm",mb:"md",children:"💡 Informations :"}),e.jsxs(L,{gap:"xs",children:[e.jsxs(c,{gap:"xs",children:[e.jsx(O,{size:16,color:"#e65100"}),e.jsx(i,{size:"sm",children:"Le bulletin détaille le brut, les retenues et le net"})]}),e.jsxs(c,{gap:"xs",children:[e.jsx(H,{size:16,color:"#e65100"}),e.jsx(i,{size:"sm",children:"Les exports sont disponibles en CSV, PDF et Word"})]})]})]}),e.jsx(W,{}),e.jsx(i,{size:"xs",c:"dimmed",ta:"center",children:"Version 1.0.0 - Gestion Couture"})]})}),S&&e.jsx(ce,{employeId:S,onClose:()=>b(null)})]})})})};export{Te as default};
