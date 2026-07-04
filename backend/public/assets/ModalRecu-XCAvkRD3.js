import{r as g,j as e,N as E,C as q,aA as O,d as i,S as M,w as a,T as I,D as C,H as N,M as r,b as H,h as Y,G as p,B as _,X as U,V as B,z as W,ab as Q,m as S,y as X,g as k}from"./index-BA-Rp2mN.js";import{N as Z}from"./NumberInput-DRo7l_8S.js";import{I as J}from"./IconUser-DhNlAVwS.js";import{I as K}from"./IconCalendarEvent-ClTScVBM.js";const se=({vente:n,onClose:w,onConfirmPaiement:A})=>{const[$,t]=g.useState(!1),[L,d]=g.useState(!1),[h,R]=g.useState(0),[F,D]=g.useState("Espèces"),[f,P]=g.useState(null);console.log("Vente reçue dans ModalFacture:",n),console.log("Lignes:",n?.lignes),console.log("Details:",n?.details);const o=()=>n?.lignes&&Array.isArray(n.lignes)&&n.lignes.length>0?n.lignes:n?.details&&Array.isArray(n.details)&&n.details.length>0?n.details.map(s=>({designation:s.designation||"Article",quantite:Number(s.quantite)||1,prix_unitaire:Number(s.prix_unitaire)||0,total:Number(s.total)||Number(s.quantite)*Number(s.prix_unitaire)||0,type:s.type_produit||"article",taille_libelle:s.taille_libelle})):n?.montant_total&&n.montant_total>0?[{designation:"Prestation de couture",quantite:1,prix_unitaire:n.montant_total,total:n.montant_total,type:"prestation"}]:[];g.useEffect(()=>{(async()=>{if(n?.id&&(!n.lignes||n.lignes.length===0)&&(!n.details||n.details.length===0)){t(!0);try{const l=await S(`/ventes/${n.id}/details`);l&&l.length>0&&(n.details=l)}catch(l){console.error("Erreur chargement détails:",l)}finally{t(!1)}}})()},[n]),g.useEffect(()=>{(async()=>{try{const l=await S("/atelier");l&&l.length>0&&P(l[0])}catch(l){console.error("Erreur chargement atelier:",l)}})()},[]);const x=o(),j=n?.total_general||n?.montant_total||0,y=n?.montant_regle||n?.avance||0,u=j-y,m=n?.code_vente||n?.numero||"N/A",z=n?.date_vente||n?.date_commande||new Date().toISOString().split("T")[0],v=s=>{if(s===0)return"zéro";const l=["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"],b=["","dix","vingt","trente","quarante","cinquante","soixante","soixante-dix","quatre-vingt","quatre-vingt-dix"];if(s<20)return l[s];if(s<100){const c=Math.floor(s/10),T=s%10;return T===0?b[c]:c===7||c===9?`${b[c-1]}-${l[T+10]}`:`${b[c]}-${l[T]}`}if(s<1e3){const c=Math.floor(s/100),T=s%100;return T===0?`${l[c]} cent${c>1?"s":""}`:`${l[c]} cent ${v(T)}`}if(s<1e6){const c=Math.floor(s/1e3),T=s%1e3;return T===0?`${v(c)} mille`:`${v(c)} mille ${v(T)}`}return`${v(Math.floor(s/1e6))} million${Math.floor(s/1e6)>1?"s":""} ${v(s%1e6)}`},G=()=>{const s=document.getElementById("facture-print-content");if(!s)return;const l=document.title;document.title=`Facture ${m}`;const b=window.open("","_blank");b&&(b.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Facture ${m}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .facture-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #1b365d; margin: 0; }
            .infos { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #1b365d; color: white; }
            .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="facture-container">
            ${s.innerHTML}
          </div>
        </body>
        </html>
      `),b.document.close(),b.focus(),b.print(),b.close()),document.title=l},V=()=>{console.log("=== handleConfirmPaiement appelé ==="),console.log("montantPaiement:",h),console.log("modePaiement:",F),console.log("onConfirmPaiement existe?",!!A),A&&h>0?(console.log("✅ Appel de onConfirmPaiement avec:",h,F),A(h,F),d(!1)):console.log("❌ Conditions non remplies:",{onConfirmPaiement:!!A,montantPaiement:h,montantPaiementValide:h>0})};return $?e.jsx(E,{opened:!0,onClose:w,size:"lg",title:"Chargement...",centered:!0,children:e.jsxs(q,{py:"xl",children:[e.jsx(O,{}),e.jsx(i,{ml:"md",children:"Chargement des détails de la facture..."})]})}):e.jsx(E,{opened:!0,onClose:w,size:"lg",title:`Facture ${m}`,centered:!0,radius:"md",padding:"xl",children:e.jsxs(M,{gap:"md",children:[e.jsxs("div",{id:"facture-print-content",children:[e.jsxs(a,{style:{textAlign:"center",marginBottom:20},children:[e.jsx(I,{order:2,c:"#1b365d",children:f?.nom_atelier||"GESTION COUTURE"}),e.jsx(i,{size:"sm",children:f?.adresse||"Ouagadougou, Burkina Faso"}),e.jsxs(i,{size:"sm",children:["Tel: ",f?.telephone||"70 00 00 00"," | IFU: ",f?.ifu||"-"]}),e.jsx(C,{my:"md"}),e.jsxs(I,{order:3,children:["FACTURE N° ",m]}),e.jsxs(i,{size:"sm",children:["Date : ",new Date(z).toLocaleDateString("fr-FR")]})]}),e.jsxs(N,{p:"md",withBorder:!0,mb:"md",children:[e.jsx(i,{fw:700,size:"sm",children:"CLIENT"}),e.jsx(i,{size:"sm",children:n?.client_nom||n?.client?.nom_prenom||"Client non renseigné"}),n?.client_telephone&&e.jsxs(i,{size:"xs",c:"dimmed",children:["Tél: ",n.client_telephone]}),n?.client?.telephone_id&&!n?.client_telephone&&e.jsxs(i,{size:"xs",c:"dimmed",children:["Tél: ",n.client.telephone_id]})]}),x.length>0?e.jsxs(e.Fragment,{children:[e.jsxs(r,{striped:!0,highlightOnHover:!0,children:[e.jsx(r.Thead,{style:{backgroundColor:"#1b365d"},children:e.jsxs(r.Tr,{children:[e.jsx(r.Th,{style:{color:"white"},children:"N°"}),e.jsx(r.Th,{style:{color:"white"},children:"Désignation"}),e.jsx(r.Th,{style:{color:"white",textAlign:"center"},children:"Qté"}),e.jsx(r.Th,{style:{color:"white",textAlign:"right"},children:"Prix unitaire"}),e.jsx(r.Th,{style:{color:"white",textAlign:"right"},children:"Total"})]})}),e.jsx(r.Tbody,{children:x.map((s,l)=>e.jsxs(r.Tr,{children:[e.jsx(r.Td,{children:l+1}),e.jsxs(r.Td,{children:[s.designation,s.taille_libelle&&e.jsxs(i,{size:"xs",c:"dimmed",children:["Taille: ",s.taille_libelle]})]}),e.jsx(r.Td,{style:{textAlign:"center"},children:s.quantite}),e.jsxs(r.Td,{style:{textAlign:"right"},children:[s.prix_unitaire.toLocaleString()," FCFA"]}),e.jsxs(r.Td,{style:{textAlign:"right"},children:[s.total.toLocaleString()," FCFA"]})]},l))})]}),e.jsxs(a,{style:{textAlign:"right",marginTop:20},children:[e.jsxs(i,{fw:700,size:"lg",children:["Total: ",j.toLocaleString()," FCFA"]}),y>0&&e.jsxs(e.Fragment,{children:[e.jsxs(i,{size:"sm",c:"green",children:["Montant réglé: ",y.toLocaleString()," FCFA"]}),e.jsxs(i,{size:"sm",c:"orange",children:["Reste à payer: ",u.toLocaleString()," FCFA"]})]})]}),e.jsxs(a,{mt:"md",p:"sm",style:{backgroundColor:"#f8f9fa",borderRadius:8},children:[e.jsx(i,{size:"sm",fw:500,children:"Arrêté à la somme de :"}),e.jsxs(i,{size:"sm",fs:"italic",children:[v(Math.floor(j))," francs"]})]})]}):e.jsxs(H,{icon:e.jsx(Y,{size:16}),color:"yellow",title:"Information",children:["Aucun détail disponible pour cette facture. Le montant total est de ",j.toLocaleString()," FCFA."]}),f?.message_facture_defaut&&e.jsx(a,{mt:"md",p:"sm",style:{backgroundColor:"#f8f9fa",borderRadius:8},children:e.jsx(i,{size:"xs",c:"dimmed",fs:"italic",children:f.message_facture_defaut})}),e.jsxs(a,{mt:50,style:{textAlign:"right"},children:[e.jsx(i,{size:"sm",children:"Signature & cachet"}),e.jsx(C,{style:{width:200,marginLeft:"auto"}})]})]}),e.jsx(C,{}),e.jsxs(p,{justify:"space-between",children:[e.jsx(_,{variant:"light",onClick:w,leftSection:e.jsx(U,{size:16}),children:"Fermer"}),e.jsxs(p,{children:[e.jsx(_,{variant:"outline",onClick:G,leftSection:e.jsx(B,{size:16}),children:"Imprimer"}),u>0&&A&&e.jsx(_,{variant:"gradient",gradient:{from:"#1b365d",to:"#2a4a7a"},onClick:()=>d(!0),leftSection:e.jsx(W,{size:16}),children:"Enregistrer un paiement"})]})]}),L&&e.jsx(E,{opened:L,onClose:()=>d(!1),title:"Enregistrer un paiement",size:"sm",centered:!0,children:e.jsxs(M,{children:[e.jsxs(i,{size:"sm",children:["Montant restant à payer: ",e.jsxs("strong",{children:[u.toLocaleString()," FCFA"]})]}),e.jsx(Z,{label:"Montant à payer",value:h,onChange:s=>R(typeof s=="number"?s:0),min:1,max:u,step:1e3,required:!0}),e.jsx(Q,{label:"Mode de paiement",value:F,onChange:s=>D(s||"Espèces"),data:[{value:"Espèces",label:"💵 Espèces"},{value:"Carte Bancaire",label:"💳 Carte Bancaire"},{value:"Mobile Money",label:"📱 Mobile Money"},{value:"Virement",label:"🏦 Virement"},{value:"Chèque",label:"📝 Chèque"}]}),e.jsxs(p,{justify:"flex-end",mt:"md",children:[e.jsx(_,{variant:"light",onClick:()=>d(!1),children:"Annuler"}),e.jsx(_,{color:"green",onClick:V,disabled:h<=0||h>u,children:"Confirmer le paiement"})]})]})})]})})},re=({commande:n,onClose:w})=>{const[A,$]=g.useState(!0),[t,L]=g.useState(null),[d,h]=g.useState(null),R=g.useRef(null);g.useEffect(()=>{(async()=>{$(!0);try{const x=await S(`/ventes/${n.id}`),j=await S(`/ventes/${n.id}/details`);let y=null;try{const z=(await S("/rendezvous")).find(v=>v.vente_id===n.id);z&&(y=z)}catch{console.warn("Aucun rendez-vous trouvé")}L({...x,lignes:j||[],rendezvous:y});const u=await S("/atelier");u&&u.length>0&&h(u[0])}catch(x){console.error("Erreur chargement reçu:",x)}finally{$(!1)}})()},[n.id]);const F=()=>{if(!R.current||!t)return;const o=document.createElement("iframe");o.style.position="absolute",o.style.width="0px",o.style.height="0px",o.style.border="none",document.body.appendChild(o);const x=t.montant_total||0,j=t.montant_regle||0,y=x-j,u=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu ${t.code_vente||"N°"+n.id}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Times New Roman', Arial, sans-serif; 
            padding: 20px; 
            background: white; 
          }
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px;
            border-bottom: 2px solid #1b365d;
          }
          .header h1 { 
            color: #1b365d; 
            margin: 0 0 10px 0;
            font-size: 22px;
          }
          .header p { 
            color: #666; 
            margin: 5px 0;
            font-size: 11px;
          }
          .section {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 12px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
          }
          th, td { 
            border: 1px solid #333; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background: #1b365d;
            color: white;
            font-weight: bold;
            font-size: 11px;
          }
          td { 
            font-size: 11px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-line {
            margin: 5px 0;
            text-align: right;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
          }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
          }
          .badge-green { background: #d4edda; color: #155724; }
          .badge-orange { background: #fff3cd; color: #856404; }
          .badge-red { background: #f8d7da; color: #721c24; }
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
        <div class="print-container">
          <!-- En-tête -->
          <div class="header">
            <h1>${d?.nom_atelier||"GESTION COUTURE"}</h1>
            <p>${d?.adresse||"Ouagadougou, Burkina Faso"}</p>
            <p>Tel: ${d?.telephone||"70 00 00 00"} | IFU: ${d?.ifu||"-"}</p>
            <h2 style="margin-top: 15px; color: #1b365d;">REÇU N° ${t.code_vente||n.id}</h2>
            <p>Date : ${t.date_vente?new Date(t.date_vente).toLocaleDateString("fr-FR"):new Date().toLocaleDateString("fr-FR")}</p>
          </div>

          <!-- Infos client -->
          <div class="section">
            <div class="section-title">🧑 CLIENT</div>
            <p><strong>${t.client_nom||"Client non renseigné"}</strong></p>
            ${t.client_telephone?`<p style="font-size: 10px; color: #666;">Tél: ${t.client_telephone}</p>`:""}
          </div>

          <!-- Rendez-vous -->
          ${t.rendezvous&&t.rendezvous.date_rendezvous?`
          <div class="section" style="background: #FFF8E7; border-left: 4px solid #1b365d;">
            <div class="section-title">📅 RENDEZ-VOUS</div>
            <table style="width: 100%; border: none;">
              <tr>
                <td style="border: none; width: 25%;"><strong>Date:</strong></td>
                <td style="border: none;">${new Date(t.rendezvous.date_rendezvous).toLocaleDateString("fr-FR")}</td>
                <td style="border: none; width: 25%;"><strong>Heure:</strong></td>
                <td style="border: none;">${t.rendezvous.heure_rendezvous||"--:--"}</td>
              </tr>
              <tr>
                <td style="border: none;"><strong>Type:</strong></td>
                <td style="border: none;">${t.rendezvous.type_rendezvous==="essayage"?"👗 Essayage":t.rendezvous.type_rendezvous==="livraison"?"🚚 Livraison":"📦 Retrait"}</td>
                <td style="border: none;"><strong>Statut:</strong></td>
                <td style="border: none;">${t.rendezvous.statut==="planifie"?"⏳ Planifié":t.rendezvous.statut==="termine"?"✅ Terminé":"❌ Annulé"}</td>
              </tr>
            </table>
            ${t.rendezvous.observation?`<p style="margin-top: 8px; font-size: 10px;"><strong>Note:</strong> ${t.rendezvous.observation}</p>`:""}
          </div>
          `:""}

          <!-- Tableau des articles -->
          <table>
            <thead>
              <tr>
                <th>Désignation</th>
                <th style="width: 60px; text-align: center;">Qté</th>
                <th style="width: 110px; text-align: right;">Prix unit.</th>
                <th style="width: 110px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${t.lignes&&t.lignes.length>0?t.lignes.map(z=>`
                  <tr>
                    <td>${z.designation}</td>
                    <td class="text-center">${z.quantite}</td>
                    <td class="text-right">${z.prix_unitaire.toLocaleString()} FCFA</td>
                    <td class="text-right"><strong>${z.total.toLocaleString()} FCFA</strong></td>
                  </tr>
                `).join(""):'<tr><td colspan="4" class="text-center">Aucun détail disponible</td></tr>'}
            </tbody>
          </table>

          <!-- Totaux -->
          <div style="margin-top: 15px; text-align: right;">
            <div class="total-line"><strong>Total : ${x.toLocaleString()} FCFA</strong></div>
            ${j>0?`<div class="total-line" style="color: green;">Montant réglé : ${j.toLocaleString()} FCFA</div>`:""}
            ${y>0?`<div class="total-line" style="color: orange;">Reste à payer : ${y.toLocaleString()} FCFA</div>`:""}
            <div class="total-line">Mode de paiement : ${t.mode_paiement||"Espèces"}</div>
          </div>

          <!-- Statut -->
          <div style="margin-top: 15px; text-align: center;">
            <span class="badge ${t.statut==="PAYEE"?"badge-green":t.statut==="PARTIEL"?"badge-orange":"badge-red"}">
              ${t.statut==="PAYEE"?"✅ PAYÉE":t.statut==="PARTIEL"?"⚠️ PAIEMENT PARTIEL":"❌ EN ATTENTE"}
            </span>
          </div>

          <!-- Observations -->
          ${t.observation?`
          <div style="margin-top: 15px;">
            <p style="font-size: 10px; color: #666;"><strong>Observations:</strong></p>
            <p style="font-size: 10px;">${t.observation}</p>
          </div>
          `:""}

          <!-- Signature -->
          <div class="footer">
            <p>Signature & cachet</p>
            <p style="margin-top: 10px;">Document généré automatiquement - ${new Date().toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      </body>
      </html>
    `,m=o.contentWindow?.document;m&&(m.open(),m.write(u),m.close(),o.onload=()=>{o.contentWindow?.focus(),o.contentWindow?.print(),setTimeout(()=>{document.body.removeChild(o)},500)},setTimeout(()=>{document.body.contains(o)&&(o.contentWindow?.focus(),o.contentWindow?.print(),setTimeout(()=>{document.body.contains(o)&&document.body.removeChild(o)},500))},1e3))};if(A)return e.jsx(E,{opened:!0,onClose:w,size:"lg",title:"Reçu",centered:!0,padding:"md",children:e.jsxs(q,{py:"xl",children:[e.jsx(O,{}),e.jsx(i,{ml:"md",children:"Chargement du reçu..."})]})});if(!t)return e.jsx(E,{opened:!0,onClose:w,size:"lg",title:"Reçu",centered:!0,padding:"md",children:e.jsx(i,{ta:"center",c:"red",children:"Erreur lors du chargement du reçu"})});const D=t.montant_total||0,f=t.montant_regle||0,P=D-f;return e.jsxs(E,{opened:!0,onClose:w,size:"lg",title:`Reçu ${t.code_vente||"N°"+n.id}`,centered:!0,radius:"md",padding:"md",styles:{body:{padding:"16px",maxHeight:"80vh",overflowY:"auto"}},children:[e.jsx("div",{ref:R,children:e.jsxs(M,{gap:"sm",children:[e.jsxs(a,{style:{textAlign:"center",marginBottom:15},children:[e.jsx(I,{order:3,c:"#1b365d",size:"h4",children:d?.nom_atelier||"GESTION COUTURE"}),e.jsx(i,{size:"xs",children:d?.adresse||"Ouagadougou, Burkina Faso"}),e.jsxs(i,{size:"xs",children:["Tel: ",d?.telephone||"70 00 00 00"," | IFU: ",d?.ifu||"-"]}),e.jsx(C,{my:"sm"}),e.jsxs(I,{order:4,size:"h5",children:["REÇU N° ",t.code_vente||n.id]}),e.jsxs(i,{size:"xs",children:["Date : ",t.date_vente?new Date(t.date_vente).toLocaleDateString("fr-FR"):new Date().toLocaleDateString("fr-FR")]})]}),e.jsxs(N,{p:"sm",withBorder:!0,mb:"sm",children:[e.jsxs(p,{gap:"xs",children:[e.jsx(J,{size:14}),e.jsx(i,{fw:600,size:"sm",children:"CLIENT"})]}),e.jsx(i,{size:"sm",children:t.client_nom||"Client non renseigné"}),t.client_telephone&&e.jsxs(i,{size:"xs",c:"dimmed",children:["Tél: ",t.client_telephone]})]}),t.rendezvous&&t.rendezvous.date_rendezvous&&e.jsxs(N,{p:"sm",withBorder:!0,mb:"sm",style:{backgroundColor:"#FFF8E7",borderLeft:"4px solid #1b365d"},children:[e.jsxs(p,{gap:"xs",mb:"xs",children:[e.jsx(K,{size:16,color:"#1b365d"}),e.jsx(i,{fw:600,size:"sm",children:"Rendez-vous"})]}),e.jsxs(X,{cols:4,spacing:"xs",mb:"xs",children:[e.jsxs(a,{children:[e.jsx(i,{size:"xs",c:"dimmed",children:"Date"}),e.jsx(i,{size:"sm",fw:500,children:new Date(t.rendezvous.date_rendezvous).toLocaleDateString("fr-FR")})]}),e.jsxs(a,{children:[e.jsx(i,{size:"xs",c:"dimmed",children:"Heure"}),e.jsx(i,{size:"sm",fw:500,children:t.rendezvous.heure_rendezvous||"--:--"})]}),e.jsxs(a,{children:[e.jsx(i,{size:"xs",c:"dimmed",children:"Type"}),e.jsx(k,{color:t.rendezvous.type_rendezvous==="essayage"?"pink":t.rendezvous.type_rendezvous==="livraison"?"cyan":"orange",size:"xs",children:t.rendezvous.type_rendezvous==="essayage"?"👗 Essayage":t.rendezvous.type_rendezvous==="livraison"?"🚚 Livraison":"📦 Retrait"})]}),e.jsxs(a,{children:[e.jsx(i,{size:"xs",c:"dimmed",children:"Statut"}),e.jsx(k,{color:t.rendezvous.statut==="planifie"?"orange":t.rendezvous.statut==="termine"?"green":"red",size:"xs",children:t.rendezvous.statut==="planifie"?"⏳ Planifié":t.rendezvous.statut==="termine"?"✅ Terminé":"❌ Annulé"})]})]}),t.rendezvous.observation&&e.jsxs(i,{size:"xs",c:"dimmed",children:[e.jsx("strong",{children:"Note:"})," ",t.rendezvous.observation]})]}),e.jsxs(r,{striped:!0,highlightOnHover:!0,children:[e.jsx(r.Thead,{style:{backgroundColor:"#1b365d"},children:e.jsxs(r.Tr,{children:[e.jsx(r.Th,{style:{color:"white",fontSize:11},children:"Désignation"}),e.jsx(r.Th,{style:{color:"white",fontSize:11,textAlign:"center",width:60},children:"Qté"}),e.jsx(r.Th,{style:{color:"white",fontSize:11,textAlign:"right",width:110},children:"Prix unit."}),e.jsx(r.Th,{style:{color:"white",fontSize:11,textAlign:"right",width:110},children:"Total"})]})}),e.jsx(r.Tbody,{children:t.lignes&&t.lignes.length>0?t.lignes.map((o,x)=>e.jsxs(r.Tr,{children:[e.jsx(r.Td,{style:{fontSize:11},children:o.designation}),e.jsx(r.Td,{style:{textAlign:"center",fontSize:11},children:o.quantite}),e.jsxs(r.Td,{style:{textAlign:"right",fontSize:11},children:[o.prix_unitaire.toLocaleString()," FCFA"]}),e.jsxs(r.Td,{style:{textAlign:"right",fontSize:11,fontWeight:500},children:[o.total.toLocaleString()," FCFA"]})]},x)):e.jsx(r.Tr,{children:e.jsx(r.Td,{colSpan:4,style:{textAlign:"center",fontSize:11},children:"Aucun détail disponible"})})})]}),e.jsxs(a,{style:{textAlign:"right",marginTop:15},children:[e.jsxs(p,{justify:"flex-end",gap:"md",children:[e.jsx(i,{size:"sm",children:"Total:"}),e.jsxs(i,{fw:700,size:"md",c:"blue",children:[D.toLocaleString()," FCFA"]})]}),f>0&&e.jsxs(p,{justify:"flex-end",gap:"md",children:[e.jsx(i,{size:"xs",c:"green",children:"Montant réglé:"}),e.jsxs(i,{size:"sm",c:"green",children:[f.toLocaleString()," FCFA"]})]}),P>0&&e.jsxs(p,{justify:"flex-end",gap:"md",children:[e.jsx(i,{size:"xs",c:"orange",children:"Reste à payer:"}),e.jsxs(i,{size:"sm",c:"orange",children:[P.toLocaleString()," FCFA"]})]}),e.jsxs(p,{justify:"flex-end",gap:"md",mt:"xs",children:[e.jsx(i,{size:"xs",c:"dimmed",children:"Mode de paiement:"}),e.jsx(i,{size:"sm",children:t.mode_paiement||"Espèces"})]})]}),e.jsx(a,{mt:"sm",p:"xs",style:{backgroundColor:"#f8f9fa",borderRadius:6},children:e.jsxs(p,{justify:"center",gap:"xs",children:[e.jsx(i,{size:"sm",fw:500,children:"Statut:"}),e.jsx(k,{color:t.statut==="PAYEE"?"green":t.statut==="PARTIEL"?"orange":"red",size:"sm",children:t.statut==="PAYEE"?"✅ Payée":t.statut==="PARTIEL"?"⚠️ Paiement partiel":"❌ En attente"})]})}),t.observation&&e.jsxs(a,{mt:"sm",children:[e.jsx(i,{size:"xs",c:"dimmed",children:"Observations:"}),e.jsx(i,{size:"xs",children:t.observation})]}),e.jsxs(a,{mt:30,style:{textAlign:"right"},children:[e.jsx(i,{size:"xs",children:"Signature & cachet"}),e.jsx(C,{style:{width:150,marginLeft:"auto"}})]})]})}),e.jsx(C,{my:"sm"}),e.jsxs(p,{justify:"flex-end",gap:"sm",children:[e.jsx(_,{variant:"light",onClick:w,leftSection:e.jsx(U,{size:16}),size:"sm",children:"Fermer"}),e.jsx(_,{variant:"outline",onClick:F,leftSection:e.jsx(B,{size:16}),size:"sm",children:"Imprimer"})]})]})};export{se as M,re as a};
