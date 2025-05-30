let currentStep = 0;
const totalSteps = 3;

// Generate a random App Key of length 32
function generateAppKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let appKey = '';
  for (let i = 0; i < 32; i++) {
    appKey += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return appKey;
}

// Set the App Key field with a default random value
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('appKey').value = generateAppKey();
  showStep(currentStep);
  updateNavigationButtons(currentStep);
});

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
  document.getElementById('nextBtn').style.display = currentStep === 2 ? 'none' : '';
  document.getElementById('submitBtn').style.display = currentStep === 2 ? '' : 'none';
}

// Navigate to a specific step
function goToStep(step) {
  document.querySelectorAll('.step-content')[currentStep].classList.remove('active');
  currentStep = step;
  document.querySelectorAll('.step-content')[currentStep].classList.add('active');
  updateNavigationButtons(currentStep);
}

// Change the step
function changeStep(dir) {
  document.querySelectorAll('.step-content')[currentStep].classList.remove('active');
  currentStep += dir;
  document.querySelectorAll('.step-content')[currentStep].classList.add('active');
  updateNavigationButtons(currentStep);
}

// Validate the current step
function validateStep() {
  const inputs = document.querySelectorAll(`#step${currentStep} input, #step${currentStep} textarea, #step${currentStep} select`);
  for (const input of inputs) {
    if (input.hasAttribute('required') && !input.value.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
  }

  if (currentStep < totalSteps - 1) {
    changeStep(1);
  } else {
    saveFormData(); // Save data and redirect on the last step
  }
}

// Collect form data and save it to localStorage
function saveFormData() {
  const formData = {
    deviceName: document.getElementById('deviceName').value,
    deviceDescription: document.getElementById('deviceDescription').value,
    deviceType: document.getElementById('deviceType').value,
    appKey: document.getElementById('appKey').value,
    room: document.getElementById('room').value,
    home: document.getElementById('home').value,
    notifications: {
      alerts: document.getElementById('alertNotification').checked,
      connectDisconnect: document.getElementById('connectDisconnectNotification').checked,
      onOff: document.getElementById('onOffNotification').checked,
    },
    wattage: document.getElementById('deviceWattage').value || 'Not specified', // Optional field
  };

  // Save the data to localStorage
  localStorage.setItem('formData', JSON.stringify(formData));

  // Redirect to credential.php
  window.location.href = './credential.html';
}

// Firestore form submission
document.getElementById('multiStepForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Get values from form
  const deviceName = document.getElementById('deviceName').value.trim();
  const deviceDescription = document.getElementById('deviceDescription').value.trim();
  const deviceType = document.getElementById('deviceType').value;
  const appKey = document.getElementById('appKey').value.trim();
  const room = document.getElementById('room').value.trim();
  const home = document.getElementById('home').value.trim();
  const deviceWattage = document.getElementById('deviceWattage').value.trim();
  const alertNotification = document.getElementById('alertNotification').checked;
  const connectDisconnectNotification = document.getElementById('connectDisconnectNotification').checked;
  const onOffNotification = document.getElementById('onOffNotification').checked;

  // Get user Gmail from localStorage
  const usergmail = localStorage.getItem('currentUserEmail');
  const notificationDiv = document.getElementById('formNotification');
  if (!usergmail) {
    notificationDiv.textContent = 'User not logged in!';
    notificationDiv.style.color = 'red';
    return;
  } else {
    notificationDiv.textContent = '';
  }

  // Hash the email for the collection name
  const userCollection = await sha256(usergmail);

  // Prepare data
  const deviceData = {
    deviceName,
    deviceDescription,
    deviceType,
    appKey,
    home,
    deviceWattage: deviceWattage || null,
    alertNotification,
    connectDisconnectNotification,
    onOffNotification,
    devicestatus: "off"
  };

  try {
    // Use the hashed collection name
    const collectionRef = firestore.collection(userCollection);

    // Check for duplicate deviceName or appKey
    const deviceDoc = await collectionRef.doc(deviceName).get();
    if (deviceDoc.exists) {
      showToast('A device with this name already exists!', 'error');
      return;
    }

    // Check for same appKey
    const appKeyQuery = await collectionRef.where('appKey', '==', appKey).get();
    if (!appKeyQuery.empty) {
      showToast('A device with this App Key already exists!', 'error');
      return;
    }

    // If no duplicates, add the device
    await collectionRef.doc(deviceName).set({
      ...deviceData,
      room
    });

    // Save ALL device info to localStorage for credential.html
    localStorage.setItem('formData', JSON.stringify({
      deviceName,
      deviceDescription,
      deviceType,
      appKey,
      room,
      home,
      deviceWattage: deviceWattage || null,
      alertNotification,
      connectDisconnectNotification,
      onOffNotification
    }));

    showToast('Device details saved successfully!', 'success');
    setTimeout(() => {
      window.location.href = './credential.html';
    }, 1200);
    document.getElementById('multiStepForm').reset();
  } catch (error) {
    showToast('Failed to save device details.', 'error');
    console.error('Error saving device:', error);
  }
}); // <-- This closes the event listener!

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