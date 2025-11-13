// const { createVideo } = require("p5");

//NOTE: Add connecttion light back on

// public/sketch.js
let socket;

// mirrors Arduino thresholds
const thresholds = [10, 20, 30];

// animation stuff
let fullFrames = 0;
const FULL_FRAMES_TO_CONFIRM = 12; // ~12 frames ≈ 200ms at 60fps
const DISMISS_DURATION = 600;

// video overlay
let taskVideo;
let bleedingBar;
let veinStatus = "";

//layout constants
const barX = 282;
const barY = 27;
const barW = 323;
const barH = 30;

// stations and their states
let stations = {
  brain: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [80, 180, 255], name: "brain", inputDelay: false },
  eyeball: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [255, 230, 100], name: "eyeball", inputDelay: false },
  bleeding: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [201, 22, 22], name: "bleeding", inputDelay: false },
  heart: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [255, 120, 180], name: "heart",inputDelay: false },
  tummy: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [120, 255, 150], name: "tummy",inputDelay: false }
};


function preload() {
  bleedingBar = loadImage("media/Task 1_NotComplete.png");
  brainBar = loadImage("media/Task 2_NotComplete.png");
  tummyBar = loadImage("media/Task 3_NotComplete.png");
  eyeBar = loadImage("media/Task 4_NotComplete.png");

  headerImage = loadImage("media/TopBar.png");
}

//Feed in the name of the task for newTask or banish to get that task back on screen or banish it as if its complete
let banish = "";
let newTask = "";
let otherNewTask = "";

let gameState = 0;
let gameloop = 0;
let updateGameState = false;
let useGameLoop = false;
let heartConnected = false;
let heartLast = 0;
//Gameloop 1 for Prototype 2
function gameLoop1(state) {
  if (state == 1) {
    newTask = "bleeding"
  }
  if (state == 2) {
    newTask = "brain"
  }
  if (state == 3) {
    newTask = "bleeding"
    otherNewTask = "brain"
  }
  if (state == 4) {
    newTask = "eyeball"
  }
  if (state == 5) {
    newTask = "tummy"
    useGameLoop = false;
  }
}
// Gameloop 2 for Prototype 2
function gameLoop2(state) {
  if (state == 1) {
    newTask = "brain"
  }
  if (state == 2) {
    newTask = "bleeding"
  }
  if (state == 3) {
    newTask = "brain"
    otherNewTask = "bleeding"
  }
  if (state == 4) {
    newTask = "tummy"
  }
  if (state == 5) {
    newTask = "eyeball"
    useGameLoop = false;
  }
}

function setup() {
  createCanvas(720, 400);
  textFont("system-ui");

  taskVideo = createVideo("media/video/Background.mp4", () => {
    // make it autoplay-safe
    taskVideo.volume(0); // p5 wrapper volume
    taskVideo.elt.muted = true; // HTML video must be muted
    taskVideo.elt.setAttribute("muted", "");
    taskVideo.elt.setAttribute("playsinline", ""); // iOS Safari inline playback
    taskVideo.loop(); // or .play()
    taskVideo.hide(); // we’ll draw it to the canvas
  });
  taskVideo.loop();
  taskVideo.hide();

  // same-origin socket.io
  socket = io();
  SocketListeners();

  //Some event listeners for manual control of the game
  addEventListener("keydown", (e) => {
    //These bring in new tasks
    if (e.key == "w") {
      newTask = "brain";
    }
    if (e.key == "e") {
      newTask = "eyeball";
    }
    if (e.key == "q") {
      newTask = "bleeding";
    }
    if (e.key == "r") {
      newTask = "tummy";
    }
    //these atomize task from the list
    if (e.key == "s") {
      banish = "brain";
    }
    if (e.key == "d") {
      banish = "eyeball";
    }
    if (e.key == "a") {
      banish = "bleeding";
    }
    if (e.key == "f") {
      banish = "tummy";
    }

    if (e.key == "1") { //For gameloop 1
      gameloop = 1;
      gameState = 1;
      updateGameState = true;
      useGameLoop = true;
    }
    if (e.key == "2") { //For gameloop 2
      gameloop = 2;
      gameState = 1;
      updateGameState = true;
      useGameLoop = true;
    }
    if (e.key == "3") { //For manual control
      gameloop = 0;
      gameState = 1;
      updateGameState = false;
      useGameLoop = false;
    }
  })
}


// ---- Socket Listeners ----
//They should be strings
function SocketListeners() {
  socket.on("brain-data", (p) => stations.brain.num = (String(p).trim()));
  socket.on("eyeball-data", (p) => stations.eyeball.num = (String(p).trim()));
  socket.on("bleeding-data", (p) => stations.bleeding.num = (String(p).trim()));
  socket.on("heart-data", (p) => stations.heart.num = (String(p).trim()));
  socket.on("tummy-data", (p) => stations.tummy.num = (String(p).trim()));
}

// ---- DRAW STATIONS ----
function draw() {
  background(0);
  if (taskVideo) image(taskVideo, 0, 0, width, height);

  if (headerImage) {
    image(headerImage, 0, 0, width, headerImage.height * (width / headerImage.width));
  }

  //
  // ---  DRAW BARS ---
  //

  //offsets
  const topOffset = 50;
  const space = -3;

  // for image size scale
  const barWidth = width * 0.8;
  const barHeight = 223 * (barWidth / 1480);

  // vertical placement for each station (stacked layout)
  const positions = {
    bleeding: { y: topOffset + (barHeight + space) * 0 },
    brain: { y: topOffset + (barHeight + space) * 1 },
    eyeball: { y: topOffset + (barHeight + space) * 2 },
    tummy: { y: topOffset + (barHeight + space) * 3 },
    heart: { y: 240000 } //BEGONE HEALTH BAR
  };

  // calculate centered X position for all bars
  const centeredX = (width - barWidth) / 2;

  // layout info for each station image and bar position
  const stationLayouts = {
    bleeding: { img: bleedingBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    brain: { img: brainBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    eyeball: { img: eyeBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    tummy: { img: tummyBar, x: centeredX, y: 0, w: barWidth, h: barHeight }
  };


  //ITERATE THOUGH STATIONS
  for (const key in stations) {
    const st = stations[key];
    const posY = positions[key].y;
    // smooth progress update
    console.log(st.inputDelay);
    if(st.inputDelay){
      // console.log(st.num);
      st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1);
      // st.progress = lerp(st.progress,st.progress + st.num,.1);
      // st.progress += st.num;
    }
    // detect completion
    if (!st.dismissing && st.visible && st.progress >= 0.995) {
      st.dismissing = true;
      st.dismissStart = millis();
    }
    // handle dismissal animation
    if (st.dismissing || st.name === banish) {
      const t = constrain((millis() - st.dismissStart) / DISMISS_DURATION, 0, 1);
      const e = 1 - pow(1 - t, 3);
      st.offsetX = e * (width + 48);
      st.fade = 1 - e;
      if (t >= 1) {
        st.dismissing = false;
        st.visible = false;
        st.fade = 0;
      }
      banish = ""
      gameState++;
      updateGameState = true;
      st.inputDelay = false; //Possible solution for the first input completion
    }

    function callOrReset(othertask) {
      st.offsetX = 0;
      translate(st.offsetX, posY);
      st.visible = true;
      st.dismissing = false;
      st.fade = 1;
      banish = false;
      if (!othertask) newTask = "";
      if (othertask) otherNewTask = "";
      st.progress = 0;
      // st.num = 0;
      st.dismissStart = 0;
      // if(st.name == "eyeball" || st.name =="tummy"){
      st.inputDelay = true;
      // }
      socket.emit(`${st.name}`, true);
    }
    //return a task from completion / reset all values 
    if (st.name === newTask) { callOrReset(false); }
    if (st.name === otherNewTask) { callOrReset(true); }

    // draw station overlay
    if (st.visible || st.dismissing) {
      push();
      translate(st.offsetX, posY);

      // progress fill
      noStroke();
      fill(st.color[0], st.color[1], st.color[2], 220 * st.fade);
      rect(barX, barY, barW * st.progress, barH);

      // pick the right image for the station
      const layout = stationLayouts[st.name] || {};
      const img = layout.img;

      // draw the correct overlay image
      if (img) {
        tint(255, 255 * st.fade);
        image(img, layout.x, layout.y, layout.w, layout.h);
        noTint();
      }

      //connection status
      textSize(12);
      textStyle(NORMAL);
      textAlign(LEFT, CENTER);

      //NEEDS TO CHNAGE so it relates to if connected or not, NOT THE CHARGE
      if (st.progress > 0) {
        fill(255, 255 * st.fade);
        text("CONNECTED", 620, 40);
      }

      pop();
    }
    if (updateGameState && useGameLoop) {
      if (gameloop == 1) {
        gameLoop1(gameState);
      }
      if (gameloop == 2) {
        gameLoop2(gameState);
      }
      updateGameState = false;
    }

    if (st.name == "heart") {
      if (st.num == "1" || st.num == "2" || st.num == "3" || heartLast == "1" || heartLast == "2" || heartLast == "3") { heartConnected = true; }
      else { heartConnected = false; }
      heartLast = st.num;
    }

  }
}


// ---- SHOW BAR PROGRESS ----
// Map chargeNum to progress in 3 equal segments that line up with the LEDs
function ledProgress(charge, th = thresholds) {
  const [t0, t1, t2] = th

  if (charge <= 0 || !heartConnected) return 0;

  if (charge <= t0) {
    // first third
    const seg = charge / t0; // 0..1 within [0..t0]
    return (1 / 3) * seg;
  } else if (charge <= t1) {
    // second third
    const seg = (charge - t0) / (t1 - t0); // 0..1 within (t0..t1]
    return 1 / 3 + (1 / 3) * seg;
  } else {
    // last third (cap at full)
    const seg = (charge - t1) / (t2 - t1); // 0..1 within (t1..t2]
    return Math.min(2 / 3 + (1 / 3) * seg, 1);
  }
}

// ----- INTERACTION -----

// Fallback: if the browser still blocks it, a click will start playback
function mousePressed() {
  if (taskVideo && taskVideo.elt && taskVideo.elt.paused) {
    taskVideo.elt.muted = true; // ensure still muted
    taskVideo.play();
  }
}

//import from helper
const toggleFullscreen = fullscreen();

//make full screen
function doubleClicked() {
  toggleFullscreen(document.querySelector('canvas'));
}


// // colors for the three LEDs (R,G,B)
// const ledColors = [
//   [255, 70, 70], // red
//   [255, 190, 60], // amber
//   [60, 220, 100], // green
// ];

// const barX = 261; // adjust these to fit your PNG
// const barY = 153;
// const barW = 170;
// const barH = 15;
// let displayedProgress = 0;


//socket = io();
//
//socket.on("serial-data", (payload) => {
//  // expect a line with a number, e.g., "17"
//  const s = String(payload).trim();
//  const match = s.match(/-?\d+/);
//  if (!match) return;
//
//  const val = parseInt(match[0], 10);
//  if (!Number.isFinite(val)) return;
//
//  chargeNum = val;
//
//  // update LED states EXACTLY like Arduino
//  leds[0] = chargeNum > thresholds[0];
//  leds[1] = chargeNum > thresholds[1];
//  leds[2] = chargeNum > thresholds[2];
//
//  // mirror to debug div
//  const el = document.getElementById("value-verification");
//  if (el) {
//    el.textContent =
//      `chargeNum=${chargeNum} | LED1=${leds[0] ? "ON" : "OFF"} ` +
//      `LED2=${leds[1] ? "ON" : "OFF"} LED3=${leds[2] ? "ON" : "OFF"}`;
//  }
//});