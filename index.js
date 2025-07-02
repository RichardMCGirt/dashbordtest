// Detect if the device is running iOS
function isIos() {
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

// Check if the app is running in standalone mode
function isInStandaloneMode() {
    return ('standalone' in window.navigator) && window.navigator.standalone;
}

// Check if we've already shown the prompt
function hasPromptBeenShown() {
    return localStorage.getItem('a2hsPromptShown') === 'true';
}

function showAddToHomeScreenPrompt() {
    const isiOS = isIos();
    const inStandalone = isInStandaloneMode();
    const alreadyShown = hasPromptBeenShown();

    console.log("Device is iOS:", isiOS);
    console.log("Running in standalone mode:", inStandalone);
    console.log("Prompt has already been shown:", alreadyShown);

    if (isiOS && !inStandalone && !alreadyShown) {
        const prompt = document.createElement('div');
        prompt.id = "a2hs-prompt";
        prompt.style.position = "fixed";
        prompt.style.bottom = "10px";
        prompt.style.left = "10px";
        prompt.style.right = "10px";
        prompt.style.backgroundColor = "#fff";
        prompt.style.border = "1px solid #ccc";
        prompt.style.padding = "15px";
        prompt.style.zIndex = "1000";
        prompt.style.textAlign = "center";
        prompt.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";
        prompt.innerHTML = `
            <p>To install this app, tap the <strong>Share</strong> icon <span style="font-size: 18px;">📤</span> then select <strong>'Add to Home Screen'</strong>.</p>
            <button onclick="dismissPrompt()">Dismiss</button>
        `;
        document.body.appendChild(prompt);

        console.log("Prompt shown: Add to Home Screen");

        // Remember that we showed it so we don't show it again
        localStorage.setItem('a2hsPromptShown', 'true');
    } else {
        if (!isiOS) {
            console.log("Not an iPhone/iPad/iPod. Prompt will not be shown.");
        } else if (inStandalone) {
            console.log("App is already installed (standalone mode). No prompt needed.");
        } else if (alreadyShown) {
            console.log("Prompt has already been shown. Not showing again.");
        }
    }
}


// Function to remove the prompt
function dismissPrompt() {
    const prompt = document.getElementById('a2hs-prompt');
    if (prompt) {
        prompt.remove();
    }
}

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get a cookie value
function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(name + "=") === 0) {
            return cookie.substring(name.length + 1);
        }
    }
    return "";
}

// Main logic on page load
document.addEventListener("DOMContentLoaded", function () {
    document.body.style.display = 'none';

    const isLoggedIn = localStorage.getItem("loggedIn") === 'true' || getCookie('loggedIn') === 'true';

    if (!isLoggedIn) {
       // localStorage.removeItem('loggedIn');
        document.cookie = "loggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        const errorMessage = document.createElement('p');
        errorMessage.style.color = 'red';
        errorMessage.textContent = "You must be logged in to access this page.";
        document.body.appendChild(errorMessage);

        setTimeout(function () {
            window.location.href = "login.html";
        }, 3000);
    } else {
        document.body.style.display = 'block';
        showAddToHomeScreenPrompt(); // Show iOS install prompt
    }
});


