const output = document.getElementById('output');

// --- Logout logic ---
function logout() {
    // Remove user session info
    localStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('currentUserEmail');
    // Optionally clear devices if you want:
    // localStorage.removeItem('devices');
    // Redirect to login page (update path if needed)
    window.location.href = './login.html';
}

// Attach logout to button if present
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// --- Fetch username from Firestore based on logged-in user email ---
function getCurrentUserEmail() {
    return localStorage.getItem('currentUserEmail') || sessionStorage.getItem('currentUserEmail');
}

async function fetchAndDisplayUsername() {
    const email = getCurrentUserEmail();
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

// --- Fetch website/company details ---
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
        console.error("Error fetching website details:", err);
    }
}

// --- Device grid logic ---
// Fetch devices from Firestore where collection is usergmail and doc is device name
async function fetchDevicesFromFirestore() {
    const userCollection = localStorage.getItem('currentUserEmailHash');
    if (!userCollection) return [];
    try {
        const snapshot = await firebase.firestore().collection(userCollection).get();
        const devices = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Add a fallback for status if not present
            devices.push({
                ...data,
                status: typeof data.devicestatus === "string" ? data.devicestatus === "on" : !!data.status
            });
        });
        return devices;
    } catch (err) {
        console.error("Error fetching devices from Firestore:", err);
        return [];
    }
}

async function renderDevices() {
    const deviceGrid = document.getElementById('deviceGrid');
    if (!deviceGrid) {
        console.error("No element with id 'deviceGrid' found in the DOM.");
        return;
    }
    deviceGrid.innerHTML = '<div style="color:#888;">Loading devices...</div>';

    try {
        const devices = await fetchDevicesFromFirestore();
        deviceGrid.innerHTML = '';
        if (devices.length === 0) {
            deviceGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#888; font-size:1.1rem;">No devices found. Click "Add New Device" to get started!</div>`;
            return;
        }
        devices.forEach((device, index) => {
            deviceGrid.innerHTML += `
              <div class="device-card">
                <h3>${device.deviceName}</h3>
                <p><span class="status-dot ${device.status ? 'on' : 'off'}"></span>
                  <strong>Status:</strong> <span id="status-text-${index}">${device.status ? 'On' : 'Off'}</span>
                </p>
                <p><strong>Room:</strong> ${device.room}</p>
                <p><strong>Home:</strong> ${device.home || ''}</p>
                <button onclick="changeDeviceStatus('${device.deviceName}', ${device.status ? 'false' : 'true'}, ${index})">
                  Turn ${device.status ? 'Off' : 'On'}
                </button>
              </div>
            `;
        });
    } catch (err) {
        console.error("Error rendering devices:", err);
        deviceGrid.innerHTML = `<div style="color:red;">Error loading devices. Check console for details.</div>`;
    }
}

// Add this function to handle status change
window.changeDeviceStatus = async function(deviceName, newStatus, index) {
    const userCollection = localStorage.getItem('currentUserEmailHash');
    if (!userCollection) {
        alert("User not logged in!");
        return;
    }
    try {
        await firebase.firestore()
            .collection(userCollection)
            .doc(deviceName)
            .update({ devicestatus: newStatus ? "on" : "off" });

        // Optionally update the UI immediately
        const statusText = document.getElementById(`status-text-${index}`);
        if (statusText) statusText.textContent = newStatus ? "On" : "Off";
        renderDevices();
    } catch (err) {
        alert("Failed to update device status.");
        console.error("Error updating device status:", err);
    }
};

// Helper to show a device selection modal (basic implementation)
function showDeviceSelection(devices, action, onSelect) {
    const modalId = 'device-selection-modal';
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';

    let html = `<div style="background:#fff;padding:2em;border-radius:8px;min-width:300px;">
        <h3>Select device to ${action}</h3>
        <ul style="list-style:none;padding:0;">`;
    devices.forEach((d, i) => {
        html += `<li style="margin-bottom:1em;">
            <button style="width:100%;padding:0.5em;" data-index="${i}">${d.deviceName}</button>
        </li>`;
    });
    html += `</ul>
        <button id="closeDeviceModal" style="margin-top:1em;">Cancel</button>
    </div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);

    modal.querySelectorAll('button[data-index]').forEach(btn => {
        btn.onclick = () => {
            onSelect(parseInt(btn.getAttribute('data-index')));
            modal.remove();
        };
    });
    modal.querySelector('#closeDeviceModal').onclick = () => modal.remove();
}

// Delete device from Firestore and refresh UI
window.deleteDevice = async function() {
    const devices = await fetchDevicesFromFirestore();
    if (devices.length === 0) {
        alert("No devices to delete.");
        return;
    }
    showDeviceSelection(devices, "delete", async (index) => {
        const device = devices[index];
        const userCollection = localStorage.getItem('currentUserEmailHash');
        if (!userCollection) {
            alert("User not logged in!");
            return;
        }
        if (confirm(`Are you sure you want to delete "${device.deviceName}"?`)) {
            try {
                await firebase.firestore().collection(userCollection).doc(device.deviceName).delete();
                alert("Device deleted.");
                renderDevices();
            } catch (err) {
                alert("Failed to delete device.");
                console.error("Error deleting device:", err);
            }
        }
    });
};

// Modify device in Firestore and refresh UI
window.modifyDevice = async function() {
    const devices = await fetchDevicesFromFirestore();
    if (devices.length === 0) {
        alert("No devices to modify.");
        return;
    }
    showDeviceSelection(devices, "modify", async (index) => {
        const device = devices[index];
        // Show a simple form for editing device details
        const modalId = 'device-modify-modal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = modalId;
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';

        modal.innerHTML = `
        <form id="modifyDeviceForm" style="background:#fff;padding:2em;border-radius:8px;min-width:300px;">
            <h3>Modify Device</h3>
            <label>Device Name:<br>
                <input type="text" name="deviceName" value="${device.deviceName}" required>
            </label><br><br>
            <label>Room:<br>
                <input type="text" name="room" value="${device.room || ''}">
            </label><br><br>
            <label>Home:<br>
                <input type="text" name="home" value="${device.home || ''}">
            </label><br><br>
            <label>Status:<br>
                <select name="status">
                    <option value="on" ${device.status ? "selected" : ""}>On</option>
                    <option value="off" ${!device.status ? "selected" : ""}>Off</option>
                </select>
            </label><br><br>
            <button type="submit">Save</button>
            <button type="button" id="cancelModifyDevice" style="margin-left:1em;">Cancel</button>
        </form>
        `;
        document.body.appendChild(modal);

        document.getElementById('cancelModifyDevice').onclick = () => modal.remove();

        document.getElementById('modifyDeviceForm').onsubmit = async function(e) {
            e.preventDefault();
            const form = e.target;
            const newName = form.deviceName.value.trim();
            const newRoom = form.room.value.trim();
            const newHome = form.home.value.trim();
            const newStatus = form.status.value === "on" ? "on" : "off";
            const userCollection = localStorage.getItem('currentUserEmailHash');
            if (!userCollection) {
                alert("User not logged in!");
                return;
            }
            try {
                // If device name changed, delete old doc and create new one
                if (newName !== device.deviceName) {
                    const updatedDevice = { ...device, deviceName: newName, room: newRoom, home: newHome, devicestatus: newStatus };
                    await firebase.firestore().collection(userCollection).doc(device.deviceName).delete();
                    await firebase.firestore().collection(userCollection).doc(newName).set(updatedDevice);
                } else {
                    await firebase.firestore().collection(userCollection).doc(device.deviceName).update({
                        deviceName: newName,
                        room: newRoom,
                        home: newHome,
                        devicestatus: newStatus
                    });
                }
                alert("Device details updated.");
                modal.remove();
                renderDevices();
            } catch (err) {
                alert("Failed to update device.");
                console.error("Error updating device:", err);
            }
        };
    });
};

window.toggleDeviceStatus = function(index) {
    const devices = getDevices();
    if (devices[index]) {
        devices[index].status = !devices[index].status;
        setDevices(devices);
        renderDevices();
    }
};

window.addNewDevice = function() {
    window.location.href = './forms.html';
};

// --- Theme toggle logic ---
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

// --- On page load ---
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    fetchAndDisplayUsername();
    renderDevices();
    fetchWebsiteDetails();
});
