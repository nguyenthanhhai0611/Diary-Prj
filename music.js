// music.js - background music controls and petal generator
export function createPetals(count=12){
  const area = document.getElementById('petal-area');
  if(!area) return;
  for(let i=0;i<count;i++){
    const p = document.createElement('div');
    p.className = 'petal floating';
    p.textContent = ['🌹','🌸','🌺'][Math.floor(Math.random()*3)];
    const left = Math.random()*100;
    const size = 14 + Math.random()*18;
    const duration = 10 + Math.random()*15;
    const delay = -Math.random()*20;
    p.style.left = left + 'vw';
    p.style.fontSize = size + 'px';
    p.style.animationDuration = duration + 's';
    p.style.animationDelay = delay + 's';
    area.appendChild(p);
  }
}

let musicChannel = null;
try{ musicChannel = new BroadcastChannel('diary_music_channel'); }catch(e){ musicChannel = null; }

function updateMusicButton(playing){
  const musicToggle = document.getElementById('music-toggle');
  if(!musicToggle) return;
  musicToggle.textContent = playing ? '⏸️' : '🎵';
  musicToggle.title = playing ? 'Tạm dừng nhạc' : 'Phát nhạc nhẹ';
}

export async function tryPlayMusic(){
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  if(!bgMusic) return;
  try{ await bgMusic.play(); updateMusicButton(true); localStorage.setItem('diary_music', 'on'); if(musicChannel) musicChannel.postMessage({ action: 'status', playing: true }); }catch(e){ updateMusicButton(false); }
}

export function pauseMusic(){
  const bgMusic = document.getElementById('bg-music');
  if(!bgMusic) return;
  try{ bgMusic.pause(); }catch(e){}
  updateMusicButton(false);
  localStorage.setItem('diary_music', 'off');
  if(musicChannel) musicChannel.postMessage({ action: 'status', playing: false });
}

export function initMusic(){
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  if(!bgMusic || !musicToggle){
    if(musicChannel){ musicChannel.onmessage = (ev)=>{ const m = ev.data || {}; if(m.action === 'status'){ if(m.playing) tryPlayMusic().catch(()=>{}); else pauseMusic(); } }; }
    window.addEventListener('storage', (e)=>{ if(e.key === 'diary_music'){ if(e.newValue === 'on') tryPlayMusic().catch(()=>{}); else pauseMusic(); } });
    return;
  }
  const pref = localStorage.getItem('diary_music');
  if(pref === 'on'){ tryPlayMusic().catch(()=>{}); }else{ updateMusicButton(false); }
  musicToggle.addEventListener('click', async ()=>{ if(bgMusic.paused){ await tryPlayMusic(); if(musicChannel) musicChannel.postMessage({ action: 'play' }); }else{ pauseMusic(); if(musicChannel) musicChannel.postMessage({ action: 'pause' }); } });
  bgMusic.addEventListener('play', ()=>{ updateMusicButton(true); localStorage.setItem('diary_music', 'on'); if(musicChannel) musicChannel.postMessage({ action: 'status', playing: true }); });
  bgMusic.addEventListener('pause', ()=>{ updateMusicButton(false); localStorage.setItem('diary_music', 'off'); if(musicChannel) musicChannel.postMessage({ action: 'status', playing: false }); });
  if(musicChannel){ musicChannel.onmessage = (ev)=>{ const m = ev.data || {}; if(m.action === 'play'){ tryPlayMusic().catch(()=>{}); }else if(m.action === 'pause'){ pauseMusic(); }else if(m.action === 'status'){ if(m.playing) tryPlayMusic().catch(()=>{}); else pauseMusic(); } }; }
  window.addEventListener('storage', (e)=>{ if(e.key === 'diary_music'){ if(e.newValue === 'on') tryPlayMusic().catch(()=>{}); else pauseMusic(); } });
}
