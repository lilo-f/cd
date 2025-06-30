class UserSession {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('ravenStudioCurrentUser')) || null;
        this.init();
    }

    init() {
        this.updateNavbar();
        this.loadUserData();
    }

    login(userData) {
        this.currentUser = userData;
        localStorage.setItem('ravenStudioCurrentUser', JSON.stringify(userData));
        this.updateNavbar();
        this.loadUserData();
        this.showNotification('Login realizado com sucesso!');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('ravenStudioCurrentUser');
        this.updateNavbar();
        window.location.href = '/pages/home.html';
    }

    updateNavbar() {
        const navUser = document.querySelector('.nav-icons a[href="/pages/login.html"]');
        if (!navUser) return;

        if (this.currentUser) {
            navUser.href = '/pages/user.html';
            navUser.innerHTML = this.currentUser.avatar 
                ? `<img src="${this.currentUser.avatar}" alt="Avatar" style="width: 20px; height: 20px; border-radius: 50%;">`
                : `<i class="fas fa-user"></i>`;
        } else {
            navUser.href = '/pages/login.html';
            navUser.innerHTML = '<i class="fas fa-user"></i>';
        }
    }

    loadUserData() {
        if (!this.currentUser) return;

        // Atualizar avatar na página do usuário
        if (document.getElementById('user-avatar')) {
            const avatarImg = document.getElementById('user-avatar');
            const defaultIcon = document.getElementById('default-avatar-icon');
            
            if (this.currentUser.avatar) {
                avatarImg.src = this.currentUser.avatar;
                avatarImg.style.display = 'block';
                defaultIcon.style.display = 'none';
            } else {
                avatarImg.style.display = 'none';
                defaultIcon.style.display = 'flex';
            }
        }

        // Atualizar blog com dados do usuário
        if (document.getElementById('current-user-avatar')) {
            const userAvatar = document.getElementById('current-user-avatar');
            if (this.currentUser.avatar) {
                userAvatar.innerHTML = `<img src="${this.currentUser.avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                userAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
            }
            document.getElementById('current-user-name').textContent = this.currentUser.name;
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3b82f6, #22c55e);
            color: #000;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            font-family: 'Bebas Neue', cursive;
            font-size: 1.2rem;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.userSession = new UserSession();
});