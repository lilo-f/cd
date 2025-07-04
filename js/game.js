// Jogo Raven Studio - Ink Adventure
// Refeito em JavaScript puro com foco na experiência visual e gameplay fluida

class RavenGame {


     constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // No constructor, após criar o AudioContext:
console.log("Estado inicial do AudioContext:", this.audioContext.state);

          // Carregar sons
        this.sounds = {
            backgroundMusic: null,
            jump: null,
            collect: null,
            damage: null,
            levelComplete: null,
            gameOver: null,
             enemyDefeat: null
             
             
        };

         this.loadSounds();
        // Estado do jogo
        this.gameState = 'menu';
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
   loadSounds() {
    // Inicializa os sons mas NÃO cria a música de fundo ainda
    this.sounds = {
        jump: this.createJumpSound(),
        collect: this.createCollectSound(),
        damage: this.createDamageSound(),
        levelComplete: this.createLevelCompleteSound(),
        gameOver: this.createGameOverSound(),
        enemyDefeat: this.createEnemyDefeatSound(),
        backgroundMusic: null // Será criado quando o jogo iniciar
    };
}
        createSounds() {
        // Música de fundo (loop simples)
        this.sounds.backgroundMusic = this.createBackgroundMusic();
         this.sounds.enemyDefeat = this.createEnemyDefeatSound();
        
        // Efeitos sonoros
        this.sounds.jump = this.createJumpSound();
        this.sounds.collect = this.createCollectSound();
        this.sounds.damage = this.createDamageSound();
        this.sounds.levelComplete = this.createLevelCompleteSound();
        this.sounds.gameOver = this.createGameOverSound();
        
     // Som de Game Over (som mais dramático)
    this.sounds.gameOver = this.createGameOverSound();
    
    // Som de Passar de Fase (som mais celebrativo)
    this.sounds.levelComplete = this.createLevelCompleteSound();
}

   createEnemyDefeatSound() {
    return () => {
        try {
            const context = this.audioContext;
            if (context.state === 'suspended') {
                context.resume();
            }

            const duration = 0.5;
            const osc1 = context.createOscillator();
            const osc2 = context.createOscillator();
            const gain = context.createGain();
            
            osc1.type = 'sawtooth';
            osc1.frequency.value = 200;
            
            osc2.type = 'square';
            osc2.frequency.value = 150;
            
            gain.gain.value = 0.3;
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(context.destination);
            
            osc1.frequency.exponentialRampToValueAtTime(50, context.currentTime + duration);
            osc2.frequency.exponentialRampToValueAtTime(40, context.currentTime + duration);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
            
            osc1.start();
            osc2.start();
            osc1.stop(context.currentTime + duration);
            osc2.stop(context.currentTime + duration);
            
        } catch (error) {
            console.error("Erro ao tocar som:", error);
        }
    };
}


testAudio() {
    try {
        console.log("Iniciando teste de áudio...");
        const ctx = this.audioContext;
        
        // Verifica se o contexto está suspenso (exigência dos navegadores)
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                console.log("AudioContext retomado!");
                this.playTestSound();
            });
        } else {
            this.playTestSound();
        }
    } catch (error) {
        console.error("Erro no teste de áudio:", error);
    }
}

playTestSound() {
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 440; // Lá (A4)
    gainNode.gain.value = 0.2;
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    
    console.log("Som de teste tocado!");
}

        createJumpSound() {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.1;
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(
                0.001, 
                this.audioContext.currentTime + 0.3
            );
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

  createCollectSound() {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.frequency.exponentialRampToValueAtTime(
                1200, 
                this.audioContext.currentTime + 0.2
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.001, 
                this.audioContext.currentTime + 0.3
            );
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

    createDamageSound() {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.value = 200;
            gainNode.gain.value = 0.1;
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.frequency.exponentialRampToValueAtTime(
                100, 
                this.audioContext.currentTime + 0.5
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.001, 
                this.audioContext.currentTime + 0.5
            );
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
    }
createLevelCompleteSound() {
    return () => {
        try {
            const ctx = this.audioContext;
            if (ctx.state === 'suspended') ctx.resume();

            // Fanfarra triunfal (Dó maior)
            const notes = [
                { freq: 523.25, time: 0, dur: 0.3 },   // C5
                { freq: 659.25, time: 0.2, dur: 0.3 }, // E5
                { freq: 783.99, time: 0.4, dur: 0.5 }, // G5
                { freq: 1046.5, time: 0.8, dur: 0.8 }  // C6
            ];
            
            // Adicionar glissando na última nota
            notes.forEach(note => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = note.freq === 1046.5 ? 'sawtooth' : 'square';
                osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
                
                if (note.freq === 1046.5) {
                    osc.frequency.exponentialRampToValueAtTime(
                        1567.98, // G6
                        ctx.currentTime + note.time + note.dur
                    );
                }
                
                gain.gain.setValueAtTime(0.3, ctx.currentTime + note.time);
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    ctx.currentTime + note.time + note.dur
                );
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + note.time);
                osc.stop(ctx.currentTime + note.time + note.dur);
            });
            
            // Efeito de estrelas (pings aleatórios)
            for (let i = 0; i < 8; i++) {
                const ping = ctx.createOscillator();
                const pingGain = ctx.createGain();
                ping.type = 'triangle';
                ping.frequency.value = 2000 + Math.random() * 2000;
                pingGain.gain.value = 0.1;
                
                ping.connect(pingGain);
                pingGain.connect(ctx.destination);
                
                const startTime = ctx.currentTime + 0.8 + Math.random() * 0.5;
                ping.start(startTime);
                pingGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
                ping.stop(startTime + 0.2);
            }
            
        } catch (error) {
            console.error("Erro no Level Complete sound:", error);
        }
    };
}

createGameOverSound() {
    return () => {
        try {
            const ctx = this.audioContext;
            if (ctx.state === 'suspended') ctx.resume();

            // 1. Queda gradual (tom descendente)
            const fallOsc = ctx.createOscillator();
            const fallGain = ctx.createGain();
            fallOsc.type = 'sawtooth';
            fallOsc.frequency.setValueAtTime(440, ctx.currentTime); // Lá4
            fallOsc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 1.2); // Lá2
            fallGain.gain.value = 0.4;

            // 2. Impacto metálico (no final)
            const metalOsc = ctx.createOscillator();
            const metalGain = ctx.createGain();
            metalOsc.type = 'square';
            metalOsc.frequency.value = 1760; // Lá5
            metalGain.gain.value = 0;
            
            // Efeito de "metal batendo"
            metalGain.gain.setValueAtTime(0.5, ctx.currentTime + 1.15);
            metalGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);

            // 3. Ruído de "quebra"
            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3, ctx.currentTime + 1.2);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

            // Conexões
            fallOsc.connect(fallGain);
            fallGain.connect(ctx.destination);
            metalOsc.connect(metalGain);
            metalGain.connect(ctx.destination);
            noise.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            // Disparar
            fallOsc.start();
            metalOsc.start();
            noise.start(ctx.currentTime + 1.2);
            
            // Parar
            fallOsc.stop(ctx.currentTime + 1.3);
            metalOsc.stop(ctx.currentTime + 1.3);
            noise.stop(ctx.currentTime + 1.5);

        } catch (error) {
            console.error("Erro no som de Game Over:", error);
        }
    };
} // Métodos para controlar a música de fundo
playBackgroundMusic() {
    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
            console.log("AudioContext ativado - iniciando música");
            this.startMusic();
        });
    } else {
        this.startMusic();
    }
}


startMusic() {
    if (!this.sounds.backgroundMusic) {
        console.log("Criando nova música de fundo");
        this.sounds.backgroundMusic = this.createBackgroundMusic();
    } else {
        console.log("Reativando música existente");
        // Você pode precisar reiniciar a música aqui se necessário
    }
}


 stopBackgroundMusic() {
    console.log("Parando música de fundo");
    if (this.sounds.backgroundMusic) {
        clearTimeout(this.musicTimer);
        // Verifica se existe o método stop na música
        if (typeof this.sounds.backgroundMusic.stop === 'function') {
            this.sounds.backgroundMusic.stop();
        }
        // Reseta a referência para ser criada nova instância
        this.sounds.backgroundMusic = null;
    }
}

resetGameState() {
    // Limpa todos os arrays do jogo
    this.inkBottles = [];
    this.obstacles = [];
    this.platforms = [];
    this.particles = [];
    
    // Reseta o timer da música
    clearTimeout(this.musicTimer);
    
    // Reseta o player
    this.resetPlayer();
    
    // Reseta a câmera
    this.cameraX = 0;
    
    // Garante que não há música tocando
    this.stopBackgroundMusic();
}

    showCustomAlert() {
    const alert = document.getElementById('customAlert');
    alert.classList.add('active');
    
    document.getElementById('alertConfirm').onclick = () => {
        window.location.href = '/'; // Altere para a URL desejada
    };
    
    document.getElementById('alertCancel').onclick = () => {
        alert.classList.remove('active');
    };
}

hideCustomAlert() {
    document.getElementById('customAlert').classList.remove('active');
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
    
// Substitua o método setupControls() na classe RavenGame por este:

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
    
    // Controles mobile - versão corrigida
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    
    // Adicionar evento de clique para melhor compatibilidade
    leftBtn.addEventListener('mousedown', () => this.keys['ArrowLeft'] = true);
    leftBtn.addEventListener('mouseup', () => this.keys['ArrowLeft'] = false);
    leftBtn.addEventListener('mouseleave', () => this.keys['ArrowLeft'] = false);
    
    rightBtn.addEventListener('mousedown', () => this.keys['ArrowRight'] = true);
    rightBtn.addEventListener('mouseup', () => this.keys['ArrowRight'] = false);
    rightBtn.addEventListener('mouseleave', () => this.keys['ArrowRight'] = false);
    
    jumpBtn.addEventListener('mousedown', () => {
        this.keys['Space'] = true;
        this.player.jumpBuffer = 10;
    });
    jumpBtn.addEventListener('mouseup', () => this.keys['Space'] = false);
    jumpBtn.addEventListener('mouseleave', () => this.keys['Space'] = false);
    
    // Adicionar eventos touch com preventDefault
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
    
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys['Space'] = true;
        this.player.jumpBuffer = 10;
    });
    jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keys['Space'] = false;
    });
    // Adicione isto para garantir que o áudio possa ser tocado
    document.addEventListener('click', () => {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }, { once: true });
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
        document.getElementById('testSoundBtn').addEventListener('click', () => {
    this.testAllSounds();
});
        // No método setupUI() da classe RavenGame, adicione:
document.getElementById('exitBtn').addEventListener('click', () => {
    this.showCustomAlert();
});
// No setupUI():
document.getElementById('testSoundBtn').addEventListener('click', () => {
    this.testAudio();
});

    }



    // Adicione este novo método:
testAllSounds() {
    console.log("Testando todos os sons...");
    
    // Testa o AudioContext primeiro
    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
            console.log("AudioContext ativado, testando sons...");
            this.playTestSounds();
        });
    } else {
        this.playTestSounds();
    }
}

playTestSounds() {
    // Testa cada som sequencialmente
    const soundNames = ['jump', 'collect', 'damage', 'enemyDefeat', 'levelComplete', 'gameOver'];
    let index = 0;
    
    const playNextSound = () => {
        if (index >= soundNames.length) {
            console.log("Todos os sons testados!");
            return;
        }
        
        const soundName = soundNames[index];
        console.log(`Tocando som: ${soundName}`);
        
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        } else {
            console.warn(`Som ${soundName} não encontrado!`);
        }
        
        index++;
        setTimeout(playNextSound, 1000); // Espera 1 segundo entre sons
    };
    
    playNextSound();
}
    
 init() {
    this.resetGameState(); // Limpa tudo antes de começar
    this.showMenu();
    this.gameLoop();
}
    
       showMenu() {
        this.gameState = 'menu';
        this.stopBackgroundMusic();
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
    // Para qualquer música ou som que esteja tocando
    this.stopBackgroundMusic();
    
    // Limpa o timer da música se existir
    clearTimeout(this.musicTimer);
    
    // Reseta o estado do audio
    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
            console.log('AudioContext ativado!');
            this.initGameAfterAudio();
        }).catch(error => {
            console.error('Falha ao ativar áudio:', error);
            this.initGameAfterAudio();
        });
    } else {
        this.initGameAfterAudio();
    }
}

initGameAfterAudio() {
    this.gameState = 'playing';
    this.hideAllMenus();
    this.resetPlayer();
    this.initLevel();
    
    // Toca a música de fundo APÓS tudo estar inicializado
    this.playBackgroundMusic();
    
    console.log("Jogo iniciado e música deveria estar tocando");
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
            
            // Tocar som de pulo
            if (this.sounds.jump) this.sounds.jump();
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
    // Colisão com tintas (mantido igual)
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
                
                if (this.sounds.collect) this.sounds.collect();
            }
        }
    });
    
    // Colisão com plataformas (mantido igual)
    this.player.onPlatform = false;
    this.player.currentPlatform = null;
    
    this.platforms.forEach(platform => {
        if (this.player.velY >= 0 &&
            this.player.y + this.player.height - this.player.velY <= platform.y &&
            this.player.y + this.player.height >= platform.y &&
            this.player.y + this.player.height <= platform.y + platform.height + 8 &&
            this.player.x + this.player.width > platform.x + 5 &&
            this.player.x < platform.x + platform.width - 5) {
            
            this.player.y = platform.y - this.player.height;
            this.player.velY = 0;
            this.player.onPlatform = true;
            this.player.onGround = false;
            this.player.currentPlatform = platform;
            
            if (platform.isMoving) {
                this.player.x += platform.velX;
            }
        }
    });
    
    // Colisão com obstáculos (versão corrigida)
    if (!this.player.invulnerable) {
        this.obstacles.forEach(obstacle => {
            if (obstacle.dangerous && this.collision(this.player, obstacle)) {
                // Verificação melhorada para pisar no inimigo
                const isJumpingOnEnemy = (
                    obstacle.type === 'goomba' && 
                    this.player.velY > 0 && // Player está descendo
                    (this.player.y + this.player.height) < (obstacle.y + (obstacle.height * 0.5)) // Ajuste na margem de contato
                );
                
                if (isJumpingOnEnemy) {
                    console.log("Inimigo derrotado - som deveria tocar");
                    
                    // Destruir goomba
                    obstacle.dangerous = false;
                    obstacle.defeated = true;
                    this.player.velY = -8; // Pequeno pulo
                    this.score += 50;
                    this.createParticle(obstacle.x + obstacle.width/2, obstacle.y, '#fbbf24', 'defeat');
                    
                    // Tocar som
                    if (this.sounds.enemyDefeat) {
                        console.log("Tocando som de derrota");
                        this.sounds.enemyDefeat();
                    }
                } else {
                    this.takeDamage();
                }
            }
        });
    }
}

createBackgroundMusic() {
    try {
        const ctx = this.audioContext;
        console.log("Criando música. Context state:", this.audioContext.state);
        // Cria um ganho principal para controlar o volume global
        const mainGain = ctx.createGain();
        mainGain.gain.value = 0.3; // Volume moderado (30%)
        mainGain.connect(ctx.destination);

        // Cria um filtro para suavizar os agudos
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1500;
        filter.connect(mainGain);

        // Cria os osciladores para os instrumentos
        const bassOsc = ctx.createOscillator();
        bassOsc.type = "sine";
        const leadOsc = ctx.createOscillator();
        leadOsc.type = "triangle";
        
        // Configura os ADSR (envelopes)
        const createEnvelope = (param, value, attack, decay, sustain, release) => {
            const now = ctx.currentTime;
            param.setValueAtTime(0, now);
            param.linearRampToValueAtTime(value, now + attack);
            param.exponentialRampToValueAtTime(sustain * value, now + attack + decay);
            param.setValueAtTime(sustain * value, now + attack + decay + release - 0.1);
            param.linearRampToValueAtTime(0, now + attack + decay + release);
        };

        // Padrão de acordes (progressão simples)
        const chords = [
            { bass: 65.41, lead: [261.63, 329.63, 392.00] }, // C4-E4-G4
            { bass: 73.42, lead: [293.66, 369.99, 440.00] }, // D4-F#4-A4
            { bass: 82.41, lead: [329.63, 415.30, 493.88] }, // E4-G#4-B4
            { bass: 98.00, lead: [392.00, 493.88, 587.33] }  // G4-B4-D5
        ];

        let currentChord = 0;
        const bpm = 90;
        const beatDuration = 60 / bpm;

        const playPattern = () => {
            if (this.gameState !== 'playing') return;

            const now = ctx.currentTime;
            const chord = chords[currentChord % chords.length];
            
            // Baixo (mais grave)
            const bassGain = ctx.createGain();
            bassOsc.frequency.setValueAtTime(chord.bass, now);
            bassOsc.connect(bassGain);
            bassGain.connect(filter);
            createEnvelope(bassGain.gain, 0.15, 0.05, 0.2, 0.5, beatDuration * 2);
            
            // Melodia (acordes)
            chord.lead.forEach((freq, i) => {
                const leadGain = ctx.createGain();
                leadOsc.frequency.setValueAtTime(freq, now + i * 0.1);
                leadOsc.connect(leadGain);
                leadGain.connect(filter);
                createEnvelope(leadGain.gain, 0.1, 0.1, 0.3, 0.3, beatDuration * 1.5);
            });
            
            // Percussão (batida simples)
            if (currentChord % 2 === 0) {
                const noise = ctx.createBufferSource();
                const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noiseGain = ctx.createGain();
                noise.buffer = buffer;
                noise.connect(noiseGain);
                noiseGain.connect(filter);
                noiseGain.gain.value = 0.05;
                noise.start(now);
                noise.stop(now + 0.1);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            }
            
            currentChord++;
            this.musicTimer = setTimeout(playPattern, beatDuration * 2000);
        };

        // Inicia os osciladores
        bassOsc.start();
        leadOsc.start();
        
        // Começa o padrão musical
        playPattern();
        
        return {
            stop: () => {
                clearTimeout(this.musicTimer);
                bassOsc.stop();
                leadOsc.stop();
                mainGain.gain.value = 0;
            }
        };
    } catch (error) {
        console.error("Erro na música de fundo:", error);
        return { stop: () => {} };
    }
}
    collision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
     // No método takeDamage, adicione som de dano
    takeDamage() {
        this.lives--;
        this.player.invulnerable = true;
        this.player.invulnerableTime = 180;
        
        this.createParticle(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#dc2626', 'damage');
        
        // Tocar som de dano
        if (this.sounds.damage) this.sounds.damage();
        
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
    
     // Nos métodos de conclusão de nível e game over, adicione os sons
 levelComplete() {
    this.gameState = 'levelComplete';
    this.hideAllMenus();
    
    // Gerar código de cupom
    const couponCode = `RAVEN${Date.now().toString().slice(-6)}`;
    document.getElementById('couponCode').textContent = couponCode;
    
    document.getElementById('levelCompleteMenu').classList.add('active');
    
    // Tocar som de vitória
    if (this.sounds.levelComplete) {
        this.sounds.levelComplete();
    }
    this.stopBackgroundMusic();
}


    
    nextLevel() {
    // Para completamente a música atual
    this.stopBackgroundMusic();
    
    // Limpa todos os intervalos/timeouts
    clearTimeout(this.musicTimer);
    
    // Incrementa nível e score
    this.level++;
    this.score += this.lives * 50; // Bonus por vidas restantes
    
    // Reinicia o jogo com novo estado
    this.startGame();
}
    
   gameOver() {
    this.gameState = 'gameOver';
    this.hideAllMenus();
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('gameOverMenu').classList.add('active');
    
    // Tocar som de Game Over
    if (this.sounds.gameOver) {
        this.sounds.gameOver();
    }
    this.stopBackgroundMusic();
    
    // Reset para próximo jogo
    this.score = 0;
    this.level = 1;
    this.lives = 3;
}

    
   copyCouponCode() {
    const couponCode = document.getElementById('couponCode').textContent;
    navigator.clipboard.writeText(couponCode).then(() => {
        this.showCouponAlert(couponCode);
        
    }).catch(err => {
        console.error('Falha ao copiar: ', err);
    });
}

showCouponAlert(couponCode) {

    
    const alert = document.getElementById('couponAlert');
    document.getElementById('copiedCouponCode').textContent = couponCode;
    alert.classList.add('active');
    

    
    document.getElementById('couponAlertOk').onclick = () => {
        alert.classList.remove('active');
    };
    
    // Fechar automaticamente após 3 segundos
    setTimeout(() => {
        if (alert.classList.contains('active')) {
            alert.classList.remove('active');
        }
        
    }, 3000);
    
}
playCopySound() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gainNode.gain.value = 0.1;
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(
        0.001, 
        this.audioContext.currentTime + 0.3
    );
    oscillator.stop(this.audioContext.currentTime + 0.3);
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
