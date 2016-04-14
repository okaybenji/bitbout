var Loading = function(game) {
  var loading = {
    init: function() {
      game.add.sprite(0, 0, 'loading');
      document.getElementById('loading').style.display = 'none';
    },

    preload: function() {
      // images
      game.load.spritesheet('title', 'images/spritesheet-title.gif', 64, 64);
      game.load.spritesheet('victoryMsg', 'images/spritesheet-winner.gif', 52, 22);
      game.load.spritesheet('blueScarf', 'images/spritesheet-scarf-bluebit.gif', 5, 2);
      game.load.spritesheet('pinkScarf', 'images/spritesheet-scarf-pinkbit.gif', 5, 2);
      game.load.spritesheet('greenScarf', 'images/spritesheet-scarf-greenbit.gif', 5, 2);
      game.load.spritesheet('purpleScarf', 'images/spritesheet-scarf-purplebit.gif', 5, 2);
      game.load.spritesheet('jump', 'images/spritesheet-jump.gif', 5, 2);
      game.load.spritesheet('land', 'images/spritesheet-land.gif', 5, 2);
      game.load.image('clear', 'images/clear.png');
      game.load.image('white', 'images/white.png');
      game.load.image('pink', 'images/pink.png');
      game.load.image('yellow', 'images/yellow.png');
      game.load.image('blue', 'images/blue.png');
      game.load.image('purple', 'images/purple.png');
      game.load.image('orange', 'images/orange.png');
      game.load.image('green', 'images/green.png');
      game.load.image('gray', 'images/gray.png');
      game.load.image('brown', 'images/brown.png');
      game.load.image('waterfall', 'images/waterfall.gif');
      game.load.image('hangar', 'images/level-hangar-wip.gif');

      // sound
      game.sfx = require('../sfx.js');
      game.bgm = require('../music')();
    },

    create: function() {
      game.input.gamepad.start();

      game.state.add('splash', require('./splash.js')(game));
      game.state.add('play', require('./play.js')(game));
      game.state.start('splash');
    }
  };
  
  return loading;
};

module.exports = Loading;
