import{x as h,L as I,M as g,ac as w,ad as x,ae as B,A as y,af as $,a2 as S,a3 as a,ag as L,ah as O,D as k,a as i,_ as P,ai as F,aj as N,O as R,ak as j,T as A,C as q,Y as K,a6 as f,al as W,a0 as J,am as M,an as Q,a1 as U,Q as Y,a5 as Z,d as z,o as C,g as T,c as G,w as n,f as m,q as H,ao as X,ab as p,F as b,h as ee,k as _,a8 as ie,ap as te,s as le,t as v,a9 as ne}from"./index-Durgk0nH.js";import{V as ae,a as oe}from"./VRow-hXCoFng2.js";import{V as se}from"./VContainer-ZHK4jqSS.js";const de=h({dotColor:String,fillDot:Boolean,hideDot:Boolean,icon:I,iconColor:String,lineColor:String,...g(),...w(),...x(),...B()},"VTimelineDivider"),re=y()({name:"VTimelineDivider",props:de(),setup(e,c){let{slots:l}=c;const{sizeClasses:d,sizeStyles:t}=$(e,"v-timeline-divider__dot"),{backgroundColorStyles:u,backgroundColorClasses:s}=S(a(e,"dotColor")),{roundedClasses:o}=L(e,"v-timeline-divider__dot"),{elevationClasses:r}=O(e),{backgroundColorClasses:V,backgroundColorStyles:D}=S(a(e,"lineColor"));return k(()=>i("div",{class:["v-timeline-divider",{"v-timeline-divider--fill-dot":e.fillDot},e.class],style:e.style},[i("div",{class:["v-timeline-divider__before",V.value],style:D.value},null),!e.hideDot&&i("div",{key:"dot",class:["v-timeline-divider__dot",r.value,o.value,d.value],style:t.value},[i("div",{class:["v-timeline-divider__inner-dot",s.value,o.value],style:u.value},[l.default?i(F,{key:"icon-defaults",disabled:!e.icon,defaults:{VIcon:{color:e.iconColor,icon:e.icon,size:e.size}}},l.default):i(P,{key:"icon",color:e.iconColor,icon:e.icon,size:e.size},null)])]),i("div",{class:["v-timeline-divider__after",V.value],style:D.value},null)])),{}}}),E=h({density:String,dotColor:String,fillDot:Boolean,hideDot:Boolean,hideOpposite:{type:Boolean,default:void 0},icon:I,iconColor:String,lineInset:[Number,String],...g(),...N(),...B(),...w(),...x(),...R()},"VTimelineItem"),ce=y()({name:"VTimelineItem",props:E(),setup(e,c){let{slots:l}=c;const{dimensionStyles:d}=j(e),t=A(0),u=q();return K(u,s=>{var o;s&&(t.value=((o=s.$el.querySelector(".v-timeline-divider__dot"))==null?void 0:o.getBoundingClientRect().width)??0)},{flush:"post"}),k(()=>{var s,o;return i("div",{class:["v-timeline-item",{"v-timeline-item--fill-dot":e.fillDot},e.class],style:[{"--v-timeline-dot-size":f(t.value),"--v-timeline-line-inset":e.lineInset?`calc(var(--v-timeline-dot-size) / 2 + ${f(e.lineInset)})`:f(0)},e.style]},[i("div",{class:"v-timeline-item__body",style:d.value},[(s=l.default)==null?void 0:s.call(l)]),i(re,{ref:u,hideDot:e.hideDot,icon:e.icon,iconColor:e.iconColor,size:e.size,elevation:e.elevation,dotColor:e.dotColor,fillDot:e.fillDot,rounded:e.rounded},{default:l.icon}),e.density!=="compact"&&i("div",{class:"v-timeline-item__opposite"},[!e.hideOpposite&&((o=l.opposite)==null?void 0:o.call(l))])])}),{}}}),ue=h({align:{type:String,default:"center",validator:e=>["center","start"].includes(e)},direction:{type:String,default:"vertical",validator:e=>["vertical","horizontal"].includes(e)},justify:{type:String,default:"auto",validator:e=>["auto","center"].includes(e)},side:{type:String,validator:e=>e==null||["start","end"].includes(e)},lineThickness:{type:[String,Number],default:2},lineColor:String,truncateLine:{type:String,validator:e=>["start","end","both"].includes(e)},...W(E({lineInset:0}),["dotColor","fillDot","hideOpposite","iconColor","lineInset","size"]),...g(),...J(),...R(),...M()},"VTimeline"),me=y()({name:"VTimeline",props:ue(),setup(e,c){let{slots:l}=c;const{themeClasses:d}=Q(e),{densityClasses:t}=U(e),{rtlClasses:u}=Y();Z({VTimelineDivider:{lineColor:a(e,"lineColor")},VTimelineItem:{density:a(e,"density"),dotColor:a(e,"dotColor"),fillDot:a(e,"fillDot"),hideOpposite:a(e,"hideOpposite"),iconColor:a(e,"iconColor"),lineColor:a(e,"lineColor"),lineInset:a(e,"lineInset"),size:a(e,"size")}});const s=z(()=>{const r=e.side?e.side:e.density!=="default"?"end":null;return r&&`v-timeline--side-${r}`}),o=z(()=>{const r=["v-timeline--truncate-line-start","v-timeline--truncate-line-end"];switch(e.truncateLine){case"both":return r;case"start":return r[0];case"end":return r[1];default:return null}});return k(()=>i(e.tag,{class:["v-timeline",`v-timeline--${e.direction}`,`v-timeline--align-${e.align}`,`v-timeline--justify-${e.justify}`,o.value,{"v-timeline--inset-line":!!e.lineInset},d.value,t.value,s.value,u.value,e.class],style:[{"--v-timeline-line-thickness":f(e.lineThickness)},e.style]},l)),{}}}),ve=_("div",{class:"text-h5 pt-2 text-center font-weight-light"},"Changelog",-1),fe=_("br",null,null,-1),ye={__name:"changelog",setup(e){const c=[{id:1,color:"primary",icon:"mdi-clock-time-four-outline",date:"13.09.2024",title:"Version 1.0.1 - Init()",text:'Erste Version des Kegelzettel Auswerters 2024. Überarbeitet wurde "Wer bekommt was" (Es wird nach Abräumen, Fehlwürfe und Volle unterschieden.)'},{id:2,color:"primary",icon:"mdi-clock-time-four-outline",date:"13.09.2024",title:"Version 1.0.2 - Speichern",text:"Speichern und Laden Button um die Ergebnisse Lokal zu speichern und wieder zu laden. Keine Datenbank, wird alles nur lokal im Browser gespeichert. Werden die Datengelöscht sin dsie auch weg."},{id:3,color:"primary",icon:"mdi-clock-time-four-outline",date:"13.09.2024",title:"Version 1.1.2 - Export/Import",text:"Export und Import der Daten um die Ergebnisse Lokal zu speichern und wieder zu laden. JSON Format zum teilen der Daten. Share Funktion um die Daten per Link zu teilen."}];return(l,d)=>(C(),T(b,null,[(C(),G(X,{to:"#teleport"},[i(H,{size:"small",onClick:d[0]||(d[0]=t=>l.$router.push({path:"/"}))},{default:n(()=>[m("Zurück")]),_:1})])),i(se,{class:"fill-height"},{default:n(()=>[i(p,{class:"fill-height"},{default:n(()=>[i(ae,{class:"mb-4"},{default:n(()=>[i(oe,null,{default:n(()=>[ve]),_:1})]),_:1}),i(me,{side:"end"},{default:n(()=>[(C(),T(b,null,ee(c,t=>i(ce,{key:t.id,"dot-color":t.color,size:"small"},{default:n(()=>[i(ie,null,{default:n(()=>[i(te,{class:le(["text-h6",`bg-${t.color}`])},{default:n(()=>[i(P,null,{default:n(()=>[m(v(t.icon),1)]),_:2},1024),m(" "+v(t.date)+" ",1),fe,m(" "+v(t.title),1)]),_:2},1032,["class"]),i(ne,{class:"bg-white pa-4 text-body-1"},{default:n(()=>[_("p",null,v(t.text),1)]),_:2},1024)]),_:2},1024)]),_:2},1032,["dot-color"])),64))]),_:1})]),_:1})]),_:1})],64))}};export{ye as default};