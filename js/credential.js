// Theme functions
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}
window.toggleTheme = toggleTheme;

// On page load, set theme, welcome user, fetch company info, and display form data
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  fetchAndDisplayUsername();
  fetchWebsiteDetails();
  displayFormData();
});

// Welcome user logic
async function fetchAndDisplayUsername() {
  const email = localStorage.getItem('currentUserEmail');
  const welcomeEls = document.querySelectorAll('#welcomeUser');
  if (!email) {
    welcomeEls.forEach(el => el.textContent = "Welcome!");
    return;
  }
  try {
    const userDoc = await firebase.firestore().collection("userdata").doc(email).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      welcomeEls.forEach(el => el.textContent = `Welcome, ${userData.username || userData.name || email}!`);
    } else {
      welcomeEls.forEach(el => el.textContent = "Welcome!");
    }
  } catch (err) {
    welcomeEls.forEach(el => el.textContent = "Welcome!");
  }
}

// Fetch website/company details
async function fetchWebsiteDetails() {
  try {
    const firestore = firebase.firestore();
    const abtWebsiteDoc = await firestore.collection("basicdetails ").doc("abtwesite").get();
    if (abtWebsiteDoc.exists) {
      const data = abtWebsiteDoc.data();
      if (data && data.name) {
        const siteTitle = document.querySelector('.site-title');
        if (siteTitle) siteTitle.textContent = data.name;
      }
      if (data && data.developer) {
        const devCredit = document.getElementById('developerCredit');
        if (devCredit) devCredit.textContent = `Developed by ${data.developer}`;
      }
    }
    const abtCompanyDoc = await firestore.collection("basicdetails ").doc("abtcomapny").get();
    if (abtCompanyDoc.exists) {
      const data = abtCompanyDoc.data();
      if (data && data.name) {
        const footer = document.querySelector('footer p');
        if (footer) footer.innerHTML = `&copy; 2025 ${data.name}. All rights reserved.<br><span id="developerCredit" style="font-size:1em; color:#666;">Developed by Om Shrikhande</span>`;
      }
    }
  } catch (err) {
    // Silent fail
  }
}

// Display form data from localStorage
function displayFormData() {
  const dataDisplay = document.getElementById('dataDisplay');
  const formData = JSON.parse(localStorage.getItem('formData'));
  if (!formData) {
    dataDisplay.innerHTML = '<div style="color:#e74c3c;">No device data found.</div>';
    return;
  }
  // Support both old and new structure for notifications
  const alerts = formData.notifications ? formData.notifications.alerts : formData.alertNotification;
  const connectDisconnect = formData.notifications ? formData.notifications.connectDisconnect : formData.connectDisconnectNotification;
  const onOff = formData.notifications ? formData.notifications.onOff : formData.onOffNotification;

  dataDisplay.innerHTML = `
    <div class="data-item"><strong>Device Name:</strong> ${formData.deviceName || ''}</div>
    <div class="data-item"><strong>Description:</strong> ${formData.deviceDescription || ''}</div>
    <div class="data-item"><strong>Device Type:</strong> ${formData.deviceType || ''}</div>
    <div class="data-item"><strong>App Key:</strong> ${formData.appKey || ''}</div>
    <div class="data-item"><strong>Room:</strong> ${formData.room || ''}</div>
    <div class="data-item"><strong>Home:</strong> ${formData.home || ''}</div>
    <div class="data-item"><strong>Notifications:</strong>
      <ul>
        <li>Alerts: ${alerts ? 'Enabled' : 'Disabled'}</li>
        <li>Connect/Disconnect: ${connectDisconnect ? 'Enabled' : 'Disabled'}</li>
        <li>On/Off: ${onOff ? 'Enabled' : 'Disabled'}</li>
      </ul>
    </div>
    <div class="data-item"><strong>Wattage:</strong> ${formData.wattage || formData.deviceWattage || 'Not specified'}</div>
  `;

  // Save the device to the devices list in localStorage (if you want to keep a list)
  const devices = JSON.parse(localStorage.getItem('devices')) || [];
  devices.push({ ...formData, status: false }); // Default status is "Off"
  localStorage.setItem('devices', JSON.stringify(devices));
}

// Go to Home button logic
function goToHome() {
  window.location.href = './home.html';
}
window.goToHome = goToHome;

// Simple floating dots background with theme-aware color
function getDotColor() {
  const theme = document.documentElement.getAttribute('data-theme');
  return theme === 'dark'
    ? 'rgba(255, 209, 102, 0.22)' // gold/yellow, more visible on dark
    : 'rgba(0, 87, 255, 0.15)';   // blue, subtle on light
}

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let w = window.innerWidth, h = window.innerHeight;
canvas.width = w; canvas.height = h;

let dots = Array.from({length: 40}, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  r: 2 + Math.random() * 3,
  dx: -0.5 + Math.random(),
  dy: -0.5 + Math.random(),
  color: getDotColor()
}));

function updateDotColors() {
  const color = getDotColor();
  dots.forEach(dot => dot.color = color);
}

function animateDots() {
  ctx.clearRect(0,0,w,h);
  dots.forEach(dot => {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, 2 * Math.PI);
    ctx.fillStyle = dot.color;
    ctx.fill();
    dot.x += dot.dx;
    dot.y += dot.dy;
    if(dot.x < 0 || dot.x > w) dot.dx *= -1;
    if(dot.y < 0 || dot.y > h) dot.dy *= -1;
  });
  requestAnimationFrame(animateDots);
}
animateDots();

window.addEventListener('resize', () => {
  w = window.innerWidth; h = window.innerHeight;
  canvas.width = w; canvas.height = h;
});

// Update dot colors when theme changes
const observer = new MutationObserver(updateDotColors);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// Also update colors on page load (in case theme is set after dots are created)
document.addEventListener('DOMContentLoaded', updateDotColors);

// Toggle code section visibility
function toggleCodeSection() {
  const section = document.getElementById('codeSection');
  section.classList.toggle('show');
  // Optionally change button text
  const btn = document.getElementById('showCodeBtn');
  btn.textContent = section.classList.contains('show') ? 'Hide C Code' : 'Show C Code';
}
window.toggleCodeSection = toggleCodeSection;

function copyCCode() {
  const code = document.getElementById('cCodeBlock').innerText
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  navigator.clipboard.writeText(code).then(() => {
    document.getElementById('copyCodeBtn').textContent = 'Copied!';
    setTimeout(() => {
      document.getElementById('copyCodeBtn').textContent = 'Copy';
    }, 1200);
  });
}

function downloadCCode() {
  const code = document.getElementById('cCodeBlock').innerText
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const blob = new Blob([code], { type: 'text/x-csrc' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'hello_world.c';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
window.copyCCode = copyCCode;
window.downloadCCode = downloadCCode;