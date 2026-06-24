/**
 * Tarshid IoT Building Management System
 * Shared Secret Registration Logic
 * Author: kenana mohamed
 */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const errorBanner = document.getElementById('error-banner');
    const errorMessage = document.getElementById('error-message');
    const successBanner = document.getElementById('success-banner');
    const successMessage = document.getElementById('success-message');

    // Simple helper to show/hide loading states
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.textContent = 'Creating Account...';
            btnSpinner.classList.remove('hidden');
            errorBanner.classList.add('hidden');
            if (successBanner) successBanner.classList.add('hidden');
        } else {
            submitBtn.disabled = false;
            btnText.textContent = 'Sign Up';
            btnSpinner.classList.add('hidden');
        }
    }

    // Form submission handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const secretCode = document.getElementById('secret_code').value.trim();

        if (!username || !password || !secretCode) {
            errorMessage.textContent = 'Please fill out all fields.';
            errorBanner.classList.remove('hidden');
            return;
        }

        setLoading(true);

        try {
            // Call the register logic from API helper
            const data = await window.API.register(username, password, secretCode);
            
            // Display success message
            if (successBanner && successMessage) {
                successMessage.textContent = data.message || 'Registration successful!';
                successBanner.classList.remove('hidden');
            } else {
                alert(data.message || 'Registration successful!');
            }
            
            // Redirect to the login page after a brief delay
            setTimeout(() => {
                window.location.href = '/api/auth/';
            }, 1500);

        } catch (error) {
            console.error('Registration Error:', error);
            // Display error beautifully
            errorMessage.textContent = error.message || 'Registration failed. Please try again.';
            errorBanner.classList.remove('hidden');
            setLoading(false);
        }
    });
});
