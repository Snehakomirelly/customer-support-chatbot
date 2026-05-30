let username = "";
let messageInput;

// ================= LOAD =================
window.onload = function () {

    messageInput = document.getElementById("message");

    if (messageInput) {
        messageInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") sendMessage();
        });
    }

    // DARK MODE LOAD
    if (localStorage.getItem("darkMode") === "on") {
        document.body.classList.add("dark-mode");
    }

    // USER LOAD
    const saved = localStorage.getItem("username");

    if (saved) {
        username = saved;
        document.getElementById("namePopup").style.display = "none";
        startSession();
    }
};

// ================= SAVE NAME =================
function saveName() {

    const input = document.getElementById("usernameInput").value;

    if (!input.trim()) return;

    username = input;

    localStorage.setItem("username", username);

    document.getElementById("namePopup").style.display = "none";

    startSession();
}

// ================= SESSION =================
async function startSession() {

    await fetch("/set_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    });

    loadChat();
}

// ================= LOAD CHAT =================
async function loadChat() {

    const res = await fetch("/history");
    const data = await res.json();

    const chatBox = document.getElementById("chat-box");

    chatBox.innerHTML = "";

    let lastDate = "";

    data.forEach(chat => {

        // ===== TODAY / YESTERDAY FEATURE =====

        let label = chat.date;

        const today = new Date();
        const yesterday = new Date();

        yesterday.setDate(today.getDate() - 1);

        const todayStr =
            String(today.getDate()).padStart(2, "0") + "/" +
            String(today.getMonth() + 1).padStart(2, "0") + "/" +
            today.getFullYear();

        const yesterdayStr =
            String(yesterday.getDate()).padStart(2, "0") + "/" +
            String(yesterday.getMonth() + 1).padStart(2, "0") + "/" +
            yesterday.getFullYear();

        if (chat.date === todayStr) {
            label = "Today";
        }
        else if (chat.date === yesterdayStr) {
            label = "Yesterday";
        }

        // ===== DATE SEPARATOR =====

        if (lastDate !== label) {

            const dateDiv = document.createElement("div");

            dateDiv.classList.add("date-separator");

            dateDiv.innerHTML = `
                <span>${label}</span>
            `;

            chatBox.appendChild(dateDiv);

            lastDate = label;
        }

        // ===== MESSAGE =====

        const div = document.createElement("div");

        div.classList.add("message");

        if (chat.sender === "You") {
            div.classList.add("user");
        } else {
            div.classList.add("support");
        }

        const name =
            chat.sender === "You" ? username : "Support";

        const avatar =
            chat.sender === "You" ? "👤" : "🤖";

        div.innerHTML = `
            <strong>${avatar} ${name}</strong>
            <p>${chat.message}</p>
            <small>${chat.time}</small>
        `;

        chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}

// ================= SEND MESSAGE =================
async function sendMessage() {

    const message = messageInput.value.trim();

    if (!message) return;

    await fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    });

    messageInput.value = "";

    loadChat();
}

// ================= CLEAR CHAT =================
async function clearChat() {

    await fetch("/clear", {
        method: "POST"
    });

    loadChat();
}

// ================= EMOJI =================
function addEmoji(e) {

    messageInput.value += e;

    messageInput.focus();
}

// ================= VOICE =================
function startVoice() {

    const SR =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SR) {
        alert("Voice not supported");
        return;
    }

    const recognition = new SR();

    recognition.lang = "en-US";

    recognition.onresult = function (event) {

        messageInput.value +=
            event.results[0][0].transcript;
    };

    recognition.start();
}

// ================= DOWNLOAD =================
function downloadChat() {

    const chatBox = document.getElementById("chat-box");

    let text = "";

    chatBox.querySelectorAll(".message").forEach(msg => {

        text += msg.innerText + "\n\n";
    });

    const blob = new Blob([text], {
        type: "text/plain"
    });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = "chat.txt";

    a.click();
}

// ================= THEME =================
function changeTheme(theme) {

    document.body.classList.remove(
        "blue-theme",
        "green-theme",
        "pink-theme"
    );

    if (theme === "blue") {
        document.body.classList.add("blue-theme");
    }

    else if (theme === "green") {
        document.body.classList.add("green-theme");
    }

    else if (theme === "pink") {
        document.body.classList.add("pink-theme");
    }
}

// ================= DARK MODE =================
function toggleDarkMode() {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "on");
    } else {
        localStorage.setItem("darkMode", "off");
    }
}