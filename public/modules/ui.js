//handles all ui
//functions made for making chnaging the ui easier in the future

//all varibles for station layouts
window.getStationLayout = function () {
  const ratio = 357 / 4308;
  const barWidth = width * 0.9;
  const barHeight = barWidth * ratio;
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

  const topOffset = 90;
  const space = 24;
  const daisyMult = 2;

  const barX = 282;
  const barY = 27;
  const barW = 375;
  const barH = 30;

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

    push();
    translate(st.offsetX, posY);

    //daisy stations
    if (key === "bleedEye" || key === "brainTummy") {

      //draw two bars
      const parts = st.parts;

      if (parts[0]) {
        noStroke();
        fill(228, 44, 46);
        rect(barX - 10, barY - 10, barW * window.daisyPartProgress, barH - 10);
      }
      if (parts[1]) {
        noStroke();
        fill(228, 44, 46);
        rect(barX - 10, barY + 44, barW * window.endPartProgress, barH - 10);
      };

      //draw image
      tint(255, 255 * st.fade);
      image(st.image, centeredX, 0, barWidth, barHeight * daisyMult);
      noTint();

    } else {
      //normal stations
      fill(228, 44, 46);
      rect(barX - 10, barY - 10, barW * st.progress, barH - 10);

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

