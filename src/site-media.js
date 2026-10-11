import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

export const siteMediaFields=[
  ['logo','Conference logo','/assets/branding/glory-conference-logo.webp','image'],
  ['theme','The Outpouring artwork','/assets/branding/the-outpouring.webp','image'],
  ['highlight','Homepage highlight video','/assets/video/glory-conference-2026-optimized.mp4','video'],
  ['host','Prophet Joshua Ohanye portrait','/assets/ministers/joshua-ohanye.webp','image'],
  ['chinyere','Chinyere Udoma portrait','/assets/ministers/chinyere-udoma.webp','image'],
  ['chris','Rev. Chris Okolo portrait','/assets/ministers/chris-okolo.webp','image'],
  ...['mummy-joyce','glorious-o','victor','james','ruth','mrs-loveth-n'].map(x=>['testimony-'+x,'Testimony: '+x.replaceAll('-',' '),'/assets/testimonies/'+x+'.jpg','image']),
  ...Array.from({length:6},(_,i)=>['gallery-'+(i+1),'Gallery image '+(i+1),'/assets/gallery/glory-0'+(i+1)+'.webp','image'])
]
export const siteMediaDefaults=Object.fromEntries(siteMediaFields.map(([key,,url])=>[key,url]))
export function useSiteMedia(){const [overrides,setOverrides]=useState({});useEffect(()=>onSnapshot(doc(db,'siteSettings','media'),snapshot=>setOverrides(snapshot.exists()?snapshot.data():{}),()=>{}),[]);return {...siteMediaDefaults,...overrides}}
