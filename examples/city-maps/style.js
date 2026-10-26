// Adapted from Hangzhou Slow Walk, copyright 2026 HainaHuang729, MIT.
// The map is real OpenMapTiles geometry; the colors are editorial choices.
export function cityStyle(c) {
  const source='openmaptiles';
  const lineFilter=['match',['geometry-type'],['LineString','MultiLineString'],true,false];
  const roads=['all',lineFilter,['match',['get','class'],['motorway','trunk','primary','secondary','tertiary'],true,false]];
  const minor=['all',lineFilter,['match',['get','class'],['minor','service','track'],true,false]];
  return {
    version:8,
    glyphs:'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources:{[source]:{type:'vector',url:'https://tiles.openfreemap.org/planet',attribution:'<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}},
    layers:[
      {id:'land',type:'background',paint:{'background-color':c.land}},
      {id:'wood',type:'fill',source,'source-layer':'landcover',filter:['match',['get','class'],['wood','grass','scrub','farmland'],true,false],paint:{'fill-color':c.wood,'fill-opacity':.85}},
      {id:'park',type:'fill',source,'source-layer':'park',paint:{'fill-color':c.park,'fill-opacity':.8}},
      {id:'water',type:'fill',source,'source-layer':'water',filter:['!=',['get','brunnel'],'tunnel'],paint:{'fill-color':c.water}},
      {id:'waterway',type:'line',source,'source-layer':'waterway',filter:lineFilter,paint:{'line-color':c.water,'line-width':['interpolate',['linear'],['zoom'],11,1,16,5]}},
      {id:'building',type:'fill',source,'source-layer':'building',minzoom:12.5,paint:{'fill-color':c.building,'fill-outline-color':c.buildingEdge,'fill-opacity':['interpolate',['linear'],['zoom'],12.5,.3,14,1]}},
      {id:'minor-roads',type:'line',source,'source-layer':'transportation',minzoom:13,filter:minor,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c.road,'line-opacity':.8,'line-width':['interpolate',['exponential',1.4],['zoom'],13,.7,18,6]}},
      {id:'road-edge',type:'line',source,'source-layer':'transportation',filter:roads,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c.edge,'line-width':['interpolate',['exponential',1.3],['zoom'],10,1,13,3,18,15]}},
      {id:'roads',type:'line',source,'source-layer':'transportation',filter:roads,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c.road,'line-width':['interpolate',['exponential',1.3],['zoom'],10,.5,13,2.1,18,12]}},
      {id:'walking-paths',type:'line',source,'source-layer':'transportation',minzoom:14,filter:['all',lineFilter,['==',['get','class'],'path']],layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':c.path,'line-opacity':.8,'line-width':['interpolate',['linear'],['zoom'],14,.6,18,2.5]}},
      {id:'neighborhoods',type:'symbol',source,'source-layer':'place',minzoom:13.5,filter:['match',['get','class'],['suburb','quarter','neighbourhood'],true,false],layout:{'text-field':['coalesce',['get','name:zh'],['get','name']],'text-font':['Noto Sans Regular'],'text-size':10,'text-padding':30,'text-allow-overlap':false},paint:{'text-color':c.muted,'text-halo-color':c.land,'text-halo-width':1,'text-opacity':.7}}
    ]
  };
}
