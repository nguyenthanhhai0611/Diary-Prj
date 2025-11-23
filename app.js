// app.js - main entrypoint (module) that wires sub-modules
import { setToday, supabaseReady, notifySupabaseMissing, waitForSupabaseInit } from './utils.js';
import { initAuth, handleSignIn, handleSignUp, handleSignOut, handlePasswordReset, toggleAuthPanel } from './auth.js';
import { saveEntry, refreshEntriesView, initIconPicker, expandHashEntryIfAny } from './entries.js';
import { createPetals, initMusic } from './music.js';

// Element references
const form = document.getElementById('entry-form');
const dateInput = document.getElementById('entry-date');
const authToggle = document.getElementById('auth-toggle');
const authSignInBtn = document.getElementById('auth-signin');
const authSignUpBtn = document.getElementById('auth-signup');
const authForgot = document.getElementById('auth-forgot');
const authSignOutBtn = document.getElementById('auth-signout');
const navSignOut = document.getElementById('nav-signout');

// Wait for DOMContentLoaded then wire UI
document.addEventListener('DOMContentLoaded', async ()=>{
  // set default date input
  setToday(dateInput);

  if(form) form.addEventListener('submit', saveEntry);

  // initial entries preview/load
  // Do not refresh entries until Supabase client and auth are ready.
  // refreshEntriesView will be called after initAuth notifies auth state.

  // petals + icon picker + music
  try{ createPetals(14); }catch(e){}
  try{ initIconPicker(); }catch(e){}
  try{ initMusic(); }catch(e){}

  // Auth wiring: buttons
  if(authToggle){
    authToggle.addEventListener('click', ()=>{
      if(!supabaseReady()) return notifySupabaseMissing();
      // if panel already open, toggle
      const authPanel = document.getElementById('auth-panel');
      const isOpen = authPanel && authPanel.style.display === 'block';
      toggleAuthPanel(!isOpen);
    });
  }
  if(authSignInBtn) authSignInBtn.addEventListener('click', handleSignIn);
  if(authSignUpBtn) authSignUpBtn.addEventListener('click', handleSignUp);
  if(authForgot) authForgot.addEventListener('click', (e)=>{ e.preventDefault(); handlePasswordReset(); });
  if(authSignOutBtn) authSignOutBtn.addEventListener('click', handleSignOut);
  if(navSignOut) navSignOut.addEventListener('click', handleSignOut);

  // small open animation for letter card
  const letterCard = document.querySelector('.letter-card');
  if(letterCard){
    setTimeout(()=>{ letterCard.classList.add('open'); }, 120);
    letterCard.addEventListener('animationend', ()=>{ letterCard.classList.remove('open'); });
  }

  // if on history page, expand any hash entry
  expandHashEntryIfAny();

  // Initialize auth when supabase client available and wire auth change -> refresh entries
  waitForSupabaseInit(5000, ()=>{
    try{
      initAuth({ onAuthChange: () => { try{ refreshEntriesView(); }catch(e){} } });
      // initial refresh once supabase client is ready
      try{ refreshEntriesView(); }catch(e){}
    }catch(e){ console.warn('initAuth failed', e); }
  });
});


