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

        this.aliveBricks = 0;
        this.bricks = [];
        this.score = 0;
        this.lives = this.SETTINGS.initialLives;
        this.level = 1;
        this.gameState = GAME_STATE.READY;

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

            if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();

            if (e.key === ' ' && this.ballAttached && this.gameState === GAME_STATE.READY) {
                e.preventDefault();
                this.launchBall();
            }

            if (e.key.toLowerCase() === 'p') {
                this.gameState = this.gameState === GAME_STATE.PLAYING ? GAME_STATE.PAUSED : GAME_STATE.PLAYING;
            }
        });

        window.addEventListener('keyup', (e) => this.keys[e.key] = false);

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });

        this.canvas.addEventListener('click', () => {
            if (this.ballAttached && this.gameState === GAME_STATE.READY) this.launchBall();
        });
    }

    createLevel() {
        this.aliveBricks = 0;
        this.bricks = [];

        const rows = this.SETTINGS.brickRows;
        const cols = this.SETTINGS.brickCols;
        const brickW = this.S.brickWidth;
        const brickH = this.S.brickHeight;
        const gap = this.S.brickPadding;
        const offsetY = this.SETTINGS.levelOffsetY;

        const totalWidth = cols * (brickW + gap) - gap;
        const offsetX = (this.WIDTH - totalWidth) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r === 0 && (c === 2 || c === 7)) continue;
                if (r === 7 && (c < 3 || c > 6)) continue;

                this.bricks.push({
                    x: offsetX + c * (brickW + gap),
                    y: offsetY + r * (brickH + gap),
                    width: brickW,
                    height: brickH,
                    color: this.R.bricks[r],
                    hitsLeft: (r < 2) ? 2 : 1,
                    visible: true,
                    points: (rows - r) * 10
                });

                this.aliveBricks++;
            }
        }
    }

    resetBall() {
        this.ball.x = this.paddle.x + this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radius - this.SETTINGS.ballOffsetFromPaddle;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ballAttached = true;
        this.gameState = GAME_STATE.READY;
    }

    launchBall() {
        if (!this.ballAttached) return;
        this.ballAttached = false;
        this.gameState = GAME_STATE.PLAYING;

        const angle = (Math.random() * 40 - 20) * Math.PI / 180;
        this.ball.vx = Math.sin(angle) * this.ball.baseSpeed;
        this.ball.vy = -Math.cos(angle) * this.ball.baseSpeed;
    }

    isBallCollidingWithBrick(brick) {
        return (
            this.ball.x + this.ball.radius > brick.x &&
            this.ball.x - this.ball.radius < brick.x + brick.width &&
            this.ball.y + this.ball.radius > brick.y &&
            this.ball.y - this.ball.radius < brick.y + brick.height
        );
    }

    handleBrickCollision(brick) {
        brick.hitsLeft--;

        if (brick.hitsLeft <= 0 && brick.visible) {
            brick.visible = false;
            this.aliveBricks--;
            this.score += brick.points;
        }

        const overlapL = (this.ball.x + this.ball.radius) - brick.x;
        const overlapR = (brick.x + brick.width) - (this.ball.x - this.ball.radius);
        const overlapT = (this.ball.y + this.ball.radius) - brick.y;
        const overlapB = (brick.y + brick.height) - (this.ball.y - this.ball.radius);

        const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

        if (minOverlap === overlapT || minOverlap === overlapB) {
            this.ball.vy = -this.ball.vy;
        } else {
            this.ball.vx = -this.ball.vx;
        }
    }

    update(dt) {
        if (this.gameState === GAME_STATE.PAUSED ||
            this.gameState === GAME_STATE.GAME_OVER ||
            this.gameState === GAME_STATE.LEVEL_CLEAR) return;

        this.paddle.x = this.mouseX - this.paddle.width / 2;

        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'])
            this.paddle.x -= this.paddle.speed * dt;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'])
            this.paddle.x += this.paddle.speed * dt;

        this.paddle.x = Math.max(
            this.SETTINGS.wallPadding,
            Math.min(this.WIDTH - this.paddle.width - 8, this.paddle.x)
        );

        if (this.ballAttached) {
            this.ball.x = this.paddle.x + this.paddle.width / 2;
            this.ball.y = this.paddle.y - this.ball.radius - 2;
            return;
        }

        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;

        if (this.ball.x - this.ball.radius < this.SETTINGS.wallPadding) {
            this.ball.x = this.SETTINGS.wallPadding + this.ball.radius;
            this.ball.vx = Math.abs(this.ball.vx);
        }

        if (this.ball.x + this.ball.radius > this.WIDTH - this.SETTINGS.wallPadding) {
            this.ball.x = this.WIDTH - this.SETTINGS.wallPadding - this.ball.radius;
            this.ball.vx = -Math.abs(this.ball.vx);
        }

        if (this.ball.y - this.ball.radius < this.SETTINGS.wallPadding) {
            this.ball.y = this.SETTINGS.wallPadding + this.ball.radius;
            this.ball.vy = Math.abs(this.ball.vy);
        }

        if (this.ball.y + this.ball.radius > this.HEIGHT) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameState = GAME_STATE.GAME_OVER;
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

            if (this.isBallCollidingWithBrick(b)) {
                this.handleBrickCollision(b);
                break;
            }
        }

        if (isNaN(this.ball.x) || isNaN(this.ball.y)) {
            this.resetBall();
            return;
        }

        if (this.aliveBricks === 0) {
            this.gameState = GAME_STATE.LEVEL_CLEAR;
            setTimeout(() => {
                this.level++;
                this.createLevel();
                this.resetBall();
            }, 900);
        }
    }

    draw() {
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

        if (this.ballAttached && this.gameState === GAME_STATE.READY) {
            this.ctx.fillStyle = this.R.textReady;
            this.ctx.font = 'bold 26px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('НАЖМИ ПРОБЕЛ ИЛИ КЛИКНИ', this.WIDTH/2, this.HEIGHT/2 + 80);
            this.ctx.font = 'bold 18px Courier New';
            this.ctx.fillText('чтобы запустить шар', this.WIDTH/2, this.HEIGHT/2 + 118);
            this.ctx.textAlign = 'left';
        }

        if (this.gameState === GAME_STATE.PAUSED) {
            this.ctx.fillStyle = this.R.overlayPaused;
            this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
            this.ctx.fillStyle = this.R.textPaused;
            this.ctx.font = 'bold 48px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.WIDTH/2, this.HEIGHT/2);
            this.ctx.textAlign = 'left';
        }

        if (this.gameState === GAME_STATE.GAME_OVER) {
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

        if (this.gameState === GAME_STATE.LEVEL_CLEAR) {
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

    gameLoop = (timestamp = 0) => {
        if (this.lastTime === 0) this.lastTime = timestamp;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
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