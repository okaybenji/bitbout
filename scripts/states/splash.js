var Splash = function(game) {
  var splash = {
    init: function() {
      var sfx = require('../sfx.js');

      // intro animation
      sfx.jump();
      var dude = game.add.sprite(game.world.centerX, 100, 'purple');
      dude.scale.setTo(8, 16);
      game.add.tween(dude).to({y: 0}, 200, 'Linear').start();
    },

    preload: function() {
      // images
      game.load.image('clear', 'images/clear.png');
      game.load.image('white', 'images/white.png');
      game.load.image('pink', 'images/pink.png');
      game.load.image('yellow', 'images/yellow.png');
      game.load.image('blue', 'images/blue.png');
      game.load.image('orange', 'images/orange.png');
      game.load.image('green', 'images/green.png');

      game.load.spritesheet('hearts', 'images/hearts.png', 9, 5); // player health

      // TODO: why doesn't this load images for me?
      var stages = require('../data/stages.js');
      /*stages.forEach(function(stage) {
        var images = [].concat(stage.assets.background, stage.assets.foreground, stage.assets.scrolling);
        console.log('images:', images);
        images.forEach(function(image) {
          game.load.image(image.name, 'images/' + image.name + '.png');
        });
      });*/

      game.load.image('ground', 'images/ground.png');
      game.load.image('foreground', 'images/foreground.png');
      game.load.image('clouds', 'images/clouds.png');
      game.load.image('suns', 'images/suns.png');

      // music
      game.load.audio('A', ['music/loop.m4a']);
    },

    create: function() {
      var startGame = function startGame() {
        clearTimeout(timeout);
        if (game.state.current === 'splash') {
          game.state.start('play');
        }
      };
      
      // start game after a delay...
      var timeout = setTimeout(startGame, 100); // TODO: increase delay...

      // ...or when start/enter is pressed
      game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(startGame);
      if (game.input.gamepad.supported && game.input.gamepad.active && game.input.gamepad.pad1.connected) {
        game.input.gamepad.pad1.getButton(Phaser.Gamepad.XBOX360_START).onDown.addOnce(startGame);
      }
    }
  };
  
  return splash;
};

module.exports = Splash;
