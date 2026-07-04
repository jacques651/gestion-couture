import{r as o,j as e,C as U,a as j,S as a,T as t,z as A,a1 as q,y as J,G as i,A as B,e as d,B as f,g as Y,Z as w,U as v,x as Z,_ as K,M as Q,J as D,D as X,p as ee,$ as se}from"./index-BGHuVC2V.js";import{C as te}from"./Container-DBeMkvoa.js";import{L as ie}from"./LoadingOverlay-BBHRF3xP.js";import{I as re,P as oe}from"./IconSearch-BF0c1nON.js";import{T as r}from"./Table-DThD9mnL.js";import{T as ne}from"./Title-DBK6AsF7.js";import{I as T,F as ae}from"./FormulaireTypePrestation-BwNjY3PH.js";import{I as de}from"./IconPrinter-CIGQVvWR.js";import{I as le}from"./IconInfoCircle-YFAtTVt0.js";import{I as ce}from"./IconRefresh-IUE3-Bce.js";import{I as pe,a as he}from"./IconPlus-C2MQzBIh.js";import{I as xe}from"./IconTag-bCfOKNQn.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./NumberInput-BQ1gXv8v.js";import"./clamp-DTmYCdls.js";import"./IconArrowLeft-Czl62cJB.js";import"./IconDeviceFloppy-VIG8P6n5.js";const Pe=()=>{const[C,$]=o.useState([]),[R,S]=o.useState(!0),[l,I]=o.useState(""),[E,c]=o.useState(!1),[k,p]=o.useState(null),[M,L]=o.useState(!1),[O,h]=o.useState(!1),[G,F]=o.useState(""),[y,b]=o.useState(1),z=10,x=async()=>{try{S(!0);const s=await ee("/types-prestations");$(s||[])}catch(s){console.error(s)}finally{S(!1)}};o.useEffect(()=>{x()},[]);const W=async(s,u)=>{globalThis.confirm(`Supprimer le type "${u}" ?`)&&(await se(`/types-prestations/${s}`),await x(),F(`Type "${u}" supprimé avec succès`),h(!0),setTimeout(()=>h(!1),3e3))},N=()=>{I(""),x(),b(1)},V=()=>{const s=document.createElement("iframe");s.style.position="absolute",s.style.top="-9999px",s.style.left="-9999px",s.style.width="100%",s.style.height="100%",document.body.appendChild(s);const u=C.filter(g=>g.nom.toLowerCase().includes(l.toLowerCase())),H=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des types de prestations</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            padding: 20px; 
            background: white; 
            color: black;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .print-header h1 { 
            margin-bottom: 10px; 
            font-size: 24px;
          }
          .print-header p { color: #666; font-size: 14px; }
          .print-date { 
            text-align: right; 
            margin-bottom: 20px; 
            font-size: 12px; 
            color: #666;
          }
                   
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #333; 
            padding: 10px 8px; 
            text-align: left; 
            vertical-align: middle;
          }
          th { 
            background: #1b365d;
            color: white;
            font-weight: bold;
            font-size: 13px;
          }
          td { font-size: 12px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
          }
          .badge-primary { background: #e3f2fd; color: #1976d2; }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>📋 Types de Prestations</h1>
          <p>Gestion des différents types de prestations de l'atelier</p>
        </div>
        <div class="print-date">
          Date d'impression : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
        </div>
        ${l?`
          <div style="margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <strong>🔍 Recherche :</strong> "${l}"
          </div>
        `:""}
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th class="text-right">Valeur par défaut</th>
            </tr>
          </thead>
          <tbody>
            ${u.map(g=>`
              <tr>
                <td>
                  <strong>${g.nom}</strong>
                 </td>
                <td class="text-right">
                  <span class="badge badge-primary">${(g.prix_par_defaut||0).toLocaleString()} FCFA</span>
                 </td>
               </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>Logiciel de gestion de couture - Version 1.0</p>
          <p>Document généré le ${new Date().toLocaleDateString("fr-FR")}</p>
        </div>
      </body>
      </html>
    `,m=s.contentWindow?.document;m&&(m.open(),m.write(H),m.close(),s.onload=()=>{s.contentWindow?.focus(),s.contentWindow?.print(),setTimeout(()=>{document.body.contains(s)&&document.body.removeChild(s)},100)},setTimeout(()=>{document.body.contains(s)&&(s.contentWindow?.focus(),s.contentWindow?.print(),setTimeout(()=>{document.body.contains(s)&&document.body.removeChild(s)},100))},500))},n=C.filter(s=>s.nom.toLowerCase().includes(l.toLowerCase())),P=Math.ceil(n.length/z),_=n.slice((y-1)*z,y*z);return R?e.jsx(U,{style:{height:"50vh"},children:e.jsxs(j,{withBorder:!0,radius:"lg",p:"xl",children:[e.jsx(ie,{visible:!0}),e.jsxs(a,{align:"center",gap:"md",children:[e.jsx(T,{size:40,stroke:1.5}),e.jsx(t,{children:"Chargement des types de prestations..."})]})]})}):E?e.jsx(ae,{type:k||void 0,onSuccess:()=>{c(!1),p(null),x(),F(k?"Type modifié avec succès":"Type créé avec succès"),h(!0),setTimeout(()=>h(!1),3e3)},onCancel:()=>{c(!1),p(null)}}):e.jsx(A,{p:"md",children:e.jsx(te,{size:"full",children:e.jsxs(a,{gap:"lg",children:[O&&e.jsx(q,{icon:e.jsx(J,{size:18}),color:"green",title:"Succès !",onClose:()=>h(!1),radius:"md",children:G}),e.jsx(j,{withBorder:!0,radius:"lg",p:"xl",style:{background:"linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)"},children:e.jsxs(i,{justify:"space-between",align:"center",children:[e.jsxs(i,{gap:"md",children:[e.jsx(B,{size:60,radius:"md",style:{backgroundColor:"rgba(255,255,255,0.2)"},children:e.jsx(T,{size:30,color:"white"})}),e.jsxs(A,{children:[e.jsx(ne,{order:1,c:"white",size:"h2",children:"Types de prestations"}),e.jsx(t,{c:"gray.3",size:"sm",mt:4,children:"Gérez les différents types de prestations de votre atelier"}),e.jsx(i,{gap:"xs",mt:8,children:e.jsxs(d,{size:"sm",variant:"white",color:"blue",children:[n.length," type",n.length>1?"s":""," actif",n.length>1?"s":""]})})]})]}),e.jsxs(i,{children:[e.jsx(f,{variant:"light",color:"white",leftSection:e.jsx(de,{size:18}),onClick:V,radius:"md",children:"Imprimer"}),e.jsx(f,{variant:"light",color:"white",leftSection:e.jsx(le,{size:18}),onClick:()=>L(!0),radius:"md",children:"Instructions"})]})]})}),e.jsx(j,{withBorder:!0,radius:"lg",shadow:"sm",p:"md",children:e.jsxs(i,{justify:"space-between",wrap:"wrap",gap:"sm",children:[e.jsx(i,{gap:"sm",children:e.jsx(Y,{placeholder:"Rechercher par nom...",leftSection:e.jsx(re,{size:16}),value:l,onChange:s=>{I(s.target.value),b(1)},size:"md",radius:"md",style:{width:280}})}),e.jsxs(i,{gap:"sm",children:[e.jsx(w,{label:"Actualiser",children:e.jsx(v,{variant:"light",onClick:N,size:"lg",radius:"md",children:e.jsx(ce,{size:18})})}),e.jsx(f,{leftSection:e.jsx(pe,{size:18}),onClick:()=>{p(null),c(!0)},variant:"gradient",gradient:{from:"#1b365d",to:"#2a4a7a"},radius:"md",children:"Nouveau type"})]})]})}),e.jsx(j,{withBorder:!0,radius:"lg",shadow:"sm",p:0,style:{overflow:"hidden"},children:n.length===0?e.jsxs(a,{align:"center",py:60,gap:"sm",children:[e.jsx(Z,{size:"xl",radius:"xl",color:"gray",variant:"light",children:e.jsx(T,{size:30})}),e.jsx(t,{c:"dimmed",size:"lg",children:"Aucun type de prestation trouvé"}),e.jsx(f,{variant:"light",onClick:()=>{p(null),c(!0)},children:"Ajouter un type"})]}):e.jsxs(e.Fragment,{children:[e.jsxs(r,{striped:!0,highlightOnHover:!0,children:[e.jsx(r.Thead,{style:{backgroundColor:"#1b365d"},children:e.jsxs(r.Tr,{children:[e.jsx(r.Th,{style:{color:"white"},children:"Nom"}),e.jsx(r.Th,{style:{color:"white",textAlign:"right"},children:"Valeur par défaut"}),e.jsx(r.Th,{style:{textAlign:"center",color:"white",width:120},children:"Actions"})]})}),e.jsx(r.Tbody,{children:_.map(s=>e.jsxs(r.Tr,{children:[e.jsx(r.Td,{fw:500,children:e.jsxs(i,{gap:"xs",children:[e.jsx(B,{size:"sm",radius:"xl",color:"violet",children:e.jsx(xe,{size:12})}),s.nom]})}),e.jsx(r.Td,{ta:"right",children:e.jsxs(d,{color:"green",variant:"light",size:"md",children:[(s.prix_par_defaut||0).toLocaleString()," FCFA"]})}),e.jsx(r.Td,{children:e.jsxs(i,{gap:"xs",justify:"center",children:[e.jsx(w,{label:"Modifier",children:e.jsx(v,{size:"md",variant:"subtle",color:"orange",onClick:()=>{p(s),c(!0)},children:e.jsx(he,{size:18})})}),e.jsx(w,{label:"Supprimer",children:e.jsx(v,{size:"md",variant:"subtle",color:"red",onClick:()=>W(s.id||0,s.nom),children:e.jsx(K,{size:18})})})]})})]},s.id))})]}),P>1&&e.jsx(i,{justify:"center",p:"md",children:e.jsx(oe,{value:y,onChange:b,total:P,color:"#1b365d",size:"md",radius:"md"})})]})}),e.jsx(Q,{opened:M,onClose:()=>L(!1),title:"📋 Types de prestations",size:"md",centered:!0,radius:"lg",styles:{header:{backgroundColor:"#1b365d",padding:"16px 20px"},title:{color:"white",fontWeight:600},body:{padding:"24px"}},children:e.jsxs(a,{gap:"md",children:[e.jsxs(D,{p:"md",radius:"md",withBorder:!0,bg:"blue.0",children:[e.jsx(t,{fw:600,size:"sm",mb:"md",children:"📌 Fonctionnalités :"}),e.jsxs(a,{gap:"xs",children:[e.jsx(t,{size:"sm",children:'1️⃣ Utilisez "Nouveau type" pour ajouter un type de prestation'}),e.jsx(t,{size:"sm",children:"2️⃣ La recherche filtre par nom de prestation"}),e.jsx(t,{size:"sm",children:"3️⃣ Cliquez sur ✏️ pour modifier un type"}),e.jsx(t,{size:"sm",children:"4️⃣ Cliquez sur 🗑️ pour supprimer un type"}),e.jsx(t,{size:"sm",children:"5️⃣ Les types supprimés sont désactivés, pas définitivement supprimés"})]})]}),e.jsxs(D,{p:"md",radius:"md",withBorder:!0,bg:"yellow.0",children:[e.jsx(t,{fw:600,size:"sm",mb:"md",children:"💡 Exemples de prestations :"}),e.jsxs(a,{gap:"xs",children:[e.jsxs(i,{gap:"xs",children:[e.jsx(d,{color:"blue",size:"sm",children:"Couture"}),e.jsx(t,{size:"xs",children:"Confection de vêtements sur mesure"})]}),e.jsxs(i,{gap:"xs",children:[e.jsx(d,{color:"blue",size:"sm",children:"Retouche"}),e.jsx(t,{size:"xs",children:"Retouches et modifications"})]}),e.jsxs(i,{gap:"xs",children:[e.jsx(d,{color:"blue",size:"sm",children:"Brodage"}),e.jsx(t,{size:"xs",children:"Brodages personnalisés"})]}),e.jsxs(i,{gap:"xs",children:[e.jsx(d,{color:"blue",size:"sm",children:"Ourlet"}),e.jsx(t,{size:"xs",children:"Ourlets pour pantalons/jupes"})]})]})]}),e.jsx(X,{}),e.jsx(t,{size:"xs",c:"dimmed",ta:"center",children:"Version 1.0.0 - Gestion Couture"})]})})]})})})};export{Pe as default};
