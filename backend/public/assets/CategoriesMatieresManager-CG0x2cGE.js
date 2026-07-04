import{r as o,a2 as W,j as e,C as ue,a as T,S as x,T as r,z as g,G as l,A as he,B as p,D,g as H,Z as k,U as I,b as m,K as xe,e as U,_ as V,M as A,aR as ge,p as me,a3 as fe,q as je,$ as be}from"./index-BGHuVC2V.js";import{C as ve}from"./ColorInput-xHc2WbuG.js";import{C as ze}from"./Container-DBeMkvoa.js";import{T as ye}from"./Textarea-BFSb4zhu.js";import{L as Ce}from"./LoadingOverlay-BBHRF3xP.js";import{I as we,P as Se}from"./IconSearch-BF0c1nON.js";import{S as _e}from"./Switch-Dgquu42r.js";import{T as i}from"./Table-DThD9mnL.js";import{T as K}from"./Title-DBK6AsF7.js";import{I as Y}from"./IconCategory-BXQnrSoZ.js";import{I as Te}from"./IconPrinter-CIGQVvWR.js";import{I as Z}from"./IconInfoCircle-YFAtTVt0.js";import{I as De,a as ke}from"./IconPlus-C2MQzBIh.js";import{I as Ie}from"./IconRefresh-IUE3-Bce.js";import"./clamp-DTmYCdls.js";import"./CheckIcon-D_C_2_Nu.js";import"./get-auto-contrast-value-Da6zqqWm.js";const Ke=()=>{const[M,J]=o.useState([]),[Q,$]=o.useState(!0),[u,a]=o.useState(null),[f,L]=o.useState(null),[B,y]=o.useState(null),[X,E]=o.useState(""),[d,ee]=o.useState(""),[j,b]=o.useState(!1),[C,P]=o.useState(1),[te,R]=o.useState(!1),w=10,[ie,{open:F,close:S}]=W(!1),[se,{open:re,close:N}]=W(!1),[s,h]=o.useState({nom_categorie:"",description:"",couleur_affichage:"#1b365d",est_active:1}),v=async()=>{try{$(!0),a(null);const t=await me("/categories-matieres");J(t)}catch(t){a(t.message||"Erreur lors du chargement")}finally{$(!1)}};o.useEffect(()=>{v()},[]);const n=o.useMemo(()=>M.filter(t=>t.nom_categorie.toLowerCase().includes(d.toLowerCase())||t.description&&t.description.toLowerCase().includes(d.toLowerCase())),[M,d]),O=Math.ceil(n.length/w),oe=n.slice((C-1)*w,C*w),ae=()=>{const t=document.createElement("iframe");t.style.position="absolute",t.style.top="-9999px",t.style.left="-9999px",t.style.width="100%",t.style.height="100%",document.body.appendChild(t);const _=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des catégories de matières</title>
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
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          .print-header p { color: #666; font-size: 14px; }
          .print-date { 
            text-align: right; 
            margin-bottom: 20px; 
            font-size: 12px; 
            color: #666;
          }
          .print-summary {
            margin-bottom: 20px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            font-size: 13px;
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
            vertical-align: top;
          }
          th { 
            background: #f1f1f1; 
            font-weight: bold;
            font-size: 13px;
          }
          td { font-size: 12px; }
          .color-box {
            display: inline-block;
            width: 16px;
            height: 16px;
            border-radius: 3px;
            border: 1px solid rgba(0,0,0,0.2);
            margin-right: 6px;
            vertical-align: middle;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: normal;
          }
          .badge-actif { background: #d4edda; color: #155724; }
          .badge-inactif { background: #f8d7da; color: #721c24; }
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
          <h1>
            📋 Catégories de Matières
          </h1>
          <p>Gestion des catégories pour l'organisation des matières premières</p>
        </div>
        <div class="print-date">
          Date d'impression : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
        </div>
        ${d?`
          <div class="print-summary">
            <strong>🔍 Recherche :</strong> "${d}"
          </div>
        `:""}
        <div class="print-summary">
          <strong>📊 Résumé :</strong> ${n.length} catégorie${n.length>1?"s":""} trouvée${n.length>1?"s":""}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 80px">Couleur</th>
              <th>Nom</th>
              <th style="width: 120px">Code</th>
              <th>Description</th>
              <th style="width: 80px">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${n.map(c=>`
              <tr>
                <td style="text-align: center;">
                  <div class="color-box" style="background-color: ${c.couleur_affichage||"#6B7280"}"></div>
                  <span style="font-size: 10px;">${c.couleur_affichage||"#6B7280"}</span>
                </td>
                <td>
                  <strong>${c.nom_categorie}</strong>
                </td>
                <td>${c.code_categorie||"-"}</td>
                <td>${c.description||"-"}</td>
                <td>
                  <span class="badge ${c.est_active===1?"badge-actif":"badge-inactif"}">
                    ${c.est_active===1?"Actif":"Inactif"}
                  </span>
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
    `,z=t.contentWindow?.document;z&&(z.open(),z.write(_),z.close(),t.onload=()=>{t.contentWindow?.focus(),t.contentWindow?.print(),setTimeout(()=>{document.body.removeChild(t)},100)},setTimeout(()=>{document.body.contains(t)&&(t.contentWindow?.focus(),t.contentWindow?.print(),setTimeout(()=>{document.body.contains(t)&&document.body.removeChild(t)},100))},500))},q=()=>{h({nom_categorie:"",description:"",couleur_affichage:"#1b365d",est_active:1}),L(null),a(null)},ne=()=>{q(),F()},le=t=>{L(t),h({nom_categorie:t.nom_categorie||"",description:t.description||"",couleur_affichage:t.couleur_affichage||"#1b365d",est_active:t.est_active??1}),F()},de=(t,_)=>{y(t),E(_),re()},G=()=>{y(null),E(""),N()},ce=async()=>{if(!s.nom_categorie.trim()){a("Le nom est requis");return}try{b(!0),a(null),f?await fe(`/categories-matieres/${f.id}`,{nom_categorie:s.nom_categorie,description:s.description,couleur_affichage:s.couleur_affichage,est_active:s.est_active}):await je("/categories-matieres",{nom_categorie:s.nom_categorie,description:s.description,couleur_affichage:s.couleur_affichage,est_active:s.est_active}),S(),await v(),q()}catch(t){console.error(t),a(t.message||"Erreur lors de l'enregistrement")}finally{b(!1)}},pe=async()=>{if(B)try{b(!0),a(null),await be(`/categories-matieres/${B}`),N(),y(null),await v()}catch(t){console.error(t),a(t.message||"Erreur lors de la suppression")}finally{b(!1)}};return Q?e.jsx(ue,{style:{height:"50vh"},children:e.jsxs(T,{withBorder:!0,radius:"lg",p:"xl",children:[e.jsx(Ce,{visible:!0}),e.jsxs(x,{align:"center",gap:"md",children:[e.jsx(Y,{size:40,stroke:1.5}),e.jsx(r,{children:"Chargement des catégories..."})]})]})}):e.jsx(g,{p:"md",children:e.jsx(ze,{size:"full",children:e.jsxs(x,{gap:"lg",children:[e.jsx(T,{withBorder:!0,radius:"lg",p:"xl",style:{background:"linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)"},children:e.jsxs(l,{justify:"space-between",align:"center",children:[e.jsxs(l,{gap:"md",children:[e.jsx(he,{size:60,radius:"md",style:{backgroundColor:"rgba(255,255,255,0.2)"},children:e.jsx(Y,{size:30,color:"white"})}),e.jsxs(g,{children:[e.jsx(K,{order:1,c:"white",size:"h2",children:"Catégories de Matières"}),e.jsx(r,{c:"gray.3",size:"sm",children:"Gérez les catégories (Tissus, Doublures, Fournitures, Fils...)"})]})]}),e.jsxs(l,{children:[e.jsx(p,{variant:"light",color:"white",leftSection:e.jsx(Te,{size:18}),onClick:ae,radius:"md",children:"Imprimer"}),e.jsx(p,{variant:"light",color:"white",leftSection:e.jsx(Z,{size:18}),onClick:()=>R(!0),radius:"md",children:"Instructions"})]})]})}),e.jsx(T,{withBorder:!0,radius:"lg",shadow:"sm",children:e.jsxs(x,{gap:"md",children:[e.jsxs(l,{justify:"space-between",align:"flex-end",children:[e.jsxs(g,{children:[e.jsx(r,{fw:700,size:"lg",c:"#1b365d",children:"Liste des catégories"}),e.jsxs(r,{size:"xs",c:"dimmed",children:[n.length," catégorie",n.length>1?"s":""," trouvée",n.length>1?"s":""]})]}),e.jsx(p,{leftSection:e.jsx(De,{size:16}),onClick:ne,variant:"gradient",gradient:{from:"#1b365d",to:"#2a4a7a"},children:"Nouvelle catégorie"})]}),e.jsx(D,{}),e.jsxs(l,{children:[e.jsx(H,{placeholder:"Rechercher une catégorie...",leftSection:e.jsx(we,{size:16}),value:d,onChange:t=>{ee(t.target.value),P(1)},style:{flex:1},radius:"md",size:"md"}),e.jsx(k,{label:"Actualiser",children:e.jsx(I,{variant:"light",onClick:v,size:"xl",radius:"md",children:e.jsx(Ie,{size:20})})})]}),u&&e.jsx(m,{color:"red",onClose:()=>a(null),withCloseButton:!0,radius:"md",children:u}),n.length===0?e.jsx(m,{icon:e.jsx(Z,{size:16}),color:"blue",variant:"light",radius:"md",children:d?"Aucune catégorie ne correspond à votre recherche":'Aucune catégorie enregistrée. Cliquez sur "Nouvelle catégorie" pour commencer.'}):e.jsxs(e.Fragment,{children:[e.jsx(xe,{style:{maxHeight:600},offsetScrollbars:!0,children:e.jsxs(i,{striped:!0,highlightOnHover:!0,withColumnBorders:!0,style:{fontSize:"15px"},children:[e.jsx(i.Thead,{style:{backgroundColor:"#1b365d"},children:e.jsxs(i.Tr,{children:[e.jsx(i.Th,{style:{width:40,color:"white",fontSize:"11px",padding:"8px 4px"}}),e.jsx(i.Th,{style:{color:"white",fontSize:"11px",padding:"8px 4px"},children:"Nom"}),e.jsx(i.Th,{style:{color:"white",fontSize:"11px",padding:"8px 4px"},children:"Code"}),e.jsx(i.Th,{style:{color:"white",fontSize:"11px",padding:"8px 4px"},children:"Description"}),e.jsx(i.Th,{style:{color:"white",fontSize:"11px",padding:"8px 4px"},children:"Couleur"}),e.jsx(i.Th,{style:{color:"white",fontSize:"11px",padding:"8px 4px"},children:"Statut"}),e.jsx(i.Th,{style:{textAlign:"center",color:"white",fontSize:"11px",padding:"8px 4px"},children:"Actions"})]})}),e.jsx(i.Tbody,{children:oe.map(t=>e.jsxs(i.Tr,{children:[e.jsx(i.Td,{style:{padding:"6px 4px",width:40},children:e.jsx(g,{w:20,h:20,style:{backgroundColor:t.couleur_affichage||"#6B7280",borderRadius:"4px",border:"1px solid rgba(0,0,0,0.1)"}})}),e.jsx(i.Td,{style:{fontSize:"15px",padding:"6px 4px"},children:e.jsx(r,{size:"xs",fw:500,children:t.nom_categorie})}),e.jsx(i.Td,{style:{fontSize:"15px",padding:"6px 4px",whiteSpace:"nowrap"},children:e.jsx(U,{variant:"light",color:"gray",size:"xs",children:t.code_categorie})}),e.jsx(i.Td,{style:{fontSize:"15px",padding:"6px 4px",maxWidth:"200px"},children:e.jsx(r,{size:"xs",lineClamp:1,children:t.description||"-"})}),e.jsx(i.Td,{style:{fontSize:"15px",padding:"6px 4px",whiteSpace:"nowrap"},children:e.jsxs(l,{gap:4,children:[e.jsx(g,{w:12,h:12,style:{backgroundColor:t.couleur_affichage||"#6B7280",borderRadius:"50%",border:"1px solid rgba(0,0,0,0.2)"}}),e.jsx(r,{size:"xs",children:t.couleur_affichage||"#6B7280"})]})}),e.jsx(i.Td,{style:{fontSize:"15px",padding:"6px 4px",whiteSpace:"nowrap"},children:e.jsx(U,{color:t.est_active===1?"green":"red",variant:"filled",size:"xs",children:t.est_active===1?"Actif":"Inactif"})}),e.jsx(i.Td,{style:{padding:"6px 4px"},children:e.jsxs(l,{gap:4,justify:"center",wrap:"nowrap",children:[e.jsx(k,{label:"Modifier",children:e.jsx(I,{variant:"subtle",color:"blue",size:"sm",onClick:()=>le(t),children:e.jsx(ke,{size:14})})}),e.jsx(k,{label:"Supprimer",children:e.jsx(I,{variant:"subtle",color:"red",size:"sm",onClick:()=>de(t.id,t.nom_categorie),children:e.jsx(V,{size:14})})})]})})]},t.id))})]})}),O>1&&e.jsx(l,{justify:"center",mt:"md",children:e.jsx(Se,{value:C,onChange:P,total:O,color:"#1b365d"})})]})]})}),e.jsx(A,{opened:ie,onClose:S,title:e.jsx(K,{order:3,children:f?"Modifier la catégorie":"Nouvelle catégorie"}),size:"md",radius:"md",padding:"xl",centered:!0,children:e.jsx("form",{onSubmit:t=>{t.preventDefault(),ce()},children:e.jsxs(x,{gap:"md",children:[e.jsx(H,{label:"Nom de la catégorie",placeholder:"Ex: Tissus, Doublures, Fournitures...",value:s.nom_categorie,onChange:t=>h({...s,nom_categorie:t.target.value}),required:!0,withAsterisk:!0,size:"md",radius:"md"}),e.jsx(ye,{label:"Description",placeholder:"Description de la catégorie...",value:s.description,onChange:t=>h({...s,description:t.target.value}),rows:3,size:"md",radius:"md"}),e.jsx(ve,{label:"Couleur associée",placeholder:"Sélectionnez une couleur",value:s.couleur_affichage,onChange:t=>h({...s,couleur_affichage:t}),format:"hex",size:"md",radius:"md",leftSection:e.jsx(ge,{size:16})}),e.jsx(_e,{label:"Catégorie active",description:"Les catégories inactives ne seront pas visibles",checked:s.est_active===1,onChange:t=>h({...s,est_active:t.currentTarget.checked?1:0}),size:"md"}),u&&e.jsx(m,{color:"red",onClose:()=>a(null),withCloseButton:!0,radius:"md",children:u}),e.jsx(D,{my:"sm"}),e.jsxs(l,{justify:"flex-end",gap:"md",children:[e.jsx(p,{variant:"subtle",onClick:S,size:"md",radius:"md",disabled:j,children:"Annuler"}),e.jsx(p,{type:"submit",color:"blue",size:"md",radius:"md",loading:j,children:f?"Enregistrer les modifications":"Créer la catégorie"})]})]})})}),e.jsx(A,{opened:se,onClose:G,title:"Confirmation de suppression",size:"sm",radius:"md",padding:"lg",centered:!0,children:e.jsxs(x,{gap:"md",children:[e.jsxs(m,{color:"red",variant:"light",children:[e.jsxs(r,{size:"md",fw:500,children:['Êtes-vous sûr de vouloir supprimer la catégorie "',X,'" ?']}),e.jsx(r,{size:"sm",mt:8,children:"Cette action est irréversible. Les matières associées ne seront pas supprimées."})]}),u&&e.jsx(m,{color:"red",onClose:()=>a(null),withCloseButton:!0,radius:"md",children:u}),e.jsxs(l,{justify:"flex-end",gap:"md",children:[e.jsx(p,{variant:"subtle",onClick:G,size:"md",radius:"md",disabled:j,children:"Annuler"}),e.jsx(p,{color:"red",onClick:pe,size:"md",radius:"md",leftSection:e.jsx(V,{size:18}),loading:j,children:"Supprimer définitivement"})]})]})}),e.jsx(A,{opened:te,onClose:()=>R(!1),title:"📋 Instructions",size:"md",centered:!0,radius:"md",children:e.jsxs(x,{gap:"md",children:[e.jsx(r,{size:"sm",children:"1️⃣ Créez des catégories pour organiser vos matières"}),e.jsx(r,{size:"sm",children:"2️⃣ Chaque catégorie peut avoir une couleur distinctive"}),e.jsx(r,{size:"sm",children:"3️⃣ Le code catégorie est généré automatiquement"}),e.jsx(r,{size:"sm",children:"4️⃣ Ajoutez une description pour plus de détails"}),e.jsx(r,{size:"sm",children:"5️⃣ Activez ou désactivez une catégorie selon vos besoins"}),e.jsx(r,{size:"sm",children:"6️⃣ Les matières associées ne sont pas supprimées avec la catégorie"}),e.jsx(D,{}),e.jsx(r,{size:"xs",c:"dimmed",ta:"center",children:"Version 1.0.0 - Gestion Couture"})]})})]})})})};export{Ke as default};
