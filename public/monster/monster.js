// animation stuff
let fullFrames = 0;
const FULL_FRAMES_TO_CONFIRM = 12; // ~12 frames ≈ 200ms at 60fps
const DISMISS_DURATION = 600;

// video overlay
let taskVideo;

//png animation
let anim;

// Scoring Principles:
// 0-5s : 45-50 points + multiplier (between 6.0 and 8.0 multiplier) - Good Monster Parts
// 5-10s : 35 - 40 points + multiplier (between 3.0 and 5.0) - Medium Monster Parts
// 10-14s : 30-35 points + multiplier (between 1.5 and 3.0) // Medium + Bad Monster Parts
// 15s + : 25 points (no multiplier ) - Bad Monster Part

let stringSesh = "000";

let cycleDuration = 3000;
let startTime;
let totalTaskTime;
let timeLimit = 45; // testing for a 45 second game 
let globalCountdown;

let bgImg;
//let idleVid;

let score = 0;
let taskSum = 0;
let totalScore = 0;
//let multiplier;
let scoringComplete = false;

let scored_0_5 = false;
let scored_5_10 = false;
let scored_10_14 = false;
let scored_15 = false;


let sessionData;

let complete = false;

let monsterTypes = ["cat", "demon", "mummy", "lava", "spider", "wolf"];
let chosenMonster;

let monsterVids = [
    "media/video/monsters/monster_1.mp4",
    "media/video/monsters/monster_2.mp4",
    "media/video/monsters/monster_3.mp4",
    "media/video/monsters/monster_4.mp4",
    "media/video/monsters/monster_5.mp4",
    "media/video/monsters/monster_6.mp4",
];


function preload() {
    // Load JSON data
    //sessionData = loadJSON("sessions.json");

    // choose monster BEFORE setup
    chosenMonster = random(monsterTypes);
    console.log("Chosen monster:", chosenMonster);

    //bgImg = loadImage("media/background.png");

}


function setup() {
    createCanvas(780, 1528);
    textFont("system-ui");

    taskVideo = createVideo(`../media/video/monsters/${chosenMonster}.mp4`, () => {
        // make it autoplay-safe
        taskVideo.volume(0); // p5 wrapper volume
        taskVideo.elt.muted = true; // HTML video must be muted
        taskVideo.elt.setAttribute("muted", "");
        taskVideo.elt.setAttribute("playsinline", ""); // iOS Safari inline playback
        taskVideo.loop(); // or .play()
        taskVideo.hide(); // we’ll draw it to the canvas
    });
    taskVideo.hide();

    // Record start time
    // startTime = millis();

    //png sequence test
    //anim = new pngAnimation('../media/BleedPNG', 81, 6)
    //anim.play();

}

function draw() {
    background(0);
    if (taskVideo) image(taskVideo, 0, 0, width, height);

    startTime = int(millis() / 1000); // converted to seconds for testing
    totalTaskTime = startTime

    globalCountdown = timeLimit - startTime

    if (complete) {

    } else {
        background(0);
        if (taskVideo) image(taskVideo, 0, 0, width, height);
    }

    if (!scoringComplete) {
        if (totalTaskTime >= 5 && !scored_0_5) {
            let taskResult = scoring()
            scored_0_5 = true;
            totalScore += taskResult
        }

        if (totalTaskTime >= 10 && !scored_5_10) {
            let taskResult = scoring()
            scored_5_10 = true;
            totalScore += taskResult
        }

        if (totalTaskTime >= 14 && !scored_10_14) {
            let taskResult = scoring()
            scored_10_14 = true
            totalScore += taskResult
        }

        if (totalTaskTime >= 15 && !scored_15) {
            let taskResult = scoring()
            scored_15 = true
            totalScore += taskResult
        }
    }

    if (totalTaskTime >= 30) {
        totalTaskTime = 0
        scoringComplete = true
    }



    if (globalCountdown < 0) {
        globalCountdown = 0
    }



    textSize(22);
    fill("white");
    text("Score: " + totalScore, 300, 50);

    textSize(22);
    fill("white");
    text("Timer: " + totalTaskTime, 300, 20);

    textSize(45);
    fill("red")
    text(globalCountdown, 240, 60)
}


// ----- SCORING -----

function scoring() {
  if (totalTaskTime > 0 && totalTaskTime <= 5) {
    score = int(random(45, 51))
    multiplier = int(random(6.0, 8.1))
    taskSum = score * multiplier
    console.log("Excellent! " + taskSum)
    return taskSum
  }
  else if (totalTaskTime > 5 && totalTaskTime <= 10) {
    score = int(random(35, 41))
    multiplier = int(random(3.0, 5.1))
    taskSum = score * multiplier
    console.log("Not too shabby " + taskSum)
    return taskSum
  } else if (totalTaskTime > 10 && totalTaskTime <= 14) {
    score = int(random(30, 36))
    multiplier = int(random(1.5, 3.1))
    taskSum = score * multiplier
    console.log("You can do better " + taskSum)
    return taskSum
  } else if (totalTaskTime >= 15) {
    score = 25
    taskSum = score
    print("Are you even trying? " + taskSum)
    return taskSum
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