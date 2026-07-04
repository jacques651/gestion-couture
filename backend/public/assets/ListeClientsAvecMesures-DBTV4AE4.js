import{c as X,r as c,o as q,j as e,N as H,S as C,G as d,t as Te,Q as he,T as Q,g as K,R as u,B as f,U as $e,V as xe,d as r,W as A,X as ke,J as me,w as O,H as De,D as Y,p as Me,Y as Le,Z as Fe,C as Oe,a as V,L as Ne,O as oe,f as le,b as ae,h as de,A as Pe,_ as Re,$ as Be,i as Ue,a0 as Ve,M as a,a1 as F,a2 as We,a3 as Ge,a4 as W,a5 as qe,a6 as He,a7 as Qe,a8 as G,m as Ke}from"./index-BA-Rp2mN.js";import{u as ce}from"./useMutation-DUj4zgFQ.js";import{F as Ye}from"./FormulaireClient-EBI2aeXl.js";import{I as Xe,a as pe}from"./ImportClientsExcel-BawewfNO.js";import{I as Je}from"./IconInfoCircle-COLzpNA3.js";import{I as Ze}from"./IconFile-DM0C3ui7.js";import{I as et,a as tt}from"./IconPlus-BIHnsZET.js";import{I as st}from"./IconClock-CEOWTz1r.js";import"./Textarea-Bzs_Rjn3.js";import"./FormulaireTypeMesure-BQltg6Ky.js";import"./IconArrowLeft-B9_iaaXQ.js";import"./IconDeviceFloppy-DCySLQid.js";import"./IconUser-DhNlAVwS.js";import"./IconPhone-DOk1aCg0.js";import"./IconMapPin-CBU9bgki.js";import"./IconAt-D81SZ_LU.js";import"./Progress-Br8SrfTB.js";import"./RingProgress-T-Y465Mf.js";import"./IconUpload-Cneel_eQ.js";const rt=[["path",{d:"M12.983 8.978c3.955 -.182 7.017 -1.446 7.017 -2.978c0 -1.657 -3.582 -3 -8 -3c-1.661 0 -3.204 .19 -4.483 .515m-2.783 1.228c-.471 .382 -.734 .808 -.734 1.257c0 1.22 1.944 2.271 4.734 2.74",key:"svg-0"}],["path",{d:"M4 6v6c0 1.657 3.582 3 8 3c.986 0 1.93 -.067 2.802 -.19m3.187 -.82c1.251 -.53 2.011 -1.228 2.011 -1.99v-6",key:"svg-1"}],["path",{d:"M4 12v6c0 1.657 3.582 3 8 3c3.217 0 5.991 -.712 7.261 -1.74m.739 -3.26v-4",key:"svg-2"}],["path",{d:"M3 3l18 18",key:"svg-3"}]],nt=X("outline","database-off","DatabaseOff",rt);const it=[["path",{d:"M13 20l7 -7",key:"svg-0"}],["path",{d:"M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7",key:"svg-1"}]],ot=X("outline","note","Note",it);const lt=[["path",{d:"M4 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",key:"svg-0"}],["path",{d:"M15 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",key:"svg-1"}],["path",{d:"M17 17h-11v-14h-2",key:"svg-2"}],["path",{d:"M6 5l14 1l-1 7h-13",key:"svg-3"}]],at=X("outline","shopping-cart","ShoppingCart",lt),dt=({client:p,mesures:j,onClose:w})=>{c.useState(!1);const T=c.useRef(null),z=(o="A4")=>{if(!T.current?.innerHTML)return;const b={A4:{width:210,height:297,margin:10,fontSize:11},A5:{width:148,height:210,margin:8,fontSize:9},A6:{width:105,height:148,margin:6,fontSize:8}}[o],$=`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fiche mesures - ${p.nom_prenom}</title>
        <meta charset="UTF-8">
        <style>
          @page { 
            size: ${o};
            margin: ${b.margin}mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            font-size: ${b.fontSize}px;
            line-height: 1.3;
            color: #333;
          }
          .print-container {
            width: 100%;
          }
          .header {
            text-align: center;
            margin-bottom: 6px;
            border-bottom: 2px solid #1b365d;
            padding-bottom: 4px;
          }
          h1 {
            font-size: ${o==="A4"?"16":o==="A5"?"14":"12"}px;
            font-weight: bold;
            color: #1b365d;
            margin-bottom: 3px;
          }
          .client-name {
            font-size: ${o==="A4"?"13":o==="A5"?"11":"10"}px;
            font-weight: 600;
            margin: 3px 0;
          }
          .client-info {
            font-size: ${o==="A4"?"10":"9"}px;
            color: #7f8c8d;
            margin: 2px 0;
          }
          .date {
            font-size: ${o==="A4"?"9":"8"}px;
            color: #95a5a6;
          }
          .observations-box {
            background: #f0f7ff;
            border-left: 3px solid #1b365d;
            padding: 6px 8px;
            margin: 6px 0;
            border-radius: 4px;
          }
          .observations-title {
            font-weight: 600;
            font-size: ${o==="A4"?"10":"9"}px;
            margin-bottom: 3px;
          }
          .observations-text {
            font-size: ${o==="A4"?"9":"8"}px;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: ${o==="A4"?"5px 6px":o==="A5"?"4px 5px":"3px 4px"};
            text-align: left;
          }
          th {
            background: #1b365d;
            color: white;
            font-weight: 600;
            font-size: ${o==="A4"?"10":"9"}px;
          }
          td {
            font-size: ${o==="A4"?"10":"9"}px;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .footer {
            margin-top: 8px;
            text-align: center;
            font-size: 8px;
            color: #95a5a6;
            border-top: 1px solid #ecf0f1;
            padding-top: 4px;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>FICHE MESURES</h1>
            <div class="client-name">${p.nom_prenom}</div>
            ${p.telephone_id?`<div class="client-info">📞 ${p.telephone_id}</div>`:""}
            <div class="date">📅 ${new Date().toLocaleDateString()}</div>
          </div>
          ${p.observations?`
            <div class="observations-box">
              <div class="observations-title">📝 Observations</div>
              <div class="observations-text">${p.observations}</div>
            </div>
          `:""}
          <table>
            <thead>
              <tr><th>Mesure</th><th>Valeur</th></tr>
            </thead>
            <tbody>
              ${j.map(_=>`
                <tr>
                  <td>${_.nom}</td>
                  <td><strong>${_.valeur}</strong> ${_.unite||"cm"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          ${j.length===0?'<p style="text-align:center; padding:20px;">Aucune mesure enregistrée</p>':""}
          <div class="footer">
            Document généré par Gestion Couture - ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
    </html>
  `,g=document.createElement("iframe");g.style.position="absolute",g.style.width="0",g.style.height="0",g.style.border="none",document.body.appendChild(g);const v=g.contentWindow?.document;v&&(v.open(),v.write($),v.close(),g.onload=()=>{g.contentWindow?.focus(),g.contentWindow?.print(),setTimeout(()=>{document.body.removeChild(g)},1e3)})};return q({utilisateur:"Utilisateur",action:"CREATE",table:"impression_mesures",idEnregistrement:p.telephone_id,details:`Impression fiche mesures (${FormData}) : ${p.nom_prenom}`}),e.jsx(H,{opened:!0,onClose:w,size:"800px",centered:!0,overlayProps:{blur:3},padding:0,styles:{header:{display:"none"},body:{padding:0}},children:e.jsxs(C,{gap:0,children:[e.jsxs(d,{justify:"space-between",p:"md",style:{backgroundColor:"#1b365d"},children:[e.jsxs(d,{gap:"xs",children:[e.jsx(Te,{size:"md",radius:"md",style:{backgroundColor:"rgba(255,255,255,0.2)"},children:e.jsx(he,{size:18,color:"white"})}),e.jsxs(Q,{order:3,c:"white",size:"h4",children:["Fiche mesures - ",p.nom_prenom]}),e.jsxs(K,{size:"sm",variant:"light",color:"white",style:{backgroundColor:"rgba(255,255,255,0.2)"},children:[j.length," mesures"]})]}),e.jsxs(d,{gap:"xs",children:[e.jsxs(u,{shadow:"md",width:200,children:[e.jsx(u.Target,{children:e.jsx(f,{variant:"light",color:"white",size:"sm",leftSection:e.jsx(xe,{size:16}),rightSection:e.jsx($e,{size:14}),children:"Imprimer"})}),e.jsxs(u.Dropdown,{children:[e.jsx(u.Label,{children:"📄 Choisir le format"}),e.jsx(u.Item,{onClick:()=>z("A4"),children:e.jsxs(d,{justify:"space-between",style:{width:"100%"},children:[e.jsx("span",{children:"📄 Format A4"}),e.jsx(r,{size:"xs",c:"dimmed",children:"21 x 29,7 cm"})]})}),e.jsx(u.Item,{onClick:()=>z("A5"),children:e.jsxs(d,{justify:"space-between",style:{width:"100%"},children:[e.jsx("span",{children:"📄 Format A5"}),e.jsx(r,{size:"xs",c:"dimmed",children:"14,8 x 21 cm"})]})}),e.jsx(u.Item,{onClick:()=>z("A6"),children:e.jsxs(d,{justify:"space-between",style:{width:"100%"},children:[e.jsx("span",{children:"📄 Format A6"}),e.jsx(r,{size:"xs",c:"dimmed",children:"10,5 x 14,8 cm"})]})})]})]}),e.jsx(A,{variant:"light",color:"white",onClick:w,size:"lg",children:e.jsx(ke,{size:18})})]})]}),e.jsx(me,{style:{maxHeight:"calc(100vh - 200px)"},children:e.jsx("div",{ref:T,style:{padding:"30px",backgroundColor:"white"},children:e.jsxs(O,{style:{maxWidth:"700px",margin:"0 auto"},children:[p.observations&&e.jsxs(De,{p:"md",withBorder:!0,mb:"xl",style:{background:"#f0f7ff",borderLeft:"4px solid #1b365d"},children:[e.jsxs(d,{gap:"xs",mb:5,children:[e.jsx(ot,{size:14}),e.jsx(r,{fw:600,children:"Observations"})]}),e.jsx(r,{size:"sm",children:p.observations})]}),e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{backgroundColor:"#1b365d"},children:[e.jsx("th",{style:{padding:"10px",border:"1px solid #2c3e50",color:"white",textAlign:"left"},children:"Mesure"}),e.jsx("th",{style:{padding:"10px",border:"1px solid #2c3e50",color:"white",textAlign:"left"},children:"Valeur"})]})}),e.jsx("tbody",{children:j.map((o,x)=>e.jsxs("tr",{style:{backgroundColor:x%2===0?"white":"#f9f9f9"},children:[e.jsx("td",{style:{padding:"10px",border:"1px solid #ddd",fontWeight:500},children:o.nom}),e.jsxs("td",{style:{padding:"10px",border:"1px solid #ddd"},children:[e.jsx("strong",{style:{color:"#1b365d"},children:o.valeur})," ",o.unite||"cm"]})]},x))})]}),j.length===0&&e.jsx(r,{ta:"center",c:"dimmed",py:60,children:"Aucune mesure enregistrée pour ce client"}),e.jsx(Y,{my:"xl"}),e.jsxs(r,{ta:"center",size:"xs",c:"dimmed",children:["Document généré par Gestion Couture - ",new Date().toLocaleString()]})]})})})]})})};function At(){const p=Me(),j=Le(),[w,T]=c.useState(""),[z,o]=c.useState(1),[x,J]=c.useState("date_enregistrement"),[b,$]=c.useState("desc"),[g,v]=c.useState(!1),[_,k]=c.useState(!1),[ue,Z]=c.useState(!1),[ge,D]=c.useState(null),[N,fe]=c.useState(null),[je,ee]=c.useState(!1),[P,M]=c.useState(null),[be,te]=c.useState(!1),R=10,{data:E=[],isLoading:ve,error:B,refetch:L,isError:ye}=Fe({queryKey:["clients_avec_mesures"],queryFn:async()=>{try{const t=await Ke("/clients");return t?.length?t.map(s=>({...s,observations:s.observations||"",mesures:s.mesures||[]})):[]}catch(t){throw console.error("Erreur dans queryFn:",t),t}},retry:1,staleTime:1e3*60*5}),S=c.useMemo(()=>{const t=new Set;for(const s of E)for(const i of s.mesures)i.nom&&t.add(i.nom);return Array.from(t).sort()},[E]),y=c.useMemo(()=>!E||E.length===0?[]:[...E.filter(s=>s.nom_prenom&&s.nom_prenom.toLowerCase().includes(w.toLowerCase())||s.telephone_id&&s.telephone_id.includes(w))].sort((s,i)=>{let n=0;if(x==="nom_prenom")n=(s.nom_prenom||"").localeCompare(i.nom_prenom||"");else if(x==="telephone_id")n=(s.telephone_id||"").localeCompare(i.telephone_id||"");else if(x==="date_enregistrement"){const m=s.date_enregistrement?new Date(s.date_enregistrement).getTime():0,l=i.date_enregistrement?new Date(i.date_enregistrement).getTime():0;n=m-l}return b==="asc"?n:-n}),[E,w,x,b]),se=Math.ceil(y.length/R),we=y.slice((z-1)*R,z*R),re=ce({mutationFn:async t=>{await G(`/clients/${t}`),await q({utilisateur:"Utilisateur",action:"DELETE",table:"clients",idEnregistrement:t,details:`Suppression client : ${t}`})},onSuccess:async()=>{M(null),await j.invalidateQueries({queryKey:["clients_avec_mesures"]}),await L(),alert("✅ Client supprimé avec succès")},onError:t=>{console.error(t),alert("❌ Erreur lors de la suppression")}}),ne=ce({mutationFn:async()=>{await G("/clients/mesures/all"),await G("/clients/all"),await q({utilisateur:"Utilisateur",action:"DELETE",table:"clients",idEnregistrement:"ALL",details:"Vidage complet de la liste des clients et mesures"})},onSuccess:()=>{j.invalidateQueries({queryKey:["clients_avec_mesures"]}),alert("✅ Liste des clients vidée avec succès")},onError:t=>{console.error(t),alert("❌ Erreur lors du vidage")}}),ze=t=>{console.log("📝 Modification du client:",t);const s={id:t.id,telephone_id:t.telephone_id,nom_prenom:t.nom_prenom,profil:t.profil||"principal",adresse:t.adresse||"",email:t.email||"",observations:t.observations||""};D(s),k(!0)},Se=t=>M(t),Ce=t=>{fe(t),ee(!0)},Ee=t=>{p(`/ventes?client_id=${t.telephone_id}&client_nom=${encodeURIComponent(t.nom_prenom)}`)},U=t=>{x===t?$(b==="asc"?"desc":"asc"):(J(t),$(t==="date_enregistrement"?"desc":"asc")),o(1)},_e=async()=>{try{v(!0);const t=y.map(n=>{const m=new Map(n.mesures.map(h=>[h.nom,`${h.valeur} ${h.unite||"cm"}`])),l={Téléphone:n.telephone_id,"Nom complet":n.nom_prenom,Adresse:n.adresse||"",Email:n.email||"",Observations:n.observations||"","Date enregistrement":n.date_enregistrement||""};for(const h of S)l[h]=m.get(h)||"";return l}),s=W.json_to_sheet(t),i=W.book_new();W.book_append_sheet(i,s,"Clients"),qe(i,`clients_${new Date().toISOString().split("T")[0]}.xlsx`),alert("✅ Export Excel réussi !")}catch(t){console.error("Erreur export Excel:",t),alert("❌ Erreur lors de l'export")}finally{v(!1)}},Ie=async()=>{try{v(!0);const t=new He("landscape","mm","a4");t.setFillColor(27,54,93),t.rect(0,0,297,30,"F"),t.setTextColor(255,255,255),t.setFontSize(18),t.text("LISTE DES CLIENTS AVEC MESURES",148.5,20,{align:"center"});const s=["N°","Téléphone","Nom","Adresse","Observations","Date",...S],i=y.map((n,m)=>{const l=new Map(n.mesures.map(I=>[I.nom,`${I.valeur} ${I.unite||"cm"}`])),h=n.date_enregistrement?new Date(n.date_enregistrement).toLocaleDateString("fr-FR"):"",ie=[m+1,n.telephone_id,n.nom_prenom,n.adresse||"",(n.observations||"").substring(0,50),h];for(const I of S)ie.push(l.get(I)||"");return ie});Qe(t,{head:[s],body:i,startY:40,theme:"striped",headStyles:{fillColor:[27,54,93],textColor:255,fontStyle:"bold"},styles:{fontSize:7,cellPadding:2},margin:{left:5,right:5}}),t.save(`clients_${new Date().toISOString().split("T")[0]}.pdf`),alert("✅ Export PDF réussi !")}catch(t){console.error("Erreur export PDF:",t),alert("❌ Erreur lors de l'export")}finally{v(!1)}},Ae=()=>{const t=window.open("","_blank");if(!t){alert("Veuillez autoriser les popups");return}const s=y.map((i,n)=>{const m=new Map(i.mesures.map(h=>[h.nom,`${h.valeur} ${h.unite||"cm"}`])),l=i.date_enregistrement?new Date(i.date_enregistrement).toLocaleDateString("fr-FR"):"";return`<tr>
        <td>${n+1}</td>
        <td>${i.telephone_id}</td>
        <td><strong>${i.nom_prenom}</strong></td>
        <td>${i.observations||"-"}</td>
        <td>${l}</td>
        ${S.map(h=>`<td>${m.get(h)||"-"}</td>`).join("")}
      </tr>`}).join("");t.document.write(`
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Clients</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #1b365d; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
        th { background: #1b365d; color: white; padding: 8px; border: 1px solid #ddd; }
        td { padding: 6px; border: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
      </style></head><body>
      <h1>LISTE DES CLIENTS AVEC MESURES</h1>
      <table><thead><tr><th>N°</th><th>Tél</th><th>Nom</th><th>Obs.</th><th>Date</th>${S.map(i=>`<th>${i}</th>`).join("")}</tr></thead>
      <tbody>${s}</tbody></table>
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>
    `),t.document.close()};return ue?e.jsx(Xe,{}):_?e.jsx(Ye,{clientEdit:ge||void 0,onBack:()=>{k(!1),D(null)},onSuccess:(t,s)=>{k(!1),D(null),L(),t&&s&&globalThis.confirm("Client créé/modifié avec succès ! Voulez-vous créer une vente pour ce client ?")&&p(`/ventes?client_id=${t}&client_nom=${encodeURIComponent(s)}`)}}):ve?e.jsx(Oe,{style:{height:"50vh"},children:e.jsxs(V,{withBorder:!0,radius:"lg",p:"xl",children:[e.jsx(Ne,{visible:!0}),e.jsxs(C,{align:"center",gap:"md",children:[e.jsx(oe,{size:40,stroke:1.5}),e.jsx(r,{children:"Chargement des clients..."})]})]})}):ye||B?e.jsx(le,{size:"xl",p:"md",children:e.jsx(ae,{icon:e.jsx(de,{size:16}),color:"red",title:"Erreur de chargement",variant:"filled",children:e.jsxs(C,{children:[e.jsx(r,{children:"Impossible de charger les clients"}),e.jsx(r,{size:"sm",children:B instanceof Error?B.message:"Erreur inconnue"}),e.jsx(f,{onClick:()=>L(),variant:"white",size:"xs",mt:"md",children:"Réessayer"})]})})}):e.jsx(O,{p:"md",children:e.jsx(le,{size:"full",children:e.jsxs(C,{gap:"lg",children:[e.jsx(V,{withBorder:!0,radius:"lg",p:"xl",style:{background:"linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)"},children:e.jsxs(d,{justify:"space-between",align:"center",children:[e.jsxs(d,{gap:"md",children:[e.jsx(Pe,{size:60,radius:"md",style:{backgroundColor:"rgba(19, 65, 134, 0.2)"},children:e.jsx(oe,{size:30,color:"black"})}),e.jsxs(O,{children:[e.jsx(Q,{order:1,c:"white",size:"h2",children:"Clients avec mesures"}),e.jsx(r,{c:"gray.3",size:"sm",children:"Gérez les informations des clients et leurs mesures personnalisées"})]})]}),e.jsxs(d,{children:[e.jsx(f,{variant:"light",color:"white",leftSection:e.jsx(pe,{size:18}),onClick:()=>Z(!0),radius:"md",children:"Importer Excel"}),e.jsx(f,{variant:"light",color:"white",leftSection:e.jsx(Je,{size:18}),onClick:()=>te(!0),radius:"md",children:"Instructions"})]})]})}),e.jsx(V,{withBorder:!0,radius:"lg",shadow:"sm",children:e.jsxs(C,{gap:"md",children:[e.jsxs(d,{justify:"space-between",align:"flex-end",children:[e.jsxs(O,{children:[e.jsx(Q,{order:3,size:"h4",c:"#1b365d",children:"Liste des clients"}),e.jsxs(r,{size:"xs",c:"dimmed",children:[y.length," client",y.length>1?"s":""," trouvé",y.length>1?"s":"",x==="date_enregistrement"&&e.jsx(r,{component:"span",size:"xs",c:"dimmed",ml:"xs",children:"(triés du plus récent au plus ancien)"})]})]}),e.jsxs(d,{children:[e.jsx(f,{leftSection:e.jsx(pe,{size:16}),variant:"outline",color:"green",onClick:()=>Z(!0),children:"Importer"}),e.jsxs(u,{shadow:"md",width:200,children:[e.jsx(u.Target,{children:e.jsx(f,{leftSection:e.jsx(Re,{size:16}),variant:"outline",loading:g,children:"Exporter"})}),e.jsxs(u.Dropdown,{children:[e.jsx(u.Label,{children:"Format d'export"}),e.jsx(u.Item,{leftSection:e.jsx(Be,{size:16,color:"#00a84f"}),onClick:_e,children:"Excel (.xlsx)"}),e.jsx(u.Item,{leftSection:e.jsx(Ze,{size:16,color:"#e74c3c"}),onClick:Ie,children:"PDF (.pdf)"})]})]}),e.jsx(f,{leftSection:e.jsx(xe,{size:16}),onClick:Ae,variant:"outline",color:"teal",children:"Imprimer"}),e.jsx(f,{leftSection:e.jsx(nt,{size:16}),color:"red",variant:"light",onClick:()=>{confirm("Voulez-vous vraiment vider toute la liste des clients et mesures ?")&&ne.mutate()},loading:ne.isPending,children:"Vider la liste"}),e.jsx(f,{leftSection:e.jsx(et,{size:16}),onClick:()=>{D(null),k(!0)},variant:"gradient",gradient:{from:"#1b365d",to:"#2a4a7a"},children:"Ajouter un client"})]})]}),e.jsx(Y,{}),e.jsx(Ue,{placeholder:"Rechercher par nom ou téléphone...",leftSection:e.jsx(Ve,{size:16}),value:w,onChange:t=>{T(t.target.value),o(1)},radius:"md",size:"md"}),y.length===0?e.jsx(ae,{icon:e.jsx(de,{size:16}),color:"blue",variant:"light",radius:"md",children:'Aucun client trouvé. Cliquez sur "Ajouter" pour commencer.'}):e.jsxs(e.Fragment,{children:[e.jsx(me,{style:{maxHeight:600},offsetScrollbars:!0,children:e.jsxs(a,{striped:!0,highlightOnHover:!0,withColumnBorders:!0,style:{fontSize:"12px"},children:[e.jsx(a.Thead,{style:{backgroundColor:"#1b365d",position:"sticky",top:0,zIndex:10},children:e.jsxs(a.Tr,{children:[e.jsx(a.Th,{style:{color:"white",fontSize:"12px",padding:"8px 6px",width:70},children:"Profil"}),e.jsx(a.Th,{style:{cursor:"pointer",color:"white",fontSize:"12px",padding:"8px 8px",whiteSpace:"nowrap",minWidth:140},onClick:()=>U("nom_prenom"),children:e.jsxs(d,{gap:4,children:["Nom",x==="nom_prenom"&&e.jsx(r,{size:"xs",c:"yellow",children:b==="asc"?"↑":"↓"})]})}),e.jsx(a.Th,{style:{cursor:"pointer",color:"white",fontSize:"12px",padding:"8px 8px",whiteSpace:"nowrap",minWidth:110},onClick:()=>U("telephone_id"),children:e.jsxs(d,{gap:4,children:["Téléphone",x==="telephone_id"&&e.jsx(r,{size:"xs",c:"yellow",children:b==="asc"?"↑":"↓"})]})}),e.jsx(a.Th,{style:{color:"white",fontSize:"12px",padding:"8px 8px",minWidth:100},children:"Obs."}),e.jsx(a.Th,{style:{cursor:"pointer",color:"white",fontSize:"12px",padding:"8px 8px",minWidth:100},onClick:()=>U("date_enregistrement"),children:e.jsxs(d,{gap:4,children:[e.jsx(st,{size:14}),"Date",x==="date_enregistrement"&&e.jsx(r,{size:"xs",c:"yellow",children:b==="asc"?"↑":"↓"})]})}),S.map(t=>e.jsx(a.Th,{style:{color:"white",fontSize:"9px",fontWeight:500,padding:"8px 3px",whiteSpace:"nowrap",textAlign:"center",minWidth:50,cursor:"default"},title:t,children:t},t)),e.jsx(a.Th,{style:{textAlign:"center",color:"white",fontSize:"12px",padding:"8px 8px",width:150,minWidth:150},children:"Actions"})]})}),e.jsx(a.Tbody,{children:we.map(t=>{const s=new Map(t.mesures.map(l=>[l.nom,`${l.valeur}${l.unite&&l.unite!=="cm"?" "+l.unite:""}`])),i=t.profil==="principal"?"blue":t.profil==="enfant"?"pink":t.profil==="conjoint"?"violet":t.profil==="parent"?"orange":"gray",n=t.profil==="principal"?"Moi":t.profil==="enfant"?"Enfant":t.profil==="conjoint"?"Conjoint":t.profil==="parent"?"Parent":"Autre",m=t.date_enregistrement?new Date(t.date_enregistrement).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-";return e.jsxs(a.Tr,{children:[e.jsx(a.Td,{style:{padding:"6px 4px",textAlign:"center"},children:e.jsx(K,{size:"sm",color:i,variant:"light",children:n})}),e.jsx(a.Td,{style:{fontSize:"12px",padding:"6px 8px",whiteSpace:"nowrap"},children:e.jsx(r,{size:"sm",fw:500,lineClamp:1,children:t.nom_prenom})}),e.jsx(a.Td,{style:{fontSize:"12px",padding:"6px 8px",whiteSpace:"nowrap"},children:e.jsx(K,{color:"gray",variant:"light",size:"sm",children:t.telephone_id})}),e.jsx(a.Td,{style:{fontSize:"12px",padding:"6px 8px",maxWidth:"150px"},children:e.jsx(r,{size:"xs",lineClamp:1,title:t.observations||"",children:t.observations?.substring(0,30)||"-"})}),e.jsx(a.Td,{style:{fontSize:"11px",padding:"6px 8px",whiteSpace:"nowrap"},children:e.jsx(r,{size:"xs",c:"dimmed",children:m})}),S.map(l=>e.jsx(a.Td,{style:{fontSize:"11px",padding:"6px 3px",whiteSpace:"nowrap",textAlign:"center"},title:`${l}: ${s.get(l)||"Non renseigné"}`,children:e.jsx(r,{size:"xs",ta:"center",children:s.get(l)||"-"})},l)),e.jsx(a.Td,{style:{padding:"6px 4px"},children:e.jsxs(d,{gap:4,justify:"center",wrap:"nowrap",children:[e.jsx(F,{label:"Détails des mesures",children:e.jsx(A,{variant:"light",color:"blue",size:"sm",onClick:()=>Ce(t),children:e.jsx(he,{size:14})})}),e.jsx(F,{label:"Nouvelle vente",children:e.jsx(A,{variant:"light",color:"green",size:"sm",onClick:()=>Ee(t),children:e.jsx(at,{size:14})})}),e.jsx(F,{label:"Modifier le client",children:e.jsx(A,{variant:"light",color:"yellow",size:"sm",onClick:()=>ze(t),children:e.jsx(tt,{size:14})})}),e.jsx(F,{label:"Supprimer",children:e.jsx(A,{variant:"light",color:"red",size:"sm",onClick:()=>Se(t.telephone_id),children:e.jsx(We,{size:14})})})]})})]},t.id||t.telephone_id)})})]})}),se>1&&e.jsx(d,{justify:"center",mt:"md",children:e.jsx(Ge,{value:z,onChange:o,total:se,color:"#1b365d"})})]})]})}),e.jsx(H,{opened:P!==null,onClose:()=>M(null),title:"Confirmation",centered:!0,radius:"md",children:e.jsxs(C,{children:[e.jsx(r,{children:"Êtes-vous sûr de vouloir supprimer ce client ?"}),e.jsx(r,{size:"sm",c:"dimmed",children:"Cette action est irréversible."}),e.jsxs(d,{justify:"flex-end",mt:"md",children:[e.jsx(f,{variant:"light",onClick:()=>M(null),children:"Annuler"}),e.jsx(f,{color:"red",onClick:()=>{P&&re.mutate(P)},loading:re.isPending,children:"Supprimer"})]})]})}),je&&N&&e.jsx(dt,{client:N,mesures:N.mesures.map(t=>({...t,valeur:typeof t.valeur=="string"?parseFloat(t.valeur)||0:Number(t.valeur)||0})).sort((t,s)=>{const i=["EPAULE","DOS","POITRINE","LONG POITRINE","TAILLE","LONG TAILLE","LONG CHEMISE","MANCHE","TOUR DE MANCHE","COL","POIGNET","CEINTURE","BASSIN","CUISSE","LONG PANTALON","BAS","LONG BASSIN","LONG ROBE"],n=i.indexOf(t.nom),m=i.indexOf(s.nom);return n===-1&&m===-1?0:n===-1?1:m===-1?-1:n-m}),onClose:()=>{ee(!1),j.invalidateQueries({queryKey:["clients_avec_mesures"]}),L()}}),e.jsx(H,{opened:be,onClose:()=>te(!1),title:"📋 Instructions",size:"md",centered:!0,radius:"md",children:e.jsxs(C,{gap:"md",children:[e.jsx(r,{size:"sm",children:"1️⃣ Renseignez les informations personnelles du client"}),e.jsx(r,{size:"sm",children:"2️⃣ Ajoutez les mesures du client dans l'onglet dédié"}),e.jsx(r,{size:"sm",children:"3️⃣ Les observations sont optionnelles mais utiles"}),e.jsx(r,{size:"sm",children:"4️⃣ Exportez la liste au format Excel ou PDF"}),e.jsx(r,{size:"sm",children:"5️⃣ Utilisez la recherche pour filtrer rapidement"}),e.jsx(r,{size:"sm",children:"6️⃣ Cliquez sur 👁️ pour voir les mesures détaillées"}),e.jsx(r,{size:"sm",children:"7️⃣ Cliquez sur 🛒 pour créer une vente"}),e.jsx(r,{size:"sm",children:"8️⃣ Les clients sont triés du plus récent au plus ancien"}),e.jsx(Y,{}),e.jsx(r,{size:"xs",c:"dimmed",ta:"center",children:"Version 2.0.0 - Gestion Couture"})]})})]})})})}export{At as default};
