var Splash = function(game) {
  var splash = {
    init: function() {
      // TODO: intro animation
      game.sfx = require('../sfx.js');
      game.bgm = require('../music')();
    },

    preload: function() {
      // images
      game.load.image('title', 'images/title.gif');
      game.load.image('clear', 'images/clear.png');
      game.load.image('white', 'images/white.png');
      game.load.image('pink', 'images/pink.png');
      game.load.image('yellow', 'images/yellow.png');
      game.load.image('blue', 'images/blue.png');
      game.load.image('orange', 'images/orange.png');
      game.load.image('green', 'images/green.png');
      game.load.image('gray', 'images/gray.png');
      game.load.image('brown', 'images/brown.png');
      game.load.image('waterfall', 'images/waterfall.gif');
      game.load.image('hangar', 'images/hangar.gif');
      game.load.spritesheet('victoryMsg', 'images/victoryMsg.png', 47, 6);
    },

    create: function() {
      game.bgm.play('title.xm');
      game.add.sprite(0, 0, 'hangar');
      game.add.sprite(0, 0, 'title');

      var startGame = function startGame() {
        if (game.state.current === 'splash') {
          game.bgm.play('None');
          game.state.start('play');
        }
      };
      
      // start game when start/enter is pressed
      game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(startGame);
      if (game.input.gamepad.supported && game.input.gamepad.active && game.input.gamepad.pad1.connected) {
        game.input.gamepad.pad1.getButton(Phaser.Gamepad.XBOX360_START).onDown.addOnce(startGame);
      }
    }
  };
  
  return splash;
};

module.exports = Splash;
