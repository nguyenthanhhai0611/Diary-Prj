// utils.js - small shared helpers
export function getSupabase(){
  return window.supabase ?? null;
}

export function supabaseReady(){
  const s = getSupabase();
  return !!(s && s.auth);
}

export function notifySupabaseMissing(){
  alert('Supabase client not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in index.html (Settings → API in Supabase).');
}

export function setToday(dateInput){
  if(!dateInput) return;
  const d = new Date();
  const iso = d.toISOString().slice(0,10);
  dateInput.value = iso;
}

export function escapeHtml(str){
  if(!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

export function isHistoryPage(){
  try{
    const p = window.location.pathname || '';
    if(p.endsWith('history.html')) return true;
    if(window.location.href.includes('history.html')) return true;
  }catch(e){}
  return false;
}

export function waitForSupabaseInit(timeoutMs = 5000, onReady = ()=>{}){
  if(supabaseReady()) return onReady();
  const start = Date.now();
  const handle = setInterval(()=>{
    if(supabaseReady()){
      clearInterval(handle);
      onReady();
      return;
    }
    if(Date.now() - start > timeoutMs){
      clearInterval(handle);
      console.warn('Supabase client not available after waiting');
    }
  }, 200);
}
