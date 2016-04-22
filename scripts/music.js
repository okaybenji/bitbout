var bgm = function(audioCtx) {
  var player = new ChiptuneJsPlayer(new ChiptuneJsConfig(-1, audioCtx));

  return {
    play: function(fileName) {
      if (fileName === 'None') {
        player.stop.call(player);
      } else {
        player.load('./music/' + fileName + '.xm', function(buffer) {
          player.play(buffer);
        });
      }
    }
  };
};

module.exports = bgm;
