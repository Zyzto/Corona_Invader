// Corona Invader Game - Functional Refactored Version
// ============================================

// Debug mode - set to true in dev environment
const DEBUG_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('debug=true');

// Canvas initialization
const canvas = document.querySelector('#canvas');
const ctx = canvas?.getContext('2d');

if (!canvas || !ctx) {
  console.error('Canvas element not found or context could not be created');
}

// ============================================
// SECTION 1: UTILITIES
// ============================================

// Math utilities
const clamp = (min, max) => (value) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const random = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(random(min, max));

// Event handling utilities
const addEventListeners = (element, events) =>
  Object.entries(events).forEach(([event, handler]) =>
    element.addEventListener(event, handler));

// ============================================
// SECTION 2: SIMPLIFIED CONFIGURATION
// ============================================

const CONFIG = {
  FRAME_RATE: 16,
  PLAYER_COOLDOWN: 350,
  ENEMY_SHOOT_INTERVAL: 4000,
  ENEMY_SHOOT_DELAY: 2000,
  BULLET_SPEED_PLAYER: 12,
  BULLET_SPEED_ENEMY: 6,
  ENEMY_MOVE_SPEED: 2,
  ENEMY_MOVE_DOWN: 7,
  ENEMY_FONT_SIZE: 32,
  ENEMY_ROWS: 4,
  ENEMY_COLS: 10,
  ENEMY_SPACING_X: 46,
  ENEMY_SPACING_Y: 46,
  INVULNERABILITY_TIME: 1500,
  DEATH_ANIMATION_DURATION: 500,
  SHOOT_ANIMATION_DURATION: 800,
  BLINK_DURATION: 100,
  PLAYER_MOVE_SPEED: 8,
  PLAYER_BOUNDARY_MARGIN: 20,
  SPEED_INCREASE_INTERVAL: 10000,
  SPEED_INCREASE_RATE: 0.2,

  SCORING: {
    ENEMY_POINTS: { '🤢': 10, '😷': 20, '😈': 50 },
    COMBO_MULTIPLIER: 1.5,
    COMBO_TIMEOUT: 2000
  },

  BACKGROUND: {
    STAR_COUNT: 200,
    NEBULA_COUNT: 12,
    STAR_SIZE_MIN: 0.5,
    STAR_SIZE_MAX: 4,
    NEBULA_SIZE_MIN: 80,
    NEBULA_SIZE_MAX: 300
  }
};

// Level Configuration
const LEVEL_CONFIG = [
  { 
    level: 1, enemyRows: 3, enemyCols: 8, 
    bulletSpeed: 4, enemySpeed: 1.5, shootInterval: 5000,
    enemyTypes: ['🤢']
  },
  { 
    level: 2, enemyRows: 4, enemyCols: 9,
    bulletSpeed: 5, enemySpeed: 1.8, shootInterval: 4500,
    enemyTypes: ['🤢', '😷']
  },
  { 
    level: 3, enemyRows: 4, enemyCols: 10,
    bulletSpeed: 6, enemySpeed: 2.0, shootInterval: 4000,
    enemyTypes: ['🤢', '😷', '😈']
  },
  { 
    level: 4, enemyRows: 5, enemyCols: 10,
    bulletSpeed: 7, enemySpeed: 2.2, shootInterval: 3500,
    enemyTypes: ['😷', '😈']
  },
  { 
    level: 5, enemyRows: 5, enemyCols: 11,
    bulletSpeed: 8, enemySpeed: 2.5, shootInterval: 3000,
    enemyTypes: ['😈']
  },
  {
    level: 6, isBoss: true,
    bulletSpeed: 9, enemySpeed: 1.0, shootInterval: 2000
  }
];

// Enemy types with attack patterns
const ENEMY_TYPES = [
  {
    face: '🤢', shootFace: '🤮', bulletColor: 'green', bulletShape: 'circle',
    patterns: ['single', 'line', 'spread'], patternWeights: [0.5, 0.3, 0.2],
    deathFrames: ['🤢', '💥', '🔥', '💨', '✨', '💫']
  },
  {
    face: '😷', shootFace: '😩', bulletColor: 'yellow', bulletShape: 'square',
    patterns: ['single', 'triple', 'burst'], patternWeights: [0.4, 0.4, 0.2],
    deathFrames: ['😷', '💥', '⚡', '💢', '✨', '🌟']
  },
  {
    face: '😈', shootFace: '👿', bulletColor: 'red', bulletStroke: 'black', bulletShape: 'diamond',
    patterns: ['single', 'tracking', 'wall', 'spiral', 'zigzag'], patternWeights: [0.2, 0.25, 0.2, 0.2, 0.15],
    deathFrames: ['😈', '💥', '🔥', '💀', '⚡', '☠️', '✨']
  }
];

// ============================================
// SECTION 3: SIMPLIFIED GAME STATE
// ============================================

const gameState = {
  player: {
    x: 0, y: 0, lives: 3, isInvulnerable: false, canShoot: true,
    sprite: '🗻', shootSprite: '🌋', blinkInterval: null, normalSprite: '🗻',
    shootTimeout: null, isInShootAnimation: false,
    tiltAngle: 0, engineParticles: [], trailParticles: [], shieldOpacity: 0,
    powerups: { rapid: 0, multi: 0, shield: 0, slow: 0 }
  },
  debug: {
    enabled: false,
    showEngineFlames: true,
    showShield: false,
    showTrails: true,
    tiltEnabled: true,
    forceShootAnimation: false
  },
  enemies: [],
  enemyDirection: 1,
  playerBullets: [],
  enemyBullets: [],
  powerups: [],
  isRunning: true,
  isGameOver: false,
  victory: false,
  level: 1,
  maxLevel: 6,
  isBossLevel: false,
  boss: null,
  levelComplete: false,
  gameStartTime: Date.now(),
  currentSpeedMultiplier: 1.0,
  mouse: { x: 0, y: 0 },
  keys: { left: false, right: false, up: false, down: false, space: false, w: false, a: false, s: false, d: false },
  hudElements: { scoreDisplay: null, levelDisplay: null, livesDisplay: null, gameOverScreen: null, gameOverTitle: null, finalScore: null },
  background: { stars: [], nebulas: [], initialized: false },
  scoring: { score: 0, comboCount: 0, lastKillTime: 0, totalKills: 0, scoreTexts: [] },
  enemyMovementState: {
    lastDirectionChange: 0
  }
};

// ============================================
// SECTION 4: SIMPLIFIED CLASSES
// ============================================

class RectangleObj {
  constructor(x = 0, y = 0, width = 0, height = 0, fillColor = '', strokeColor = '', strokeWidth = 2) {
    Object.assign(this, { x: Number(x), y: Number(y), width: Number(width), height: Number(height), fillColor, strokeColor, strokeWidth });
  }

  get area() { return this.width * this.height; }
  get left() { return this.x; }
  get right() { return this.x + this.width; }
  get top() { return this.y; }
  get bottom() { return this.y + this.height; }

  draw() {
    const { x, y, width, height, fillColor, strokeColor, strokeWidth } = this;
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.rect(x, y, width, height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

class TextC {
  constructor(text = '', x = 0, y = 0, fontSize = 0) {
    Object.assign(this, {
      text, x: Number(x), y: Number(y), fontSize: Number(fontSize),
      isDying: false, deathStartTime: 0, deathDuration: CONFIG.DEATH_ANIMATION_DURATION,
      originalText: text, scale: 1.0, alpha: 1.0,
      deathVariant: 'explosion', bounceVelocity: 0, explosionParticles: []
    });
  }

  draw() {
    if (this.isDying) this.drawDeathAnimation();
    else this.drawNormal();
  }

  drawNormal() {
    if (!ctx) {
      console.error('Canvas context not available for drawing');
      return;
    }
    const { text, x, y, fontSize } = this;

    // Store and restore context state properly
    const previousFont = ctx.font;
    const previousFillStyle = ctx.fillStyle;

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.fillText(text, x, y);

    // Restore previous values
    ctx.font = previousFont;
    ctx.fillStyle = previousFillStyle;
  }

  drawDeathAnimation() {
    const currentTime = Date.now();
    const elapsed = currentTime - this.deathStartTime;
    const progress = Math.min(elapsed / this.deathDuration, 1.0);

    ctx.save();

    const animationMethods = {
      explosion: () => this.drawExplosionAnimation(progress),
      fade_out: () => this.drawFadeOutAnimation(progress),
      shrink: () => this.drawShrinkAnimation(progress),
      bounce: () => this.drawBounceAnimation(progress)
    };

    (animationMethods[this.deathVariant] || animationMethods.explosion)();
    ctx.restore();

    if (progress >= 1.0) this.isDying = false;
  }

  getDeathFrames() {
    const enemyType = ENEMY_TYPES.find(type => type.face === this.originalText);
    if (enemyType?.deathFrames) return enemyType.deathFrames;

    const deathFrameSets = [
      ['💥', '💢', '✨', '🌟', '⭐'],
      ['🔥', '💥', '💢', '✨', '💨'],
      ['⚡', '💥', '✨', '🌟', '💫'],
      ['💀', '☠️', '💥', '✨', '💨'],
      ['✨', '🌟', '⭐', '💫', '💥']
    ];

    return deathFrameSets[randomInt(0, deathFrameSets.length)];
  }

  drawExplosionAnimation(progress) {
    this.alpha = 1.0;

    ctx.translate(this.x + this.fontSize / 2, this.y - this.fontSize / 2);
    ctx.globalAlpha = this.alpha;

    const deathFrames = this.getDeathFrames();
    const frameIndex = Math.floor(progress * deathFrames.length);
    const currentFrame = deathFrames[Math.min(frameIndex, deathFrames.length - 1)];

    ctx.font = `${this.fontSize}px Arial`;
    ctx.fillText(currentFrame, -this.fontSize / 2, this.fontSize / 2);

    if (Math.random() < 0.4) this.createExplosionParticle();
    this.drawExplosionParticles();
  }

  drawFadeOutAnimation(progress) {
    this.alpha = 1.0;

    ctx.translate(this.x + this.fontSize / 2, this.y - this.fontSize / 2);
    ctx.globalAlpha = this.alpha;

    const deathFrames = this.getDeathFrames();
    const frameIndex = Math.floor(progress * deathFrames.length);
    const currentFrame = deathFrames[Math.min(frameIndex, deathFrames.length - 1)];

    ctx.font = `${this.fontSize}px Arial`;
    ctx.fillText(currentFrame, -this.fontSize / 2, this.fontSize / 2);
  }

  drawShrinkAnimation(progress) {
    this.alpha = 1.0;

    ctx.translate(this.x + this.fontSize / 2, this.y - this.fontSize / 2);
    ctx.globalAlpha = this.alpha;

    const deathFrames = this.getDeathFrames();
    const frameIndex = Math.floor(progress * deathFrames.length);
    const currentFrame = deathFrames[Math.min(frameIndex, deathFrames.length - 1)];

    ctx.font = `${this.fontSize}px Arial`;
    ctx.fillText(currentFrame, -this.fontSize / 2, this.fontSize / 2);
  }

  drawBounceAnimation(progress) {
    this.bounceVelocity += 0.3;
    const bounceOffset = Math.sin(progress * Math.PI * 3) * 10 * (1 - progress);
    this.alpha = 1.0;

    ctx.translate(this.x + this.fontSize / 2, this.y - this.fontSize / 2 + bounceOffset);
    ctx.globalAlpha = this.alpha;

    const deathFrames = this.getDeathFrames();
    const frameIndex = Math.floor(progress * deathFrames.length);
    const currentFrame = deathFrames[Math.min(frameIndex, deathFrames.length - 1)];

    ctx.font = `${this.fontSize}px Arial`;
    ctx.fillText(currentFrame, -this.fontSize / 2, this.fontSize / 2);
  }

  createExplosionParticle() {
    this.explosionParticles.push({
      x: this.x + (Math.random() - 0.5) * this.fontSize,
      y: this.y + (Math.random() - 0.5) * this.fontSize,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1.0,
      size: Math.random() * 4 + 2,
      color: Math.random() > 0.5 ? '#ff6b6b' : '#ffd93d'
    });
  }

  drawExplosionParticles() {
    this.explosionParticles = this.explosionParticles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      particle.size *= 0.98;

      if (particle.life > 0) {
        ctx.save();
        ctx.globalAlpha = particle.life * this.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x - this.x, particle.y - this.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      }
      return false;
    });
  }

  startDeathAnimation() {
    this.isDying = true;
    this.deathStartTime = Date.now();

    const variants = ['explosion', 'fade_out', 'shrink', 'bounce'];
    this.deathVariant = variants[randomInt(0, variants.length)];

    Object.assign(this, { scale: 1.0, rotation: 0, alpha: 1.0, bounceVelocity: 0, explosionParticles: [] });
  }
}

class ScoreText {
  constructor(x, y, text, color = '#ffffff') {
    Object.assign(this, {
      x, y, text, color, startTime: Date.now(), duration: 1500,
      startY: y, alpha: 1.0, scale: 1.0
    });
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    const progress = elapsed / this.duration;

    if (progress >= 1.0) return false;

    this.y = this.startY - progress * 50;
    this.alpha = 1.0 - progress;
    this.scale = 1.0 + Math.sin(progress * Math.PI) * 0.3;

    return true;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.scale(this.scale, this.scale);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x / this.scale, this.y / this.scale);
    ctx.restore();
  }
}

// Powerup Class
class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 40;  // Collision width
    this.height = 40; // Collision height
    this.type = type;
    this.rotation = 0;
    this.alpha = 1.0;
    this.pulse = 0;
    this.active = true;
    
    // Powerup types and their properties
    const powerupTypes = {
      'rapid': { emoji: '⚡', color: '#ffaa00', name: 'Rapid Fire', duration: 10000 },
      'multi': { emoji: '🔥', color: '#ff4444', name: 'Multi-Shot', duration: 10000 },
      'shield': { emoji: '🛡️', color: '#00aaff', name: 'Extra Shield', duration: 0 }, // Permanent
      'slow': { emoji: '⏱️', color: '#00ff00', name: 'Slow Motion', duration: 10000 }
    };
    
    this.properties = powerupTypes[type] || powerupTypes.rapid;
  }

  update() {
    this.y += 2; // Fall down
    this.rotation += 0.05; // Rotate
    this.pulse += 0.1;
    
    // Remove if off screen
    if (this.y > canvas.height + 50) {
      this.active = false;
    }
  }

  draw() {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Pulsing glow effect
    const pulseValue = Math.sin(this.pulse) * 0.3 + 0.7;
    ctx.globalAlpha = pulseValue;
    
    // Outer glow
    ctx.shadowColor = this.properties.color;
    ctx.shadowBlur = 20;
    
    // Background circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Powerup emoji - centered
    ctx.font = '28px Arial';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'transparent';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.properties.emoji, 0, 0);
    
    ctx.restore();
    
    // Name label - centered below
    ctx.save();
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = this.properties.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.properties.name, this.x, this.y + 25);
    ctx.restore();
  }
}

// Boss Class
class Boss {
  constructor() {
    this.x = canvas.width / 2;
    this.y = 100;
    this.health = 100;
    this.maxHealth = 100;
    this.sprite = '👹';
    this.width = 80;
    this.height = 80;
    this.phase = 1;
    this.moveDirection = 1;
    this.moveSpeed = 2;
    this.lastShootTime = 0;
    this.shootCooldown = 1000;
    this.lastMinionSpawn = 0;
    this.minionSpawnRate = 5000;
  }

  update() {
    // Side-to-side movement
    this.x += this.moveSpeed * this.moveDirection;
    
    if (this.x >= canvas.width - 100 || this.x <= 100) {
      this.moveDirection *= -1;
    }
    
    // Update phase based on health
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent > 0.66) {
      this.phase = 1;
      this.minionSpawnRate = 99999; // No minions in phase 1
    } else if (healthPercent > 0.33) {
      this.phase = 2;
      this.minionSpawnRate = 5000;
      this.shootCooldown = 800;
    } else {
      this.phase = 3;
      this.minionSpawnRate = 3000;
      this.shootCooldown = 600;
    }
  }

  draw() {
    // Draw boss sprite
    ctx.save();
    ctx.font = '64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Boss glow effect
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 30;
    ctx.fillText(this.sprite, this.x, this.y);
    ctx.restore();
    
    // Draw health bar
    this.drawHealthBar();
  }

  drawHealthBar() {
    const barWidth = 300;
    const barHeight = 20;
    const x = (canvas.width - barWidth) / 2;
    const y = 30;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.33 ? '#ff4444' : '#ff0000';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Text
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CORONA KING - ${Math.ceil(this.health)}/${this.maxHealth} HP`, canvas.width / 2, y + barHeight / 2);
    ctx.restore();
  }

  shoot() {
    const currentTime = Date.now();
    if (currentTime - this.lastShootTime < this.shootCooldown) return;
    
    this.lastShootTime = currentTime;
    
    if (this.phase === 1) {
      // Phase 1: Triple shot
      for (let i = -1; i <= 1; i++) {
        gameState.enemyBullets.push(new Bullet(
          this.x + i * 20, this.y + 30, 12, 12,
          'red', 'black', 2, 'enemy', 'normal', 'diamond'
        ));
      }
    } else if (this.phase === 2) {
      // Phase 2: Tracking bullets
      const bullet = new Bullet(this.x, this.y + 30, 14, 14, 'orange', 'black', 2, 'enemy', 'tracking', 'star');
      bullet.trackingTarget = gameState.player;
      bullet.trackingSpeed = 0.15;
      gameState.enemyBullets.push(bullet);
    } else {
      // Phase 3: Wall pattern
      for (let i = 0; i < 5; i++) {
        const spacing = canvas.width / 6;
        gameState.enemyBullets.push(new Bullet(
          spacing * (i + 1), this.y + 30, 10, 10,
          'purple', 'white', 2, 'enemy', 'normal', 'square'
        ));
      }
    }
  }

  spawnMinion() {
    const currentTime = Date.now();
    if (currentTime - this.lastMinionSpawn < this.minionSpawnRate) return;
    
    this.lastMinionSpawn = currentTime;
    
    const numMinions = this.phase === 3 ? 3 : 2;
    for (let i = 0; i < numMinions; i++) {
      const minion = new TextC(
        '🦠',
        this.x + (Math.random() - 0.5) * 200,
        this.y + 60,
        CONFIG.ENEMY_FONT_SIZE
      );
      gameState.enemies.push(minion);
    }
  }
}

// Particle System
const createEngineParticle = (x, y) => ({
  x: x + (Math.random() - 0.5) * 10,
  y: y,
  vx: (Math.random() - 0.5) * 2,
  vy: Math.random() * 4 + 2,
  life: 1.0,
  size: Math.random() * 3 + 2,
  color: Math.random() > 0.7 ? '#ff6b6b' : '#ffa500',
  alpha: 1.0
});

const createTrailParticle = (x, y) => ({
  x: x + (Math.random() - 0.5) * 20,
  y: y + (Math.random() - 0.5) * 20,
  vx: (Math.random() - 0.5) * 1,
  vy: (Math.random() - 0.5) * 1,
  life: 1.0,
  size: Math.random() * 2 + 1,
  color: Math.random() > 0.5 ? '#4ecdc4' : '#ffffff',
  alpha: 1.0
});

const updateParticles = (particles) => {
  return particles.filter(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 0.02;
    particle.alpha = particle.life;
    particle.size *= 0.98;
    return particle.life > 0;
  });
};

// Player Visual Effects Class
class PlayerVisual {
  static draw(ctx, player) {
    const centerX = player.x;
    const centerY = player.y;

    // First, draw everything inside a save/restore to isolate transformations
    ctx.save();

    // Draw shield aura if invulnerable OR if debug shield is enabled
    const shouldShowShield = player.isInvulnerable || player.shieldOpacity > 0 || (DEBUG_MODE && gameState.debug.enabled && gameState.debug.showShield);
    if (shouldShowShield) {
      const shieldOpacity = gameState.debug.enabled && gameState.debug.showShield && !player.isInvulnerable ? 1.0 : player.shieldOpacity;
      this.drawShield(ctx, centerX, centerY, shieldOpacity);
    }

    // Apply rotation/tilt transformation (only if enabled in debug or normal mode)
    if (gameState.debug.enabled ? gameState.debug.tiltEnabled : true) {
      ctx.translate(centerX, centerY);
      ctx.rotate((player.tiltAngle * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Draw sprite with glow
    this.drawSprite(ctx, player, centerX, centerY);

    // Draw engine flames (draw below the sprite) - only if enabled
    if (!gameState.debug.enabled || gameState.debug.showEngineFlames) {
      this.drawEngineFlames(ctx, player);
    }

    // Draw movement trails - only if enabled
    if (!gameState.debug.enabled || gameState.debug.showTrails) {
      this.drawTrails(ctx, player, centerX, centerY);
    }

    ctx.restore();
  }

  static drawShield(ctx, x, y, opacity) {
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 5) * 0.2 + 0.5;
    const shieldOpacity = Math.max(opacity, pulse * 0.7);

    // Shield centered on emoji
    // Based on testing: sprite y=985, shield at y=973 is too low
    // For 32px emoji, center should be around y - 16 to y - 20
    const shieldX = x + 19;
    const shieldY = y - 5; // Offset to center shield on emoji's visual center

    // Outer shield ring
    ctx.save();
    ctx.globalAlpha = shieldOpacity;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(shieldX, shieldY, 25, 0, Math.PI * 2);
    ctx.stroke();

    // Inner shield ring
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(shieldX, shieldY, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  static drawSprite(ctx, player, x, y) {
    // Determine if shooting for glow color (or if debug forces it)
    const isShooting = player.isInShootAnimation || player.sprite === player.shootSprite ||
      (DEBUG_MODE && gameState.debug.enabled && gameState.debug.forceShootAnimation);

    // Shadow
    ctx.save();
    ctx.shadowColor = isShooting ? '#ff6600' : '#4ecdc4';
    ctx.shadowBlur = isShooting ? 25 : 15;
    ctx.globalAlpha = 0.8;
    ctx.font = '32px Georgia';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(player.sprite, x, y + 2);
    ctx.restore();

    // Main sprite with glow
    ctx.save();
    ctx.font = '32px Georgia';
    ctx.fillStyle = 'white';

    if (isShooting) {
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;
    } else {
      ctx.shadowColor = '#4ecdc4';
      ctx.shadowBlur = 12;
    }

    ctx.fillText(player.sprite, x, y);
    ctx.restore();
  }

  static drawEngineFlames(ctx, player) {
    if (!player.engineParticles || player.engineParticles.length === 0) return;

    ctx.save();
    player.engineParticles.forEach(particle => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  static drawTrails(ctx, player, x, y) {
    if (!player.trailParticles || player.trailParticles.length === 0) return;

    ctx.save();
    player.trailParticles.forEach(particle => {
      ctx.globalAlpha = particle.alpha * 0.6;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

class Bullet extends RectangleObj {
  constructor(x, y, width, height, fillColor, strokeColor = '', strokeWidth = 2, type = 'player', behavior = 'normal', shape = 'circle') {
    super(x, y, width, height, fillColor, strokeColor, strokeWidth);
    Object.assign(this, {
      type, behavior, shape, trail: [], maxTrailLength: 5, particles: [],
      trackingTarget: null, trackingSpeed: 0.1, angle: 0
    });
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) this.trail.shift();

    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.alpha = particle.life / particle.maxLife;
      return particle.life > 0;
    });

    const speeds = getCurrentBulletSpeeds();

    if (this.type === 'player') {
      this.y -= speeds.player;
    } else {
      const behaviors = {
        tracking: () => this.updateTrackingBullet(speeds.enemy),
        tracking_fixed: () => this.updateFixedTrackingBullet(speeds.enemy),
        spiral: () => this.updateSpiralBullet(speeds.enemy),
        zigzag: () => this.updateZigzagBullet(speeds.enemy),
        spread: () => this.updateSpreadBullet(speeds.enemy),
        burst: () => this.updateBurstBullet(speeds.enemy)
      };

      (behaviors[this.behavior] || (() => this.y += speeds.enemy))();
    }

    this.particles = this.particles.filter(particle => {
      particle.y += particle.vy;
      particle.x += particle.vx;
      particle.life--;
      particle.alpha = particle.life / particle.maxLife;
      return particle.life > 0;
    });
  }

  updateTrackingBullet(speed) {
    if (this.trackingTarget) {
      const dx = this.trackingTarget.x - this.x;
      const dy = this.trackingTarget.y - this.y;
      const targetAngle = Math.atan2(dy, dx);

      this.angle += (targetAngle - this.angle) * this.trackingSpeed;

      this.x += Math.cos(this.angle) * speed;
      this.y += Math.sin(this.angle) * speed;

      if (this.y > canvas.height - 50) {
        this.trackingTarget = null;
        this.behavior = 'tracking_fixed';
      }
    }
  }

  updateFixedTrackingBullet(speed) {
    this.x += Math.cos(this.angle) * speed;
    this.y += Math.sin(this.angle) * speed;
  }

  updateSpiralBullet(speed) {
    this.angle += 0.1;
    this.x += Math.cos(this.angle) * speed * 0.8;
    this.y += speed + Math.sin(this.angle) * speed * 0.3;
  }

  updateZigzagBullet(speed) {
    this.angle += 0.2;
    this.x += Math.sin(this.angle) * speed * 0.6;
    this.y += speed;
  }

  updateSpreadBullet(speed) {
    this.x += Math.sin(this.angle) * speed * 0.5;
    this.y += speed;
  }

  updateBurstBullet(speed) {
    this.x += Math.cos(this.angle) * speed * 0.7;
    this.y += Math.sin(this.angle) * speed * 0.7;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = 0.3;
    this.trail.forEach((point, index) => {
      const alpha = (index + 1) / this.trail.length;
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = this.fillColor;
      ctx.fillRect(point.x + this.width / 2 - 1, point.y + this.height / 2 - 1, 2, 2);
    });
    ctx.restore();

    ctx.save();
    ctx.shadowColor = this.fillColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = Math.min(this.width, this.height) / 2;

    ctx.beginPath();
    const shapes = {
      circle: () => ctx.arc(centerX, centerY, radius, 0, Math.PI * 2),
      square: () => ctx.rect(this.x, this.y, this.width, this.height),
      diamond: () => {
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX + radius, centerY);
        ctx.lineTo(centerX, centerY + radius);
        ctx.lineTo(centerX - radius, centerY);
        ctx.closePath();
      },
      star: () => {
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
    };

    (shapes[this.shape] || shapes.circle)();
    ctx.fill();
    if (this.strokeColor) ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    (shapes[this.shape] || shapes.circle)();
    ctx.fill();
    ctx.restore();

    this.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 2, 2);
      ctx.restore();
    });
  }

  createHitEffect() {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 20,
        maxLife: 20,
        alpha: 1,
        color: this.fillColor
      });
    }
  }
}

// ============================================
// SECTION 5: GAME FUNCTIONS
// ============================================

// ============================================
// SECTION 6: SIMPLIFIED GAME FUNCTIONS
// ============================================

// Mobile Detection and Controls
const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  ('ontouchstart' in window) ||
  (navigator.maxTouchPoints > 0);

const initializeMobileControls = () => {
  if (!isMobileDevice()) return;

  const mobileControls = document.getElementById('mobile-controls');
  if (!mobileControls) return;

  mobileControls.classList.add('show');

  const controlMappings = [
    { id: 'mobile-left', keys: ['left', 'a'] },
    { id: 'mobile-right', keys: ['right', 'd'] },
    { id: 'mobile-up', keys: ['up', 'w'] },
    { id: 'mobile-down', keys: ['down', 's'] },
    { id: 'mobile-shoot', keys: ['space'] }
  ];

  controlMappings.forEach(({ id, keys }) => {
    const element = document.getElementById(id);
    if (!element) return;

    const setKeys = (value) => keys.forEach(key => gameState.keys[key] = value);
    const vibrate = () => navigator.vibrate?.(keys.includes('space') ? 100 : 50);

    addEventListeners(element, {
      touchstart: (e) => { e.preventDefault(); setKeys(true); vibrate(); },
      touchend: (e) => { e.preventDefault(); setKeys(false); },
      keydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setKeys(true); } }
    });
  });
};

// Bullet speeds
const getCurrentBulletSpeeds = () => {
  const levelConfig = LEVEL_CONFIG[gameState.level - 1];
  const baseEnemySpeed = levelConfig ? levelConfig.bulletSpeed : 6;
  
  // Apply slow motion powerup
  const slowMultiplier = gameState.player.powerups.slow > Date.now() ? 0.5 : 1.0;
  
  return {
    player: CONFIG.BULLET_SPEED_PLAYER,
    enemy: baseEnemySpeed * slowMultiplier
  };
};

// Attack Pattern Functions
const selectAttackPattern = (enemyType) => {
  const { patterns, patternWeights } = enemyType;
  const random = Math.random();
  let cumulativeWeight = 0;

  for (let i = 0; i < patterns.length; i++) {
    cumulativeWeight += patternWeights[i];
    if (random <= cumulativeWeight) return patterns[i];
  }

  return patterns[0];
};

const executeAttackPattern = (enemy, pattern) => {
  const enemyType = ENEMY_TYPES.find(type => type.face === enemy.text);
  if (!enemyType) return;

  enemy.text = enemyType.shootFace;

  const patternFunctions = {
    single: () => createSingleBullet(enemy, enemyType),
    line: () => createLinePattern(enemy, enemyType),
    spread: () => createSpreadPattern(enemy, enemyType),
    triple: () => createTriplePattern(enemy, enemyType),
    burst: () => createBurstPattern(enemy, enemyType),
    tracking: () => createTrackingBullet(enemy, enemyType),
    wall: () => createWallPattern(enemy, enemyType),
    spiral: () => createSpiralPattern(enemy, enemyType),
    zigzag: () => createZigzagPattern(enemy, enemyType)
  };

  patternFunctions[pattern]?.();

  setTimeout(() => {
    if (!enemy.isDying) enemy.text = enemyType.face;
  }, CONFIG.SHOOT_ANIMATION_DURATION);
};

const createSingleBullet = (enemy, enemyType) => {
  gameState.enemyBullets.push(new Bullet(
    enemy.x, enemy.y, 10, 10,
    enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy', 'normal', enemyType.bulletShape
  ));
};

const createLinePattern = (enemy, enemyType) => {
  const sameRowEnemies = gameState.enemies.filter(e =>
    e.y === enemy.y && e.text === enemyType.face && !e.isDying
  );

  sameRowEnemies.sort((a, b) => a.x - b.x);

  sameRowEnemies.forEach(enemyInRow => {
    enemyInRow.text = enemyType.shootFace;
    gameState.enemyBullets.push(new Bullet(
      enemyInRow.x, enemyInRow.y, 8, 8,
      enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy', 'normal', enemyType.bulletShape
    ));

    setTimeout(() => {
      if (!enemyInRow.isDying) enemyInRow.text = enemyType.face;
    }, CONFIG.SHOOT_ANIMATION_DURATION);
  });
};

const createSpreadPattern = (enemy, enemyType) => {
  const angles = [-0.5, -0.25, 0, 0.25, 0.5];
  angles.forEach(angle => {
    const bullet = new Bullet(enemy.x, enemy.y, 8, 8, enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy');
    bullet.angle = angle;
    bullet.behavior = 'spread';
    gameState.enemyBullets.push(bullet);
  });
};

const createTriplePattern = (enemy, enemyType) => {
  const offsets = [-10, 0, 10];
  offsets.forEach(offset => {
    gameState.enemyBullets.push(new Bullet(
      enemy.x + offset, enemy.y, 10, 10,
      enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy'
    ));
  });
};

const createBurstPattern = (enemy, enemyType) => {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bullet = new Bullet(enemy.x, enemy.y, 8, 8, enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy');
    bullet.angle = angle;
    bullet.behavior = 'burst';
    gameState.enemyBullets.push(bullet);
  }
};

const createTrackingBullet = (enemy, enemyType) => {
  const bullet = new Bullet(enemy.x, enemy.y, 12, 12, enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy', 'tracking');
  bullet.trackingTarget = gameState.player;
  bullet.trackingSpeed = 0.15;
  gameState.enemyBullets.push(bullet);
};

const createSpiralPattern = (enemy, enemyType) => {
  const bullet = new Bullet(enemy.x, enemy.y, 8, 8, enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy', 'spiral', 'star');
  bullet.angle = Math.random() * Math.PI * 2;
  gameState.enemyBullets.push(bullet);
};

const createZigzagPattern = (enemy, enemyType) => {
  const bullet = new Bullet(enemy.x, enemy.y, 6, 6, enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy', 'zigzag', 'diamond');
  bullet.angle = Math.random() * Math.PI * 2;
  gameState.enemyBullets.push(bullet);
};

const createWallPattern = (enemy, enemyType) => {
  const sameRowEnemies = gameState.enemies.filter(e =>
    e.y === enemy.y && e.text === enemyType.face && !e.isDying
  );

  sameRowEnemies.sort((a, b) => a.x - b.x);

  const enemyCount = sameRowEnemies.length;
  const maxWallWidth = canvas.width * 0.8;
  const minSpacing = 30;

  const totalWallWidth = Math.min(maxWallWidth, enemyCount * minSpacing);
  const wallStartX = Math.max(0, (canvas.width - totalWallWidth) / 2);

  sameRowEnemies.forEach((enemyInRow, index) => {
    enemyInRow.text = enemyType.shootFace;

    const enemyWallStart = wallStartX + (index * (totalWallWidth / enemyCount));
    const enemyWallEnd = wallStartX + ((index + 1) * (totalWallWidth / enemyCount));
    const enemyBulletCount = Math.floor((enemyWallEnd - enemyWallStart) / 25);

    for (let i = 0; i < enemyBulletCount; i++) {
      const bulletX = enemyWallStart + (i * 25);
      gameState.enemyBullets.push(new Bullet(
        bulletX, enemyInRow.y, 8, 8,
        enemyType.bulletColor, enemyType.bulletStroke || '', 2, 'enemy'
      ));
    }

    setTimeout(() => {
      if (!enemyInRow.isDying) enemyInRow.text = enemyType.face;
    }, CONFIG.SHOOT_ANIMATION_DURATION);
  });
};

// Background Functions
const initializeBackground = () => {
  if (gameState.background.initialized) return;

  const createStars = () => Array.from({ length: CONFIG.BACKGROUND.STAR_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: random(CONFIG.BACKGROUND.STAR_SIZE_MIN, CONFIG.BACKGROUND.STAR_SIZE_MAX),
    opacity: Math.random() * 0.3 + 0.1,
    twinkle: Math.random() * Math.PI * 2,
    color: Math.random() > 0.8 ? '#ff6b6b' : Math.random() > 0.6 ? '#4ecdc4' : '#ffffff'
  }));

  const createNebulas = () => {
    const colors = ['#4a148c', '#1a237e', '#6a1b9a', '#2e1065', '#7b1fa2'];
    return Array.from({ length: CONFIG.BACKGROUND.NEBULA_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: random(CONFIG.BACKGROUND.NEBULA_SIZE_MIN, CONFIG.BACKGROUND.NEBULA_SIZE_MAX),
      opacity: Math.random() * 0.4 + 0.1,
      color: colors[randomInt(0, colors.length)],
      pulse: Math.random() * Math.PI * 2
    }));
  };

  gameState.background.stars = createStars();
  gameState.background.nebulas = createNebulas();
  gameState.background.initialized = true;
};

const updateBackground = () => {
  gameState.background.stars.forEach(star => star.twinkle += 0.1);
  gameState.background.nebulas.forEach(nebula => nebula.pulse += 0.05);
};

const drawBackground = () => {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#000000');
  gradient.addColorStop(0.3, '#0a0a0a');
  gradient.addColorStop(0.6, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  gameState.background.nebulas.forEach(nebula => {
    ctx.save();
    const pulseOpacity = nebula.opacity + Math.sin(nebula.pulse) * 0.1;
    ctx.globalAlpha = Math.max(0, Math.min(0.5, pulseOpacity));

    const nebulaGradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.size);
    nebulaGradient.addColorStop(0, nebula.color);
    nebulaGradient.addColorStop(0.5, nebula.color + '80');
    nebulaGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = nebulaGradient;
    ctx.beginPath();
    ctx.arc(nebula.x, nebula.y, nebula.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  gameState.background.stars.forEach(star => {
    ctx.save();
    const twinkleOpacity = star.opacity + Math.sin(star.twinkle) * 0.1;
    ctx.globalAlpha = Math.max(0, Math.min(1, twinkleOpacity));

    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();

    if (star.size > 2) {
      ctx.globalAlpha = twinkleOpacity * 0.15;
      ctx.shadowColor = star.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
};

// Game Functions
const createEnemies = () => {
  const enemies = [];
  const startX = ((canvas.width / 2) / 2) / 2;
  let currentY = 80;

  for (let row = 0; row < CONFIG.ENEMY_ROWS; row++) {
    const enemyType = ENEMY_TYPES[row % ENEMY_TYPES.length];

    for (let col = 0; col < CONFIG.ENEMY_COLS; col++) {
      const x = col === 0 ? startX : enemies[enemies.length - 1].x + CONFIG.ENEMY_SPACING_X;
      enemies.push(new TextC(enemyType.face, x, currentY, CONFIG.ENEMY_FONT_SIZE));
    }

    currentY += CONFIG.ENEMY_SPACING_Y;
  }

  return enemies;
};

// Level System Functions
const createEnemiesForLevel = (config) => {
  const enemies = [];
  const startX = ((canvas.width / 2) / 2) / 2;
  let currentY = 80;
  
  // Filter enemy types based on level config
  const availableEnemyTypes = ENEMY_TYPES.filter(type => 
    config.enemyTypes.includes(type.face)
  );
  
  for (let row = 0; row < config.enemyRows; row++) {
    const enemyType = availableEnemyTypes[row % availableEnemyTypes.length];
    
    for (let col = 0; col < config.enemyCols; col++) {
      const x = col === 0 ? startX : enemies[enemies.length - 1].x + CONFIG.ENEMY_SPACING_X;
      enemies.push(new TextC(enemyType.face, x, currentY, CONFIG.ENEMY_FONT_SIZE));
    }
    
    currentY += CONFIG.ENEMY_SPACING_Y;
  }
  
  return enemies;
};

const loadLevel = (levelNum) => {
  const config = LEVEL_CONFIG[levelNum - 1];
  
  if (!config) {
    console.error('Invalid level:', levelNum);
    return;
  }
  
  // Update level in gameState
  gameState.level = levelNum;
  
  // Clear existing state
  gameState.enemies = [];
  gameState.enemyBullets = [];
  gameState.powerups = [];
  
  if (config.isBoss) {
    // Boss level
    gameState.isBossLevel = true;
    gameState.boss = new Boss();
  } else {
    // Normal level
    gameState.isBossLevel = false;
    gameState.boss = null;
    gameState.enemies = createEnemiesForLevel(config);
  }
  
  // Reset enemy shoot interval
  if (gameState.enemyShootInterval) {
    clearInterval(gameState.enemyShootInterval);
  }
  
  gameState.enemyShootInterval = setInterval(() => {
    if (!gameState.isRunning) return;
    
    const shootCount = Math.min(6, gameState.enemies.length);
    for (let i = 0; i < shootCount; i++) {
      const randomEnemy = gameState.enemies[Math.floor(Math.random() * gameState.enemies.length)];
      setTimeout(() => {
        enemyShoot(randomEnemy);
      }, i * 1000);
    }
  }, config.shootInterval || CONFIG.ENEMY_SHOOT_INTERVAL);
  
  // Update HUD to reflect new level
  if (gameState.hudElements.levelDisplay) {
    gameState.hudElements.levelDisplay.textContent = levelNum;
  }
};

const showLevelTransition = (levelNum) => {
  const messages = [
    '',
    'LEVEL 2: Infection Spreads',
    'LEVEL 3: Pandemic Mode',
    'LEVEL 4: Critical Condition',
    'LEVEL 5: Final Defense',
    'BOSS FIGHT: Corona King!'
  ];
  
  const message = messages[levelNum - 1] || `Level ${levelNum}`;
  if (message) {
    createScoreText(
      canvas.width / 2,
      canvas.height / 2,
      message,
      false
    );
  }
};

const advanceLevel = () => {
  if (gameState.levelComplete) return; // Prevent multiple calls
  gameState.levelComplete = true;
  
  gameState.level++;
  
  // Check if we've completed all levels
  if (gameState.level > gameState.maxLevel) {
    // Final victory! (only if we completed level 6, the boss)
    console.log('Victory! Completed level:', gameState.level - 1, 'Max level:', gameState.maxLevel);
    endGame(true);
    return;
  }
  
  // Show transition message
  showLevelTransition(gameState.level);
  
  // Load next level after delay
  setTimeout(() => {
    gameState.levelComplete = false;
    loadLevel(gameState.level);
  }, 2500);
};

const checkLevelComplete = () => {
  // Prevent multiple calls during level transition
  if (gameState.levelComplete || gameState.isGameOver) return;
  
  if (gameState.isBossLevel) {
    // Boss defeated
    if (gameState.boss && gameState.boss.health <= 0) {
      console.log('Boss defeated! Current level:', gameState.level);
      gameState.boss = null;
      advanceLevel();
    }
  } else {
    // All enemies cleared
    if (gameState.enemies.length === 0 && !gameState.levelComplete) {
      console.log('Level complete! Current level:', gameState.level, 'Enemies left:', gameState.enemies.length);
      advanceLevel();
    }
  }
};

const checkCollision = (rect1, rect2) =>
  rect1.x < rect2.x + 38 &&
  rect1.x + rect1.width > rect2.x &&
  rect1.y < rect2.y + 32 &&
  rect1.y + rect1.height > rect2.y;

const calculateScore = (enemy) => {
  const basePoints = CONFIG.SCORING.ENEMY_POINTS[enemy.originalText] || 10;
  let totalPoints = basePoints;

  const currentTime = Date.now();
  const timeSinceLastKill = currentTime - gameState.scoring.lastKillTime;

  if (timeSinceLastKill < CONFIG.SCORING.COMBO_TIMEOUT) {
    gameState.scoring.comboCount++;
    totalPoints = Math.floor(basePoints * CONFIG.SCORING.COMBO_MULTIPLIER);
  } else {
    gameState.scoring.comboCount = 1;
  }

  gameState.scoring.lastKillTime = currentTime;
  gameState.scoring.totalKills++;
  gameState.scoring.score += totalPoints;

  return totalPoints;
};

// Level display update moved to loadLevel function

const createScoreText = (x, y, points, isCombo = false) => {
  const color = isCombo ? '#ffd700' : '#ffffff';
  const text = isCombo ? `+${points} COMBO!` : `+${points}`;

  const scoreX = x;
  const scoreY = y - 50;

  gameState.scoring.scoreTexts.push(new ScoreText(scoreX, scoreY, text, color));
};

const updateScoreTexts = () => {
  gameState.scoring.scoreTexts = gameState.scoring.scoreTexts.filter(scoreText => {
    const isAlive = scoreText.update();
    if (isAlive) scoreText.draw();
    return isAlive;
  });

  const MAX_SCORE_TEXTS = 20;
  if (gameState.scoring.scoreTexts.length > MAX_SCORE_TEXTS) {
    gameState.scoring.scoreTexts.splice(0, gameState.scoring.scoreTexts.length - MAX_SCORE_TEXTS);
  }
};

const spawnPowerup = (x, y) => {
  // Level-based drop rate
  let dropChance = 0.15; // 15% for levels 1-2
  if (gameState.level >= 5) {
    dropChance = 0.25; // 25% for level 5
  } else if (gameState.level >= 3) {
    dropChance = 0.20; // 20% for levels 3-4
  }
  
  // Boss minions always drop powerups
  const isBossMinion = gameState.isBossLevel;
  if (!isBossMinion && Math.random() > dropChance) return;
  
  const types = ['rapid', 'multi', 'shield', 'slow'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  gameState.powerups.push(new Powerup(x, y, randomType));
};

const handleEnemyHit = (bulletIndex, enemyIndex) => {
  const enemy = gameState.enemies[enemyIndex];
  if (!enemy || enemy.isDying) return;

  const points = calculateScore(enemy);
  const isCombo = gameState.scoring.comboCount > 1;
  createScoreText(enemy.x, enemy.y, points, isCombo);

  // Spawn powerup randomly
  spawnPowerup(enemy.x, enemy.y);

  enemy.startDeathAnimation();
  // Don't remove bullet here - it's removed in the game loop after collision

  setTimeout(() => {
    const currentIndex = gameState.enemies.indexOf(enemy);
    if (currentIndex !== -1) {
      gameState.enemies.splice(currentIndex, 1);
      // Check if level is complete after enemy is removed
      setTimeout(() => {
        checkLevelComplete();
      }, 100);
    }
  }, enemy.deathDuration);
};

const enemyShoot = (enemy) => {
  if (!enemy || enemy.isDying) return;

  const enemyType = ENEMY_TYPES.find(type => type.face === enemy.text);
  if (!enemyType) return;

  const pattern = selectAttackPattern(enemyType);
  executeAttackPattern(enemy, pattern);
};

const applyPowerupEffect = (powerup) => {
  if (powerup.properties.duration > 0) {
    gameState.player.powerups[powerup.type] = Date.now() + powerup.properties.duration;
  } else {
    // Permanent effects
    if (powerup.type === 'shield') {
      gameState.player.lives++;
    }
  }
};

const shootBullet = () => {
  if (!gameState.player.canShoot || !gameState.isRunning) return;

  // Clear any existing shoot timeout
  if (gameState.player.shootTimeout) {
    clearTimeout(gameState.player.shootTimeout);
  }

  gameState.player.sprite = gameState.player.shootSprite;
  gameState.player.isInShootAnimation = true;
  
  // Check for multi-shot powerup
  const hasMultiShot = gameState.player.powerups.multi > Date.now();
  const numBullets = hasMultiShot ? 3 : 1;
  
  for (let i = 0; i < numBullets; i++) {
    const offset = hasMultiShot ? (i - 1) * 10 : 0;
    gameState.playerBullets.push(new Bullet(
      gameState.player.x + 17 + offset,
      gameState.player.y - 20,
      5, 5, 'red', '', 2, 'player'
    ));
  }

  gameState.player.shootTimeout = setTimeout(() => {
    gameState.player.isInShootAnimation = false;
    // Reset sprite - always reset, blinking will handle visibility
    gameState.player.sprite = '🗻';
    gameState.player.shootTimeout = null;
  }, 200);

  // Check cooldown reduction from rapid fire powerup
  const cooldown = gameState.player.powerups.rapid > Date.now() ? CONFIG.PLAYER_COOLDOWN * 0.3 : CONFIG.PLAYER_COOLDOWN;
  
  gameState.player.canShoot = false;
  setTimeout(() => {
    gameState.player.canShoot = true;
  }, cooldown);
};

// Enemy Movement
const updateEnemyMovement = () => {
  const levelConfig = LEVEL_CONFIG[gameState.level - 1];
  const baseSpeed = levelConfig ? levelConfig.enemySpeed : 2;
  
  // Apply slow motion powerup effect
  const hasSlowMotion = gameState.player.powerups.slow > Date.now();
  const slowMultiplier = hasSlowMotion ? 0.5 : 1.0;
  
  const finalSpeed = baseSpeed * slowMultiplier;

  gameState.enemies.forEach((enemy, index) => {
    enemy.x += finalSpeed * gameState.enemyDirection;

    if (enemy.isDying) {
      enemy.draw();
      return;
    }

    if (enemy.x + finalSpeed + 45 > canvas.width || enemy.x + finalSpeed <= 0) {
      if (Date.now() - (gameState.enemyMovementState?.lastDirectionChange || 0) > 1000) {
        gameState.enemyDirection = -gameState.enemyDirection;
        gameState.enemyMovementState = { ...gameState.enemyMovementState, lastDirectionChange: Date.now() };

        gameState.enemies.forEach(e => {
          e.y += CONFIG.ENEMY_MOVE_DOWN;
        });

        if (enemy.y >= canvas.height - 30) {
          endGame(false);
          return;
        }
      }
    }

    enemy.draw();
  });
};

// ============================================
// SECTION 7: GAME FUNCTIONS
// ============================================

const handlePlayerMovement = () => {
  if (!gameState.isRunning || !ctx) return;

  const speed = CONFIG.PLAYER_MOVE_SPEED;

  // Get mouse position relative to canvas
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = gameState.mouse.x - canvasRect.left;
  const mouseY = gameState.mouse.y - canvasRect.top;

  // Keyboard movement
  if (gameState.keys.left || gameState.keys.a) {
    gameState.player.x = Math.max(CONFIG.PLAYER_BOUNDARY_MARGIN, gameState.player.x - speed);
  }
  if (gameState.keys.right || gameState.keys.d) {
    gameState.player.x = Math.min(canvas.width - 38 - CONFIG.PLAYER_BOUNDARY_MARGIN, gameState.player.x + speed);
  }
  if (gameState.keys.up || gameState.keys.w) {
    gameState.player.y = Math.max(canvas.height * 0.6, gameState.player.y - speed);
  }
  if (gameState.keys.down || gameState.keys.s) {
    gameState.player.y = Math.min(canvas.height - 15, gameState.player.y + speed);
  }

  // Mouse movement (only when mouse is moving within canvas bounds)
  if (!gameState.keys.left && !gameState.keys.right && !gameState.keys.a && !gameState.keys.d) {
    if (mouseX >= 0 && mouseX <= canvas.width) {
      gameState.player.x = clamp(CONFIG.PLAYER_BOUNDARY_MARGIN, canvas.width - 38 - CONFIG.PLAYER_BOUNDARY_MARGIN)(mouseX - 19);
    }
  }

  // Tilt calculation based on movement direction
  let targetTilt = 0;
  let isMoving = false;

  if (gameState.keys.left || gameState.keys.a) {
    targetTilt = -15;
    isMoving = true;
  } else if (gameState.keys.right || gameState.keys.d) {
    targetTilt = 15;
    isMoving = true;
  }

  // Smooth tilt interpolation
  gameState.player.tiltAngle = lerp(gameState.player.tiltAngle, targetTilt, 0.2);

  // Create trail particles when moving
  if (isMoving && Math.random() < 0.3) {
    const trailX = gameState.player.x;
    const trailY = gameState.player.y;
    if (gameState.player.trailParticles.length < 10) {
      gameState.player.trailParticles.push(createTrailParticle(trailX, trailY));
    }
  }
};

const handlePlayerShooting = () => {
  if (gameState.keys.space && gameState.isRunning) {
    shootBullet();
  }
};

const blinkPlayer = () => {
  // Clear any existing blink animation
  if (gameState.player.blinkInterval) {
    clearInterval(gameState.player.blinkInterval);
    gameState.player.blinkInterval = null;
  }

  // Clear shooting sprite timeout to prevent it from changing sprite during blink
  if (gameState.player.shootTimeout) {
    clearTimeout(gameState.player.shootTimeout);
    gameState.player.shootTimeout = null;
    // Cancel shooting animation - we're taking damage, so stop showing shoot sprite
    gameState.player.isInShootAnimation = false;
    // Immediately switch to normal sprite
    gameState.player.sprite = gameState.player.normalSprite;
  }

  // Set shield opacity to maximum for visual effect
  gameState.player.shieldOpacity = 1.0;

  let blinkCount = 0;
  const maxBlinks = 6;
  let isVisible = true;

  gameState.player.blinkInterval = setInterval(() => {
    isVisible = !isVisible;

    // Pulse shield opacity
    gameState.player.shieldOpacity = isVisible ? 1.0 : 0.3;

    // Show the appropriate sprite (no longer hide it)
    gameState.player.sprite = gameState.player.isInShootAnimation ? gameState.player.shootSprite : gameState.player.normalSprite;

    blinkCount++;

    if (blinkCount >= maxBlinks) {
      // Ensure we end with visible sprite in correct state
      gameState.player.sprite = gameState.player.isInShootAnimation ? gameState.player.shootSprite : gameState.player.normalSprite;
      gameState.player.shieldOpacity = 0;
      clearInterval(gameState.player.blinkInterval);
      gameState.player.blinkInterval = null;
    }
  }, CONFIG.BLINK_DURATION);
};

const handlePlayerHit = () => {
  if (gameState.player.isInvulnerable) return;

  gameState.player.isInvulnerable = true;
  gameState.player.lives--;
  blinkPlayer();

  setTimeout(() => {
    gameState.player.isInvulnerable = false;
  }, CONFIG.INVULNERABILITY_TIME);

  if (gameState.player.lives <= 0) {
    endGame(false);
  }
};

const endGame = (victory) => {
  if (gameState.isGameOver) return;

  console.log('endGame called with victory=', victory, 'current level=', gameState.level);
  
  gameState.isRunning = false;
  gameState.isGameOver = true;
  gameState.victory = victory;
  gameState.gameOverText = victory ? 'YOU SAVED THE WORLD!' : 'GAME OVER';

  clearInterval(gameState.enemyShootInterval);

  // Clear any active animations
  if (gameState.player.blinkInterval) {
    clearInterval(gameState.player.blinkInterval);
    gameState.player.blinkInterval = null;
  }

  if (gameState.player.shootTimeout) {
    clearTimeout(gameState.player.shootTimeout);
    gameState.player.shootTimeout = null;
  }

  // Reset shooting animation state
  gameState.player.isInShootAnimation = false;

  // Clear all particles
  gameState.player.engineParticles = [];
  gameState.player.trailParticles = [];
  gameState.player.tiltAngle = 0;
  gameState.player.shieldOpacity = 0;

  // Restore sprite to normal
  gameState.player.sprite = '🗻';

  // Enable cursor on death/end screen
  document.body.classList.add('show-cursor');

  showGameOverScreen(victory);
};

const resetGame = () => {
  if (gameState.enemyShootInterval) {
    clearInterval(gameState.enemyShootInterval);
  }

  // Clear any existing animations
  if (gameState.player.blinkInterval) {
    clearInterval(gameState.player.blinkInterval);
  }

  if (gameState.player.shootTimeout) {
    clearTimeout(gameState.player.shootTimeout);
  }

  // Disable cursor when restarting the game
  document.body.classList.remove('show-cursor');

  initializeBackground();

  Object.assign(gameState, {
    playerBullets: [],
    enemyBullets: [],
    powerups: [],
    player: { ...gameState.player, lives: 3, isInvulnerable: false, canShoot: true, sprite: '🗻', x: canvas.width / 2, y: canvas.height - 15, blinkInterval: null, normalSprite: '🗻', shootTimeout: null, isInShootAnimation: false, tiltAngle: 0, engineParticles: [], trailParticles: [], shieldOpacity: 0, powerups: { rapid: 0, multi: 0, shield: 0, slow: 0 } },
    debug: gameState.debug, // Preserve debug state on reset
    isRunning: true,
    isGameOver: false,
    level: 1,
    isBossLevel: false,
    boss: null,
    levelComplete: false,
    scoring: { score: 0, comboCount: 0, lastKillTime: 0, totalKills: 0, scoreTexts: [] },
    enemyDirection: 1,
    enemyMovementState: {
      lastDirectionChange: 0
    },
    gameStartTime: Date.now()
  });
  
  // Load level 1
  loadLevel(1);

  hideGameOverScreen();
};


// ============================================
// SECTION 8: HUD MANAGEMENT
// ============================================

const initializeHUD = () => {
  Object.assign(gameState.hudElements, {
    scoreDisplay: document.getElementById('score-display'),
    levelDisplay: document.getElementById('level-display'),
    livesDisplay: document.getElementById('lives-display'),
    gameOverScreen: document.getElementById('game-over-screen'),
    gameOverTitle: document.getElementById('game-over-title'),
    finalScore: document.getElementById('final-score')
  });
};

const drawPowerupStatus = () => {
  const activePowerups = [];
  
  // Check for active powerups
  if (gameState.player.powerups.rapid > Date.now()) {
    const timeLeft = Math.ceil((gameState.player.powerups.rapid - Date.now()) / 1000);
    activePowerups.push({ emoji: '⚡', name: 'Rapid Fire', time: timeLeft, color: '#ffaa00' });
  }
  if (gameState.player.powerups.multi > Date.now()) {
    const timeLeft = Math.ceil((gameState.player.powerups.multi - Date.now()) / 1000);
    activePowerups.push({ emoji: '🔥', name: 'Multi-Shot', time: timeLeft, color: '#ff4444' });
  }
  if (gameState.player.powerups.slow > Date.now()) {
    const timeLeft = Math.ceil((gameState.player.powerups.slow - Date.now()) / 1000);
    activePowerups.push({ emoji: '⏱️', name: 'Slow Motion', time: timeLeft, color: '#00ff00' });
  }
  
  if (activePowerups.length === 0) return;
  
  // Draw powerup status in bottom left
  let yPos = canvas.height - 60;
  activePowerups.forEach(powerup => {
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, yPos - 25, 180, 40);
    
    // Border
    ctx.strokeStyle = powerup.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, yPos - 25, 180, 40);
    
    // Emoji
    ctx.font = 'bold 24px Arial';
    ctx.fillText(powerup.emoji, 25, yPos);
    
    // Name
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = powerup.color;
    ctx.fillText(powerup.name, 55, yPos - 5);
    
    // Timer
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${powerup.time}s`, 155, yPos);
    
    ctx.restore();
    
    yPos -= 50;
  });
};

const updateHUD = () => {
  try {
    // Level updates now happen in checkLevelComplete()
    const updates = {
      scoreDisplay: () => gameState.hudElements.scoreDisplay.textContent = gameState.scoring.score,
      levelDisplay: () => gameState.hudElements.levelDisplay.textContent = gameState.level,
      livesDisplay: () => gameState.hudElements.livesDisplay.textContent = gameState.player.lives
    };

    Object.entries(updates).forEach(([key, updateFn]) => {
      if (gameState.hudElements[key]) updateFn();
    });
  } catch (error) {
    console.error('Error updating HUD:', error);
  }
};

const showGameOverScreen = (isVictory = false) => {
  if (gameState.hudElements.gameOverScreen) {
    gameState.hudElements.gameOverScreen.style.display = 'flex';
    if (gameState.hudElements.gameOverTitle) {
      gameState.hudElements.gameOverTitle.textContent = isVictory ? 'VICTORY!' : 'GAME OVER';
    }
    if (gameState.hudElements.finalScore) {
      gameState.hudElements.finalScore.textContent = gameState.scoring.score;
    }
  }
};

const hideGameOverScreen = () => {
  if (gameState.hudElements.gameOverScreen) {
    gameState.hudElements.gameOverScreen.style.display = 'none';
  }
};

// ============================================
// SECTION 9: GAME LOOP & INITIALIZATION
// ============================================

let lastTime = 0;

const gameLoop = (currentTime) => {
  requestAnimationFrame(gameLoop);

  if (!gameState.isRunning) {
    if (gameState.isGameOver) {
      drawBackground();
      updateBackground();

      ctx.font = '168px';
      ctx.fillStyle = gameState.victory ? 'green' : 'red';
      ctx.fillText(gameState.gameOverText, (canvas.width / 2) - 200, canvas.height / 2);

      ctx.font = '48px';
      ctx.fillStyle = 'white';
      const timeSurvived = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
      ctx.fillText(`Score: ${gameState.scoring.score}`, (canvas.width / 2) - 100, canvas.height / 2 + 100);
      ctx.fillText(`Time Survived: ${timeSurvived}s`, (canvas.width / 2) - 150, canvas.height / 2 + 160);
    }
    return;
  }

  const deltaTime = currentTime - lastTime;
  if (deltaTime < CONFIG.FRAME_RATE) return;
  lastTime = currentTime;

  drawBackground();
  updateBackground();

  handlePlayerMovement();
  handlePlayerShooting();

  updateHUD();
  updateScoreTexts();

  // Draw powerup status
  drawPowerupStatus();

  // Update particles
  if (gameState.player.engineParticles) {
    gameState.player.engineParticles = updateParticles(gameState.player.engineParticles);
  }
  if (gameState.player.trailParticles) {
    gameState.player.trailParticles = updateParticles(gameState.player.trailParticles);
  }

  // Spawn engine particles
  if (gameState.isRunning && Math.random() < 0.7) {
    const engineX = gameState.player.x;
    const engineY = gameState.player.y + 20;
    if (gameState.player.engineParticles.length < 15) {
      gameState.player.engineParticles.push(createEngineParticle(engineX, engineY));
    }
  }

  // Draw player with all visual effects
  PlayerVisual.draw(ctx, gameState.player);

  updateEnemyMovement();

  // Update and draw enemy bullets
  gameState.enemyBullets.forEach((bullet, index) => {
    bullet.update();
    bullet.draw();

    if (bullet.y > canvas.height) {
      gameState.enemyBullets.splice(index, 1);
      return;
    }

    if (checkCollision(bullet, { x: gameState.player.x, y: gameState.player.y, width: 38, height: 32 })) {
      bullet.createHitEffect();
      handlePlayerHit();
      gameState.enemyBullets.splice(index, 1);
    }
  });

  // Boss update and rendering
  if (gameState.isBossLevel && gameState.boss) {
    gameState.boss.update();
    gameState.boss.draw();
    
    // Boss shooting
    gameState.boss.shoot();
    
    // Boss spawn minions
    gameState.boss.spawnMinion();
  }

  // Update and draw player bullets (reverse iteration to handle splicing)
  for (let bulletIndex = gameState.playerBullets.length - 1; bulletIndex >= 0; bulletIndex--) {
    const bullet = gameState.playerBullets[bulletIndex];
    bullet.update();
    bullet.draw();

    if (bullet.y < 0) {
      gameState.playerBullets.splice(bulletIndex, 1);
      continue;
    }

    // Check collision with boss
    if (gameState.isBossLevel && gameState.boss) {
      const bossHitbox = {
        x: gameState.boss.x - 40,
        y: gameState.boss.y - 32,
        width: 80,
        height: 64
      };
      
      if (checkCollision(bullet, bossHitbox)) {
        bullet.createHitEffect();
        gameState.boss.health -= 2; // 2 damage per hit, 50 hits to defeat
        gameState.playerBullets.splice(bulletIndex, 1);
        
        // Check if boss is defeated
        if (gameState.boss.health <= 0) {
          const points = 1000;
          createScoreText(gameState.boss.x, gameState.boss.y, points, true);
          gameState.scoring.score += points;
          checkLevelComplete();
        }
        continue;
      }
    }

    // Check collision with enemies
    let hitEnemy = false;
    for (let enemyIndex = gameState.enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = gameState.enemies[enemyIndex];
      if (!enemy.isDying && checkCollision(bullet, enemy)) {
        bullet.createHitEffect();
        handleEnemyHit(bulletIndex, enemyIndex);
        hitEnemy = true;
        break;
      }
    }
    
    // Remove bullet after handling hit to prevent multiple collisions
    if (hitEnemy) {
      gameState.playerBullets.splice(bulletIndex, 1);
    }
  }

  // Update and draw powerups
  for (let i = gameState.powerups.length - 1; i >= 0; i--) {
    const powerup = gameState.powerups[i];
    powerup.update();
    powerup.draw();

    // Check collision with player
    if (checkCollision(powerup, { x: gameState.player.x, y: gameState.player.y, width: 38, height: 32 })) {
      applyPowerupEffect(powerup);
      
      // Show powerup notification
      createScoreText(gameState.player.x, gameState.player.y, powerup.properties.name, false);
      
      gameState.powerups.splice(i, 1);
      continue;
    }

    // Remove inactive powerups
    if (!powerup.active) {
      gameState.powerups.splice(i, 1);
    }
  }

  if (gameState.enemies.length === 0 && gameState.isRunning) {
    endGame(true);
  }
};

// Global restart function
const restartGame = () => {
  hideGameOverScreen();
  resetGame();
};

// Event Listeners
// Mouse controls
addEventListener('mousemove', (event) => {
  gameState.mouse.x = event.clientX;
  gameState.mouse.y = event.clientY;

  if (gameState.keys.left || gameState.keys.right || gameState.keys.a || gameState.keys.d) return;
  gameState.player.x = event.clientX;
});

addEventListener('click', (event) => {
  if (!gameState.isRunning) return;
  shootBullet();
});

// Keyboard controls
addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowLeft':
    case 'KeyA':
      gameState.keys.left = true;
      gameState.keys.a = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      gameState.keys.right = true;
      gameState.keys.d = true;
      break;
    case 'ArrowUp':
    case 'KeyW':
      gameState.keys.up = true;
      gameState.keys.w = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      gameState.keys.down = true;
      gameState.keys.s = true;
      break;
    case 'Space':
      event.preventDefault();
      gameState.keys.space = true;
      break;
  }
});

addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowLeft':
    case 'KeyA':
      gameState.keys.left = false;
      gameState.keys.a = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      gameState.keys.right = false;
      gameState.keys.d = false;
      break;
    case 'ArrowUp':
    case 'KeyW':
      gameState.keys.up = false;
      gameState.keys.w = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      gameState.keys.down = false;
      gameState.keys.s = false;
      break;
    case 'Space':
      gameState.keys.space = false;
      break;
  }
});

// Window resize
window.addEventListener('resize', () => {
  canvas.width = Math.min(window.innerWidth - 60, 1200);
  canvas.height = Math.min(window.innerHeight - 20, 1000);

  setTimeout(() => {
    resetGame();
  }, 1500);
});

// Prevent various interactions
addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('selectstart', (e) => e.preventDefault());
document.addEventListener('dragstart', (e) => e.preventDefault());
canvas.addEventListener('selectstart', (e) => e.preventDefault());
canvas.addEventListener('dragstart', (e) => e.preventDefault());

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, false);

// Prevent zoom gestures
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// Debug Functions
const toggleDebugPanel = () => {
  if (!DEBUG_MODE) return;

  const panel = document.getElementById('debug-panel');
  if (panel) {
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
    gameState.debug.enabled = !isVisible;
    updateDebugCheckboxes();
  }
};

const updateDebugCheckboxes = () => {
  if (!DEBUG_MODE) return;

  const toggles = {
    'debug-engine': () => gameState.debug.showEngineFlames,
    'debug-shield': () => gameState.debug.showShield,
    'debug-trails': () => gameState.debug.showTrails,
    'debug-tilt': () => gameState.debug.tiltEnabled,
    'debug-shoot': () => gameState.debug.forceShootAnimation
  };

  Object.entries(toggles).forEach(([id, getter]) => {
    const checkbox = document.getElementById(id);
    if (checkbox) checkbox.checked = getter();
  });
};

const triggerShieldTest = () => {
  if (!DEBUG_MODE || !gameState.debug.enabled) return;
  gameState.player.shieldOpacity = 1.0;
  gameState.player.isInvulnerable = true;
  setTimeout(() => {
    gameState.player.shieldOpacity = 0;
    gameState.player.isInvulnerable = false;
  }, 3000);
};

const triggerTiltTest = () => {
  if (!DEBUG_MODE || !gameState.debug.enabled) return;
  let target = 15;
  const interval = setInterval(() => {
    gameState.player.tiltAngle = lerp(gameState.player.tiltAngle, target, 0.3);
    if (Math.abs(gameState.player.tiltAngle - target) < 0.1) {
      target = -target;
    }
  }, 100);
  setTimeout(() => {
    clearInterval(interval);
    gameState.player.tiltAngle = 0;
  }, 5000);
};

const clearAllParticles = () => {
  if (!DEBUG_MODE) return;
  gameState.player.engineParticles = [];
  gameState.player.trailParticles = [];
};

// Setup debug checkboxes
if (DEBUG_MODE) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const toggles = {
        'debug-engine': (val) => gameState.debug.showEngineFlames = val,
        'debug-shield': (val) => gameState.debug.showShield = val,
        'debug-trails': (val) => gameState.debug.showTrails = val,
        'debug-tilt': (val) => gameState.debug.tiltEnabled = val,
        'debug-shoot': (val) => { gameState.debug.forceShootAnimation = val; if (val) gameState.player.isInShootAnimation = true; }
      };

      Object.entries(toggles).forEach(([id, setter]) => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
          checkbox.addEventListener('change', () => setter(checkbox.checked));
        }
      });

      // Add keyboard shortcut (F1 to toggle debug panel)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
          e.preventDefault();
          toggleDebugPanel();
        }
      });
    }, 100);
  });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  // Check if canvas exists
  if (!canvas || !ctx) {
    console.error('Canvas not available');
    return;
  }

  // Initialize canvas dimensions
  canvas.width = Math.min(window.innerWidth - 60, 1200);
  canvas.height = Math.min(window.innerHeight - 20, 1000);

  // Initialize player position
  gameState.player.x = canvas.width / 2;
  gameState.player.y = canvas.height - 15;
  gameState.mouse.x = canvas.width / 2;
  gameState.mouse.y = canvas.height / 2;

  initializeHUD();
  initializeMobileControls();
  initializeBackground();

  // Load level 1
  loadLevel(1);

  requestAnimationFrame(gameLoop);
});