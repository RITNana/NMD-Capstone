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

        // Send updated score to server
        fetch("/score", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessionId: "000",
                key: key,
                value: points
            })
        });
    }


    console.log("Updated Score JSON:", scoreData);
}
