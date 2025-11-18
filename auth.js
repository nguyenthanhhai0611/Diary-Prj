// auth.js - authentication related logic
import { getSupabase, supabaseReady, notifySupabaseMissing, waitForSupabaseInit } from './utils.js';

let currentUser = null;
let authChangeCallback = null;

export function getCurrentUser(){
  return currentUser;
}

export function toggleAuthPanel(show){
  const authPanel = document.getElementById('auth-panel');
  const authToggle = document.getElementById('auth-toggle');
  if(!authPanel) return;
  if(show){
    authPanel.style.display = 'block';
    authPanel.setAttribute('aria-hidden', 'false');
    try{
      const first = authPanel.querySelector('input, button, [tabindex]:not([tabindex="-1"])');
      if(first) first.focus();
    }catch(e){}
    return;
  }
  try{
    const active = document.activeElement;
    if(active && authPanel.contains(active)){
      if(authToggle){ try{ authToggle.focus(); }catch(e){ active.blur(); } }
      else{ try{ active.blur(); }catch(e){} }
    }
  }catch(e){}
  authPanel.style.display = 'none';
  authPanel.setAttribute('aria-hidden', 'true');
}

export async function handleSignUp(){
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  let email = (authEmail && authEmail.value||'').trim();
  const password = (authPassword && authPassword.value||'').trim();
  if(!email || !password) return alert('Vui lòng nhập email và mật khẩu');
  if(!supabaseReady()) return notifySupabaseMissing();
  email = email.toLowerCase();
  try{
    const res = await getSupabase().auth.signUp({ email, password });
    if(res.error){
      const err = res.error;
      const msg = (err.message || err.error || '').toString().toLowerCase();
      if(msg.includes('already') || msg.includes('duplicate') || msg.includes('exists') || msg.includes('registered') || msg.includes('user already')){
        return alert('Email này đã tồn tại trong hệ thống. Vui lòng đăng nhập hoặc dùng "Quên mật khẩu?" để đặt lại mật khẩu.');
      }
      if(msg.includes('invalid') || msg.includes('invalid email')){
        return alert('Email không hợp lệ. Vui lòng kiểm tra và thử lại.');
      }
      throw err;
    }
    const user = (res.data && res.data.user) || res.user || null;
    const session = (res.data && res.data.session) || res.session || null;
    if(session){
      alert('Đăng ký thành công và đã đăng nhập. Chào mừng!');
      toggleAuthPanel(false);
      return;
    }
    const confirmationIndicators = ['confirmation_sent_at','confirmed_at','email_confirmed_at','confirmation_sent'];
    let hasConfirmationSent = false;
    if(user && typeof user === 'object'){
      for(const k of confirmationIndicators){ if(user[k]){ hasConfirmationSent = true; break; } }
    }
    if(hasConfirmationSent){
      try{
        const createdTs = user && user.created_at ? new Date(user.created_at).getTime() : null;
        const now = Date.now();
        const ageMs = (createdTs) ? (now - createdTs) : null;
        const NEW_THRESHOLD_MS = 15 * 1000;
        if(ageMs !== null && ageMs < NEW_THRESHOLD_MS){
          alert('Đăng ký thành công. Nếu bạn là người mới, email xác nhận đã được gửi — vui lòng kiểm tra hộp thư (kể cả thư rác) để kích hoạt tài khoản.');
        }else{
          alert('Email này có thể đã tồn tại. Nếu bạn đã có tài khoản, vui lòng đăng nhập hoặc dùng "Quên mật khẩu?" để đặt lại mật khẩu. Nếu bạn không nhớ đã đăng ký, hãy kiểm tra hộp thư để xem email xác nhận.');
        }
      }catch(e){
        alert('Đăng ký thành công. Email xác nhận đã được gửi — vui lòng kiểm tra hộp thư (kể cả thư rác) để kích hoạt tài khoản.');
      }
      toggleAuthPanel(false);
      return;
    }
    alert('Yêu cầu đăng ký đã được ghi nhận. Nếu bạn là người mới, hãy kiểm tra email để nhận link xác nhận. Nếu bạn đã có tài khoản trước đó, vui lòng đăng nhập hoặc dùng "Quên mật khẩu?" để đặt lại mật khẩu.');
    toggleAuthPanel(false);
  }catch(err){
    console.error(err);
    alert('Đăng ký thất bại: ' + (err.message || err.error_description || err));
  }
}

export async function handlePasswordReset(){
  const authEmail = document.getElementById('auth-email');
  const email = (authEmail && authEmail.value||'').trim();
  if(!email) return alert('Vui lòng nhập email để đặt lại mật khẩu');
  const s = getSupabase();
  if(!s) return alert('Không thể kết nối tới máy chủ xác thực. Vui lòng liên hệ quản trị hoặc thử lại sau.');
  try{
    if(typeof s.auth.resetPasswordForEmail === 'function'){
      const { data, error } = await s.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset.html' });
      if(error) throw error;
      alert('Nếu email tồn tại, Supabase sẽ gửi hướng dẫn đặt lại mật khẩu tới hộp thư đó. Kiểm tra cả thư rác.');
      toggleAuthPanel(false);
      return;
    }
    if(s.auth.api && typeof s.auth.api.resetPasswordForEmail === 'function'){
      const res = await s.auth.api.resetPasswordForEmail(email);
      if(res.error) throw res.error;
      alert('Nếu email tồn tại, Supabase sẽ gửi hướng dẫn đặt lại mật khẩu tới hộp thư đó. Kiểm tra cả thư rác.');
      toggleAuthPanel(false);
      return;
    }
    if(typeof s.auth.sendPasswordResetEmail === 'function'){
      const res = await s.auth.sendPasswordResetEmail(email);
      if(res.error) throw res.error;
      alert('Nếu email tồn tại, Supabase sẽ gửi hướng dẫn đặt lại mật khẩu tới hộp thư đó. Kiểm tra cả thư rác.');
      toggleAuthPanel(false);
      return;
    }
    alert('Tính năng đặt lại mật khẩu không được hỗ trợ bởi client hiện tại. Vui lòng dùng chức năng "Quên mật khẩu" của project Supabase hoặc liên hệ quản trị.');
  }catch(err){
    console.error('Password reset error:', err);
    const msg = (err && (err.message || err.error_description)) || String(err);
    if(msg && /not found|no user/i.test(msg)){
      alert('Nếu email tồn tại, bạn sẽ nhận được email đặt lại mật khẩu. (Không hiển thị thông tin chi tiết vì lý do bảo mật)');
    }else{
      alert('Yêu cầu đặt lại mật khẩu thất bại: ' + (msg || err));
    }
  }
}

export async function handleSignIn(){
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const email = (authEmail && authEmail.value||'').trim();
  const password = (authPassword && authPassword.value||'').trim();
  if(!email || !password) return alert('Vui lòng nhập email và mật khẩu');
  if(!supabaseReady()) return notifySupabaseMissing();
  try{
    const res = await getSupabase().auth.signInWithPassword({ email, password });
    if(res.error){
      const msg = (res.error.message || '').toLowerCase();
      if(msg.includes('confirm') || msg.includes('confirmed') || msg.includes('email')){
        alert('Tài khoản chưa được xác nhận. Vui lòng kiểm tra email xác nhận trước khi đăng nhập.');
      }else{
        alert('Đăng nhập thất bại: Sai email hoặc mật khẩu ' );
      }
      throw res.error;
    }
    toggleAuthPanel(false);
  }catch(err){ console.error(err); }
}

export async function handleSignOut(){
  try{
    const s = getSupabase();
    if(s && s.auth && typeof s.auth.signOut === 'function'){
      try{ await s.auth.signOut(); }catch(errSign){ console.warn('Supabase signOut error:', errSign); }
    }else{
      console.warn('Supabase client not available at signOut time; proceeding with client-side cleanup');
    }
  }catch(err){ console.warn('Unexpected error during signOut attempt', err); }
  currentUser = null;
  // update UI elements directly
  const authToggle = document.getElementById('auth-toggle');
  const navSignOut = document.getElementById('nav-signout');
  if(authToggle){ authToggle.style.display = 'inline-block'; authToggle.textContent = '🔐 Đăng nhập'; }
  if(navSignOut) navSignOut.style.display = 'none';
  try{ window.location.href = 'index.html'; }catch(e){}
}

export function updateAuthUI(){
  const authToggle = document.getElementById('auth-toggle');
  const authSignOutBtn = document.getElementById('auth-signout');
  const navSignOut = document.getElementById('nav-signout');
  if(authToggle){ authToggle.style.display = currentUser ? 'none' : 'inline-block'; if(!currentUser){ authToggle.textContent = '🔐 Đăng nhập'; authToggle.classList.remove('logged-in'); } }
  if(authSignOutBtn) authSignOutBtn.style.display = 'none';
  if(navSignOut) navSignOut.style.display = currentUser ? 'inline-block' : 'none';
}

export function initAuth(options = {}){
  authChangeCallback = options.onAuthChange || null;
  const s = getSupabase();
  if(!s || !s.auth) return;
  try{
    s.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      currentUser = user;
      updateAuthUI();
      if(typeof authChangeCallback === 'function') try{ authChangeCallback(); }catch(e){}
    });
    (async ()=>{
      try{
        const { data } = await s.auth.getUser();
        currentUser = data?.user ?? null;
        updateAuthUI();
        if(typeof authChangeCallback === 'function') try{ authChangeCallback(); }catch(e){}
      }catch(e){ console.warn('Could not get current user', e); }
    })();
  }catch(e){ console.warn('Failed to register auth listeners', e); }
}

// Expose init wait helper so the app can wait for supabase then init
export { waitForSupabaseInit };
