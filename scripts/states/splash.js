var Splash = function(game) {
  var splash = {
    init: function() {
      var utils = require('../utils.js');
      this.logo = game.add.sprite(game.world.centerX, 100, 'logo');
      utils.center(this.logo);
    },

    preload: function() {
      // images
      game.load.image('pink', 'images/pink.png');
      game.load.image('yellow', 'images/yellow.png');
      game.load.image('blue', 'images/blue.png');
      game.load.image('orange', 'images/orange.png');
      game.load.image('purple', 'images/purple.png');
      game.load.image('green', 'images/green.png');
      game.load.image('white', 'images/white.png');
      game.load.spritesheet('hearts', 'images/hearts.png', 9, 5); // player health
    },

    create: function() {
      game.input.onDown.addOnce(function() {
        game.state.start('play');
      }, this); // start game on mouse click
    }
  };
  
  return splash;
};

module.exports = Splash;
