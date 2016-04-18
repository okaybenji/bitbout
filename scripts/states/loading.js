var Loading = function(game) {
  var loading = {
    init: function() {
      var loading = game.add.sprite(26, 29, 'loading');
      loading.animations.add('loading');
      loading.animations.play('loading');

      document.getElementById('loading').style.display = 'none';
    },

    preload: function() {
      // ui
      game.load.spritesheet('title', 'images/sprites/ui-title.gif', 64, 64);
      game.load.spritesheet('victoryMsg', 'images/sprites/ui-winner.gif', 52, 22);
      // bits
      game.load.spritesheet('blueScarf', 'images/sprites/bit-scarf-blue.gif', 5, 2);
      game.load.spritesheet('pinkScarf', 'images/sprites/bit-scarf-pink.gif', 5, 2);
      game.load.spritesheet('greenScarf', 'images/sprites/bit-scarf-green.gif', 5, 2);
      game.load.spritesheet('purpleScarf', 'images/sprites/bit-scarf-purple.gif', 5, 2);
      game.load.spritesheet('jump', 'images/sprites/bit-jump.gif', 10, 2);
      game.load.spritesheet('land', 'images/sprites/bit-land.gif', 10, 2);
      game.load.image('clear', 'images/colors/clear.gif');
      game.load.image('white', 'images/colors/white.gif');
      game.load.image('blue', 'images/colors/blue.gif');
      game.load.image('pink', 'images/colors/pink.gif');
      game.load.image('green', 'images/colors/green.gif');
      game.load.image('purple', 'images/colors/purple.gif');
      // forest
      game.load.image('forest', 'images/arenas/forest.gif');
      game.load.image('forestBg1', 'images/arenas/forest-bg1.gif');
      game.load.image('forestBg2', 'images/arenas/forest-bg2.gif');
      // tomb
      game.load.image('tomb', 'images/arenas/tomb.gif');
      game.load.spritesheet('tombBg', 'images/arenas/tomb-bg.gif', 64, 64);
      // waterfall
      game.load.image('waterfall', 'images/arenas/waterfall.gif');
      game.load.spritesheet('waterfallBg', 'images/arenas/waterfall-bg.gif', 64, 64);
      game.load.spritesheet('waterfallFg', 'images/arenas/waterfall-fg.gif', 64, 64);
      // hangar
      game.load.image('hangar', 'images/arenas/shaft.gif');
      game.load.spritesheet('hangarBg1', 'images/arenas/shaft-bg1.gif', 64, 64);
      game.load.spritesheet('hangarBg2', 'images/arenas/shaft-bg2.gif', 64, 64);

      // sound
      game.bgm = require('../music')();
      game.sfx = require('../sfx')();
    },

    create: function() {
      game.input.gamepad.start();

      game.state.add('splash', require('./splash')(game));
      game.state.add('play', require('./play')(game));
      game.state.start('splash');
    }
  };
  
  return loading;
};

module.exports = Loading;
