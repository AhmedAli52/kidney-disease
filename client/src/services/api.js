import axios from 'axios'
const API_BASE = import.meta.env.VITE_API_BASE || ''
const client = axios.create({ baseURL: API_BASE, timeout:30000 })

export async function signup(payload){ const r = await client.post('/api/auth/signup', payload); return r.data }
export async function login(payload){ const r = await client.post('/api/auth/login', payload); return r.data }
export async function forgotPassword(email){ await client.post('/api/auth/forgot', { email }) }

export async function uploadFile(file, patientId){
  const fd = new FormData(); fd.append('file', file); if(patientId) fd.append('patientId', patientId)
  const r = await client.post('/api/upload', fd); return r.data
}
export async function predictFile(fileId){ const r = await client.post('/api/model/predict', { file: fileId }); return r.data }
export async function listPatients(){ const r = await client.get('/api/patients'); return r.data }
export async function getPatientHistory(id){ const r = await client.get(`/api/patients/${id}/history`); return r.data }

export default client
