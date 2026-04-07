//handles all ui
//functions made for making chnaging the ui easier in the future

//scale is .37
let scale = .37;

//all varibles for station layouts
window.getStationLayout = function () {
  //let scale = min(width / 1080, height / 1920);

  const barWidth = 682 * scale;
  const barHeight = 213 * scale;
  const centeredX = (width - barWidth) / 2;

  return {
    barWidth,
    barHeight,
    centeredX,
  }
};

//handles the station layout images
window.stationLayouts = {};

//handles all th drawing of the stations
window.drawStations = function ({
  visibleTasks,
  stations,
  centeredX,
  barWidth,
  barHeight,
  gameState
}) {

  const topOffset = 113;
  const space = 11;
  const daisyMult = 2;

  const barX = 325;
  const barY = 43;
  const barW = 135;
  const barH = 16;

  for (let i = 0; i < visibleTasks.length; i++) {
    const key = visibleTasks[i];
    const st = stations[key];
    const layout = window.stationLayouts[key];

    const posY = topOffset + i * (barHeight + space);
    const posX = 220;

    //heart no image
    if (key === "heart") {
      st.image = null;
    } else if (layout) {
      const connected = window.isConnected(key, gameState);
      st.image = connected ? layout.on : layout.off;
    }


    push();
    translate(posX, posY);

    //daisy stations
    if (key === "bleedEye" || key === "brainTummy") {

      //draw two bars
      const parts = st.parts;

      if (parts[0] && window.daisyPartProgress < 1) {
        noStroke();
        fill(228, 44, 46);

        //clamp
        const Progress1 = Math.min(window.daisyPartProgress, 1);
        rect(barX, barY + 2, barW * Progress1, barH);
        //rect(barX, barY + 2, barW, barH);
      }
      if (parts[1] && window.endPartProgress < 1) {
        noStroke();
        fill(228, 44, 46);

        //clamp
        const Progress2 = Math.min(window.endPartProgress, 1);
        rect(barX, barY + 71, barW * Progress2, barH);
        //rect(barX, barY + 71, barW, barH);

      };

      //draw image
      tint(255, 255 * st.fade);
      image(st.image, centeredX, 0, barWidth, barHeight * daisyMult);
      noTint();

    } else {
      //normal stations

      //clamp
      const progress = Math.min(st.progress, 1);

      if (progress < 1) {
        noStroke();
        fill(228, 44, 46);
        rect(barX, barY, barW * progress, barH);
        //rect(barX, barY, barW, barH);
      }

      if (st.image) {
        tint(255, 255 * st.fade);
        image(st.image, centeredX, 0, barWidth, barHeight);
        noTint();
      } else {
        noTint();
      }
    }

    pop();
  }

};

let headScale = .37;
let timeScale = .06;

window.makeUI = function (header, timer) {
  //header
  if (header) {
    w = width * headScale;
    h = w * (header.height / header.width);
    image(header, 1207 * scale, 45 * scale, w, h);
  }
  if (timer) {
    w = width * timeScale;
    h = w * (timer.height / timer.width);
    image(timer, 317 * scale, 74 * scale, w, h);
  }
}


//maps chargeNum to progress
//this is an old function (i dont really remember what it does exactly)
window.ledProgress = function (charge, th = thresholds) {
  const [t0, t1, t2] = th;

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

window.isConnected = function (key, gameState) {
  if (!gameState) return false;

  const { blueHeart, redHeart, blueDaisy, redDaisy, tubeLocation } = gameState;

  const isDaisy = (key === "bleedEye" || key === "brainTummy");

  if (isDaisy) {
    return (
      (blueDaisy && blueHeart) ||
      (redDaisy && redHeart)
    );
  }

  return (
    (blueHeart && tubeLocation.blue.includes(key)) ||
    (redHeart && tubeLocation.red.includes(key))
  );
};