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

    // 3. Toggle ESP assignment view (Admins see everything, normal users need mappings)
    isAdminCheckbox.addEventListener('change', () => {
        if (isAdminCheckbox.checked) {
            espContainer.style.opacity = '0.4';
            document.getElementById('assigned_esps').disabled = true;
            document.getElementById('assigned_esps').value = '';
            document.getElementById('assigned_esps').placeholder = 'Admins see all devices (not configurable)';
        } else {
            espContainer.style.opacity = '1';
            document.getElementById('assigned_esps').disabled = false;
            document.getElementById('assigned_esps').placeholder = 'e.g. AA:BB:CC:DD:EE:FF, 11:22:33:44:55:66';
        }
    });

    // 4. Toast Notification Controller
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

    // 5. Submit Event Handler
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newUsername = document.getElementById('username').value.trim();
        const newPassword = document.getElementById('password').value;
        const grantAdmin = isAdminCheckbox.checked;
        const rawEsps = document.getElementById('assigned_esps').value;

        // Form Validation
        if (!newUsername || !newPassword) {
            showToast('Username and password are required fields.', 'error');
            return;
        }

        // Parse and clean MAC Addresses if they are not superusers
        let assignedEsps = [];
        if (!grantAdmin && rawEsps) {
            assignedEsps = rawEsps
                .split(',')
                .map(mac => mac.trim())
                .filter(mac => mac.length > 0);
        }

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

    // 6. Logout Handler
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        showToast('Successfully logged out.', 'success');
        setTimeout(() => {
            window.location.href = '/api/auth/';
        }, 800);
    });
});
