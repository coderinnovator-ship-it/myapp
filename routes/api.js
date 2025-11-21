function showApp() {
    document.getElementById("app").style.display = "block";
}

function runScan() {
    let statusBox = document.getElementById("status-box");
    let result = document.getElementById("scan-result");

    statusBox.innerText = "Running system scan…";
    result.innerText = "";

    setTimeout(() => {
        statusBox.innerText = "Identity Verified";
        result.innerText = "Zetra Core scan complete. Your ID is synced to global protocol.";
    }, 2000);
}
