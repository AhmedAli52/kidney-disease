export function saveDemoRecord(patientId, record){
  const key = 'demo_history_' + (patientId || 'anon')
  const arr = JSON.parse(localStorage.getItem(key) || '[]')
  arr.unshift(record); localStorage.setItem(key, JSON.stringify(arr.slice(0,50)))
}
export function loadDemoHistory(patientId){
  const key = 'demo_history_' + (patientId || 'anon'); return JSON.parse(localStorage.getItem(key) || '[]')
}
