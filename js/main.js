// Theme toggler
const root = document.documentElement;
function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}
function toggleTheme() {
  const current = root.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  setTheme(newTheme);
}
(function () {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    setTheme("dark");
  }
})();

// Login/signup form toggle
let isSignup = false;
function toggleForm() {
  isSignup = !isSignup;
  document.getElementById("formTitle").textContent = isSignup ? "Signup" : "Login";
  document.getElementById("signupExtra").style.display = isSignup ? "block" : "none";
  document.querySelector(".toggle-link").textContent = isSignup
    ? "Already have an account? Login"
    : "Don't have an account? Sign up";

  // Toggle required attributes for signup fields
  const signupFields = ["fullname", "username", "confirmPassword", "mobile", "timezone", "temperatureScale"];
  signupFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (isSignup) {
        el.setAttribute("required", "required");
      } else {
        el.removeAttribute("required");
      }
    }
  });
}

// Helper: Hash a string with SHA-256 and return hex
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Show message in form message div
function showMessage(msg, color = "red") {
  const el = document.getElementById("formMessage");
  el.textContent = msg;
  el.style.color = color;
}

// Enhanced secure auth handler
document.addEventListener("DOMContentLoaded", function () {
  const authForm = document.getElementById("authForm");
  if (authForm) {
    authForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      // Security check: Use security manager for form validation
      if (window.securityManager && !window.securityManager.secureFormSubmit(authForm)) {
        return;
      }
      
      const email = document.getElementById("email").value.trim().toLowerCase();
      const password = document.getElementById("password").value;
      const name = document.getElementById("fullname") ? document.getElementById("fullname").value : "";
      const username = document.getElementById("username") ? document.getElementById("username").value : "";
      const confirmPassword = document.getElementById("confirmPassword") ? document.getElementById("confirmPassword").value : "";
      const mobile = document.getElementById("mobile") ? document.getElementById("mobile").value : "";
      const timezone = document.getElementById("timezone") ? document.getElementById("timezone").value : "";
      const temperatureScale = document.getElementById("temperatureScale") ? document.getElementById("temperatureScale").value : "";

      // Security validations (if security manager is available)
      if (window.securityManager) {
        if (!window.securityManager.validateEmail(email)) {
          showMessage("Please enter a valid email address!");
          return;
        }
        
        const passwordValidation = window.securityManager.validatePassword(password);
        if (!passwordValidation.isValid && isSignup) {
          let errorMsg = "Password must contain: ";
          const missing = [];
          if (!passwordValidation.requirements.minLength) missing.push("8+ characters");
          if (!passwordValidation.requirements.hasUpperCase) missing.push("uppercase letter");
          if (!passwordValidation.requirements.hasLowerCase) missing.push("lowercase letter");
          if (!passwordValidation.requirements.hasNumbers) missing.push("number");
          if (!passwordValidation.requirements.hasSpecialChar) missing.push("special character");
          showMessage(errorMsg + missing.join(", "));
          return;
        }
        
        // Check account lockout
        if (window.securityManager.isAccountLocked(email)) {
          showMessage("Account temporarily locked due to too many failed login attempts. Please try again later.");
          return;
        }
      }

      const passwordHash = await sha256(password);

      firebase.firestore().collection("userdata").limit(1).get()
        .then(() => console.log("Firestore connected!"))
        .catch(err => console.error("Firestore error:", err));

      if (isSignup) {
        // Signup: Check password match
        const confirmPasswordHash = await sha256(confirmPassword);
        if (passwordHash !== confirmPasswordHash) {
          showMessage("Passwords do not match!");
          return;
        }
        // Check if user already exists
        const userRef = firebase.firestore().collection("userdata").doc(email);
        const doc = await userRef.get();
        if (doc.exists) {
          showMessage("User already exists! Please login.");
          return;
        }
        // Store user data
        await userRef.set({
          username,
          name,
          email,
          passwordHash,
          mobile,
          timezone,
          temperatureScale,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        const emailHash = await sha256(email);
        localStorage.setItem('currentUserEmail', email);
        localStorage.setItem('currentUserEmailHash', emailHash);
        
        // Create secure session
        const sessionData = {
          email: email,
          loginTime: Date.now(),
          lastActivity: Date.now(),
          sessionId: window.securityManager ? window.securityManager.generateCSRFToken() : 'fallback-' + Date.now()
        };
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        
        // Track successful signup (if security manager available)
        if (window.securityManager) {
          window.securityManager.trackLoginAttempt(email, true);
          window.securityManager.logSecurityEvent('USER_SIGNUP', { email });
        }
        
        alert(`Signup successful! Welcome, ${name}`);
        document.getElementById("authForm").reset();
        window.location.href = "./src/forms.html";
      } else {
        // Login: Check if user exists
        const userRef = firebase.firestore().collection("userdata").doc(email);
        const doc = await userRef.get();
        if (!doc.exists) {
          showMessage("User not found! Please sign up first.");
          return;
        }
        const userData = doc.data();
        if (userData.passwordHash !== passwordHash) {
          // Track failed login attempt (if security manager available)
          if (window.securityManager) {
            window.securityManager.trackLoginAttempt(email, false);
            window.securityManager.logSecurityEvent('LOGIN_FAILED', { email, reason: 'incorrect_password' });
          }
          showMessage("Incorrect password!");
          return;
        }
        
        // Update last login timestamp
        await userRef.update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const emailHash = await sha256(email);
        localStorage.setItem('currentUserEmail', email);
        localStorage.setItem('currentUserEmailHash', emailHash);
        
        // Create secure session
        const sessionData = {
          email: email,
          loginTime: Date.now(),
          lastActivity: Date.now(),
          sessionId: window.securityManager ? window.securityManager.generateCSRFToken() : 'fallback-' + Date.now()
        };
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        
        // Track successful login (if security manager available)
        if (window.securityManager) {
          window.securityManager.trackLoginAttempt(email, true);
          window.securityManager.logSecurityEvent('LOGIN_SUCCESS', { email });
        }
        
        alert(`Login successful! Welcome back, ${userData.name || email}`);
        document.getElementById("authForm").reset();
        window.location.href = "./src/home.html";
      }
    });
  }

  // Fetch and display website/company details from Firestore
  (async function() {
    try {
      // abtwesite: for site title and developer
      const abtWebsiteDoc = await firestore.collection("basicdetails ").doc("abtwesite").get();
      if (abtWebsiteDoc.exists) {
        const data = abtWebsiteDoc.data();
        if (data.name) {
          const siteTitle = document.getElementById('siteTitle');
          if (siteTitle) siteTitle.textContent = data.name;
          const siteTitleHero = document.getElementById('siteTitleHero');
          if (siteTitleHero) siteTitleHero.textContent = data.name;
        }
        if (data.developer) {
          const devName = document.getElementById('developerName');
          if (devName) devName.textContent = data.developer;
        }
      }
      // abtcomapny: for company name
      const abtCompanyDoc = await firestore.collection("basicdetails ").doc("abtcomapny").get();
      if (abtCompanyDoc.exists) {
        const data = abtCompanyDoc.data();
        if (data.name) {
          const companyName = document.getElementById('companyName');
          if (companyName) companyName.textContent = data.name;
        }
      }
      // Set current year
      const yearSpan = document.getElementById('companyYear');
      if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    } catch (err) {
      console.error("Error fetching website/company details:", err);
    }
  })();
});

// --- Authentication check ---
const userEmail = localStorage.getItem('currentUserEmail') || sessionStorage.getItem('currentUserEmail');
if (!userEmail) {
    // Not logged in, redirect to login page
    window.location.href = "./index.html";
}

