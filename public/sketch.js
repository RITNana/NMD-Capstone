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
const barW = 375;
const barH = 30;

//game time
let gameDuration = 120 * 1000;
let gameTimeStart = 0;
let gameOver = false;

// stations and their states AKA the Hell JSON
let stations = {
  brain: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "brain", inputDelay: false, timerStart: 0, totalTime: 0 },
  eyeball: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "eyeball", inputDelay: false, timerStart: 0, totalTime: 0 },
  bleeding: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "bleeding", inputDelay: false, timerStart: 0, totalTime: 0 },
  heart: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "heart", inputDelay: false, timerStart: 0, totalTime: 0 },
  tummy: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "tummy", inputDelay: false, timerStart: 0, totalTime: 0 },
}

// daisy chain stations
let daisyTasks = {
  bleedEye: { parts: ["bleeding", "eyeball"], progress: 0, partProgress: { bleeding: 0, eyeball: 0 }, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, timerStart: 0, totalTime: 0, img: null },
  brainTummy: { parts: ["brain", "tummy"], progress: 0, partProgress: { brain: 0, tummy: 0 }, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, timerStart: 0, totalTime: 0, img: null },
};

function preload() {
  bleedingBar = loadImage("media/Bleeding.png");
  brainBar = loadImage("media/Brain.png");
  tummyBar = loadImage("media/Stomach.png");
  eyeBar = loadImage("media/Eye.png");

  daisyBleedBar = loadImage("media/DaisyBleed.png");
  daisyBrainBar = loadImage("media/DaisyBrain.png");

  //set image
  daisyTasks.bleedEye.img = daisyBleedBar;
  daisyTasks.brainTummy.img = daisyBrainBar;

  headerImage = loadImage("media/VitalsBoardLogo.png");
  timerImage = loadImage("media/ClockLogo.png");
}


//Feed in the name of the task for newTask or banish to get that task back on screen or banish it as if its complete
let banish = "";
let newTask = "";
let otherNewTask = "";
//useDaisy is to use it or not
//daisyTask is the name of the task you have to go through, endTask is the end task , 
//daisyTube is the color of tube going from heart to daisy and chain from daisy to end
let daisy = { useDaisy: false, daisyTask: "", endTask: "", daisyTube: "", chainTube: "" }

let portData = { brain: { red: "0", blue: "0" }, eyeball: { red: "0", blue: "0" }, bleeding: { red: "0", blue: "0" }, heart: { red: "0", blue: "0" }, tummy: { red: "0", blue: "0" } }
let tubeLocation = { red: [], blue: [] }
let gameState = 0;
let gameloop = 0;
let updateGameState = false;
let useGameLoop = false;
let heartConnected = false;
let heartLast = 0;
//Function to fill in tube location based on portData sudo-returning the locations
function tubeFinder() {
  //reset the json before going
  tubeLocation.red = [];
  tubeLocation.blue = [];
  for (const station in portData) {
    if (portData[station].red !== "0") {
      tubeLocation.red.push(station);
    }
    if (portData[station].blue !== "0") {
      tubeLocation.blue.push(station);
    }
  }
}

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

    // Daisy in theory
    daisy.useDaisy = true;
    daisy.daisyTask = "bleeding";
    daisy.endTask = "brain";
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

  //start timer
  gameTimeStart = millis();

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
    if (e.key == "w") { newTask = "brain"; }
    if (e.key == "e") { newTask = "eyeball"; }
    if (e.key == "q") { newTask = "bleeding"; }
    if (e.key == "r") { newTask = "tummy"; }
    //these atomize task from the list
    if (e.key == "s") { banish = "brain"; }
    if (e.key == "d") { banish = "eyeball"; }
    if (e.key == "a") { banish = "bleeding"; }
    if (e.key == "f") { banish = "tummy"; }
    //reset all pins on a given station
    //these get sent to index.js
    if (e.key == "x") { socket.emit("brain", "reset"); }
    if (e.key == "c") { socket.emit("eyeball", "reset"); }
    if (e.key == "z") { socket.emit("bleeding", "reset"); }
    if (e.key == "v") { socket.emit("tummy", "reset"); }
    if (e.key == "b") { socket.emit("heart", "reset"); }

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
    if (e.key == "4") { //manual daisy task
      daisy.useDaisy = true;
      // console.log(daisy.useDaisy);
      daisy.daisyTask = "bleeding";
      // console.log(daisy.daisyTask);
      daisy.endTask = "brain";
    }
  })
}


// ---- Socket Listeners ----
//They should be strings they come from index.js
function SocketListeners() {
  socket.on("brain-data", (p) => stations.brain.num = (String(p).trim()));
  socket.on("eyeball-data", (p) => stations.eyeball.num = (String(p).trim()));
  socket.on("bleeding-data", (p) => stations.bleeding.num = (String(p).trim()));
  socket.on("heart-data", (p) => stations.heart.num = (String(p).trim()));
  socket.on("tummy-data", (p) => stations.tummy.num = (String(p).trim()));

  socket.on("brain-red", (p) => portData.brain.red = (String(p).trim()));
  socket.on("eyeball-red", (p) => portData.eyeball.red = (String(p).trim()));
  socket.on("bleeding-red", (p) => portData.bleeding.red = (String(p).trim()));
  socket.on("heart-red", (p) => portData.heart.red = (String(p).trim()));
  socket.on("tummy-red", (p) => portData.tummy.red = (String(p).trim()));

  socket.on("brain-blue", (p) => portData.brain.blue = (String(p).trim()));
  socket.on("eyeball-blue", (p) => portData.eyeball.blue = (String(p).trim()));
  socket.on("bleeding-blue", (p) => portData.bleeding.blue = (String(p).trim()));
  socket.on("heart-blue", (p) => portData.heart.blue = (String(p).trim()));
  socket.on("tummy-blue", (p) => portData.tummy.blue = (String(p).trim()));
}

// ---- DRAW STATIONS ----
function draw() {
  background(0);

  let headScale = 0.3;
  let timeScale = 0.12;

  //video and header
  if (taskVideo) image(taskVideo, 0, 0, width, height);
  if (headerImage) {
    w = width * headScale;
    h = w * (headerImage.height / headerImage.width);
    image(headerImage, (width - w) / 2, 7, w, h);
  }
  if (timerImage) {
    w = width * timeScale;
    h = w * (timerImage.height / timerImage.width);
    image(timerImage, width - 110, 25, w, h);
  }

  //layout constants
  const topOffset = 90;
  const space = 24;
  const ratio = 357 / 4308;
  const barWidth = width * 0.9;
  const barHeight = barWidth * ratio;
  const centeredX = (width - barWidth) / 2;

  //layouts of stations
  let stationLayouts = {
    brain: { img: brainBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    eyeball: { img: eyeBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    bleeding: { img: bleedingBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    heart: { img: null, x: centeredX, y: 0, w: barWidth, h: barHeight },
    tummy: { img: tummyBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    bleedEye: { img: daisyBleedBar, x: centeredX, y: 0, w: barWidth, h: barHeight },
    brainTummy: { img: daisyBrainBar, x: centeredX, y: 0, w: barWidth, h: barHeight }
  };

  //test
  // stations.brain.num = 5;
  // stations.eyeball.num = 29;
  // stations.bleeding.num = 12;
  // stations.tummy.num = 8;
  // stations.heart.num = 1;

  //Trigger the tube finder to be updated
  tubeFinder();
  let blueDaisy = (tubeLocation.blue.includes(daisy.daisyTask)); //the task being chained (daisy-ed?) through is connected with blue
  let redDaisy = (tubeLocation.red.includes(daisy.daisyTask)); //the task being chained (daisy-ed?) through is connected with red
  let blueEnd = (tubeLocation.blue.includes(daisy.endTask)); //the end task is connected with blue
  let redEnd = (tubeLocation.red.includes(daisy.endTask)); //the end task is connected with red
  let blueHeart = (tubeLocation.blue.includes('heart'));
  let redHeart = (tubeLocation.red.includes('heart'));

  // ---UPDATE STATIONS---
  for (const key in stations) {
    const st = stations[key];

    // smooth progress update
    //console.log(st.inputDelay);
    if (!daisy.useDaisy && st.inputDelay &&
      ((blueHeart && tubeLocation.blue.includes(key)) ||
        (redHeart && tubeLocation.red.includes(key)))) {
      st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1);
    }


    if (daisy.useDaisy) {
      //minimum the hear to the daisy is needed 
      if (st.inputDelay &&
        ((blueDaisy && blueHeart) || //Blue tube Heart to Daisy
          (redDaisy && redHeart)) // Red tube heart to Daisy 
      ) {
        //for the heart -> daisy
        if (st.name == daisy.daisyTask) { st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1); }
        //for the daisy -> end
        else if (st.name == daisy.endTask) {
          if (((blueEnd && blueDaisy) || //blue at end and daisy 
            (redEnd && redDaisy)) //red at end and daisy
          ) { st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1); }
        };
      }
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

        // stop timer
        st.totalTime = (millis() - st.timerStart) / 1000; // seconds
        st.timerStart = 0; // reset for next time

        console.log(`${st.name} time:`, st.totalTime);

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
      //Reminder that input delay's logic is backwards so if its false it stops the input and true it lets input throu
      st.inputDelay = true;

      //timer
      st.timerStart = millis();
      st.totalTime = 0;

      socket.emit(`${st.name}`, "go");

      //add task to visibleTasks
      if (!visibleTasks.includes(st.name)) visibleTasks.push(st.name)
      if (st.name === newTask) newTask = "";
      if (st.name === otherNewTask) otherNewTask = "";
    }

    //     if (st.name == "heart") {
    //       if (st.num == "1" || st.num == "2" || st.num == "3" || heartLast == "1" || heartLast == "2" || heartLast == "3") { heartConnected = true; }
    //       else { heartConnected = false; }
    //       heartLast = st.num;
    //     }

  }

  // --- STACK STATIONS ---
  for (let i = 0; i < visibleTasks.length; i++) {
    const key = visibleTasks[i];
    const st = stations[key];
    const posY = topOffset + i * (barHeight + space);

    if (st.visible || st.dismissing) {
      const layout = stationLayouts[st.name];

      push();
      translate(st.offsetX, posY);
      noStroke();
      fill(228, 44, 46);
      rect(barX - 10, barY - 10, barW * st.progress, barH - 10);

      //image
      if (layout && layout.img) {
        tint(255, 255 * st.fade);
        image(layout.img, layout.x, layout.y, layout.w, layout.h);
        noTint();
      }

      pop();
    }
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

  // ----GAME TIMER----
  //added game over thing just in case we want to do it for imagine
  if (!gameOver) {
    let time = millis() - gameTimeStart;

    let minutes = floor(time / 60000);
    let seconds = floor((time % 60000) / 1000);

    //format
    let Ttext = nf(minutes, 2) + ':' + nf(seconds, 2);

    textSize(20);
    textAlign(RIGHT, CENTER);
    fill(225);
    text(Ttext, width - 25, 41);

  }
}


// ---- SHOW BAR PROGRESS ----
// Map chargeNum to progress in 3 equal segments that line up with the LEDs
function ledProgress(charge, th = thresholds) {
  const [t0, t1, t2] = th;

  // if (charge <= 0 || !heartConnected) return 0;
  if (charge <= 0) return 0;

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
