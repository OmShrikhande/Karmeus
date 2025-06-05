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
async function displayFormData() {
  const dataDisplay = document.getElementById('dataDisplay');
  const formData = JSON.parse(localStorage.getItem('formData'));
  console.log('Retrieved form data from localStorage:', formData);
  
  if (!formData) {
    console.log('No form data found in localStorage');
    dataDisplay.innerHTML = '<div style="color:#e74c3c;">No device data found.</div>';
    return;
  }

  let displayHTML = '';

  // Check if it's new multi-device format or old single device format
  if (formData.devices && Array.isArray(formData.devices)) {
    // New multi-device format
    displayHTML += `<h3>WiFi Configuration</h3>
    <div class="wifi-info">
      <div class="data-item"><strong>Network Name (SSID):</strong> ${formData.wifi.ssid}</div>
      <div class="data-item"><strong>Security:</strong> ${formData.wifi.security}</div>
      <div class="data-item"><strong>Channel:</strong> ${formData.wifi.channel}</div>
      <div class="data-item"><strong>Hidden Network:</strong> ${formData.wifi.hidden ? 'Yes' : 'No'}</div>
    </div>
    <h3>Devices (${formData.deviceCount})</h3>`;

    formData.devices.forEach((device, index) => {
      displayHTML += `
        <div class="device-card">
          <h4>Device ${index + 1}: ${device.deviceName}</h4>
          <div class="data-item"><strong>Description:</strong> ${device.deviceDescription}</div>
          <div class="data-item"><strong>Device Type:</strong> ${device.deviceType}</div>
          <div class="data-item"><strong>App Key:</strong> ${device.appKey}</div>
          <div class="data-item"><strong>Room:</strong> ${device.room}</div>
          <div class="data-item"><strong>Home:</strong> ${device.home}</div>
          <div class="data-item"><strong>Notifications:</strong>
            <ul>
              <li>Alerts: ${device.notifications.alerts ? 'Enabled' : 'Disabled'}</li>
              <li>Connect/Disconnect: ${device.notifications.connectDisconnect ? 'Enabled' : 'Disabled'}</li>
              <li>On/Off: ${device.notifications.onOff ? 'Enabled' : 'Disabled'}</li>
            </ul>
          </div>
          <div class="data-item"><strong>Wattage:</strong> ${device.wattage || 'Not specified'}</div>
        </div>
      `;
    });

    // Save devices to localStorage for home page
    const existingDevices = JSON.parse(localStorage.getItem('devices')) || [];
    formData.devices.forEach(device => {
      existingDevices.push({ ...device, status: false }); // Default status is "Off"
    });
    localStorage.setItem('devices', JSON.stringify(existingDevices));
  } else {
    // Old single device format (backward compatibility)
    const alerts = formData.notifications ? formData.notifications.alerts : formData.alertNotification;
    const connectDisconnect = formData.notifications ? formData.notifications.connectDisconnect : formData.connectDisconnectNotification;
    const onOff = formData.notifications ? formData.notifications.onOff : formData.onOffNotification;

    displayHTML = `
      <div class="device-card">
        <h4>Device: ${formData.deviceName || ''}</h4>
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
      </div>
    `;

    // Save the device to the devices list in localStorage
    const devices = JSON.parse(localStorage.getItem('devices')) || [];
    devices.push({ ...formData, status: false }); // Default status is "Off"
    localStorage.setItem('devices', JSON.stringify(devices));
  }

  dataDisplay.innerHTML = displayHTML;

  // Generate and update the ESP8266 code
  await generateESP8266Code();
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

// Generate ESP8266 code based on form data
async function generateESP8266Code() {
  const formData = JSON.parse(localStorage.getItem('formData'));
  console.log('generateESP8266Code called with formData:', formData);
  if (!formData) {
    console.log('No form data available for ESP8266 code generation');
    return;
  }

  let firebaseProjectId = 'karmeus-43cbe'; // Use the actual project ID
  let userCollectionHash = '';

  try {
    // Get user collection hash
    const userEmail = localStorage.getItem('currentUserEmail');
    if (userEmail) {
      userCollectionHash = await sha256(userEmail);
    }
  } catch (error) {
    console.error('Error generating user collection hash:', error);
  }

  let wifiSSID = 'YOUR_WIFI_SSID';
  let wifiPassword = 'YOUR_WIFI_PASSWORD';
  let devicesArray = [];

  // Handle both new and old format
  if (formData.devices && Array.isArray(formData.devices)) {
    // New multi-device format
    wifiSSID = formData.wifi.ssid;
    wifiPassword = formData.wifi.password;
    devicesArray = formData.devices;
  } else {
    // Old single device format
    devicesArray = [formData];
  }

  // Generate device struct entries
  let deviceStructEntries = '';
  devicesArray.forEach((device, index) => {
    const pinNumber = `D${index + 3}`; // Start from D3, D4, D5, etc.
    deviceStructEntries += `  { "${device.deviceName}", "/${userCollectionHash}/${device.deviceName}/", ${pinNumber} }`;
    if (index < devicesArray.length - 1) {
      deviceStructEntries += ',\n';
    }
  });

  const esp8266Code = `#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "${wifiSSID}";
const char* password = "${wifiPassword}";

// Firebase settings
const char* FIREBASE_PROJECT_ID = "${firebaseProjectId}";
const char* FIRESTORE_HOST = "firestore.googleapis.com";

// Device configuration
struct Device {
  const char* name;
  const char* documentPath;
  int pin;
};

Device devices[] = {
${deviceStructEntries}
};

const int numDevices = sizeof(devices) / sizeof(devices[0]);
WiFiClientSecure client;

void setup() {
  Serial.begin(9600);
  
  // Initialize device pins
  for (int i = 0; i < numDevices; i++) {
    pinMode(devices[i].pin, OUTPUT);
    digitalWrite(devices[i].pin, LOW);  // Default OFF
  }
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  client.setInsecure();  // Bypass SSL
  
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\n✅ WiFi connected.");
}

void loop() {
  // Check status for each device
  for (int i = 0; i < numDevices; i++) {
    String status = fetchDeviceStatus(devices[i].documentPath);
    
    if (status == "on") {
      digitalWrite(devices[i].pin, HIGH);
    } else if (status == "off") {
      digitalWrite(devices[i].pin, LOW);
    }
    
    Serial.print(devices[i].name);
    Serial.print(": ");
    Serial.println(status);
  }
  
  delay(1000);  // Poll every second
}

String fetchDeviceStatus(const char* documentPath) {
  if (!client.connect(FIRESTORE_HOST, 443)) {
    Serial.println("❌ Connection failed");
    return "unknown";
  }
  
  String url = String("/v1/projects/") + FIREBASE_PROJECT_ID +
               "/databases/(default)/documents" + documentPath;
               
  client.println("GET " + url + " HTTP/1.1");
  client.println("Host: firestore.googleapis.com");
  client.println("Content-Type: application/json");
  client.println("Connection: close");
  client.println();
  
  String responseBody = "";
  bool isBody = false;
  
  while (client.connected() || client.available()) {
    String line = client.readStringUntil('\\n');
    if (line == "\\r") {
      isBody = true;
      continue;
    }
    if (isBody) {
      responseBody += line;
    }
  }
  
  client.stop();
  
  int startIdx = responseBody.indexOf('{');
  int endIdx = responseBody.lastIndexOf('}');
  if (startIdx == -1 || endIdx == -1) return "unknown";
  
  String cleanJson = responseBody.substring(startIdx, endIdx + 1);
  
  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, cleanJson);
  if (error) return "unknown";
  
  if (doc["fields"]["devicestatus"].containsKey("stringValue")) {
    return doc["fields"]["devicestatus"]["stringValue"].as<String>();
  } else {
    return "unknown";
  }
}`;

  // Update the code block
  const codeBlock = document.getElementById('cCodeBlock');
  if (codeBlock) {
    codeBlock.textContent = esp8266Code;
    console.log('ESP8266 code updated in DOM');
  } else {
    console.log('cCodeBlock element not found');
  }
}

// SHA256 hash function
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Toggle code section visibility
function toggleCodeSection() {
  const section = document.getElementById('codeSection');
  section.classList.toggle('show');
  // Optionally change button text
  const btn = document.getElementById('showCodeBtn');
  btn.textContent = section.classList.contains('show') ? 'Hide ESP8266 Code' : 'Show ESP8266 Code';
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
  const blob = new Blob([code], { type: 'text/x-c++src' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'esp8266_device_controller.ino';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
window.copyCCode = copyCCode;
window.downloadCCode = downloadCCode;


// --- Authentication check ---
const userEmail = localStorage.getItem('currentUserEmail') || sessionStorage.getItem('currentUserEmail');
if (!userEmail) {
    // Not logged in, redirect to login page
    window.location.href = "./../index.html";
}