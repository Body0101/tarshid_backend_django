/**
 * Tarshid IoT Building Management System
 * API Communication & Client Handler
 * Author: kenana mohamed
 */

// Central backend base URL config
// Since frontend and backend are now on the same server, we use window.location.origin
const API_BASE_URL = window.location.origin;

const API = {
    /**
     * Authenticates credentials with the backend.
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<object>} Token, username, and is_admin flag
     */
    async login(username, password) {
        const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Invalid Credentials');
        }

        return await response.json();
    },

    /**
     * Admin-only endpoint to register a new user and map ESP32 devices to their profile.
     * @param {object} userData { username, password, is_admin, assigned_esps }
     * @param {string} token Admin authentication token
     * @returns {Promise<object>} Status, success message, and assigned count
     */
    async createUser(userData, token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/create_user/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to create user');
        }

        return await response.json();
    }
};

// Export to window object for global script usage
window.API = API;
