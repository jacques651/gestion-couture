import{c as je,r as o,a2 as G,j as e,C as He,a as F,S as f,T as r,z as $,G as c,A as Ve,B as p,D as U,g as C,Z as w,U as S,b as _,K as Qe,e as P,_ as ce,M as L,w as H,p as V,H as Ke,a3 as ue,q as Xe,$ as Ye}from"./index-BGHuVC2V.js";import{C as Ze}from"./Container-DBeMkvoa.js";import{G as g}from"./Grid-CG-wALX9.js";import{T as Je}from"./Textarea-BFSb4zhu.js";import{L as et}from"./LoadingOverlay-BBHRF3xP.js";import{N as M}from"./NumberInput-BQ1gXv8v.js";import{I as tt,P as st}from"./IconSearch-BF0c1nON.js";import{S as Q}from"./Select-CcHnbnNI.js";import{T as i}from"./Table-DThD9mnL.js";import{T as he}from"./Title-DBK6AsF7.js";import{I as rt}from"./IconPrinter-CIGQVvWR.js";import{I as pe}from"./IconInfoCircle-YFAtTVt0.js";import{I as it,a as ot}from"./IconPlus-C2MQzBIh.js";import{I as at}from"./IconRefresh-IUE3-Bce.js";import{I as me,a as xe}from"./IconArrowUp-CaEEWNrq.js";import{I as nt}from"./IconMapPin-B_tYYVkG.js";import"./get-base-value-CzvdkZld.js";import"./clamp-DTmYCdls.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./CheckIcon-D_C_2_Nu.js";const lt=[["path",{d:"M4 7v-1a2 2 0 0 1 2 -2h2",key:"svg-0"}],["path",{d:"M4 17v1a2 2 0 0 0 2 2h2",key:"svg-1"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v1",key:"svg-2"}],["path",{d:"M16 20h2a2 2 0 0 0 2 -2v-1",key:"svg-3"}],["path",{d:"M5 11h1v2h-1l0 -2",key:"svg-4"}],["path",{d:"M10 11l0 2",key:"svg-5"}],["path",{d:"M14 11h1v2h-1l0 -2",key:"svg-6"}],["path",{d:"M19 11l0 2",key:"svg-7"}]],dt=je("outline","barcode","Barcode",lt);const ct=[["path",{d:"M21 16.008v-8.018a1.98 1.98 0 0 0 -1 -1.717l-7 -4.008a2.016 2.016 0 0 0 -2 0l-7 4.008c-.619 .355 -1 1.01 -1 1.718v8.018c0 .709 .381 1.363 1 1.717l7 4.008a2.016 2.016 0 0 0 2 0l7 -4.008c.619 -.355 1 -1.01 1 -1.718",key:"svg-0"}],["path",{d:"M12 22v-10",key:"svg-1"}],["path",{d:"M12 12l8.73 -5.04",key:"svg-2"}],["path",{d:"M3.27 6.96l8.73 5.04",key:"svg-3"}]],ge=je("outline","cube","Cube",ct),fe={code_matiere:"",designation:"",categorie_id:0,unite:"mètre",prix_achat:0,stock_actuel:0,seuil_alerte:0,reference_fournisseur:"",emplacement:"",est_supprime:0},It=()=>{const[A,be]=o.useState([]),[E,K]=o.useState([]),[ve,X]=o.useState(!0),[j,d]=o.useState(null),[T,Y]=o.useState(null),[b,v]=o.useState(!1),[h,ze]=o.useState("add"),[l,ye]=o.useState(null),[R,Z]=o.useState(1),[m,Ce]=o.useState(""),[N,J]=o.useState(1),[ke,ee]=o.useState(!1),[te,se]=o.useState(null),[we,re]=o.useState(""),B=10,[Se,{open:ie,close:W}]=G(!1),[_e,{open:Me,close:O}]=G(!1),[Ae,{open:Te,close:Ie}]=G(!1),[s,u]=o.useState(fe),De=()=>{const t=document.createElement("iframe");t.style.position="absolute",t.style.top="-9999px",t.style.left="-9999px",t.style.width="100%",t.style.height="100%",document.body.appendChild(t);const n=A.filter(a=>a.designation.toLowerCase().includes(m.toLowerCase())||a.code_matiere.toLowerCase().includes(m.toLowerCase())),x=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des matières</title>
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
          .print-summary {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 25px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .summary-item {
            flex: 1;
            text-align: center;
          }
          .summary-item .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .summary-item .value {
            font-size: 20px;
            font-weight: bold;
            color: #1b365d;
          }
          .summary-item .unit {
            font-size: 10px;
            color: #999;
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
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
          .badge-green { background: #d4edda; color: #155724; }
          .badge-orange { background: #fff3cd; color: #856404; }
          .badge-red { background: #f8d7da; color: #721c24; }
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
          <h1>📦 Gestion des Matières</h1>
          <p>Inventaire des matières premières (tissus, fils, fournitures...)</p>
        </div>
        ${m?`
          <div style="margin-bottom: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            <strong>🔍 Recherche :</strong> "${m}"
          </div>
        `:""}
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Désignation</th>
              <th>Catégorie</th>
              <th>Emplacement</th>
              <th class="text-center">Stock</th>
              <th class="text-right">Prix achat</th>
              <th class="text-right">Valeur totale</th>
            </tr>
          </thead>
          <tbody>
            ${n.map(a=>{const de=E.find(Ue=>Ue.id===a.categorie_id),D=a.stock_actuel<=0?"rupture":a.stock_actuel<=a.seuil_alerte?"faible":"normal",Oe=D==="normal"?"badge-green":D==="faible"?"badge-orange":"badge-red",qe=D==="normal"?"En stock":D==="faible"?"Stock faible":"Rupture",Ge=a.stock_actuel*a.prix_achat;return`
                <tr>
                  <td><strong>${a.code_matiere}</strong></td>
                  <td>
                    ${a.designation}
                    ${a.reference_fournisseur?`<div style="font-size: 10px; color: #666;">Réf: ${a.reference_fournisseur}</div>`:""}
                  </td>
                  <td>${de?de.nom_categorie:"-"}</td>
                  <td>${a.emplacement||"-"}</td>
                  <td class="text-center">
                    <span class="badge ${Oe}">${qe}</span>
                    <div style="margin-top: 4px;"><strong>${a.stock_actuel}</strong> ${a.unite}</div>
                  </td>
                  <td class="text-right">${a.prix_achat.toLocaleString()} FCFA</td>
                  <td class="text-right"><strong>${Ge.toLocaleString()} FCFA</strong></td>
                </tr>
              `}).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>Logiciel de gestion de couture - Version 1.0</p>
          <p>Document généré le ${new Date().toLocaleDateString("fr-FR")}</p>
        </div>
      </body>
      </html>
    `,y=t.contentWindow?.document;y&&(y.open(),y.write(x),y.close(),t.onload=()=>{t.contentWindow?.focus(),t.contentWindow?.print(),setTimeout(()=>{document.body.contains(t)&&document.body.removeChild(t)},100)},setTimeout(()=>{document.body.contains(t)&&(t.contentWindow?.focus(),t.contentWindow?.print(),setTimeout(()=>{document.body.contains(t)&&document.body.removeChild(t)},100))},500))},k=async()=>{try{X(!0),d(null);const[t,n]=await Promise.all([V("/matieres"),V("/categories-matieres")]);be(t),K(n)}catch(t){d(t.message||"Erreur lors du chargement")}finally{X(!1)}};o.useEffect(()=>{k()},[]);const oe=()=>{u(fe),Y(null)},Fe=()=>{oe(),ie()},$e=t=>{Y(t),u({code_matiere:t.code_matiere,designation:t.designation,categorie_id:t.categorie_id,unite:t.unite,prix_achat:t.prix_achat,stock_actuel:t.stock_actuel,seuil_alerte:t.seuil_alerte,reference_fournisseur:t.reference_fournisseur||"",emplacement:t.emplacement||"",est_supprime:0}),ie()},ae=(t,n)=>{ye(t),ze(n),Z(1),Me()},Pe=(t,n)=>{se(t),re(n),Te()},q=()=>{se(null),re(""),Ie()},Le=async()=>{if(!s.designation.trim()){d("La désignation est requise");return}if(!s.categorie_id){d("La catégorie est requise");return}try{v(!0),d(null),T?await ue(`/matieres/${T.id}`,s):await Xe("/matieres",s),W(),await k(),oe()}catch(t){console.error(t),d(t.message||"Erreur lors de l'enregistrement")}finally{v(!1)}},[I,ne]=o.useState(""),Ee=async()=>{if(!(!l||R<=0))try{v(!0),d(null),await ue(`/matieres/${l.id}/stock`,{quantite:R,action:h}),O(),await k()}catch(t){console.error(t),d(t.message||"Erreur lors de la mise à jour du stock")}finally{v(!1)}},Re=async()=>{if(te)try{v(!0),d(null),await Ye(`/matieres/${te}`),q(),await k()}catch(t){d(t.message||"Erreur lors de la suppression")}finally{v(!1)}},Ne=t=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"XOF"}).format(t),Be=(t,n)=>t<=0?{text:"Rupture",color:"red"}:t<=n?{text:"Stock faible",color:"orange"}:{text:"En stock",color:"green"},z=o.useMemo(()=>A.filter(t=>t.designation.toLowerCase().includes(m.toLowerCase())||t.code_matiere.toLowerCase().includes(m.toLowerCase())),[A,m]),le=Math.ceil(z.length/B),We=z.slice((N-1)*B,N*B);return ve&&A.length===0?e.jsx(He,{style:{height:"50vh"},children:e.jsxs(F,{withBorder:!0,radius:"lg",p:"xl",children:[e.jsx(et,{visible:!0}),e.jsxs(f,{align:"center",gap:"md",children:[e.jsx(ge,{size:40,stroke:1.5}),e.jsx(r,{children:"Chargement des matières..."})]})]})}):e.jsx($,{p:"md",children:e.jsx(Ze,{size:"full",children:e.jsxs(f,{gap:"lg",children:[e.jsx(F,{withBorder:!0,radius:"lg",p:"xl",style:{background:"linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)"},children:e.jsxs(c,{justify:"space-between",align:"center",children:[e.jsxs(c,{gap:"md",children:[e.jsx(Ve,{size:60,radius:"md",style:{backgroundColor:"rgba(255,255,255,0.2)"},children:e.jsx(ge,{size:30,color:"white"})}),e.jsxs($,{children:[e.jsx(he,{order:1,c:"white",size:"h2",children:"Gestion des Matières"}),e.jsx(r,{c:"gray.3",size:"sm",children:"Gérez vos stocks de tissus, fils et fournitures"})]})]}),e.jsxs(c,{children:[e.jsx(p,{variant:"light",color:"white",leftSection:e.jsx(rt,{size:18}),onClick:De,radius:"md",children:"Imprimer"}),e.jsx(p,{variant:"light",color:"white",leftSection:e.jsx(pe,{size:18}),onClick:()=>ee(!0),radius:"md",children:"Instructions"})]})]})}),e.jsx(F,{withBorder:!0,radius:"lg",shadow:"sm",children:e.jsxs(f,{gap:"md",children:[e.jsxs(c,{justify:"space-between",align:"flex-end",children:[e.jsxs($,{children:[e.jsx(he,{order:3,size:"h4",c:"#1b365d",children:"Liste des matières"}),e.jsxs(r,{size:"xs",c:"dimmed",children:[z.length," matière",z.length>1?"s":""," trouvée",z.length>1?"s":""]})]}),e.jsx(p,{leftSection:e.jsx(it,{size:16}),onClick:Fe,variant:"gradient",gradient:{from:"#1b365d",to:"#2a4a7a"},children:"Nouvelle matière"})]}),e.jsx(U,{}),e.jsxs(c,{children:[e.jsx(C,{placeholder:"Rechercher par nom ou code...",leftSection:e.jsx(tt,{size:16}),value:m,onChange:t=>{Ce(t.target.value),J(1)},style:{flex:1},radius:"md",size:"md"}),e.jsx(w,{label:"Actualiser",children:e.jsx(S,{variant:"light",onClick:k,size:"xl",radius:"md",children:e.jsx(at,{size:20})})})]}),j&&e.jsx(_,{color:"red",onClose:()=>d(null),withCloseButton:!0,radius:"md",children:j}),z.length===0?e.jsx(_,{icon:e.jsx(pe,{size:16}),color:"blue",variant:"light",radius:"md",children:m?"Aucune matière ne correspond à votre recherche":'Aucune matière enregistrée. Cliquez sur "Nouvelle matière" pour commencer.'}):e.jsxs(e.Fragment,{children:[e.jsx(Qe,{style:{maxHeight:600},offsetScrollbars:!0,children:e.jsxs(i,{striped:!0,highlightOnHover:!0,withColumnBorders:!0,style:{fontSize:"13px"},children:[e.jsx(i.Thead,{style:{backgroundColor:"#1b365d"},children:e.jsxs(i.Tr,{children:[e.jsx(i.Th,{style:{color:"white",fontSize:"13px",padding:"10px 8px",fontWeight:600},children:"Code"}),e.jsx(i.Th,{style:{color:"white",fontSize:"13px",padding:"10px 8px",fontWeight:600},children:"Désignation"}),e.jsx(i.Th,{style:{color:"white",fontSize:"13px",padding:"10px 8px",fontWeight:600},children:"Catégorie"}),e.jsx(i.Th,{style:{color:"white",fontSize:"13px",padding:"10px 8px",fontWeight:600,textAlign:"center"},children:"Unité"}),e.jsx(i.Th,{style:{color:"white",fontSize:"13px",padding:"10px 8px",fontWeight:600,textAlign:"center"},children:"Stock"}),e.jsx(i.Th,{style:{color:"white",fontSize:"13px",padding:"10px 8px",fontWeight:600,textAlign:"right"},children:"Prix achat"}),e.jsx(i.Th,{style:{textAlign:"center",color:"white",fontSize:"13px",padding:"10px 8px",fontWeight:600},children:"Actions"})]})}),e.jsx(i.Tbody,{children:We.map(t=>{const n=Be(t.stock_actuel,t.seuil_alerte),x=E.find(y=>y.id===t.categorie_id);return e.jsxs(i.Tr,{children:[e.jsx(i.Td,{style:{fontSize:"13px",padding:"8px 8px",whiteSpace:"nowrap"},children:e.jsx(r,{size:"sm",fw:500,children:t.code_matiere})}),e.jsxs(i.Td,{style:{fontSize:"13px",padding:"8px 8px"},children:[e.jsx(r,{size:"sm",fw:600,children:t.designation}),t.emplacement&&e.jsx(r,{size:"xs",c:"dimmed",children:t.emplacement})]}),e.jsx(i.Td,{style:{fontSize:"13px",padding:"8px 8px",whiteSpace:"nowrap"},children:x&&e.jsx(P,{style:{backgroundColor:x.couleur_affichage?`${x.couleur_affichage}25`:"#e5e7eb",color:x.couleur_affichage||"#374151"},size:"md",children:x.nom_categorie})}),e.jsx(i.Td,{style:{fontSize:"13px",padding:"8px 8px",whiteSpace:"nowrap",textAlign:"center"},children:e.jsx(P,{variant:"light",color:"gray",size:"md",children:t.unite})}),e.jsx(i.Td,{style:{fontSize:"13px",padding:"8px 8px",whiteSpace:"nowrap",textAlign:"center"},children:e.jsxs(c,{gap:8,justify:"center",wrap:"nowrap",children:[e.jsx(P,{color:n.color,variant:"filled",size:"md",children:n.text}),e.jsx(r,{size:"sm",fw:700,children:t.stock_actuel})]})}),e.jsx(i.Td,{style:{fontSize:"13px",padding:"8px 8px",whiteSpace:"nowrap",textAlign:"right"},children:e.jsx(r,{size:"sm",c:"gray.7",children:Ne(t.prix_achat)})}),e.jsx(i.Td,{style:{padding:"8px 8px"},children:e.jsxs(c,{gap:6,justify:"center",wrap:"nowrap",children:[e.jsx(w,{label:"Ajouter stock",children:e.jsx(S,{variant:"subtle",color:"green",size:"md",onClick:()=>ae(t,"add"),children:e.jsx(me,{size:18})})}),e.jsx(w,{label:"Retirer stock",children:e.jsx(S,{variant:"subtle",color:"orange",size:"md",onClick:()=>ae(t,"remove"),children:e.jsx(xe,{size:18})})}),e.jsx(w,{label:"Modifier",children:e.jsx(S,{variant:"subtle",color:"blue",size:"md",onClick:()=>$e(t),children:e.jsx(ot,{size:18})})}),e.jsx(w,{label:"Supprimer",children:e.jsx(S,{variant:"subtle",color:"red",size:"md",onClick:()=>Pe(t.id,t.designation),children:e.jsx(ce,{size:18})})})]})})]},t.id)})})]})}),le>1&&e.jsx(c,{justify:"center",mt:"md",children:e.jsx(st,{value:N,onChange:J,total:le,color:"#1b365d"})})]})]})}),e.jsx(L,{opened:Se,onClose:W,title:T?"Modifier la matière":"Nouvelle matière",size:"lg",radius:"md",padding:"xl",centered:!0,children:e.jsx("form",{onSubmit:t=>{t.preventDefault(),Le()},children:e.jsxs(f,{gap:"md",children:[e.jsx(C,{label:"Désignation",placeholder:"Nom de la matière",value:s.designation,onChange:t=>u({...s,designation:t.target.value}),required:!0,withAsterisk:!0,size:"md",radius:"md"}),e.jsxs(f,{gap:4,children:[e.jsx(Q,{label:"Catégorie",placeholder:"Sélectionner une catégorie",data:[...E.filter(t=>t.est_active===1).map(t=>({value:String(t.id),label:t.nom_categorie})),{value:"autre",label:"+ Autre (créer)"}],value:s.categorie_id===0&&I?"autre":String(s.categorie_id),onChange:t=>{u(t==="autre"?{...s,categorie_id:0}:{...s,categorie_id:parseInt(t||"0")})},required:!0,withAsterisk:!0,size:"md",radius:"md",searchable:!0}),(s.categorie_id===0||String(s.categorie_id)==="0")&&e.jsxs(c,{gap:"xs",children:[e.jsx(C,{placeholder:"Nom de la nouvelle catégorie",value:I,onChange:t=>ne(t.target.value),size:"xs",radius:"md",style:{flex:1}}),e.jsx(p,{size:"xs",variant:"light",color:"green",onClick:async()=>{if(!I.trim()){H.show({title:"Erreur",message:"Nom requis",color:"red"});return}try{const t=await V("/categories-matieres");K(t);const n=t.find(x=>x.nom_categorie===I.trim());n&&u({...s,categorie_id:n.id}),ne(""),H.show({title:"Succès",message:"Catégorie créée",color:"green"})}catch(t){H.show({title:"Erreur",message:t.message,color:"red"})}},children:"Créer"})]})]}),e.jsxs(g,{children:[e.jsx(g.Col,{span:{base:12,sm:6},children:e.jsx(Q,{label:"Unité",data:[{value:"mètre",label:"Mètre (m)"},{value:"pièce",label:"Pièce"},{value:"kg",label:"Kilogramme (kg)"},{value:"rouleau",label:"Rouleau"},{value:"bobine",label:"Bobine"}],value:s.unite,onChange:t=>u({...s,unite:t||"mètre"}),size:"md",radius:"md"})}),e.jsx(g.Col,{span:{base:12,sm:6},children:e.jsx(C,{label:"Emplacement",placeholder:"Rayon, étagère...",value:s.emplacement,onChange:t=>u({...s,emplacement:t.target.value}),size:"md",radius:"md",leftSection:e.jsx(nt,{size:16})})})]}),e.jsxs(g,{children:[e.jsx(g.Col,{span:{base:12,sm:6},children:e.jsx(M,{label:"Prix d'achat (FCFA)",placeholder:"0",value:s.prix_achat,onChange:t=>u({...s,prix_achat:typeof t=="number"?t:0}),size:"md",radius:"md",leftSection:e.jsx(r,{size:"sm",fw:600,children:"FCFA"}),thousandSeparator:" ",hideControls:!0})}),e.jsx(g.Col,{span:{base:12,sm:6},children:e.jsx(M,{label:"Stock initial",value:s.stock_actuel,onChange:t=>u({...s,stock_actuel:typeof t=="number"?t:0}),size:"md",radius:"md",leftSection:e.jsx(Ke,{size:16}),hideControls:!0})})]}),e.jsxs(g,{children:[e.jsx(g.Col,{span:{base:12,sm:6},children:e.jsx(M,{label:"Seuil d'alerte",description:"Alerte si stock ≤ ce seuil",value:s.seuil_alerte,onChange:t=>u({...s,seuil_alerte:typeof t=="number"?t:0}),size:"md",radius:"md",hideControls:!0})}),e.jsx(g.Col,{span:{base:12,sm:6},children:e.jsx(C,{label:"Référence fournisseur",placeholder:"Réf. fournisseur",value:s.reference_fournisseur,onChange:t=>u({...s,reference_fournisseur:t.target.value}),size:"md",radius:"md",leftSection:e.jsx(dt,{size:16})})})]}),j&&e.jsx(_,{color:"red",onClose:()=>d(null),withCloseButton:!0,radius:"md",children:j}),e.jsx(U,{my:"sm"}),e.jsxs(c,{justify:"flex-end",gap:"md",children:[e.jsx(p,{variant:"subtle",onClick:W,size:"md",radius:"md",disabled:b,children:"Annuler"}),e.jsx(p,{type:"submit",color:"blue",size:"md",radius:"md",loading:b,children:T?"Mettre à jour":"Enregistrer"})]})]})})}),e.jsx(L,{opened:_e,onClose:O,title:h==="add"?"📥 Ajouter du stock":"📤 Retirer du stock",size:"md",radius:"md",padding:"xl",centered:!0,children:e.jsxs(f,{gap:"md",children:[l&&e.jsx(F,{withBorder:!0,radius:"md",p:"sm",bg:"gray.0",children:e.jsxs(c,{justify:"space-between",children:[e.jsxs($,{children:[e.jsx(r,{size:"sm",fw:600,children:l.designation}),e.jsxs(r,{size:"xs",c:"dimmed",children:["Code : ",l.code_matiere]})]}),e.jsxs(P,{color:l.stock_actuel<=l.seuil_alerte?"red":"green",size:"lg",children:["Stock : ",l.stock_actuel," ",l.unite]})]})}),e.jsx(M,{label:`Quantité à ${h==="add"?"ajouter":"retirer"}`,description:h==="remove"&&l?`Maximum : ${l.stock_actuel} ${l.unite}`:"",value:R,onChange:t=>Z(typeof t=="number"?Math.max(1,t):1),min:1,max:h==="remove"&&l?l.stock_actuel:void 0,size:"md",radius:"md",autoFocus:!0}),e.jsx(M,{label:h==="add"?"Coût unitaire d'achat (FCFA)":"Valeur unitaire (FCFA)",placeholder:"0",value:s.prix_achat||0,onChange:t=>{},size:"md",radius:"md",leftSection:e.jsx(r,{size:"sm",fw:600,children:"FCFA"}),thousandSeparator:" ",hideControls:!0}),h==="add"&&e.jsx(C,{label:"Fournisseur",placeholder:"Nom du fournisseur (optionnel)",size:"md",radius:"md"}),h==="remove"&&e.jsx(Q,{label:"Motif de sortie",data:[{value:"vente",label:"💰 Vente"},{value:"utilisation",label:"🔧 Utilisation interne"},{value:"perte",label:"🗑️ Perte/Casse"},{value:"retour_fournisseur",label:"📦 Retour fournisseur"},{value:"autre",label:"📝 Autre"}],size:"md",radius:"md"}),e.jsx(Je,{label:"Observation",placeholder:"Notes...",rows:2,size:"md",radius:"md"}),j&&e.jsx(_,{color:"red",onClose:()=>d(null),withCloseButton:!0,radius:"md",children:j}),e.jsxs(c,{justify:"flex-end",gap:"md",mt:"md",children:[e.jsx(p,{variant:"subtle",onClick:O,size:"md",radius:"md",disabled:b,children:"Annuler"}),e.jsx(p,{color:h==="add"?"green":"orange",onClick:Ee,size:"md",radius:"md",loading:b,leftSection:h==="add"?e.jsx(me,{size:16}):e.jsx(xe,{size:16}),children:h==="add"?"Ajouter au stock":"Retirer du stock"})]})]})}),e.jsx(L,{opened:Ae,onClose:q,title:"Confirmation de suppression",size:"sm",radius:"md",padding:"lg",centered:!0,children:e.jsxs(f,{gap:"md",children:[e.jsxs(_,{color:"red",variant:"light",children:[e.jsxs(r,{size:"md",fw:500,children:['Êtes-vous sûr de vouloir supprimer la matière "',we,'" ?']}),e.jsx(r,{size:"sm",mt:8,children:"Cette action est irréversible. Toutes les données associées seront perdues."})]}),e.jsxs(c,{justify:"flex-end",gap:"md",children:[e.jsx(p,{variant:"subtle",onClick:q,size:"md",radius:"md",disabled:b,children:"Annuler"}),e.jsx(p,{color:"red",onClick:Re,size:"md",radius:"md",leftSection:e.jsx(ce,{size:18}),loading:b,children:"Supprimer définitivement"})]})]})}),e.jsx(L,{opened:ke,onClose:()=>ee(!1),title:"📋 Instructions",size:"md",centered:!0,radius:"md",children:e.jsxs(f,{gap:"md",children:[e.jsx(r,{size:"sm",children:"1️⃣ Ajoutez vos matières premières (tissus, fils, boutons...)"}),e.jsx(r,{size:"sm",children:"2️⃣ Choisissez la catégorie appropriée pour chaque matière"}),e.jsx(r,{size:"sm",children:"3️⃣ Définissez l'unité de mesure (mètre, pièce, kg...)"}),e.jsx(r,{size:"sm",children:"4️⃣ Gérez le stock avec les boutons d'ajout/retrait"}),e.jsx(r,{size:"sm",children:"5️⃣ Le seuil d'alerte vous avertit quand le stock est bas"}),e.jsx(r,{size:"sm",children:"6️⃣ Les prix d'achat et de vente sont en FCFA"}),e.jsx(U,{}),e.jsx(r,{size:"xs",c:"dimmed",ta:"center",children:"Version 1.0.0 - Gestion Couture"})]})})]})})})};export{It as default};
