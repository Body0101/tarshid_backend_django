/**
 * Tarshid IoT Building Management System
 * Login Logic & Session Manager
 * Author: kenana mohamed
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const errorBanner = document.getElementById('error-banner');
    const errorMessage = document.getElementById('error-message');

    // Simple helper to show/hide loading states
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.textContent = 'Authenticating...';
            btnSpinner.classList.remove('hidden');
            errorBanner.classList.add('hidden');
        } else {
            submitBtn.disabled = false;
            btnText.textContent = 'Sign In';
            btnSpinner.classList.add('hidden');
        }
    }

    // Form submission handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            errorMessage.textContent = 'Please enter both username and password.';
            errorBanner.classList.remove('hidden');
            return;
        }

        setLoading(true);

        try {
            // Call the login logic from API helper
            const data = await window.API.login(username, password);
            
            // Store credentials and session info locally
            localStorage.setItem('tarshid_token', data.token);
            localStorage.setItem('tarshid_username', data.username);
            localStorage.setItem('tarshid_is_admin', data.is_admin);

            // Redirect based on role
            if (data.is_admin) {
                window.location.href = '/api/auth/admin-panel/';
            } else {
                window.location.href = '/api/auth/dashboard/';
            }
        } catch (error) {
            console.error('Authentication Error:', error);
            // Display error beautifully
            errorMessage.textContent = error.message || 'Connection failure. Please try again.';
            errorBanner.classList.remove('hidden');
            setLoading(false);
        }
    });
});
