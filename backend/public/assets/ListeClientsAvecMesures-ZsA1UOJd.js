import{c as te,r as c,j as e,M as X,S as E,G as d,x as $e,O as xe,e as J,Q as m,B as f,R as Me,T as r,U as D,V as De,K as ge,z as R,J as Fe,D as Z,v as Pe,W as Ne,C as Oe,a as K,N as ae,b as de,f as ce,A as Re,X as Ue,Y as Be,g as Ge,Z as O,_ as We,$ as Q,s as pe,p as Ve}from"./index-BGHuVC2V.js";import{C as he}from"./Container-DBeMkvoa.js";import{L as He}from"./LoadingOverlay-BBHRF3xP.js";import{I as qe,P as Ke}from"./IconSearch-BF0c1nON.js";import{T as a}from"./Table-DThD9mnL.js";import{T as ee}from"./Title-DBK6AsF7.js";import{u as Qe}from"./useQuery-BhtDDjz2.js";import{u as me}from"./useMutation-CWAaE9So.js";import{u as Y,w as Ye}from"./xlsx-DayHZQ-0.js";import{E as Xe,a as Je}from"./jspdf.plugin.autotable-DMm8MDeW.js";import{F as Ze}from"./FormulaireClient-BL0oGr-0.js";import{I as fe}from"./IconPrinter-CIGQVvWR.js";import{I as et,a as ue}from"./ImportClientsExcel-CsFlnCQb.js";import{I as tt}from"./IconRefresh-IUE3-Bce.js";import{I as st}from"./IconInfoCircle-YFAtTVt0.js";import{I as rt}from"./IconFile-CfNQVpGY.js";import{I as nt,a as it}from"./IconPlus-C2MQzBIh.js";import{I as ot}from"./IconClock-D2rm4gYg.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./Textarea-BFSb4zhu.js";import"./Select-CcHnbnNI.js";import"./CheckIcon-D_C_2_Nu.js";import"./SimpleGrid-CK19Ay1I.js";import"./get-base-value-CzvdkZld.js";import"./FormulaireTypeMesure-DUV3rfVo.js";import"./IconArrowLeft-Czl62cJB.js";import"./IconDeviceFloppy-VIG8P6n5.js";import"./IconUser-CQh-G5ME.js";import"./IconPhone-CiLZUQNL.js";import"./IconMapPin-B_tYYVkG.js";import"./IconAt-PxIKDZrf.js";import"./Progress-Bk4-vhtz.js";import"./RingProgress-DxHvEeiK.js";import"./IconUpload-COf2JCKB.js";const lt=[["path",{d:"M12.983 8.978c3.955 -.182 7.017 -1.446 7.017 -2.978c0 -1.657 -3.582 -3 -8 -3c-1.661 0 -3.204 .19 -4.483 .515m-2.783 1.228c-.471 .382 -.734 .808 -.734 1.257c0 1.22 1.944 2.271 4.734 2.74",key:"svg-0"}],["path",{d:"M4 6v6c0 1.657 3.582 3 8 3c.986 0 1.93 -.067 2.802 -.19m3.187 -.82c1.251 -.53 2.011 -1.228 2.011 -1.99v-6",key:"svg-1"}],["path",{d:"M4 12v6c0 1.657 3.582 3 8 3c3.217 0 5.991 -.712 7.261 -1.74m.739 -3.26v-4",key:"svg-2"}],["path",{d:"M3 3l18 18",key:"svg-3"}]],at=te("outline","database-off","DatabaseOff",lt);const dt=[["path",{d:"M13 20l7 -7",key:"svg-0"}],["path",{d:"M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7",key:"svg-1"}]],ct=te("outline","note","Note",dt);const pt=[["path",{d:"M4 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",key:"svg-0"}],["path",{d:"M15 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",key:"svg-1"}],["path",{d:"M17 17h-11v-14h-2",key:"svg-2"}],["path",{d:"M6 5l14 1l-1 7h-13",key:"svg-3"}]],ht=te("outline","shopping-cart","ShoppingCart",pt),mt=({client:u,mesures:C,onClose:z})=>{const F=c.useRef(null),I=n=>{const x=String(n);if(x.includes("/")||x.includes("-")||x.includes(","))return x;const g=parseFloat(x);return isNaN(g)?x:g.toString()},S=(n="A4")=>{if(!F.current?.innerHTML)return;const $={A4:{width:210,height:297,margin:10,fontSize:11},A5:{width:148,height:210,margin:8,fontSize:9},A6:{width:105,height:148,margin:6,fontSize:8}}[n],P=["EPAULE","EPAULE D","EPAULE G","DOS","POITRINE","LONG POITRINE","TAILLE","LONG TAILLE","LONG CHEMISE","MANCHE","LONGUEUR MANCHE","TOUR DE MANCHE","COL","POIGNET","CEINTURE","BASSIN","CUISSE","LONG PANTALON","BAS","LONG BASSIN","LONG ROBE"],A=[...C].sort((w,B)=>{const y=P.indexOf(w.nom.toUpperCase()),b=P.indexOf(B.nom.toUpperCase());return y===-1&&b===-1?0:y===-1?1:b===-1?-1:y-b}),U=`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fiche client avec mesures - ${u.nom_prenom}</title>
          <meta charset="UTF-8">
          <style>
            @page { 
              size: ${n};
              margin: ${$.margin}mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', 'Arial', sans-serif;
              font-size: ${$.fontSize}px;
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
              font-size: ${n==="A4"?"16":n==="A5"?"14":"12"}px;
              font-weight: bold;
              color: #1b365d;
              margin-bottom: 3px;
            }
            .client-name {
              font-size: ${n==="A4"?"13":n==="A5"?"11":"10"}px;
              font-weight: 600;
              margin: 3px 0;
            }
            .client-info {
              font-size: ${n==="A4"?"10":"9"}px;
              color: #7f8c8d;
              margin: 2px 0;
            }
            .date {
              font-size: ${n==="A4"?"9":"8"}px;
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
              font-size: ${n==="A4"?"10":"9"}px;
              margin-bottom: 3px;
            }
            .observations-text {
              font-size: ${n==="A4"?"9":"8"}px;
              line-height: 1.4;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 6px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: ${n==="A4"?"5px 6px":n==="A5"?"4px 5px":"3px 4px"};
              text-align: left;
            }
            th {
              background: #1b365d;
              color: white;
              font-weight: 600;
              font-size: ${n==="A4"?"10":"9"}px;
            }
            td {
              font-size: ${n==="A4"?"10":"9"}px;
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
              <div class="client-name">${u.nom_prenom}</div>
              ${u.telephone_id?`<div class="client-info">📞 ${u.telephone_id}</div>`:""}
              <div class="date">📅 ${new Date().toLocaleDateString()}</div>
            </div>
            ${u.observations?`
              <div class="observations-box">
                <div class="observations-title">📝 Observations</div>
                <div class="observations-text">${u.observations}</div>
              </div>
            `:""}
            <table>
              <thead>
                <tr><th>Mesure</th><th>Valeur</th></tr>
              </thead>
              <tbody>
                ${A.map(w=>`
                  <tr>
                    <td>${w.nom}</td>
                    <td><strong>${I(w.valeur)}</strong> ${w.unite||"cm"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            ${C.length===0?'<p style="text-align:center; padding:20px;">Aucune mesure enregistrée</p>':""}
            <div class="footer">
              Document généré par Gestion Couture - ${new Date().toLocaleString()}
            </div>
          </div>
        </body>
      </html>
    `,p=document.createElement("iframe");p.style.position="absolute",p.style.width="0",p.style.height="0",p.style.border="none",document.body.appendChild(p);const T=p.contentWindow?.document;T&&(T.open(),T.write(U),T.close(),p.onload=()=>{p.contentWindow?.focus(),p.contentWindow?.print(),setTimeout(()=>{document.body.removeChild(p)},1e3)})};return e.jsx(X,{opened:!0,onClose:z,size:"800px",centered:!0,overlayProps:{blur:3},padding:0,styles:{header:{display:"none"},body:{padding:0}},children:e.jsxs(E,{gap:0,children:[e.jsxs(d,{justify:"space-between",p:"md",style:{backgroundColor:"#1b365d"},children:[e.jsxs(d,{gap:"xs",children:[e.jsx($e,{size:"md",radius:"md",style:{backgroundColor:"rgba(255,255,255,0.2)"},children:e.jsx(xe,{size:18,color:"white"})}),e.jsxs(ee,{order:3,c:"white",size:"h4",children:["Fiche mesures - ",u.nom_prenom]}),e.jsxs(J,{size:"sm",variant:"light",color:"white",style:{backgroundColor:"rgba(255,255,255,0.2)"},children:[C.length," mesures"]})]}),e.jsxs(d,{gap:"xs",children:[e.jsxs(m,{shadow:"md",width:200,children:[e.jsx(m.Target,{children:e.jsx(f,{variant:"light",color:"white",size:"sm",leftSection:e.jsx(fe,{size:16}),rightSection:e.jsx(Me,{size:14}),children:"Imprimer"})}),e.jsxs(m.Dropdown,{children:[e.jsx(m.Label,{children:"📄 Choisir le format"}),e.jsx(m.Item,{onClick:()=>S("A4"),children:e.jsxs(d,{justify:"space-between",style:{width:"100%"},children:[e.jsx("span",{children:"📄 Format A4"}),e.jsx(r,{size:"xs",c:"dimmed",children:"21 x 29,7 cm"})]})}),e.jsx(m.Item,{onClick:()=>S("A5"),children:e.jsxs(d,{justify:"space-between",style:{width:"100%"},children:[e.jsx("span",{children:"📄 Format A5"}),e.jsx(r,{size:"xs",c:"dimmed",children:"14,8 x 21 cm"})]})}),e.jsx(m.Item,{onClick:()=>S("A6"),children:e.jsxs(d,{justify:"space-between",style:{width:"100%"},children:[e.jsx("span",{children:"📄 Format A6"}),e.jsx(r,{size:"xs",c:"dimmed",children:"10,5 x 14,8 cm"})]})})]})]}),e.jsx(D,{variant:"light",color:"white",onClick:z,size:"lg",children:e.jsx(De,{size:18})})]})]}),e.jsx(ge,{style:{maxHeight:"calc(100vh - 200px)"},children:e.jsx("div",{ref:F,style:{padding:"30px",backgroundColor:"white"},children:e.jsxs(R,{style:{maxWidth:"700px",margin:"0 auto"},children:[u.observations&&e.jsxs(Fe,{p:"md",withBorder:!0,mb:"xl",style:{background:"#f0f7ff",borderLeft:"4px solid #1b365d"},children:[e.jsxs(d,{gap:"xs",mb:5,children:[e.jsx(ct,{size:14}),e.jsx(r,{fw:600,children:"Observations"})]}),e.jsx(r,{size:"sm",children:u.observations})]}),e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{backgroundColor:"#1b365d"},children:[e.jsx("th",{style:{padding:"10px",border:"1px solid #2c3e50",color:"white",textAlign:"left"},children:"Mesure"}),e.jsx("th",{style:{padding:"10px",border:"1px solid #2c3e50",color:"white",textAlign:"left"},children:"Valeur"})]})}),e.jsx("tbody",{children:C.map((n,x)=>{const g=I(n.valeur);return e.jsxs("tr",{style:{backgroundColor:x%2===0?"white":"#f9f9f9"},children:[e.jsx("td",{style:{padding:"10px",border:"1px solid #ddd",fontWeight:500},children:n.nom}),e.jsxs("td",{style:{padding:"10px",border:"1px solid #ddd"},children:[e.jsx("strong",{style:{color:"#1b365d"},children:g})," ",n.unite||"cm"]})]},x)})})]}),C.length===0&&e.jsx(r,{ta:"center",c:"dimmed",py:60,children:"Aucune mesure enregistrée pour ce client"}),e.jsx(Z,{my:"xl"}),e.jsxs(r,{ta:"center",size:"xs",c:"dimmed",children:["Document généré par Gestion Couture - ",new Date().toLocaleString()]})]})})})]})})},ut={epaule:"Epaule",dos:"Dos",poitrine:"Poitrine",long_poitrine:"Lg Poitrine",taille:"Taille",long_taille:"Lg Taille",long_chemise:"Lg Chemise",manche:"Manche",tour_de_manche:"T. Manche",col:"Col",poignet:"Poignet",ceinture:"Ceinture",bassin:"Bassin",cuisse:"Cuisse",long_pantalon:"Lg Pantalon",bas:"Bas",long_bassin:"Lg Bassin",long_robe:"Lg Robe",epaule_droite:"Epaule D",epaule_gauche:"Epaule G",longueur_manche:"Lg Manche",tour_bras:"T. Bras",ba:"Bas",basin:"Bassin",centure:"Ceinture",centre:"Ceinture"};function Qt(){const u=Pe(),C=Ne(),[z,F]=c.useState(""),[I,S]=c.useState(1),[n,x]=c.useState("date_enregistrement"),[g,$]=c.useState("desc"),[P,A]=c.useState(!1),[U,p]=c.useState(!1),[T,w]=c.useState(!1),[B,y]=c.useState(null),[b,se]=c.useState(null),[je,G]=c.useState(!1),[W,N]=c.useState(null),[be,re]=c.useState(!1),[ve,we]=c.useState(0),V=10,{data:k=[],isLoading:ye,error:H,refetch:Ce,isError:ze}=Qe({queryKey:["clients_avec_mesures",ve],queryFn:async()=>{try{const t=await Ve("/clients");return t?.length?t.map(s=>({...s,observations:s.observations||"",mesures:s.mesures||[]})):[]}catch(t){throw console.error("Erreur dans queryFn:",t),t}},retry:1,staleTime:1e3*60*5}),L=()=>{we(t=>t+1),C.invalidateQueries({queryKey:["clients_avec_mesures"]}),Ce()},_=c.useMemo(()=>{const t=new Set;for(const s of k)for(const i of s.mesures)i.nom&&t.add(i.nom.trim());return Array.from(t).sort()},[k]),v=c.useMemo(()=>!k||k.length===0?[]:[...k.filter(s=>s.nom_prenom&&s.nom_prenom.toLowerCase().includes(z.toLowerCase())||s.telephone_id&&s.telephone_id.includes(z))].sort((s,i)=>{let o=0;if(n==="nom_prenom")o=(s.nom_prenom||"").localeCompare(i.nom_prenom||"");else if(n==="telephone_id")o=(s.telephone_id||"").localeCompare(i.telephone_id||"");else if(n==="date_enregistrement"){const j=s.date_enregistrement?new Date(s.date_enregistrement).getTime():0,h=i.date_enregistrement?new Date(i.date_enregistrement).getTime():0;o=j-h}return g==="asc"?o:-o}),[k,z,n,g]),ne=Math.ceil(v.length/V),Se=v.slice((I-1)*V,I*V),ie=me({mutationFn:async t=>{await Q(`/clients/${t}`),await pe({utilisateur:"Utilisateur",action:"DELETE",table:"clients",idEnregistrement:t,details:`Suppression client : ${t}`})},onSuccess:async()=>{N(null),L(),alert("✅ Client supprimé avec succès")},onError:t=>{console.error(t),alert("❌ Erreur lors de la suppression")}}),oe=me({mutationFn:async()=>{await Q("/clients/mesures/all"),await Q("/clients/all"),await pe({utilisateur:"Utilisateur",action:"DELETE",table:"clients",idEnregistrement:"ALL",details:"Vidage complet de la liste des clients et mesures"})},onSuccess:()=>{L(),alert("✅ Liste des clients vidée avec succès")},onError:t=>{console.error(t),alert("❌ Erreur lors du vidage")}}),_e=async t=>{try{console.log("📏 Client sélectionné:",t.nom_prenom),console.log("📏 telephone_id:",t.telephone_id);const s=`/api/clients/details/${encodeURIComponent(t.telephone_id)}`;console.log("📏 URL appelée:",s);const i=await fetch(s);if(!i.ok){const j=await i.text();throw console.error("❌ Erreur API:",i.status,j),new Error(`Erreur API: ${i.status}`)}const o=await i.json();console.log("📏 Mesures fraîches API:",o.mesures),se({...t,mesures:o.mesures||[]}),G(!0)}catch(s){console.error("❌ Erreur chargement client:",s),se(t),G(!0)}},Ee=t=>{const s={id:t.id,telephone_id:t.telephone_id,nom_prenom:t.nom_prenom,profil:t.profil||"principal",adresse:t.adresse||"",email:t.email||"",observations:t.observations||""};y(s),p(!0)},Ie=t=>N(t),Ae=t=>{u(`/ventes?client_id=${t.telephone_id}&client_nom=${encodeURIComponent(t.nom_prenom)}`)},q=t=>{n===t?$(g==="asc"?"desc":"asc"):(x(t),$(t==="date_enregistrement"?"desc":"asc")),S(1)},Te=async()=>{try{A(!0);const t=v.map(o=>{const j=new Map(o.mesures.map(l=>[l.nom.trim(),`${l.valeur} ${l.unite||"cm"}`])),h={Téléphone:o.telephone_id,"Nom complet":o.nom_prenom,Adresse:o.adresse||"",Email:o.email||"",Observations:o.observations||"","Date enregistrement":o.date_enregistrement||""};for(const l of _)h[l]=j.get(l)||"";return h}),s=Y.json_to_sheet(t),i=Y.book_new();Y.book_append_sheet(i,s,"Clients"),Ye(i,`clients_${new Date().toISOString().split("T")[0]}.xlsx`),alert("✅ Export Excel réussi !")}catch(t){console.error("Erreur export Excel:",t),alert("❌ Erreur lors de l'export")}finally{A(!1)}},ke=async()=>{try{A(!0);const t=new Xe("landscape","mm","a4");t.setFillColor(27,54,93),t.rect(0,0,297,30,"F"),t.setTextColor(255,255,255),t.setFontSize(18),t.text("LISTE DES CLIENTS AVEC MESURES",148.5,20,{align:"center"});const s=["N°","Téléphone","Nom","Adresse","Observations","Date",..._],i=v.map((o,j)=>{const h=new Map(o.mesures.map(M=>[M.nom.trim(),`${M.valeur} ${M.unite||"cm"}`])),l=o.date_enregistrement?new Date(o.date_enregistrement).toLocaleDateString("fr-FR"):"",le=[j+1,o.telephone_id,o.nom_prenom,o.adresse||"",(o.observations||"").substring(0,50),l];for(const M of _)le.push(h.get(M)||"");return le});Je(t,{head:[s],body:i,startY:40,theme:"striped",headStyles:{fillColor:[27,54,93],textColor:255,fontStyle:"bold"},styles:{fontSize:7,cellPadding:2},margin:{left:5,right:5}}),t.save(`clients_${new Date().toISOString().split("T")[0]}.pdf`),alert("✅ Export PDF réussi !")}catch(t){console.error("Erreur export PDF:",t),alert("❌ Erreur lors de l'export")}finally{A(!1)}},Le=()=>{const t=window.open("","_blank");if(!t){alert("Veuillez autoriser les popups");return}const s=v.map((i,o)=>{const j=new Map(i.mesures.map(l=>[l.nom.trim(),`${l.valeur} ${l.unite||"cm"}`])),h=i.date_enregistrement?new Date(i.date_enregistrement).toLocaleDateString("fr-FR"):"";return`<tr>
        <td>${o+1}</td>
        <td>${i.telephone_id}</td>
        <td><strong>${i.nom_prenom}</strong></td>
        <td>${i.observations||"-"}</td>
        <td>${h}</td>
        ${_.map(l=>`<td>${j.get(l)||"-"}</td>`).join("")}
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
      <table><thead><tr><th>N°</th><th>Tél</th><th>Nom</th><th>Obs.</th><th>Date</th>${_.map(i=>`<th>${i}</th>`).join("")}</tr></thead>
      <tbody>${s}</tbody></table>
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>
    `),t.document.close()};return T?e.jsx(et,{}):U?e.jsx(Ze,{clientEdit:B||void 0,onBack:()=>{p(!1),y(null)},onSuccess:(t,s)=>{p(!1),y(null),L(),t&&s&&globalThis.confirm("Client créé/modifié avec succès ! Voulez-vous créer une vente pour ce client ?")&&u(`/ventes?client_id=${t}&client_nom=${encodeURIComponent(s)}`)}}):ye?e.jsx(Oe,{style:{height:"50vh"},children:e.jsxs(K,{withBorder:!0,radius:"lg",p:"xl",children:[e.jsx(He,{visible:!0}),e.jsxs(E,{align:"center",gap:"md",children:[e.jsx(ae,{size:40,stroke:1.5}),e.jsx(r,{children:"Chargement des clients..."})]})]})}):ze||H?e.jsx(he,{size:"xl",p:"md",children:e.jsx(de,{icon:e.jsx(ce,{size:16}),color:"red",title:"Erreur de chargement",variant:"filled",children:e.jsxs(E,{children:[e.jsx(r,{children:"Impossible de charger les clients"}),e.jsx(r,{size:"sm",children:H instanceof Error?H.message:"Erreur inconnue"}),e.jsx(f,{onClick:()=>L(),variant:"white",size:"xs",mt:"md",children:"Réessayer"})]})})}):e.jsx(R,{p:"md",children:e.jsx(he,{size:"full",children:e.jsxs(E,{gap:"lg",children:[e.jsx(K,{withBorder:!0,radius:"lg",p:"xl",style:{background:"linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)"},children:e.jsxs(d,{justify:"space-between",align:"center",children:[e.jsxs(d,{gap:"md",children:[e.jsx(Re,{size:60,radius:"md",style:{backgroundColor:"rgba(19, 65, 134, 0.2)"},children:e.jsx(ae,{size:30,color:"black"})}),e.jsxs(R,{children:[e.jsx(ee,{order:1,c:"white",size:"h2",children:"Clients avec mesures"}),e.jsx(r,{c:"gray.3",size:"sm",children:"Gérez les informations des clients et leurs mesures personnalisées"})]})]}),e.jsxs(d,{children:[e.jsx(f,{variant:"light",color:"white",leftSection:e.jsx(tt,{size:18}),onClick:L,radius:"md",children:"Rafraîchir"}),e.jsx(f,{variant:"light",color:"white",leftSection:e.jsx(ue,{size:18}),onClick:()=>w(!0),radius:"md",children:"Importer Excel"}),e.jsx(f,{variant:"light",color:"white",leftSection:e.jsx(st,{size:18}),onClick:()=>re(!0),radius:"md",children:"Instructions"})]})]})}),e.jsx(K,{withBorder:!0,radius:"lg",shadow:"sm",children:e.jsxs(E,{gap:"md",children:[e.jsxs(d,{justify:"space-between",align:"flex-end",children:[e.jsxs(R,{children:[e.jsx(ee,{order:3,size:"h4",c:"#1b365d",children:"Liste des clients"}),e.jsxs(r,{size:"xs",c:"dimmed",children:[v.length," client",v.length>1?"s":""," trouvé",v.length>1?"s":"",n==="date_enregistrement"&&e.jsx(r,{component:"span",size:"xs",c:"dimmed",ml:"xs",children:"(triés du plus récent au plus ancien)"})]})]}),e.jsxs(d,{children:[e.jsx(f,{leftSection:e.jsx(ue,{size:16}),variant:"outline",color:"green",onClick:()=>w(!0),children:"Importer"}),e.jsxs(m,{shadow:"md",width:200,children:[e.jsx(m.Target,{children:e.jsx(f,{leftSection:e.jsx(Ue,{size:16}),variant:"outline",loading:P,children:"Exporter"})}),e.jsxs(m.Dropdown,{children:[e.jsx(m.Label,{children:"Format d'export"}),e.jsx(m.Item,{leftSection:e.jsx(Be,{size:16,color:"#00a84f"}),onClick:Te,children:"Excel (.xlsx)"}),e.jsx(m.Item,{leftSection:e.jsx(rt,{size:16,color:"#e74c3c"}),onClick:ke,children:"PDF (.pdf)"})]})]}),e.jsx(f,{leftSection:e.jsx(fe,{size:16}),onClick:Le,variant:"outline",color:"teal",children:"Imprimer"}),e.jsx(f,{leftSection:e.jsx(at,{size:16}),color:"red",variant:"light",onClick:()=>{confirm("Voulez-vous vraiment vider toute la liste des clients et mesures ?")&&oe.mutate()},loading:oe.isPending,children:"Vider la liste"}),e.jsx(f,{leftSection:e.jsx(nt,{size:16}),onClick:()=>{y(null),p(!0)},variant:"gradient",gradient:{from:"#1b365d",to:"#2a4a7a"},children:"Ajouter un client"})]})]}),e.jsx(Z,{}),e.jsx(Ge,{placeholder:"Rechercher par nom ou téléphone...",leftSection:e.jsx(qe,{size:16}),value:z,onChange:t=>{F(t.target.value),S(1)},radius:"md",size:"md"}),v.length===0?e.jsx(de,{icon:e.jsx(ce,{size:16}),color:"blue",variant:"light",radius:"md",children:'Aucun client trouvé. Cliquez sur "Ajouter" pour commencer.'}):e.jsxs(e.Fragment,{children:[e.jsx(ge,{style:{maxHeight:600},offsetScrollbars:!0,children:e.jsxs(a,{striped:!0,highlightOnHover:!0,withColumnBorders:!0,style:{fontSize:"12px"},children:[e.jsx(a.Thead,{style:{backgroundColor:"#1b365d",position:"sticky",top:0,zIndex:10},children:e.jsxs(a.Tr,{children:[e.jsx(a.Th,{style:{color:"white",fontSize:"12px",padding:"8px 6px",width:70},children:"Profil"}),e.jsx(a.Th,{style:{cursor:"pointer",color:"white",fontSize:"12px",padding:"8px 8px",whiteSpace:"nowrap",minWidth:140},onClick:()=>q("nom_prenom"),children:e.jsxs(d,{gap:4,children:["Nom",n==="nom_prenom"&&e.jsx(r,{size:"xs",c:"yellow",children:g==="asc"?"↑":"↓"})]})}),e.jsx(a.Th,{style:{cursor:"pointer",color:"white",fontSize:"12px",padding:"8px 8px",whiteSpace:"nowrap",minWidth:110},onClick:()=>q("telephone_id"),children:e.jsxs(d,{gap:4,children:["Téléphone",n==="telephone_id"&&e.jsx(r,{size:"xs",c:"yellow",children:g==="asc"?"↑":"↓"})]})}),e.jsx(a.Th,{style:{color:"white",fontSize:"12px",padding:"8px 8px",minWidth:100},children:"Obs."}),e.jsx(a.Th,{style:{cursor:"pointer",color:"white",fontSize:"12px",padding:"8px 8px",minWidth:100},onClick:()=>q("date_enregistrement"),children:e.jsxs(d,{gap:4,children:[e.jsx(ot,{size:14}),"Date",n==="date_enregistrement"&&e.jsx(r,{size:"xs",c:"yellow",children:g==="asc"?"↑":"↓"})]})}),_.map(t=>{const s=ut[t.toLowerCase()]||t;return e.jsx(a.Th,{style:{color:"white",fontSize:"9px",fontWeight:600,padding:"8px 2px",whiteSpace:"nowrap",textAlign:"center",minWidth:35,maxWidth:50,cursor:"default"},title:t,children:s},t)}),e.jsx(a.Th,{style:{textAlign:"center",color:"white",fontSize:"12px",padding:"8px 8px",width:150,minWidth:150},children:"Actions"})]})}),e.jsx(a.Tbody,{children:Se.map(t=>{const s=new Map;t.mesures.forEach(h=>{s.set(h.nom.trim().toLowerCase(),h.valeur)});const i=t.profil==="principal"?"blue":t.profil==="enfant"?"pink":t.profil==="conjoint"?"violet":t.profil==="parent"?"orange":"gray",o=t.profil==="principal"?"Moi":t.profil==="enfant"?"Enfant":t.profil==="conjoint"?"Conjoint":t.profil==="parent"?"Parent":"Autre",j=t.date_enregistrement?new Date(t.date_enregistrement).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-";return e.jsxs(a.Tr,{children:[e.jsx(a.Td,{style:{padding:"6px 4px",textAlign:"center"},children:e.jsx(J,{size:"sm",color:i,variant:"light",children:o})}),e.jsx(a.Td,{style:{fontSize:"12px",padding:"6px 8px",whiteSpace:"nowrap"},children:e.jsx(r,{size:"sm",fw:500,lineClamp:1,children:t.nom_prenom})}),e.jsx(a.Td,{style:{fontSize:"12px",padding:"6px 8px",whiteSpace:"nowrap"},children:e.jsx(J,{color:"gray",variant:"light",size:"sm",children:t.telephone_id})}),e.jsx(a.Td,{style:{fontSize:"12px",padding:"6px 8px",maxWidth:"150px"},children:e.jsx(r,{size:"xs",lineClamp:1,title:t.observations||"",children:t.observations?.substring(0,30)||"-"})}),e.jsx(a.Td,{style:{fontSize:"11px",padding:"6px 8px",whiteSpace:"nowrap"},children:e.jsx(r,{size:"xs",c:"dimmed",children:j})}),_.map(h=>{const l=s.get(h.toLowerCase())||"-";return e.jsx(a.Td,{style:{fontSize:"10px",padding:"4px 2px",whiteSpace:"nowrap",textAlign:"center",minWidth:35,maxWidth:50},title:`${h}: ${l}`,children:e.jsx(r,{size:"xs",ta:"center",c:l!=="-"?"dark":"dimmed",fw:l!=="-"?600:400,children:l})},h)}),e.jsx(a.Td,{style:{padding:"6px 4px"},children:e.jsxs(d,{gap:4,justify:"center",wrap:"nowrap",children:[e.jsx(O,{label:"Détails des mesures",children:e.jsx(D,{variant:"light",color:"blue",size:"sm",onClick:()=>_e(t),children:e.jsx(xe,{size:14})})}),e.jsx(O,{label:"Nouvelle vente",children:e.jsx(D,{variant:"light",color:"green",size:"sm",onClick:()=>Ae(t),children:e.jsx(ht,{size:14})})}),e.jsx(O,{label:"Modifier le client",children:e.jsx(D,{variant:"light",color:"yellow",size:"sm",onClick:()=>Ee(t),children:e.jsx(it,{size:14})})}),e.jsx(O,{label:"Supprimer",children:e.jsx(D,{variant:"light",color:"red",size:"sm",onClick:()=>Ie(t.telephone_id),children:e.jsx(We,{size:14})})})]})})]},t.id||t.telephone_id)})})]})}),ne>1&&e.jsx(d,{justify:"center",mt:"md",children:e.jsx(Ke,{value:I,onChange:S,total:ne,color:"#1b365d"})})]})]})}),e.jsx(X,{opened:W!==null,onClose:()=>N(null),title:"Confirmation",centered:!0,radius:"md",children:e.jsxs(E,{children:[e.jsx(r,{children:"Êtes-vous sûr de vouloir supprimer ce client ?"}),e.jsx(r,{size:"sm",c:"dimmed",children:"Cette action est irréversible."}),e.jsxs(d,{justify:"flex-end",mt:"md",children:[e.jsx(f,{variant:"light",onClick:()=>N(null),children:"Annuler"}),e.jsx(f,{color:"red",onClick:()=>{W&&ie.mutate(W)},loading:ie.isPending,children:"Supprimer"})]})]})}),je&&b&&e.jsx(mt,{client:{nom_prenom:b.nom_prenom,telephone_id:b.telephone_id,observations:b.observations||""},mesures:b.mesures.map(t=>({nom:t.nom,valeur:t.valeur??"",unite:t.unite||"cm"})),onClose:()=>{G(!1),L()}}),e.jsx(X,{opened:be,onClose:()=>re(!1),title:"📋 Instructions",size:"md",centered:!0,radius:"md",children:e.jsxs(E,{gap:"md",children:[e.jsx(r,{size:"sm",children:"1️⃣ Renseignez les informations personnelles du client"}),e.jsx(r,{size:"sm",children:"2️⃣ Ajoutez les mesures du client dans l'onglet dédié"}),e.jsx(r,{size:"sm",children:"3️⃣ Les observations sont optionnelles mais utiles"}),e.jsx(r,{size:"sm",children:"4️⃣ Exportez la liste au format Excel ou PDF"}),e.jsx(r,{size:"sm",children:"5️⃣ Utilisez la recherche pour filtrer rapidement"}),e.jsx(r,{size:"sm",children:"6️⃣ Cliquez sur 👁️ pour voir les mesures détaillées"}),e.jsx(r,{size:"sm",children:"7️⃣ Cliquez sur 🛒 pour créer une vente"}),e.jsx(r,{size:"sm",children:"8️⃣ Les clients sont triés du plus récent au plus ancien"}),e.jsx(Z,{}),e.jsx(r,{size:"xs",c:"dimmed",ta:"center",children:"Version 2.0.0 - Gestion Couture"})]})})]})})})}export{Qt as default};
