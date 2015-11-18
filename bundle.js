(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  var nativeWidth = 320;
  var nativeHeight = 180;
  var platforms, players;

  var resize = function resize() {
    document.body.style.zoom = window.innerWidth / nativeWidth;
  };

  var preload = function preload() {
    var utils = require('./utils.js');
    resize();
    window.onresize = utils.debounce(resize, 100);
    game.load.image('square', 'images/square.png');
  };

  var create = function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // work-around for phaser's shoddy world wrap
    var worldMargin = 16;
    game.world.setBounds(-worldMargin, -worldMargin, nativeWidth + worldMargin * 2, nativeHeight + worldMargin * 2);
    
    var buildPlatforms = require('./map.js');
    platforms = buildPlatforms(game);
    
    var createPlayer = require('./player.js');
    players = game.add.group();
    players.add(createPlayer(game, {keys: { up: 'W', down: 'S', left: 'A', right: 'D' }}));
    players.add(createPlayer(game, {x: 306, y: 16, keys: { up: 'I', down: 'K', left: 'J', right: 'L' }}));
  };

  var update = function update() {
    game.physics.arcade.collide(players, platforms);
    game.physics.arcade.collide(players, players);
  };

  var game = new Phaser.Game(nativeWidth, nativeHeight, Phaser.AUTO, '#game', {
    preload: preload,
    create: create,
    update: update,
  }, false, false); // disable anti-aliasing
}());

},{"./map.js":2,"./player.js":3,"./utils.js":4}],2:[function(require,module,exports){
var buildPlatforms = function buildPlatforms(game) {
  var platforms = game.add.group();
  platforms.enableBody = true;
  var platformPositions = [[48, 64], [208, 64], 
                               [128, 104],
                           [48, 154,], [208, 154]];

  platformPositions.forEach(function(position) {
    var platform = platforms.create(position[0], position[1], 'square');
    platform.scale.setTo(24, 4);
    platform.body.immovable = true;
  });

  var walls = [];
  walls.push(platforms.create(-16, 32, 'square'));
  walls.push(platforms.create(304, 32, 'square'));
  walls.forEach(function(wall) {
    wall.scale.setTo(16, 74);
    wall.body.immovable = true;
  });
  
  return platforms;
};

module.exports = buildPlatforms;

},{}],3:[function(require,module,exports){
var createPlayer = function createPlayer(game, config) {
  config = config || {};
  var xPos = config.x || 4;
  var yPos = config.y || 8;
  config.keys = config.keys || {};
  var keys = {
    up: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.up] || 'UP'),
    down: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.down] || 'DOWN'),
    left: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.left] || 'LEFT'),
    right: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.right] || 'RIGHT'),
  };

  var player = game.add.sprite(xPos, yPos, 'square');
  player.scale.setTo(4, 8);
  game.physics.arcade.enable(player);
  player.body.bounce.y = 0.1;
  player.body.gravity.y = 380;

  // phaser apparently automatically calls any function named update attached to a sprite!
  player.update = function() {
    game.world.wrap(player, 0, true);

    (function friction() {
      if (player.body.touching.down) {
        if (player.body.velocity.x > 0) {
          player.body.velocity.x -= 4;
        } else if (player.body.velocity.x < 0) {
          player.body.velocity.x += 4;
        }
      }
    }());

    (function playerControls() {
      (function run() {
        var maxSpeed = 64;
        switch (true) {
          // players have less control in the air
          case keys.left.isDown:
            if (player.body.touching.down) {
              player.body.velocity.x = Math.max(player.body.velocity.x - 8, -maxSpeed);
            } else {
              player.body.velocity.x = Math.max(player.body.velocity.x - 3, -maxSpeed);
            }
            break;
          case keys.right.isDown:
            if (player.body.touching.down) {
              player.body.velocity.x = Math.min(player.body.velocity.x + 8, maxSpeed);
            } else {
              player.body.velocity.x = Math.min(player.body.velocity.x + 3, maxSpeed);
            }
            break;
        }
      }());

      (function jump() {
        if (keys.up.isDown) {
          switch (true) {
            case player.body.touching.down:
              player.body.velocity.y = -200;
              break;
            // wall jumps
            case player.body.touching.left:
              player.body.velocity.y = -240;
              player.body.velocity.x = 90;
              break;
            case player.body.touching.right:
              player.body.velocity.y = -240;
              player.body.velocity.x = -90;
              break;
          }
        }
      }());

      (function duck() {
        // is this bad practice? adding boolean to phaser's keys
        if (typeof keys.down.wasDown === 'undefined') {
          keys.down.wasDown = false;
        }

        if (keys.down.isDown) {
          player.scale.setTo(4, 4);
          if (!keys.down.wasDown) {
            player.y += 8;
          }
          keys.down.wasDown = true;
        } else if (keys.down.wasDown) {
          keys.down.wasDown = false;
          player.y -= 8;
          player.scale.setTo(4, 8);
        }
      }());
    }());
  };

  return player;
};

module.exports = createPlayer;
},{}],4:[function(require,module,exports){
var utils = {
  debounce: function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
  }
};

module.exports = utils;
},{}]},{},[1]);
