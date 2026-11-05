'use strict'
const {onCall,HttpsError}=require('firebase-functions/v2/https')
const {initializeApp}=require('firebase-admin/app')
const {getAuth}=require('firebase-admin/auth')
const {getFirestore,FieldValue}=require('firebase-admin/firestore')
const {randomBytes}=require('node:crypto')
initializeApp()
const db=getFirestore()
const auth=getAuth()
const allowedRoles=['registration','checkin','followup']
async function requireSuperAdmin(request){
 if(!request.auth?.uid)throw new HttpsError('unauthenticated','Sign in with your administrator account.')
 const record=await db.collection('admins').doc(request.auth.uid).get()
 if(!record.exists||record.data().role!=='admin')throw new HttpsError('permission-denied','Only the main administrator may manage staff accounts.')
}
const asText=value=>typeof value==='string'?value.trim():''
exports.createStaffAccount=onCall({region:'us-central1',maxInstances:3},async request=>{
 await requireSuperAdmin(request)
 const {name,email,role}=request.data||{}
 const staffName=asText(name),address=asText(email).toLowerCase(),staffRole=asText(role)
 if(staffName.length<2||staffName.length>100||!/^\S+@\S+\.\S+$/.test(address)||address.length>254||!allowedRoles.includes(staffRole))
   throw new HttpsError('invalid-argument','Provide a name, valid email and operational staff role.')
 // Never create a super administrator through this callable.
 let account
 try{
   account=await auth.createUser({email:address,displayName:staffName,password:randomBytes(32).toString('base64url')})
 }catch(err){
   if(err?.code==='auth/email-already-exists')throw new HttpsError('already-exists','That login already exists. Use the existing-account UID assignment option.')
   throw new HttpsError('internal','Could not create the staff login.')
 }
 try{
   await db.collection('admins').doc(account.uid).create({
     uid:account.uid,name:staffName,email:address,role:staffRole,
     createdBy:request.auth.uid,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()
   })
 }catch(err){
   await auth.deleteUser(account.uid).catch(()=>{})
   throw new HttpsError('internal','Could not save the staff role. No account was activated.')
 }
 // Admin SDK generates a one-use setup link; it is returned only to the
 // authenticated admin and is never saved to Firestore or console logs.
 try{
   const setupLink=await auth.generatePasswordResetLink(address,{url:'https://gloryconf.org/admin'})
   return {uid:account.uid,email:address,role:staffRole,setupLink}
 }catch(err){
   return {uid:account.uid,email:address,role:staffRole,setupLink:null,
     warning:'Account created, but a setup link could not be generated. Use Firebase Authentication to send a password reset email.'}
 }
})
exports.revokeStaffAccount=onCall({region:'us-central1',maxInstances:3},async request=>{
 await requireSuperAdmin(request)
 const uid=asText(request.data?.uid)
 if(!/^[A-Za-z0-9]{10,128}$/.test(uid)||uid===request.auth.uid)throw new HttpsError('invalid-argument','Invalid staff account.')
 const reference=db.collection('admins').doc(uid)
 const record=await reference.get()
 if(!record.exists||!allowedRoles.includes(record.data().role))throw new HttpsError('failed-precondition','Only operational staff accounts can be revoked.')
 try{
   await auth.updateUser(uid,{disabled:true})
   await reference.delete()
   return {revoked:true}
 }catch(err){
   throw new HttpsError('internal','Could not complete account revocation. Review this user in Firebase Authentication.')
 }
})
