// const { createVideo } = require("p5");

// public/sketch.js
let socket;

// mirrors Arduino thresholds
const thresholds = [10, 20, 30];

// the charge nums to be used in front end
let brainNum = 0;
let eyeballNum = 0;
let bleedingNum = 0;
let heartNum = 0;
let tummyNum = 0;

//display progress
let display = {
  brain: 0,
  eyeball: 0,
  bleeding: 0,
  heart: 0,
  tummy: 0,
}

// led states
let leds = [false, false, false];

// video overlay
let taskVideo;
let bleedingBar;
let veinStatus = "";

// slide + fade state
let taskVisible = true;
let dismissing = false;
let dismissStartMs = 0;
let taskOffsetX = 0; // how far we've translated the task to the right
let taskFade = 1; // 1 = fully opaque, 0 = invisible

// completion detection (avoid one-frame spikes)
let fullFrames = 0;
const FULL_FRAMES_TO_CONFIRM = 12; // ~12 frames ≈ 200ms at 60fps

// animation tuneables
const DISMISS_DURATION = 600;


function preload() {
  bleedingBar = loadImage("media/BleedingBar.png");
}

function setup() {
  createCanvas(720, 400);
  textFont("system-ui");

  taskVideo = createVideo("media/Background.mp4", () => {
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
}


// ---- Socket Listeners ----
function SocketListeners() {
  socket.on("brain-data", (payload) => {
    // Accepts strings in numbers
    let charge = String(payload).trim();
    // update model
    brainNum = charge;
    // lightTest(payload,charge);
    // ✅ show user a clear “light connected” hint
    // (you’re printing "ON " / "OFF " from Arduino)
  });

  socket.on("eyeball-data", (payload) => {
    // Accepts strings in numbers

    let charge = String(payload).trim();
    // update model
    eyeballNum = charge;

    // lightTest(payload,charge);
    // ✅ show user a clear “light connected” hint
    // (you’re printing "ON " / "OFF " from Arduino)
  });

  socket.on("bleeding-data", (payload) => {
    // Accepts strings in numbers

    let charge = String(payload).trim();
    // update model
    bleedingNum = charge;

    // lightTest(payload,charge);
    // ✅ show user a clear “light connected” hint
    // (you’re printing "ON " / "OFF " from Arduino)
  });
  socket.on("heart-data", (payload) => {
    // Accepts strings in numbers

    let charge = String(payload).trim();
    // update model
    heartNum = charge;

    // lightTest(payload,charge);
    // ✅ show user a clear “light connected” hint
    // (you’re printing "ON " / "OFF " from Arduino)
  });

  socket.on("tummy-data", (payload) => {
    // Accepts strings in numbers

    let charge = String(payload).trim();
    // update model
    tummyNum = charge;

    // lightTest(payload,charge);
    // ✅ show user a clear “light connected” hint
    // (you’re printing "ON " / "OFF " from Arduino)
  });

}

// colors for the three LEDs (R,G,B)
const ledColors = [
  [255, 70, 70], // red
  [255, 190, 60], // amber
  [60, 220, 100], // green
];

const barX = 261; // adjust these to fit your PNG
const barY = 153;
const barW = 170;
const barH = 15;
let displayedProgress = 0;

const lightTest = (payload, charge) => {
  let light = "";


  if (payload && typeof payload === "object" && "charge" in payload) {
    // new structured payload
    light = String(payload.light || "").trim();
    charge = Number(payload.charge);
  } else {
    // legacy string fallback
    const s = String(payload).trim();            // e.g. "ON 17" or "17"
    const parts = s.split(/\s+/);
    if (parts.length === 1) {
      // just a number
      charge = parseInt(parts[0], 10);
    } else {
      // "ON 17" style
      light = parts[0];
      charge = parseInt(parts[1], 10);
    }
  }

  if (!Number.isFinite(charge)) return;

  leds[0] = charge > thresholds[0];
  leds[1] = charge > thresholds[1];
  leds[2] = charge > thresholds[2];

  veinStatus = (light === "ON") ? "Connected" : "";
}


function draw() {
  background(246);

  // background video stays put
  if (taskVideo) image(taskVideo, 0, 0, width, height);

  // compute progress and smooth it for each station
  //const target = ledProgress(bleedingNum, thresholds);
  displayedProgress.brain = lerp(displayedProgress.brain, ledProgress(brainNum, thresholds), 0.1);
  displayedProgress.eyeball = lerp(displayedProgress.eyeball, ledProgress(eyeballNum, thresholds), 0.1);
  displayedProgress.bleeding = lerp(displayedProgress.bleeding, ledProgress(bleedingNum, thresholds), 0.1);
  displayedProgress.heart = lerp(displayedProgress.heart, ledProgress(heartNum, thresholds), 0.1);
  displayedProgress.tummy = lerp(displayedProgress.tummy, ledProgress(tummyNum, thresholds), 0.1);


  // ---- BLEEDED TASK ----

  // draw the task overlay (progress fill + PNG frame) if visible/animating
  if (taskVisible || dismissing) {
    push();
    translate(taskOffsetX, 0);

    // progress fill under the PNG, faded with taskFade
    noStroke();
    fill(201, 22, 22, 220 * taskFade);
    rect(barX, barY, barW * displayedProgress, barH);

    // PNG container on top, tinted for fade
    tint(255, 255 * taskFade);
    image(bleedingBar, 0, 0, width, height);
    noTint();

    pop();
  }



  // --- OTHERS FOR NOW ----
  drawTaskBar("Brain Scan", displayedProgress.brain, 200, color(80, 180, 255));
  drawTaskBar("Eyeball Exam", displayedProgress.eyeball, 230, color(255, 230, 100));
  drawTaskBar("Heart Pump", displayedProgress.heart, 260, color(255, 120, 180));
  drawTaskBar("Tummy Repair", displayedProgress.tummy, 290, color(120, 255, 150));

  //textSize(20);
  //textStyle(BOLD);
  //noStroke();
  //fill(veinStatus.startsWith("Connected") ? "white" : "red");
  //text(`${veinStatus}`, 440, 165);

  // detect "finished" (progress basically 100%) with a small hold
  if (!dismissing && taskVisible) {
    if (displayedProgress >= 0.995) {
      fullFrames++;
      if (fullFrames >= FULL_FRAMES_TO_CONFIRM) {
        dismissing = true;
        dismissStartMs = millis();
      }
    } else {
      fullFrames = 0;
    }
  }

  // run the slide+fade animation
  if (dismissing) {
    const t = constrain((millis() - dismissStartMs) / DISMISS_DURATION, 0, 1);
    // ease-out: fast at start, slow at end
    const e = 1 - pow(1 - t, 3);
    taskOffsetX = e * (width + 48); // push fully off-right
    taskFade = 1 - e; // fade to 0

    if (t >= 1) {
      dismissing = false;
      taskVisible = false; // stop drawing the overlay
      taskFade = 0;
      veinStatus = "";
    }
  }

  // show the 'connected' text
  if (taskVisible || dismissing) {
    push();
    translate(taskOffsetX, 0);

    // Draw progress fill (bleeding bar)
    noStroke();
    fill(201, 22, 22, 220 * taskFade); // fade with taskFade
    rect(barX, barY, barW * displayedProgress.bleeding, barH);

    // Draw PNG overlay on top
    tint(255, 255 * taskFade);
    image(bleedingBar, 0, 0, width, height);
    noTint();

    // Draw “Connected” text only if veinStatus === "Connected"
    if (veinStatus === "Connected") {
      textSize(20);
      textStyle(BOLD);
      noStroke();
      fill(255, 255 * taskFade);
      text(`${veinStatus}`, 440, 165);
    }

    pop();
  }

}



// ---- DRAW BAR (TEMPORARY) ----
function drawTaskBar(label, progress, y, barColor, overlayImage = null, showVeinStatus = false) {
  if (!taskVisible && !dismissing) return;

  push();
  translate(taskOffsetX, 0); // slide effect

  // background bar
  const x = 180;
  const w = 360;
  const h = 20;
  fill(50, 50, 50, 160);
  rect(x, y, w, h, 4);

  // progress fill
  fill(barColor);
  rect(x, y, w * constrain(progress, 0, 1), h, 4);

  // overlay image if provided
  if (overlayImage) {
    tint(255, 255 * taskFade); // fade with slide
    image(overlayImage, 0, 0, width, height);
    noTint();
  }

  // text label
  noStroke();
  fill(255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text(label, x - 100, y + h / 2);

  // “Connected” text
  if (showVeinStatus && veinStatus === "Connected") {
    textSize(20);
    textStyle(BOLD);
    noStroke();
    fill(255, 255 * taskFade);
    text(`${veinStatus}`, 440, 165);
  }

  pop();
}


//function draw() {
//  background(246);
//  if (taskVideo) image(taskVideo, 0, 0, width, height);
//
//  // target progress based on thresholds/LEDs
//  const target = ledProgress(chargeNum, thresholds);
//
//  // optional smoothing to avoid jitter (0.1 = follow speed)
//  displayedProgress = lerp(displayedProgress, target, 0.1);
//
//  // fill rectangle
//  noStroke();
//  fill(201, 22, 22, 220);
//  rect(barX, barY, barW * displayedProgress, barH);
//
//  // overlay frame last
//  image(bleedingBar, 0, 0, width, height);
//
//}

// ---- SHOW BAR PROGRESS ----
// Map chargeNum to progress in 3 equal segments that line up with the LEDs
function ledProgress(charge, th = thresholds) {
  const [t0, t1, t2] = th

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

//make full screen
function doubleClicked() {
  //get the canvas
  const vid = document.querySelector('canvas');

  if (!document.fullscreenElement) {
    if (vid.requestFullscreen) {
      vid.requestFullscreen();
    }

  } else {
    //exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }

  }
}

//background color change for full screen
function updateFullscreenBG() {
  if (document.fullscreenElement) {
    document.body.style.backgroundColor = "#000000FF";
  } else {
    document.body.style.backgroundColor = "#FFFFFFFF";
  }
}

//event listener
document.addEventListener("fullscreenchange", updateFullscreenBG);

//on load
updateFullscreenBG();

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