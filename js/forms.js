let currentStep = 0;
const totalSteps = 4;
let deviceCount = 1;
let currentDeviceTab = 0;
let devicesGenerated = false;

// Generate a random App Key of length 32
function generateAppKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let appKey = '';
  for (let i = 0; i < 32; i++) {
    appKey += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return appKey;
}

// SHA256 hash function
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Show toast notification
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Style the toast
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 5px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
    transition: opacity 0.3s ease;
  `;
  
  // Set background color based on type
  switch(type) {
    case 'success':
      toast.style.backgroundColor = '#27ae60';
      break;
    case 'error':
      toast.style.backgroundColor = '#e74c3c';
      break;
    case 'warning':
      toast.style.backgroundColor = '#f39c12';
      break;
    default:
      toast.style.backgroundColor = '#3498db';
  }
  
  // Add to page
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Initialize the form
document.addEventListener('DOMContentLoaded', () => {
  console.log('Forms page loaded');
  console.log('Firebase available:', typeof firebase !== 'undefined');
  console.log('Firestore available:', typeof firestore !== 'undefined');
  
  // Check if user is logged in
  const userEmail = localStorage.getItem('currentUserEmail');
  console.log('Current user email:', userEmail);
  
  if (!userEmail) {
    console.log('User not logged in, redirecting to login page');
    // Uncomment the next line if you want to redirect to login
    // window.location.href = './../index.html';
  }
  
  showStep(currentStep);
  updateNavigationButtons(currentStep);
});

// Generate device fields based on device count
function generateDeviceFields() {
  console.log('generateDeviceFields called');
  const countInput = document.getElementById('deviceCount');
  console.log('Device count input element:', countInput);
  console.log('Device count value:', countInput ? countInput.value : 'not found');
  
  const count = parseInt(document.getElementById('deviceCount').value);
  console.log('Parsed count:', count);
  
  if (count < 1 || count > 10) {
    alert('Please enter a number between 1 and 10');
    return;
  }
  
  deviceCount = count;
  devicesGenerated = true;
  
  // Hide device count section and show form
  document.getElementById('deviceCountSection').style.display = 'none';
  document.getElementById('stepIndicator').style.display = 'flex';
  document.getElementById('multiStepForm').style.display = 'block';
  
  // Generate device fields for each step
  generateDeviceInfoFields();
  generateNotificationFields();
  generateWattageFields();
  
  // Show first step
  showStep(0);
  updateNavigationButtons(0);
}

// Generate device information fields
function generateDeviceInfoFields() {
  const tabsContainer = document.getElementById('deviceTabs');
  const contentContainer = document.getElementById('deviceContent');
  
  // Clear existing content
  tabsContainer.innerHTML = '';
  contentContainer.innerHTML = '';
  
  // Generate tabs
  for (let i = 0; i < deviceCount; i++) {
    const tab = document.createElement('div');
    tab.className = `device-tab ${i === 0 ? 'active' : ''}`;
    tab.textContent = `Device ${i + 1}`;
    tab.onclick = () => switchDeviceTab(0, i);
    tabsContainer.appendChild(tab);
  }
  
  // Generate content panels
  for (let i = 0; i < deviceCount; i++) {
    const panel = document.createElement('div');
    panel.className = `device-panel ${i === 0 ? 'active' : ''}`;
    panel.id = `devicePanel${i}`;
    
    panel.innerHTML = `
      <div class="form-group">
        <label for="deviceName${i}">Device Name</label>
        <input type="text" id="deviceName${i}" placeholder="Enter device name" required />
      </div>
      <div class="form-group full-width">
        <label for="deviceDescription${i}">Description</label>
        <textarea id="deviceDescription${i}" placeholder="Enter device description" required></textarea>
      </div>
      <div class="form-group">
        <label for="deviceType${i}">Device Type</label>
        <select id="deviceType${i}" required>
          <option value="" disabled selected>Select device type</option>
          <option value="sensor">Sensor</option>
          <option value="actuator">Actuator</option>
          <option value="camera">Camera</option>
        </select>
      </div>
      <div class="form-group">
        <label for="appKey${i}">App Key</label>
        <input type="text" id="appKey${i}" placeholder="Generated App Key" readonly value="${generateAppKey()}" />
      </div>
      <div class="form-group">
        <label for="room${i}">Room</label>
        <input type="text" id="room${i}" placeholder="Enter room name" required />
      </div>
      <div class="form-group">
        <label for="home${i}">Home</label>
        <input type="text" id="home${i}" placeholder="Enter home name" required />
      </div>
    `;
    
    contentContainer.appendChild(panel);
  }
}

// Generate notification fields
function generateNotificationFields() {
  const tabsContainer = document.getElementById('notificationTabs');
  const contentContainer = document.getElementById('notificationContent');
  
  // Clear existing content
  tabsContainer.innerHTML = '';
  contentContainer.innerHTML = '';
  
  // Generate tabs
  for (let i = 0; i < deviceCount; i++) {
    const tab = document.createElement('div');
    tab.className = `device-tab ${i === 0 ? 'active' : ''}`;
    tab.textContent = `Device ${i + 1}`;
    tab.onclick = () => switchDeviceTab(1, i);
    tabsContainer.appendChild(tab);
  }
  
  // Generate content panels
  for (let i = 0; i < deviceCount; i++) {
    const panel = document.createElement('div');
    panel.className = `device-panel ${i === 0 ? 'active' : ''}`;
    panel.id = `notificationPanel${i}`;
    
    panel.innerHTML = `
      <div class="form-group">
        <label>
          <input type="checkbox" id="alertNotification${i}" />
          Alerts
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="connectDisconnectNotification${i}" />
          When this device connects or disconnects
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="onOffNotification${i}" />
          When this device is turned on or off
        </label>
      </div>
    `;
    
    contentContainer.appendChild(panel);
  }
}

// Generate wattage fields
function generateWattageFields() {
  const tabsContainer = document.getElementById('wattageTabs');
  const contentContainer = document.getElementById('wattageContent');
  
  // Clear existing content
  tabsContainer.innerHTML = '';
  contentContainer.innerHTML = '';
  
  // Generate tabs
  for (let i = 0; i < deviceCount; i++) {
    const tab = document.createElement('div');
    tab.className = `device-tab ${i === 0 ? 'active' : ''}`;
    tab.textContent = `Device ${i + 1}`;
    tab.onclick = () => switchDeviceTab(2, i);
    tabsContainer.appendChild(tab);
  }
  
  // Generate content panels
  for (let i = 0; i < deviceCount; i++) {
    const panel = document.createElement('div');
    panel.className = `device-panel ${i === 0 ? 'active' : ''}`;
    panel.id = `wattagePanel${i}`;
    
    panel.innerHTML = `
      <div class="form-group">
        <label for="deviceWattage${i}">Wattage (in watts)</label>
        <input type="number" id="deviceWattage${i}" placeholder="Enter wattage (e.g., 100)" />
      </div>
      <p style="font-size: 0.9rem; color: var(--text-color);">
        You can skip this step if you don't want to specify the wattage.
      </p>
    `;
    
    contentContainer.appendChild(panel);
  }
}

// Switch device tab
function switchDeviceTab(step, deviceIndex) {
  let tabsContainer, contentContainer, panelPrefix;
  
  switch(step) {
    case 0:
      tabsContainer = document.getElementById('deviceTabs');
      contentContainer = document.getElementById('deviceContent');
      panelPrefix = 'devicePanel';
      break;
    case 1:
      tabsContainer = document.getElementById('notificationTabs');
      contentContainer = document.getElementById('notificationContent');
      panelPrefix = 'notificationPanel';
      break;
    case 2:
      tabsContainer = document.getElementById('wattageTabs');
      contentContainer = document.getElementById('wattageContent');
      panelPrefix = 'wattagePanel';
      break;
  }
  
  // Update tabs
  const tabs = tabsContainer.querySelectorAll('.device-tab');
  tabs.forEach((tab, index) => {
    tab.classList.toggle('active', index === deviceIndex);
  });
  
  // Update panels
  const panels = contentContainer.querySelectorAll('.device-panel');
  panels.forEach((panel, index) => {
    panel.classList.toggle('active', index === deviceIndex);
  });
}

// Show the current step
function showStep(step) {
  const steps = document.querySelectorAll('.step-content');
  steps.forEach((stepContent, index) => {
    stepContent.classList.toggle('active', index === step);
  });
  updateStepIndicator(step);
}

// Update the step indicator
function updateStepIndicator(step) {
  const indicators = document.querySelectorAll('.step-indicator div');
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle('active', index === step);
  });
}

// Show/hide navigation buttons based on step
function updateNavigationButtons(currentStep) {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  
  prevBtn.style.display = currentStep === 0 ? 'none' : '';
  nextBtn.style.display = currentStep === totalSteps - 1 ? 'none' : '';
  submitBtn.style.display = currentStep === totalSteps - 1 ? '' : 'none';
}

// Navigate to a specific step
function goToStep(step) {
  if (!devicesGenerated) {
    alert('Please generate device fields first');
    return;
  }
  
  currentStep = step;
  showStep(currentStep);
  updateNavigationButtons(currentStep);
}

// Change the step
function changeStep(dir) {
  if (!devicesGenerated) {
    alert('Please generate device fields first');
    return;
  }
  
  currentStep += dir;
  showStep(currentStep);
  updateNavigationButtons(currentStep);
}

// Validate the current step
async function validateStep() {
  if (!devicesGenerated) {
    alert('Please generate device fields first');
    return;
  }
  
  // Validate based on current step
  if (currentStep === 0) {
    // Validate device information for all devices
    for (let i = 0; i < deviceCount; i++) {
      const deviceName = document.getElementById(`deviceName${i}`);
      const deviceDescription = document.getElementById(`deviceDescription${i}`);
      const deviceType = document.getElementById(`deviceType${i}`);
      const room = document.getElementById(`room${i}`);
      const home = document.getElementById(`home${i}`);
      
      if (!deviceName.value.trim() || !deviceDescription.value.trim() || 
          !deviceType.value || !room.value.trim() || !home.value.trim()) {
        alert(`Please fill out all required fields for Device ${i + 1}`);
        switchDeviceTab(0, i);
        return;
      }
    }
  } else if (currentStep === 3) {
    // Validate WiFi settings
    const wifiSSID = document.getElementById('wifiSSID');
    const wifiPassword = document.getElementById('wifiPassword');
    const wifiSecurity = document.getElementById('wifiSecurity');
    
    if (!wifiSSID.value.trim() || !wifiPassword.value.trim() || !wifiSecurity.value) {
      alert('Please fill out all required WiFi fields');
      return;
    }
  }

  if (currentStep < totalSteps - 1) {
    changeStep(1);
  } else {
    // On the last step, submit to Firestore and then save to localStorage
    const success = await submitFormToFirestore();
    if (success) {
      saveFormData(); // Save data and redirect on the last step
    }
  }
}

// Collect form data and save it to localStorage
function saveFormData() {
  console.log('saveFormData called, deviceCount:', deviceCount);
  const devices = [];
  
  // Collect data for each device
  for (let i = 0; i < deviceCount; i++) {
    const deviceData = {
      deviceName: document.getElementById(`deviceName${i}`).value,
      deviceDescription: document.getElementById(`deviceDescription${i}`).value,
      deviceType: document.getElementById(`deviceType${i}`).value,
      appKey: document.getElementById(`appKey${i}`).value,
      room: document.getElementById(`room${i}`).value,
      home: document.getElementById(`home${i}`).value,
      notifications: {
        alerts: document.getElementById(`alertNotification${i}`).checked,
        connectDisconnect: document.getElementById(`connectDisconnectNotification${i}`).checked,
        onOff: document.getElementById(`onOffNotification${i}`).checked,
      },
      wattage: document.getElementById(`deviceWattage${i}`).value || 'Not specified',
    };
    devices.push(deviceData);
    console.log(`Device ${i + 1} data:`, deviceData);
  }
  
  // Collect WiFi data
  const wifiData = {
    ssid: document.getElementById('wifiSSID').value,
    password: document.getElementById('wifiPassword').value,
    security: document.getElementById('wifiSecurity').value,
    channel: document.getElementById('wifiChannel').value || 'Auto',
    hidden: document.getElementById('wifiHidden').checked,
  };
  
  const formData = {
    deviceCount: deviceCount,
    devices: devices,
    wifi: wifiData,
  };

  console.log('Final form data to save:', formData);
  
  // Save the data to localStorage
  localStorage.setItem('formData', JSON.stringify(formData));
  
  console.log('Data saved to localStorage');

  // Redirect to credential.html
  window.location.href = './credential.html';
}

// Firestore form submission function
async function submitFormToFirestore() {
  console.log('submitFormToFirestore called');
  
  // Get user Gmail from localStorage
  const usergmail = localStorage.getItem('currentUserEmail');
  const notificationDiv = document.getElementById('formNotification');
  if (!usergmail) {
    notificationDiv.textContent = 'User not logged in!';
    notificationDiv.style.color = 'red';
    return false;
  } else {
    notificationDiv.textContent = '';
  }

  // Hash the email for the collection name
  const userCollection = await sha256(usergmail);
  const collectionRef = firestore.collection(userCollection);

  try {
    // Collect WiFi data
    const wifiData = {
      ssid: document.getElementById('wifiSSID').value.trim(),
      password: document.getElementById('wifiPassword').value.trim(),
      security: document.getElementById('wifiSecurity').value,
      channel: document.getElementById('wifiChannel').value || 'Auto',
      hidden: document.getElementById('wifiHidden').checked,
    };

    // Process each device
    const devices = [];
    const duplicateNames = [];
    const duplicateKeys = [];

    for (let i = 0; i < deviceCount; i++) {
      const deviceName = document.getElementById(`deviceName${i}`).value.trim();
      const deviceDescription = document.getElementById(`deviceDescription${i}`).value.trim();
      const deviceType = document.getElementById(`deviceType${i}`).value;
      const appKey = document.getElementById(`appKey${i}`).value.trim();
      const room = document.getElementById(`room${i}`).value.trim();
      const home = document.getElementById(`home${i}`).value.trim();
      const deviceWattage = document.getElementById(`deviceWattage${i}`).value.trim();
      const alertNotification = document.getElementById(`alertNotification${i}`).checked;
      const connectDisconnectNotification = document.getElementById(`connectDisconnectNotification${i}`).checked;
      const onOffNotification = document.getElementById(`onOffNotification${i}`).checked;

      // Check for duplicate deviceName
      const deviceDoc = await collectionRef.doc(deviceName).get();
      if (deviceDoc.exists) {
        duplicateNames.push(deviceName);
        continue;
      }

      // Check for same appKey
      const appKeyQuery = await collectionRef.where('appKey', '==', appKey).get();
      if (!appKeyQuery.empty) {
        duplicateKeys.push(appKey);
        continue;
      }

      const deviceData = {
        deviceName,
        deviceDescription,
        deviceType,
        appKey,
        room,
        home,
        deviceWattage: deviceWattage || null,
        alertNotification,
        connectDisconnectNotification,
        onOffNotification,
        devicestatus: "off"
      };

      devices.push(deviceData);
    }

    // Show errors if any duplicates found
    if (duplicateNames.length > 0) {
      showToast(`Devices with these names already exist: ${duplicateNames.join(', ')}`, 'error');
      return false;
    }
    if (duplicateKeys.length > 0) {
      showToast(`Devices with these App Keys already exist: ${duplicateKeys.join(', ')}`, 'error');
      return false;
    }

    // Save all devices to Firestore
    const batch = firestore.batch();
    devices.forEach(device => {
      const deviceRef = collectionRef.doc(device.deviceName);
      batch.set(deviceRef, device);
    });

    await batch.commit();
    console.log('Devices saved to Firestore successfully');

    showToast(`${devices.length} device(s) saved successfully!`, 'success');
    return true;
  } catch (error) {
    showToast('Failed to save device details.', 'error');
    console.error('Error saving devices:', error);
    return false;
  }
}

// Function to set the theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme); // Save the theme in localStorage
}

// Function to toggle between light and dark themes
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Initialize the theme on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light theme
  setTheme(savedTheme);
});

    document.addEventListener('DOMContentLoaded', async function() {
      try {
        // abtwesite: for site title and developer
        const abtWebsiteDoc = await firestore.collection("basicdetails ").doc("abtwesite").get();
        if (abtWebsiteDoc.exists) {
          const data = abtWebsiteDoc.data();
          if (data.name) {
            const siteTitle = document.getElementById('siteTitle');
            if (siteTitle) siteTitle.textContent = data.name;
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
    });

  // form page background
  

    document.addEventListener("DOMContentLoaded", function() {
      const canvas = document.getElementById('pipes-bg');
      const ctx = canvas.getContext('2d');
      let width = window.innerWidth;
      let height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Pipe colors
      const colors = ["#00c6ff", "#0057ff", "#ff9800", "#00ff99", "#ff4081", "#ffc107"];
      // Pipe directions: right, down, left, up
      const dirs = [
        [1, 0], [0, 1], [-1, 0], [0, -1]
      ];

      function randomDir(exclude) {
        let d;
        do {
          d = Math.floor(Math.random() * 4);
        } while (d === exclude);
        return d;
      }

      function Pipe() {
        this.x = Math.floor(Math.random() * width / 20) * 20;
        this.y = Math.floor(Math.random() * height / 20) * 20;
        this.dir = Math.floor(Math.random() * 4);
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.length = 0;
        this.turnAfter = Math.floor(Math.random() * 10) + 5;
      }
      Pipe.prototype.step = function() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        this.x += dirs[this.dir][0] * 20;
        this.y += dirs[this.dir][1] * 20;
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        this.length++;
        if (this.length >= this.turnAfter) {
          this.dir = randomDir(this.dir);
          this.length = 0;
          this.turnAfter = Math.floor(Math.random() * 10) + 5;
        }
        // Respawn if out of bounds
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          Pipe.call(this);
        }
      };

      // Create pipes
      const pipes = [];
      for (let i = 0; i < 12; i++) pipes.push(new Pipe());

      function animate() {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
        for (let pipe of pipes) pipe.step();
        requestAnimationFrame(animate);
      }
      animate();

      window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
      });
    });

document.addEventListener('DOMContentLoaded', function() {
  const usergmail = localStorage.getItem('currentUserEmail');
  if (!usergmail) {
    alert('User not logged in!');
    // Optionally redirect to login page:
    // window.location.href = 'login.html';
    return;
  }
  // You can use usergmail here
  console.log(usergmail);
  document.getElementById('formNotification').textContent = '';
});

function showToast(message, type = 'success') {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `show ${type}`;
  toast.style.position = 'fixed';
  toast.style.top = '2rem';
  toast.style.right = '2rem';
  toast.style.minWidth = '220px';
  toast.style.maxWidth = '350px';
  toast.style.padding = '1em 1.5em';
  toast.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
  toast.style.color = '#fff';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
  toast.style.opacity = '1';
  toast.style.zIndex = '9999';
  toast.style.fontSize = '1rem';
  toast.style.transition = 'opacity 0.4s, transform 0.4s';
  toast.style.transform = 'translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-30px)';
  }, 3000);
}

async function sha256(message) {
  // Encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);
  // Hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


// --- Authentication check ---
const userEmail = localStorage.getItem('currentUserEmail') || sessionStorage.getItem('currentUserEmail');
if (!userEmail) {
    // Not logged in, redirect to login page
    window.location.href = "./../index.html";
}