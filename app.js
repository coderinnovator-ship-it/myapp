/* ZETRA — Identity Engine (client-side only) */

const createBtn = document.getElementById("createBtn");
const recoverBtn = document.getElementById("recoverBtn");
const copyBtn = document.getElementById("copyBtn");
const exportBtn = document.getElementById("exportBtn");
const resetBtn = document.getElementById("resetBtn");

const cardWrap = document.getElementById("cardWrap");
const avatar = document.getElementById("avatar");
const zetraIdElem = document.getElementById("zetraId");
const createdAtElem = document.getElementById("createdAt");

function randomSegment(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateZetraID() {
  return (
    "ZET-" +
    randomSegment(4) + "-" +
    randomSegment(4) + "-" +
    randomSegment(3)
  );
}

function saveProfile(obj) {
  localStorage.setItem("zetraProfile", JSON.stringify(obj));
}

function loadProfile() {
  const raw = localStorage.getItem("zetraProfile");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderProfile(profile) {
  cardWrap.style.display = "block";
  zetraIdElem.textContent = profile.id;
  createdAtElem.textContent = "Created: " + profile.created;
  avatar.textContent = profile.id[4]; 
}

createBtn.onclick = () => {
  const profile = {
    id: generateZetraID(),
    created: new Date().toLocaleString()
  };
  saveProfile(profile);
  renderProfile(profile);
};

recoverBtn.onclick = () => {
  const profile = loadProfile();
  if (!profile) {
    alert("No saved identity found on this device.");
    return;
  }
  renderProfile(profile);
};

copyBtn.onclick = () => {
  navigator.clipboard.writeText(zetraIdElem.textContent);
  alert("Zetra ID copied");
};

exportBtn.onclick = () => {
  const profile = loadProfile();
  if (!profile) {
    alert("Nothing to export.");
    return;
  }

  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "zetra-profile.json";
  a.click();

  URL.revokeObjectURL(url);
};

resetBtn.onclick = () => {
  localStorage.removeItem("zetraProfile");
  window.location.reload();
};

const existing = loadProfile();
if (existing) renderProfile(existing);
