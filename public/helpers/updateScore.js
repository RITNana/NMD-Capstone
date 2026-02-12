window.updateScoreJSON = function (stationName, points) {
    const scoreMap = {
        brain: "headScore",
        eyeball: "eyeScore",
        bleeding: "bleedingScore",
        tummy: "stomachScore",
        bleedEye: "daisy1Score",
        brainTummy: "daisy2Score",
    };

    const key = scoreMap[stationName];
    if (key) {
        scoreData["000"][key] = points;
    }

    console.log("Updated Score JSON:", scoreData);
}
