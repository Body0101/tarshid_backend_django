/**
 * Tarshid IoT Building Management System
 * Admin Dashboard - Controller
 * Author: kenana mohamed
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Route Guard: Restrict access to administrators only
    const token = localStorage.getItem('tarshid_token');
    const username = localStorage.getItem('tarshid_username');
    const isAdmin = localStorage.getItem('tarshid_is_admin');

    if (!token || isAdmin !== 'true') {
        // Clear session and boot back to login screen
        localStorage.clear();
        window.location.href = '/api/auth/';
        return;
    }

    // Populate admin profile widget elements
    if (username) {
        document.getElementById('admin-username').textContent = username;
        document.getElementById('admin-avatar').textContent = username.charAt(0).toUpperCase();
    }

    // 2. DOM Selectors
    const createForm = document.getElementById('create-user-form');
    const isAdminCheckbox = document.getElementById('is_admin');
    const espContainer = document.getElementById('esp-assignment-container');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const logoutBtn = document.getElementById('logout-btn');
    const toastContainer = document.getElementById('toast-container');

    // 3. Interactive Device Map State
    let selectedMacs = new Set();

    // 4. Toggle ESP assignment view (Admins see everything, normal users need mappings)
    isAdminCheckbox.addEventListener('change', () => {
        if (isAdminCheckbox.checked) {
            espContainer.style.opacity = '0.4';
            espContainer.style.pointerEvents = 'none';
            // Deselect all cards visually
            selectedMacs.clear();
            document.querySelectorAll('.device-card').forEach(card => {
                card.classList.remove('border-indigo-500', 'bg-indigo-500/10');
                card.classList.add('border-slate-700', 'bg-slate-800/50');
            });
        } else {
            espContainer.style.opacity = '1';
            espContainer.style.pointerEvents = 'auto';
        }
    });

    // 5. Load Device Map from API
    async function loadDeviceMap() {
        const espMapLoading = document.getElementById('esp-map-loading');
        const espMap = document.getElementById('esp-map');

        try {
            const devices = await window.API.getDevices(token);

            // Group devices by floor
            const floors = {};
            devices.forEach(device => {
                const floorKey = device.floor;
                if (!floors[floorKey]) {
                    floors[floorKey] = [];
                }
                floors[floorKey].push(device);
            });

            // Generate HTML for each floor group
            let mapHTML = '';
            const sortedFloors = Object.keys(floors).sort((a, b) => Number(a) - Number(b));

            if (sortedFloors.length === 0) {
                mapHTML = `
                    <div class="text-center py-8">
                        <svg class="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                        </svg>
                        <p class="text-slate-500 text-sm font-medium">No ESP devices registered yet.</p>
                        <p class="text-slate-600 text-xs mt-1">Devices will appear here once they register with the system.</p>
                    </div>
                `;
            } else {
                sortedFloors.forEach(floorKey => {
                    const floorLabel = Number(floorKey) === 0 ? 'Ground Floor' : `Floor ${floorKey}`;
                    const floorDevices = floors[floorKey];

                    mapHTML += `
                        <div>
                            <div class="flex items-center space-x-2 mb-3">
                                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                <h4 class="text-sm font-bold text-indigo-300 uppercase tracking-wider">${floorLabel}</h4>
                                <span class="text-xs text-slate-500">(${floorDevices.length} device${floorDevices.length > 1 ? 's' : ''})</span>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    `;

                    floorDevices.forEach(device => {
                        const statusDot = device.is_online
                            ? '<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>'
                            : '<span class="w-2 h-2 rounded-full bg-slate-600 inline-block"></span>';

                        const statusText = device.is_online
                            ? '<span class="text-emerald-400 text-xs">Online</span>'
                            : '<span class="text-slate-500 text-xs">Offline</span>';

                        mapHTML += `
                            <div class="device-card cursor-pointer select-none p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-slate-600 transition-all duration-200"
                                 data-mac="${device.mac_address}">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="text-sm font-semibold text-white truncate">${device.alias || device.mac_address}</span>
                                    <div class="flex items-center space-x-1.5">
                                        ${statusDot}
                                        ${statusText}
                                    </div>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-xs text-slate-400 truncate">${device.location || 'No location set'}</span>
                                    <span class="text-xs text-slate-500 font-mono">${device.mac_address}</span>
                                </div>
                            </div>
                        `;
                    });

                    mapHTML += `
                            </div>
                        </div>
                    `;
                });
            }

            espMap.innerHTML = mapHTML;
            espMapLoading.classList.add('hidden');
            espMap.classList.remove('hidden');

            // Attach click handlers to device cards
            document.querySelectorAll('.device-card').forEach(card => {
                card.addEventListener('click', () => {
                    const mac = card.dataset.mac;
                    if (selectedMacs.has(mac)) {
                        selectedMacs.delete(mac);
                        card.classList.remove('border-indigo-500', 'bg-indigo-500/10');
                        card.classList.add('border-slate-700', 'bg-slate-800/50');
                    } else {
                        selectedMacs.add(mac);
                        card.classList.remove('border-slate-700', 'bg-slate-800/50');
                        card.classList.add('border-indigo-500', 'bg-indigo-500/10');
                    }
                });
            });

        } catch (error) {
            console.error('Failed to load device map:', error);
            espMapLoading.textContent = 'Failed to load device map. Please refresh.';
            espMapLoading.classList.remove('animate-pulse');
            espMapLoading.classList.add('text-red-400');
        }
    }

    // Load the device map on page load
    loadDeviceMap();

    // 6. Toast Notification Controller
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

        // Animation: Fade / Slide In
        setTimeout(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        }, 10);

        // Animation: Dismiss and delete after 4 seconds
        setTimeout(() => {
            toast.classList.add('opacity-0');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 4000);
    }

    // 7. Submit Event Handler
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newUsername = document.getElementById('username').value.trim();
        const newPassword = document.getElementById('password').value;
        const grantAdmin = isAdminCheckbox.checked;

        // Form Validation
        if (!newUsername || !newPassword) {
            showToast('Username and password are required fields.', 'error');
            return;
        }

        // Use selected MACs from the interactive device map
        let assignedEsps = grantAdmin ? [] : Array.from(selectedMacs);

        // Loading states
        submitBtn.disabled = true;
        btnText.textContent = 'Registering...';
        btnSpinner.classList.remove('hidden');

        try {
            const payload = {
                username: newUsername,
                password: newPassword,
                is_admin: grantAdmin,
                assigned_esps: assignedEsps
            };

            // Call API helper to register the user
            const response = await window.API.createUser(payload, token);

            showToast(response.message || `User ${newUsername} created successfully.`, 'success');
            createForm.reset();

            // Clear selected devices and reset the UI cards
            selectedMacs.clear();
            document.querySelectorAll('.device-card').forEach(card => {
                card.classList.remove('border-indigo-500', 'bg-indigo-500/10');
                card.classList.add('border-slate-700', 'bg-slate-800/50');
            });

            // Trigger resetting values manually to ensure UI changes back
            isAdminCheckbox.dispatchEvent(new Event('change'));
        } catch (error) {
            console.error('Registration Error:', error);
            showToast(error.message || 'Unable to register user.', 'error');
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Register User';
            btnSpinner.classList.add('hidden');
        }
    });

    // 8. Logout Handler
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        showToast('Successfully logged out.', 'success');
        setTimeout(() => {
            window.location.href = '/api/auth/';
        }, 800);
    });
});
