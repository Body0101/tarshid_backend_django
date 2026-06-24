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
    },

    /**
     * Public endpoint to register a new standard user using a shared secret code.
     * @param {string} username 
     * @param {string} password 
     * @param {string} secret_code 
     * @returns {Promise<object>} Status and success message
     */
    async register(username, password, secret_code) {
        const response = await fetch(`${API_BASE_URL}/api/auth/register_api/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, secret_code })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Registration failed');
        }

        return await response.json();
    },

    /**
     * Admin-only endpoint to fetch all ESP devices for the interactive device map.
     * @param {string} token Admin authentication token
     * @returns {Promise<Array>} List of ESP device objects with mac_address, alias, floor, location, is_online
     */
    async getDevices(token) {
        const response = await fetch(`${API_BASE_URL}/api/device/all/`, {
            method: 'GET',
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch devices map');
        return await response.json();
    },

    async getMyDevices(token) {
        const response = await fetch(`${API_BASE_URL}/api/device/my-devices/`, {
            method: 'GET',
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch devices');
        return await response.json();
    },

    async getDetailedDevices(token) {
        const response = await fetch(`${API_BASE_URL}/api/device/manage/`, {
            method: 'GET',
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch detailed devices');
        return await response.json();
    },

    async updateDeviceConfig(mac, payload, token) {
        const response = await fetch(`${API_BASE_URL}/api/device/manage/${mac}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to update device config');
        }
        return await response.json();
    }
};

// Export to window object for global script usage
window.API = API;
