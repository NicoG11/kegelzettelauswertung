import{aY as X,x as _,M as H,O as M,am as O,A as k,an as j,Q as G,aC as z,S as D,C as Y,d as h,T as C,Y as F,aA as q,a as m,q as E,D as R,at as V,ax as J,ay as Q,ar as U,J as Z,az as K,aZ as N,as as p,au as ee,a_ as te,a6 as w,a$ as ne}from"./index-DO3CObl3.js";const oe=e=>{const{touchstartX:o,touchendX:t,touchstartY:n,touchendY:a}=e,u=.5,s=16;e.offsetX=t-o,e.offsetY=a-n,Math.abs(e.offsetY)<u*Math.abs(e.offsetX)&&(e.left&&t<o-s&&e.left(e),e.right&&t>o+s&&e.right(e)),Math.abs(e.offsetX)<u*Math.abs(e.offsetY)&&(e.up&&a<n-s&&e.up(e),e.down&&a>n+s&&e.down(e))};function se(e,o){var n;const t=e.changedTouches[0];o.touchstartX=t.clientX,o.touchstartY=t.clientY,(n=o.start)==null||n.call(o,{originalEvent:e,...o})}function ae(e,o){var n;const t=e.changedTouches[0];o.touchendX=t.clientX,o.touchendY=t.clientY,(n=o.end)==null||n.call(o,{originalEvent:e,...o}),oe(o)}function ie(e,o){var n;const t=e.changedTouches[0];o.touchmoveX=t.clientX,o.touchmoveY=t.clientY,(n=o.move)==null||n.call(o,{originalEvent:e,...o})}function ue(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};const o={touchstartX:0,touchstartY:0,touchendX:0,touchendY:0,touchmoveX:0,touchmoveY:0,offsetX:0,offsetY:0,left:e.left,right:e.right,up:e.up,down:e.down,start:e.start,move:e.move,end:e.end};return{touchstart:t=>se(t,o),touchend:t=>ae(t,o),touchmove:t=>ie(t,o)}}function le(e,o){var v;const t=o.value,n=t!=null&&t.parent?e.parentElement:e,a=(t==null?void 0:t.options)??{passive:!0},u=(v=o.instance)==null?void 0:v.$.uid;if(!n||!u)return;const s=ue(o.value);n._touchHandlers=n._touchHandlers??Object.create(null),n._touchHandlers[u]=s,X(s).forEach(r=>{n.addEventListener(r,s[r],a)})}function ce(e,o){var u,s;const t=(u=o.value)!=null&&u.parent?e.parentElement:e,n=(s=o.instance)==null?void 0:s.$.uid;if(!(t!=null&&t._touchHandlers)||!n)return;const a=t._touchHandlers[n];X(a).forEach(v=>{t.removeEventListener(v,a[v])}),delete t._touchHandlers[n]}const W={mounted:le,unmounted:ce},$=Symbol.for("vuetify:v-window"),P=Symbol.for("vuetify:v-window-group"),re=_({continuous:Boolean,nextIcon:{type:[Boolean,String,Function,Object],default:"$next"},prevIcon:{type:[Boolean,String,Function,Object],default:"$prev"},reverse:Boolean,showArrows:{type:[Boolean,String],validator:e=>typeof e=="boolean"||e==="hover"},touch:{type:[Object,Boolean],default:void 0},direction:{type:String,default:"horizontal"},modelValue:null,disabled:Boolean,selectedClass:{type:String,default:"v-window-item--active"},mandatory:{type:[Boolean,String],default:"force"},...H(),...M(),...O()},"VWindow"),fe=k()({name:"VWindow",directives:{Touch:W},props:re(),emits:{"update:modelValue":e=>!0},setup(e,o){let{slots:t}=o;const{themeClasses:n}=j(e),{isRtl:a}=G(),{t:u}=z(),s=D(e,P),v=Y(),r=h(()=>a.value?!e.reverse:e.reverse),d=C(!1),y=h(()=>{const i=e.direction==="vertical"?"y":"x",f=(r.value?!d.value:d.value)?"-reverse":"";return`v-window-${i}${f}-transition`}),T=C(0),x=Y(void 0),g=h(()=>s.items.value.findIndex(i=>s.selected.value.includes(i.id)));F(g,(i,c)=>{const f=s.items.value.length,S=f-1;f<=2?d.value=i<c:i===S&&c===0?d.value=!0:i===0&&c===S?d.value=!1:d.value=i<c}),q($,{transition:y,isReversed:d,transitionCount:T,transitionHeight:x,rootRef:v});const l=h(()=>e.continuous||g.value!==0),b=h(()=>e.continuous||g.value!==s.items.value.length-1);function B(){l.value&&s.prev()}function I(){b.value&&s.next()}const L=h(()=>{const i=[],c={icon:a.value?e.nextIcon:e.prevIcon,class:`v-window__${r.value?"right":"left"}`,onClick:s.prev,"aria-label":u("$vuetify.carousel.prev")};i.push(l.value?t.prev?t.prev({props:c}):m(E,c,null):m("div",null,null));const f={icon:a.value?e.prevIcon:e.nextIcon,class:`v-window__${r.value?"left":"right"}`,onClick:s.next,"aria-label":u("$vuetify.carousel.next")};return i.push(b.value?t.next?t.next({props:f}):m(E,f,null):m("div",null,null)),i}),A=h(()=>e.touch===!1?e.touch:{...{left:()=>{r.value?B():I()},right:()=>{r.value?I():B()},start:c=>{let{originalEvent:f}=c;f.stopPropagation()}},...e.touch===!0?{}:e.touch});return R(()=>V(m(e.tag,{ref:v,class:["v-window",{"v-window--show-arrows-on-hover":e.showArrows==="hover"},n.value,e.class],style:e.style},{default:()=>{var i,c;return[m("div",{class:"v-window__container",style:{height:x.value}},[(i=t.default)==null?void 0:i.call(t,{group:s}),e.showArrows!==!1&&m("div",{class:"v-window__controls"},[L.value])]),(c=t.additional)==null?void 0:c.call(t,{group:s})]}}),[[J("touch"),A.value]])),{group:s}}}),ve=_({reverseTransition:{type:[Boolean,String],default:void 0},transition:{type:[Boolean,String],default:void 0},...H(),...Q(),...U()},"VWindowItem"),he=k()({name:"VWindowItem",directives:{Touch:W},props:ve(),emits:{"group:selected":e=>!0},setup(e,o){let{slots:t}=o;const n=Z($),a=K(e,P),{isBooted:u}=N();if(!n||!a)throw new Error("[Vuetify] VWindowItem must be used inside VWindow");const s=C(!1),v=h(()=>u.value&&(n.isReversed.value?e.reverseTransition!==!1:e.transition!==!1));function r(){!s.value||!n||(s.value=!1,n.transitionCount.value>0&&(n.transitionCount.value-=1,n.transitionCount.value===0&&(n.transitionHeight.value=void 0)))}function d(){var l;s.value||!n||(s.value=!0,n.transitionCount.value===0&&(n.transitionHeight.value=w((l=n.rootRef.value)==null?void 0:l.clientHeight)),n.transitionCount.value+=1)}function y(){r()}function T(l){s.value&&ne(()=>{!v.value||!s.value||!n||(n.transitionHeight.value=w(l.clientHeight))})}const x=h(()=>{const l=n.isReversed.value?e.reverseTransition:e.transition;return v.value?{name:typeof l!="string"?n.transition.value:l,onBeforeEnter:d,onAfterEnter:r,onEnterCancelled:y,onBeforeLeave:d,onAfterLeave:r,onLeaveCancelled:y,onEnter:T}:!1}),{hasContent:g}=p(e,a.isSelected);return R(()=>m(te,{transition:x.value,disabled:!u.value},{default:()=>{var l;return[V(m("div",{class:["v-window-item",a.selectedClass.value,e.class],style:e.style},[g.value&&((l=t.default)==null?void 0:l.call(t))]),[[ee,a.isSelected.value]])]}})),{groupItem:a}}});export{fe as V,ve as a,he as b,re as m};