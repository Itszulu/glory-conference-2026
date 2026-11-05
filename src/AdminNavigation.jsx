import './admin-navigation.css'

const groups=[
 {name:'EVENT OPERATIONS',items:[['overview','Overview'],['registration-desk','Registration desk'],['attendance','Attendance desk'],['registrations','Attendee records'],['duplicates','Duplicate review']]},
 {name:'MINISTRY & TEAM',items:[['follow-up','Glory Connect'],['staff','Staff access']]},
 {name:'COMMERCE & CONTENT',items:[['orders','Merch orders'],['products','Merchandise'],['site-media','Website media'],['prayer-designs','Prayer designs']]}
]
const allowedByRole={
 admin:['overview','registration-desk','attendance','registrations','duplicates','follow-up','staff','orders','products','site-media','prayer-designs'],
 registration:['registration-desk'],
 checkin:['attendance'],
 followup:['follow-up']
}
export default function AdminNavigation({role,active,onNavigate,registrations=0,orders=0}){
 const allowed=allowedByRole[role]||[]
 const labels={registrations:String(registrations),orders:String(orders)}
 return <nav className="gc-admin-navigation" aria-label="Conference administration sections">
   <div className="gc-admin-navigation-top"><span>YOUR WORKSPACE</span><small>{role==='admin'?'ADMINISTRATOR ACCESS':role==='followup'?'FOLLOW-UP ACCESS':role==='registration'?'REGISTRATION ACCESS':'CHECK-IN ACCESS'}</small></div>
   <div className="gc-admin-navigation-groups">{groups.map(group=>{
     const items=group.items.filter(([id])=>allowed.includes(id))
     return items.length?<section key={group.name} className="gc-admin-navigation-group"><h3>{group.name}</h3><div className="gc-admin-navigation-buttons">{items.map(([id,label])=><button type="button" key={id} className={active===id?'active':''} aria-current={active===id?'page':undefined} onClick={()=>onNavigate(id)}><span>{label}</span>{id in labels&&<small>{labels[id]}</small>}</button>)}</div></section>:null
   })}</div>
 </nav>
}
