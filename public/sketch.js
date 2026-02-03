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

//tracks what tasks are currrently shown
let visibleTasks = [];

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
  brain: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [80, 180, 255], name: "brain", inputDelay: false, timerStart: 0, totalTime: 0 },
  eyeball: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [255, 230, 100], name: "eyeball", inputDelay: false, timerStart: 0, totalTime: 0 },
  bleeding: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [201, 22, 22], name: "bleeding", inputDelay: false, timerStart: 0, totalTime: 0 },
  heart: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [255, 120, 180], name: "heart", inputDelay: false, timerStart: 0, totalTime: 0 },
  tummy: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [120, 255, 150], name: "tummy", inputDelay: false, timerStart: 0, totalTime: 0 }
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
    //reset all pins on a given station
    if (e.key == "x") {
      socket.emit("brain", "reset");
    }
    if (e.key == "c") {
      socket.emit("eyeball", "reset");
    }
    if (e.key == "z") {
      socket.emit("bleeding", "reset");
    }
    if (e.key == "v") {
      socket.emit("tummy", "reset");
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

  //video and header
  if (taskVideo) image(taskVideo, 0, 0, width, height);
  if (headerImage) {
    image(headerImage, 0, 0, width, headerImage.height * (width / headerImage.width));
  }

  //layout constants
  const topOffset = 50;
  const space = -3;
  const barWidth = width * 0.8;
  const barHeight = 223 * (barWidth / 1480);
  const centeredX = (width - barWidth) / 2;

  //layouts of stations
  let stationLayouts = {
    brain: { img: brainBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    eyeball: { img: eyeBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    bleeding: { img: bleedingBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    heart: { img: null, x: centeredX, y: 0, w: barWidth, h: barHeight },
    tummy: { img: tummyBar, x: centeredX, y: 0, w: barWidth, h: barHeight }
  };

  //test
  // stations.brain.num = 5;
  // stations.eyeball.num = 10;
  // stations.bleeding.num = 15;
  // stations.tummy.num = 7;
  // stations.heart.num = 1;


  // ---UPDATE STATIONS---
  for (const key in stations) {
    const st = stations[key];

    // smooth progress update
    if (st.inputDelay) {
      st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1);
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

        //time
        st.totalTime = (millis() - st.timerStart) / 1000; // in seconds

        // Calculate score now
        const points = scoring(st.totalTime);
        console.log(`${st.name} scored:`, points);

        //remove from visibleTasks
        const index = visibleTasks.indexOf(st.name);
        if (index > -1) visibleTasks.splice(index, 1);
      }
      banish = ""
      gameState++;
      updateGameState = true;
      st.inputDelay = false; //Possible solution for the first input completion
      socket.emit(`${st.name}`, "stop"); //Trigger stop
    }

    //return a task from completion / reset all values 
    if (st.name === newTask || st.name === otherNewTask) {
      st.offsetX = 0;
      st.visible = true;
      st.dismissing = false;
      st.fade = 1;
      st.progress = 0;
      st.dismissStart = 0;
      st.inputDelay = true;

      //timer
      st.timerStart = int(millis() / 1000);
      st.totalTime = 0;

      socket.emit(`${st.name}`, "go");

      //add task to visibleTasks
      if (!visibleTasks.includes(st.name)) visibleTasks.push(st.name)
      if (st.name === newTask) newTask = "";
      if (st.name === otherNewTask) otherNewTask = "";
    }

    if (st.name == "heart") {
      if (st.num == "1" || st.num == "2" || st.num == "3" || heartLast == "1" || heartLast == "2" || heartLast == "3") { heartConnected = true; }
      else { heartConnected = false; }
      heartLast = st.num;
    }

  }

  // --- STACK STATIONS ---
  for (let i = 0; i < visibleTasks.length; i++) {
    const key = visibleTasks[i];
    const st = stations[key];
    const posY = topOffset + i * (barHeight + space);

    if (st.visible || st.dismissing) {
      push();
      translate(st.offsetX, posY);
      noStroke();
      fill(st.color[0], st.color[1], st.color[2], 220 * st.fade);
      rect(barX, barY, barW * st.progress, barH);

      //image
      const layout = stationLayouts[st.name];
      if (layout && layout.img) {
        tint(255, 255 * st.fade);
        image(layout.img, layout.x, layout.y, layout.w, layout.h);
        noTint();
      }

      // connection status text
      textSize(12);
      textStyle(NORMAL);
      textAlign(LEFT, CENTER);
      if (st.progress > 0) {
        fill(255, 255 * st.fade);
        text("CONNECTED", 620, 40);
      }

      pop();
    }
  }

  // ---GAME LOOP UPDATE---
  if (updateGameState && useGameLoop) {
    if (gameloop == 1) {
      gameLoop1(gameState);
    }
    if (gameloop == 2) {
      gameLoop2(gameState);
    }
    updateGameState = false;
  }
}


// ---- SHOW BAR PROGRESS ----
// Map chargeNum to progress in 3 equal segments that line up with the LEDs
function ledProgress(charge, th = thresholds) {
  const [t0, t1, t2] = th;

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
