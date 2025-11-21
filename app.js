// -----------------------------
// ZETRA ID – Local Identity System
// -----------------------------

const idOutput = document.getElementById("idOutput");
const createBtn = document.getElementById("createID");
const loadBtn = document.getElementById("loadID");
const copyBtn = document.getElementById("copyID");
const exportBtn = document.getElementById("exportID");
const resetBtn = document.getElementById("resetID");

// Generate a random unique Zetra ID
function generateZetraID() {
  const base = "ZETRA-";
  const random = crypto.getRandomValues(new Uint32Array(3))
    .join("-")
    .toString();
  return base + random;
}

// Display helper
function showID(id) {
  idOutput.textContent = id;
}

// Save locally
function saveID(id) {
  localStorage.setItem("zetra_id", id);
}

// Load locally
function loadIDFromStorage() {
  return localStorage.getItem("zetra_id");
}

// -----------------------------
// BUTTON ACTIONS
// -----------------------------

// CREATE ID
createBtn.addEventListener("click", () => {
  const newID = generateZetraID();
  saveID(newID);
  showID(newID);
  alert("Zetra ID created successfully!");
});

// LOAD ID
loadBtn.addEventListener("click", () => {
  const saved = loadIDFromStorage();
  if (!saved) {
    alert("No ID found on this device.");
    return;
  }
  showID(saved);
  alert("Zetra ID loaded!");
});

// COPY ID
copyBtn.addEventListener("click", async () => {
  const text = idOutput.textContent.trim();
  if (!text) return alert("No ID to copy.");
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  } catch (e) {
    alert("Failed to copy.");
  }
});

// EXPORT PROFILE
exportBtn.addEventListener("click", () => {
  const saved = loadIDFromStorage();
  if (!saved) return alert("No ID to export.");

  const data = {
    zetra_id: saved,
    exported_at: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "zetra-profile.json";
  a.click();
  URL.revokeObjectURL(url);
});

// RESET ID
resetBtn.addEventListener("click", () => {
  localStorage.removeItem("zetra_id");
  idOutput.textContent = "";
  alert("Your Zetra ID has been reset on this device.");
});

// -----------------------------
// AUTO LOAD IF EXISTS
// -----------------------------
const autoLoad = loadIDFromStorage();
if (autoLoad) {
  showID(autoLoad);
}
