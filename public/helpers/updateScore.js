window.updateScoreJSON = function (stationName, points) {
    if (!currentSession) {
        console.error("No active session!");
        return;
    }

    console.log("Current session is:", currentSession);


    let key;

    if (stationName === "brain") key = "headScore";
    if (stationName === "eyeball") key = "eyeScore";
    if (stationName === "bleeding") key = "bleedingScore";
    if (stationName === "tummy") key = "stomachScore";
    if (stationName === "bleedEye") key = "bleedEye";
    if (stationName === "brainTummy") key = "brainTummy";

    if (!key) return;

    console.log("Updating:", currentSession, key, points);

    postScore(currentSession, key, points);
}
