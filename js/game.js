// Jogo Raven Studio - Ink Adventure
// Refeito em JavaScript puro com foco na experiência visual e gameplay fluida

class RavenGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Estado do jogo
        this.gameState = 'menu'; // menu, playing, paused, gameOver, levelComplete
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        
        // Player com física melhorada
        this.player = {
            x: 100,
            y: 400,
            width: 40,
            height: 50,
            velX: 0,
            velY: 0,
            speed: 6, // Aumentado para melhor controle
            jumpPower: 16, // Aumentado para pulos mais confortáveis
            onGround: false,
            onPlatform: false, // Nova flag para controle de plataformas
            currentPlatform: null, // Referência da plataforma atual
            facing: 'right',
            isMoving: false,
            isCrouching: false,
            invulnerable: false,
            invulnerableTime: 0,
            coyoteTime: 0, // Tempo extra para pular após sair da plataforma
            jumpBuffer: 0 // Buffer para input de pulo
        };
        
        // Controles
        this.keys = {};
        this.setupControls();
        this.setupUI();
        
        // Elementos do jogo
        this.inkBottles = [];
        this.obstacles = [];
        this.platforms = [];
        this.particles = [];
        
        // Configurações do mundo melhoradas
        this.gravity = 0.6; // Reduzido para controle mais suave
        this.groundY = this.canvas.height - 80;
        this.itemsToCollect = 0;
        this.cameraX = 0; // Sistema de câmera para mundo maior
        
        // Inicializar jogo
        this.init();
    }
    
    setupCanvas() {
        // Ajustar canvas para tela
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.groundY = this.canvas.height - 80;
    }
    
    setupControls() {
        // Controles de teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.player.jumpBuffer = 10; // Buffer de pulo
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Controles mobile
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const downBtn = document.getElementById('downBtn');
        const jumpBtn = document.getElementById('jumpBtn');
        
        // Touch events para mobile
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = false;
        });
        
        downBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowDown'] = true;
        });
        downBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowDown'] = false;
        });
        
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['Space'] = true;
            this.player.jumpBuffer = 10;
        });
        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['Space'] = false;
        });
    }
    
    setupUI() {
        // Botões do menu
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('instructionsBtn').addEventListener('click', () => this.showInstructions());
        document.getElementById('backBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.showMenu());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('copyCodeBtn').addEventListener('click', () => this.copyCouponCode());
    }
    
    init() {
        this.showMenu();
        this.gameLoop();
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.hideAllMenus();
        document.getElementById('startMenu').classList.add('active');
    }
    
    showInstructions() {
        this.hideAllMenus();
        document.getElementById('instructionsMenu').classList.add('active');
    }
    
    hideAllMenus() {
        const menus = document.querySelectorAll('.menu-screen');
        menus.forEach(menu => menu.classList.remove('active'));
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideAllMenus();
        this.resetPlayer();
        this.initLevel();
    }
    
    resetPlayer() {
        this.player.x = 100;
        this.player.y = this.groundY - this.player.height;
        this.player.velX = 0;
        this.player.velY = 0;
        this.player.onGround = true;
        this.player.onPlatform = false;
        this.player.currentPlatform = null;
        this.player.invulnerable = false;
        this.player.invulnerableTime = 0;
        this.player.coyoteTime = 0;
        this.player.jumpBuffer = 0;
        this.cameraX = 0;
    }
    
    initLevel() {
        // Limpar arrays
        this.inkBottles = [];
        this.obstacles = [];
        this.platforms = [];
        this.particles = [];
        
        // Criar tintas para coletar (quantidade mais balanceada)
        const inkColors = ['#00ff88', '#6B46C1', '#fbbf24', '#dc2626'];
        const inkCount = Math.min(4 + this.level, 8); // Máximo 8 itens
        this.itemsToCollect = inkCount;
        
        // Distribuir itens de forma mais acessível
        for (let i = 0; i < inkCount; i++) {
            this.inkBottles.push({
                x: 300 + i * 250 + Math.random() * 50, // Mais espaçados
                y: this.groundY - 100 - Math.random() * 60, // Altura mais acessível
                width: 30, // Ligeiramente maiores
                height: 30,
                color: inkColors[Math.floor(Math.random() * inkColors.length)],
                collected: false,
                float: Math.random() * Math.PI * 2,
                id: i
            });
        }
        
        // Criar plataformas com lógica progressiva
        this.createPlatforms();
        
        // Criar obstáculos estilo Mario com progressão
        this.createPlatformerObstacles();
        
        this.updateUI();
    }
    
    createPlatforms() {
        // Plataformas essenciais para acessibilidade
        const platformCount = 3 + Math.floor(this.level / 2);
        
        for (let i = 0; i < platformCount; i++) {
            const isMoving = i > 2 && Math.random() > 0.4; // Nem todas se movem
            
            this.platforms.push({
                x: 200 + i * 300,
                y: this.groundY - 120 - Math.random() * 80,
                width: 140, // Plataformas maiores
                height: 24,
                velX: isMoving ? (Math.random() > 0.5 ? 1 : -1) * (0.8 + this.level * 0.2) : 0,
                style: 'metal',
                isMoving: isMoving,
                originalX: 200 + i * 300,
                range: 80 // Alcance do movimento
            });
        }
        
        // Plataformas de segurança extras nos primeiros níveis
        if (this.level <= 2) {
            for (let i = 0; i < 2; i++) {
                this.platforms.push({
                    x: 500 + i * 400,
                    y: this.groundY - 60,
                    width: 100,
                    height: 20,
                    velX: 0,
                    style: 'safety',
                    isMoving: false
                });
            }
        }
    }
    
    createPlatformerObstacles() {
        const obstacleTypes = ['pit', 'spike', 'goomba', 'movingSpike', 'floatingSpike'];
        const baseObstacles = 2 + this.level;
        const maxObstacles = Math.min(baseObstacles, 8);
        
        for (let i = 0; i < maxObstacles; i++) {
            const x = 400 + i * 200 + Math.random() * 100;
            
            // Progressão de dificuldade
            let availableTypes = obstacleTypes.slice(0, Math.min(2 + Math.floor(this.level / 2), obstacleTypes.length));
            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            
            switch (type) {
                case 'pit':
                    // Buracos no chão - clássico Mario
                    this.obstacles.push({
                        type: 'pit',
                        x: x,
                        y: this.groundY,
                        width: 80,
                        height: 80,
                        dangerous: true
                    });
                    break;
                    
                case 'spike':
                    // Espinhos fixos no chão
                    this.obstacles.push({
                        type: 'spike',
                        x: x,
                        y: this.groundY - 25,
                        width: 40,
                        height: 25,
                        dangerous: true,
                        pattern: 'ground'
                    });
                    break;
                    
                case 'goomba':
                    // Inimigo que anda (estilo Mario)
                    this.obstacles.push({
                        type: 'goomba',
                        x: x,
                        y: this.groundY - 40,
                        width: 30,
                        height: 40,
                        velX: (Math.random() > 0.5 ? 1 : -1) * (1 + this.level * 0.3),
                        dangerous: true,
                        originalX: x,
                        range: 150,
                        direction: 1
                    });
                    break;
                    
                case 'movingSpike':
                    // Espinhos que se movem verticalmente
                    if (this.level >= 2) {
                        this.obstacles.push({
                            type: 'movingSpike',
                            x: x,
                            y: this.groundY - 150,
                            width: 35,
                            height: 25,
                            velY: 1.5,
                            dangerous: true,
                            originalY: this.groundY - 150,
                            range: 100,
                            direction: 1
                        });
                    }
                    break;
                    
                case 'floatingSpike':
                    // Espinhos flutuantes (níveis avançados)
                    if (this.level >= 3) {
                        this.obstacles.push({
                            type: 'floatingSpike',
                            x: x,
                            y: this.groundY - 200,
                            width: 30,
                            height: 30,
                            velX: (Math.random() > 0.5 ? 1 : -1) * 0.8,
                            velY: Math.sin(Date.now() * 0.01) * 2,
                            dangerous: true,
                            float: 0
                        });
                    }
                    break;
            }
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.updateObstacles();
        this.updatePlatforms();
        this.updateCamera();
        this.updateParticles();
        this.checkCollisions();
        this.updateUI();
        
        // Verificar condições de vitória/derrota
        if (this.inkBottles.every(ink => ink.collected)) {
            this.levelComplete();
        }
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    updatePlayer() {
        // Sistema de controles melhorado
        this.player.isMoving = false;
        
        // Movimentação horizontal
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.velX = Math.max(this.player.velX - 0.8, -this.player.speed);
            this.player.facing = 'left';
            this.player.isMoving = true;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.velX = Math.min(this.player.velX + 0.8, this.player.speed);
            this.player.facing = 'right';
            this.player.isMoving = true;
        } else {
            // Atrito suave
            this.player.velX *= 0.82;
            if (Math.abs(this.player.velX) < 0.1) this.player.velX = 0;
        }
        
        // Sistema de pulo melhorado com coyote time e jump buffer
        this.player.coyoteTime--;
        this.player.jumpBuffer--;
        
        if (this.player.onGround || this.player.onPlatform) {
            this.player.coyoteTime = 8; // 8 frames de coyote time
        }
        
        const canJump = (this.player.onGround || this.player.onPlatform || this.player.coyoteTime > 0) && this.player.jumpBuffer > 0;
        
        if (canJump) {
            this.player.velY = -this.player.jumpPower;
            this.player.onGround = false;
            this.player.onPlatform = false;
            this.player.currentPlatform = null;
            this.player.coyoteTime = 0;
            this.player.jumpBuffer = 0;
            this.createParticle(this.player.x + this.player.width/2, this.player.y + this.player.height, '#00ff88', 'jump');
        }
        
        // Pulo variável (segurando vs. tap)
        if (!this.keys['Space'] && !this.keys['ArrowUp'] && !this.keys['KeyW'] && this.player.velY < 0) {
            this.player.velY *= 0.8; // Pulo mais baixo se soltar rapidamente
        }
        
        // Agachar
        this.player.isCrouching = this.keys['ArrowDown'] || this.keys['KeyS'];
        
        // Aplicar gravidade sempre que não estiver no chão ou numa plataforma
        if (!this.player.onGround && !this.player.onPlatform) {
            this.player.velY += this.gravity;
            this.player.velY = Math.min(this.player.velY, 15); // Terminal velocity
        }
        
        // Atualizar posição
        this.player.x += this.player.velX;
        this.player.y += this.player.velY;
        
        // Limites da tela expandidos
        if (this.player.x < this.cameraX - 50) this.player.x = this.cameraX - 50;
        
        // Colisão com o chão
        if (this.player.y + this.player.height >= this.groundY) {
            this.player.y = this.groundY - this.player.height;
            this.player.velY = 0;
            this.player.onGround = true;
            this.player.onPlatform = false;
            this.player.currentPlatform = null;
        } else {
            this.player.onGround = false;
        }
        
        // Verificar se caiu no buraco
        if (this.player.y > this.canvas.height + 100) {
            this.takeDamage();
            this.resetPlayerPosition();
        }
        
        // Atualizar invulnerabilidade
        if (this.player.invulnerable) {
            this.player.invulnerableTime--;
            if (this.player.invulnerableTime <= 0) {
                this.player.invulnerable = false;
            }
        }
    }
    
    resetPlayerPosition() {
        // Reposicionar player em local seguro
        this.player.x = Math.max(100, this.cameraX + 50);
        this.player.y = this.groundY - this.player.height - 50;
        this.player.velX = 0;
        this.player.velY = 0;
        this.player.onGround = false;
        this.player.onPlatform = false;
        this.player.currentPlatform = null;
    }
    
    updateObstacles() {
        this.obstacles.forEach(obstacle => {
            switch (obstacle.type) {
                case 'goomba':
                    // Movimento horizontal limitado
                    obstacle.x += obstacle.velX;
                    
                    if (Math.abs(obstacle.x - obstacle.originalX) > obstacle.range) {
                        obstacle.velX = -obstacle.velX;
                        obstacle.direction = -obstacle.direction;
                    }
                    break;
                    
                case 'movingSpike':
                    // Movimento vertical
                    obstacle.y += obstacle.velY * obstacle.direction;
                    
                    if (Math.abs(obstacle.y - obstacle.originalY) > obstacle.range) {
                        obstacle.direction = -obstacle.direction;
                    }
                    break;
                    
                case 'floatingSpike':
                    // Movimento flutuante
                    obstacle.float += 0.05;
                    obstacle.x += obstacle.velX;
                    obstacle.y += Math.sin(obstacle.float) * 1.5;
                    
                    // Reverter direção nas bordas
                    if (obstacle.x < this.cameraX - 100 || obstacle.x > this.cameraX + this.canvas.width + 100) {
                        obstacle.velX = -obstacle.velX;
                    }
                    break;
            }
        });
    }
    
    updatePlatforms() {
        this.platforms.forEach(platform => {
            if (platform.isMoving) {
                platform.x += platform.velX;
                
                // Reverter direção com base no alcance
                if (Math.abs(platform.x - platform.originalX) > platform.range) {
                    platform.velX = -platform.velX;
                }
            }
        });
    }
    
    updateCamera() {
        // Câmera que segue o player suavemente
        const targetCameraX = this.player.x - this.canvas.width / 3;
        this.cameraX += (targetCameraX - this.cameraX) * 0.1;
        
        // Limitar câmera
        this.cameraX = Math.max(0, this.cameraX);
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velX;
            particle.y += particle.velY;
            particle.velY += 0.3; // Gravidade nas partículas
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            return particle.life > 0;
        });
    }
    
    checkCollisions() {
        // Colisão com tintas (hitbox mais generosa)
        this.inkBottles.forEach(ink => {
            if (!ink.collected) {
                const expandedInk = {
                    x: ink.x - 5,
                    y: ink.y - 5,
                    width: ink.width + 10,
                    height: ink.height + 10
                };
                
                if (this.collision(this.player, expandedInk)) {
                    ink.collected = true;
                    this.score += 100;
                    this.createParticle(ink.x + ink.width/2, ink.y + ink.height/2, ink.color, 'collect');
                    this.itemsToCollect--;
                }
            }
        });
        
        // CORREÇÃO DO BUG: Sistema de colisão com plataformas completamente revisado
        this.player.onPlatform = false;
        this.player.currentPlatform = null;
        
        this.platforms.forEach(platform => {
            // Verificar se o player está caindo sobre a plataforma
            if (this.player.velY >= 0 && // Caindo ou parado
                this.player.y + this.player.height - this.player.velY <= platform.y && // Estava acima da plataforma no frame anterior
                this.player.y + this.player.height >= platform.y && // Agora está na altura da plataforma
                this.player.y + this.player.height <= platform.y + platform.height + 8 && // Pequena margem de erro
                this.player.x + this.player.width > platform.x + 5 && // Sobreposição horizontal com margem
                this.player.x < platform.x + platform.width - 5) { // Sobreposição horizontal com margem
                
                // Player está sobre a plataforma
                this.player.y = platform.y - this.player.height;
                this.player.velY = 0;
                this.player.onPlatform = true;
                this.player.onGround = false;
                this.player.currentPlatform = platform;
                
                // Se a plataforma se move, mover o player junto
                if (platform.isMoving) {
                    this.player.x += platform.velX;
                }
            }
        });
        
        // Verificar se o player ainda está sobre a plataforma atual
        if (this.player.currentPlatform && this.player.onPlatform) {
            const platform = this.player.currentPlatform;
            
            // Verificar se ainda há sobreposição horizontal
            if (this.player.x + this.player.width <= platform.x || 
                this.player.x >= platform.x + platform.width) {
                // Player saiu da plataforma horizontalmente
                this.player.onPlatform = false;
                this.player.currentPlatform = null;
                this.player.coyoteTime = 8; // Dar coyote time ao sair da plataforma
            }
        }
        
        // Colisão com obstáculos
        if (!this.player.invulnerable) {
            this.obstacles.forEach(obstacle => {
                if (obstacle.dangerous && this.collision(this.player, obstacle)) {
                    // Goomba pode ser derrotado pulando em cima
                    if (obstacle.type === 'goomba' && this.player.velY > 0 && 
                        this.player.y < obstacle.y - obstacle.height/2) {
                        
                        // Destruir goomba
                        obstacle.dangerous = false;
                        obstacle.defeated = true;
                        this.player.velY = -8; // Pequeno pulo
                        this.score += 50;
                        this.createParticle(obstacle.x + obstacle.width/2, obstacle.y, '#fbbf24', 'defeat');
                    } else {
                        this.takeDamage();
                    }
                }
            });
        }
    }
    
    collision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    takeDamage() {
        this.lives--;
        this.player.invulnerable = true;
        this.player.invulnerableTime = 180; // 3 segundos a 60fps
        
        // Efeito visual de dano
        this.createParticle(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#dc2626', 'damage');
        
        // Knockback mais suave
        this.player.velX = this.player.facing === 'right' ? -3 : 3;
        this.player.velY = -6;
    }
    
    createParticle(x, y, color, type) {
        const particleCount = type === 'damage' ? 12 : type === 'defeat' ? 10 : 6;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                velX: (Math.random() - 0.5) * (type === 'defeat' ? 10 : 6),
                velY: (Math.random() - 0.5) * 6 - 2,
                color: color,
                life: 40 + Math.random() * 20,
                maxLife: 60,
                alpha: 1,
                size: Math.random() * 3 + 2
            });
        }
    }
    
    render() {
        // Limpar canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Salvar contexto para câmera
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);
        
        // Desenhar fundo do estúdio
        this.drawBackground();
        
        if (this.gameState === 'playing') {
            // Desenhar elementos do jogo
            this.drawPlatforms();
            this.drawInkBottles();
            this.drawObstacles();
            this.drawPlayer();
            this.drawParticles();
            this.drawGround();
        }
        
        // Restaurar contexto
        this.ctx.restore();
    }
    
    drawBackground() {
        // Gradient de fundo
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(0.7, '#2a2a2a');
        gradient.addColorStop(1, '#0a0a0a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.cameraX, 0, this.canvas.width, this.canvas.height);
        
        // Adicionar textura de parede do estúdio
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let i = Math.floor(this.cameraX/50)*50; i < this.cameraX + this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    drawGround() {
        // Chão do estúdio
        const groundWidth = 3000; // Mundo maior
        
        // Chão principal
        const gradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(0.1, '#2a2a2a');
        gradient.addColorStop(1, '#1a1a1a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.groundY, groundWidth, this.canvas.height - this.groundY);
        
        // Desenhar buracos (obstáculos do tipo pit)
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'pit') {
                this.ctx.fillStyle = '#0a0a0a';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Bordas do buraco
                this.ctx.strokeStyle = '#dc2626';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        });
        
        // Linha neon do chão
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ff88';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(groundWidth, this.groundY);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawPlayer() {
        this.ctx.save();
        
        // Efeito de invulnerabilidade
        if (this.player.invulnerable && Math.floor(Date.now() / 100) % 2) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Corpo do tatuador (personagem temático)
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 15, 24, 30);
        
        // Cabeça
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(this.player.x + 12, this.player.y + 5, 16, 15);
        
        // Cabelo estiloso
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(this.player.x + 10, this.player.y, 20, 8);
        
        // Braços com máquina de tatuagem
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillRect(this.player.x + 4, this.player.y + 20, 8, 15);
        this.ctx.fillRect(this.player.x + 28, this.player.y + 20, 8, 15);
        
        // Máquina de tatuagem na mão direita
        if (this.player.facing === 'right') {
            this.ctx.fillStyle = '#6B46C1';
            this.ctx.fillRect(this.player.x + 32, this.player.y + 18, 6, 8);
            // Efeito neon da máquina
            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillRect(this.player.x + 35, this.player.y + 20, 2, 2);
        }
        
        // Pernas
        this.ctx.fillStyle = '#1a1a1a';
        if (this.player.isCrouching) {
            this.ctx.fillRect(this.player.x + 12, this.player.y + 35, 6, 10);
            this.ctx.fillRect(this.player.x + 22, this.player.y + 35, 6, 10);
        } else {
            this.ctx.fillRect(this.player.x + 12, this.player.y + 35, 6, 15);
            this.ctx.fillRect(this.player.x + 22, this.player.y + 35, 6, 15);
        }
        
        // Adicionar aura neon quando se movendo
        if (this.player.isMoving) {
            this.ctx.strokeStyle = '#00ff88';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ff88';
            this.ctx.strokeRect(this.player.x + 5, this.player.y + 2, 30, 46);
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
    }
    
    drawInkBottles() {
        this.inkBottles.forEach(ink => {
            if (ink.collected) return;
            
            this.ctx.save();
            
            // Efeito de flutuação
            ink.float += 0.1;
            const floatY = ink.y + Math.sin(ink.float) * 3;
            
            // Garrafa de tinta
            this.ctx.fillStyle = ink.color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = ink.color;
            this.ctx.fillRect(ink.x, floatY, ink.width, ink.height);
            
            // Brilho interno
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(ink.x + 5, floatY + 3, ink.width - 10, ink.height - 6);
            
            // Rótulo
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(ink.x + 3, floatY + ink.height - 8, ink.width - 6, 5);
            
            this.ctx.restore();
        });
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            if (obstacle.defeated) return; // Não desenhar obstáculos derrotados
            
            this.ctx.save();
            
            switch (obstacle.type) {
                case 'spike':
                    this.drawSpike(obstacle);
                    break;
                case 'goomba':
                    this.drawGoomba(obstacle);
                    break;
                case 'movingSpike':
                    this.drawMovingSpike(obstacle);
                    break;
                case 'floatingSpike':
                    this.drawFloatingSpike(obstacle);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    drawSpike(spike) {
        // Espinho estilo Mario
        this.ctx.fillStyle = '#c0c0c0';
        
        // Triangulos pontudos
        const spikeCount = Math.floor(spike.width / 8);
        for (let i = 0; i < spikeCount; i++) {
            const x = spike.x + i * 8;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 4, spike.y);
            this.ctx.lineTo(x, spike.y + spike.height);
            this.ctx.lineTo(x + 8, spike.y + spike.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Destaque
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = 0.4;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 4, spike.y);
            this.ctx.lineTo(x + 1, spike.y + spike.height);
            this.ctx.lineTo(x + 4, spike.y + spike.height);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#c0c0c0';
        }
    }
    
    drawGoomba(goomba) {
        // Inimigo estilo cogumelo do Mario
        this.ctx.fillStyle = '#8B4513';
        
        // Corpo
        this.ctx.beginPath();
        this.ctx.arc(goomba.x + goomba.width/2, goomba.y + goomba.height - 10, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cabeça/Chapéu
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.arc(goomba.x + goomba.width/2, goomba.y + 12, 10, 0, Math.PI);
        this.ctx.fill();
        
        // Olhos hostis
        this.ctx.fillStyle = '#dc2626';
        this.ctx.fillRect(goomba.x + goomba.width/2 - 6, goomba.y + 8, 3, 3);
        this.ctx.fillRect(goomba.x + goomba.width/2 + 3, goomba.y + 8, 3, 3);
        
        // Pés
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(goomba.x + 5, goomba.y + goomba.height - 5, 8, 5);
        this.ctx.fillRect(goomba.x + goomba.width - 13, goomba.y + goomba.height - 5, 8, 5);
        
        // Indicador de movimento
        if (goomba.direction > 0) {
            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillRect(goomba.x + goomba.width - 2, goomba.y + 5, 2, 8);
        } else {
            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillRect(goomba.x, goomba.y + 5, 2, 8);
        }
    }
    
    drawMovingSpike(spike) {
        this.drawSpike(spike);
        
        // Indicadores de movimento vertical
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(spike.x - 5, spike.originalY);
        this.ctx.lineTo(spike.x - 5, spike.originalY + spike.range);
        this.ctx.stroke();
        
        // Setas indicando direção
        const arrowY = spike.direction > 0 ? spike.y - 10 : spike.y + spike.height + 10;
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        if (spike.direction > 0) {
            this.ctx.moveTo(spike.x + spike.width/2, arrowY + 5);
            this.ctx.lineTo(spike.x + spike.width/2 - 5, arrowY);
            this.ctx.lineTo(spike.x + spike.width/2 + 5, arrowY);
        } else {
            this.ctx.moveTo(spike.x + spike.width/2, arrowY - 5);
            this.ctx.lineTo(spike.x + spike.width/2 - 5, arrowY);
            this.ctx.lineTo(spike.x + spike.width/2 + 5, arrowY);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawFloatingSpike(spike) {
        // Espinho flutuante com aura
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#dc2626';
        this.drawSpike(spike);
        this.ctx.shadowBlur = 0;
        
        // Rastro de movimento
        this.ctx.strokeStyle = 'rgba(220, 38, 38, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(spike.x + spike.width/2, spike.y + spike.height/2, 20, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawPlatforms() {
        this.platforms.forEach(platform => {
            // Plataforma metálica industrial
            const gradient = this.ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
            gradient.addColorStop(0, '#6B46C1');
            gradient.addColorStop(0.5, '#4c1d95');
            gradient.addColorStop(1, '#2a2a2a');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Bordas neon
            this.ctx.strokeStyle = platform.style === 'safety' ? '#fbbf24' : '#00ff88';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = platform.style === 'safety' ? '#fbbf24' : '#00ff88';
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            this.ctx.shadowBlur = 0;
            
            // Indicador de movimento
            if (platform.isMoving) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.globalAlpha = 0.6;
                const indicatorX = platform.velX > 0 ? platform.x + platform.width - 10 : platform.x + 5;
                this.ctx.fillRect(indicatorX, platform.y + 5, 5, platform.height - 10);
                this.ctx.globalAlpha = 1;
            }
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('levelDisplay').textContent = this.level;
        
        const heartsDisplay = '❤️'.repeat(this.lives) + '🖤'.repeat(3 - this.lives);
        document.getElementById('livesDisplay').textContent = heartsDisplay;
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        this.hideAllMenus();
        
        // Gerar código de cupom único
        const couponCode = `RAVEN${Date.now().toString().slice(-6)}`;
        document.getElementById('couponCode').textContent = couponCode;
        
        document.getElementById('levelCompleteMenu').classList.add('active');
    }
    
    nextLevel() {
        this.level++;
        this.score += this.lives * 50; // Bonus por vidas restantes
        this.startGame();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.hideAllMenus();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverMenu').classList.add('active');
        
        // Reset para próximo jogo
        this.score = 0;
        this.level = 1;
        this.lives = 3;
    }
    
    copyCouponCode() {
        const couponCode = document.getElementById('couponCode').textContent;
        navigator.clipboard.writeText(couponCode).then(() => {
            alert('Código copiado! Cole na hora de agendar sua tatuagem no Raven Studio!');
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicializar o jogo quando a página carregar
window.addEventListener('load', () => {
    new RavenGame();
});
