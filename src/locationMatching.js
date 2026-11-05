// Guard against Pelias resolving "See New Hotel Nsukka" to an unrelated
// hotel in Enugu. Geocoding results are suggestions, never silent selections.
const normalize=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()
const words=s=>normalize(s).split(/\s+/).filter(Boolean)
const site={lat:6.8366763,lon:7.3675346}
const common=new Set(['nigeria','nigerian','state','the','near','at','in'])
function kmBetween([lon1,lat1],[lon2,lat2]){
  const rad=Math.PI/180,deltaLat=(lat2-lat1)*rad,deltaLon=(lon2-lon1)*rad
  const a=Math.sin(deltaLat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(deltaLon/2)**2
  return 12742*Math.asin(Math.min(1,Math.sqrt(a)))
}
const explicitCities=['nsukka','enugu','lagos','abuja','onitsha','awka','aba','owerri','ibadan','benin','warri','asaba','calabar','uyo','kaduna','kano','jos','makurdi']
function requestedCities(query){
  const input=' '+normalize(query)+' '
  return explicitCities.filter(city=>input.includes(' '+city+' '))
}
function isInRequestedCity(feature,query){
  const cities=requestedCities(query)
  if(!cities.length)return true
  const label=normalize(labelFor(feature))
  const loc=normalize([feature.properties?.locality,feature.properties?.localadmin,feature.properties?.county,feature.properties?.region].filter(Boolean).join(' '))
  // Nsukka can also be checked by close geographical proximity even when
  // the geocoder omits the small-town name from the place label.
  return cities.every(city=>label.split(' ').includes(city)||loc.split(' ').includes(city)||
    (city==='nsukka'&&kmBetween(feature.geometry.coordinates,[site.lon,site.lat])<=25))
}
function hasNsukka(query){return requestedCities(query).includes('nsukka')}
function validCoords(feature){
  const c=feature?.geometry?.coordinates
  return Array.isArray(c)&&c.length===2&&Number.isFinite(c[0])&&Number.isFinite(c[1])
}
function labelFor(feature){return feature.properties?.label||feature.properties?.name||'Unnamed location'}
function rankedScore(feature,query){
  const q=words(query).filter(x=>!common.has(x)&&!requestedCities(query).includes(x))
  const name=words(feature.properties?.name||labelFor(feature))
  const full=words(labelFor(feature))
  if(!q.length){
    const target=words(query).filter(x=>!common.has(x))
    return target.length&&target.every(x=>full.includes(x))?1:0
  }
  const matches=q.filter(x=>name.includes(x)).length
  return matches/q.length
}
export function candidateLocations(features,query){
  const nsukka=hasNsukka(query)
  return (features||[]).filter(validCoords).map(feature=>{
    const distance=kmBetween(feature.geometry.coordinates,[site.lon,site.lat])
    return {feature,label:labelFor(feature),score:rankedScore(feature,query),distance}
  }).filter(item=>{
    if(nsukka&&item.distance>25)return false
    if(!isInRequestedCity(item.feature,query))return false
    // Never accept a result that matches only a generic type ("hotel")
    // or just the state/country portion of a name.
    const q=words(query).filter(x=>!common.has(x)&&!requestedCities(query).includes(x))
    const need=q.length>=3?.67:1
    return item.score>=need
  }).sort((a,b)=>b.score-a.score||a.distance-b.distance).slice(0,5)
}
