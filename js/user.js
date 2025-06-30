// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const logoutButton = document.querySelector('.logout-button');
const newAppointmentButton = document.querySelector('.new-appointment-button');

// Utility Functions
const hideLoadingScreen = () => {
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1500);
};

// Tab Switching
const switchTab = (tabId) => {
    tabButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.tab === tabId) {
            button.classList.add('active');
        }
    });

    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        }
    });
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    hideLoadingScreen();

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Simulate logout process
            showSuccess('Você saiu da sua conta com sucesso!');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    }

    // New appointment
    if (newAppointmentButton) {
        newAppointmentButton.addEventListener('click', () => {
            window.location.href = 'booking.html';
        });
    }
});

// Helper function from login.js
const showSuccess = (message) => {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #00f5ff, #39ff14);
        color: #000000;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0, 245, 255, 0.5);
        z-index: 10000;
        font-family: 'Bebas Neue', cursive;
        font-weight: 600;
        letter-spacing: 1px;
        animation: slideInRight 0.3s ease-out;
    `;
    successDiv.textContent = message;
    successDiv.setAttribute('role', 'alert');
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
        }, 300);
    }, 3000);
};