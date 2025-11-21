function generateID() {
    const name = document.getElementById("username").value.trim();

    if (!name) {
        alert("Please enter your name first.");
        return;
    }

    const unique = Math.random().toString(36).substring(2, 10).toUpperCase();

    const zetraID = `${name}-${unique}`;

    const box = document.getElementById("resultBox");
    box.style.display = "block";
    box.innerHTML = `
        <strong>Your Zetra ID:</strong><br>
        ${zetraID}
    `;
}
