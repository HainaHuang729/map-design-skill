import {Map as GLMap,Marker,Popup,LngLatBounds,AttributionControl,ScaleControl,setWorkerUrl} from '../vendor/maplibre-gl.mjs';
import {cities} from './data.js';
import {themes} from './themes.js';
import {cityStyle} from './style.js';
import {selectVisiblePlaces} from '../../map-design/assets/select-visible-places.mjs';

const $=selector=>document.querySelector(selector);
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  moon:'<path d="M20.5 14A8.6 8.6 0 0 1 10 3.5 8.6 8.6 0 1 0 20.5 14Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  layers:'<path d="m3 8 9-5 9 5-9 5Zm0 4 9 5 9-5M3 16l9 5 9-5"/>',
  scenery:'<path d="m2 19 7-13 5 8 3-5 5 10ZM6 12l3 1 2-1"/>',
  streets:'<path d="M3 21V8l5-3v16m0-11 8-3v14m0-10 5-3v13M2 21h20M5 10v1m0 4v1m7-4v1m0 4v1m7-4v1"/>',
  culture:'<path d="m2 8 10-5 10 5ZM4 10v9m5-9v9m6-9v9m5-9v9M2 21h20"/>'
};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
const groups=[{id:'all',label:'全部',icon:'layers'},{id:'scenery',label:'风景',icon:'scenery'},{id:'streets',label:'街区',icon:'streets'},{id:'culture',label:'文化',icon:'culture'}];
const params=new URLSearchParams(location.search);
let city=cities.find(c=>c.id===params.get('city'))||cities[0];
let mode=['light','dark'].includes(params.get('theme'))?params.get('theme'):city.referenceTheme;
let group='all',selected=null,popup=null,map=null;
const markers=new Map();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const duration=()=>reduced()?0:360;
document.querySelectorAll('[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon));
$('#city-select').innerHTML=cities.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');

function syncURL(){
  const url=new URL(location.href);url.search='';url.searchParams.set('city',city.id);url.searchParams.set('theme',mode);
  if(selected)url.searchParams.set('place',selected);
  history.replaceState(null,'',url);
}
function applyTheme(){
  const palette=themes[city.id][mode];
  for(const [key,value] of Object.entries(palette))document.documentElement.style.setProperty('--'+key,value);
  document.body.dataset.theme=mode;
  document.querySelector('meta[name="theme-color"]').content=palette.land;
  $('#theme-toggle').innerHTML=icon(mode==='dark'?'sun':'moon');
  $('#theme-toggle').setAttribute('aria-label',`切换为${mode==='dark'?'浅':'深'}色地图`);
  $('#theme-toggle').title=mode==='dark'?'浅色地图':'深色地图';
  if(map)map.setStyle(cityStyle(palette));
}
function renderCity(){
  document.title=city.name+' · 地图设计参考';
  $('#city-select').value=city.id;$('#city-name').textContent=city.name;$('#city-subtitle').textContent=city.subtitle;
  $('#search').placeholder=`搜索${city.name}地点`;$('#search').setAttribute('aria-label',`搜索${city.name}地点`);
  $('#map').setAttribute('aria-label',city.name+'参考地图');
  $('#about-sources').innerHTML=city.sources.map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.label)} ↗</a>`).join('');
  renderGroups();applyTheme();
}
function renderGroups(){
  $('#categories').innerHTML=groups.filter(g=>g.id==='all'||city.places.some(p=>p.group===g.id)).map(g=>`<button data-group="${g.id}" aria-pressed="${group===g.id}">${icon(g.icon)}<span>${g.label}</span></button>`).join('');
}
function candidates(){return city.places.filter(p=>group==='all'||p.group===group);}
function closeSearch(){ $('#search-panel').hidden=true;$('#search').setAttribute('aria-expanded','false'); }
function clearSearch(){ $('#search').value='';$('#clear-search').hidden=true;closeSearch(); }
function searchMatches(){const q=$('#search').value.trim().toLowerCase();return city.places.filter(p=>[p.name,p.label,p.blurb].join(' ').toLowerCase().includes(q));}
function openSearch(){
  const list=searchMatches();$('#clear-search').hidden=!$('#search').value;
  $('#search-caption').textContent=`${city.name}精选地点 · ${list.length}`;
  $('#search-results').innerHTML=list.length?list.map(p=>`<button class="search-row" data-place="${p.id}">${icon(p.group)}<span><strong>${escape(p.name)}</strong><small>${escape(groups.find(g=>g.id===p.group).label)}</small></span></button>`).join(''):'<p class="search-empty">没有找到这个地点，试试其他名称。</p>';
  $('#search-panel').hidden=false;$('#search').setAttribute('aria-expanded','true');
}
function closePlace(){
  const current=popup;popup=null;selected=null;if(current)current.remove();
  renderMarkers();syncURL();
}
function fitPlaces(list=candidates()){
  if(!list.length)return;
  const bounds=new LngLatBounds();list.forEach(p=>bounds.extend([p.lng,p.lat]));
  const mobile=innerWidth<=640;
  map.fitBounds(bounds,{padding:mobile?{top:125,bottom:170,left:40,right:75}:{top:135,bottom:150,left:130,right:135},maxZoom:14.5,duration:duration()});
}
function selectPlace(id,{move=true}={}){
  const place=city.places.find(p=>p.id===id);if(!place)return;
  closePlace();clearSearch();group='all';selected=id;renderGroups();renderMarkers();
  const article=document.createElement('article');article.className='place-card';
  article.innerHTML=`<h2 class="place-title">${escape(place.name)}</h2><p class="place-group">${escape(city.name)} · ${escape(groups.find(g=>g.id===place.group).label)}</p><p class="place-summary">${escape(place.blurb)}</p><a class="place-source" href="${escape(place.sourceUrl)}" target="_blank" rel="noopener noreferrer">资料与代表位置 · OpenStreetMap ↗</a>`;
  popup=new Popup({closeButton:true,closeOnClick:false,maxWidth:innerWidth<=640?'230px':'250px',anchor:'bottom',offset:25}).setLngLat([place.lng,place.lat]).setDOMContent(article).addTo(map);
  popup.on('close',()=>{if(selected===id){selected=null;popup=null;renderMarkers();syncURL();}});
  popup.getElement().querySelector('.maplibregl-popup-close-button').setAttribute('aria-label','关闭地点介绍');
  if(move){
    const height=popup.getElement().getBoundingClientRect().height;
    const y=Math.min(innerHeight-155,Math.max(innerHeight/2+60,90+height+25));
    map.easeTo({center:[place.lng,place.lat],zoom:Math.max(map.getZoom(),14.7),offset:[0,y-innerHeight/2],duration:duration()});
  }
  syncURL();
}
function renderMarkers(){
  if(!map)return;
  const visible=selectVisiblePlaces(candidates(),coordinates=>map.project(coordinates),{selectedId:selected,minDistance:innerWidth<=640?62:70});
  const ids=new Set(visible.map(p=>p.id));
  for(const [id,entry] of markers){if(!ids.has(id)){entry.marker.remove();markers.delete(id);}}
  visible.forEach(place=>{
    let entry=markers.get(place.id);
    if(!entry){
      const element=document.createElement('button');element.className=`place-marker ${place.group}`;element.setAttribute('aria-label','查看'+place.name);element.dataset.id=place.id;
      element.addEventListener('click',e=>{e.stopPropagation();selectPlace(place.id);});
      const marker=new Marker({element}).setLngLat([place.lng,place.lat]).addTo(map);
      entry={marker,element,place};markers.set(place.id,entry);
    }
    entry.element.classList.toggle('is-selected',selected===place.id);
    entry.element.innerHTML=`<span class="marker-symbol">${icon(place.group)}</span><span class="marker-label">${escape(place.label)}</span>`;
  });
  placeLabels();
}
function placeLabels(){
  if(!map)return;
  const entries=[...markers.values()].sort((a,b)=>a.place.displayRank-b.place.displayRank);
  const symbols=entries.map(e=>e.element.querySelector('.marker-symbol').getBoundingClientRect());
  const occupied=[...document.querySelectorAll('.topbar,.theme-toggle,.about-toggle,.map-controls,.category-dock,.city-caption,.maplibregl-ctrl-attrib,.search-panel:not([hidden]),.maplibregl-popup')].map(el=>el.getBoundingClientRect());
  const overlaps=(a,b)=>a.left<b.right+3&&a.right>b.left-3&&a.top<b.bottom+3&&a.bottom>b.top-3;
  const positions=[{left:'50%',top:'38px',transform:'translateX(-50%)'},{left:'39px',top:'50%',transform:'translateY(-50%)'},{left:'5px',top:'50%',transform:'translate(-100%,-50%)'},{left:'50%',top:'-4px',transform:'translate(-50%,-100%)'}];
  entries.forEach(({element})=>{
    const label=element.querySelector('.marker-label');label.style.visibility='hidden';
    if(element.classList.contains('is-selected'))return;
    for(const position of positions){
      Object.assign(label.style,position);const rect=label.getBoundingClientRect();
      if(rect.left<8||rect.right>innerWidth-8||rect.top<8||rect.bottom>innerHeight-8||symbols.some(r=>overlaps(rect,r))||occupied.some(r=>overlaps(rect,r)))continue;
      label.style.visibility='visible';occupied.push(rect);break;
    }
  });
}

$('#city-select').addEventListener('change',()=>{
  closePlace();clearSearch();city=cities.find(c=>c.id===$('#city-select').value);mode=city.referenceTheme;group='all';renderCity();map.getCanvas().setAttribute('aria-label',city.name+'地图，可拖动或缩放');renderMarkers();fitPlaces();syncURL();
});
$('#theme-toggle').addEventListener('click',()=>{mode=mode==='light'?'dark':'light';applyTheme();syncURL();});
$('#about-toggle').addEventListener('click',()=>{closeSearch();$('#about-dialog').showModal();});
$('#close-about').addEventListener('click',()=>$('#about-dialog').close());
$('#fit-map').addEventListener('click',()=>{closePlace();clearSearch();fitPlaces();});
$('#zoom-in').addEventListener('click',()=>map.zoomIn({duration:duration()}));
$('#zoom-out').addEventListener('click',()=>map.zoomOut({duration:duration()}));
$('#categories').addEventListener('click',e=>{const button=e.target.closest('[data-group]');if(!button)return;closePlace();clearSearch();group=button.dataset.group;renderGroups();renderMarkers();fitPlaces();});
$('#search').addEventListener('input',openSearch);$('#search').addEventListener('focus',openSearch);
$('#clear-search').addEventListener('click',()=>{clearSearch();$('#search').focus();openSearch();});
$('#search-form').addEventListener('submit',e=>{e.preventDefault();const first=searchMatches()[0];if(first)selectPlace(first.id);});
$('#search-results').addEventListener('click',e=>{const button=e.target.closest('[data-place]');if(button)selectPlace(button.dataset.place);});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.topbar,.search-panel'))closeSearch();});
renderCity();
setWorkerUrl(new URL('../vendor/maplibre-gl-worker.mjs',import.meta.url).href);
map=new GLMap({container:'map',style:cityStyle(themes[city.id][mode]),center:city.center,zoom:13,attributionControl:false,renderWorldCopies:false,fadeDuration:0});
map.addControl(new AttributionControl({compact:false}),'bottom-right');
map.addControl(new ScaleControl({maxWidth:75,unit:'metric'}),'bottom-left');
map.getCanvas().setAttribute('aria-label',city.name+'地图，可拖动或缩放');
map.on('moveend',renderMarkers);map.on('resize',renderMarkers);map.on('move',()=>requestAnimationFrame(placeLabels));
map.on('sourcedata',e=>{if(e.sourceId==='openmaptiles'&&e.sourceDataType==='content')$('#map-status').hidden=true;});
map.on('error',()=>{if(!$('#map-status').hidden)$('#map-status').textContent='底图暂未载入，可以先搜索地点';});
map.on('load',()=>{renderMarkers();fitPlaces();const id=params.get('place');if(id)selectPlace(id);syncURL();});
window.__MAP_REFERENCE__={map,getState:()=>({city:city.id,mode,group,selected,visibleIds:[...markers.keys()],places:city.places.length})};
