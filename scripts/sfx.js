var sfx = function() {
  return {
    play: function(fileName) {
      var player = new ChiptuneJsPlayer(new ChiptuneJsConfig(0));
      player.onEnded(function() {
        player = null;
      });
      player.load('./sfx/' + fileName + '.xm', function(buffer) {
        player.play(buffer);
      });
    }
  };
};

module.exports = sfx;
