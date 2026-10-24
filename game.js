// --- 1. SETUP AND CONSTANTS (Screen Size and Scoring Implemented) ---

// Screen Dimensions (Using the wider screen from the previous step)
const GAME_WIDTH = 2400; 
const GAME_HEIGHT = 1200; 
const ARENA_WIDTH = 6000;
const ARENA_HEIGHT = 3600;
const ARENA_OBSTACLES = [
    { x: 1150, y: 720, radius: 118, type: 'rock', rotation: 0.3 },
    { x: 2060, y: 1380, radius: 92, type: 'wreck', rotation: -0.55 },
    { x: 850, y: 2450, radius: 132, type: 'rock', rotation: -0.2 },
    { x: 1880, y: 3020, radius: 98, type: 'wreck', rotation: 0.8 },
    { x: 3100, y: 610, radius: 100, type: 'wreck', rotation: 0.4 },
    { x: 4180, y: 920, radius: 145, type: 'rock', rotation: -0.65 },
    { x: 5200, y: 1560, radius: 108, type: 'wreck', rotation: -0.2 },
    { x: 4300, y: 2700, radius: 125, type: 'rock', rotation: 0.55 },
    { x: 5350, y: 3150, radius: 92, type: 'wreck', rotation: 0.25 },
    { x: 3000, y: 3020, radius: 150, type: 'rock', rotation: 0.1 },
    { x: 850, y: 1250, radius: 88, type: 'wreck', rotation: 0.7 },
    { x: 5200, y: 2380, radius: 110, type: 'rock', rotation: -0.3 },
];
const ASTEROID_DEBRIS = [
    { x: 1510, y: 400, radius: 48, type: 'rock', rotation: 0.15 },
    { x: 2500, y: 820, radius: 42, type: 'rock', rotation: 0.45 },
    { x: 3500, y: 1400, radius: 54, type: 'rock', rotation: -0.35 },
    { x: 4850, y: 700, radius: 46, type: 'rock', rotation: 0.65 },
    { x: 1000, y: 1800, radius: 52, type: 'rock', rotation: -0.2 },
    { x: 2500, y: 2400, radius: 44, type: 'rock', rotation: 0.8 },
    { x: 3500, y: 2600, radius: 56, type: 'rock', rotation: -0.55 },
    { x: 4900, y: 3100, radius: 48, type: 'rock', rotation: 0.3 },
];
const ASTEROID_ARENA_OBSTACLES = [...ARENA_OBSTACLES, ...ASTEROID_DEBRIS];

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameShell = document.getElementById('gameShell');
const homeVideo = document.getElementById('homeVideo');
const touchControls = document.getElementById('touchControls');
const soundToggle = document.getElementById('soundToggle');
const gameAnnouncement = document.getElementById('gameAnnouncement');
const moveStick = document.getElementById('moveStick');
const moveStickThumb = moveStick.querySelector('span');

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

let score = 0; 
let isPaused = false;
let settings = {
    sound: true,
    scanlines: true,
    theme: 'retro',
};
let gameState = 'menu'; 
let menuState = 'main'; 
let selectedJetId = 'delta';
let homeVideoPlayRequested = false;
let menuButtons = {}; // Global object to store button coordinates for click detection
let hoveredButtonKey = null; // currently hovered button id
let currentDrawButtonKey = null; // key for the button currently being drawn
let selectedMenuButtonKey = null;
let lastAnnouncement = '';

// Time Tracking (Fixed Time Step)
let lastTime = 0;
const TARGET_FPS = 60;
const TIME_PER_TICK = 1000 / TARGET_FPS; 
let accruedTime = 0; 
let tick = 0; 
let totalFrames = 0; 

// Input handling variables
let keys = {};
let touchKeys = {};
let isFiring = true; 
let audioContext = null;
let lastSoundTimes = {};

// Object Arrays
let enemyBullets = [];
let playerBullets = [];
let effects = [];
let pickups = []; 
let bigOrbs = []; // phase-2 delayed explosive projectiles
let strikeLines = []; // telegraphed sweeping lines (phase 2)
let mines = []; // stationary delayed mines (phase 2)
let laserArms = []; // rotating telegraphed lasers for phase 3
let minions = [];
let gameStage = 'minions';
let minionSpawnCounter = 0;
let bossArrivalFrames = 0;
let waveNumber = 1;
let currentMapIndex = 0;
let loopNumber = 1;
let difficultyKey = 'normal';
let waveSpawnQuota = 0;
let waveSpawnedCount = 0;
let waveBreakFrames = 0;
let lightningSpawnCounter = 0;
let loopRestartFrames = 0;
let sectorUpgradeAwarded = false;
let checkpointMapIndex = 0;
let campaignProgress = { unlockedMapIndex: 0, upgrades: 0 };
let meteorSpawnCounter = 0;
let meteors = [];
let cameraX = 0;
let cameraY = 0;
let mouseAimWorld = null;

// Player State
let isInvulnerable = false; 
let invulnerabilityTimer = 0; 
const INVULNERABILITY_FRAMES = 90; 

// Player Firing
const PLAYER_FIRE_DELAY = 6; // Faster shooting
let playerFireCounter = 0;
let powerMissiles = [];
let worldSlowCounter = 0;
let isResolvingUltimate = false;

// SCALING FACTOR for Illusion of Strength (x10)
const SCALE_FACTOR = 10;

// Boss Phase Constants
const BOSS_MAX_HEALTH = 600 * SCALE_FACTOR; // 600 HP

// Scoring Constants
const BASE_SCORE_BULLET = 10;
const SCORE_HIT_PENALTY = -100; 
const SCORE_DEFEAT_BONUS = 1000 * SCALE_FACTOR; 

const TIME_BONUS_START = 5000;
const TIME_BONUS_DECREMENT_PER_SECOND = 17; 

// Drop Rates
const HEALTH_DROP_CHANCE = 0.007; 

// Pickup Properties
const PICKUP_MAX_LIFE = 480; 
const PICKUP_SPEED_PER_TICK = 2.5; 

// Movement Tuning 
const PLAYER_SPEED = 10;      
const PLAYER_BULLET_SPEED = 15; 
const ENEMY_BULLET_SPEED = 9;   
const BOSS_FREQUENCY = 0.012; 
const BOSS_AMPLITUDE = 100; 

const MAX_PLAYER_HEALTH = 100;
const JET_OPTIONS = [
    {
        id: 'delta',
        name: 'DELTA FIGHTER',
        subtitle: 'FAST AND SIMPLE',
        description: 'Arrowhead design for quick, easy-to-fly action.',
        perk: '+20% speed',
        color: '#28e7ff',
        speed: 1.2,
        maxHealth: 100,
        damageMultiplier: 1,
        damageTakenMultiplier: 1,
        startingGuns: 1,
        shape: 'delta',
    },
    {
        id: 'twin',
        name: 'TWIN-TAIL JET',
        subtitle: 'BALANCED ALL-ROUNDER',
        description: 'Twin engines and cannons deliver two shots at once.',
        perk: 'Twin-shot fire',
        color: '#ff5ab3',
        speed: 1,
        maxHealth: 100,
        damageMultiplier: 1,
        damageTakenMultiplier: 1,
        startingGuns: 2,
        shape: 'twin',
    },
    {
        id: 'stealth',
        name: 'STEALTH WING',
        subtitle: 'WIDE AND SNEAKY',
        description: 'A broad armored wing survives more hits, but moves slower.',
        perk: '150 HP | 20% less damage',
        color: '#a5f02f',
        speed: 0.82,
        maxHealth: 150,
        damageMultiplier: 1,
        damageTakenMultiplier: 0.8,
        startingGuns: 1,
        shape: 'stealth',
    },
    {
        id: 'forward',
        name: 'FORWARD-SWEPT ACE',
        subtitle: 'AGILE AND AGGRESSIVE',
        description: 'A sharp forward-swept wing rewards precise, fast play.',
        perk: '+35% weapon damage',
        color: '#ffc21f',
        speed: 1.08,
        maxHealth: 100,
        damageMultiplier: 1.35,
        damageTakenMultiplier: 1,
        startingGuns: 1,
        shape: 'forward',
    },
];
const SHARED_POWERUPS = {
    spread: { label: 'SPREAD SHOT', color: '#43efff', duration: TARGET_FPS * 12 },
    shield: { label: 'SHIELD RING', color: '#69a8ff', duration: TARGET_FPS * 12 },
    slow: { label: 'TIME SLOW', color: '#c58aff', duration: TARGET_FPS * 10 },
    homing: { label: 'HOMING MISSILES', color: '#ff914d', duration: TARGET_FPS * 12 },
    shockwave: { label: 'SHOCKWAVE', color: '#ffe15a', duration: TARGET_FPS * 12 },
};
const JET_SPECIALS = {
    delta: { label: 'OVERDRIVE', description: 'Temporary speed boost', color: '#28e7ff', duration: TARGET_FPS * 8 },
    twin: { label: 'WINGMEN', description: 'Wingmen add covering shots', color: '#ff5ab3', duration: TARGET_FPS * 10 },
    stealth: { label: 'FORTRESS MODE', description: 'Temporary invulnerability', color: '#a5f02f', duration: TARGET_FPS * 5 },
    forward: { label: 'BULLET TIME', description: 'Slows enemy action', color: '#ffc21f', duration: TARGET_FPS * 6 },
};
const MAX_POWERUP_LEVEL = 3;
const POWERUP_DROP_CHANCE = 0.45;
const SPECIAL_DROP_CHANCE = 0.12;
const ULTIMATE_MAX_CHARGE = 100;
const HEALTH_PICKUP_AMOUNT = 25;
const MINION_KILL_SCORE = 100;
const MAX_POWER_PICKUP_SCORE = 100;
const CAMPAIGN_WAVE_COUNT = 10;
const WAVE_TARGET_SECONDS = [32, 36, 40, 55, 55, 55, 70, 70, 80, 140];
const WAVE_BREAK_FRAMES = TARGET_FPS * 4;
const BASE_WAVE_ENEMIES = 20;
const MINION_SPAWN_INTERVAL_FRAMES = TARGET_FPS * 1.8;
const MAX_ACTIVE_MINIONS = 7;
const METEOR_SPAWN_INTERVAL_FRAMES = 22;
const MAX_PLAYER_POWER = 5;
const PLANE_EVOLUTION_NAMES = ['FIGHTER', 'INTERCEPTOR', 'STRIKER', 'VANGUARD', 'SENTINEL', 'PHOENIX'];
const POWER_PICKUP_MAX_LIFE = TARGET_FPS * 12;
const MINION_TYPES = {
    scout: {
        label: 'SCOUT',
        color: '#bd68ff',
        radius: 22,
        health: 80,
        descentSpeed: 1.3,
        fireInterval: 105,
        bulletSpeed: 0.65,
        burstCount: 1,
        spread: 0.12,
    },
    gunner: {
        label: 'GUNNER',
        color: '#36d9ff',
        radius: 25,
        health: 140,
        descentSpeed: 0.9,
        fireInterval: 90,
        bulletSpeed: 0.78,
        burstCount: 3,
        spread: 0.2,
    },
    heavy: {
        label: 'HEAVY',
        color: '#ff9b45',
        radius: 31,
        health: 280,
        descentSpeed: 0.65,
        fireInterval: 130,
        bulletSpeed: 0.9,
        burstCount: 5,
        spread: 0.16,
    },
};
const MAPS = [
    { name: 'NEON SKY', subtitle: 'CALM BLUE FRONTIER', background: '#07172d', grid: '#1686c9', accent: '#35dfff', hazard: 'none' },
    { name: 'ASTEROID BELT', subtitle: 'METEOR SHOWERS AND DEBRIS', background: '#211b1a', grid: '#98745b', accent: '#ffb36b', hazard: 'meteors' },
    { name: 'STORM ZONE', subtitle: 'LIGHTNING AND FAST ENEMIES', background: '#11142f', grid: '#6257c9', accent: '#b5a4ff', hazard: 'lightning' },
    { name: 'GLITCH SECTOR', subtitle: 'FLICKERING SPACE - TELEPORTING ENEMIES', background: '#1d102b', grid: '#c52eff', accent: '#ff69d4', hazard: 'glitch' },
    { name: 'THE CORE', subtitle: 'ALL ENEMY TYPES - FINAL BOSS', background: '#29110f', grid: '#d64432', accent: '#ffd05a', hazard: 'core' },
];
const DIFFICULTIES = {
    easy: { label: 'EASY', spawnMultiplier: 0.75, healthMultiplier: 0.85, speedMultiplier: 0.9 },
    normal: { label: 'NORMAL', spawnMultiplier: 1, healthMultiplier: 1, speedMultiplier: 1 },
    hard: { label: 'HARD', spawnMultiplier: 1.3, healthMultiplier: 1.15, speedMultiplier: 1.1 },
    nightmare: { label: 'NIGHTMARE', spawnMultiplier: 1.6, healthMultiplier: 1.3, speedMultiplier: 1.2 },
};
const CAMPAIGN_SAVE_KEY = 'vectorBulletCampaignProgress';

// GAME STATISTICS TRACKER
const Stats = {
    shotsFired: 0,
    minionKills: 0,
    bonusScore: 0,
    bossHits: { bullet: 0 },
    playerHitsTaken: 0,
    startTime: 0, 
    endTime: 0,
    
    get totalTimeSeconds() {
        if (this.startTime === 0) return 0;
        
        const end = this.endTime === 0 ? Date.now() : this.endTime; 
        
        return (end - this.startTime) / 1000;
    },
    
    reset: function() {
        this.shotsFired = 0;
        this.minionKills = 0;
        this.bonusScore = 0;
        this.bossHits = { bullet: 0 };
        this.playerHitsTaken = 0;
        this.startTime = Date.now();
        this.endTime = 0;
    },
    
    calculateFinalScore: function() {
        let baseScore = ((this.bossHits.bullet * BASE_SCORE_BULLET) +
                        (this.minionKills * MINION_KILL_SCORE) +
                        this.bonusScore) * loopNumber;
                        
        let penalty = this.playerHitsTaken * Math.abs(SCORE_HIT_PENALTY);
        let finalScore = baseScore - penalty;
        
        if (enemy.health <= 0) {
            const secondsElapsed = Math.floor(this.totalTimeSeconds);
            const bonusLost = secondsElapsed * TIME_BONUS_DECREMENT_PER_SECOND;
            
            const timeBonus = Math.max(0, TIME_BONUS_START - bonusLost);
            
            finalScore = finalScore + timeBonus + SCORE_DEFEAT_BONUS * loopNumber;
        }

        return Math.floor(Math.max(0, finalScore));
    }
};

// --- Utility Functions ---

function distance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj2.y - obj1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getArenaObstacles() {
    return MAPS[currentMapIndex].hazard === 'meteors'
        ? ASTEROID_ARENA_OBSTACLES
        : ARENA_OBSTACLES;
}

function updateCamera() {
    cameraX = Math.max(0, Math.min(ARENA_WIDTH - GAME_WIDTH, player.x - GAME_WIDTH / 2));
    cameraY = Math.max(0, Math.min(ARENA_HEIGHT - GAME_HEIGHT, player.y - GAME_HEIGHT / 2));
}

function isBlockedByObstacle(x, y, radius = 0) {
    return getArenaObstacles().some(obstacle =>
        distance({ x, y }, obstacle) < radius + obstacle.radius
    );
}

function findBlockingObstacle(x1, y1, x2, y2, clearance) {
    let firstObstacle = null;
    let firstProjection = Infinity;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    for (const obstacle of getArenaObstacles()) {
        const projection = Math.max(0, Math.min(1,
            ((obstacle.x - x1) * dx + (obstacle.y - y1) * dy) / lengthSquared
        ));
        const closestX = x1 + projection * dx;
        const closestY = y1 + projection * dy;
        if (projection < firstProjection &&
            distance({ x: closestX, y: closestY }, obstacle) < obstacle.radius + clearance) {
            firstObstacle = obstacle;
            firstProjection = projection;
        }
    }
    return firstObstacle;
}

function getMinionPursuitDirection(minion, targetX, targetY, speed) {
    const dx = targetX - minion.x;
    const dy = targetY - minion.y;
    const directAngle = Math.atan2(dy, dx);
    const blockingObstacle = findBlockingObstacle(
        minion.x,
        minion.y,
        targetX,
        targetY,
        minion.radius
    );
    if (!blockingObstacle) {
        minion.detourSide = 0;
        return { x: Math.cos(directAngle), y: Math.sin(directAngle) };
    }

    if (!minion.detourSide) {
        const obstacleSide = dx * (blockingObstacle.y - minion.y) -
            dy * (blockingObstacle.x - minion.x);
        minion.detourSide = obstacleSide >= 0 ? -1 : 1;
    }

    for (let offset = 0.12; offset <= Math.PI; offset += 0.12) {
        const angle = directAngle + minion.detourSide * offset;
        const nextX = minion.x + Math.cos(angle) * speed;
        const nextY = minion.y + Math.sin(angle) * speed;
        if (!findBlockingObstacle(minion.x, minion.y, nextX, nextY, minion.radius)) {
            return { x: Math.cos(angle), y: Math.sin(angle) };
        }
    }

    return {
        x: Math.cos(directAngle + minion.detourSide * Math.PI / 2),
        y: Math.sin(directAngle + minion.detourSide * Math.PI / 2),
    };
}

function resolveObstacleOverlap(x, y, radius) {
    for (let pass = 0; pass < 3; pass++) {
        let moved = false;
        for (const obstacle of getArenaObstacles()) {
            const dx = x - obstacle.x;
            const dy = y - obstacle.y;
            const minDistance = radius + obstacle.radius;
            const currentDistance = Math.hypot(dx, dy);
            if (currentDistance >= minDistance) continue;
            const angle = currentDistance === 0 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx);
            x = obstacle.x + Math.cos(angle) * minDistance;
            y = obstacle.y + Math.sin(angle) * minDistance;
            moved = true;
        }
        if (!moved) break;
    }
    return {
        x: Math.max(radius, Math.min(ARENA_WIDTH - radius, x)),
        y: Math.max(radius, Math.min(ARENA_HEIGHT - radius, y)),
    };
}

function projectileHitsObstacle(projectile) {
    return getArenaObstacles().some(obstacle =>
        pointToSegmentDistance(
            obstacle.x,
            obstacle.y,
            Number.isFinite(projectile.previousX) ? projectile.previousX : projectile.x,
            Number.isFinite(projectile.previousY) ? projectile.previousY : projectile.y,
            projectile.x,
            projectile.y
        ) < obstacle.radius + projectile.radius
    );
}

function getObstacleLimitedEndpoint(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    let nearestProjection = 1;

    for (const obstacle of getArenaObstacles()) {
        const projection = Math.max(0, Math.min(1,
            ((obstacle.x - x1) * dx + (obstacle.y - y1) * dy) / lengthSquared
        ));
        const closestX = x1 + projection * dx;
        const closestY = y1 + projection * dy;
        if (projection < nearestProjection &&
            distance({ x: closestX, y: closestY }, obstacle) < obstacle.radius) {
            nearestProjection = projection;
        }
    }
    const endProjection = Math.max(0, nearestProjection - 0.01);
    return { x: x1 + endProjection * dx, y: y1 + endProjection * dy };
}

// distance from point (px,py) to segment (x1,y1)-(x2,y2)
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.sqrt((px - x1)*(px - x1) + (py - y1)*(py - y1));
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.sqrt((px - x2)*(px - x2) + (py - y2)*(py - y2));
    const b = c1 / c2;
    const pbx = x1 + b * vx;
    const pby = y1 + b * vy;
    return Math.sqrt((px - pbx)*(px - pbx) + (py - pby)*(py - pby));
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00.00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(2);
    return `${minutes}:${remainingSeconds.padStart(5, '0')}`; 
}

function loadCampaignProgress() {
    try {
        const saved = localStorage.getItem(CAMPAIGN_SAVE_KEY);
        if (!saved) return;
        const progress = JSON.parse(saved);
        if (!progress || typeof progress !== 'object') {
            throw new Error('Campaign save data is not an object.');
        }
        campaignProgress = {
            unlockedMapIndex: Math.max(0, Math.min(MAPS.length - 1, Math.floor(progress.unlockedMapIndex) || 0)),
            upgrades: Math.max(0, Math.min(MAPS.length - 1, Math.floor(progress.upgrades) || 0)),
        };
        checkpointMapIndex = Math.max(0, Math.min(MAPS.length - 1,
            Math.floor(progress.checkpointMapIndex ?? progress.unlockedMapIndex) || 0));
        loopNumber = Math.max(1, Math.floor(progress.loopNumber) || 1);
        if (Object.prototype.hasOwnProperty.call(DIFFICULTIES, progress.difficultyKey)) {
            difficultyKey = progress.difficultyKey;
        }
    } catch (error) {
        console.warn('Campaign progress could not be loaded:', error);
    }
}

function saveCampaignProgress() {
    try {
        localStorage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify({
            unlockedMapIndex: campaignProgress.unlockedMapIndex,
            upgrades: campaignProgress.upgrades,
            checkpointMapIndex,
            loopNumber,
            difficultyKey,
        }));
    } catch (error) {
        console.warn('Campaign progress could not be saved:', error);
    }
}

function startMap(mapIndex) {
    currentMapIndex = Math.max(0, Math.min(MAPS.length - 1, mapIndex));
    checkpointMapIndex = currentMapIndex;
    campaignProgress.unlockedMapIndex = Math.max(campaignProgress.unlockedMapIndex, currentMapIndex);
    saveCampaignProgress();

    gameStage = 'minions';
    waveNumber = 1;
    waveSpawnQuota = calculateWaveSpawnQuota(1);
    waveSpawnedCount = 0;
    minionSpawnCounter = MINION_SPAWN_INTERVAL_FRAMES - 1;
    waveBreakFrames = 0;
    meteorSpawnCounter = 0;
    lightningSpawnCounter = 0;
    bossArrivalFrames = 0;
    minions = [];
    meteors = [];
    enemyBullets = [];
    playerBullets = [];
    powerMissiles = [];
    bigOrbs = [];
    effects = [];
    pickups = [];
    strikeLines = [];
    mines = [];
    laserArms = [];
    isInvulnerable = false;
    invulnerabilityTimer = 0;
    player.x = ARENA_WIDTH / 2;
    player.y = ARENA_HEIGHT / 2;
    player.aimAngle = -Math.PI / 2;
    updateCamera();
    resetBossForMap();
    updateControlVisibility();
}

function resetBossForMap() {
    const difficulty = DIFFICULTIES[difficultyKey];
    const mapMultiplier = 1 + currentMapIndex * 0.06;
    const loopMultiplier = Math.pow(1.5, loopNumber - 1);
    enemy.maxHealth = BOSS_MAX_HEALTH * (WAVE_TARGET_SECONDS[9] / 60) * 1.28 *
        mapMultiplier * loopMultiplier * difficulty.healthMultiplier;
    enemy.baseBulletSpeed = ENEMY_BULLET_SPEED * difficulty.speedMultiplier *
        (1 + currentMapIndex * 0.04) * loopMultiplier;
    enemy.health = enemy.maxHealth;
    enemy.currentPhase = 1;
    enemy.applyPhaseDifficulty();
    enemy.x = player.x;
    enemy.y = Math.max(enemy.radius, player.y - GAME_HEIGHT * 0.32);
    enemy.initialX = enemy.x;
    enemy.initialY = enemy.y;
    enemy.waveTime = 0;
    enemy.patternCounter = 0;
    enemy.frameCounter = 0;
    enemy.pattern = 1;
    enemy.fireRate = enemy.baseFireRate;
    enemy.verticalMoveTimer = 0;
}

function initializeGame(mapIndex = 0) {
    score = 0;
    Stats.reset();
    isPaused = false;
    isResolvingUltimate = false;
    selectedMenuButtonKey = null;
    keys = {};
    touchKeys = {};

    player.applyJet(selectedJetId);
    player.maxHealth += campaignProgress.upgrades * 5;
    player.health = player.maxHealth;
    player.activePowerups = {};
    player.specialPowerup = { level: 0, duration: 0 };
    player.ultimateCharge = 0;
    player.shockwaveCounter = 0;
    player.powerLevel = 0;
    player.powerupCharge = 0;
    player.powerupsForNextEvolution = 5;
    player.hitEffectTimer = 0;
    powerMissiles = [];
    worldSlowCounter = 0;
    mouseAimWorld = null;
    effects = [];
    pickups = [];
    isFiring = true;
    isInvulnerable = false;
    invulnerabilityTimer = 0;
    playerFireCounter = 0;
    totalFrames = 0;
    startMap(mapIndex);
}

function startNextSector() {
    loopRestartFrames = 0;
    if (currentMapIndex >= MAPS.length - 1) {
        loopNumber++;
        campaignProgress.upgrades = 0;
        campaignProgress.unlockedMapIndex = 0;
        checkpointMapIndex = 0;
        saveCampaignProgress();
        initializeGame(0);
        effects.push(new Effect(player.x, player.y - 60, `LOOP ${loopNumber}`, 'text'));
        return;
    }
    player.health = Math.min(player.maxHealth, player.health + Math.ceil(player.maxHealth * 0.2));
    player.ultimateCharge = Math.min(ULTIMATE_MAX_CHARGE, player.ultimateCharge + 25);
    Stats.endTime = 0;
    startMap(currentMapIndex + 1);
    playSound('phase');
}

function startBossFight() {
    gameStage = 'bossIntro';
    bossArrivalFrames = TARGET_FPS * 3;
    minions = [];
    meteors = [];
    enemyBullets = [];
    resetBossForMap();
    enemy.x = player.x;
    enemy.y = Math.max(enemy.radius, player.y - GAME_HEIGHT * 0.32);
    enemy.initialX = enemy.x;
    enemy.initialY = enemy.y;
    playSound('phase');
}

function startNextWave() {
    if (waveNumber >= CAMPAIGN_WAVE_COUNT - 1) {
        waveNumber = CAMPAIGN_WAVE_COUNT;
        startBossFight();
        return;
    }
    waveNumber++;
    waveSpawnQuota = calculateWaveSpawnQuota(waveNumber);
    waveSpawnedCount = 0;
    minions = [];
    meteors = [];
    enemyBullets = [];
    minionSpawnCounter = MINION_SPAWN_INTERVAL_FRAMES - 1;
    meteorSpawnCounter = 0;
    lightningSpawnCounter = 0;
    gameStage = 'minions';
    playSound('phase');
}

function calculateWaveSpawnQuota(wave) {
    const difficulty = DIFFICULTIES[difficultyKey];
    const waveMultiplier = Math.pow(1.1, wave - 1);
    const mapMultiplier = Math.pow(1.25, currentMapIndex);
    const loopMultiplier = Math.pow(1.5, loopNumber - 1);
    return Math.ceil(BASE_WAVE_ENEMIES * waveMultiplier * mapMultiplier *
        difficulty.spawnMultiplier * loopMultiplier);
}

function spawnMeteor() {
    const margin = 120;
    const minX = cameraX + margin;
    const maxX = cameraX + GAME_WIDTH - margin;
    const minY = cameraY + margin;
    const maxY = cameraY + GAME_HEIGHT - margin;
    let x = minX + Math.random() * (maxX - minX);
    let y = minY + Math.random() * (maxY - minY);
    if (distance({ x, y }, player) < 220) {
        const angle = Math.atan2(y - player.y, x - player.x);
        x = Math.max(minX, Math.min(maxX, player.x + Math.cos(angle) * 240));
        y = Math.max(minY, Math.min(maxY, player.y + Math.sin(angle) * 240));
    }
    meteors.push(new Meteor(x, y));
}

function updateMinionWave() {
    if (gameStage === 'bossIntro') {
        bossArrivalFrames--;
        if (bossArrivalFrames <= 0) gameStage = 'boss';
        return;
    }
    if (gameStage === 'betweenWaves') {
        waveBreakFrames--;
        if (waveBreakFrames <= 0) startNextWave();
        return;
    }
    if (gameStage !== 'minions') {
        return;
    }

    minionSpawnCounter++;
    const mapSpawnMultiplier = Math.pow(1.25, currentMapIndex);
    const difficultySpawnMultiplier = DIFFICULTIES[difficultyKey].spawnMultiplier;
    const loopSpawnMultiplier = Math.pow(1.5, loopNumber - 1);
    const spawnPressure = mapSpawnMultiplier * difficultySpawnMultiplier * loopSpawnMultiplier;
    const targetSpawnInterval = WAVE_TARGET_SECONDS[waveNumber - 1] * TARGET_FPS / waveSpawnQuota;
    const progressivelyFasterInterval =
        MINION_SPAWN_INTERVAL_FRAMES * Math.pow(0.99, waveNumber - 1) / spawnPressure;
    const waveSpawnInterval = Math.max(42,
        Math.floor(Math.min(targetSpawnInterval, progressivelyFasterInterval)));
    if (waveSpawnedCount < waveSpawnQuota &&
        minions.filter(minion => minion.health > 0).length < MAX_ACTIVE_MINIONS &&
        minionSpawnCounter >= waveSpawnInterval) {
        const angle = Math.random() * Math.PI * 2;
        const edgeX = cameraX + GAME_WIDTH / 2 + Math.cos(angle) * (GAME_WIDTH * 0.56);
        const edgeY = cameraY + GAME_HEIGHT / 2 + Math.sin(angle) * (GAME_HEIGHT * 0.56);
        const minionType = chooseMinionType();
        const spawnPosition = resolveObstacleOverlap(
            Math.max(40, Math.min(ARENA_WIDTH - 40, edgeX)),
            Math.max(40, Math.min(ARENA_HEIGHT - 40, edgeY)),
            MINION_TYPES[minionType].radius
        );
        minions.push(new Minion(spawnPosition.x, spawnPosition.y, minionType));
        waveSpawnedCount++;
        minionSpawnCounter = 0;
    }

    const mapHazard = MAPS[currentMapIndex].hazard;
    if ((mapHazard === 'meteors' && waveNumber % 3 === 0) ||
        (mapHazard === 'core' && waveNumber % 2 === 0)) {
        meteorSpawnCounter++;
        if (meteorSpawnCounter >= METEOR_SPAWN_INTERVAL_FRAMES * 4 && meteors.length < 2) {
            spawnMeteor();
            meteorSpawnCounter = 0;
        }
    }
    if (mapHazard === 'lightning') {
        lightningSpawnCounter++;
        if (lightningSpawnCounter >= TARGET_FPS * 5 && strikeLines.length < 2) {
            const x = cameraX + GAME_WIDTH * (0.15 + Math.random() * 0.7);
            strikeLines.push(new StrikeLine(
                x, cameraY + 50, x, cameraY + GAME_HEIGHT - 40,
                TARGET_FPS * 0.8, TARGET_FPS * 0.25, MAPS[currentMapIndex].accent
            ));
            lightningSpawnCounter = 0;
        }
    }

    if (waveSpawnedCount >= waveSpawnQuota &&
        minions.every(minion => minion.health <= 0)) {
        gameStage = 'betweenWaves';
        waveBreakFrames = WAVE_BREAK_FRAMES;
        minions = [];
        enemyBullets = [];
        meteors = [];
        pickups.push(new Pickup(player.x + 70, player.y, 'health'));
    }
}

function updatePlayerAim() {
    let target = null;
    if (mouseAimWorld) {
        target = mouseAimWorld;
    } else if (gameStage === 'minions') {
        target = minions.find(minion => minion.health > 0) || null;
    } else if (gameStage === 'boss') {
        target = enemy;
    }
    if (target) {
        player.aimAngle = Math.atan2(target.y - player.y, target.x - player.x);
    }
}

function getUnlockedMinionTypes() {
    if (currentMapIndex === 0) return ['scout'];
    if (currentMapIndex === 1 && waveNumber < 4) return ['scout', 'gunner'];
    if (currentMapIndex < 2) return ['scout', 'gunner', 'heavy'];
    return Object.keys(MINION_TYPES);
}

function chooseMinionType() {
    const unlockedTypes = getUnlockedMinionTypes();
    if (unlockedTypes.length === 1) return unlockedTypes[0];
    return unlockedTypes[Math.floor(Math.random() * unlockedTypes.length)];
}

function ensureAudioContext() {
    if (!settings.sound || audioContext) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
}

function playSound(type) {
    if (!settings.sound || !audioContext) return;

    const now = audioContext.currentTime;
    const lastPlayed = lastSoundTimes[type] || 0;
    if (type === 'hit' && now - lastPlayed < 0.08) return;
    lastSoundTimes[type] = now;

    const sounds = {
        shoot: [520, 0.035, 0.025],
        hit: [300, 0.09, 0.055],
        damage: [110, 0.22, 0.09],
        heal: [760, 0.14, 0.05],
        phase: [660, 0.24, 0.065],
        win: [880, 0.4, 0.08],
        lose: [90, 0.4, 0.08],
    };
    const [frequency, duration, volume] = sounds[type];
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type === 'damage' || type === 'lose' ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    if (type === 'phase' || type === 'win') {
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
}

function toggleSound() {
    settings.sound = !settings.sound;
    updateSoundButton();
    if (settings.sound) {
        ensureAudioContext();
        playSound('heal');
    }
}

function updateSoundButton() {
    soundToggle.textContent = `Sound: ${settings.sound ? 'On' : 'Off'}`;
    soundToggle.setAttribute('aria-pressed', String(settings.sound));
}

function updateControlVisibility() {
    const isPlaying = gameState === 'playing';
    touchControls.hidden = !isPlaying;
    soundToggle.hidden = !isPlaying;
    if (!isPlaying) clearTouchMovement();
}

function updateHomeVideo() {
    const isHomeMenu = gameState === 'menu' && menuState === 'main';
    gameShell.classList.toggle('home-menu', isHomeMenu);
    if (isHomeMenu) {
        if (homeVideo.paused && !homeVideoPlayRequested) {
            homeVideoPlayRequested = true;
            homeVideo.play().then(() => {
                homeVideoPlayRequested = false;
            }).catch(error => {
                homeVideoPlayRequested = false;
                if (error.name !== 'AbortError' && gameState === 'menu' && menuState === 'main') {
                    console.warn('Home video playback could not start:', error);
                }
            });
        }
    } else if (!homeVideo.paused) {
        homeVideo.pause();
        homeVideoPlayRequested = false;
    }
}

function updateAnnouncement() {
    let stateLabel = gameState;
    if (gameState === 'menu') {
        stateLabel = menuState === 'main' ? 'Main menu' :
            menuState === 'jetSelect' ? 'Jet selection' :
                menuState === 'levelSelect' ? 'Level selection' : 'How to play';
    } else if (gameState === 'playing' && isPaused) {
        stateLabel = 'Game paused';
    } else if (gameState === 'playing') {
        stateLabel = 'Game in progress';
    } else if (gameState === 'gameOver') {
        stateLabel = 'Game over';
    } else if (gameState === 'sectorClear') {
        stateLabel = `${MAPS[currentMapIndex].name} sector cleared`;
    } else if (gameState === 'win') {
        stateLabel = 'Victory';
    }

    const selectedLabel = selectedMenuButtonKey
        ? menuButtons[selectedMenuButtonKey]?.label
        : null;
    const announcement = gameState === 'sectorClear'
        ? `${MAPS[currentMapIndex].name} sector cleared. Score ${Math.floor(score)}. ${currentMapIndex < MAPS.length - 1 ? `${MAPS[currentMapIndex + 1].name} is unlocked. ${sectorUpgradeAwarded ? 'A permanent maximum-health upgrade is awarded.' : 'Your checkpoint is saved.'}` : `Loop ${loopNumber + 1} starts automatically in ${Math.ceil(loopRestartFrames / TARGET_FPS)} seconds.`} Activate the selected button to continue or return to the menu.`
        : gameState === 'playing' && !isPaused
            ? `${MAPS[currentMapIndex].name}, Loop ${loopNumber}, wave ${waveNumber} of ${CAMPAIGN_WAVE_COUNT}. ${gameStage === 'minions' ? `${waveSpawnQuota - waveSpawnedCount} enemies left to spawn.` : gameStage === 'betweenWaves' ? `Next wave in ${Math.ceil(waveBreakFrames / TARGET_FPS)} seconds.` : gameStage === 'bossIntro' ? 'Boss incoming.' : gameStage === 'boss' ? `Boss phase ${enemy.currentPhase}.` : 'Campaign wave.'} ${JET_OPTIONS.find(option => option.id === player.jetId)?.name || 'Jet'} ${PLANE_EVOLUTION_NAMES[player.powerLevel]} plane, evolution ${player.powerLevel} of ${MAX_PLAYER_POWER}. ${player.powerLevel < MAX_PLAYER_POWER ? `${player.powerupCharge} of ${player.powerupsForNextEvolution} power-ups to next evolution.` : 'Maximum evolution reached.'} Use WASD to move, mouse to aim, Y for auto-fire, Q for a charged ultimate, M for sound, and P or Escape to pause.`
        : selectedLabel
            ? `${stateLabel}. ${selectedLabel} selected. Use arrow keys to navigate and Enter to choose.`
            : `${stateLabel}. Use arrow keys to navigate and Enter to choose.`;
    if (announcement !== lastAnnouncement) {
        gameAnnouncement.textContent = announcement;
        lastAnnouncement = announcement;
    }
}

// --- 2. CLASSES FOR GAME OBJECTS ---

class GameObject {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Pickup extends GameObject {
    constructor(x, y, type, powerupType = null) {
        const color = type === 'health' ? 'lime' :
            type === 'shared' ? SHARED_POWERUPS[powerupType]?.color || '#ffd84d' :
                type === 'special' ? JET_SPECIALS[player.jetId]?.color || '#ffd84d' : '#ffd84d';
        super(x, y, 10, color);
        this.type = type;
        this.powerupType = powerupType;
        this.jetId = type === 'special' ? player.jetId : null;
        this.life = type === 'power' ? POWER_PICKUP_MAX_LIFE : PICKUP_MAX_LIFE;
        this.vy = PICKUP_SPEED_PER_TICK; 
    }

    update() {
        this.life--; 
        this.y += this.vy; 
        if (this.y > ARENA_HEIGHT + this.radius) {
            this.life = 0;
        }
    }

    draw() {
        const isBlinking = this.life < 120 && Math.floor(this.life / 10) % 2 === 0;
        const fade = this.life < 60 ? this.life / 60 : 1; 
        
        ctx.globalAlpha = isBlinking ? 0.2 : fade;
        if (this.type === 'health') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'lime';
            ctx.fillStyle = 'lime';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('+', this.x, this.y + 8);
            ctx.shadowBlur = 0;
        } else if (this.type === 'power') {
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#ffd84d';
            ctx.fillStyle = '#ffd84d';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('P', this.x, this.y + 8);
            ctx.shadowBlur = 0;
        } else if (this.type === 'shared' || this.type === 'special') {
            const definition = this.type === 'shared'
                ? SHARED_POWERUPS[this.powerupType]
                : JET_SPECIALS[player.jetId];
            ctx.shadowBlur = 14;
            ctx.shadowColor = definition.color;
            ctx.fillStyle = definition.color;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            const marker = this.type === 'special'
                ? '★'
                : { spread: 'SP', shield: 'SH', slow: 'TS', homing: 'HM', shockwave: 'SW' }[this.powerupType];
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(marker, this.x, this.y + 6);
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1.0;
    }
}

class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 8, 'lightblue');
        this.jetId = selectedJetId;
        this.speed = PLAYER_SPEED;
        this.hitboxRadius = 2; // The tiny red circle
        this.maxHealth = MAX_PLAYER_HEALTH;
        this.health = this.maxHealth;
        this.damageMultiplier = 1;
        this.damageTakenMultiplier = 1;
        this.startingGuns = 1;
        this.activePowerups = {};
        this.specialPowerup = { level: 0, duration: 0 };
        this.ultimateCharge = 0;
        this.powerLevel = 0;
        this.powerupCharge = 0;
        this.powerupsForNextEvolution = 5;
        this.hitEffectTimer = 0; // For big glow
        this.aimAngle = -Math.PI / 2;
        this.applyJet(this.jetId);
    }

    applyJet(jetId) {
        const jet = JET_OPTIONS.find(option => option.id === jetId) || JET_OPTIONS[0];
        this.jetId = jet.id;
        this.speed = PLAYER_SPEED * jet.speed;
        this.maxHealth = jet.maxHealth;
        this.damageMultiplier = jet.damageMultiplier;
        this.damageTakenMultiplier = jet.damageTakenMultiplier;
        this.startingGuns = jet.startingGuns;
    }

    update() {
        let dx = 0;
        let dy = 0;
        if (keys['w'] || touchKeys.w) dy -= 1;
        if (keys['s'] || touchKeys.s) dy += 1;
        if (keys['a'] || touchKeys.a) dx -= 1;
        if (keys['d'] || touchKeys.d) dx += 1;
        
        if (dx !== 0 || dy !== 0) {
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / magnitude);
            dy = (dy / magnitude);
        }

        const overdrive = this.jetId === 'delta' && this.isPowerupActive('special');
        const moveSpeed = this.speed * (overdrive ? 1.65 : 1);
        const nextX = Math.max(this.radius, Math.min(this.x + dx * moveSpeed, ARENA_WIDTH - this.radius));
        if (!isBlockedByObstacle(nextX, this.y, this.radius)) this.x = nextX;
        const nextY = Math.max(this.radius, Math.min(this.y + dy * moveSpeed, ARENA_HEIGHT - this.radius));
        if (!isBlockedByObstacle(this.x, nextY, this.radius)) this.y = nextY;
        
        if (isInvulnerable) {
            invulnerabilityTimer--;
            this.hitEffectTimer = Math.max(this.hitEffectTimer - 1, 0);
            if (invulnerabilityTimer <= 0) {
                isInvulnerable = false;
            }
        }
        for (const powerup of Object.values(this.activePowerups)) {
            powerup.duration = Math.max(0, powerup.duration - 1);
            if (powerup.duration === 0) powerup.level = 0;
        }
        this.specialPowerup.duration = Math.max(0, this.specialPowerup.duration - 1);
        if (this.specialPowerup.duration === 0) this.specialPowerup.level = 0;
        if (this.isPowerupActive('shockwave')) {
            this.shockwaveCounter = (this.shockwaveCounter || 0) + 1;
            const interval = Math.max(35, TARGET_FPS * 3 - this.getPowerupLevel('shockwave') * 15);
            if (this.shockwaveCounter >= interval) {
                this.shockwaveCounter = 0;
                triggerShockwave(this.getPowerupLevel('shockwave'));
            }
        }
        if (this.isPowerupActive('homing') && totalFrames % Math.max(15, 42 - this.getPowerupLevel('homing') * 7) === 0) {
            firePowerMissile();
        }
        if (this.jetId === 'twin' && this.isPowerupActive('special') &&
            totalFrames % Math.max(12, 36 - this.specialPowerup.level * 6) === 0) {
            fireWingmenShot();
        }

    }

    isPowerupActive(type) {
        const powerup = type === 'special' ? this.specialPowerup : this.activePowerups[type];
        return Boolean(powerup && powerup.level > 0 && powerup.duration > 0);
    }

    getPowerupLevel(type) {
        const powerup = this.activePowerups[type];
        return this.isPowerupActive(type) ? powerup.level : 0;
    }
    
    draw() {
        ctx.save();
        if (isInvulnerable && this.hitEffectTimer > 0) {
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 80);
            ctx.shadowBlur = 40 + 40 * pulse;
            ctx.shadowColor = `rgba(255, 50, 50, ${0.7 * pulse})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 30 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 50, 50, ${0.15 * pulse})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.translate(this.x, this.y);
        if (this.isPowerupActive('shield')) {
            ctx.beginPath();
            ctx.arc(0, 0, 37 + this.getPowerupLevel('shield') * 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#69a8ff';
            ctx.lineWidth = 3 + this.getPowerupLevel('shield');
            ctx.globalAlpha = 0.72;
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#69a8ff';
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
        ctx.rotate(this.aimAngle + Math.PI / 2);
        const flashing = isInvulnerable && Math.floor(invulnerabilityTimer / 5) % 2 === 0;
        const enginePulse = 0.8 + Math.sin(Date.now() / 65) * 0.2;
        const evolutionColors = ['#55c9ff', '#56e6cf', '#9bdf58', '#ffb347', '#df78ff', '#ff6b8b'];
        const jet = JET_OPTIONS.find(option => option.id === this.jetId) || JET_OPTIONS[0];
        const evolutionColor = this.powerLevel === 0 ? jet.color : evolutionColors[this.powerLevel];
        const hullGradient = ctx.createLinearGradient(-22, -18, 22, 18);
        hullGradient.addColorStop(0, flashing ? '#ffffff' : '#e8fbff');
        hullGradient.addColorStop(0.34, flashing ? '#bafaff' : evolutionColor);
        hullGradient.addColorStop(0.68, flashing ? '#77cfff' : '#3974df');
        hullGradient.addColorStop(1, flashing ? '#ffffff' : '#292c74');
        ctx.shadowBlur = flashing ? 20 : 18 + this.powerLevel * 2;
        ctx.shadowColor = flashing ? '#ffffff' : '#43dfff';

        ctx.fillStyle = '#172149';
        ctx.strokeStyle = jet.color;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        if (jet.shape === 'delta') {
            ctx.moveTo(-6, -5);
            ctx.lineTo(-31 - this.powerLevel, 17);
            ctx.lineTo(-17, 15);
            ctx.lineTo(-5, 10);
        } else if (jet.shape === 'twin') {
            ctx.moveTo(-7, -3);
            ctx.lineTo(-29, 2);
            ctx.lineTo(-25, 17);
            ctx.lineTo(-5, 12);
        } else if (jet.shape === 'stealth') {
            ctx.moveTo(-7, -4);
            ctx.lineTo(-38, 15);
            ctx.lineTo(-22, 23);
            ctx.lineTo(-5, 13);
        } else {
            ctx.moveTo(-7, -4);
            ctx.lineTo(-33, -14);
            ctx.lineTo(-29, 4);
            ctx.lineTo(-6, 14);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        if (jet.shape === 'delta') {
            ctx.moveTo(6, -5);
            ctx.lineTo(31 + this.powerLevel, 17);
            ctx.lineTo(17, 15);
            ctx.lineTo(5, 10);
        } else if (jet.shape === 'twin') {
            ctx.moveTo(7, -3);
            ctx.lineTo(29, 2);
            ctx.lineTo(25, 17);
            ctx.lineTo(5, 12);
        } else if (jet.shape === 'stealth') {
            ctx.moveTo(7, -4);
            ctx.lineTo(38, 15);
            ctx.lineTo(22, 23);
            ctx.lineTo(5, 13);
        } else {
            ctx.moveTo(7, -4);
            ctx.lineTo(33, -14);
            ctx.lineTo(29, 4);
            ctx.lineTo(6, 14);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff6f91';
        ctx.beginPath();
        ctx.moveTo(-18, 12);
        ctx.lineTo(-28 - this.powerLevel, 19);
        ctx.lineTo(-14, 20);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(18, 12);
        ctx.lineTo(28 + this.powerLevel, 19);
        ctx.lineTo(14, 20);
        ctx.closePath();
        ctx.fill();

        if (this.powerLevel >= 2) {
            ctx.fillStyle = '#ffe070';
            ctx.beginPath();
            ctx.moveTo(-17, 4);
            ctx.lineTo(-31, 14);
            ctx.lineTo(-22, 17);
            ctx.lineTo(-12, 9);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(17, 4);
            ctx.lineTo(31, 14);
            ctx.lineTo(22, 17);
            ctx.lineTo(12, 9);
            ctx.closePath();
            ctx.fill();
        }

        if (this.powerLevel >= 4) {
            ctx.fillStyle = '#b77cff';
            ctx.beginPath();
            ctx.moveTo(-8, 8);
            ctx.lineTo(-15, 22);
            ctx.lineTo(-6, 17);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(8, 8);
            ctx.lineTo(15, 22);
            ctx.lineTo(6, 17);
            ctx.closePath();
            ctx.fill();
        }

        // Bright animated engine plumes.
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ff8b3d';
        ctx.beginPath();
        ctx.moveTo(-13, 14);
        ctx.lineTo(-9, 14);
        ctx.lineTo(-11, 25 + enginePulse * 5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9, 14);
        ctx.lineTo(13, 14);
        ctx.lineTo(11, 25 + enginePulse * 5);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Main hull, layered armor plates, and cockpit glass.
        ctx.fillStyle = hullGradient;
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-13, 13);
        ctx.lineTo(0, 8);
        ctx.lineTo(13, 13);
        ctx.lineTo(8, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffcc5c';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-3, -5);
        ctx.lineTo(0, 0);
        ctx.lineTo(3, -5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-7, 2);
        ctx.lineTo(-11, 11);
        ctx.moveTo(7, 2);
        ctx.lineTo(11, 11);
        ctx.stroke();

        const cockpitGradient = ctx.createLinearGradient(-5, -17, 5, 1);
        cockpitGradient.addColorStop(0, '#ffffff');
        cockpitGradient.addColorStop(0.35, '#85ffff');
        cockpitGradient.addColorStop(1, '#2472d9');
        ctx.fillStyle = cockpitGradient;
        ctx.beginPath();
        ctx.ellipse(0, -8, 4.5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e9ffff';
        ctx.stroke();

        const gunMounts = getPlayerGunMounts().map(gun => ({
            ...gun,
            top: -gun.forward + 2,
            length: gun.forward >= 35 ? 15 : 12,
        }));
        if (this.powerLevel >= 1) gunMounts.push(
            { offset: -11, top: -16, length: 12 },
            { offset: 11, top: -16, length: 12 }
        );
        if (this.powerLevel >= 3) gunMounts.push(
            { offset: -20, top: -5, length: 10 },
            { offset: 20, top: -5, length: 10 }
        );
        gunMounts.forEach((gun, index) => {
            ctx.fillStyle = '#222942';
            ctx.fillRect(gun.offset - 2, gun.top, 4, gun.length);
            ctx.fillStyle = index === 0 ? '#fff4a8' : '#9cfaff';
            ctx.fillRect(gun.offset - 1, gun.top - 2, 2, 4);
        });

        if (this.powerLevel >= 4) {
            ctx.strokeStyle = '#ffd84d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 31 + Math.sin(Date.now() / 100) * 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (this.powerLevel >= 5) {
            ctx.strokeStyle = '#ff7aa8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 37 + Math.sin(Date.now() / 120) * 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff4a8';
            ctx.beginPath();
            ctx.arc(0, -32, 4, 0, Math.PI * 2);
            ctx.arc(-29, 16, 4, 0, Math.PI * 2);
            ctx.arc(29, 16, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, this.hitboxRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4242';
        ctx.fill();
        ctx.restore();
    }
}

class PlayerBullet extends GameObject {
    constructor(x, y, vx = 0, vy = -PLAYER_BULLET_SPEED) {
        super(x, y, 4, '#54eaff');
        this.speed = PLAYER_BULLET_SPEED;
        this.damage = 1 * SCALE_FACTOR * (1 + player.powerLevel * 0.2) * player.damageMultiplier;
        this.vx = vx;
        this.vy = vy;
        this.previousX = x;
        this.previousY = y;
        this.trail = [];
        Stats.shotsFired++;
    }
    draw() {
        const angle = Math.atan2(this.vy, this.vx);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        const trailGradient = ctx.createLinearGradient(-22, 0, 3, 0);
        trailGradient.addColorStop(0, 'rgba(35, 120, 255, 0)');
        trailGradient.addColorStop(0.62, 'rgba(54, 190, 255, 0.22)');
        trailGradient.addColorStop(1, 'rgba(158, 255, 255, 0.85)');
        ctx.fillStyle = trailGradient;
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(2, -3);
        ctx.lineTo(2, 3);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 13;
        ctx.shadowColor = '#49eaff';
        const bulletGradient = ctx.createLinearGradient(-8, 0, 9, 0);
        bulletGradient.addColorStop(0, '#218bff');
        bulletGradient.addColorStop(0.55, '#4df7ff');
        bulletGradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = bulletGradient;
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(3, -3.5);
        ctx.lineTo(-7, -2.5);
        ctx.lineTo(-9, 0);
        ctx.lineTo(-7, 2.5);
        ctx.lineTo(3, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(-4, -1, 9, 2);
        ctx.restore();
    }
    update() {
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > 3) this.trail.pop();
        this.previousX = this.x;
        this.previousY = this.y;
        this.x += this.vx;
        this.y += this.vy;
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, 15, 'darkred');
        this.maxHealth = BOSS_MAX_HEALTH; 
        this.health = this.maxHealth;
        this.currentPhase = 1;
        this.baseFireRate = 30; 
        this.baseBulletSpeed = ENEMY_BULLET_SPEED;
        this.amplitude = BOSS_AMPLITUDE;
        this.frequency = BOSS_FREQUENCY;
        this.initialX = x;
        this.initialY = y;
        this.waveTime = 0;
        this.fireRate = this.baseFireRate;
        this.bulletSpeed = this.baseBulletSpeed;
        this.frameCounter = 0;
        this.pattern = 1; 
        this.patternCounter = 0;
        this.patternSwitchDelay = 120; 
        // For dynamic movement
        this.targetY = y;
        this.verticalMoveTimer = 0;
        this.lastPhase = 1;
    }
    
    update() {
        let newPhase = this.currentPhase;
        if (this.health <= this.maxHealth / 3) {
            newPhase = 3;
        } else if (this.health <= this.maxHealth * 2 / 3) {
            newPhase = 2;
        }
        // Phase change detection and particle effect
        if (newPhase !== this.currentPhase) {
            const currentX = this.x; 
            this.currentPhase = newPhase;
            playSound('phase');
            this.applyPhaseDifficulty();
            this.initialX = currentX;
            this.waveTime = 0; 
            // Particle effect for phase change
            if (newPhase === 2) {
                for (let i = 0; i < 30; i++) {
                    const angle = (i / 30) * Math.PI * 2;
                    const speed = 12 + Math.random() * 8;
                    effects.push(new Effect(
                        this.x + Math.cos(angle) * 20,
                        this.y + Math.sin(angle) * 20,
                        'orange',
                        'spark',
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        30 + Math.random() * 20
                    ));
                }
            } else if (newPhase === 3) {
                for (let i = 0; i < 60; i++) {
                    const angle = (i / 60) * Math.PI * 2;
                    const speed = 18 + Math.random() * 12;
                    effects.push(new Effect(
                        this.x + Math.cos(angle) * 30,
                        this.y + Math.sin(angle) * 30,
                        'magenta',
                        'spark',
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        40 + Math.random() * 30
                    ));
                }
            }
        }

        this.waveTime++;
        // Dynamic movement for phase 2 and 3
        if (this.currentPhase === 1) {
            // Simple left-right
            const currentAmplitude = this.amplitude;
            const currentFrequency = this.frequency;
            this.x = this.initialX + Math.sin(this.waveTime * currentFrequency) * currentAmplitude;
            this.y = this.initialY;
        } else if (this.currentPhase === 2) {
            // More dynamic horizontal movement
            const hAmp = this.amplitude * 1.7;
            const hFreq = this.frequency * 1.6;
            this.x = this.initialX + Math.sin(this.waveTime * hFreq) * hAmp + Math.sin(this.waveTime * 0.07) * 60;
            // Random vertical movement (stay in top 35% of screen)
            if (this.verticalMoveTimer <= 0) {
                const minY = Math.max(40, player.y - GAME_HEIGHT * 0.42);
                const maxY = Math.max(minY + 20, player.y - GAME_HEIGHT * 0.18);
                this.targetY = minY + Math.random() * (maxY - minY);
                this.verticalMoveTimer = 60 + Math.random() * 60;
            } else {
                this.verticalMoveTimer--;
            }
            this.y += (this.targetY - this.y) * 0.08;
        } else {
            // Phase 3: unpredictable, wide movement but smooth
            const hAmp = GAME_WIDTH * 0.45;
            const hFreq = this.frequency * 1.5; // Lower frequency for smoother movement
            // Reduce chaos and interpolate x for smoothness
            const chaos = Math.sin(this.waveTime * 0.13) * 60 + Math.sin(this.waveTime * 0.23) * 40;
            const targetX = player.x + Math.sin(this.waveTime * hFreq) * hAmp + chaos;
            this.x += (targetX - this.x) * 0.08; // Smoothly move toward targetX
            // Random vertical movement (stay in top 35% of screen)
            if (this.verticalMoveTimer <= 0) {
                const minY = Math.max(40, player.y - GAME_HEIGHT * 0.42);
                const maxY = Math.max(minY + 20, player.y - GAME_HEIGHT * 0.18);
                this.targetY = minY + Math.random() * (maxY - minY);
                this.verticalMoveTimer = 40 + Math.random() * 40;
            } else {
                this.verticalMoveTimer--;
            }
            this.y += (this.targetY - this.y) * 0.13;
        }
        this.x = Math.max(this.radius, Math.min(this.x, ARENA_WIDTH - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, ARENA_HEIGHT - this.radius));

        this.patternCounter++; 
        if (this.patternCounter > this.patternSwitchDelay) {
            this.pattern = (this.pattern % 3) + 1; 
            this.patternCounter = 0;
            
            this.fireRate = this.baseFireRate / this.currentPhase; 
            if (this.pattern === 2) this.fireRate *= 1.5;
            if (this.pattern === 3) this.fireRate *= 0.8;
        }

        this.frameCounter++; 
        if (this.frameCounter >= this.fireRate) {
            if (this.pattern === 1) {
                this.fireCircularPattern();
            } else if (this.pattern === 2) {
                this.fireTargetedShot();
            } else if (this.pattern === 3) {
                this.fireFanShot();
            }
            this.frameCounter = 0;
        }

        // Phase-specific extra behaviors
        // Phase 2: occasional strike lines and mines + limit bigOrbs
        if (this.currentPhase === 2) {
            // spawn strike line occasionally
            if (Math.random() < 0.008 && strikeLines.length < 2) {
                // choose random vertical or horizontal line across player area
                if (Math.random() < 0.5) {
                    const y = cameraY + GAME_HEIGHT * (0.12 + Math.random() * 0.2);
                    strikeLines.push(new StrikeLine(cameraX + 50, y, cameraX + GAME_WIDTH - 50, y, TARGET_FPS*1.0, TARGET_FPS*0.35));
                } else {
                    const x = cameraX + GAME_WIDTH * (0.15 + Math.random() * 0.7);
                    // extend vertical strikes to reach near the bottom of the play area
                    const strikeBottom = cameraY + GAME_HEIGHT - 40;
                    strikeLines.push(new StrikeLine(x, cameraY + 50, x, strikeBottom, TARGET_FPS*1.0, TARGET_FPS*0.35));
                }
            }
            // spawn mines occasionally
            if (Math.random() < 0.006 && mines.length < 3) {
                const mx = cameraX + 50 + Math.random() * (GAME_WIDTH - 100);
                const my = cameraY + GAME_HEIGHT * (0.45 + Math.random()*0.45);
                mines.push(new Mine(mx, my, TARGET_FPS * (3 + Math.random()*2)));
            }
            // slightly random chance to fire an extra big orb but cap them
            if (Math.random() < 0.007 && bigOrbs.length < 3) {
                this.fireBigOrb();
            }
        }

        // Phase 3: combos and burst patterns (rotating laser arm attack removed)
        if (this.currentPhase === 3) {
            // small chance to start a short combo (fan then circular)
            if (!this.combo && Math.random() < 0.004) {
                this.combo = { steps: ['fan','burst'], idx: 0, timer: 0 };
            }
            if (this.combo) {
                this.combo.timer++;
                if (this.combo.timer > 14) {
                    const step = this.combo.steps[this.combo.idx];
                    if (step === 'fan') this.fireFanShot();
                    if (step === 'burst') this.fireCircularPattern();
                    this.combo.idx++;
                    this.combo.timer = 0;
                    if (this.combo.idx >= this.combo.steps.length) this.combo = null;
                }
            }
        }
    }
    
    applyPhaseDifficulty() {
        this.bulletSpeed = this.baseBulletSpeed * (1 + (this.currentPhase - 1) * 0.4); 
        this.color = (this.currentPhase === 3) ? 'purple' : 
                     (this.currentPhase === 2) ? 'darkorange' : 
                     'darkred';
    }

    fireCircularPattern() {
        const numBullets = 15 + this.currentPhase * 5; 
        for (let i = 0; i < numBullets; i++) {
            const angle = (i / numBullets) * Math.PI * 2; 
            const speed = this.bulletSpeed;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            enemyBullets.push(new EnemyBullet(this.x, this.y, vx, vy));
        }
    }

    fireTargetedShot() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        const speed = this.bulletSpeed * 1.2; 
        const vx = Math.cos(angle) * speed; 
        const vy = Math.sin(angle) * speed; 
        
        enemyBullets.push(new EnemyBullet(this.x, this.y, vx, vy));
        // In phase 2, also fire a delayed explosive orb toward the player
        if (this.currentPhase === 2) {
            // limit active orbs to avoid spam
            if (bigOrbs.length < 2) this.fireBigOrb();
        }
    }

    fireBigOrb() {
        // Aim generally toward the player but add a small random spread
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const angle = baseAngle + (Math.random() * 0.6 - 0.3);
        const speed = 1.6; // slow orb
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        // Lifetime: ~5 seconds
        const lifetime = Math.floor(TARGET_FPS * 5);
        bigOrbs.push(new BigOrb(this.x, this.y, vx, vy, lifetime));
    }
    
    fireFanShot() {
        const spreadAngle = Math.PI / 3; 
        const centerAngle = Math.atan2(player.y - this.y, player.x - this.x);
        const bulletsPerShot = 7; 
        
        for (let i = 0; i < bulletsPerShot; i++) {
            const offsetAngle = (i - Math.floor(bulletsPerShot / 2)) * (spreadAngle / (bulletsPerShot - 1));
            const finalAngle = centerAngle + offsetAngle;
            
            const speed = this.bulletSpeed * 1.5;
            const vx = Math.cos(finalAngle) * speed;
            const vy = Math.sin(finalAngle) * speed; 
            
            enemyBullets.push(new EnemyBullet(this.x, this.y, vx, vy));
        }
    }
    
    draw() {
        // Improved boss rendering for clarity in bullet-hell gameplay
        ctx.save();

        const cx = this.x;
        const cy = this.y;
        const r = this.radius;

        // Core gradient (bright center -> darker edge)
        const coreGrad = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
        // color choices based on phase for quick readability
        const phaseColors = {1: ['#FF6666', '#880000'], 2: ['#FFAA33', '#663300'], 3: ['#D288FF', '#3b1a4d']};
        const colors = phaseColors[this.currentPhase] || ['#FF6666', '#880000'];
        coreGrad.addColorStop(0, colors[0]);
        coreGrad.addColorStop(1, colors[1]);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // Solid dark outline for contrast against background/bullets
        ctx.lineWidth = Math.max(3, r * 0.08);
        ctx.strokeStyle = 'rgba(10,10,10,0.9)';
        ctx.stroke();

        // Soft outer glow colored by phase but kept low-alpha to avoid distraction
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.12 + 0.02 * this.currentPhase;
        ctx.lineWidth = Math.max(8, r * 0.12);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Health arc: clear, high-contrast indicator around the boss
        const healthPct = Math.max(0, Math.min(1, this.health / this.maxHealth));
        const arcRadius = r * 1.45;
        const arcStart = -Math.PI / 2; // start at top
        const arcEnd = arcStart + healthPct * Math.PI * 2;

        ctx.beginPath();
        ctx.lineWidth = Math.max(6, r * 0.12);
        // Background arc (empty portion)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.arc(cx, cy, arcRadius, arcEnd, arcStart + Math.PI * 2);
        ctx.stroke();

        // Filled arc representing current health
        ctx.beginPath();
        const healthColor = this.currentPhase === 3 ? '#DDA0FF' : (this.currentPhase === 2 ? '#FFD07A' : '#FF9B9B');
        ctx.strokeStyle = healthColor;
        ctx.arc(cx, cy, arcRadius, arcStart, arcEnd);
        ctx.stroke();

        // Subtle rotating ring (thin) to give orientation cue but not distract
        const rot = (Date.now() / 1200) % (Math.PI * 2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.globalAlpha = 0.14;
        ctx.lineWidth = Math.max(2, r * 0.05);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.1, -0.6, 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.1, Math.PI - 0.6, Math.PI + 0.6);
        ctx.stroke();
        ctx.restore();

        // If recently hit, show a minimal hit flash ring for feedback
        if (this._hitFlash && this._hitFlash > 0) {
            const alpha = Math.min(0.9, 0.6 * (this._hitFlash / 8));
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,255,150,${alpha})`;
            ctx.lineWidth = Math.max(2, r * 0.09);
            ctx.stroke();
            this._hitFlash--;
        }

        ctx.restore();
    }
    // Call this when enemy is hit
    hitFlash() {
        this._hitFlash = 8;
    }
}

class Minion extends GameObject {
    constructor(x, y, type = 'scout') {
        const baseStats = MINION_TYPES[type];
        const difficulty = DIFFICULTIES[difficultyKey];
        const waveHealthMultiplier = 1 + (waveNumber - 1) * 0.035;
        const mapHealthMultiplier = 1 + currentMapIndex * 0.1;
        const loopMultiplier = Math.pow(1.35, loopNumber - 1);
        const speedMultiplier = difficulty.speedMultiplier *
            (1 + currentMapIndex * 0.06) *
            (1 + (waveNumber - 1) * 0.012) *
            Math.pow(1.12, loopNumber - 1);
        const stats = {
            ...baseStats,
            health: Math.ceil(baseStats.health * difficulty.healthMultiplier *
                waveHealthMultiplier * mapHealthMultiplier * loopMultiplier),
            descentSpeed: baseStats.descentSpeed * speedMultiplier,
            fireInterval: Math.max(35, Math.floor(baseStats.fireInterval / speedMultiplier)),
            bulletSpeed: baseStats.bulletSpeed * speedMultiplier,
        };
        super(x, y, stats.radius, stats.color);
        this.type = type;
        this.stats = stats;
        this.health = stats.health;
        this.maxHealth = this.health;
        this.originX = x;
        this.age = 0;
        this.teleportCooldown = TARGET_FPS * (3 + Math.random() * 2);
        this.teleportFlash = 0;
        const clearPosition = resolveObstacleOverlap(this.x, this.y, this.radius);
        this.x = clearPosition.x;
        this.y = clearPosition.y;
        this.aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
        this.fireCounter = Math.floor(Math.random() * stats.fireInterval);
    }

    update() {
        this.age++;
        this.teleportFlash = Math.max(0, this.teleportFlash - 1);
        if (MAPS[currentMapIndex].hazard === 'glitch') {
            this.teleportCooldown--;
            if (this.teleportCooldown <= 0) {
                const oldX = this.x;
                const oldY = this.y;
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const jumpDistance = 180 + Math.random() * 160;
                const destination = resolveObstacleOverlap(
                    Math.max(this.radius, Math.min(ARENA_WIDTH - this.radius, this.x + Math.cos(angle) * jumpDistance)),
                    Math.max(this.radius, Math.min(ARENA_HEIGHT - this.radius, this.y + Math.sin(angle) * jumpDistance)),
                    this.radius
                );
                this.x = destination.x;
                this.y = destination.y;
                this.teleportCooldown = TARGET_FPS * (3 + Math.random() * 2);
                this.teleportFlash = 18;
                effects.push(new Effect(oldX, oldY, MAPS[currentMapIndex].accent, 'spark', 0, 0, 12));
                effects.push(new Effect(this.x, this.y, MAPS[currentMapIndex].accent, 'spark', 0, 0, 12));
            }
        }
        const speed = this.stats.descentSpeed * 1.6;
        const pursuit = getMinionPursuitDirection(this, player.x, player.y, speed);
        const moveX = pursuit.x * speed + Math.sin(this.age * 0.035) * 0.45;
        const moveY = pursuit.y * speed;
        const nextX = Math.max(this.radius, Math.min(ARENA_WIDTH - this.radius, this.x + moveX));
        const nextY = Math.max(this.radius, Math.min(ARENA_HEIGHT - this.radius, this.y + moveY));

        if (!isBlockedByObstacle(nextX, nextY, this.radius)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            if (!isBlockedByObstacle(nextX, this.y, this.radius)) this.x = nextX;
            if (!isBlockedByObstacle(this.x, nextY, this.radius)) this.y = nextY;
        }
        this.aimAngle = Math.atan2(player.y - this.y, player.x - this.x);
        this.fireCounter++;
        if (this.fireCounter >= this.stats.fireInterval) {
            const speed = ENEMY_BULLET_SPEED * this.stats.bulletSpeed;
            for (let i = 0; i < this.stats.burstCount; i++) {
                const offset = (i - (this.stats.burstCount - 1) / 2) * this.stats.spread;
                const shotAngle = this.aimAngle + offset;
                enemyBullets.push(new EnemyBullet(
                    this.x,
                    this.y,
                    Math.cos(shotAngle) * speed,
                    Math.sin(shotAngle) * speed
                ));
            }
            this.fireCounter = 0;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.aimAngle - Math.PI / 2);
        if (this.type === 'gunner') ctx.scale(1, -1);
        ctx.shadowBlur = this.teleportFlash > 0 ? 26 : 14;
        ctx.shadowColor = this.teleportFlash > 0 ? '#ffffff' : this.stats.color;
        ctx.fillStyle = this.teleportFlash > 0 ? '#ffffff' : this.stats.color;
        ctx.strokeStyle = '#f0d4ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (this.type === 'scout') {
            ctx.moveTo(0, this.radius);
            ctx.lineTo(-this.radius, -this.radius * 0.55);
            ctx.lineTo(-this.radius * 0.3, -this.radius * 0.32);
            ctx.lineTo(0, -this.radius * 0.72);
            ctx.lineTo(this.radius * 0.3, -this.radius * 0.32);
            ctx.lineTo(this.radius, -this.radius * 0.55);
        } else if (this.type === 'gunner') {
            ctx.moveTo(0, this.radius);
            ctx.lineTo(-this.radius, this.radius * 0.35);
            ctx.lineTo(-this.radius * 0.72, -this.radius * 0.35);
            ctx.lineTo(-this.radius * 0.28, -this.radius * 0.1);
            ctx.lineTo(0, -this.radius);
            ctx.lineTo(this.radius * 0.28, -this.radius * 0.1);
            ctx.lineTo(this.radius * 0.72, -this.radius * 0.35);
            ctx.lineTo(this.radius, this.radius * 0.35);
        } else {
            ctx.moveTo(-this.radius * 0.75, this.radius);
            ctx.lineTo(-this.radius, -this.radius * 0.35);
            ctx.lineTo(-this.radius * 0.45, -this.radius);
            ctx.lineTo(this.radius * 0.45, -this.radius);
            ctx.lineTo(this.radius, -this.radius * 0.35);
            ctx.lineTo(this.radius * 0.75, this.radius);
            ctx.lineTo(0, this.radius * 0.55);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = this.type === 'heavy' ? '#fff0b0' : '#ffd84d';
        ctx.fillRect(-4, -5, 8, this.type === 'heavy' ? 14 : 9);
        ctx.restore();

        const barWidth = this.radius * 2.5;
        ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, 4);
        ctx.fillStyle = this.stats.color;
        ctx.fillRect(
            this.x - barWidth / 2,
            this.y - this.radius - 10,
            barWidth * Math.max(0, this.health / this.maxHealth),
            4
        );
        ctx.save();
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.stats.color;
        ctx.fillText(this.stats.label, this.x, this.y + this.radius + 18);
        ctx.restore();
    }
}

class Meteor extends GameObject {
    constructor(x, y) {
        super(x, y, 62, '#ff7438');
        this.warningFrames = 72;
        this.impactFrames = 18;
        this.impacted = false;
    }

    update() {
        if (this.warningFrames > 0) {
            this.warningFrames--;
        } else if (this.impactFrames > 0) {
            this.impactFrames--;
            if (!this.impacted && distance(this, player) < this.radius + player.hitboxRadius + 16) {
                this.impacted = true;
                damagePlayer();
            }
        }
    }

    draw() {
        ctx.save();
        if (this.warningFrames > 0) {
            const pulse = 0.65 + Math.sin(Date.now() / 90) * 0.25;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = 'rgba(255, 55, 25, 0.16)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff6238';
            ctx.lineWidth = 5;
            ctx.setLineDash([12, 10]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ffe28a';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('MOVE!', this.x, this.y + 8);
        } else if (this.impactFrames > 0) {
            const progress = 1 - this.impactFrames / 18;
            ctx.globalAlpha = this.impactFrames / 18;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ff5b2e';
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * (0.65 + progress * 0.45), 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffe7a3';
            ctx.lineWidth = 8;
            ctx.stroke();
        }
        ctx.restore();
    }
}

class EnemyBullet extends GameObject {
    constructor(x, y, vx, vy) { 
        super(x, y, 4, 'yellow');
        this.vx = vx;
        this.vy = vy;
        this.previousX = x;
        this.previousY = y;
    }
    
    draw() {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'yellow';
        super.draw();
        ctx.shadowBlur = 0;
    }

    update() {
        this.previousX = this.x;
        this.previousY = this.y;
        this.x += this.vx;
        this.y += this.vy;
    }
}

// Big delayed orb that moves slowly toward a direction then explodes into fast small bullets
class BigOrb extends GameObject {
    constructor(x, y, vx, vy, life) {
        super(x, y, 26, 'magenta');
        this.vx = vx;
        this.vy = vy;
        this.life = life; // ticks until explosion
        this.maxLife = life;
        this.exploded = false;
        this.damage = 1 * SCALE_FACTOR;
    }

    update() {
        // Slow drift
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        // Slight homing toward player's last known position to make them more threatening
        if (!this.exploded && Math.random() < 0.02) {
            const ax = player.x - this.x;
            const ay = player.y - this.y;
            this.vx += ax * 0.002;
            this.vy += ay * 0.002;
            const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
            const max = 3.2;
            if (speed > max) {
                this.vx = this.vx / speed * max;
                this.vy = this.vy / speed * max;
            }
        }
        // Flash/pulse when close to exploding
        if (this.life < 30) this.radius = 26 + (30 - this.life) * 0.6;
        // small pulsing effect could be added via radius adjustment when drawing
    }

    draw() {
        // Draw glowing orb
        ctx.save();
        const pulse = 0.9 + 0.1 * Math.sin(Date.now() / 120);
        ctx.shadowBlur = 30 * (this.life / this.maxLife + 0.2);
        ctx.shadowColor = 'magenta';
        ctx.fillStyle = `rgba(255, 0, 255, ${0.6 + 0.4 * (this.life / this.maxLife)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    explode() {
        if (this.exploded) return;
        this.exploded = true;
        const pieces = 30; // number of small fast projectiles
        for (let i = 0; i < pieces; i++) {
            const angle = (i / pieces) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
            const speed = 8 + Math.random() * 6; // fast
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const b = new EnemyBullet(this.x, this.y, vx, vy);
            b.radius = 4;
            enemyBullets.push(b);
        }
        // explosion effect
        for (let i = 0; i < 40; i++) {
            effects.push(new Effect(this.x + (Math.random()*20-10), this.y + (Math.random()*20-10), 'magenta', 'spark', (Math.random()*6-3), (Math.random()*6-3), 20 + Math.random()*20));
        }
    }
}

// Telegraphed sweeping line that deals damage when it activates
class StrikeLine {
    constructor(x1, y1, x2, y2, telegraphFrames = 60, activeFrames = 18, color = '#ff5020') {
        this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
        this.telegraph = telegraphFrames; this.active = activeFrames;
        this.maxTele = telegraphFrames;
        this.damage = 1 * SCALE_FACTOR;
        this.activeNow = false;
        this.color = color;
    }
    update() {
        if (this.telegraph > 0) {
            this.telegraph--;
            if (this.telegraph <= 0) this.activeNow = true;
        } else if (this.active > 0) {
            this.active--;
        }
    }
    draw() {
        // Telegraph line (pulsing)
        if (this.telegraph > 0) {
            const alpha = 0.15 + 0.85 * (1 - this.telegraph / this.maxTele);
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 6;
            ctx.setLineDash([6, 8]);
            ctx.beginPath();
            ctx.moveTo(this.x1, this.y1);
            ctx.lineTo(this.x2, this.y2);
            ctx.stroke();
            ctx.restore();
        } else if (this.activeNow && this.active > 0) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.shadowBlur = 22;
            ctx.shadowColor = this.color;
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.moveTo(this.x1, this.y1);
            ctx.lineTo(this.x2, this.y2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

// Mine: stationary object that after a delay explodes into bullets
class Mine extends GameObject {
    constructor(x, y, life = TARGET_FPS * 3.5) {
        super(x, y, 10, 'orange');
        this.life = life;
        this.maxLife = life;
        this.exploded = false;
    }
    update() {
        this.life--;
        // small hover animation
        this.y += Math.sin(Date.now()/200 + this.x) * 0.02;
    }
    draw() {
        ctx.save();
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 160);
        ctx.shadowBlur = 20 * (this.life / this.maxLife + 0.2);
        ctx.shadowColor = 'orange';
        ctx.fillStyle = `rgba(255,165,0,${0.6 + 0.4*(this.life/this.maxLife)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
    explode() {
        if (this.exploded) return;
        this.exploded = true;
        const count = 18;
        for (let i=0;i<count;i++){
            const ang = (i/count)*Math.PI*2 + (Math.random()*0.4-0.2);
            const s = 6 + Math.random()*4;
            enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(ang)*s, Math.sin(ang)*s));
        }
        for (let i=0;i<20;i++) effects.push(new Effect(this.x + Math.random()*20-10, this.y + Math.random()*20-10, 'orange','spark',(Math.random()*4-2),(Math.random()*4-2),20+Math.random()*20));
    }
}

// LaserArm: telegraphed rotating laser sweep centered on boss
class LaserArm {
    constructor(x, y, startAngle = 0, arcSize = Math.PI / 3, angularSpeed = 0.02, telegraph = TARGET_FPS * 0.9, life = TARGET_FPS * 1.6) {
        this.x = x; this.y = y;
        this.angle = startAngle; // center angle of the arm
        this.arc = arcSize; // half width each side
        this.angularSpeed = angularSpeed; // radians per tick while sweeping
        this.telegraph = telegraph; // frames before active
        this.life = life; // active frames
        this.maxTele = telegraph;
        this.maxLife = life;
        this.activeNow = false;
        this.length = Math.max(GAME_WIDTH, GAME_HEIGHT) * 0.9;
    }
    update() {
        if (this.telegraph > 0) {
            this.telegraph--;
            if (this.telegraph <= 0) this.activeNow = true;
        } else if (this.life > 0) {
            this.life--;
            // sweep
            this.angle += this.angularSpeed;
        }
    }
    draw() {
        if (this.telegraph > 0) {
            // telegraph ring and faint arc
            ctx.save();
            const alpha = 0.2 + 0.6 * (1 - this.telegraph / this.maxTele);
            ctx.strokeStyle = `rgba(200,150,255,${alpha})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.length * 0.5, this.angle - this.arc, this.angle + this.arc);
            ctx.stroke();
            ctx.restore();
        } else if (this.activeNow && this.life > 0) {
            // draw solid sweeping arc
            ctx.save();
            ctx.strokeStyle = 'rgba(180,100,255,0.95)';
            ctx.lineWidth = 18;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.length * 0.5, this.angle - this.arc, this.angle + this.arc);
            ctx.stroke();
            ctx.restore();
        }
    }
    // returns true if a point (px,py) is hit by the active arm
    hitsPoint(px, py) {
        if (!this.activeNow || this.life <= 0) return false;
        const dx = px - this.x; const dy = py - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > this.length * 0.5) return false;
        const ang = Math.atan2(dy, dx);
        let diff = ang - this.angle;
        while (diff > Math.PI) diff -= Math.PI*2;
        while (diff < -Math.PI) diff += Math.PI*2;
        return Math.abs(diff) <= this.arc;
    }
}

class Effect extends GameObject {
    constructor(x, y, color, type = 'spark', initialVx = (Math.random() * 2 - 1), initialVy = (Math.random() * 2 - 1), life = 15) {
        super(x, y, 8, color); 
        this.life = life;
        this.maxLife = life;
        this.type = type;
        this.rotation = Math.random() * Math.PI * 2;
        this.vx = initialVx; 
        this.vy = initialVy; 
        this.text = ''; 
        if (type === 'text') {
             this.text = color; 
             this.color = 'lime'; 
             this.life = 60; 
             this.maxLife = 60;
             this.vx = 0;
             this.vy = -1; 
        }
    }

    update() {
        this.life--; 
        this.radius = this.type === 'shockwave'
            ? (this.maxRadius || 420) * (1 - this.life / this.maxLife)
            : 8 * (this.life / this.maxLife);
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw() {
        if (this.type === 'text') {
            ctx.globalAlpha = this.life / this.maxLife;
            ctx.font = '30px Arial';
            ctx.fillStyle = this.color; 
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y); 
            ctx.globalAlpha = 1.0;
        } else if (this.type === 'ripple' || this.type === 'shockwave') {
            ctx.save();
            ctx.globalAlpha = this.type === 'shockwave'
                ? (1 - this.life / this.maxLife) * 0.8
                : this.life / this.maxLife * 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.type === 'shockwave' ? this.radius : this.radius * 2, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 16;
            ctx.shadowColor = this.color;
            ctx.stroke();
            ctx.restore();
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        } else {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            const size = this.radius * 2;
            ctx.shadowBlur = 10; 
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life / this.maxLife;
            ctx.fillRect(-size/4, -size/4, size/2, size/2); 
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-size/4, -size/4, size/2, size/2); 
            ctx.restore();
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
    }
}

class PowerMissile extends GameObject {
    constructor(x, y, target) {
        super(x, y, 8, '#ff914d');
        this.target = target;
        this.speed = 8;
        this.damage = 25 * (1 + player.getPowerupLevel('homing') * 0.6) * player.damageMultiplier;
        this.angle = player.aimAngle;
    }

    update() {
        if (gameStage === 'minions' && (!this.target || !minions.includes(this.target))) {
            this.target = minions.slice().sort((a, b) => distance(this, a) - distance(this, b))[0] || null;
        } else if (gameStage === 'boss') {
            this.target = enemy;
        }
        if (!this.target) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            return;
        }
        const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        let difference = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
        this.angle += Math.max(-0.12, Math.min(0.12, difference));
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff914d';
        ctx.fillStyle = '#ffc16b';
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(-7, -5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// --- 3. GAME LOGIC ---
const player = new Player(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
const enemy = new Enemy(ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - GAME_HEIGHT * 0.32);
enemy.applyPhaseDifficulty();

function getPlayerGunMounts() {
    const guns = player.startingGuns === 2
        ? [
            { offset: -7, forward: 38, spread: -0.04 },
            { offset: 7, forward: 38, spread: 0.04 },
        ]
        : [{ offset: 0, forward: 42, spread: 0 }];
    if (player.powerLevel >= 1) guns.push(
        { offset: -11, forward: 13, spread: -0.14 },
        { offset: 11, forward: 13, spread: 0.14 }
    );
    if (player.powerLevel >= 3) guns.push(
        { offset: -20, forward: 2, spread: -0.28 },
        { offset: 20, forward: 2, spread: 0.28 }
    );
    return guns;
}

function awardUltimateCharge(amount) {
    if (isResolvingUltimate) return;
    player.ultimateCharge = Math.min(ULTIMATE_MAX_CHARGE, player.ultimateCharge + amount);
}

function applyPowerup(type, isSpecial = false) {
    const definition = isSpecial ? JET_SPECIALS[player.jetId] : SHARED_POWERUPS[type];
    if (!definition) return;
    const powerup = isSpecial ? player.specialPowerup :
        (player.activePowerups[type] || (player.activePowerups[type] = { level: 0, duration: 0 }));
    powerup.level = Math.min(MAX_POWERUP_LEVEL, powerup.level + 1);
    let duration = definition.duration * (1 + (powerup.level - 1) * 0.25);
    if (player.jetId === 'twin') duration *= 1.4;
    if (player.jetId === 'stealth' && (type === 'shield' || isSpecial)) duration *= 1.25;
    powerup.duration = Math.min(TARGET_FPS * 40, Math.max(powerup.duration, duration));
    playSound('phase');
    effects.push(new Effect(
        player.x,
        player.y - 40,
        `${definition.label} LV ${powerup.level}`,
        'text'
    ));
}

function weakenPowerups() {
    for (const powerup of Object.values(player.activePowerups)) {
        if (powerup.level <= 0) continue;
        powerup.level--;
        powerup.duration = Math.floor(powerup.duration * 0.75);
        if (powerup.level === 0) powerup.duration = 0;
    }
    if (player.specialPowerup.level > 0) {
        player.specialPowerup.level--;
        player.specialPowerup.duration = Math.floor(player.specialPowerup.duration * 0.75);
        if (player.specialPowerup.level === 0) player.specialPowerup.duration = 0;
    }
}

function firePowerMissile() {
    if (powerMissiles.length >= 12) return;
    const target = gameStage === 'boss'
        ? enemy
        : minions.slice().sort((a, b) => distance(player, a) - distance(player, b))[0];
    if (!target) return;
    const side = powerMissiles.length % 2 === 0 ? -1 : 1;
    powerMissiles.push(new PowerMissile(
        player.x + Math.cos(player.aimAngle + Math.PI / 2) * side * 14,
        player.y + Math.sin(player.aimAngle + Math.PI / 2) * side * 14,
        target
    ));
}

function fireWingmenShot() {
    const sideOffset = 34 + player.specialPowerup.level * 5;
    for (const side of [-1, 1]) {
        const angle = player.aimAngle + side * 0.08;
        const x = player.x - Math.sin(player.aimAngle) * sideOffset;
        const y = player.y + Math.cos(player.aimAngle) * sideOffset;
        playerBullets.push(new PlayerBullet(
            x,
            y,
            Math.cos(angle) * PLAYER_BULLET_SPEED,
            Math.sin(angle) * PLAYER_BULLET_SPEED
        ));
    }
}

function completeBossFight() {
    Stats.endTime = Date.now();
    score = Stats.calculateFinalScore();
    sectorUpgradeAwarded = false;
    if (currentMapIndex < MAPS.length - 1) {
        checkpointMapIndex = currentMapIndex + 1;
    }
    if (currentMapIndex < MAPS.length - 1 &&
        currentMapIndex >= campaignProgress.unlockedMapIndex) {
        campaignProgress.unlockedMapIndex = currentMapIndex + 1;
        campaignProgress.upgrades = Math.min(MAPS.length - 1, campaignProgress.upgrades + 1);
        player.maxHealth += 5;
        player.health += 5;
        sectorUpgradeAwarded = true;
    }
    loopRestartFrames = currentMapIndex === MAPS.length - 1 ? TARGET_FPS * 5 : 0;
    saveCampaignProgress();
    gameState = 'sectorClear';
    playSound('win');
}

function damageBoss(damage, hitX = enemy.x, hitY = enemy.y) {
    if (gameStage !== 'boss' || enemy.health <= 0) return;
    enemy.health -= damage;
    Stats.bossHits.bullet++;
    if (typeof enemy.hitFlash === 'function') enemy.hitFlash();
    for (let i = 0; i < 3; i++) {
        effects.push(new Effect(hitX, hitY, 'rgba(255, 255, 100, 1)'));
    }
    if (enemy.health <= 0) {
        enemy.health = 0;
        completeBossFight();
    } else {
        playSound('hit');
    }
}

function triggerShockwave(level) {
    const radius = 420 + level * 180;
    const damage = 60 * level * player.damageMultiplier;
    for (const minion of minions.slice()) {
        if (distance(player, minion) <= radius) damageMinion(minion, damage);
    }
    if (gameStage === 'boss' && distance(player, enemy) <= radius + enemy.radius) {
        damageBoss(damage, enemy.x, enemy.y);
    }
    enemyBullets = enemyBullets.filter(bullet => distance(player, bullet) > radius);
    const shockwave = new Effect(player.x, player.y, '#ffe15a', 'shockwave', 0, 0, 36 + level * 12);
    shockwave.maxRadius = radius;
    effects.push(shockwave);
    playSound('phase');
}

function getWorldSlowDivisor() {
    let divisor = 1;
    const slowLevel = player.getPowerupLevel('slow');
    if (slowLevel > 0) divisor = Math.max(divisor, slowLevel + 1);
    if (player.jetId === 'forward' && player.isPowerupActive('special')) {
        divisor = Math.max(divisor, 3 + player.specialPowerup.level);
    }
    return divisor;
}

function activateUltimate() {
    if (gameState !== 'playing' || isPaused || player.ultimateCharge < ULTIMATE_MAX_CHARGE) return false;
    player.ultimateCharge = 0;
    const special = JET_SPECIALS[player.jetId];
    isResolvingUltimate = true;
    for (const minion of minions.slice()) damageMinion(minion, minion.health);
    isResolvingUltimate = false;
    enemyBullets = [];
    bigOrbs.forEach(orb => effects.push(new Effect(orb.x, orb.y, special.color, 'spark', 0, 0, 24)));
    bigOrbs = [];
    strikeLines = [];
    mines = [];
    laserArms = [];
    const bossDamageRatios = { delta: 0.12, twin: 0.1, stealth: 0.12, forward: 0.18 };
    const bossDamage = enemy.maxHealth * bossDamageRatios[player.jetId] * player.damageMultiplier;
    if (gameStage === 'boss') damageBoss(bossDamage, enemy.x, enemy.y);

    if (player.jetId === 'delta') {
        applyPowerup('special', true);
    } else if (player.jetId === 'stealth') {
        applyPowerup('special', true);
        player.specialPowerup.duration = Math.max(player.specialPowerup.duration, TARGET_FPS * 4);
    } else if (player.jetId === 'forward') {
        applyPowerup('special', true);
        player.specialPowerup.duration = Math.max(player.specialPowerup.duration, TARGET_FPS * 3);
    } else if (player.jetId === 'twin') {
        applyPowerup('special', true);
        player.specialPowerup.duration = Math.max(player.specialPowerup.duration, TARGET_FPS * 5);
        for (let i = 0; i < 4; i++) fireWingmenShot();
    }
    const ultimateWave = new Effect(player.x, player.y, special.color, 'shockwave', 0, 0, 60);
    ultimateWave.maxRadius = Math.max(GAME_WIDTH, GAME_HEIGHT) * 0.6;
    effects.push(ultimateWave);
    playSound('phase');
    return true;
}

function handlePlayerFire() {
    playerFireCounter++;
    const fireDelay = player.jetId === 'delta' ? PLAYER_FIRE_DELAY * 0.8 : PLAYER_FIRE_DELAY;
    if (isFiring && playerFireCounter >= fireDelay) {
        playSound('shoot');
        const perpendicularX = -Math.sin(player.aimAngle);
        const perpendicularY = Math.cos(player.aimAngle);
        for (const gun of getPlayerGunMounts()) {
            const angles = [0];
            if (player.getPowerupLevel('spread') > 0) {
                const spreadLevel = player.getPowerupLevel('spread');
                angles.push(-0.22, 0.22);
                if (spreadLevel >= 2) angles.push(-0.42, 0.42);
                if (spreadLevel >= 3) angles.push(-0.62, 0.62);
            }
            for (const extraSpread of angles) {
                const shotAngle = player.aimAngle + gun.spread + extraSpread;
                const vx = Math.cos(shotAngle) * PLAYER_BULLET_SPEED;
                const vy = Math.sin(shotAngle) * PLAYER_BULLET_SPEED;
                playerBullets.push(new PlayerBullet(
                    player.x + Math.cos(player.aimAngle) * gun.forward + perpendicularX * gun.offset,
                    player.y + Math.sin(player.aimAngle) * gun.forward + perpendicularY * gun.offset,
                    vx,
                    vy
                ));
            }
        }
        if (player.jetId === 'twin' && player.isPowerupActive('special')) fireWingmenShot();
        playerFireCounter = 0;
    }
}

function handleEnemyDrop() {
    if (Math.random() < HEALTH_DROP_CHANCE) {
        pickups.push(new Pickup(enemy.x, enemy.y, 'health'));
    }
}

function damageMinion(minion, damage) {
    if (!minions.includes(minion) || minion.health <= 0) return;

    minion.health -= damage;
    for (let i = 0; i < 3; i++) {
        effects.push(new Effect(minion.x, minion.y, 'rgba(220, 150, 255, 1)'));
    }
    if (minion.health <= 0) {
        minion.health = 0;
        Stats.minionKills++;
        pickups.push(new Pickup(minion.x, minion.y, 'power'));
        awardUltimateCharge(15);
        if (Math.random() < POWERUP_DROP_CHANCE) {
            const powerupTypes = Object.keys(SHARED_POWERUPS);
            pickups.push(new Pickup(
                minion.x + (Math.random() - 0.5) * 24,
                minion.y,
                'shared',
                powerupTypes[Math.floor(Math.random() * powerupTypes.length)]
            ));
        }
        if (Math.random() < SPECIAL_DROP_CHANCE) {
            pickups.push(new Pickup(minion.x, minion.y - 14, 'special'));
        }
        playSound('hit');
    }
}

function damagePlayer() {
    if (isInvulnerable || gameState !== 'playing') return;
    if (player.jetId === 'stealth' && player.isPowerupActive('special')) return;

    let damageMultiplier = player.damageTakenMultiplier;
    const shieldLevel = player.getPowerupLevel('shield');
    if (shieldLevel > 0) {
        const shieldProtection = Math.min(0.75, shieldLevel * (0.25 + (player.jetId === 'stealth' ? 0.15 : 0)));
        damageMultiplier *= 1 - shieldProtection;
    }
    const damage = player.maxHealth * 0.05 * damageMultiplier;
    player.health = Math.max(0, player.health - damage);
    weakenPowerups();
    playSound('damage');
    isInvulnerable = true;
    invulnerabilityTimer = INVULNERABILITY_FRAMES;
    player.hitEffectTimer = 30;
    Stats.playerHitsTaken++;

    for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const speed = 8 + Math.random() * 6;
        effects.push(new Effect(
            player.x + Math.cos(angle) * 8,
            player.y + Math.sin(angle) * 8,
            'rgba(255, 50, 50, 1)',
            'spark',
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            20 + Math.random() * 10
        ));
    }

    if (player.health <= 0) {
        Stats.endTime = Date.now();
        score = Stats.calculateFinalScore();
        gameState = 'gameOver';
    }
}

function removeCollidingBullets() {
    const removedPlayerBullets = new Set();
    const removedEnemyBullets = new Set();

    for (const pBullet of playerBullets) {
        const playerStartX = pBullet.previousX ?? pBullet.x;
        const playerStartY = pBullet.previousY ?? pBullet.y;
        const playerDeltaX = pBullet.x - playerStartX;
        const playerDeltaY = pBullet.y - playerStartY;

        for (const eBullet of enemyBullets) {
            if (removedEnemyBullets.has(eBullet)) continue;

            const enemyStartX = eBullet.previousX ?? eBullet.x;
            const enemyStartY = eBullet.previousY ?? eBullet.y;
            const relativeStartX = playerStartX - enemyStartX;
            const relativeStartY = playerStartY - enemyStartY;
            const relativeDeltaX = playerDeltaX - (eBullet.x - enemyStartX);
            const relativeDeltaY = playerDeltaY - (eBullet.y - enemyStartY);
            const relativeDeltaLengthSquared =
                relativeDeltaX * relativeDeltaX + relativeDeltaY * relativeDeltaY;
            const closestTime = relativeDeltaLengthSquared === 0
                ? 0
                : Math.max(0, Math.min(1,
                    -(relativeStartX * relativeDeltaX + relativeStartY * relativeDeltaY) /
                    relativeDeltaLengthSquared
                ));
            const closestX = relativeStartX + relativeDeltaX * closestTime;
            const closestY = relativeStartY + relativeDeltaY * closestTime;
            const collisionRadius = pBullet.radius + eBullet.radius;

            if (closestX * closestX + closestY * closestY <= collisionRadius * collisionRadius) {
                removedPlayerBullets.add(pBullet);
                removedEnemyBullets.add(eBullet);
                effects.push(new Effect(
                    (playerStartX + playerDeltaX * closestTime +
                        enemyStartX + (eBullet.x - enemyStartX) * closestTime) / 2,
                    (playerStartY + playerDeltaY * closestTime +
                        enemyStartY + (eBullet.y - enemyStartY) * closestTime) / 2,
                    '#ffffff',
                    'spark',
                    0,
                    0,
                    10
                ));
                break;
            }
        }
    }

    if (removedPlayerBullets.size > 0) {
        playerBullets = playerBullets.filter(bullet => !removedPlayerBullets.has(bullet));
        enemyBullets = enemyBullets.filter(bullet => !removedEnemyBullets.has(bullet));
    }
}

function checkCollisions() {
    removeCollidingBullets();

    // 1. Enemy Bullet -> Player Collision
    enemyBullets = enemyBullets.filter(eBullet => {
        if (projectileHitsObstacle(eBullet)) return false;
        // Player hitbox is at the center of the player object
        if (distance(eBullet, player) < eBullet.radius + player.hitboxRadius) { 
            damagePlayer();
            return false;
        }
        return true; 
    });

    // Player contact damages the ship and destroys the minion on impact.
    minions = minions.filter(minion => {
        if (distance(minion, player) >= minion.radius + player.radius) return true;
        damagePlayer();
        damageMinion(minion, minion.health);
        return false;
    });

    // BigOrbs -> Player collision and explosion when reaching player or life end
    bigOrbs = bigOrbs.filter(orb => {
        if (projectileHitsObstacle(orb)) {
            effects.push(new Effect(orb.x, orb.y, '#ff9e54', 'spark', 0, 0, 22));
            return false;
        }
        // If orb touches player tiny hitbox, explode immediately
        if (distance(orb, player) < orb.radius + player.hitboxRadius) {
            orb.explode();
            return false;
        }
        if (orb.life <= 0) {
            orb.explode();
            return false;
        }
        return true;
    });

    // StrikeLines -> Player collision (only when active)
    strikeLines = strikeLines.filter(s => {
        if (s.activeNow && s.active > 0) {
            // check distance from player to line segment
            const d = pointToSegmentDistance(player.x, player.y, s.x1, s.y1, s.x2, s.y2);
            if (d < player.hitboxRadius + 8) {
                damagePlayer();
            }
        }
        // Keep if still telegraphing or active
        return (s.telegraph > 0) || (s.active > 0);
    });

    // Mines -> explode when life <= 0 or touched by player
    mines = mines.filter(m => {
        if (distance(m, player) < m.radius + player.hitboxRadius) {
            m.explode();
            return false;
        }
        if (m.life <= 0) {
            m.explode();
            return false;
        }
        return !m.exploded;
    });

    // LaserArms -> check if active arm hits player
    laserArms = laserArms.filter(la => {
        if (la.activeNow && la.life > 0) {
            if (la.hitsPoint(player.x, player.y)) {
                damagePlayer();
            }
        }
        // Keep if telegraphing or active
        return (la.telegraph > 0) || (la.life > 0);
    });

    // 2. Player Bullet -> Enemy Collision
    playerBullets = playerBullets.filter(pBullet => {
        if (projectileHitsObstacle(pBullet)) return false;
        if (gameStage === 'minions') {
            const targetMinion = minions.find(minion =>
                minion.health > 0 &&
                distance(pBullet, minion) < pBullet.radius + minion.radius
            );
            if (targetMinion) {
                damageMinion(targetMinion, pBullet.damage);
                return false;
            }
            return true;
        }
        if (gameStage !== 'boss') return true;

        if (distance(pBullet, enemy) < pBullet.radius + enemy.radius) {
            damageBoss(pBullet.damage, pBullet.x, pBullet.y);
            handleEnemyDrop(); 
            return false; 
        }
        return true; 
    });

    powerMissiles = powerMissiles.filter(missile => {
        if (projectileHitsObstacle(missile)) {
            effects.push(new Effect(missile.x, missile.y, '#ff914d', 'spark', 0, 0, 18));
            return false;
        }
        if (gameStage === 'minions') {
            const target = minions.find(minion =>
                distance(missile, minion) < missile.radius + minion.radius
            );
            if (target) {
                damageMinion(target, missile.damage);
                return false;
            }
        } else if (gameStage === 'boss' &&
            distance(missile, enemy) < missile.radius + enemy.radius) {
            damageBoss(missile.damage, missile.x, missile.y);
            handleEnemyDrop();
            return false;
        }
        return missile.x >= 0 && missile.x <= ARENA_WIDTH &&
            missile.y >= 0 && missile.y <= ARENA_HEIGHT;
    });
    
    // 3. Pickup -> Player Collision
    pickups = pickups.filter(pickup => {
        if (distance(pickup, player) < pickup.radius + player.radius) {
            
            if (pickup.type === 'health') {
                const healedAmount = Math.min(HEALTH_PICKUP_AMOUNT, player.maxHealth - player.health);
                player.health += healedAmount;
                playSound('heal');
                if (healedAmount > 0) {
                    effects.push(new Effect(player.x, player.y - 30, `+${healedAmount} HP`, 'text'));
                }
            } else if (pickup.type === 'power') {
                if (player.powerLevel < MAX_PLAYER_POWER) {
                    player.powerupCharge++;
                    if (player.powerupCharge >= player.powerupsForNextEvolution) {
                        player.powerupCharge -= player.powerupsForNextEvolution;
                        player.powerLevel++;
                        player.powerupsForNextEvolution++;
                        playSound('phase');
                        effects.push(new Effect(
                            player.x,
                            player.y - 35,
                            `${PLANE_EVOLUTION_NAMES[player.powerLevel]} EVOLVED`,
                            'text'
                        ));
                    } else {
                        playSound('heal');
                        effects.push(new Effect(
                            player.x,
                            player.y - 35,
                            `POWER ${player.powerupCharge}/${player.powerupsForNextEvolution}`,
                            'text'
                        ));
                    }
                } else {
                    Stats.bonusScore += MAX_POWER_PICKUP_SCORE;
                    effects.push(new Effect(player.x, player.y - 35, '+100', 'text'));
                }
            } else if (pickup.type === 'shared') {
                applyPowerup(pickup.powerupType);
            } else if (pickup.type === 'special' && pickup.jetId === player.jetId) {
                applyPowerup('special', true);
            }
            return false; 
        }
        return pickup.life > 0;
    });

    meteors = meteors.filter(meteor => meteor.warningFrames > 0 || meteor.impactFrames > 0);
}

function cleanupObjects() {
    enemyBullets = enemyBullets.filter(b => 
        b.x > -50 && b.x < ARENA_WIDTH + 50 &&
        b.y > -50 && b.y < ARENA_HEIGHT + 50
    );
    playerBullets = playerBullets.filter(b =>
        b.x > -b.radius && b.x < ARENA_WIDTH + b.radius &&
        b.y > -b.radius && b.y < ARENA_HEIGHT + b.radius
    );
    powerMissiles = powerMissiles.filter(m =>
        m.x > -m.radius && m.x < ARENA_WIDTH + m.radius &&
        m.y > -m.radius && m.y < ARENA_HEIGHT + m.radius
    );
    effects = effects.filter(e => e.life > 0); 
    pickups = pickups.filter(p =>
        p.life > 0 && p.x > -p.radius && p.x < ARENA_WIDTH + p.radius &&
        p.y > -p.radius && p.y < ARENA_HEIGHT + p.radius
    );
    minions = minions.filter(m =>
        m.health > 0 && m.x > -m.radius && m.x < ARENA_WIDTH + m.radius &&
        m.y > -m.radius && m.y < ARENA_HEIGHT + m.radius
    );
    // Cleanup custom arrays
    strikeLines = strikeLines.filter(s => (s.telegraph > 0) || (s.active > 0));
    mines = mines.filter(m => !m.exploded && m.life > -10);
    // LaserArms cleanup and caps
    laserArms = laserArms.filter(l => (l.telegraph > 0) || (l.life > 0));
    // Keep arrays capped
    if (strikeLines.length > 6) strikeLines.splice(0, strikeLines.length - 6);
    if (mines.length > 6) mines.splice(0, mines.length - 6);
    if (laserArms.length > 4) laserArms.splice(0, laserArms.length - 4);
}


// --- 4. DYNAMIC BACKGROUND & AESTHETIC UI ---

let backgroundHue = 0;
function drawArena() {
    const map = MAPS[currentMapIndex];
    ctx.fillStyle = map.background;
    ctx.fillRect(cameraX, cameraY, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.strokeStyle = map.grid;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 2;
    const spacing = 120;
    const firstX = Math.floor(cameraX / spacing) * spacing;
    const firstY = Math.floor(cameraY / spacing) * spacing;
    for (let x = firstX; x <= cameraX + GAME_WIDTH; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, cameraY);
        ctx.lineTo(x, cameraY + GAME_HEIGHT);
        ctx.stroke();
    }
    for (let y = firstY; y <= cameraY + GAME_HEIGHT; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(cameraX, y);
        ctx.lineTo(cameraX + GAME_WIDTH, y);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = map.accent;
    ctx.lineWidth = 12;
    ctx.shadowBlur = 22;
    ctx.shadowColor = map.accent;
    ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    ctx.restore();

    getArenaObstacles().forEach(drawArenaObstacle);
}

function drawArenaObstacle(obstacle) {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.rotation);
    if (obstacle.type === 'rock') {
        const points = 9;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#556477';
        ctx.fillStyle = '#3d485a';
        ctx.strokeStyle = '#8290a3';
        ctx.lineWidth = 5;
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = obstacle.radius * (0.78 + ((i * 7) % 4) * 0.07);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.78;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#566274';
        ctx.beginPath();
        ctx.moveTo(-obstacle.radius * 0.48, -obstacle.radius * 0.1);
        ctx.lineTo(-obstacle.radius * 0.08, -obstacle.radius * 0.52);
        ctx.lineTo(obstacle.radius * 0.42, -obstacle.radius * 0.18);
        ctx.lineTo(obstacle.radius * 0.12, obstacle.radius * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(196, 210, 224, 0.55)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-obstacle.radius * 0.65, obstacle.radius * 0.3);
        ctx.lineTo(-obstacle.radius * 0.35, obstacle.radius * 0.53);
        ctx.lineTo(-obstacle.radius * 0.05, obstacle.radius * 0.46);
        ctx.stroke();
    } else {
        const scale = obstacle.radius / 100;
        ctx.scale(scale, scale);
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff874d';
        ctx.fillStyle = '#5b6674';
        ctx.strokeStyle = '#b0bac4';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(0, -88);
        ctx.lineTo(-13, -26);
        ctx.lineTo(-86, 17);
        ctx.lineTo(-71, 41);
        ctx.lineTo(-18, 23);
        ctx.lineTo(0, 56);
        ctx.lineTo(18, 23);
        ctx.lineTo(71, 41);
        ctx.lineTo(86, 17);
        ctx.lineTo(13, -26);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#303947';
        ctx.beginPath();
        ctx.moveTo(-10, -64);
        ctx.lineTo(10, -64);
        ctx.lineTo(15, 10);
        ctx.lineTo(0, 34);
        ctx.lineTo(-15, 10);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#d75e52';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(-72, 23);
        ctx.lineTo(-35, 12);
        ctx.moveTo(70, 26);
        ctx.lineTo(36, 11);
        ctx.moveTo(0, 55);
        ctx.lineTo(8, 81);
        ctx.stroke();

        ctx.fillStyle = '#ffad58';
        ctx.beginPath();
        ctx.arc(-9, 10, 4, 0, Math.PI * 2);
        ctx.arc(9, 10, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawMinimap() {
    const width = 320;
    const height = width * ARENA_HEIGHT / ARENA_WIDTH;
    const x = GAME_WIDTH - width - 24;
    const y = 82;
    const scaleX = width / ARENA_WIDTH;
    const scaleY = height / ARENA_HEIGHT;

    ctx.save();
    ctx.fillStyle = 'rgba(4, 10, 24, 0.88)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = MAPS[currentMapIndex].accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        x + cameraX * scaleX,
        y + cameraY * scaleY,
        GAME_WIDTH * scaleX,
        GAME_HEIGHT * scaleY
    );
    const drawDot = (entityX, entityY, color, radius) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + entityX * scaleX, y + entityY * scaleY, radius, 0, Math.PI * 2);
        ctx.fill();
    };
    minions.forEach(minion => drawDot(minion.x, minion.y, minion.stats.color, 3));
    meteors.forEach(meteor => drawDot(meteor.x, meteor.y, '#ff7438', 3));
    getArenaObstacles().forEach(obstacle => drawDot(obstacle.x, obstacle.y, '#a6b2c2', 3));
    if (gameStage === 'boss') drawDot(enemy.x, enemy.y, '#ff5555', 5);
    drawDot(player.x, player.y, '#52ff9a', 5);
    ctx.restore();
}

function drawBackground() {
    // Subtle in-game retro background optimized for visibility
    backgroundHue = (backgroundHue + 0.03) % 360;

    const map = MAPS[currentMapIndex];
    const g = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    g.addColorStop(0, map.background);
    g.addColorStop(1, '#090912');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Soft nebula / color wash using very low alpha radial gradients to add depth
    if (Math.abs(settings.theme === 'retro')) {
        // subtle cyan-magenta wash near top center
        const neb = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT*0.18, 50, GAME_WIDTH/2, GAME_HEIGHT*0.18, GAME_WIDTH*0.9);
        neb.addColorStop(0, map.accent + '12');
        neb.addColorStop(0.4, map.grid + '0a');
        neb.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = neb;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Parallax stars (small, low alpha and limited to background so they don't distract)
    const starLayers = [ {count: 40, speed: 0.02, alpha: 0.12, size:1}, {count: 20, speed: 0.06, alpha:0.08, size:1.6} ];
    const time = Date.now();
    for (let layer of starLayers) {
        ctx.fillStyle = `rgba(255,255,255,${layer.alpha})`;
        for (let i = 0; i < layer.count; i++) {
            const x = (i * (137 + layer.count) + time * layer.speed) % GAME_WIDTH;
            const y = (i * (71 + layer.count) + (time * layer.speed * 0.6)) % GAME_HEIGHT;
            ctx.beginPath();
            ctx.arc(x, y, layer.size, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // (Removed) in-game bottom grid to avoid visual clutter during gameplay

    // Optional subtle scanlines only if enabled in settings but with very low alpha for gameplay
    if (settings.scanlines) {
        ctx.save();
        ctx.globalAlpha = 0.02;
        ctx.fillStyle = '#000';
        for (let y = 0; y < GAME_HEIGHT; y += 4) {
            ctx.fillRect(0, y, GAME_WIDTH, 1);
        }
        ctx.restore();
    }

    // No phase tinting — keep the base retro background (phase 1 look) for all phases to maximize visibility
}

function drawMapScreenEffects() {
    if (MAPS[currentMapIndex].hazard !== 'glitch' || totalFrames % 90 >= 4) return;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 65, 215, 0.07)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    const bandY = (totalFrames * 17) % GAME_HEIGHT;
    ctx.fillRect(0, bandY, GAME_WIDTH, 5);
    ctx.fillStyle = 'rgba(255, 65, 215, 0.3)';
    ctx.fillRect((totalFrames * 31) % (GAME_WIDTH - 220), bandY + 6, 220, 3);
    ctx.restore();
}

// NEW: Rich retro background for menus / end screens
function drawRetroMenuBackground() {
    // Base gradient
    const g = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    g.addColorStop(0, '#0b1020');
    g.addColorStop(0.35, '#101426');
    g.addColorStop(1, '#0b0712');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Large radial glow in the center-top to highlight title
    const rg = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT*0.22, 50, GAME_WIDTH/2, GAME_HEIGHT*0.22, GAME_WIDTH*0.9);
    rg.addColorStop(0, 'rgba(0,255,200,0.06)');
    rg.addColorStop(0.2, 'rgba(0,200,255,0.03)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Neon grid (horizontal + vertical) with perspective fade
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#00ffd6';
    ctx.lineWidth = 1;
    const gridSpacing = 48;
    for (let x = -GAME_WIDTH; x < GAME_WIDTH*2; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, GAME_HEIGHT*0.55);
        ctx.lineTo(x + GAME_WIDTH*0.2, GAME_HEIGHT);
        ctx.stroke();
    }
    for (let y = GAME_HEIGHT*0.55; y < GAME_HEIGHT; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y + (y - GAME_HEIGHT*0.55)*0.2);
        ctx.stroke();
    }
    ctx.restore();

    // Subtle stars behind the grid
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 120; i++) {
        const x = (i * 199 + Date.now() / 150) % GAME_WIDTH;
        const y = (i * 113 + Date.now() / 220) % Math.floor(GAME_HEIGHT*0.6);
        ctx.beginPath();
        ctx.arc(x, y, Math.random() < 0.9 ? 1 : 2, 0, Math.PI*2);
        ctx.fill();
    }

    // Scanlines option (thin horizontal lines) to strengthen retro feel
    if (settings.scanlines) {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#000';
        for (let y = 0; y < GAME_HEIGHT; y += 3) {
            ctx.fillRect(0, y, GAME_WIDTH, 1);
        }
        ctx.restore();
    }

    // Subtle vignette
    ctx.save();
    const vg = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH*0.1, GAME_WIDTH/2, GAME_HEIGHT/2, Math.max(GAME_WIDTH, GAME_HEIGHT));
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.6, 'rgba(0,0,0,0.12)');
    vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.restore();

    // Faint film grain / noise (low cost dots)
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * GAME_WIDTH;
        const y = Math.random() * GAME_HEIGHT;
        ctx.fillStyle = Math.random() > 0.5 ? 'white' : 'black';
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
}

function drawPlayerHealth() {
    const barX = 10;
    const barY = 100;
    const barWidth = 420;
    const barHeight = 30;
    const healthRatio = Math.max(0, Math.min(1, player.health / player.maxHealth));
    const healthColor = healthRatio <= 0.25 ? '#ff4040' :
        healthRatio <= 0.5 ? '#ffb52e' : '#39ff70';

    ctx.save();
    ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = healthColor;
    ctx.shadowBlur = 12;
    ctx.shadowColor = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillStyle = 'white';
    const label = `LIFE ${Math.ceil(player.health)} / ${player.maxHealth}`;
    ctx.strokeText(label, barX + barWidth / 2, barY + barHeight / 2);
    ctx.fillText(label, barX + barWidth / 2, barY + barHeight / 2);
    ctx.restore();
}

function drawPlayerPower() {
    const x = 10;
    const y = 154;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffd84d';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffd84d';
    const jet = JET_OPTIONS.find(option => option.id === player.jetId) || JET_OPTIONS[0];
    const planeName = PLANE_EVOLUTION_NAMES[player.powerLevel];
    ctx.fillText(`${jet.name} | ${planeName} ${player.powerLevel}/${MAX_PLAYER_POWER}`, x, y);
    ctx.shadowBlur = 0;

    for (let i = 0; i < MAX_PLAYER_POWER; i++) {
        const pipX = x + 250 + i * 26;
        ctx.fillStyle = i < player.powerLevel ? '#ffd84d' : 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(pipX, y - 7, 18, 14);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(pipX, y - 7, 18, 14);
    }
    const gunCount = getPlayerGunMounts().length;
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillStyle = '#9cfaff';
    ctx.fillText(`GUNS ${gunCount}`, x, y + 26);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    const progressText = player.powerLevel >= MAX_PLAYER_POWER
        ? 'MAX EVOLUTION'
        : `NEXT ${player.powerupCharge}/${player.powerupsForNextEvolution}`;
    ctx.fillText(progressText, x + 150, y + 26);
    ctx.restore();
}

function drawPowerupStatus() {
    const active = Object.entries(player.activePowerups)
        .filter(([, powerup]) => powerup.level > 0 && powerup.duration > 0)
        .map(([type, powerup]) =>
            `${SHARED_POWERUPS[type].label} ${powerup.level} (${Math.ceil(powerup.duration / TARGET_FPS)}s)`
        );
    if (player.specialPowerup.level > 0 && player.specialPowerup.duration > 0) {
        active.push(
            `${JET_SPECIALS[player.jetId].label} ${player.specialPowerup.level} (${Math.ceil(player.specialPowerup.duration / TARGET_FPS)}s)`
        );
    }
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillStyle = '#c6eaff';
    ctx.fillText(active.length ? active.join('  |  ') : 'POWER-UPS: NONE', 10, 214, GAME_WIDTH * 0.58);

    const barX = 10;
    const barY = GAME_HEIGHT - 42;
    const barWidth = 330;
    const chargeRatio = player.ultimateCharge / ULTIMATE_MAX_CHARGE;
    ctx.fillStyle = 'rgba(8, 15, 35, 0.9)';
    ctx.fillRect(barX, barY, barWidth, 20);
    ctx.fillStyle = chargeRatio >= 1 ? JET_SPECIALS[player.jetId].color : '#bd68ff';
    ctx.fillRect(barX, barY, barWidth * chargeRatio, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, 20);
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(
        chargeRatio >= 1 ? `${JET_SPECIALS[player.jetId].label} ULTIMATE READY [Q]` :
            `ULTIMATE [Q] ${Math.floor(player.ultimateCharge)}%`,
        barX,
        barY - 8
    );
    ctx.restore();
}

function drawHUD() {
    // Score (Top Left)
    ctx.fillStyle = 'gold'; // <--- MODIFIED: Changed color to 'gold'
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(score)}`, 10, 35); 
    
    // Time (Top Center, prominent yellow)
    if (gameState === 'playing') {
        const currentTime = Stats.totalTimeSeconds;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'yellow';
        ctx.fillStyle = 'yellow';
        ctx.fillText(`TIME: ${formatTime(currentTime)}`, GAME_WIDTH / 2, 35);
        ctx.shadowBlur = 0;
    }

    // Phase (Top Right)
    if (gameState === 'playing') {
        ctx.textAlign = 'right';
        ctx.font = '32px "Press Start 2P", monospace';
        ctx.fillStyle = gameStage === 'boss' ? enemy.color : MAPS[currentMapIndex].accent;
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.fillStyle;
        const stageText = gameStage === 'boss' ? `PHASE ${enemy.currentPhase}` :
            gameStage === 'bossIntro' ? 'BOSS INCOMING' :
                `WAVE ${waveNumber}/${CAMPAIGN_WAVE_COUNT}`;
        ctx.fillText(stageText, GAME_WIDTH - 10, 35);
        ctx.shadowBlur = 0;
    }

    drawPlayerHealth();
    drawPlayerPower();
    drawPowerupStatus();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '17px "Press Start 2P", monospace';
    ctx.fillStyle = MAPS[currentMapIndex].accent;
    ctx.fillText(`${MAPS[currentMapIndex].name}  |  LOOP ${loopNumber}`, GAME_WIDTH / 2, 88);
    ctx.restore();

    if (gameStage === 'minions' || gameStage === 'betweenWaves') {
        ctx.save();
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = gameStage === 'betweenWaves' ? '#a6ffb1' : MAPS[currentMapIndex].accent;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillText(gameStage === 'betweenWaves'
            ? `WAVE CLEARED - BREAK ${Math.ceil(waveBreakFrames / TARGET_FPS)}s`
            : `WAVE ${waveNumber}/${CAMPAIGN_WAVE_COUNT}  |  ENEMIES ${waveSpawnedCount}/${waveSpawnQuota}`,
        GAME_WIDTH / 2, 130);
        ctx.font = '15px "Press Start 2P", monospace';
        ctx.fillStyle = '#e4ecff';
        ctx.fillText(`${DIFFICULTIES[difficultyKey].label}  |  ${getUnlockedMinionTypes().map(type => MINION_TYPES[type].label).join(' / ')}`,
            GAME_WIDTH / 2, 158);
        ctx.restore();
    } else if (gameStage === 'boss') {
        ctx.save();
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = MAPS[currentMapIndex].accent;
        ctx.fillText(`WAVE 10/${CAMPAIGN_WAVE_COUNT}  |  SECTOR BOSS`, GAME_WIDTH / 2, 130);
        ctx.restore();
    } else if (gameStage === 'bossIntro') {
        ctx.save();
        ctx.font = '42px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff7777';
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'red';
        ctx.fillText('BOSS INCOMING!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.restore();
    }
    
    // Cooldowns (Bottom Right)
    ctx.textAlign = 'right';
    
    // Fire Status 
    const fireStatusY = GAME_HEIGHT - 90; 
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillStyle = isFiring ? 'lime' : 'grey';
    ctx.shadowBlur = isFiring ? 8 : 0;
    ctx.shadowColor = 'lime';
    ctx.fillText(`FIRE: ${isFiring ? 'AUTO' : 'OFF'} [Y]`, GAME_WIDTH - 10, fireStatusY); 
    ctx.shadowBlur = 0;
    
    drawMinimap();
}

function drawBossHealthBar() {
    if (gameStage !== 'boss') return;

    const barWidth = GAME_WIDTH * 0.8; 
    const barHeight = 20;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = 60;

    const healthPercentage = enemy.health / enemy.maxHealth;
    const currentWidth = barWidth * healthPercentage;

    ctx.fillStyle = 'rgba(50, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = enemy.color; 
    ctx.fillRect(barX, barY, currentWidth, barHeight);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    const phase2_pos = barX + barWidth / 3;
    const phase3_pos = barX + barWidth * 2 / 3;
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(phase2_pos, barY);
    ctx.lineTo(phase2_pos, barY + barHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(phase3_pos, barY);
    ctx.lineTo(phase3_pos, barY + barHeight);
    ctx.stroke();

    // Draw the label and HP text INSIDE the health bar, centered vertically
    const innerText = `SPHERE ${Math.floor(enemy.health / SCALE_FACTOR)} / ${enemy.maxHealth / SCALE_FACTOR}`;
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textX = GAME_WIDTH / 2;
    const textY = barY + barHeight / 2;
    // Draw outlined text so it remains visible regardless of bar fill color
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.fillStyle = 'white';
    ctx.strokeText(innerText, textX, textY);
    ctx.fillText(innerText, textX, textY);
    ctx.restore();
}

function drawStatsGraph(result) {
    const boxW = 800;
    const boxH = 500;
    const boxX = GAME_WIDTH / 2 - boxW / 2; 
    const boxY = GAME_HEIGHT / 2 - 150; // Shifted up to make room for the new button
    
    const borderColor = result === 'WIN' ? 'lime' : 'red';

    ctx.fillStyle = 'rgba(5, 5, 20, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    
    let currentY = boxY + 50;
    const indent = boxX + 40;
    const valueIndent = boxX + 500;

    // Title
    ctx.font = '42px "Press Start 2P", monospace';
    ctx.fillStyle = borderColor;
    ctx.textAlign = 'left';
    ctx.fillText(` MISSION REPORT [${result}] `, indent, currentY);
    currentY += 70;

    ctx.font = '20px "Press Start 2P", monospace';
    
    // Time Taken
    ctx.fillStyle = 'white';
    ctx.fillText(`TIME ELAPSED:`, indent, currentY);
    ctx.fillStyle = 'yellow';
    ctx.fillText(`${formatTime(Stats.totalTimeSeconds)}`, valueIndent, currentY);
    currentY += 40;
    
    // Hits Taken and Penalty
    const hitPenalty = Stats.playerHitsTaken * SCORE_HIT_PENALTY;
    ctx.fillStyle = 'white';
    ctx.fillText(`PLAYER HITS:`, indent, currentY);
    ctx.fillStyle = Stats.playerHitsTaken > 0 ? 'red' : 'lime';
    ctx.fillText(`${Stats.playerHitsTaken} HIT(S) | (${hitPenalty})`, valueIndent, currentY); 
    currentY += 40;

    // Boss Hits Breakdown
    const bulletScore = Stats.bossHits.bullet * BASE_SCORE_BULLET;
    // Bullet Hits
    ctx.fillStyle = 'cyan';
    ctx.fillText(`BULLET HITS:`, indent, currentY);
    ctx.fillStyle = 'white';
    ctx.fillText(`${Stats.bossHits.bullet} HIT(S) | +${bulletScore}`, valueIndent, currentY); 
    currentY += 50;
    
    // Time Bonus Display Logic (Only for Win Screen)
    if (result === 'WIN') {
        const secondsElapsed = Math.floor(Stats.totalTimeSeconds);
        const bonusLost = secondsElapsed * TIME_BONUS_DECREMENT_PER_SECOND;
        const timeBonus = Math.max(0, TIME_BONUS_START - bonusLost);
        const defeatBonus = SCORE_DEFEAT_BONUS;

    ctx.font = '32px "Press Start 2P", monospace';
        ctx.fillStyle = 'gold';
        ctx.fillText(`TIME BONUS:`, indent, currentY);
        ctx.fillText(`+ ${timeBonus}`, valueIndent, currentY);
        currentY += 40;

        ctx.fillStyle = 'lime';
        ctx.fillText(`BOSS DEFEAT BONUS:`, indent, currentY);
        ctx.fillText(`+ ${defeatBonus}`, valueIndent, currentY);
        currentY += 60;
    }


    // FINAL SCORE 
    ctx.font = '50px "Press Start 2P", monospace';
    ctx.fillStyle = 'lime';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'lime';
    ctx.fillText(`TOTAL SCORE: ${Math.floor(score)}`, GAME_WIDTH / 2, boxY + boxH - 20);
    ctx.shadowBlur = 0;
}

// NEW: Helper function to draw a standardized retro button
function drawRetroButton(text, x, y, width, height, color, glow) {
    // Determine hover state by comparing the global keys set by the draw caller and by mousemove
    const isHovered = currentDrawButtonKey && hoveredButtonKey === currentDrawButtonKey;
    const isSelected = currentDrawButtonKey && selectedMenuButtonKey === currentDrawButtonKey;

    // Apply a stronger glow and border when hovered
    const appliedGlow = isHovered || isSelected ? Math.max(glow * 1.6, glow + 10) : glow;
    const strokeW = isHovered || isSelected ? 6 : 4;
    const scale = isHovered ? 1.03 : 1.0; // slight scale up when hovered

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const drawW = width * scale;
    const drawH = height * scale;
    const drawX = centerX - drawW / 2;
    const drawY = centerY - drawH / 2;

    // Outer shadow/glow
    ctx.shadowBlur = appliedGlow;
    ctx.shadowColor = color;

    // Button border
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeW;
    ctx.strokeRect(drawX, drawY, drawW, drawH);

    // Button fill (dark, semi-transparent). If hovered, tint the fill slightly lighter
    if (isHovered || isSelected) {
        ctx.fillStyle = `rgba(10, 10, 10, 0.65)`;
    } else {
        ctx.fillStyle = `rgba(0, 0, 0, 0.5)`;
    }
    ctx.fillRect(drawX, drawY, drawW, drawH);

    // Button text
    ctx.fillStyle = color;
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    // Center text vertically in button
    ctx.textBaseline = 'middle';
    ctx.fillText(text, drawX + drawW / 2, drawY + drawH / 2);

    ctx.shadowBlur = 0; // Reset shadow for other drawings
}

function drawJetPreview(jet, centerX, centerY) {
    ctx.save();
    const time = Date.now() / 1000;
    const bob = Math.sin(time * 2.2 + JET_OPTIONS.findIndex(option => option.id === jet.id)) * 7;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3.5);
    ctx.translate(centerX, centerY);
    ctx.translate(0, bob);

    ctx.globalAlpha = 0.2 + pulse * 0.12;
    ctx.fillStyle = jet.color;
    ctx.shadowBlur = 34;
    ctx.shadowColor = jet.color;
    ctx.beginPath();
    ctx.ellipse(0, 28, 88 + pulse * 8, 25 + pulse * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.strokeStyle = jet.color;
    ctx.globalAlpha = 0.38 + pulse * 0.2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 142 + pulse * 6, 125 + pulse * 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.scale(6.2, 6.2);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = jet.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = jet.color;
    ctx.fillStyle = 'rgba(10, 18, 39, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-8, 12);
    ctx.lineTo(0, 8);
    ctx.lineTo(8, 12);
    ctx.lineTo(6, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    if (jet.shape === 'delta') {
        ctx.moveTo(-5, -6);
        ctx.lineTo(-25, 17);
        ctx.lineTo(-8, 11);
        ctx.moveTo(5, -6);
        ctx.lineTo(25, 17);
        ctx.lineTo(8, 11);
    } else if (jet.shape === 'twin') {
        ctx.moveTo(-5, -3);
        ctx.lineTo(-24, 1);
        ctx.lineTo(-21, 15);
        ctx.lineTo(-7, 11);
        ctx.moveTo(5, -3);
        ctx.lineTo(24, 1);
        ctx.lineTo(21, 15);
        ctx.lineTo(7, 11);
        ctx.moveTo(-4, 8);
        ctx.lineTo(-12, 22);
        ctx.lineTo(-2, 17);
        ctx.moveTo(4, 8);
        ctx.lineTo(12, 22);
        ctx.lineTo(2, 17);
    } else if (jet.shape === 'stealth') {
        ctx.moveTo(-5, -5);
        ctx.lineTo(-32, 14);
        ctx.lineTo(-20, 22);
        ctx.lineTo(-5, 13);
        ctx.moveTo(5, -5);
        ctx.lineTo(32, 14);
        ctx.lineTo(20, 22);
        ctx.lineTo(5, 13);
    } else {
        ctx.moveTo(-5, -5);
        ctx.lineTo(-26, -15);
        ctx.lineTo(-24, 3);
        ctx.lineTo(-7, 13);
        ctx.moveTo(5, -5);
        ctx.lineTo(26, -15);
        ctx.lineTo(24, 3);
        ctx.lineTo(7, 13);
    }
    ctx.stroke();

    if (jet.startingGuns === 2) {
        ctx.beginPath();
        ctx.moveTo(-3, -18);
        ctx.lineTo(-3, -31);
        ctx.moveTo(3, -18);
        ctx.lineTo(3, -31);
        ctx.stroke();
    }

    ctx.globalAlpha = 0.65 + pulse * 0.3;
    ctx.fillStyle = '#fff2a1';
    const engineX = jet.startingGuns === 2 ? [-3, 3] : [-2, 2];
    engineX.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x - 1.5, 14);
        ctx.lineTo(x + 1.5, 14);
        ctx.lineTo(x, 22 + pulse * 7);
        ctx.closePath();
        ctx.fill();
    });
    ctx.restore();
}

function drawWrappedText(text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(candidate).width > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }
    if (line) lines.push(line);
    const visibleLines = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
        const last = visibleLines[maxLines - 1];
        visibleLines[maxLines - 1] = `${last.replace(/[.,;:!?]?$/, '')}...`;
    }
    visibleLines.forEach((textLine, index) => {
        ctx.fillText(textLine, x, y + index * lineHeight);
    });
    return visibleLines.length;
}

function drawJetSelectionMenu() {
    const time = Date.now() / 1000;
    const sweepX = (time * 420) % (GAME_WIDTH + 300) - 150;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#39eaff';
    ctx.fillStyle = '#eafaff';
    ctx.font = 'bold 24px "Press Start 2P", monospace';
    ctx.fillText('CHOOSE YOUR JET', GAME_WIDTH / 2, 92);
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#27ecff';
    ctx.font = '60px "Press Start 2P", monospace';
    ctx.fillText('SELECT YOUR AIRCRAFT', GAME_WIDTH / 2, 166);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(150, 220, 255, 0.86)';
    ctx.font = '22px sans-serif';
    ctx.fillText('Each jet brings a different flight style and a unique special ability.', GAME_WIDTH / 2, 205);

    ctx.save();
    ctx.beginPath();
    ctx.rect(100, 218, GAME_WIDTH - 200, 2);
    ctx.clip();
    const divider = ctx.createLinearGradient(sweepX - 180, 0, sweepX + 180, 0);
    divider.addColorStop(0, 'rgba(39, 236, 255, 0)');
    divider.addColorStop(0.5, 'rgba(39, 236, 255, 0.95)');
    divider.addColorStop(1, 'rgba(39, 236, 255, 0)');
    ctx.fillStyle = 'rgba(90, 160, 200, 0.22)';
    ctx.fillRect(100, 218, GAME_WIDTH - 200, 2);
    ctx.fillStyle = divider;
    ctx.fillRect(sweepX - 180, 217, 360, 4);
    ctx.restore();

    const margin = 95;
    const gap = 28;
    const cardWidth = (GAME_WIDTH - margin * 2 - gap * 3) / 4;
    const cardY = 250;
    const cardHeight = 730;
    JET_OPTIONS.forEach((jet, index) => {
        const x = margin + index * (cardWidth + gap);
        const centerX = x + cardWidth / 2;
        const buttonKey = `jet-${jet.id}`;
        const isSelected = selectedJetId === jet.id;
        const isHovered = hoveredButtonKey === buttonKey;
        const pulse = 0.5 + 0.5 * Math.sin(time * 3 + index * 0.8);
        const cardGradient = ctx.createLinearGradient(x, cardY, x, cardY + cardHeight);
        cardGradient.addColorStop(0, isSelected ? 'rgba(15, 35, 62, 0.97)' : 'rgba(8, 14, 31, 0.96)');
        cardGradient.addColorStop(1, 'rgba(5, 10, 24, 0.97)');

        ctx.save();
        ctx.shadowBlur = isSelected ? 22 + pulse * 14 : isHovered ? 14 : 0;
        ctx.shadowColor = jet.color;
        ctx.fillStyle = cardGradient;
        ctx.strokeStyle = isSelected || isHovered ? jet.color : 'rgba(125, 150, 195, 0.48)';
        ctx.lineWidth = isSelected ? 5 : isHovered ? 3 : 2;
        ctx.fillRect(x, cardY, cardWidth, cardHeight);
        ctx.strokeRect(x, cardY, cardWidth, cardHeight);
        ctx.shadowBlur = 0;

        const previewX = x + 22;
        const previewY = cardY + 22;
        const previewW = cardWidth - 44;
        const previewH = 340;
        ctx.fillStyle = 'rgba(5, 14, 32, 0.96)';
        ctx.fillRect(previewX, previewY, previewW, previewH);
        ctx.strokeStyle = `rgba(130, 180, 220, ${isSelected ? 0.5 : 0.24})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(previewX, previewY, previewW, previewH);
        ctx.save();
        ctx.beginPath();
        ctx.rect(previewX, previewY, previewW, previewH);
        ctx.clip();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = jet.color;
        ctx.lineWidth = 1;
        for (let line = 0; line < 5; line++) {
            const y = previewY + 42 + line * 66 + Math.sin(time * 1.5 + line) * 5;
            ctx.beginPath();
            ctx.moveTo(previewX + 10, y);
            ctx.lineTo(previewX + previewW - 10, y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        drawJetPreview(jet, centerX, previewY + previewH / 2);
        ctx.restore();

        ctx.textAlign = 'center';
        ctx.fillStyle = jet.color;
        ctx.shadowBlur = isSelected ? 12 + pulse * 8 : 5;
        ctx.shadowColor = jet.color;
        ctx.font = 'bold 23px "Press Start 2P", monospace';
        ctx.fillText(jet.name, centerX, cardY + 405, cardWidth - 30);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#c6d8f1';
        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillText(jet.subtitle, centerX, cardY + 443, cardWidth - 34);

        ctx.fillStyle = '#eff5ff';
        ctx.font = '22px sans-serif';
        drawWrappedText(jet.description, centerX, cardY + 492, cardWidth - 64, 30, 2);

        ctx.fillStyle = '#ffe072';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(jet.perk, centerX, cardY + 565, cardWidth - 42);

        const special = JET_SPECIALS[jet.id];
        ctx.fillStyle = jet.color;
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText(`SPECIAL: ${special.label}`, centerX, cardY + 616, cardWidth - 42);
        ctx.fillStyle = '#d6e6fa';
        ctx.font = '19px sans-serif';
        ctx.fillText(special.description, centerX, cardY + 646, cardWidth - 42);
        ctx.restore();

        currentDrawButtonKey = buttonKey;
        drawRetroButton(
            isSelected ? 'SELECTED - CONTINUE' : 'CHOOSE THIS JET',
            x + 28,
            cardY + 670,
            cardWidth - 56,
            46,
            jet.color,
            isSelected ? 18 : 10
        );
        currentDrawButtonKey = null;
        menuButtons[buttonKey] = {
            x,
            y: cardY,
            w: cardWidth,
            h: cardHeight,
            label: `${jet.name}, ${jet.perk}`,
        };
    });

    const backW = 220;
    const backH = 54;
    const backX = GAME_WIDTH / 2 - backW / 2;
    const backY = 1050;
    currentDrawButtonKey = 'jetBack';
    drawRetroButton('BACK', backX, backY, backW, backH, 'red', 12);
    currentDrawButtonKey = null;
    menuButtons.jetBack = { x: backX, y: backY, w: backW, h: backH, label: 'Back to main menu' };
    ctx.restore();
}

// REPLACED: Updated drawMenu to handle main/howToPlay states
function drawMenu() {
    menuButtons = {};
    if (menuState === 'main') {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        drawRetroMenuBackground();
    }

    if (menuState === 'jetSelect') {
        drawJetSelectionMenu();
        return;
    }

    ctx.font = '72px "Press Start 2P", monospace';
    ctx.fillStyle = 'cyan';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'cyan';
    ctx.fillText('VECTOR BULLET PROJECT', GAME_WIDTH / 2, GAME_HEIGHT / 4 - 30);
    ctx.fillText('V.01', GAME_WIDTH / 2, GAME_HEIGHT / 4 + 50);
    ctx.shadowBlur = 0;
    
    if (menuState === 'main') {
        const buttonW = 400;
        const buttonH = 80;
        const startY = GAME_HEIGHT / 2 + 50;
        const centerX = GAME_WIDTH / 2 - buttonW / 2;

    // START GAME Button
    const startX = centerX;
    const startY_btn = startY;
    currentDrawButtonKey = 'start';
    drawRetroButton('START GAME', startX, startY_btn, buttonW, buttonH, 'lime', 20);
    currentDrawButtonKey = null;

    // HOW TO PLAY Button
    const controlsY_btn = startY_btn + buttonH + 40;
    currentDrawButtonKey = 'howToPlay';
    drawRetroButton('HOW TO PLAY', startX, controlsY_btn, buttonW, buttonH, 'yellow', 20);
    currentDrawButtonKey = null;

        // Save button coordinates for click detection
        menuButtons = {
            'start': { x: startX, y: startY_btn, w: buttonW, h: buttonH, label: 'Start game' },
            'howToPlay': { x: startX, y: controlsY_btn, w: buttonW, h: buttonH, label: 'How to play' }
        };

    } else if (menuState === 'levelSelect') {
        const buttonW = 540;
        const buttonH = 62;
        const centerX = GAME_WIDTH / 2 - buttonW / 2;
        const selectedMap = MAPS[Math.min(checkpointMapIndex, MAPS.length - 1)];
        const selectedJet = JET_OPTIONS.find(option => option.id === selectedJetId) || JET_OPTIONS[0];
        ctx.textAlign = 'center';
        ctx.font = '19px "Press Start 2P", monospace';
        ctx.fillStyle = selectedJet.color;
        ctx.fillText(`JET: ${selectedJet.name}`, GAME_WIDTH / 2, 355);
        ctx.font = '17px "Press Start 2P", monospace';
        ctx.fillStyle = selectedMap.accent;
        ctx.fillText(`CONTINUE POINT: ${selectedMap.name}`, GAME_WIDTH / 2, 397);
        ctx.font = '15px "Press Start 2P", monospace';
        ctx.fillStyle = '#d8e8ff';
        ctx.fillText('10 WAVES PER SECTOR - CLEAR THE BOSS TO ADVANCE', GAME_WIDTH / 2, 434);

        const difficultyY = 465;
        currentDrawButtonKey = 'difficulty';
        drawRetroButton(`DIFFICULTY: ${DIFFICULTIES[difficultyKey].label}  [CHANGE]`,
            centerX, difficultyY, buttonW, buttonH, '#b58cff', 15);
        currentDrawButtonKey = null;
        menuButtons.difficulty = {
            x: centerX, y: difficultyY, w: buttonW, h: buttonH,
            label: `Difficulty ${DIFFICULTIES[difficultyKey].label}`,
        };

        const startY = 550;
        currentDrawButtonKey = 'startCampaign';
        drawRetroButton('NEW CAMPAIGN - NEON SKY', centerX, startY, buttonW, buttonH, 'cyan', 15);
        currentDrawButtonKey = null;
        menuButtons.startCampaign = {
            x: centerX, y: startY, w: buttonW, h: buttonH,
            label: 'Start a new campaign at Neon Sky',
        };

        if (checkpointMapIndex > 0 || loopNumber > 1) {
            const continueY = startY + buttonH + 18;
            currentDrawButtonKey = 'continueCampaign';
            drawRetroButton(`CONTINUE - ${selectedMap.name} (LOOP ${loopNumber})`,
                centerX, continueY, buttonW, buttonH, 'lime', 13);
            currentDrawButtonKey = null;
            menuButtons.continueCampaign = {
                x: centerX, y: continueY, w: buttonW, h: buttonH,
                label: `Continue from ${selectedMap.name}, Loop ${loopNumber}`,
            };
        }

        const backY = checkpointMapIndex > 0 || loopNumber > 1
            ? startY + buttonH * 2 + 35
            : startY + buttonH + 25;
        currentDrawButtonKey = 'back';
        drawRetroButton('BACK', GAME_WIDTH / 2 - 110, backY, 220, 54, 'red', 12);
        currentDrawButtonKey = null;
        menuButtons.back = {
            x: GAME_WIDTH / 2 - 110, y: backY, w: 220, h: 54,
            label: 'Back to jet selection',
        };

    } else if (menuState === 'howToPlay') {
        const infoW = 1200;
        const infoH = 800;
        const infoX = GAME_WIDTH / 2 - infoW / 2;
        const infoY = GAME_HEIGHT / 2 - 300;
        const padding = 50;
        let textY = infoY + 50;

        // Draw Info Box
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'magenta';
        ctx.strokeStyle = 'magenta';
        ctx.lineWidth = 5;
        ctx.strokeRect(infoX, infoY, infoW, infoH);
        ctx.fillStyle = 'rgba(20, 0, 20, 0.8)';
        ctx.fillRect(infoX, infoY, infoW, infoH);
        ctx.shadowBlur = 0;
        
        ctx.textAlign = 'left';
        
    ctx.font = '32px "Press Start 2P", monospace';
        ctx.fillStyle = 'magenta';
        ctx.fillText('// OBJECTIVE: CLEAR THE FIVE SECTORS //', infoX + padding, textY);
        textY += 60;
        
    ctx.font = '20px "Press Start 2P", monospace';
        ctx.fillStyle = 'white';
        ctx.fillText('Clear ten enemy waves and defeat each sector boss to advance.', infoX + padding, textY);
        textY += 60;

    ctx.font = '32px "Press Start 2P", monospace';
        ctx.fillStyle = 'cyan';
        ctx.fillText('// CONTROLS //', infoX + padding, textY);
        textY += 50;

    ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = 'yellow';
        ctx.fillText('> WASD: MOVE | MOUSE: AIM AND SHOOT | CAMERA FOLLOWS YOU', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> TEN WAVES PER SECTOR; CLEAR ALL ENEMIES TO ADVANCE', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> REST AND COLLECT A HEALTH PICKUP BETWEEN WAVES', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> NEON SKY, ASTEROID BELT, STORM ZONE, GLITCH SECTOR, THE CORE', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> METEORS, LIGHTNING, TELEPORTING ENEMIES, THEN ALL ENEMY TYPES', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> DIFFICULTY CONTROLS SPAWNS: 0.75x / 1x / 1.3x / 1.6x', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> Y: Toggle Auto-Fire (Your standard weapon)', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> CHOOSE ONE OF FOUR JETS; EACH HAS A UNIQUE COMBAT PERK', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> POWER-UPS: SPREAD SHOT, SHIELD RING, TIME SLOW, HOMING, SHOCKWAVE', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> DUPLICATES STRENGTHEN POWER-UPS; TAKING DAMAGE WEAKENS THEM', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> JET SPECIALS ARE UNIQUE; DEFEAT ENEMIES TO CHARGE YOUR Q ULTIMATE', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'lime';
        ctx.fillText('> P: Pause/Resume', infoX + padding, textY);
        textY += 35;
        ctx.fillStyle = 'white';
        ctx.fillText('> M: SOUND | MOBILE TOUCH CONTROLS | CONTINUE SAVES LAST SECTOR', infoX + padding, textY);

        // Draw BACK button
        const buttonW = 200;
        const buttonH = 50;
        const backX = GAME_WIDTH / 2 - buttonW / 2;
        const backY = infoY + infoH + 50;
    currentDrawButtonKey = 'back';
    drawRetroButton('BACK', backX, backY, buttonW, buttonH, 'red', 15);
    currentDrawButtonKey = null;
        // Store button for click detection
        menuButtons.back = { x: backX, y: backY, w: buttonW, h: buttonH, label: 'Back' };
    }
    // ...existing code...
}


function drawGameOver() {
    menuButtons = {};
    // Rich retro background on game over screen
    drawRetroMenuBackground();

    // Large Pulsing "Terminated" Text
    const redPulse = 0.5 + 0.5 * Math.sin(Date.now() / 150); 
    ctx.font = '80px "Press Start 2P", monospace';
    ctx.fillStyle = `rgba(255, 0, 0, ${redPulse})`;
    ctx.textAlign = 'center';
    ctx.shadowBlur = 40;
    ctx.shadowColor = 'red';
    ctx.fillText('TERMINATED', GAME_WIDTH / 2, GAME_HEIGHT / 4 - 30);
    ctx.shadowBlur = 0;

    drawStatsGraph('LOSS');

    // <--- MODIFIED: Added RETRY button and changed button layout --->
    const buttonW = 250;
    const buttonH = 60;
    const spacing = 40;
    const totalWidth = (buttonW * 2) + spacing;
    const startX = GAME_WIDTH / 2 - totalWidth / 2;
    const buttonY = GAME_HEIGHT - 100;
    
    // RETRY Button (Cyan color)
    const retryX = startX;
    currentDrawButtonKey = 'retry';
    drawRetroButton('RETRY [SPACE]', retryX, buttonY, buttonW, buttonH, 'cyan', 15);
    currentDrawButtonKey = null;
    menuButtons.retry = { x: retryX, y: buttonY, w: buttonW, h: buttonH, action: 'retry', label: 'Retry' };

    // Back to Menu Button (Red color)
    const menuX = startX + buttonW + spacing;
    // Make BACK TO MENU wider to fit text
    const menuButtonW = 320;
    currentDrawButtonKey = 'menu';
    drawRetroButton('BACK TO MENU', menuX, buttonY, menuButtonW, buttonH, 'red', 15);
    currentDrawButtonKey = null;
    menuButtons.menu = { x: menuX, y: buttonY, w: menuButtonW, h: buttonH, action: 'menu', label: 'Back to menu' };
}

function drawWinScreen() {
    menuButtons = {};
    // Rich retro background on victory screen
    drawRetroMenuBackground();

    // Large Gold "Boss Defeated" Text
    ctx.font = '72px "Press Start 2P", monospace';
    ctx.fillStyle = 'gold';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 35;
    ctx.shadowColor = 'gold';
    ctx.fillText('BOSS DEFEATED!', GAME_WIDTH / 2, GAME_HEIGHT / 4 - 30);
    ctx.shadowBlur = 0;

    drawStatsGraph('WIN');

    // <--- MODIFIED: Added RETRY button and changed button layout --->
    const buttonW = 250;
    const buttonH = 60;
    const spacing = 40;
    const totalWidth = (buttonW * 2) + spacing;
    const startX = GAME_WIDTH / 2 - totalWidth / 2;
    const buttonY = GAME_HEIGHT - 100;
    
    // RETRY Button (Cyan color)
    const retryX = startX;
    currentDrawButtonKey = 'retry';
    drawRetroButton('RETRY [SPACE]', retryX, buttonY, buttonW, buttonH, 'cyan', 15);
    currentDrawButtonKey = null;
    menuButtons.retry = { x: retryX, y: buttonY, w: buttonW, h: buttonH, action: 'retry', label: 'Retry' };

    // Back to Menu Button (Lime color)
    const menuX = startX + buttonW + spacing;
    // Make BACK TO MENU wider to fit text
    const menuButtonW = 320;
    currentDrawButtonKey = 'menu';
    drawRetroButton('BACK TO MENU', menuX, buttonY, menuButtonW, buttonH, 'lime', 15);
    currentDrawButtonKey = null;
    menuButtons.menu = { x: menuX, y: buttonY, w: menuButtonW, h: buttonH, action: 'menu', label: 'Back to menu' };
}

function drawSectorCleared() {
    menuButtons = {};
    drawRetroMenuBackground();
    const map = MAPS[currentMapIndex];
    const finalSector = currentMapIndex === MAPS.length - 1;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = map.accent;
    ctx.shadowBlur = 32;
    ctx.shadowColor = map.accent;
    ctx.font = '68px "Press Start 2P", monospace';
    ctx.fillText('SECTOR CLEARED!', GAME_WIDTH / 2, 300);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.fillText(map.name, GAME_WIDTH / 2, 370);
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffe477';
    ctx.fillText(`SCORE: ${Math.floor(score)}`, GAME_WIDTH / 2, 445);
    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillStyle = '#cce8ff';
    ctx.fillText(finalSector
        ? `LOOP ${loopNumber} COMPLETE - LOOP ${loopNumber + 1} STARTING IN ${Math.ceil(loopRestartFrames / TARGET_FPS)}s`
        : `NEXT SECTOR: ${MAPS[currentMapIndex + 1].name}`,
    GAME_WIDTH / 2, 510);
    ctx.fillStyle = '#a6ffb1';
    ctx.fillText(finalSector
        ? 'ENEMIES WILL BE 1.5x MORE NUMEROUS, STRONGER, AND FASTER'
        : sectorUpgradeAwarded
            ? `PERMANENT UPGRADE UNLOCKED: +5 MAX HP  |  TOTAL UPGRADES: ${campaignProgress.upgrades}`
            : 'CHECKPOINT SAVED - CONTINUE FROM THE NEXT SECTOR',
    GAME_WIDTH / 2, 560);
    ctx.restore();

    const buttonW = 550;
    const buttonH = 72;
    const buttonX = GAME_WIDTH / 2 - buttonW / 2;
    const buttonY = 665;
    currentDrawButtonKey = 'nextSector';
    drawRetroButton(finalSector ? `START LOOP ${loopNumber + 1}` : 'CONTINUE TO NEXT SECTOR',
        buttonX, buttonY, buttonW, buttonH, map.accent, 15);
    currentDrawButtonKey = null;
    menuButtons.nextSector = {
        x: buttonX, y: buttonY, w: buttonW, h: buttonH,
        label: finalSector ? `Start Loop ${loopNumber + 1}` : `Continue to ${MAPS[currentMapIndex + 1].name}`,
    };

    const menuY = buttonY + buttonH + 24;
    currentDrawButtonKey = 'menu';
    drawRetroButton('BACK TO MENU', GAME_WIDTH / 2 - 160, menuY, 320, 54, '#9ba9bc', 12);
    currentDrawButtonKey = null;
    menuButtons.menu = {
        x: GAME_WIDTH / 2 - 160, y: menuY, w: 320, h: 54,
        label: 'Back to menu',
    };
}

// NEW: Overlay for pause menu
function drawPauseMenu() {
    menuButtons = {};
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#222';
    ctx.fillRect(GAME_WIDTH/2-400, GAME_HEIGHT/2-200, 800, 400);
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 8;
    ctx.strokeRect(GAME_WIDTH/2-400, GAME_HEIGHT/2-200, 800, 400);
    ctx.font = '64px "Press Start 2P", monospace';
    ctx.fillStyle = 'cyan';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', GAME_WIDTH/2, GAME_HEIGHT/2-40);
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.fillStyle = 'yellow';
    ctx.fillText(`P or ESC to resume | M sound: ${settings.sound ? 'ON' : 'OFF'}`, GAME_WIDTH/2, GAME_HEIGHT/2+80);
    // Draw BACK TO MENU button
    const buttonW = 320;
    const buttonH = 70;
    const buttonX = GAME_WIDTH/2 - buttonW/2;
    const buttonY = GAME_HEIGHT/2 + 120;
    currentDrawButtonKey = 'pauseBack';
    drawRetroButton('BACK TO MENU', buttonX, buttonY, buttonW, buttonH, 'red', 15);
    currentDrawButtonKey = null;
    // Store button for click detection
    menuButtons.pauseBack = { x: buttonX, y: buttonY, w: buttonW, h: buttonH, label: 'Back to menu' };
    ctx.restore();
}

// --- 5. MAIN GAME LOOP ---
function gameLoop(currentTime) {
    if (!lastTime) {
        lastTime = currentTime;
    }
    accruedTime += currentTime - lastTime;
    lastTime = currentTime;
    if (accruedTime > 1000) {
        accruedTime = TIME_PER_TICK;
    }
    tick = 0;
    if (!isPaused) {
        while (accruedTime >= TIME_PER_TICK) {
            if (gameState === 'playing') {
                totalFrames++;
                player.update();
                updateCamera();
                updatePlayerAim();
                const slowDivisor = getWorldSlowDivisor();
                worldSlowCounter++;
                const advanceWorld = worldSlowCounter % slowDivisor === 0;
                enemyBullets.forEach(b => {
                    b.previousX = b.x;
                    b.previousY = b.y;
                });
                if (advanceWorld) {
                    updateMinionWave();
                    if (gameStage === 'boss') enemy.update();
                    minions.forEach(minion => minion.update());
                    meteors.forEach(meteor => meteor.update());
                    enemyBullets.forEach(b => b.update());
                    bigOrbs.forEach(orb => orb.update());
                    strikeLines.forEach(line => line.update());
                    mines.forEach(mine => mine.update());
                    laserArms.forEach(laserArm => laserArm.update());
                }
                handlePlayerFire();
                playerBullets.forEach(b => b.update());
                powerMissiles.forEach(missile => missile.update());
                pickups.forEach(p => p.update());
                effects.forEach(e => e.update());
                checkCollisions();
                cleanupObjects();
            } else if (gameState === 'sectorClear' &&
                currentMapIndex === MAPS.length - 1 && loopRestartFrames > 0) {
                loopRestartFrames--;
                if (loopRestartFrames <= 0) {
                    startNextSector();
                    gameState = 'playing';
                }
            }
            accruedTime -= TIME_PER_TICK;
            tick++;
            if (tick > 5) break;
        }
        // Update score live during gameplay
        if (gameState === 'playing') {
            score = Stats.calculateFinalScore();
        }
    }
    // --- Drawing Logic ---
    drawBackground();
        if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'playing') {
        ctx.save();
        ctx.translate(-cameraX, -cameraY);
        drawArena();
        player.draw();
        if (gameStage === 'boss') enemy.draw();
        else minions.forEach(minion => minion.draw());
        meteors.forEach(meteor => meteor.draw());
        strikeLines.forEach(s => s.draw());
        mines.forEach(m => m.draw());
        laserArms.forEach(l => l.draw());
        enemyBullets.forEach(b => b.draw());
        playerBullets.forEach(b => b.draw());
        powerMissiles.forEach(missile => missile.draw());
        pickups.forEach(p => p.draw());
        effects.forEach(e => e.draw());
        ctx.restore();
        drawBossHealthBar();
        drawHUD();
        drawMapScreenEffects();
        if (isPaused) drawPauseMenu();
    } else if (gameState === 'gameOver') {
        drawGameOver();
    } else if (gameState === 'sectorClear') {
        drawSectorCleared();
    } else if (gameState === 'win') {
        drawWinScreen();
    }
    updateControlVisibility();
    updateHomeVideo();
    updateSoundButton();
    updateActionButtonLabels();
    updateAnnouncement();
    requestAnimationFrame(gameLoop);
}

// --- 6. INPUT EVENT LISTENERS ---
function togglePause() {
    if (gameState !== 'playing') return;
    isPaused = !isPaused;
    if (isPaused) clearTouchMovement();
}

function activateMenuButton(key) {
    if (!menuButtons[key]) return;

    if (gameState === 'menu') {
        if (menuState === 'main' && key === 'start') {
            menuState = 'jetSelect';
            selectedMenuButtonKey = `jet-${selectedJetId}`;
        } else if (menuState === 'main' && key === 'howToPlay') {
            menuState = 'howToPlay';
            selectedMenuButtonKey = 'back';
        } else if (menuState === 'jetSelect' && key.startsWith('jet-')) {
            selectedJetId = key.slice('jet-'.length);
            menuState = 'levelSelect';
            selectedMenuButtonKey = 'startCampaign';
        } else if (menuState === 'jetSelect' && key === 'jetBack') {
            menuState = 'main';
            selectedMenuButtonKey = 'start';
        } else if (menuState === 'levelSelect' && key === 'difficulty') {
            const difficultyKeys = Object.keys(DIFFICULTIES);
            difficultyKey = difficultyKeys[(difficultyKeys.indexOf(difficultyKey) + 1) % difficultyKeys.length];
            saveCampaignProgress();
        } else if (menuState === 'levelSelect' && key === 'startCampaign') {
            loopNumber = 1;
            campaignProgress.unlockedMapIndex = Math.max(campaignProgress.unlockedMapIndex, 0);
            checkpointMapIndex = 0;
            saveCampaignProgress();
            initializeGame();
            gameState = 'playing';
        } else if (menuState === 'levelSelect' && key === 'continueCampaign') {
            initializeGame(checkpointMapIndex);
            gameState = 'playing';
        } else if (key === 'back') {
            if (menuState === 'levelSelect') {
                menuState = 'jetSelect';
                selectedMenuButtonKey = `jet-${selectedJetId}`;
            } else {
                menuState = 'main';
                selectedMenuButtonKey = 'start';
            }
        }
    } else if (gameState === 'sectorClear' && key === 'nextSector') {
        startNextSector();
        gameState = 'playing';
    } else if (gameState === 'sectorClear' && key === 'menu') {
        gameState = 'menu';
        menuState = 'main';
        selectedMenuButtonKey = 'start';
    } else if (gameState === 'gameOver' || gameState === 'win') {
        if (key === 'menu') {
            gameState = 'menu';
            menuState = 'main';
            selectedMenuButtonKey = 'start';
        } else if (key === 'retry') {
            initializeGame(checkpointMapIndex);
            gameState = 'playing';
        }
    } else if (gameState === 'playing' && isPaused && key === 'pauseBack') {
        isPaused = false;
        gameState = 'menu';
        menuState = 'main';
        selectedMenuButtonKey = 'start';
    }
}

function clearTouchMovement() {
    touchKeys = {};
    moveStickThumb.style.transform = '';
}

function updateTouchMovement(event) {
    const rect = moveStick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxOffset = rect.width * 0.32;
    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const magnitude = Math.hypot(rawX, rawY);
    const scale = magnitude > maxOffset ? maxOffset / magnitude : 1;
    const x = rawX * scale;
    const y = rawY * scale;

    moveStickThumb.style.transform = `translate(${x}px, ${y}px)`;
    touchKeys.a = x < -maxOffset * 0.2;
    touchKeys.d = x > maxOffset * 0.2;
    touchKeys.w = y < -maxOffset * 0.2;
    touchKeys.s = y > maxOffset * 0.2;
}

function updateActionButtonLabels() {
    const fireButton = touchControls.querySelector('[data-action="fire"]');
    fireButton.textContent = isFiring ? 'FIRE ON' : 'FIRE OFF';
    fireButton.setAttribute('aria-pressed', String(isFiring));
    const ultimateButton = touchControls.querySelector('[data-action="ultimate"]');
    const ready = player.ultimateCharge >= ULTIMATE_MAX_CHARGE;
    ultimateButton.textContent = ready ? 'ULTIMATE READY' : `ULTIMATE ${Math.floor(player.ultimateCharge)}%`;
    ultimateButton.disabled = !ready || gameState !== 'playing' || isPaused;
    ultimateButton.style.borderColor = ready ? JET_SPECIALS[player.jetId].color : '#738092';
    ultimateButton.setAttribute('aria-label', ready
        ? `${JET_SPECIALS[player.jetId].label} ultimate ready`
        : `Ultimate charge ${Math.floor(player.ultimateCharge)} percent`);
}

document.addEventListener('keydown', ensureAudioContext);
document.addEventListener('pointerdown', ensureAudioContext);

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'm' && !e.repeat) toggleSound();

    if ((gameState === 'menu' || gameState === 'gameOver' || gameState === 'win' ||
        gameState === 'sectorClear' ||
        (gameState === 'playing' && isPaused)) && !e.repeat) {
        const buttonKeys = Object.keys(menuButtons);
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && buttonKeys.length) {
            e.preventDefault();
            const currentIndex = buttonKeys.indexOf(selectedMenuButtonKey);
            const direction = key === 'arrowup' || key === 'arrowleft' ? -1 : 1;
            const nextIndex = currentIndex < 0
                ? (direction < 0 ? buttonKeys.length - 1 : 0)
                : (currentIndex + direction + buttonKeys.length) % buttonKeys.length;
            selectedMenuButtonKey = buttonKeys[nextIndex];
        } else if ((key === 'enter' || key === ' ') && buttonKeys.length) {
            e.preventDefault();
            const selectedKey = buttonKeys.includes(selectedMenuButtonKey)
                ? selectedMenuButtonKey
                : buttonKeys[0];
            selectedMenuButtonKey = selectedKey;
            activateMenuButton(selectedKey);
        }
    }

    if (key === 'p' && gameState === 'playing' && !e.repeat) togglePause();
    if (key === 'escape' && gameState === 'playing' && !e.repeat) {
        e.preventDefault();
        togglePause();
    }

    keys[key] = true;
    if ((gameState === 'gameOver' || gameState === 'win') && key === ' ' && !e.repeat) {
        e.preventDefault();
        initializeGame(checkpointMapIndex);
        gameState = 'playing';
        return;
    }
    if (isPaused || gameState !== 'playing' || e.repeat) return;

    if (key === 'y') {
        isFiring = !isFiring;
        updateActionButtonLabels();
    }
    if (key === 'q') activateUltimate();
    if (key === 'l') settings.scanlines = !settings.scanlines;
    if (key === 't') settings.theme = settings.theme === 'retro' ? 'dark' : 'retro';
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', (e) => {
    ensureAudioContext();
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * canvas.width / rect.width;
    const clickY = (e.clientY - rect.top) * canvas.height / rect.height;

    for (const [key, button] of Object.entries(menuButtons)) {
        if (clickX > button.x && clickX < button.x + button.w &&
            clickY > button.y && clickY < button.y + button.h) {
            selectedMenuButtonKey = key;
            activateMenuButton(key);
            break;
        }
    }
});

// Mousemove handler to set hovered button key for hover effects
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    if (gameState === 'playing' && !isPaused) {
        mouseAimWorld = { x: cameraX + x, y: cameraY + y };
    }

    let found = null;
    for (const key in menuButtons) {
        const b = menuButtons[key];
        if (!b) continue;
        if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
            found = key;
            break;
        }
    }
    hoveredButtonKey = found;
});

canvas.addEventListener('mouseleave', () => {
    hoveredButtonKey = null;
    mouseAimWorld = null;
});

moveStick.addEventListener('pointerdown', (e) => {
    if (gameState !== 'playing' || isPaused) return;
    moveStick.setPointerCapture(e.pointerId);
    updateTouchMovement(e);
});
moveStick.addEventListener('pointermove', (e) => {
    if (moveStick.hasPointerCapture(e.pointerId)) updateTouchMovement(e);
});
moveStick.addEventListener('pointerup', clearTouchMovement);
moveStick.addEventListener('pointercancel', clearTouchMovement);

touchControls.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'fire') {
        isFiring = !isFiring;
        updateActionButtonLabels();
    } else if (action === 'pause') {
        togglePause();
    } else if (action === 'ultimate') {
        activateUltimate();
    }
});

soundToggle.addEventListener('click', toggleSound);
canvas.addEventListener('focus', () => {
    gameAnnouncement.textContent = 'Game canvas focused. Use arrow keys to navigate menus and Enter to choose.';
    lastAnnouncement = gameAnnouncement.textContent;
});
updateSoundButton();
updateActionButtonLabels();
loadCampaignProgress();

// Start the game by passing the first timestamp
gameLoop(0);