// --- Device grid logic ---
async function fetchDevicesFromFirestore() {
    const userCollection = localStorage.getItem('currentUserEmailHash');
    if (!userCollection) return [];
    try {
        const snapshot = await firebase.firestore().collection(userCollection).get();
        const devices = [];
        snapshot.forEach(doc => {
            const data = doc.data();
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
  <div class="device-card" style="cursor:pointer;" onclick="viewDeviceDetails('${device.deviceName}')">
    <h3>${device.deviceName}</h3>
    <p><span class="status-dot ${device.status ? 'on' : 'off'}"></span>
      <strong>Status:</strong> <span id="status-text-${index}">${device.status ? 'On' : 'Off'}</span>
    </p>
    <p><strong>Room:</strong> ${device.room}</p>
    <p><strong>Home:</strong> ${device.home || ''}</p>
    <button onclick="event.stopPropagation();changeDeviceStatus('${device.deviceName}', ${device.status ? 'false' : 'true'}, ${index})">
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

window.changeDeviceStatus = async function(deviceName, newStatus, index) {
    const userCollection = localStorage.getItem('currentUserEmailHash');
    if (!userCollection) {
        showTopNotification("User not logged in!", "error");
        return;
    }
    try {
        const doc = await firebase.firestore().collection(userCollection).doc(deviceName).get();
        const deviceData = doc.exists ? doc.data() : {};
        const onOffNotification = deviceData.onOffNotification === true || deviceData.onOffNotification === "true";
        await firebase.firestore()
            .collection(userCollection)
            .doc(deviceName)
            .update({ devicestatus: newStatus ? "on" : "off" });
        const statusText = document.getElementById(`status-text-${index}`);
        if (statusText) statusText.textContent = newStatus ? "On" : "Off";
        renderDevices();
        if (onOffNotification) {
            showTopNotification(`Device "${deviceName}" turned ${newStatus ? "On" : "Off"}.`, "success");
        }
    } catch (err) {
        showTopNotification("Failed to update device status.", "error");
        console.error("Error updating device status:", err);
    }
};

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

window.modifyDevice = async function() {
    const devices = await fetchDevicesFromFirestore();
    if (devices.length === 0) {
        alert("No devices to modify.");
        return;
    }
    showDeviceSelection(devices, "modify", async (index) => {
        const device = devices[index];
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

window.viewDeviceDetails = function(deviceName) {
    localStorage.setItem('selectedDeviceName', deviceName);
    window.location.href = './../src/device-details.html';
};

window.addNewDevice = function() {
    window.location.href = './forms.html';
};

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