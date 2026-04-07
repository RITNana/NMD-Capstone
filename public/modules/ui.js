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
}) {

  const topOffset = 113;
  const space = 11;
  const daisyMult = 2;

  const barX = 325;
  const barY = 43;
  const barW = 135;
  const barH = 16;

  // Ensure images are assigned ONCE per frame
  for (const key in stations) {
    if (window.stationLayouts[key]) {
      stations[key].image = window.stationLayouts[key].img;
    }
  }

  for (let i = 0; i < visibleTasks.length; i++) {
    const key = visibleTasks[i];
    const st = stations[key];
    const posY = topOffset + i * (barHeight + space);
    const posX = 220;


    push();
    translate(posX, posY);

    //daisy stations
    if (key === "bleedEye" || key === "brainTummy") {

      //draw two bars
      const parts = st.parts;

      if (parts[0]) {
        noStroke();
        fill(228, 44, 46);
        //rect(barX, barY, barW * window.daisyPartProgress, barH);
        rect(barX, barY + 2, barW, barH);
      }
      if (parts[1]) {
        noStroke();
        fill(228, 44, 46);
        //rect(barX, barY + 44, barW * window.endPartProgress, barH);
        rect(barX, barY + 71, barW, barH);

      };

      //draw image
      tint(255, 255 * st.fade);
      image(st.image, centeredX, 0, barWidth, barHeight * daisyMult);
      noTint();

    } else {
      //normal stations
      fill(228, 44, 46);
      //rect(barX, barY, barW * st.progress, barH);
      rect(barX, barY, barW, barH);

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

