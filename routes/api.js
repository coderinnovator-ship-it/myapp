// Zetra Identity Generator (client-only MVP)
// Saves identity locally (localStorage). No backend required.

(function(){
  const createBtn = document.getElementById('createBtn');
  const recoverBtn = document.getElementById('recoverBtn');
  const cardWrap  = document.getElementById('cardWrap');
  const zetraIdEl = document.getElementById('zetraId');
  const avatarEl  = document.getElementById('avatar');
  const createdAt = document.getElementById('createdAt');
  const copyBtn   = document.getElementById('copyBtn');
  const exportBtn = document.getElementById('exportBtn');
  const resetBtn  = document.getElementById('resetBtn');

  function randomChunk(len){
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s='';
    for(let i=0;i<len;i++) s+=chars[Math.floor(Math.random()*chars.length)];
    return s;
  }

  function generateZetra(){
    // structured but simple ID: ZET-<4>-<4>-<3>
    return `ZET-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(3)}`;
  }

  function saveProfile(profile){
    try{
      localStorage.setItem('zetra_profile', JSON.stringify(profile));
    }catch(e){
      console.error('save error', e);
    }
  }

  function loadProfile(){
    try{
      const raw = localStorage.getItem('zetra_profile');
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      return null;
    }
  }

  function renderProfile(profile){
    if(!profile) return hideCard();
    zetraIdEl.textContent = profile.id;
    avatarEl.textContent = profile.id.slice(4,5) || 'Z';
    createdAt.textContent = 'Created: ' + new Date(profile.createdAt).toLocaleString();
    cardWrap.style.display = 'block';
  }

  function hideCard(){
    cardWrap.style.display = 'none';
  }

  function createNew(){
    const id = generateZetra();
    const profile = {
      id,
      createdAt: Date.now(),
      name: '', // placeholder for future fields
      meta: { version: 1 }
    };
    saveProfile(profile);
    renderProfile(profile);
    showNotice('Identity created — saved locally.');
  }

  function showNotice(txt){
    const notice = document.getElementById('notice');
    if(!notice) return;
    notice.textContent = txt;
    setTimeout(()=> {
      notice.textContent = 'No account required. Your identity stays on your device unless you choose to share it.';
    }, 4000);
  }

  createBtn.addEventListener('click', () => {
    // if already have profile, confirm overwrite
    const existing = loadProfile();
    if(existing){
      if(!confirm('You already have a Zetra ID. Create a new one and overwrite?')) return;
    }
    createNew();
  });

  recoverBtn.addEventListener('click', () => {
    const existing = loadProfile();
    if(existing){
      renderProfile(existing);
      showNotice('Profile loaded from this device.');
    } else {
      showNotice('No saved profile found. Create a new one.');
    }
  });

  copyBtn.addEventListener('click', async () => {
    const text = zetraIdEl.textContent || '';
    if(!text) return;
    try{
      await navigator.clipboard.writeText(text);
      showNotice('ID copied to clipboard.');
    }catch(e){
      showNotice('Copy failed — try manual copy.');
    }
  });

  exportBtn.addEventListener('click', () => {
    const profile = loadProfile();
    if(!profile) { showNotice('No profile to export.'); return; }
    const blob = new Blob([JSON.stringify(profile, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.id}.zetra.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotice('Profile exported to file.');
  });

  resetBtn.addEventListener('click', () => {
    if(!confirm('Reset and delete saved Zetra profile from this device?')) return;
    localStorage.removeItem('zetra_profile');
    hideCard();
    showNotice('Profile removed.');
  });

  // initial render if exists
  const existing = loadProfile();
  if(existing) renderProfile(existing);
})();
