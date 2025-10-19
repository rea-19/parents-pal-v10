document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
});

function loadHeader() {
  fetch("/html/include/header.html")
    .then(res => res.text())
    .then(data => {
      const headerDiv = document.getElementById("header");
      headerDiv.innerHTML = data;

      const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
      if (isHomePage) {
        headerDiv.classList.add('transparent-header-container'); 

        const navbar = document.getElementById('navbar');
        if (navbar) {
          navbar.style.backgroundColor = 'transparent';
          navbar.style.boxShadow = 'none';
          navbar.style.position = 'absolute';
          navbar.querySelectorAll('a').forEach(link => link.style.color = '#fff'); 
        }
      }

      initHeader();
    })
    .catch(err => console.error("Error loading header:", err));
}

function initHeader() {
  const loggedIn = localStorage.getItem("loggedIn") === "true";
  const navbarLinks = document.getElementById("navbar-links");
  const profileBtn = document.getElementById("profileBtn");

  const oldDropdown = document.querySelector(".profile-dropdown");
  if (oldDropdown) oldDropdown.remove();

  if (loggedIn) {
    if (profileBtn) profileBtn.style.display = "none";

    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown", "profile-dropdown");

    dropdown.innerHTML = `
      <a href="#" class="dropdown-toggle">Profile ▾</a>
      <div class="dropdown-menu">
        <a href="/html/profile_rewards.html">Rewards</a>
        <a href="/html/profile_my_events.html">My Events</a>
        <a href="#" id="logoutBtnDropdown">Log Out</a>
      </div>
    `;

    if (navbarLinks) navbarLinks.appendChild(dropdown);

    const toggle = dropdown.querySelector(".dropdown-toggle");
    const menu = dropdown.querySelector(".dropdown-menu");
    toggle.onclick = e => {
      e.preventDefault();
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    };

    const logoutBtnDropdown = document.getElementById("logoutBtnDropdown");
    if (logoutBtnDropdown) {
      logoutBtnDropdown.onclick = e => {
        e.preventDefault();
        if (confirm("Log out?")) {
          localStorage.removeItem("loggedIn");
          localStorage.removeItem("loggedInUser");
          alert("Logged out!");
          loadHeader(); 
        }
      };
    }

  } else {
    if (profileBtn) {
      profileBtn.style.display = "inline-block";
      profileBtn.href = "#";
      profileBtn.style.cursor = "pointer";
      profileBtn.onclick = e => {
        e.preventDefault();
        const popup = document.getElementById("popupContainer");
        const loginForm = document.getElementById("loginForm");
        const signupForm = document.getElementById("signupForm");
        if (!popup || !loginForm || !signupForm) return;

        popup.style.display = "flex";
        loginForm.style.display = "flex";
        signupForm.style.display = "none";
      };
    }

    initPopup();
  }

  updateProgressBar();
}

// ==========================
// Global Progress Bar Update
// ==========================
function updateProgressBar() {
  const loggedIn = localStorage.getItem("loggedIn") === "true";
  const notSignedInBar = document.getElementById("not-signedin-progressbar");
  const signedInBar = document.getElementById("signedin-progressbar");

  const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
  if (isHomePage) {
    if (notSignedInBar) notSignedInBar.style.display = 'none';
    if (signedInBar) signedInBar.style.display = 'none';
    return;
  }

  if (!notSignedInBar || !signedInBar) return;

  if (loggedIn) {
    notSignedInBar.style.display = "none";
    signedInBar.style.display = "block";
    signedInBar.style.cursor = "pointer";
    signedInBar.onclick = () => window.location.href = "/html/profile_rewards.html";
  } else {
    signedInBar.style.display = "none";
    notSignedInBar.style.display = "block";
    notSignedInBar.style.cursor = "pointer";
    notSignedInBar.onclick = () => {
      const popup = document.getElementById("popupContainer");
      const loginForm = document.getElementById("loginForm");
      const signupForm = document.getElementById("signupForm");
      if (!popup || !loginForm || !signupForm) return;

      popup.style.display = "flex";
      loginForm.style.display = "flex";
      signupForm.style.display = "none";
    };
  }
}

// Apply saved points to progress bars
function applySavedRewardsToBars() {
  const loggedInUser = localStorage.getItem('loggedInUser') || 'guest';
  const storageKey = `rewards_${loggedInUser}`;
  let userPoints = 0;
  let goal = 50;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.userPoints === 'number') userPoints = parsed.userPoints;
      if (typeof parsed.goal === 'number') goal = parsed.goal;
    }
  } catch (e) {
    console.warn('Failed to read saved rewards:', e);
  }

  const percentage = goal && goal > 0 ? Math.min((userPoints / goal) * 100, 100) : 0;

  const signedInBar = document.getElementById('signedin-progressbar');
  if (signedInBar) {
    const fill = signedInBar.querySelector('.progress-done');
    if (fill) fill.style.width = `${percentage}%`;
    const text = signedInBar.querySelector('#point-text');
    if (text) text.innerText = `${userPoints}/${goal}`;
  }

  const notSignedInBar = document.getElementById('not-signedin-progressbar');
  if (notSignedInBar) {
    const fill = notSignedInBar.querySelector('#progress-fill');
    if (fill) fill.style.width = `${percentage}%`;
    const text = notSignedInBar.querySelector('#point-text');
    if (text) text.innerText = userPoints > 0 ? `You have ${userPoints} points` : text.innerText;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(applySavedRewardsToBars, 50);
});

// ==========================
// Signup/Login Popup Logic
// ==========================
function initPopup() {
  const popup = document.getElementById('popupContainer');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const closePopup = document.getElementById('closePopup');
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');

  if (!popup || !loginForm || !signupForm) return;

  loginForm.style.display = 'flex';
  signupForm.style.display = 'none';

  if (closePopup) closePopup.onclick = () => popup.style.display = 'none';
  window.onclick = e => { if (e.target === popup) popup.style.display = 'none'; };

  if (showSignup) showSignup.onclick = e => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'flex';
  };
  if (showLogin) showLogin.onclick = e => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'flex';
  };

  // --- Signup ---
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = signupForm.querySelector('input[type="email"]').value.trim();
    const password = signupForm.querySelector('input[type="password"]').value.trim();
    const phone = signupForm.querySelector('input[type="tel"]').value.trim();
    if (!email || !password || !phone) return alert("Please fill out all fields.");

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some(u => u.email === email)) return alert("Email already registered.");
    if (users.some(u => u.phone === phone)) return alert("Phone number already registered.");

    users.push({ email, password, phone });
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("loggedInUser", email);

    // ===== Add 15 points for new signup =====
    const storageKey = `rewards_${email}`;
    localStorage.setItem(storageKey, JSON.stringify({ userPoints: 15, goal: 50 }));
    if (typeof window.addPoints === "function") window.addPoints(0); // refresh progress bar

    alert("Signup successful! You earned 15 points as a welcome bonus!");
    popup.style.display = "none";
    initHeader();
  });

  // --- Login ---
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value.trim();
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("loggedInUser", email);
      alert("Login successful!");
      popup.style.display = "none";
      initHeader();
    } else alert("Invalid email or password.");
  });
}

// Load footer
fetch("/html/include/footer.html")
  .then(res => res.text())
  .then(data => document.getElementById("footer").innerHTML = data);
