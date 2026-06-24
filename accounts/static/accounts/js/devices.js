/**
 * Tarshid IoT Building Management System
 * Admin Devices Operations Handler
 * Author: kenana mohamed
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Route Guard: Restrict access to administrators only
    const token = localStorage.getItem('tarshid_token');
    const username = localStorage.getItem('tarshid_username');
    const isAdmin = localStorage.getItem('tarshid_is_admin');

    if (!token || isAdmin !== 'true') {
        localStorage.clear();
        window.location.href = '/api/auth/';
        return;
    }

    // Populate profile details
    if (username) {
        document.getElementById('admin-username').textContent = username;
        document.getElementById('admin-avatar').textContent = username.charAt(0).toUpperCase();
    }

    // DOM Selectors
    const tableLoading = document.getElementById('table-loading');
    const tableWrapper = document.getElementById('table-wrapper');
    const tableBody = document.getElementById('devices-table-body');
    const logoutBtn = document.getElementById('logout-btn');
    const toastContainer = document.getElementById('toast-container');

    // Modal DOM Elements
    const editModal = document.getElementById('edit-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('edit-device-form');

    const editMacAddress = document.getElementById('edit-mac-address');
    const editAlias = document.getElementById('edit-alias');
    const editFloor = document.getElementById('edit-floor');
    const editLocation = document.getElementById('edit-location');
    const relaysContainer = document.getElementById('relays-container');
    const sensorsContainer = document.getElementById('sensors-container');

    const saveDeviceBtn = document.getElementById('save-device-btn');
    const saveBtnText = document.getElementById('save-btn-text');
    const saveBtnSpinner = document.getElementById('save-btn-spinner');

    // Devices State Store
    let devicesList = [];

    // Toast Notification Controller
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `flex items-center p-4 rounded-xl border shadow-lg transform translate-y-2 opacity-0 transition-all duration-300 ${
            type === 'success'
                ? 'bg-slate-900 border-emerald-500/30 text-emerald-200'
                : 'bg-slate-900 border-red-500/30 text-red-200'
        }`;

        const icon = type === 'success'
            ? `<svg class="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            : `<svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;

        toast.innerHTML = `
            ${icon}
            <div class="text-sm font-medium">${message}</div>
        `;

        toastContainer.appendChild(toast);

        // Slide in
        setTimeout(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        }, 10);

        // Dismiss
        setTimeout(() => {
            toast.classList.add('opacity-0');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 4000);
    }

    // Modal Control functions
    function openModal(device) {
        editMacAddress.value = device.mac_address;
        editAlias.value = device.alias || '';
        editFloor.value = device.floor !== undefined ? device.floor : 0;
        editLocation.value = device.location || '';

        // Dynamic relays creation
        relaysContainer.innerHTML = '';
        if (device.relays && device.relays.length > 0) {
            device.relays.forEach(relay => {
                const item = document.createElement('div');
                item.className = "flex flex-col bg-slate-950/60 p-3 rounded-lg border border-slate-800";
                item.innerHTML = `
                    <label class="text-[10px] text-slate-500 font-bold uppercase mb-1">Pin ${relay.pin_number} (${relay.mode})</label>
                    <input type="text" data-relay-id="${relay.id}" value="${relay.alias || ''}" required
                        class="relay-alias-input bg-transparent border-b border-slate-800 focus:border-indigo-500 text-sm py-1 focus:outline-none text-white">
                `;
                relaysContainer.appendChild(item);
            });
        } else {
            relaysContainer.innerHTML = `<p class="col-span-2 text-slate-500 text-xs italic">No integrated relays found on this node.</p>`;
        }

        // Dynamic sensors creation
        sensorsContainer.innerHTML = '';
        if (device.pir_sensors && device.pir_sensors.length > 0) {
            device.pir_sensors.forEach(sensor => {
                const item = document.createElement('div');
                item.className = "flex flex-col bg-slate-950/60 p-3 rounded-lg border border-slate-800";
                item.innerHTML = `
                    <label class="text-[10px] text-slate-500 font-bold uppercase mb-1">GPIO Pin ${sensor.pin_number}</label>
                    <input type="text" data-sensor-id="${sensor.id}" value="${sensor.alias || ''}" required
                        class="sensor-alias-input bg-transparent border-b border-slate-800 focus:border-indigo-500 text-sm py-1 focus:outline-none text-white">
                `;
                sensorsContainer.appendChild(item);
            });
        } else {
            sensorsContainer.innerHTML = `<p class="col-span-2 text-slate-500 text-xs italic">No motion sensors configured on this node.</p>`;
        }

        editModal.classList.remove('hidden');
    }

    function closeModal() {
        editModal.classList.add('hidden');
        editForm.reset();
    }

    // Attach Modal toggles
    modalOverlay.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelEditBtn.addEventListener('click', closeModal);

    // Fetch and Load detailed configurations
    async function loadDevices() {
        tableLoading.classList.remove('hidden');
        tableWrapper.classList.add('hidden');
        tableBody.innerHTML = '';

        try {
            devicesList = await window.API.getDetailedDevices(token);

            if (devicesList.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-12 text-center text-slate-500 italic bg-slate-900/10">
                            No registered ESP32 nodes found in building database.
                        </td>
                    </tr>
                `;
            } else {
                devicesList.forEach(device => {
                    const row = document.createElement('tr');
                    row.className = "hover:bg-slate-900/30 transition duration-150";

                    // Floor string formatting
                    const floorLabel = device.floor === 0 ? 'Ground' : `Floor ${device.floor}`;

                    // Temperature formatting
                    const tempLabel = device.temperature !== null && device.temperature !== undefined
                        ? `<span class="text-amber-400 font-semibold font-mono text-xs">${parseFloat(device.temperature).toFixed(1)}°C</span>`
                        : `<span class="text-slate-600 italic text-xs">-</span>`;

                    // Online/Offline label
                    const statusLabel = device.is_online
                        ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Online</span>`
                        : `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Offline</span>`;

                    row.innerHTML = `
                        <td class="px-6 py-4 font-bold text-white">${device.alias || 'Unnamed Node'}</td>
                        <td class="px-6 py-4 font-mono text-xs text-slate-400">${device.mac_address}</td>
                        <td class="px-6 py-4 text-slate-300">${device.location || 'Not Specified'}</td>
                        <td class="px-6 py-4 text-slate-300">${floorLabel}</td>
                        <td class="px-6 py-4">${tempLabel}</td>
                        <td class="px-6 py-4">${statusLabel}</td>
                        <td class="px-6 py-4 text-right">
                            <button class="edit-btn px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 text-xs font-semibold transition duration-150"
                                data-mac="${device.mac_address}">
                                Edit Config
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Attach click listeners to edit buttons
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const mac = btn.dataset.mac;
                        const deviceObj = devicesList.find(d => d.mac_address === mac);
                        if (deviceObj) {
                            openModal(deviceObj);
                        }
                    });
                });
            }

            tableLoading.classList.add('hidden');
            tableWrapper.classList.remove('hidden');

        } catch (error) {
            console.error('Failed to load devices:', error);
            tableLoading.textContent = error.message || 'Error occurred while loading nodes data.';
            tableLoading.classList.remove('animate-pulse');
            tableLoading.classList.add('text-red-400');
        }
    }

    // Modal submit handler
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const mac = editMacAddress.value;
        const alias = editAlias.value.trim();
        const floor = editFloor.value;
        const location = editLocation.value.trim();

        // Gathers Relay updates
        const relays = [];
        document.querySelectorAll('.relay-alias-input').forEach(input => {
            relays.push({
                id: input.dataset.relayId,
                alias: input.value.trim()
            });
        });

        // Gathers PIR Sensor updates
        const sensors = [];
        document.querySelectorAll('.sensor-alias-input').forEach(input => {
            sensors.push({
                id: input.dataset.sensorId,
                alias: input.value.trim()
            });
        });

        // Loading states
        saveDeviceBtn.disabled = true;
        saveBtnText.textContent = 'Saving...';
        saveBtnSpinner.classList.remove('hidden');

        try {
            const payload = {
                alias,
                floor,
                location,
                relays,
                sensors
            };

            const response = await window.API.updateDeviceConfig(mac, payload, token);

            showToast(response.message || 'ESP node configurations saved.', 'success');
            closeModal();
            loadDevices(); // Refresh list

        } catch (error) {
            console.error('Save error:', error);
            showToast(error.message || 'Failed to update device configuration.', 'error');
        } finally {
            saveDeviceBtn.disabled = false;
            saveBtnText.textContent = 'Save Configuration';
            saveBtnSpinner.classList.add('hidden');
        }
    });

    // 8. Logout Event Trigger
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        showToast('Successfully logged out.', 'success');
        setTimeout(() => {
            window.location.href = '/api/auth/';
        }, 800);
    });

    // Initial table load
    loadDevices();
});
