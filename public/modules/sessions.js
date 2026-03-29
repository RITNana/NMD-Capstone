//handles all session code

//for initializing the session data to the json
window.postScore = function (sessionId, key, value) {
    return fetch("/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, key, value }),
    }).then((r) => r.json());
};

//get next session
window.getNextSessionId = function () {
  const keys = Object.keys(sessionsData || {});
  const nums = keys.map(k => parseInt(k, 10)).filter(n => Number.isFinite(n));
  return String(nums.length ? Math.max(...nums) + 1 : 0);
};

//create new session
window.createNewSession = function () {
  currentSession = getNextSessionId();
  monsterType = Math.floor(Math.random() * 6);

  sessionsData[currentSession] = sessionsData[currentSession] || {};

  initSessionOnServer(currentSession, monsterType)
    .then(() => console.log("new session created:", currentSession))
    .catch(e => console.error("session create failed", e));
};

//initialize the session
window.initSessionOnServer = async function(sessionId, monsterType) {
  const template = {
    monsterType,
    headScore: 0,
    eyeScore: 0,
    bleedingScore: 0,
    stomachScore: 0,
    bleedEye: 0,
    brainTummy: 0,
  };

  // write each key to sessions.json using your existing route
  await Promise.all(
    Object.entries(template).map(([key, value]) => postScore(sessionId, key, value))
  );

  console.log("session initialized on server:", sessionId, template);
}

