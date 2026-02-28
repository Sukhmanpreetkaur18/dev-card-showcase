const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* ================= CORE SETTINGS ================= */

const LANES = [-1, 0, 1];
const PERSPECTIVE = 900;
const MAX_DEPTH = 2000;
const HORIZON = canvas.height * 0.2;

let currentLane = 1;
let speed = 25;
let score = 0;
let gameOver = false;

/* ================= PLAYER ================= */

let player = {
    lane: 1,
    screenY: canvas.height - 120,
    xOffset: 0
};

/* ================= OBJECT STORAGE ================= */

let obstacles = [];
let coins = [];

/* ================= SPAWN SYSTEM ================= */

function spawnObstacle() {
    obstacles.push({
        lane: Math.floor(Math.random() * 3),
        z: MAX_DEPTH
    });
}

function spawnCoin() {
    coins.push({
        lane: Math.floor(Math.random() * 3),
        z: MAX_DEPTH
    });
}

setInterval(spawnObstacle, 1400);
setInterval(spawnCoin, 900);

/* ================= PROJECTION SYSTEM ================= */

function project(lane, z) {

    let scale = PERSPECTIVE / (z + 1);

    let x = canvas.width / 2 +
        LANES[lane] * 250 * scale;

    let y = HORIZON +
        (canvas.height - HORIZON) * (1 - z / MAX_DEPTH);

    return { x, y, scale };
}

/* ================= TUNNEL ================= */

function drawTunnel() {

    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const roadWidthNear = canvas.width * 0.8;
    const roadWidthFar = canvas.width * 0.1;

    const segments = 60;

    for (let i = 0; i < segments; i++) {

        let zNear = (i / segments) * MAX_DEPTH;
        let zFar = ((i + 1) / segments) * MAX_DEPTH;

        let scaleNear = PERSPECTIVE / (zNear + 1);
        let scaleFar = PERSPECTIVE / (zFar + 1);

        let widthNear = roadWidthNear * scaleNear;
        let widthFar = roadWidthNear * scaleFar;

        let yNear = HORIZON + (canvas.height - HORIZON) * (zNear / MAX_DEPTH);
        let yFar = HORIZON + (canvas.height - HORIZON) * (zFar / MAX_DEPTH);

        // FLOOR STRIP
        ctx.fillStyle = i % 2 === 0 ? "#222" : "#1a1a1a";

        ctx.beginPath();
        ctx.moveTo(centerX - widthNear/2, yNear);
        ctx.lineTo(centerX + widthNear/2, yNear);
        ctx.lineTo(centerX + widthFar/2, yFar);
        ctx.lineTo(centerX - widthFar/2, yFar);
        ctx.closePath();
        ctx.fill();

        // FOG EFFECT
        ctx.fillStyle = `rgba(0,0,0,${zNear / MAX_DEPTH})`;
        ctx.fillRect(0, yNear, canvas.width, yFar - yNear);
    }

    // LANE STRIPES
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;

    for (let i = 0; i < 20; i++) {

        let z = (i * 150 + performance.now() * 0.4) % MAX_DEPTH;

        let scale = PERSPECTIVE / (z + 1);
        let y = HORIZON + (canvas.height - HORIZON) * (z / MAX_DEPTH);

        let laneOffset = 0;

        ctx.beginPath();
        ctx.moveTo(centerX + laneOffset * scale, y);
        ctx.lineTo(centerX + laneOffset * scale, y + 40 * scale);
        ctx.stroke();
    }
}

/* ================= PLAYER ================= */

function drawPlayer() {

    // Smooth lane transition
    let targetX = LANES[currentLane] * 120;
    player.xOffset += (targetX - player.xOffset) * 0.15;

    let x = canvas.width / 2 + player.xOffset;
    let y = player.screenY;

    ctx.fillStyle = "#ff0033";
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#66ccff";
    ctx.beginPath();
    ctx.ellipse(x, y - 10, 20, 25, 0, 0, Math.PI * 2);
    ctx.fill();
}

/* ================= OBSTACLES ================= */

function updateObstacles() {

    obstacles.forEach((obs, i) => {

        obs.z -= speed;

        if (obs.z <= 0) {
            obstacles.splice(i, 1);
            return;
        }

        let { x, y, scale } = project(obs.lane, obs.z);

        ctx.fillStyle = "#555";
        ctx.fillRect(
            x - 40 * scale,
            y - 80 * scale,
            80 * scale,
            100 * scale
        );

        // Collision detection
        if (
            obs.z < 200 &&
            obs.lane === currentLane
        ) {
            gameOver = true;
        }
    });
}

/* ================= COINS ================= */

function updateCoins() {

    coins.forEach((coin, i) => {

        coin.z -= speed;

        if (coin.z <= 0) {
            coins.splice(i, 1);
            return;
        }

        let { x, y, scale } = project(coin.lane, coin.z);

        ctx.fillStyle = "gold";
        ctx.beginPath();
        ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
        ctx.fill();

        if (
            coin.z < 200 &&
            coin.lane === currentLane
        ) {
            score += 10;
            coins.splice(i, 1);
        }
    });
}

/* ================= UI ================= */

function drawUI() {
    ctx.fillStyle = "#00ffff";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);
}

/* ================= GAME LOOP ================= */

function update() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTunnel();

    if (!gameOver) {
        updateObstacles();
        updateCoins();
        drawPlayer();
        drawUI();
    } else {
        ctx.fillStyle = "red";
        ctx.font = "60px Arial";
        ctx.fillText("GAME OVER", canvas.width/2 - 150, canvas.height/2);
    }

    requestAnimationFrame(update);
}

/* ================= CONTROLS ================= */

window.addEventListener("keydown", (e) => {

    if (e.key === "ArrowLeft" && currentLane > 0)
        currentLane--;

    if (e.key === "ArrowRight" && currentLane < 2)
        currentLane++;
});

update();