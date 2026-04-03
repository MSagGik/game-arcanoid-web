class ArkanoidGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: true });

        this.WIDTH = this.canvas.width;
        this.HEIGHT = this.canvas.height;

        this.R = GAME_RESOURCES.COLORS;
        this.S = GAME_RESOURCES.SIZES;
        this.SETTINGS = GAME_RESOURCES.SETTINGS;

        this.paddle = {
            width: this.S.paddleWidth,
            height: this.S.paddleHeight,
            x: (this.WIDTH - this.S.paddleWidth) / 2,
            y: this.HEIGHT - 38,
            speed: this.SETTINGS.paddleSpeed
        };

        this.ball = {
            radius: this.S.ballRadius,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            baseSpeed: this.SETTINGS.ballBaseSpeed
        };

        this.bricks = [];
        this.score = 0;
        this.lives = this.SETTINGS.initialLives;
        this.level = 1;
        this.gameState = 'ready';

        this.keys = Object.create(null);
        this.mouseX = this.WIDTH / 2;

        this.ballAttached = true;

        this.initEventListeners();
        this.createLevel();
        this.resetBall();
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && this.ballAttached && this.gameState === 'ready') {
                e.preventDefault();
                this.launchBall();
            }
            if (e.key.toLowerCase() === 'p') {
                this.gameState = this.gameState === 'playing' ? 'paused' : 'playing';
            }
        });

        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });

        this.canvas.addEventListener('click', () => {
            if (this.ballAttached && this.gameState === 'ready') this.launchBall();
        });

        window.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        });
    }

    createLevel() {
        this.bricks = [];

        const rows = this.SETTINGS.brickRows;
        const cols = this.SETTINGS.brickCols;

        const totalWidth = cols * (this.S.brickWidth + this.S.brickPadding) - this.S.brickPadding;
        const offsetX = (this.WIDTH - totalWidth) / 2;
        const offsetY = this.SETTINGS.levelOffsetY;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r === 0 && (c === 2 || c === 7)) continue;
                if (r === 7 && (c < 3 || c > 6)) continue;

                this.bricks.push({
                    x: offsetX + c * (this.S.brickWidth + this.S.brickPadding),
                    y: offsetY + r * (this.S.brickHeight + this.S.brickPadding),
                    width: this.S.brickWidth,
                    height: this.S.brickHeight,
                    color: this.R.bricks[r],
                    hitsLeft: (r < 2) ? 2 : 1,
                    visible: true,
                    points: (rows - r) * 10
                });
            }
        }
    }

    resetBall() {
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius - 2;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ballAttached = true;
        this.gameState = 'ready';
    }

    launchBall() {
        if (!this.ballAttached) return;
        this.ballAttached = false;
        this.gameState = 'playing';

        const angle = (Math.random() * 40 - 20) * Math.PI / 180;
        this.ball.vx = Math.sin(angle) * this.ball.baseSpeed;
        this.ball.vy = -Math.cos(angle) * this.ball.baseSpeed;
    }

    update() {
        if (this.gameState === 'paused' || this.gameState === 'gameover' || this.gameState === 'levelclear') return;

        this.paddle.x = this.mouseX - this.paddle.width / 2;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) this.paddle.x -= this.paddle.speed;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) this.paddle.x += this.paddle.speed;

        this.paddle.x = Math.max(8, Math.min(this.WIDTH - this.paddle.width - 8, this.paddle.x));

        if (this.ballAttached) {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            this.ball.y = this.paddle.y - this.ball.radius - 2;
            return;
        }

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        if (this.ball.x - this.ball.radius < 8) { this.ball.x = 8 + this.ball.radius; this.ball.vx = Math.abs(this.ball.vx); }
        if (this.ball.x + this.ball.radius > this.WIDTH - 8) { this.ball.x = this.WIDTH - 8 - this.ball.radius; this.ball.vx = -Math.abs(this.ball.vx); }
        if (this.ball.y - this.ball.radius < 8) { this.ball.y = 8 + this.ball.radius; this.ball.vy = Math.abs(this.ball.vy); }

        if (this.ball.y + this.ball.radius > this.HEIGHT) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameState = 'gameover';
            } else {
                this.resetBall();
            }
            return;
        }

        if (this.ball.vy > 0 &&
            this.ball.y + this.ball.radius >= this.paddle.y &&
            this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
            this.ball.x >= this.paddle.x &&
            this.ball.x <= this.paddle.x + this.paddle.width) {

            this.ball.y = this.paddle.y - this.ball.radius;
            const paddleCenter = this.paddle.x + this.paddle.width / 2;
            let hitFraction = (this.ball.x - paddleCenter) / (this.paddle.width / 2);
            hitFraction = Math.max(-1, Math.min(1, hitFraction));

            const angle = hitFraction * 60 * Math.PI / 180;
            this.ball.vx = Math.sin(angle) * this.ball.baseSpeed;
            this.ball.vy = -Math.cos(angle) * this.ball.baseSpeed;
        }

        for (let i = 0; i < this.bricks.length; i++) {
            const b = this.bricks[i];
            if (!b.visible) continue;

            if (this.ball.x + this.ball.radius > b.x &&
                this.ball.x - this.ball.radius < b.x + b.width &&
                this.ball.y + this.ball.radius > b.y &&
                this.ball.y - this.ball.radius < b.y + b.height) {

                b.hitsLeft--;
                if (b.hitsLeft <= 0) {
                    b.visible = false;
                    this.score += b.points;
                }

                const overlapL = (this.ball.x + this.ball.radius) - b.x;
                const overlapR = (b.x + b.width) - (this.ball.x - this.ball.radius);
                const overlapT = (this.ball.y + this.ball.radius) - b.y;
                const overlapB = (b.y + b.height) - (this.ball.y - this.ball.radius);

                const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

                if (minOverlap === overlapT || minOverlap === overlapB) {
                    this.ball.vy = -this.ball.vy;
                } else {
                    this.ball.vx = -this.ball.vx;
                }
                break;
            }
        }

        if (isNaN(this.ball.x) || isNaN(this.ball.y)) {
            this.resetBall();
            return;
        }

        if (this.bricks.every(b => !b.visible)) {
            this.gameState = 'levelclear';
            setTimeout(() => {
                this.level++;
                this.createLevel();
                this.resetBall();
            }, 900);
        }
    }

    draw() {
//        const R = GAME_RESOURCES.COLORS;

        this.ctx.fillStyle = this.R.background;
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        for (let b of this.bricks) {
            if (!b.visible) continue;
            this.ctx.fillStyle = b.color;
            this.ctx.fillRect(b.x, b.y, b.width, b.height);
            this.ctx.fillStyle = this.R.brickHighlight;
            this.ctx.fillRect(b.x + 4, b.y + 4, b.width - 12, 6);
            this.ctx.strokeStyle = this.R.brickStroke;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(b.x + 2, b.y + 2, b.width - 4, b.height - 4);

            if (b.hitsLeft > 1) {
                this.ctx.fillStyle = this.R.brickDoubleHit;
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillRect(b.x + 8, b.y + 8, b.width - 16, b.height - 16);
                this.ctx.globalAlpha = 1;
            }
        }

        this.ctx.fillStyle = this.R.paddle;
        this.ctx.shadowBlur = 25;
        this.ctx.shadowColor = this.R.paddle;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = this.R.paddleHighlight;
        this.ctx.fillRect(this.paddle.x + 8, this.paddle.y + 3, this.paddle.width - 28, 5);

        const grad = this.ctx.createRadialGradient(this.ball.x-3, this.ball.y-3, 2, this.ball.x, this.ball.y, this.ball.radius);
        grad.addColorStop(0, this.R.ballLight);
        grad.addColorStop(1, this.R.ballMain);
        this.ctx.fillStyle = grad;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.R.ballShadow;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = this.R.textHUD;
        this.ctx.font = 'bold 22px Courier New';
        this.ctx.fillText(`SCORE ${String(this.score).padStart(6, '0')}`, 42, 22);
        this.ctx.fillText(`LIVES ${this.lives}`, this.WIDTH - 158, 22);
        this.ctx.fillText(`LEVEL ${this.level}`, this.WIDTH / 2 - 48, 22);

        if (this.ballAttached && this.gameState === 'ready') {
            this.ctx.fillStyle = this.R.textReady;
            this.ctx.font = 'bold 26px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('НАЖМИ ПРОБЕЛ ИЛИ КЛИКНИ', this.WIDTH/2, this.HEIGHT/2 + 80);
            this.ctx.font = 'bold 18px Courier New';
            this.ctx.fillText('чтобы запустить шар', this.WIDTH/2, this.HEIGHT/2 + 118);
            this.ctx.textAlign = 'left';
        }

        if (this.gameState === 'paused') {
            this.ctx.fillStyle = this.R.overlayPaused;
            this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
            this.ctx.fillStyle = this.R.textPaused;
            this.ctx.font = 'bold 48px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.WIDTH/2, this.HEIGHT/2);
            this.ctx.textAlign = 'left';
        }

        if (this.gameState === 'gameover') {
            this.ctx.fillStyle = this.R.overlayGameOver;
            this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
            this.ctx.fillStyle = this.R.textGameOver;
            this.ctx.font = 'bold 56px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.WIDTH/2, this.HEIGHT/2 - 30);
            this.ctx.font = 'bold 26px Courier New';
            this.ctx.fillStyle = this.R.textFinalScore;
            this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.WIDTH/2, this.HEIGHT/2 + 40);
            this.ctx.textAlign = 'left';
        }

        if (this.gameState === 'levelclear') {
            this.ctx.fillStyle = this.R.textLevelClear;
            this.ctx.font = 'bold 42px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = this.R.textLevelClear;
            this.ctx.fillText('LEVEL CLEAR!', this.WIDTH/2, this.HEIGHT/2);
            this.ctx.shadowBlur = 0;
            this.ctx.textAlign = 'left';
        }
    }

    gameLoop = (timestamp) => {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    };

    start() {
        requestAnimationFrame(this.gameLoop);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new ArkanoidGame('game-canvas');
    game.start();
});