import{u as ue,d as x,o as S,c as G,w as m,a as i,e as xe,f as T,g as D,F as Q,h as _e,i as w,j as Se,k as C,t as k,l as Ve,m as we,n as ke,p as Ee,q as X,s as $e,v as Re,x as N,y as Te,z as Be,A as U,B as Fe,C as Y,D as q,E as O,G as Me,H as Oe,I as Ae,J as He,K as Ce,L as ve,M as De,N as Ge,O as ze,P as Le,Q as Ne,R as Ue,S as qe,T as H,U as me,W as je,X as he,Y as Ke,Z as be,_ as ge,$ as Xe,a0 as Ye,a1 as Ze,a2 as Qe,a3 as $,a4 as Je,a5 as et,a6 as tt,a7 as lt,a8 as at,a9 as st,aa as ot,ab as nt}from"./index-DebxG68Q.js";import{m as rt,V as re,a as it,b as Z}from"./VWindowItem-BsSVEswS.js";import{V as ut}from"./VContainer-BZsnztYR.js";const ct={class:"text-right mr-12 text-subtitle-2"},dt={class:"text-subtitle-2 text-right",style:{"min-width":"50px"}},ft={__name:"Dinge",setup(e){const l=ue(),s=x(()=>l.dinge.map(t=>{var c,r,a,f,d,h;return{tier:(c=l[t]())==null?void 0:c.tier,sum:((r=l[t]())==null?void 0:r.sum)||((a=l[t]())==null?void 0:a.number),title:(f=l[t]())==null?void 0:f.title,playerName:((d=l[t]())==null?void 0:d.number)>0?(h=l[t]().player)==null?void 0:h.name:"-"}}));return(t,c)=>(S(),G(ke,{lines:"two",rounded:"",variant:"elevated",class:"pb-0 my-4 bg-green align-start"},{default:m(()=>[i(xe,{color:"white",class:"text-h6"},{default:m(()=>[T("Wer muss was mitnehmen ")]),_:1}),(S(!0),D(Q,null,_e(w(s),(r,a)=>(S(),G(Se,{key:`${r}${a}`,elevation:2,class:"py-3"},{append:m(()=>[C("div",dt,k(r==null?void 0:r.playerName),1)]),default:m(()=>[i(Ve,{class:"d-flex justify-space-between"},{default:m(()=>[C("div",null,k(r==null?void 0:r.tier),1),C("div",ct,k(r==null?void 0:r.sum),1)]),_:2},1024),i(we,null,{default:m(()=>[T(k(r==null?void 0:r.title),1)]),_:2},1024)]),_:2},1024))),128))]),_:1}))}},vt={key:0,class:"text-caption text-green-darken-4"},mt=C("br",null,null,-1),ht={class:"text-caption"},bt=C("br",null,null,-1),gt={key:1},pt={key:2,class:"text-subtitle-2 pr-2"},yt={class:"d-flex flex-column ga-2"},xt={__name:"Playerlist",setup(e){const l=ue(),s=Ee();function t(c,r){l.setSelectedPlayer(c),s.push({path:r})}return(c,r)=>(S(),G(ke,{lines:"three",rounded:"",variant:"elevated",class:"pb-0 my-4 bg-green"},{default:m(()=>[i(xe,{color:"white",class:"text-h6"},{default:m(()=>[T("Spielerliste")]),_:1}),(S(!0),D(Q,null,_e(w(l).spielerListe,(a,f)=>(S(),G(Se,{elevation:2,key:f,class:"py-3"},{append:m(()=>[C("div",yt,[i(X,{flat:"",size:"small",color:"primary",onClick:d=>t(a,"eingabe")},{default:m(()=>[T("Eingabe")]),_:2},1032,["onClick"])])]),default:m(()=>[i(Ve,null,{default:m(()=>[T(k(a.name),1)]),_:2},1024),i(we,null,{default:m(()=>[C("span",{class:$e(["text-caption",{"text-decoration-line-through":w(l).is600(a)}])},"Zu zahlen: "+k(w(l).getToPay(a,!0)),3),w(l).is600(a)?(S(),D("span",vt," >= 600")):Re("",!0),mt,C("span",ht,"+ anderen "+k(w(l).getFineFromOtherPlayers(a,!0)),1),bt,T(" = "),w(l).is600(a)?(S(),D("span",gt,k(w(l).getFineFromOtherPlayers(a,!0,!0)),1)):(S(),D("span",pt,k(w(l).getGesamtToPay(a)),1))]),_:2},1024)]),_:2},1024))),128))]),_:1}))}},ce=Symbol.for("vuetify:v-tabs"),_t=N({fixed:Boolean,sliderColor:String,hideSlider:Boolean,direction:{type:String,default:"horizontal"},...Te(Be({selectedClass:"v-tab--selected",variant:"text"}),["active","block","flat","location","position","symbol"])},"VTab"),ie=U()({name:"VTab",props:_t(),setup(e,l){let{slots:s,attrs:t}=l;const{textColorClasses:c,textColorStyles:r}=Fe(e,"sliderColor"),a=Y(),f=Y(),d=x(()=>e.direction==="horizontal"),h=x(()=>{var v,u;return((u=(v=a.value)==null?void 0:v.group)==null?void 0:u.isSelected.value)??!1});function R(v){var p,b;let{value:u}=v;if(u){const y=(b=(p=a.value)==null?void 0:p.$el.parentElement)==null?void 0:b.querySelector(".v-tab--selected .v-tab__slider"),B=f.value;if(!y||!B)return;const j=getComputedStyle(y).color,z=y.getBoundingClientRect(),P=B.getBoundingClientRect(),V=d.value?"x":"y",W=d.value?"X":"Y",A=d.value?"right":"bottom",I=d.value?"width":"height",J=z[V],ee=P[V],_=J>ee?z[A]-P[A]:z[V]-P[V],te=Math.sign(_)>0?d.value?"right":"bottom":Math.sign(_)<0?d.value?"left":"top":"center",ae=(Math.abs(_)+(Math.sign(_)<0?z[I]:P[I]))/Math.max(z[I],P[I])||0,E=z[I]/P[I]||0,F=1.5;Oe(B,{backgroundColor:[j,"currentcolor"],transform:[`translate${W}(${_}px) scale${W}(${E})`,`translate${W}(${_/F}px) scale${W}(${(ae-1)/F+1})`,"none"],transformOrigin:Array(3).fill(te)},{duration:225,easing:Ae})}}return q(()=>{const v=X.filterProps(e);return i(X,O({symbol:ce,ref:a,class:["v-tab",e.class],style:e.style,tabindex:h.value?0:-1,role:"tab","aria-selected":String(h.value),active:!1},v,t,{block:e.fixed,maxWidth:e.fixed?300:void 0,"onGroup:selected":R}),{...s,default:()=>{var u;return i(Q,null,[((u=s.default)==null?void 0:u.call(s))??e.text,!e.hideSlider&&i("div",{ref:f,class:["v-tab__slider",c.value],style:r.value},null)])}})}),Me({},a)}}),St=N({...Te(rt(),["continuous","nextIcon","prevIcon","showArrows","touch","mandatory"])},"VTabsWindow"),Vt=U()({name:"VTabsWindow",props:St(),emits:{"update:modelValue":e=>!0},setup(e,l){let{slots:s}=l;const t=He(ce,null),c=Ce(e,"modelValue"),r=x({get(){var a;return c.value!=null||!t?c.value:(a=t.items.value.find(f=>t.selected.value.includes(f.id)))==null?void 0:a.value},set(a){c.value=a}});return q(()=>{const a=re.filterProps(e);return i(re,O({_as:"VTabsWindow"},a,{modelValue:r.value,"onUpdate:modelValue":f=>r.value=f,class:["v-tabs-window",e.class],style:e.style,mandatory:!1,touch:!1}),s)}),{}}}),wt=N({...it()},"VTabsWindowItem"),kt=U()({name:"VTabsWindowItem",props:wt(),setup(e,l){let{slots:s}=l;return q(()=>{const t=Z.filterProps(e);return i(Z,O({_as:"VTabsWindowItem"},t,{class:["v-tabs-window-item",e.class],style:e.style}),s)}),{}}});function Tt(e){let{selectedElement:l,containerElement:s,isRtl:t,isHorizontal:c}=e;const r=L(c,s),a=Pe(c,t,s),f=L(c,l),d=Ie(c,l),h=f*.4;return a>d?d-h:a+r<d+f?d-r+f+h:a}function Ct(e){let{selectedElement:l,containerElement:s,isHorizontal:t}=e;const c=L(t,s),r=Ie(t,l),a=L(t,l);return r-c/2+a/2}function pe(e,l){const s=e?"scrollWidth":"scrollHeight";return(l==null?void 0:l[s])||0}function zt(e,l){const s=e?"clientWidth":"clientHeight";return(l==null?void 0:l[s])||0}function Pe(e,l,s){if(!s)return 0;const{scrollLeft:t,offsetWidth:c,scrollWidth:r}=s;return e?l?r-c+t:t:s.scrollTop}function L(e,l){const s=e?"offsetWidth":"offsetHeight";return(l==null?void 0:l[s])||0}function Ie(e,l){const s=e?"offsetLeft":"offsetTop";return(l==null?void 0:l[s])||0}const Pt=Symbol.for("vuetify:v-slide-group"),We=N({centerActive:Boolean,direction:{type:String,default:"horizontal"},symbol:{type:null,default:Pt},nextIcon:{type:ve,default:"$next"},prevIcon:{type:ve,default:"$prev"},showArrows:{type:[Boolean,String],validator:e=>typeof e=="boolean"||["always","desktop","mobile"].includes(e)},...De(),...Ge({mobile:null}),...ze(),...Le({selectedClass:"v-slide-group-item--active"})},"VSlideGroup"),ye=U()({name:"VSlideGroup",props:We(),emits:{"update:modelValue":e=>!0},setup(e,l){let{slots:s}=l;const{isRtl:t}=Ne(),{displayClasses:c,mobile:r}=Ue(e),a=qe(e,e.symbol),f=H(!1),d=H(0),h=H(0),R=H(0),v=x(()=>e.direction==="horizontal"),{resizeRef:u,contentRect:p}=me(),{resizeRef:b,contentRect:y}=me(),B=je(),j=x(()=>({container:u.el,duration:200,easing:"easeOutQuart"})),z=x(()=>a.selected.value.length?a.items.value.findIndex(o=>o.id===a.selected.value[0]):-1),P=x(()=>a.selected.value.length?a.items.value.findIndex(o=>o.id===a.selected.value[a.selected.value.length-1]):-1);if(he){let o=-1;Ke(()=>[a.selected.value,p.value,y.value,v.value],()=>{cancelAnimationFrame(o),o=requestAnimationFrame(()=>{if(p.value&&y.value){const n=v.value?"width":"height";h.value=p.value[n],R.value=y.value[n],f.value=h.value+1<R.value}if(z.value>=0&&b.el){const n=b.el.children[P.value];W(n,e.centerActive)}})})}const V=H(!1);function W(o,n){let g=0;n?g=Ct({containerElement:u.el,isHorizontal:v.value,selectedElement:o}):g=Tt({containerElement:u.el,isHorizontal:v.value,isRtl:t.value,selectedElement:o}),A(g)}function A(o){if(!he||!u.el)return;const n=L(v.value,u.el),g=Pe(v.value,t.value,u.el);if(!(pe(v.value,u.el)<=n||Math.abs(o-g)<16)){if(v.value&&t.value&&u.el){const{scrollWidth:K,offsetWidth:ne}=u.el;o=K-ne-o}v.value?B.horizontal(o,j.value):B(o,j.value)}}function I(o){const{scrollTop:n,scrollLeft:g}=o.target;d.value=v.value?g:n}function J(o){if(V.value=!0,!(!f.value||!b.el)){for(const n of o.composedPath())for(const g of b.el.children)if(g===n){W(g);return}}}function ee(o){V.value=!1}let _=!1;function te(o){var n;!_&&!V.value&&!(o.relatedTarget&&((n=b.el)!=null&&n.contains(o.relatedTarget)))&&E(),_=!1}function le(){_=!0}function ae(o){if(!b.el)return;function n(g){o.preventDefault(),E(g)}v.value?o.key==="ArrowRight"?n(t.value?"prev":"next"):o.key==="ArrowLeft"&&n(t.value?"next":"prev"):o.key==="ArrowDown"?n("next"):o.key==="ArrowUp"&&n("prev"),o.key==="Home"?n("first"):o.key==="End"&&n("last")}function E(o){var g,M;if(!b.el)return;let n;if(!o)n=Xe(b.el)[0];else if(o==="next"){if(n=(g=b.el.querySelector(":focus"))==null?void 0:g.nextElementSibling,!n)return E("first")}else if(o==="prev"){if(n=(M=b.el.querySelector(":focus"))==null?void 0:M.previousElementSibling,!n)return E("last")}else o==="first"?n=b.el.firstElementChild:o==="last"&&(n=b.el.lastElementChild);n&&n.focus({preventScroll:!0})}function F(o){const n=v.value&&t.value?-1:1,g=(o==="prev"?-n:n)*h.value;let M=d.value+g;if(v.value&&t.value&&u.el){const{scrollWidth:K,offsetWidth:ne}=u.el;M+=K-ne}A(M)}const se=x(()=>({next:a.next,prev:a.prev,select:a.select,isSelected:a.isSelected})),oe=x(()=>{switch(e.showArrows){case"always":return!0;case"desktop":return!r.value;case!0:return f.value||Math.abs(d.value)>0;case"mobile":return r.value||f.value||Math.abs(d.value)>0;default:return!r.value&&(f.value||Math.abs(d.value)>0)}}),de=x(()=>Math.abs(d.value)>1),fe=x(()=>{if(!u.value)return!1;const o=pe(v.value,u.el),n=zt(v.value,u.el);return o-n-Math.abs(d.value)>1});return q(()=>i(e.tag,{class:["v-slide-group",{"v-slide-group--vertical":!v.value,"v-slide-group--has-affixes":oe.value,"v-slide-group--is-overflowing":f.value},c.value,e.class],style:e.style,tabindex:V.value||a.selected.value.length?-1:0,onFocus:te},{default:()=>{var o,n,g;return[oe.value&&i("div",{key:"prev",class:["v-slide-group__prev",{"v-slide-group__prev--disabled":!de.value}],onMousedown:le,onClick:()=>de.value&&F("prev")},[((o=s.prev)==null?void 0:o.call(s,se.value))??i(be,null,{default:()=>[i(ge,{icon:t.value?e.nextIcon:e.prevIcon},null)]})]),i("div",{key:"container",ref:u,class:"v-slide-group__container",onScroll:I},[i("div",{ref:b,class:"v-slide-group__content",onFocusin:J,onFocusout:ee,onKeydown:ae},[(n=s.default)==null?void 0:n.call(s,se.value)])]),oe.value&&i("div",{key:"next",class:["v-slide-group__next",{"v-slide-group__next--disabled":!fe.value}],onMousedown:le,onClick:()=>fe.value&&F("next")},[((g=s.next)==null?void 0:g.call(s,se.value))??i(be,null,{default:()=>[i(ge,{icon:t.value?e.prevIcon:e.nextIcon},null)]})])]}})),{selected:a.selected,scrollTo:F,scrollOffset:d,focus:E}}});function It(e){return e?e.map(l=>lt(l)?l:{text:l,value:l}):[]}const Wt=N({alignTabs:{type:String,default:"start"},color:String,fixedTabs:Boolean,items:{type:Array,default:()=>[]},stacked:Boolean,bgColor:String,grow:Boolean,height:{type:[Number,String],default:void 0},hideSlider:Boolean,sliderColor:String,...We({mandatory:"force",selectedClass:"v-tab-item--selected"}),...Ye(),...ze()},"VTabs"),Et=U()({name:"VTabs",props:Wt(),emits:{"update:modelValue":e=>!0},setup(e,l){let{attrs:s,slots:t}=l;const c=Ce(e,"modelValue"),r=x(()=>It(e.items)),{densityClasses:a}=Ze(e),{backgroundColorClasses:f,backgroundColorStyles:d}=Qe($(e,"bgColor")),{scopeId:h}=Je();return et({VTab:{color:$(e,"color"),direction:$(e,"direction"),stacked:$(e,"stacked"),fixed:$(e,"fixedTabs"),sliderColor:$(e,"sliderColor"),hideSlider:$(e,"hideSlider")}}),q(()=>{const R=ye.filterProps(e),v=!!(t.window||e.items.length>0);return i(Q,null,[i(ye,O(R,{modelValue:c.value,"onUpdate:modelValue":u=>c.value=u,class:["v-tabs",`v-tabs--${e.direction}`,`v-tabs--align-tabs-${e.alignTabs}`,{"v-tabs--fixed-tabs":e.fixedTabs,"v-tabs--grow":e.grow,"v-tabs--stacked":e.stacked},a.value,f.value,e.class],style:[{"--v-tabs-height":tt(e.height)},d.value,e.style],role:"tablist",symbol:ce},h,s),{default:()=>{var u;return[((u=t.default)==null?void 0:u.call(t))??r.value.map(p=>{var b;return((b=t.tab)==null?void 0:b.call(t,{item:p}))??i(ie,O(p,{key:p.text,value:p.value}),{default:t[`tab.${p.value}`]?()=>{var y;return(y=t[`tab.${p.value}`])==null?void 0:y.call(t,{item:p})}:void 0})})]}}),v&&i(Vt,O({modelValue:c.value,"onUpdate:modelValue":u=>c.value=u,key:"tabs-window"},h),{default:()=>{var u;return[r.value.map(p=>{var b;return((b=t.item)==null?void 0:b.call(t,{item:p}))??i(kt,{value:p.value},{default:()=>{var y;return(y=t[`item.${p.value}`])==null?void 0:y.call(t,{item:p})}})}),(u=t.window)==null?void 0:u.call(t)]}})])}),{}}}),$t=C("div",{class:"bg-green h4 py-2 px-5"},"Spieler hinzufügen",-1),Mt={__name:"index",setup(e){const l=ue(),s=Y(""),t=Y("strafe");function c(){s.value&&(l.spielerHinzufuegen(s.value),s.value="")}return(r,a)=>{const f=xt,d=ft;return S(),G(ut,{class:"fill-height"},{default:m(()=>[i(nt,{class:"fill-height"},{default:m(()=>[i(Et,{modelValue:t.value,"onUpdate:modelValue":a[0]||(a[0]=h=>t.value=h),"bg-color":"white","selected-class":"text-green-darken-2 font-weight-black",grow:""},{default:m(()=>[i(ie,{vlaue:"strafe",class:"text-green"},{default:m(()=>[T("Strafen")]),_:1}),i(ie,{value:"dinge",class:"text-green"},{default:m(()=>[T("wer bekommt was")]),_:1})]),_:1},8,["modelValue"]),i(re,{modelValue:t.value,"onUpdate:modelValue":a[2]||(a[2]=h=>t.value=h)},{default:m(()=>[i(Z,{value:"strafe"},{default:m(()=>[i(f),i(at,{flat:""},{default:m(()=>[$t,i(st,null,{default:m(()=>[i(ot,{label:"Spielername",modelValue:s.value,"onUpdate:modelValue":a[1]||(a[1]=h=>s.value=h),rules:[h=>!!h||"Name ist erforderlich"]},null,8,["modelValue","rules"]),i(X,{onClick:c},{default:m(()=>[T("Hinzufügen")]),_:1})]),_:1})]),_:1})]),_:1}),i(Z,{value:"dinge"},{default:m(()=>[i(d)]),_:1})]),_:1},8,["modelValue"])]),_:1})]),_:1})}}};export{Mt as default};