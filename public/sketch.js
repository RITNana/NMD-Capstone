// const { createVideo } = require("p5");

//NOTE: Add connecttion light back on

// public/sketch.js
let socket;
//import { createMonster } from "./monster/monster.js";
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

//final task screen video
let finalVid;
let finalVidPlay = false;
let finalVidOver = false;

//score calculation
let scoreData = {
  "000": {
    monsterType: 0,
    headScore: 0,
    eyeScore: 0,
    bleedingScore: 0,
    stomachScore: 0,
    bleedEye: 0,
    brainTummy: 0,
  }
};

//json Vars
let currentSession;
let sessionsData;
let monsterType;

//sounds
let sfx = {};
let bgmList = [];
let currentTrack = 0;

//track port states
let previousPortState = {
  brain: { red: "0", blue: "0" },
  eyeball: { red: "0", blue: "0" },
  bleeding: { red: "0", blue: "0" },
  heart: { red: "0", blue: "0" },
  tummy: { red: "0", blue: "0" }
};

// stations and their states AKA the Hell JSON
let stations = {
  brain: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "brain", inputDelay: false, timerStart: 0, totalTime: 0 },
  eyeball: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "eyeball", inputDelay: false, timerStart: 0, totalTime: 0 },
  bleeding: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "bleeding", inputDelay: false, timerStart: 0, totalTime: 0 },
  heart: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "heart", inputDelay: false, timerStart: 0, totalTime: 0 },
  tummy: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, name: "tummy", inputDelay: false, timerStart: 0, totalTime: 0 },
  bleedEye: { useDaisy: 0, parts: ["bleeding", "eyeball"], progress: 0, partProgress: { bleeding: 0, eyeball: 0 }, name: "bleedEye", inputDelay: false, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, timerStart: 0, totalTime: 0, img: null },
  brainTummy: { useDaisy: 0, parts: ["brain", "tummy"], progress: 0, partProgress: { brain: 0, tummy: 0 }, name: "brainTummy", inputDelay: false, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, timerStart: 0, totalTime: 0, img: null },
};

function preload() {
  bleedingBar = loadImage("media/images/Bleeding.png");
  brainBar = loadImage("media/images/Brain.png");
  tummyBar = loadImage("media/images/Stomach.png");
  eyeBar = loadImage("media/images/Eye.png");

  daisyBleedBar = loadImage("media/images/DaisyBleed.png");
  daisyBrainBar = loadImage("media/images/DaisyBrain.png");

  //set image
  stations.bleedEye.img = daisyBleedBar;
  stations.brainTummy.img = daisyBrainBar;

  headerImage = loadImage("media/images/VitalsBoardLogo.png");
  timerImage = loadImage("media/images/ClockLogo.png");

  //load sound
  sfx.connect = loadSound("media/audio/portConnect.mp3");
  sfx.taskOver = loadSound("media/audio/tasksOver.mp3");
  sfx.tummy = loadSound("media/audio/stomach.mp3");
  sfx.eyeball = loadSound("media/audio/eye.mp3");
  sfx.bleeding = loadSound("media/audio/blood.mp3");
  sfx.brain = loadSound("media/audio/brain.mp3");

  sfx.bg1 = loadSound("media/audio/music/bgm1.mp3");
  sfx.bg2 = loadSound("media/audio/music/bgm2.mp3");
  sfx.bg3 = loadSound("media/audio/music/bgm3.mp3");
  bgmList = [sfx.bg1, sfx.bg2, sfx.bg3];

  //final video
  finalVid = createVideo("media/video/EndScreen.mp4");

  sessionsData = loadJSON("/score");
}

//Feed in the name of the task for newTask or banish to get that task back on screen or banish it as if its complete
let banish = "";
let newTask = "";
let otherNewTask = "";
let useGameLoop = false;
//useDaisy is to use it or not
//daisyTask is the name of the task you have to go through, endTask is the end task , 
//daisyTube is the color of tube going from heart to daisy and chain from daisy to end
let daisy = { useDaisy: false, daisyTask: "", endTask: "", daisyTube: "", chainTube: "" }

let portData = { brain: { red: "0", blue: "0" }, eyeball: { red: "0", blue: "0" }, bleeding: { red: "0", blue: "0" }, heart: { red: "0", blue: "0" }, tummy: { red: "0", blue: "0" } }
let tubeLocation = { red: [], blue: [] }
let gameState = 0;
let gameloop = 0;
let updateGameState = false;
let heartConnected = false;
let heartLast = 0;
//Function to fill in tube location based on portData sudo-returning the locations
function tubeFinder() {

  //sounds for port connection
  for (const station in portData) {

    //red port
    if (portData[station].red !== "0" &&
      previousPortState[station].red === "0") {
      // playSound("connect");
    }

    //blue port
    if (portData[station].blue !== "0" &&
      previousPortState[station].blue === "0") {
      // playSound("connect");
    }

    // Update previous state
    previousPortState[station].red = portData[station].red;
    previousPortState[station].blue = portData[station].blue;
  }

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
let currentLoop = 0;
let gameIndex = 0;

async function initSessionOnServer(sessionId, monsterType) {
  const template = {
    monsterType,
    headScore: 0,
    eyeScore: 0,
    bleedingScore: 0,
    stomachScore: 0,
    bleedEye: 0,
    brainTummy: 0,
  };

  // write each key to sessions.json using your existing route
  await Promise.all(
    Object.entries(template).map(([key, value]) => postScore(sessionId, key, value))
  );

  console.log("session initialized on server:", sessionId, template);
}


function getNextSessionId() {
  // safest version (handles gaps and non-numeric keys)
  const keys = Object.keys(sessionsData || {});
  const nums = keys.map(k => parseInt(k, 10)).filter(n => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) + 1 : 0);
  return String(next);
}

function createNewSession() {
  currentSession = getNextSessionId();
  monsterType = Math.floor(Math.random() * 6);

  // keep local copy in sync so the next press increments correctly
  sessionsData[currentSession] = sessionsData[currentSession] || {};

  // write template to sessions.json
  initSessionOnServer(currentSession, monsterType)
    .then(() => console.log("new session created:", currentSession, "monsterType:", monsterType))
    .catch((e) => console.error("session create failed", e));
}

//test loop
//let loop1 = ["bleeding", "tummy", "bleeding", "bleedEye"];

let loop1 = ["bleeding", "brain", "eyeball", "tummy", "bleedEye", "brain", "tummy", "eyeball", "filler", "brainTummy", "filler"];
let loop2 = ["brain", "bleeding", "tummy", "eyeball", "brainTummy", "eyeball", "tummy", "bleed", "brain", "filler", "filler", "bleedEye", "brainTummy", "filler"];
let loop3 = ["bleeding", "brain", "tummy", "eyeball", "brain", "tummy", "bleeding", "eyeball", "brain", "tummy", "filler"]
let currentTasks = [];
let daisyPartProgress;
let endPartProgress;
//Gameloop 1
function gameLoop1(activeTaskCount) {
  // console.log(activeTaskCount + " | " + currentTasks + " | " + gameIndex)s
  // if(activeTaskCount < 1){
  newTask = loop1[gameIndex];
  otherNewTask = "";
  // }
  // ONLY use snapshot, never currentTasks.length
  if (gameIndex > 4 && activeTaskCount < 1) {
    gameIndex++;
    otherNewTask = loop1[gameIndex];
  }
  if (!loop1[gameIndex] && activeTaskCount === 0) {
    socket.emit("complete", currentSession);
    //play final video
    playFinalVid();
    playSound("taskOver");
    // console.log('done-done')
    return;
  }
  if (!loop1[gameIndex]) return;
}

// Gameloop 2 
function gameLoop2(activeTaskCount) {
  newTask = loop2[gameIndex];
  otherNewTask = "";

  // ONLY use snapshot, never currentTasks.length
  if (gameIndex > 4 && activeTaskCount < 1) {
    gameIndex++;
    otherNewTask = loop2[gameIndex];
  }
  if (!loop2[gameIndex] && activeTaskCount === 0) {
    socket.emit("complete", currentSession);
    //play final video
    playFinalVid();
    // console.log('done-done')
    return;
  }
  if (!loop2[gameIndex]) return;
}
//gameloop 3
function gameLoop3(activeTaskCount) {
  newTask = loop3[gameIndex];
  otherNewTask = "";

  // ONLY use snapshot, never currentTasks.length
  if (gameIndex > 4 && activeTaskCount < 1) {
    gameIndex++;
    otherNewTask = loop2[gameIndex];
  }
  if (!loop3[gameIndex] && activeTaskCount === 0) {
    socket.emit("complete", currentSession);
    //play final video
    playFinalVid();
    // console.log('done-done')
    return;
  }
  if (!loop3[gameIndex]) return;
}


//for initializing the session data to the json
function postScore(sessionId, key, value) {
  return fetch("/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, key, value }),
  }).then((r) => r.json());
}


let newTaskTimer;
let lastNewTaskTimer;
let allowNewTask = true;
function setup() {
  newTaskTimer = millis();
  lastNewTaskTimer = millis();
  createCanvas(720, 400);
  textFont("system-ui");

  //play bgm
  playBGM(currentTrack);

  //background task video
  taskVideo = createVideo("media/video/Background.mp4", () => {
    // make it autoplay-safe
    taskVideo.volume(0); // p5 wrapper volume
    taskVideo.elt.muted = true;
    taskVideo.elt.setAttribute("muted", "");
    taskVideo.elt.setAttribute("playsinline", ""); // iOS Safari inline playback
    taskVideo.loop(); // or .play()
    taskVideo.hide();
  });
  taskVideo.loop();
  taskVideo.hide();

  //final video
  finalVid.volume(0);
  finalVid.elt.muted = true;
  finalVid.elt.setAttribute("muted", "");
  finalVid.elt.setAttribute("playsinline", ""); // iOS Safari inline playback
  finalVid.hide();
  //does NOT loop
  finalVid.elt.onended = () => {
    finalVidOver = true;
    finalVid.pause();
  }

  // same-origin socket.io
  socket = io();
  SocketListeners();

//----KEYBINDS-----
  window.setKeyBinds(socket, {
    setNewTask: (task) => { newTask = task; },
    banishTask: (task) => { banish = task; },
    incrementTask: (taskName, amount = 0.1) => {
      switch (taskName) {
        case "brain": stations.brain.progress += amount; break;
        case "eyeball": stations.eyeball.progress += amount; break;
        case "bleeding": stations.bleeding.progress += amount; break;
        case "tummy": stations.tummy.progress += amount; break;
        case "bleedEye":
          stations.bleedEye.partProgress.bleeding += amount;
          stations.bleedEye.partProgress.eyeball += amount;
          break;
        case "brainTummy":
          stations.brainTummy.partProgress.brain += amount;
          stations.brainTummy.partProgress.tummy += amount;
          break;
      }
    },
    startLoop: (loopNumber) => { //For gameloops
      createNewSession();
      currentLoop = loopNumber;
      gameIndex = 0;
      useGameLoop = true;
      gameOver = false;
      currentTasks.length = 0;
      activeTaskCount = 0;
      newTask = "";
      otherNewTask = "";
      window.gameTimer.init(currentSession, socket, finalVid, playFinalVid, playSound);

      if (loopNumber === 1) gameLoop1(activeTaskCount);
      if (loopNumber === 2) gameLoop2(activeTaskCount);
      if (loopNumber === 3) gameLoop3(activeTaskCount);

      socket.emit("refresh", currentSession);
    },
    manualControl: () => { //For manual control
      currentLoop = 0;
      gameIndex = 0;
      useGameLoop = false;
    }
    //   manualDaisyTask: () => {
    //   daisy.useDaisy = true;
    //   daisy.daisyTask = "bleeding";
    //   daisy.endTask = "eyeball";
    //   stations.bleedEye.inputDelay = true;
    //   console.log("Daisy task activated!");
    // }

  })
}


// ---- Socket Listeners ----
//They should be strings they come from index.js
function SocketListeners() { // nunmber comments are under usual GDC load values
  socket.on("brain-data", (p) => stations.brain.num = (String(p).trim()) * 25);// 2
  socket.on("eyeball-data", (p) => stations.eyeball.num = (String(p).trim()) * 25); //6
  socket.on("bleeding-data", (p) => stations.bleeding.num = (String(p).trim()) * 25); //10
  socket.on("heart-data", (p) => stations.heart.num = (String(p).trim()));
  socket.on("tummy-data", (p) => stations.tummy.num = (String(p).trim()) * 25); //6

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
  newTaskTimer = millis();
  if (newTaskTimer - lastNewTaskTimer > 2000) { allowNewTask = true; }
  if (updateGameState && useGameLoop && allowNewTask) {
    const activeTaskCount = currentTasks.length;
    updateGameState = false;
    gameIndex++;
    if (currentLoop === 1) { gameLoop1(activeTaskCount); };
    if (currentLoop === 2) { gameLoop2(activeTaskCount); };
    if (currentLoop === 3) { gameLoop3(activeTaskCount); };
    lastNewTaskTimer = millis();
    allowNewTask = false;
  }
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
  const daisyMult = 2;

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
      if (
        ((blueDaisy && blueHeart) || //Blue tube Heart to Daisy
          (redDaisy && redHeart)) // Red tube heart to Daisy 
      ) {
        //for the heart -> daisy
        if ((st.name == stations.bleedEye.parts[0]) && daisy.daisyTask == "bleeding" || (st.name == stations.brainTummy.parts[0]) && daisy.daisyTask == "brain") {
          st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1);
          daisyPartProgress = st.progress;
          // console.log("heart -> daisy " + stations.bleedEye.partProgress.bleeding)
        }
        //for the daisy -> end
        if ((st.name == stations.bleedEye.parts[1]) && daisy.endTask == "eyeball" || (st.name == stations.brainTummy.parts[1]) && daisy.endTask == "tummy") {
          if (((blueEnd && blueDaisy) || //blue at end and daisy 
            (redEnd && redDaisy)) //red at end and daisy
          ) {
            st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1);
            endPartProgress = st.progress;
            // console.log("daisy -> end " + stations.bleedEye.partProgress.eyeball)
          }
        };
      }

      if (!st.visible) continue;
      if (st.name == "bleedEye" || st.name == "brainTummy") {
        // if (st.parts.includes(st.name)) {

        if (daisyPartProgress >= 0.995 && endPartProgress >= 0.995) {
          st.dismissing = true;
          // banish = st.name;
          // st.completed = true;
          daisy.useDaisy = false;
          st.dismissStart = millis();
        }
      }
      // dismiss like normal stations

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
      if (t >= 1 || st.name == banish) {
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
        updateScoreJSON(st.name, points);


        //remove from visibleTasks and currentTasks
        let index = currentTasks.indexOf(st.name);
        if (index > -1) currentTasks.splice(index, 1);
        index = visibleTasks.indexOf(st.name);
        if (index > -1) { visibleTasks.splice(index, 1); }
        index = currentTasks.indexOf("filler");
        if (index > -1) currentTasks.splice(index, 1);
        index = visibleTasks.indexOf("filler");
        if (index > -1) { visibleTasks.splice(index, 1); }

        if (st.name == "bleedEye" || st.name == "brainTummy") {
          daisyPartProgress = "";
          endPartProgress = "";
          daisy.useDaisy = false;
        }
        if (st.name == "brainTummy") {
          socket.emit("brain", "stop");
          socket.emit("tummy", "stop");
        }
        if (st.name == "bleedEye") {
          socket.emit("bleed", "stop");
          socket.emit("eyeball", "stop");
        }

        updateGameState = true;
      }
      banish = "";

      st.inputDelay = false; //Possible solution for the first input completion
      socket.emit(`${st.name}`, "stop"); //Trigger stop
    }

    st.inputDelay = true;
    //return a task from completion / reset all values 
    if (st.name === newTask || st.name === otherNewTask) {
      //add sfx
      if (st.name === "bleedEye") {
        //play both
        playSound('bleeding');
        playSound('eyeball');

      } else if (st.name === "brainTummy") {
        //play both
        playSound('brain');
        playSound('tummy');

      } else {
        //single station
        playSound(st.name);
      }

      st.offsetX = 0;
      st.visible = true;
      st.dismissing = false;
      st.fade = 1;
      st.progress = 0;
      st.dismissStart = 0;
      //Reminder that input delay's logic is backwards so if its false it stops the input and true it lets input throu
      st.inputDelay = false;
      currentTasks.push(st.name);
      //timer
      st.timerStart = millis();
      st.totalTime = 0;

      if (st.name == "bleedEye") {
        socket.emit("bleed", "go");
        socket.emit("eyeball", "go");
        daisy.useDaisy = true;
        daisy.daisyTask = "bleeding";
        daisy.endTask = "eyeball";
        stations.bleedEye.inputDelay = true;
        daisyPartProgress = stations.bleedEye.partProgress.bleeding;
        endPartProgress = stations.bleedEye.partProgress.eyeball;
        console.log("daisy bleedEye started");
      }
      if (st.name == "brainTummy") {
        socket.emit("brain", "go");
        socket.emit("tummy", "go");
        daisy.useDaisy = true;
        daisy.daisyTask = "brain";
        daisy.endTask = "tummy";
        stations.brainTummy.inputDelay = true;
        daisyPartProgress = stations.brainTummy.partProgress.brain;
        endPartProgress = stations.brainTummy.partProgress.tummy;
        console.log("daisy brainTummy started");
      }

      socket.emit(`${st.name}`, "go");

      //add task to visibleTasks
      if (!visibleTasks.includes(st.name)) visibleTasks.push(st.name)
      if (st.name === newTask) newTask = "";
      if (st.name === otherNewTask) otherNewTask = "";
    }
    if (newTask == "filler") {
      currentTasks.push("filler");
      console.log('filler added');
      newTask = "";
    }
  }

  // --- STACK STATIONS ---
  for (let i = 0; i < visibleTasks.length; i++) {
    const key = visibleTasks[i];
    const posY = topOffset + i * (barHeight + space);


    //--- DAISY STATIONS ---
    if (key === "bleedEye" || key === "brainTummy") {
      const st = stations[key];

      push();
      translate(st.offsetX, posY);

      //draw two bars
      const parts = st.parts;

      if (parts[0]) {
        noStroke();
        fill(228, 44, 46);
        rect(barX - 10, barY - 10, barW * daisyPartProgress, barH - 10);
      }
      if (parts[1]) {
        noStroke();
        fill(228, 44, 46);
        rect(barX - 10, barY + 44, barW * endPartProgress, barH - 10);
      };

      //draw image
      tint(255, 255 * st.fade);
      image(st.img, centeredX, 0, barWidth, barHeight * daisyMult);
      noTint();

      pop();
      continue;
    }


    //--- NORMAL STATIONS ---
    const st = stations[key];
    //if (!st) continue;

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

  // ---- DRAW FINAL TASK SCREEN VIDEO ----
  if (finalVidPlay) {
    image(finalVid, 0, 0, width, height);
    return;
  }

  // ----GAME TIMER----
  window.gameTimer.update();
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

//----STORE JSON DATA----
localStorage.setItem("sessionScore", JSON.stringify(scoreData));

//final video play function
function playFinalVid() {
  useGameLoop = false;
  gameOver = true;
  finalVidPlay = true;
  finalVidOver = false;

  //rewind vid
  finalVid.time(0);
  finalVid.play();
}


// ----- INTERACTION -----

// Fallback: if the browser still blocks it, a click will start playback
function mousePressed() {
  if (taskVideo && taskVideo.elt && taskVideo.elt.paused) {
    taskVideo.elt.muted = true; // ensure still muted
    taskVideo.play();
  }
  //make sure audio works
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }

}

//import from helper
const toggleFullscreen = fullscreen();

//make full screen
function doubleClicked() {
  toggleFullscreen(document.querySelector('canvas'));
}