//play sounds helpers

//sound affects
function playSound(name, loop = false) {
  const sound = sfx[name];
  if (!sound || !sound.isLoaded()) return;

  if (loop) {
    if (!sound.isPlaying()) sound.loop();
  } else {
    sound.play();
  }
}


//for background music
function playBGM(currentTrack) {
  let track = bgmList[currentTrack];
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