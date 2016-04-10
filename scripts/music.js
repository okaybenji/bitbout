var bgm = function() {
  var player = new ChiptuneJsPlayer(new ChiptuneJsConfig(-1));

  return {
    play: function(fileName) {
      if (fileName === 'None') {
        player.stop.call(player);
      } else {
        player.load('../music/' + fileName, function(buffer) {
          player.play(buffer);
        });
      }
    }
  };
};

module.exports = bgm;
