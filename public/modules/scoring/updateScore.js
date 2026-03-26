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

    //get current scores
    const applyScore = (key, pts, method) => {
        fetch("/score")
            .then(res => res.json())
            .then(data => {
                let currentValue = data[currentSession]?.[key] || 0;
                let newTotal;

                // add the scores
                if (method === "add") {
                    newTotal = currentValue + pts;
                } else { //average
                    newTotal = currentValue > 0 ? Math.floor((currentValue + pts) / 2) : pts;
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
    }

    //combined tasks
    if (stationName === "bleedEye") {
        let halfPoints = Math.floor(points / 2);
        applyScore("bleedingScore", halfPoints, "add");
        applyScore("eyeScore", halfPoints, "add");
        applyScore("bleedEye", points);
        return;
    }
    if (stationName === "brainTummy") {
        let halfPoints = Math.floor(points / 2);
        applyScore("headScore", halfPoints, "add");
        applyScore("stomachScore", halfPoints, "add");
        applyScore("brainTummy", points);
        return;
    }

    //normal tasks
    const key = scoreMap[stationName];
    if (!key) return;
    applyScore(key, points);

};
