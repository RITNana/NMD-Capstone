window.updateScoreJSON = function (stationName, points) {
    if (!currentSession) {
        console.error("No active session!");
        return;
    }


    //console.log("Current session is:", currentSession);


    const scoreMap = {
        brain: "headScore",
        eyeball: "eyeScore",
        bleeding: "bleedingScore",
        tummy: "stomachScore",
        bleedEye: "bleedEye",
        brainTummy: "brainTummy"
    };


    let key = scoreMap[stationName];
    if (!key) return;

    //get current scores
    fetch("/score")
        .then(res => res.json())
        .then(data => {
            let currentValue = data[currentSession]?.[key] || 0;
            let newTotal;

            //average the scores
            if (currentValue > 0) {
                newTotal = (currentValue + points) / 2;
                newTotal = Math.floor(newTotal);
            } else {
                newTotal = points;
            }

            //send updated value
            return fetch("/score", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sessionId: currentSession,
                    key: key,
                    value: newTotal
                })
            });
        })
        .then(res => res.json())
        .then(result => {
            console.log("score updated!!", result);
        })
        .catch(err => {
            console.error("Error updating:", err);
        })
};
