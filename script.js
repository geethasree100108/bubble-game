const canvas = document.getElementById("gameCanvas");
const container = document.getElementById("canvas-container");
const ctx = canvas.getContext("2d"); //render to draw a 2d shapes in empty physical space of canvas and contains the tools to draw
const scoreDisplay = document.getElementById("score-display");
const timerDisplay = document.getElementById("timer-display");
const gameOverScreen = document.getElementById("game-over-screen");
const finalScore = document.getElementById("final-score");
const btnRestart = document.getElementById("btn-restart");

let score = 0;
let timeleft = 30;
let bubbles = []; //holdes floating target of the bubble
let particles = []; // active physics spark
let shockwaves = []; //holds expanding rings

let gameInterval;
let spawnTimer; //assigning the position ,color ,placing the bubble in gameBoard

const margin = 20;

function resizeCanvas() {
  canvas.width = window.innerWidth - margin * 2;
  canvas.height = window.innerHeight - margin * 2;
} //to resize the canvas draw grid according to user' web browser

window.addEventListener("resize", resizeCanvas); //whenever the user resize their browser' page resizecanva function will run
resizeCanvas(); //whenever the page loads this function will run

function startGame() {
  score = 0;
  timeleft = 30;
  bubbles = [];
  particles = [];
  shockwaves = [];

  scoreDisplay.textContent = "SCORE: " + score;
  timerDisplay.textContent = "TIME: " + timeleft;
  gameOverScreen.style.display = "none";

  clearInterval(gameInterval);
  clearInterval(spawnTimer); //destroys any old, active running clock timers

  gameInterval = setInterval(() => {
    timeleft--;
    timerDisplay.textContent = "TIME: " + timeleft;
    if (timeleft <= 0) endGame();
  }, 1000);
  spawnTimer = setInterval(spawnBubble, 600); //assigning the color,size and poisition of bubble for each 0.6 seconds
}
function spawnBubble() {
  const radius = Math.random() * 20 + 25;

  // Define how many pixels of empty space you want around the edges
  const edgeGap = 40;

  // Calculate the safe spawning boundaries
  const minX = radius + edgeGap;
  const maxX = canvas.width - radius - edgeGap;

  const minY = radius + edgeGap;
  const maxY = canvas.height - radius - edgeGap;

  // Randomize X and Y only within those safe boundaries
  const x = Math.random() * (maxX - minX) + minX;
  const y = Math.random() * (maxY - minY) + minY;

  const hue = Math.floor(Math.random() * 360);

  bubbles.push({
    x,
    y,
    radius,
    pulseSpeed: Math.random() * 0.03 + 0.02,
    hue,
    alpha: 1,
    currentRadius: radius,
  });
}
function createSupernovaBurst(x, y, hue) {
  shockwaves.push({
    x,
    y,
    radius: 5,
    maxRadius: 160,
    hue,
    alpha: 1,
  });
  const sparkCount = 100; //each sparks creates 65 separate JS objects and saves them inside the paticles[] array
  //defining angle and force for each spark coming out in all direction when the bubble is popped
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2; //360deg = 2pi radian
    const force = Math.random() * 12 + 4; //selects the velocity power b/w 4 to 16px per frame to push the spark outward dynamically
    particles.push({
      //creating a brand new bubble
      x: x,
      y: y, //where the bubble starting x,y
      prevX: x, //previous x
      prevY: y, //previous y
      vx: Math.cos(angle) * force, //how fast the bubble move left to right
      vy: Math.sin(angle) * force, //how fast the bubble moves up or down
      radius: Math.random() * 3 + 1.5, //random dot size b/w 1.5px to 4.5px
      alpha: 1, //visible it decrease to 0 it become invisible
      decay: Math.random() * 0.015 + 0.005, //life drop speed of sparks
      hue: hue,
    });
    container.classList.add("shake");
    setTimeout(() => {
      container.classList.remove("shake");
    }, 100);
  }
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();

  // 1. Calculate the scale difference between the physical size and internal size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // 2. Multiply your click coordinates by the scale
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    let activeRadius = b.currentRadius;

    // Calculate distance with the newly scaled X and Y coordinates
    let dist = Math.sqrt((clickX - b.x) ** 2 + (clickY - b.y) ** 2);

    let hitPadding = 15;

    if (dist < activeRadius + hitPadding) {
      createSupernovaBurst(b.x, b.y, b.hue);
      bubbles.splice(i, 1);
      score += 15;
      scoreDisplay.textContent = "SCORE: " + score;
      break;
    }
  }
});

function endGame() {
  clearInterval(gameInterval);
  clearInterval(spawnTimer);
  finalScore.textContent = score;
  gameOverScreen.style.display = "flex";
}

//by sweeps over the screen again and again ,every spark gets it own fading tail automatically
function updateAndDraw() {
  //for sweep the the canva screen for 60 times for every 1 sec
  ctx.fillStyle = "rgba(3,3,7,0.2)"; //clearRect that clear the entire screen we just paints a semi-transparent dark rectancle over the whole screen
  ctx.fillRect(0, 0, canvas.width, canvas.height); //when spark moves forward the computer paints the whole entire screen 20% drh again and again
  ctx.globalCompositeOperation = "lighter"; //blends the color of overlapping spark and computer shows blended color to make the sparks glow add the canvas pixel with sparks pixel color to make the spark li=ooks brighter
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    let sw = shockwaves[i];
    sw.radius += 6; //expands ring range out by 6px while drawing down the visibility
    sw.alpha -= 0.02;
    if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
      //to delete transparent or oversized shockwaves maxragius = 160px
      shockwaves.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); //pi*2 to cover 360 deg
    ctx.strokeStyle = `hsla(${sw.hue},100%,60%,${sw.alpha * 0.4})`; // hue-color of the bubble,100%, - full vibrant of the color,60% - lightness, alpha*0.4 - 40% transparency only to the current transpareny to not overpower than the spark
    ctx.lineWidth = 1.5;
    ctx.stroke(); //draw the 1.5px line on the screen
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    b.alpha -= 0.002;
    b.currentRadius = b.radius + Math.sin(Date.now() * b.pulseSpeed) * 4; //RADIUS = BASE RADIUS +4*sin(TIME*SPEED) Math.sin() b/w -1 to +1 so by multiplying with 4 makes the target size breath up and down by +4 or -4 px
    if (b.alpha <= 0) {
      // slice dead items from current layout loops
      bubbles.splice(i, 1);
      continue;
    }
    if (b.alpha < 0.5) {
      b.y -= 0.4; //opacity below 50% , the bubbles start drift slowly upward by 0.4 px per frame
    }
    let drawAlpha = b.alpha;
    if (b.alpha < 0.3) {
      if (Math.random() > 0.7) {
        drawAlpha = b.alpha * 0.25; //for flickering effect when the brightness drops down significantly
      }
    }
    let displayRadius = b.currentRadius;
    ctx.beginPath();
    ctx.arc(b.x, b.y, displayRadius, 0, Math.PI * 2); //draw pencil outline in shape of circle
    ctx.strokeStyle = `hsla(${b.hue},100%,65%,${drawAlpha})`;
    ctx.lineWidth = 3;
    ctx.stroke(); //draw the outer edge of the bubble
    ctx.fillStyle = `hsla(${b.hue},100%,50%,${drawAlpha * 0.1})`; //draw visual target bubble onto the interface screen and outer neon stroke shell 3px wide and translucent center fill 10% base transparency matching
    ctx.fill(); //color the bubble
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.prevX = p.x;
    p.prevY = p.y; //caches the current particles coordiate before updating them
    p.vy += 0.25; //add 0.25 speed downward to vertival velocity vy which results in the bends linear pathway into natural looking parabolic curves
    p.vy *= 0.96;
    p.vx *= 0.96; //eliminating 4% velocity every single frame results in atmospheric friction
    p.x += p.vx;
    p.y += p.vy; //moves the spark's position grid numbers forward based on their speed
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue},100%,65%,${p.alpha})`;
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over"; //to draw a dark background on every time in a second make the canvas looks very brigther
  //reset the blending mode back to normal so other UI elements look correct
  requestAnimationFrame(updateAndDraw); //request next frame to keep the animation smoothly
  //calling function inside itself creates infinte recursion instead tell the browser to add the frame to queue not to done that sequentially
}

btnRestart.addEventListener("click", startGame);
startGame();
updateAndDraw(); //runs 60 times per second
