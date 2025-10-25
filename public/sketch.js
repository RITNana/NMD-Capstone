// const { createVideo } = require("p5");

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
const barX = 261;
const barY = 153;
const barW = 170;
const barH = 15;

// stations and their states
let stations = {
  brain: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [80, 180, 255] },
  eyeball: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [255, 230, 100] },
  bleeding: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [201, 22, 22] },
  //heart: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [255, 120, 180] },
  tummy: { num: 0, progress: 0, visible: true, dismissing: false, offsetX: 0, fade: 1, dismissStart: 0, color: [120, 255, 150] }
};


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
  socket.on("brain-data", (p) => stations.brain.num = Number(String(p).trim()));
  socket.on("eyeball-data", (p) => stations.eyeball.num = Number(String(p).trim()));
  socket.on("bleeding-data", (p) => stations.bleeding.num = Number(String(p).trim()));
  socket.on("heart-data", (p) => stations.heart.num = Number(String(p).trim()));
  socket.on("tummy-data", (p) => stations.tummy.num = Number(String(p).trim()));
}


// ---- DRAW STATIONS ----
function draw() {
  background(0);
  if (taskVideo) image(taskVideo, 0, 0, width, height);

  // vertical placement for each station (stacked layout)
  const positions = {
    bleeding: { y: 0 },
    brain: { y: 60 },
    eyeball: { y: 120 },
    tummy: { y: 180 }
  };

  // iterate through each station
  for (const key in stations) {
    const st = stations[key];
    const posY = positions[key].y;

    // smooth progress update
    st.progress = lerp(st.progress, ledProgress(st.num, thresholds), 0.1);

    // detect completion
    if (!st.dismissing && st.visible && st.progress >= 0.995) {
      st.dismissing = true;
      st.dismissStart = millis();
    }

    // handle dismissal animation
    if (st.dismissing) {
      const t = constrain((millis() - st.dismissStart) / DISMISS_DURATION, 0, 1);
      const e = 1 - pow(1 - t, 3);
      st.offsetX = e * (width + 48);
      st.fade = 1 - e;
      if (t >= 1) {
        st.dismissing = false;
        st.visible = false;
        st.fade = 0;
      }
    }

    // draw station overlay
    if (st.visible || st.dismissing) {
      push();
      translate(st.offsetX, posY);

      // progress fill
      noStroke();
      fill(st.color[0], st.color[1], st.color[2], 220 * st.fade);
      rect(barX, barY, barW * st.progress, barH);

      // overlay PNG (reusing bleedingBar)
      tint(255, 255 * st.fade);
      image(bleedingBar, 0, 0, width, height);
      noTint();

      // label text
      textSize(20);
      textStyle(BOLD);
      noStroke();
      fill(255, 255 * st.fade);
      textAlign(LEFT, CENTER);
      const labelX = barX + 200;
      text(key.toUpperCase(), labelX, barY + barH / 2);

      pop();
    }
  }
}


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