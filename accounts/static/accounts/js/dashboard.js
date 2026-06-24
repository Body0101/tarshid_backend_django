/**
 * Tarshid IoT Building Management System
 * User Dashboard Operations Handler
 * Author: Abdulrahman Saber
 */

document.addEventListener('DOMContentLoaded', () => {
    // Guard
    const token = localStorage.getItem('tarshid_token');
    const username = localStorage.getItem('tarshid_username');
    
    if (!token) {
        localStorage.clear();
        window.location.href = '/api/auth/';
        return;
    }

    if (username) {
        document.getElementById('user-display').textContent = `Welcome, ${username}`;
    }

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/api/auth/';
    });

    // Fetch and render devices
    fetchAndRenderDevices(token);
});

async function fetchAndRenderDevices(token) {
    const grid = document.getElementById('devices-grid');
    if (!grid) return;

    // Show loading indicator
    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
            <p class="text-slate-400 text-sm">Loading your devices...</p>
        </div>
    `;

    try {
        const devices = await API.getMyDevices(token);

        if (!devices || devices.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-16 bg-slate-900/20 border border-slate-800/60 rounded-2xl p-8 backdrop-blur-sm max-w-lg mx-auto">
                    <div class="inline-flex p-4 rounded-full bg-slate-800/50 text-slate-500 mb-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2">No Devices Found</h3>
                    <p class="text-slate-400 text-sm">There are no IoT devices mapped to your account yet. Please contact an administrator to assign devices to your profile.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = ''; // Clear loading

        devices.forEach(device => {
            const card = document.createElement('div');
            // Premium glassmorphism layout
            card.className = "relative p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md hover:border-slate-700/60 transition duration-300 shadow-xl flex flex-col justify-between overflow-hidden group";
            
            // Subtle ambient background glow on hover
            const hoverGlow = document.createElement('div');
            hoverGlow.className = "absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none";
            card.appendChild(hoverGlow);

            // Device Status indicator (top right)
            const statusIndicator = document.createElement('div');
            statusIndicator.className = "absolute top-6 right-6 flex items-center justify-center";
            if (device.is_online) {
                statusIndicator.innerHTML = `
                    <span class="relative flex h-2.5 w-2.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                `;
            } else {
                statusIndicator.innerHTML = `
                    <span class="h-2.5 w-2.5 rounded-full bg-rose-500/70"></span>
                `;
            }

            // Card content container
            const content = document.createElement('div');
            content.className = "relative z-10 flex-grow flex flex-col justify-between";

            // Header details
            const headerDetails = document.createElement('div');
            
            // Title
            const title = document.createElement('h3');
            title.className = "text-lg font-bold text-white mb-1 pr-6 truncate";
            title.textContent = device.alias || 'Unnamed Device';
            headerDetails.appendChild(title);

            // Subtitle
            const subtitle = document.createElement('p');
            subtitle.className = "text-xs text-slate-400 font-semibold tracking-wide uppercase mb-3";
            const floorText = device.floor === 0 ? 'Ground Floor' : `Floor ${device.floor}`;
            subtitle.textContent = `${floorText} • ${device.location || 'Unknown Location'}`;
            headerDetails.appendChild(subtitle);

            // Device MAC Address
            const macInfo = document.createElement('div');
            macInfo.className = "flex items-center text-[10px] text-slate-500 font-mono mb-6 bg-slate-950/40 px-2 py-1 rounded w-fit border border-slate-900";
            macInfo.textContent = device.mac_address;
            headerDetails.appendChild(macInfo);

            content.appendChild(headerDetails);

            // Active Relays section
            const relaysSection = document.createElement('div');
            relaysSection.className = "mt-auto pt-4 border-t border-slate-800/60";
            
            const relaysLabel = document.createElement('h4');
            relaysLabel.className = "text-xs font-semibold text-slate-400 mb-3";
            relaysLabel.textContent = "Active Relays";
            relaysSection.appendChild(relaysLabel);

            const activeRelays = device.active_relays || [];
            if (activeRelays.length === 0) {
                const noRelaysText = document.createElement('p');
                noRelaysText.className = "text-slate-500 text-xs italic py-1";
                noRelaysText.textContent = "No active relays";
                relaysSection.appendChild(noRelaysText);
            } else {
                const badgeContainer = document.createElement('div');
                badgeContainer.className = "flex flex-wrap gap-2";

                activeRelays.forEach(relay => {
                    const badge = document.createElement('span');
                    badge.className = "inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md border transition duration-200";
                    
                    // Set mode-specific styles
                    if (relay.mode === 'MANUAL') {
                        badge.className += " bg-amber-400/10 text-amber-400 border-amber-500/20";
                    } else if (relay.mode === 'AUTO') {
                        badge.className += " bg-sky-400/10 text-sky-400 border-sky-500/20";
                    } else if (relay.mode === 'TIMER') {
                        badge.className += " bg-purple-400/10 text-purple-400 border-purple-500/20";
                    } else {
                        badge.className += " bg-slate-400/10 text-slate-400 border-slate-500/20";
                    }
                    
                    badge.innerHTML = `
                        <span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        <span>${relay.alias} (${relay.mode})</span>
                    `;
                    badgeContainer.appendChild(badge);
                });

                relaysSection.appendChild(badgeContainer);
            }

            content.appendChild(relaysSection);
            card.appendChild(statusIndicator);
            card.appendChild(content);
            grid.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = `
            <div class="col-span-full text-center py-16 bg-red-950/10 border border-red-500/20 rounded-2xl p-8 backdrop-blur-sm max-w-lg mx-auto">
                <div class="inline-flex p-4 rounded-full bg-red-950/20 text-red-400 mb-4 border border-red-500/20">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
                <p class="text-red-300 text-sm mb-4">${error.message || 'Failed to communicate with API server.'}</p>
                <button onclick="window.location.reload()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition duration-200">
                    Retry Now
                </button>
            </div>
        `;
    }
}
