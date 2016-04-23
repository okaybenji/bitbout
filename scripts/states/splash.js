var Splash = function(game) {
  var splash = {
    create: function() {
      game.bgm.play('title');

      // add forest as title bg
      var stageBuilder = require('../stageBuilder')(game);
      stageBuilder.buildBackgrounds();

      var title = game.add.sprite(0, 0, 'title');
      title.animations.add('title');
      title.animations.play('title', 32/3, true);

      var padNames = ['pad1', 'pad2', 'pad3', 'pad4'];

      var unassignStartButtons = function() {
        padNames.forEach(function(padName) {
          var startButton = game.input.gamepad[padName].getButton(Phaser.Gamepad.XBOX360_START);
            if (startButton) {
              startButton.onDown.forget();
            }
        });
      };

      var startGame = function startGame() {
        unassignStartButtons();

        if (game.state.current === 'splash') {
          game.bgm.play('None');
          game.state.start('play');
        }
      };

      // start game when start/enter is pressed
      var assignStartButtons = function() {
        unassignStartButtons();

        padNames.forEach(function(padName) {
          var startButton = game.input.gamepad[padName].getButton(Phaser.Gamepad.XBOX360_START);
          if (startButton) {
            startButton.onDown.addOnce(startGame);
          }
        });
      };

      game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(startGame);
      if (game.input.gamepad.supported) {
        if (game.input.gamepad.active) {
          assignStartButtons();
        }
        game.input.gamepad.onConnectCallback = assignStartButtons;
        game.input.gamepad.onDisconnectCallback = assignStartButtons;
      }
    }
  };
  
  return splash;
};

module.exports = Splash;
