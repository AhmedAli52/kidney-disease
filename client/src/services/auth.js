import * as api from './api'
const KEY = 'krf_user_v2'

export async function signup({ name, email, password, role }){
  try { const u = await api.signup({ name, email, password, role }); localStorage.setItem(KEY, JSON.stringify(u)); return u }
  catch { const u = { id:'local_'+Date.now(), name, email, role, token:'local' }; localStorage.setItem(KEY, JSON.stringify(u)); return u }
}

export async function login({ email, password }){
  try { const u = await api.login({ email, password }); localStorage.setItem(KEY, JSON.stringify(u)); return u }
  catch { const u = { id:'local_'+Date.now(), name: email.split('@')[0], email, role: email.includes('doc')?'doctor':'patient', token:'local' }; localStorage.setItem(KEY, JSON.stringify(u)); return u }
}

export function logout(){ localStorage.removeItem(KEY) }
export function getCurrentUser(){ try{ return JSON.parse(localStorage.getItem(KEY)) }catch{return null} }
export async function forgotPassword(email){ try{ return await api.forgotPassword(email) }catch{} }
