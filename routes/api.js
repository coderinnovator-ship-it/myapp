// Simple backend simulation for your SaaS

// When the user clicks "Submit"
function submitMessage() {
    const userInput = document.getElementById("userInput").value;

    if (userInput.trim() === "") {
        alert("Please type something first!");
        return;
    }

    // Display loading
    document.getElementById("responseBox").innerHTML =
        "⏳ Processing…";

    // Simulate SaaS backend response
    setTimeout(() => {
        document.getElementById("responseBox").innerHTML =
            "🔥 Your result: " + generateResponse(userInput);
    }, 1500);
}

// Fake backend logic (You can change this later)
function generateResponse(text) {
    return "This SaaS processed: \"" + text + "\" 👌";
}
