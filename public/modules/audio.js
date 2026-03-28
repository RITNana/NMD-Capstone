//play sounds helpers

//volumes
let sfxVolume = 0.6;
let bgmVolume = 0.4;

//sound affects
window.playSound = function (name, loop = false, volume = sfxVolume) {
  const sound = sfx[name];
  if (!sound || !sound.isLoaded()) return;

  sound.setVolume(volume);

  if (loop) {
    if (!sound.isPlaying()) {
      sound.loop();
    }
  } else {
    //prevent overlapping sound
    if (!sound.isPlaying()) {
      sound.play();
    }
  }
}


//for background music
window.playBGM = function (currentTrack, volume = bgmVolume) {
  let track = bgmList[currentTrack];

  track.setVolume(volume);
  track.play();

  //play next track
  track.onended(() => {
    currentTrack++;
    if (currentTrack >= bgmList.length) {
      //start over
      currentTrack = 0;
    }
    playBGM(currentTrack);
  });
}