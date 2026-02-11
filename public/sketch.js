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

// stations and their states AKA the Hell JSON
let stations = {
  brain: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [80, 180, 255], name: "brain", inputDelay: false },
  eyeball: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [255, 230, 100], name: "eyeball", inputDelay: false },
  bleeding: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [201, 22, 22], name: "bleeding", inputDelay: false },
  heart: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [255, 120, 180], name: "heart", inputDelay: false },
  tummy: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [120, 255, 150], name: "tummy", inputDelay: false }
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
let useGameLoop = false;
//useDaisy is to use it or not
//daisyTask is the name of the task you have to go through, endTask is the end task , 
//daisyTube is the color of tube going from heart to daisy and chain from daisy to end
let daisy = {useDaisy: false, daisyTask: "", endTask: "", daisyTube: "", chainTube: ""}

let portData = {brain: {red: "0", blue: "0"}, eyeball: {red: "0", blue: "0"}, bleeding: {red: "0", blue: "0"}, heart: {red: "0", blue: "0"}, tummy: {red: "0", blue: "0"}}
let tubeLocation = {red: [], blue: []}
let gameState = 0;
let gameloop = 0;
let updateGameState = false;
let heartConnected = false;
let heartLast = 0;
//Function to fill in tube location based on portData sudo-returning the locations
function tubeFinder(){
  //reset the json before going
  tubeLocation.red = [];
  tubeLocation.blue = [];
  for(const station in portData){
    if (portData[station].red !== "0"){
      tubeLocation.red.push(station);
    }
    if (portData[station].blue !== "0"){
      tubeLocation.blue.push(station);
    }
  }
}
let currentIndex = 0;
let currentLoop = 0;
let gameIndex = 0;
let loop1 = ["bleeding", "brain", "eyeball", "tummy"];
let loop2 = ["brain", "bleeding", "tummy", "eyeball"];
//Gameloop 1 for Prototype 2
function gameLoop1() {
  if(loop1[gameIndex]){
    newTask = loop1[gameIndex];
    currentIndex = gameIndex;
  }
  else{
    // index = 0;
  }

  // if (state == 1) {
  //   newTask = "bleeding";
  // }
  // else if (state == 2) {
  //   newTask = "brain";
  // }
  // else if (state == 3) {
  //   newTask = "bleeding";
  //   otherNewTask = "brain";

  //   // Daisy in theory
  //   daisy.useDaisy = true;
  //   daisy.daisyTask = "bleeding";
  //   daisy.endTask = "brain";
  // }
  // else if (state == 4) {
  //   newTask = "eyeball";
  // }
  // else if (state == 5) {
  //   newTask = "tummy";
  //   useGameLoop = false;
  // }
}
// Gameloop 2 for Prototype 2
function gameLoop2(state) {
  if(loop2[gameIndex]){
    newTask = loop2[gameIndex];
    currentIndex = gameIndex;
  }
  // if (state == 1) {
  //   newTask = "brain"
  // }
  // if (state == 2) {
  //   newTask = "bleeding"
  // }
  // if (state == 3) {
  //   newTask = "brain"
  //   otherNewTask = "bleeding"
  // }
  // if (state == 4) {
  //   newTask = "tummy"
  // }
  // if (state == 5) {
  //   newTask = "eyeball"
  //   useGameLoop = false;
  // }
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
    if (e.key == "w") {newTask = "brain";}
    if (e.key == "e") {newTask = "eyeball";}
    if (e.key == "q") {newTask = "bleeding";}
    if (e.key == "r") {newTask = "tummy";}
    //these atomize task from the list
    if (e.key == "s") {banish = "brain";}
    if (e.key == "d") {banish = "eyeball";}
    if (e.key == "a") {banish = "bleeding";}
    if (e.key == "f") {banish = "tummy";}
    //reset all pins on a given station
    //these get sent to index.js
    if (e.key == "x") {socket.emit("brain", "reset");}
    if (e.key == "c") {socket.emit("eyeball", "reset");}
    if (e.key == "z") {socket.emit("bleeding", "reset");}
    if (e.key == "v") {socket.emit("tummy", "reset");}
    if (e.key == "b") {socket.emit("heart", "reset");}

    //increment LEFT light threshold
    if (e.key == "7") {socket.emit("brain", "leftIncre");}
    if (e.key == "8") {socket.emit("eyeball", "leftIncre");}
    if (e.key == "6") {socket.emit("bleeding", "leftIncre");}
    if (e.key == "9") {socket.emit("tummy", "leftIncre");}
    if (e.key == "0") {socket.emit("heart", "leftIncre");}
    //decrement LEFT light threshold
    if (e.key == "u") {socket.emit("brain", "leftDecre");}
    if (e.key == "i") {socket.emit("eyeball", "leftDecre");}
    if (e.key == "y") {socket.emit("bleeding", "leftDecre");}
    if (e.key == "o") {socket.emit("tummy", "leftDecre");}
    if (e.key == "p") {socket.emit("heart", "leftDecre");}
    //increment RIGHT light threshold
    if (e.key == "j") {socket.emit("brain", "rightIncre");}
    if (e.key == "k") {socket.emit("eyeball", "rightIncre");}
    if (e.key == "h") {socket.emit("bleeding", "rightIncre");}
    if (e.key == "l") {socket.emit("tummy", "rightIncre");}
    if (e.key == ";") {socket.emit("heart", "rightIncre");}
    //decrement RIGHT light threshold
    if (e.key == "m") {socket.emit("brain", "rightDecre");}
    if (e.key == ",") {socket.emit("eyeball", "rightDecre");}
    if (e.key == "n") {socket.emit("bleeding", "rightDecre");}
    if (e.key == ".") {socket.emit("tummy", "rightDecre");}
    if (e.key == "/") {socket.emit("heart", "rightDecre");}


    if (e.key == "1") { //For gameloop 1
      // gameloop = 1;
      // gameState = 1;
      // updateGameState = true;
      currentLoop = 1;
      gameIndex = 0;
      useGameLoop = true;
      gameLoop1();
    }
    if (e.key == "2") { //For gameloop 2
      // gameloop = 2;
      // gameState = 1;
      gameIndex = 0;
      useGameLoop = true;
      gameLoop2();
    }
    if (e.key == "3") { //For manual control
      // gameloop = 0;
      // gameState = 1;
      // currentLoop = 2;
      gameIndex = 0;
      useGameLoop = false;
    }
    if(e.key == "4"){ //manual daisy task
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
    if(!daisy.useDaisy && st.inputDelay && 
        ((blueHeart && tubeLocation.blue.includes(key)) || 
        (redHeart && tubeLocation.red.includes(key)))){
      st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1);
    }
      

    if(daisy.useDaisy){
      //minimum the hear to the daisy is needed 
      if(st.inputDelay &&
        ((blueDaisy && blueHeart) || //Blue tube Heart to Daisy
          (redDaisy && redHeart)) // Red tube heart to Daisy 
        ){
          //for the heart -> daisy
          if(st.name == daisy.daisyTask) {st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1);} 
          //for the daisy -> end
          else if (st.name == daisy.endTask){
            if(((blueEnd && blueDaisy) || //blue at end and daisy 
                (redEnd && redDaisy)) //red at end and daisy
            ){st.progress = lerp(st.progress, ledProgress((st.num), thresholds), 0.1);}
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
        if(useGameLoop){
        gameIndex++;
        if(currentLoop === 1){ gameLoop1();};
        if(currentLoop === 2){ gameLoop2();};
      }
        //remove from visibleTasks
        const index = visibleTasks.indexOf(st.name);
        if (index > -1) visibleTasks.splice(index, 1);
      }
      banish = ""
      // gameState++;
      // updateGameState = true;
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
  if (updateGameState) {
    if (gameloop == 1) {
      gameIndex = 0;
      gameLoop1();
    }
    // if (gameloop == 2) {
    //   gameLoop2(gameState);
    // }
    // updateGameState = false;
  }
}


// ---- SHOW BAR PROGRESS ----
// Map chargeNum to progress in 3 equal segments that line up with the LEDs
function ledProgress(charge, th = thresholds) {
  const [t0, t1, t2] = th;

  // if (charge <= 0 || !heartConnected) return 0;
  if(charge <= 0) return 0;

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
