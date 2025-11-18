// entries.js - saving & fetching diary entries
import { getSupabase, supabaseReady, notifySupabaseMissing, escapeHtml, isHistoryPage } from './utils.js';

export async function saveEntry(e){
  if(e && e.preventDefault) e.preventDefault();
  const dateInput = document.getElementById('entry-date');
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const iconInput = document.getElementById('entry-icon');
  const date = dateInput.value;
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const icon = (iconInput && iconInput.value) ? iconInput.value : '🌸';
  if(!title || !content) return alert('Vui lòng nhập tiêu đề và nội dung');
  try{
    const s = getSupabase();
    if(!s) throw new Error('Supabase client not initialized');
    const payload = { date, title, content, icon };
    // try to attach user_id if available
    try{ const userRes = await s.auth.getUser(); const user = userRes?.data?.user; if(user && user.id) payload.user_id = user.id; }catch(e){}
    const { data, error } = await s.from('entries').insert([payload]).select();
    if(error) throw error;
    const form = document.getElementById('entry-form');
    if(form) form.reset();
    setTimeout(()=>{ try{ const dateInput = document.getElementById('entry-date'); if(dateInput){ const d = new Date(); dateInput.value = d.toISOString().slice(0,10); } }catch(e){} }, 10);
    if(iconInput) iconInput.value = '🌸';
    const sel = document.querySelectorAll('.icon-btn');
    sel.forEach(b=>b.classList.remove('selected'));
    const defaultBtn = document.querySelector('.icon-btn[data-icon="🌸"]');
    if(defaultBtn) defaultBtn.classList.add('selected');
    refreshEntriesView();
  }catch(err){ console.error(err); alert('Lưu thất bại — xem console để biết thêm chi tiết'); }
}

export async function fetchEntries(){
  const entriesList = document.getElementById('entries-list');
  const entriesCount = document.getElementById('entries-count');
  if(!entriesList) return;
  entriesList.innerHTML = '<div class="text-muted">Đang tải...</div>';
  try{
    const s = getSupabase();
    if(!s) throw new Error('Supabase client not initialized');
    // check user
    const { data: userData } = await s.auth.getUser();
    const currentUser = userData?.user ?? null;
    if(!currentUser || !currentUser.id){ entriesList.innerHTML = '<div class="text-muted">Vui lòng đăng nhập để xem nhật ký của bạn.</div>'; if(entriesCount) entriesCount.textContent = '0'; return; }
    let query = s.from('entries').select('*').order('created_at', { ascending: false }).eq('user_id', currentUser.id);
    const { data, error } = await query;
    if(error) throw error;
    entriesList.innerHTML = '';
    if(entriesCount) entriesCount.textContent = (data && data.length) ? data.length : 0;
    if(!data || data.length === 0){ entriesList.innerHTML = '<div class="text-muted">Bạn chưa có nhật ký nào.</div>'; return; }
    data.forEach(item=>{ const id = item.id || item._id || ''; const card = renderEntryCard(id, item); entriesList.appendChild(card); });
  }catch(err){ console.error(err); entriesList.innerHTML = '<div class="text-danger">Không thể tải nhật ký.</div>'; }
}

export async function fetchTopEntries(limit = 5){
  const entriesList = document.getElementById('entries-list');
  const entriesCount = document.getElementById('entries-count');
  if(!entriesList) return;
  entriesList.innerHTML = '<li class="list-group-item text-muted">Đang tải...</li>';
  try{
    const s = getSupabase();
    if(!s) throw new Error('Supabase client not initialized');
    const { data: userData } = await s.auth.getUser();
    const currentUser = userData?.user ?? null;
    if(!currentUser || !currentUser.id){ entriesList.innerHTML = '<li class="list-group-item text-muted">Vui lòng đăng nhập để xem nhật ký của bạn.</li>'; if(entriesCount) entriesCount.textContent = '0'; return; }
    const topQ = await s.from('entries').select('id,title,date,icon').order('created_at', { ascending: false }).eq('user_id', currentUser.id).limit(limit);
    if(topQ.error) throw topQ.error;
    const countQ = await s.from('entries').select('id', { count: 'exact' }).eq('user_id', currentUser.id);
    if(countQ.error) throw countQ.error;
    const top = topQ.data || [];
    const total = Array.isArray(countQ.data) ? (countQ.count ?? countQ.data.length) : (countQ.count ?? 0);
    entriesList.innerHTML = '';
    if(entriesCount) entriesCount.textContent = total;
    if(!top || top.length === 0){ entriesList.innerHTML = '<li class="list-group-item text-muted">Bạn chưa có nhật ký nào.</li>'; return; }
    top.forEach(item=>{
      const li = document.createElement('li');
      li.className = 'preview-item';
      const left = document.createElement('div'); left.className = 'preview-left';
      const icon = document.createElement('div'); icon.className = 'preview-icon'; icon.textContent = (item.icon) ? item.icon : '🌸';
      const titleWrap = document.createElement('div');
      const a = document.createElement('a'); a.href = `history.html#${item.id}`; a.className = 'preview-title'; a.textContent = item.title || '(Không có tiêu đề)';
      titleWrap.appendChild(a);
      left.appendChild(icon); left.appendChild(titleWrap);
      const right = document.createElement('div'); right.className = 'preview-meta'; right.textContent = item.date || '';
      li.appendChild(left); li.appendChild(right);
      entriesList.appendChild(li);
    });
  }catch(err){ console.error(err); entriesList.innerHTML = '<li class="list-group-item text-danger">Không thể tải nhật ký.</li>'; }
}

export function refreshEntriesView(){ if(isHistoryPage()){ fetchEntries(); }else{ fetchTopEntries(5); } }

export function renderEntryCard(id, data){
  const card = document.createElement('div');
  card.className = 'letter-card entry-card shadow-sm';
  card.id = 'entry-' + id;
  card.innerHTML = `
    <div class="letter-stitch" aria-hidden="true"></div>
    <div class="card-body p-3">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="entry-date">${escapeHtml(data.date || '')}</div>
          <h6 class="mb-1"><span class="entry-icon">${escapeHtml(data.icon || '🌸')}</span> ${escapeHtml(data.title || '')}</h6>
        </div>
        <div class="text-end">
          <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${id}">Xóa</button>
        </div>
      </div>
      <div class="mb-0 mt-2 entry-content"></div>
    </div>
  `;
  try{
    if(!isHistoryPage()){
      const img = document.createElement('img'); img.src = 'flower.png'; img.className = 'floral-corner'; img.alt = ''; img.setAttribute('aria-hidden','true'); const bodyEl = card.querySelector('.card-body'); if(bodyEl) card.insertBefore(img, bodyEl);
    }
  }catch(e){ console.warn('Failed to add floral decoration', e); }
  const delBtn = card.querySelector('.btn-delete'); if(delBtn) delBtn.addEventListener('click', ()=>deleteEntry(id));
  const contentContainer = card.querySelector('.entry-content');
  const raw = (data.content || '');
  const MAX_CHARS = 260;
  const needsTruncate = raw.length > MAX_CHARS;
  const excerptRaw = needsTruncate ? raw.slice(0, MAX_CHARS) : raw;
  const excerptHtml = escapeHtml(excerptRaw).replace(/\n/g,'<br>');
  const fullHtml = escapeHtml(raw).replace(/\n/g,'<br>');
  const previewDiv = document.createElement('div'); previewDiv.className = 'entry-content-preview'; previewDiv.innerHTML = excerptHtml + (needsTruncate ? '...' : '');
  const fullDiv = document.createElement('div'); fullDiv.className = 'entry-content-full'; fullDiv.style.display = 'none'; fullDiv.innerHTML = fullHtml;
  contentContainer.appendChild(previewDiv); contentContainer.appendChild(fullDiv);
  if(needsTruncate){ const btnWrap = document.createElement('div'); btnWrap.className = 'mt-2'; const readBtn = document.createElement('button'); readBtn.className = 'btn btn-sm btn-link btn-readmore'; readBtn.textContent = 'Xem thêm'; readBtn.addEventListener('click', (e)=>{ e.preventDefault(); const expanded = fullDiv.style.display === 'block'; if(expanded){ fullDiv.style.display = 'none'; previewDiv.style.display = 'block'; readBtn.textContent = 'Xem thêm'; }else{ fullDiv.style.display = 'block'; previewDiv.style.display = 'none'; readBtn.textContent = 'Thu gọn'; } }); btnWrap.appendChild(readBtn); contentContainer.appendChild(btnWrap); }
  return card;
}

export async function deleteEntry(id){ if(!confirm('Bạn có chắc muốn xóa nhật ký này?')) return; try{ const s = getSupabase(); if(!s) throw new Error('Supabase client not initialized'); const { error } = await s.from('entries').delete().eq('id', id); if(error) throw error; refreshEntriesView(); }catch(err){ console.error(err); alert('Xóa thất bại'); } }

export function initIconPicker(){ const buttons = document.querySelectorAll('.icon-btn'); buttons.forEach(btn=>{ btn.addEventListener('click', ()=>{ const icon = btn.getAttribute('data-icon'); const iconInput = document.getElementById('entry-icon'); if(iconInput) iconInput.value = icon; buttons.forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); }); }); const defaultBtn = document.querySelector('.icon-btn[data-icon="🌸"]'); if(defaultBtn) defaultBtn.classList.add('selected'); }

export async function expandHashEntryIfAny(){ try{ if(!isHistoryPage()) return; const hash = (window.location.hash || '').replace('#',''); if(!hash) return; setTimeout(()=>{ const el = document.getElementById('entry-' + hash); if(!el) return; const readBtn = el.querySelector('.btn-readmore'); if(readBtn) readBtn.click(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120); }catch(e){ console.warn('expandHashEntryIfAny failed', e); } }
