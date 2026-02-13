let stringSesh = "000";

let startTime;
let totalTaskTime;
let timeLimit = 45;
let globalCountdown;

let bgImg;
let taskVideo;

let score = 0;
let taskSum = 0;
let totalScore = 0;
let multiplier;
let scoringComplete = false;

let scored_0_5 = false;
let scored_5_10 = false;
let scored_10_14 = false;
let scored_15 = false;

let sessionData;
let sessionSet;

let complete = false;

let transitionPlaying = false;

let monsterTypes = ["cat", "demon", "mummy", "lava", "spider", "wolf"];
let monsterType;

let finalBgImg = null;
let finalBgLoading = false;
let finalBgError = false;

//fonts
let pixelFont;
let dogicaFont;

// animation stuff
let transitionSequence;
let fullFrames = 0;

const TRANSITION_FRAMES = 70;
const TRANSITION_FPS = 36;
const TRANSITION_MS = (TRANSITION_FRAMES / TRANSITION_FPS) * 1000;

let transitionStartMs = 0;




/* STATION -> Monster counterpart
   STOMACH: Torso
   BRAINS: Arms
   HEAD: Eyes
   BLEEDING: Legs  (if you truly mean arms, swap the mapping below)
*/

// ---------- Modular part state ----------
const PARTS = ["leftArm", "rightArm", "torso", "head", "leftLeg", "rightLeg"];

// holds loaded p5.Image objects per part
let monsterImgs = {};
let monsterLoading = {};
let monsterError = {};

for (const p of PARTS) {
  monsterImgs[p] = null;
  monsterLoading[p] = false;
  monsterError[p] = "";
}

// Which limb score drives which part quality
// NOTE: If BLEEDING should drive ARMS instead of LEGS, change leftLeg/rightLeg to brainScore or bleedingScore accordingly.
const SCORE_FOR_PART = {
  torso: (s) => s.stomachScore,
  leftArm: (s) => s.brainScore,
  rightArm: (s) => s.brainScore,
  head: (s) => s.eyeScore,
  leftLeg: (s) => s.bleedingScore,
  rightLeg: (s) => s.bleedingScore,
};


// Draw order (back -> front)
const LAYERS = ["leftArm", "rightArm", "leftLeg", "rightLeg", "torso", "head"];

// If scoreCalc.js defines generateScores() globally (non-module)
let scores;

function preload() {
  sessionData = loadJSON("/score");
  bgImg = loadImage("/media/background.png"); //fallback
  pixelFont = loadFont("/media/fonts/MatrixtypeDisplayBold-6R4e6.ttf");
  dogicaFont = loadFont("/media/fonts/dogica.ttf")
  transitionSequence = new pngAnimation("/media/TransitionOverlays", 70, 36)
}

function setup() {
  //createCanvas(780, );
  createCanvas(1078, 1915);
  imageMode(CORNER);

  //need to grab the session string from the current sessoin and make that what needs to be reffered to 

  const keys = Object.keys(sessionData || {});
  console.log("available sessions:", keys);

  if (keys.length === 0) {
    console.error("No sessions found in /score");
    noLoop();
    return;
  }

  // If your session ids are numeric strings like "0","1","2"... use this safer sort:
  const latestKey = keys.sort((a, b) => Number(a) - Number(b)).at(-1);

  // If they’re NOT numeric, use this instead:
  // const latestKey = keys.at(-1);

  stringSesh = latestKey;
  sessionSet = sessionData[stringSesh];

  scores = {
    head: sessionSet.headScore || 0,
    eyes: sessionSet.eyeScore || 0,
    stomach: sessionSet.stomachScore || 0,
    bleeding: sessionSet.bleedingScore || 0
  };

  console.log("Loaded scores:", scores);


  if (!sessionSet) {
    console.error("Session not found:", stringSesh);
    noLoop();
    return;
  }

  console.log("using session:", stringSesh, sessionSet);


  //monsterType = "wolf";
  monsterType = monsterTypes[sessionSet.monsterType];
  console.log("monsterType:", monsterType);
  // Load monster-specific final background: "<monsterType>-finalcard.png"
  finalBgLoading = true;
  finalBgError = false;
  finalBgImg = null;

  const finalBgPath = `/media/${monsterType}/${monsterType}-finalcard.png`;
  console.log("loading final bg:", finalBgPath);

  loadImage(
    finalBgPath,
    (img) => {
      finalBgImg = img;
      finalBgLoading = false;
      console.log("Loaded final bg OK:", finalBgPath);
    },
    (err) => {
      finalBgLoading = false;
      finalBgError = true;
      console.error("Failed to load final bg:", finalBgPath, err);
    }
  );


  // Create task video
  taskVideo = createVideo(`/media/${monsterType}/${monsterType}.mp4`, () => {
    taskVideo.volume(0);
    taskVideo.elt.muted = true;
    taskVideo.elt.setAttribute("muted", "");
    taskVideo.elt.setAttribute("playsinline", "");
    taskVideo.loop();
    taskVideo.hide();
  });
  taskVideo.loop();
  taskVideo.hide();

  //scores = generateScores();
  //console.log("stomach score:", scores.stomachScore);
}

// Load one part based on its mapped score -> quality -> file path
function loadMonsterPart(part) {
  const limbScore = SCORE_FOR_PART[part](sessionSet);
  const q = limbQuality(limbScore);
  const path = `/media/${monsterType}/${q}/${q}-${part}.png`;

  console.log(`loading ${part}:`, path);

  monsterLoading[part] = true;
  monsterError[part] = "";
  monsterImgs[part] = null;

  loadImage(
    path,
    (img) => {
      monsterImgs[part] = img;
      monsterLoading[part] = false;
      console.log(`Loaded ${part} OK:`, path);
    },
    (err) => {
      monsterLoading[part] = false;
      monsterError[part] = path;
      console.error(`Failed to load ${part}:`, path, err);
    }
  );
}

//INSTEAD OF THE BUTTON
//have this trigger as a result of the game ending
function createMonster() {
  if (complete) return;
  complete = true;

  transitionPlaying = true;
  transitionSequence.play();
  transitionStartMs = millis();

  // reset + load monster parts
  for (const p of PARTS) {
    monsterImgs[p] = null;
    monsterLoading[p] = false;
    monsterError[p] = "";
  }
  for (const p of PARTS) loadMonsterPart(p);
}

function drawMonster(x = 0, y = 0, w = width, h = height) {
  for (const part of LAYERS) {
    const img = monsterImgs[part];
    if (img) image(img, x, y, w, h);
  }
}


function drawGlowingText(txt, x, y, {
  font,
  size = 100,
  glowColor = [255, 255, 255],
  glowAlpha = 60,
  glowRadius = 4,
  mainColor = [255, 255, 255],
  mainAlpha = 220
}) {
  push();
  textFont(font);
  textAlign(CENTER, CENTER);

  // glow layer(s)
  fill(glowColor[0], glowColor[1], glowColor[2], glowAlpha);
  for (let dx = -glowRadius; dx <= glowRadius; dx++) {
    for (let dy = -glowRadius; dy <= glowRadius; dy++) {
      if (dx !== 0 || dy !== 0) {
        textSize(size);
        text(txt, x + dx, y + dy);
      }
    }
  }

  // main text
  fill(mainColor[0], mainColor[1], mainColor[2], mainAlpha);
  textSize(size);
  text(txt, x, y);

  pop();
}


function draw() {
  totalTaskTime = int(millis() / 1000);
  globalCountdown = timeLimit - totalTaskTime;
  if (globalCountdown < 0) globalCountdown = 0;

  if (complete) {



    if (finalBgImg) {
      image(finalBgImg, 0, 0, width, height);
    } else {
      image(bgImg, 0, 0, width, height);
    }


    if (monsterType == "wolf" || monsterType == "spider") {
      const scale = 0.65;
      drawMonster(200, 300, width * scale, height * scale);
    }
    else {
      const scale = 0.58;
      drawMonster(250, 370, width * scale, height * scale);
    }

    totalScore = scores.head + scores.eyes + scores.stomach + scores.bleeding;

    textAlign(LEFT)


    //fill(255, 191);
    //textFont(pixelFont);
    //textSize(115);
    //textAlign(CENTER, CENTER);
    //text(totalScore, 830, 1620);

    drawGlowingText(
      totalScore,
      830,
      1620,
      {
        font: pixelFont,
        size: 115,
        glowColor: [255, 255, 255], // white glow
        glowAlpha: 5,              // subtle
        glowRadius: 5,              // small halo
        mainColor: [255, 255, 255],
        mainAlpha: 200
      }
    );


    textFont(dogicaFont);

    textSize(29);
    drawGlowingText(
      `Head Score: ${scores.head}`,
      320,
      1560,
      {
        font: dogicaFont,
        size: 29,
        glowColor: [255, 255, 255], // white glow
        glowAlpha: 5,              // subtle
        glowRadius: 5,              // small halo
        mainColor: [255, 255, 255],
        mainAlpha: 200
      }
    );
    //text(`Head Score: ${sessionSet.headScore}`, 310, 1560)
    drawGlowingText(
      `Eye Score: ${scores.eyes}`,
      305,
      1610,
      {
        font: dogicaFont,
        size: 29,
        glowColor: [255, 255, 255], // white glow
        glowAlpha: 5,              // subtle
        glowRadius: 5,              // small halo
        mainColor: [255, 255, 255],
        mainAlpha: 200
      }
    );
    //text(`Eye Score: ${sessionSet.eyeScore}`, 295, 1610)
    drawGlowingText(
      `Stomach Score: ${scores.stomach}`,
      365,
      1660,
      {
        font: dogicaFont,
        size: 29,
        glowColor: [255, 255, 255], // white glow
        glowAlpha: 5,              // subtle
        glowRadius: 5,              // small halo
        mainColor: [255, 255, 255],
        mainAlpha: 200
      }
    );
    //text(`Stomach Score: ${sessionSet.stomachScore}`, 355, 1660)
    drawGlowingText(
      `Bleeding Score: ${scores.bleeding}`,
      380,
      1710,
      {
        font: dogicaFont,
        size: 29,
        glowColor: [255, 255, 255], // white glow
        glowAlpha: 5,              // subtle
        glowRadius: 5,              // small halo
        mainColor: [255, 255, 255],
        mainAlpha: 191
      }
    );
    //text(`Bleeding Score: ${sessionSet.bleedingScore}`, 370, 1710)

    textFont("sans-serif");

    if (finalBgLoading) {
      fill(255);
      textSize(14);
      text("Loading final card...", 20, 20);
    } else if (finalBgError) {
      fill(255, 100, 100);
      textSize(14);
      text("Final card missing (using fallback bg)", 20, 20);
    }

    //play TransitionOverlays png sequence here
    //transitionSequence.play();
    if (transitionPlaying) {
      transitionSequence.draw(0, 0, width, height);

      if (millis() - transitionStartMs >= TRANSITION_MS) {
        transitionPlaying = false; // stop drawing after one run
      }
    }


  }
  else {
    background(0);
    if (taskVideo) image(taskVideo, 0, 0, width, height);
  }

  // Scoring gates
  if (!scoringComplete) {
    if (totalTaskTime >= 5 && !scored_0_5) { totalScore += scoring(); scored_0_5 = true; }
    if (totalTaskTime >= 10 && !scored_5_10) { totalScore += scoring(); scored_5_10 = true; }
    if (totalTaskTime >= 14 && !scored_10_14) { totalScore += scoring(); scored_10_14 = true; }
    if (totalTaskTime >= 15 && !scored_15) { totalScore += scoring(); scored_15 = true; }
  }

  if (totalTaskTime >= timeLimit) scoringComplete = true;


}

function limbQuality(limbScore) {
  if (limbScore <= 200) return "bad";
  if (limbScore <= 399) return "medium";
  return "good";
}

function scoring() {
  if (totalTaskTime > 0 && totalTaskTime <= 5) {
    score = int(random(45, 51));
    multiplier = random(6.0, 8.1);
    taskSum = int(score * multiplier);
    return taskSum;
  } else if (totalTaskTime > 5 && totalTaskTime <= 10) {
    score = int(random(35, 41));
    multiplier = random(3.0, 5.1);
    taskSum = int(score * multiplier);
    return taskSum;
  } else if (totalTaskTime > 10 && totalTaskTime <= 14) {
    score = int(random(30, 36));
    multiplier = random(1.5, 3.1);
    taskSum = int(score * multiplier);
    return taskSum;
  } else {
    return 25;
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