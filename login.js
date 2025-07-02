// Validate login and set cookies for session persistence
function validateLogin() {
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('error-message'); // Error message container

    // Check if the entered password is "Vanir"
    if (password === "Vanir") {
        // Set the loggedIn flag in localStorage and as a cookie
        localStorage.setItem('loggedIn', 'true');
        setCookie('loggedIn', 'true', 7); // Cookie lasts for 7 days
        window.location.href = "index.html";
    } else {
        // Show error message if incorrect
        errorMessage.textContent = "Incorrect password";
    }
}

// Function to enable or disable the login button based on input field
function toggleButton() {
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');

    // Enable the button if there's text in the input field, otherwise disable it
    loginButton.disabled = passwordInput.value.trim() === '';
}
// Utility to set a cookie with name, value, and expiration days
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
