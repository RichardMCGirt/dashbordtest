console.log("hello world");

document.addEventListener("DOMContentLoaded", function () {
  const correctPassword = "vanir2025!!";
  const unlockKey = "vanirUnlocked";
  const dropZoneIds = ["dropZone", "dropZoneMain"];

  function lockZone(zone) {
    zone.style.opacity = "0.5";
    zone.style.pointerEvents = "auto";
    const fileInput = zone.querySelector('input[type="file"]');
    if (fileInput) fileInput.disabled = true;
  }

  function unlockZone(zone) {
    zone.style.opacity = "1";
    const fileInput = zone.querySelector('input[type="file"]');
    if (fileInput) fileInput.disabled = false;
    const passwordInput = zone.querySelector(".password-unlock-input");
    if (passwordInput) passwordInput.remove();
  }

  function createPasswordInput(zone) {
    if (zone.querySelector(".password-unlock-input")) return;

    const input = document.createElement("input");
    input.type = "password";
    input.placeholder = "Enter password to unlock";
    input.className = "password-unlock-input";

    input.style.position = "fixed";
    input.style.top = "50%";
    input.style.left = "50%";
    input.style.transform = "translate(-50%, -50%)";
    input.style.zIndex = "1000";
    input.style.padding = "8px 12px";
    input.style.fontSize = "16px";
    input.style.border = "1px solid #ccc";
    input.style.borderRadius = "6px";
    input.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
    input.style.backgroundColor = "#000";
    input.style.color = "#fff";
    input.style.opacity = "1";

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        if (input.value === correctPassword) {
          localStorage.setItem(unlockKey, "true");
          dropZoneIds.forEach(id => {
            const z = document.getElementById(id);
            if (z) unlockZone(z);
          });
          input.remove();
        } else {
          alert("Incorrect password.");
          input.value = "";
        }
      }
    });

    zone.appendChild(input);
    input.focus();
  }

  function setupZone(zone) {
    if (!zone) return;

    if (localStorage.getItem(unlockKey) === "true") {
      unlockZone(zone);
      return;
    }

    lockZone(zone);

    zone.addEventListener("mouseenter", () => {
      if (localStorage.getItem(unlockKey) !== "true") {
        createPasswordInput(zone);
      }
    });

    zone.addEventListener("mouseleave", () => {
      const input = zone.querySelector(".password-unlock-input");
      if (input) input.remove();
    });
  }

  dropZoneIds.forEach(id => {
    const zone = document.getElementById(id);
    setupZone(zone);
  });

  // 🔐 Admin override: press "q" to unlock
  document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() === "q") {
      localStorage.setItem(unlockKey, "true");
      dropZoneIds.forEach(id => {
        const z = document.getElementById(id);
        if (z) unlockZone(z);
      });
    }
  });
});
