(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var nativeWidth = 320;
var nativeHeight = 180;
var platforms, players;

var resize = function resize() {
  document.body.style.zoom = window.innerWidth / nativeWidth;
};

var checkForGameOver = function checkForGameOver() {
  var alivePlayers = [];
  players.children.forEach(function(player) {
    if (player.hp > 0) {
      alivePlayers.push(player.name);
    }
  });
  if (alivePlayers.length === 1) {
    // TODO: why is this font still anti-aliased?
    var style = { font: "12px Hellovetica", fill: "#eee", align: "center", boundsAlignH: "center", boundsAlignV: "middle" };
    var message = 'Game over!  ' + alivePlayers[0] + '  wins!\nRefresh  to  restart'; // TODO: allow pressing any key to restart
    game.add.text(0, 0, message, style)
      .setTextBounds(0, 0, nativeWidth, nativeHeight);
  }
};

var preload = function preload() {
  var utils = require('./utils.js');
  resize();
  window.onresize = utils.debounce(resize, 100);
  game.load.image('pink', 'images/pink.png');
  game.load.image('yellow', 'images/yellow.png');
  game.load.image('blue', 'images/blue.png');
  game.load.spritesheet('hearts', 'images/hearts.png', 9, 5); // player health
};

var create = function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.world.setBounds(0, -nativeHeight, nativeWidth, nativeHeight * 3); // allow anything as tall as world to fall off-screen up or down

  var buildPlatforms = require('./map.js');
  platforms = buildPlatforms(game);

  var createPlayer = require('./player.js');
  players = game.add.group();

  var player1 = {
    name: 'Blue',
    color: 'blue',
    keys: {
      up: 'W', down: 'S', left: 'A', right: 'D'
    },
  };

  var player2 = {
    name: 'Yellow',
    color: 'yellow',
    position: {
      x: 306, y: 8
    },
    orientation: 'left',
    keys: {
      up: 'I', down: 'K', left: 'J', right: 'L'
    },
  }

  players.add(createPlayer(game, player1));
  players.add(createPlayer(game, player2));
};

var update = function update() {

  game.physics.arcade.collide(players, platforms);
  // TODO: how do i do this on the player itself without access to players? or should i add a ftn to player and set that as the cb?
  game.physics.arcade.collide(players, players, function(playerA, playerB) {
    // let's not knock anybody around if something's on one of these dude's heads
    // prevents cannonball attacks and the like, and allows standing on heads
    if (playerA.body.touching.up || playerB.body.touching.up) {
      return;
    }
    
    var bothRolling = playerA.isRolling && playerB.isRolling;
    var bothStanding = !playerA.isDucking && !playerB.isDucking;
    var neitherRolling = !playerA.isRolling && !playerB.isRolling;
    var eitherDucking = playerA.isDucking || playerB.isDucking;
    var eitherRunning = Math.abs(playerA.body.velocity.x) > 28 || Math.abs(playerB.body.velocity.x) >= 28;
    var eitherRolling = playerA.isRolling || playerB.isRolling;
    var eitherStanding = !playerA.isDucking || !playerB.isDucking;

    function temporarilyDisableCollision(player) {
      player.isCollidable = false;
      setTimeout(function() {
        player.isCollidable = true;
      }, 100);
    }

    if (bothRolling || bothStanding) {
      (function bounce() {
        var bounceVelocity = 100;
        var velocityA = velocityB = bounceVelocity;
        if (playerA.position.x > playerB.position.x) {
          velocityB *= -1;
        } else {
          velocityA *= -1;
        }
        playerA.body.velocity.x = velocityA;
        playerB.body.velocity.x = velocityB;
        playerA.isRolling = false;
        playerB.isRolling = false;
      }());
    } else if (neitherRolling && eitherRunning && eitherDucking) {
      (function fling() {
        var playerToFling;
        var playerToLeave;
        if (playerA.isDucking) {
          playerToFling = playerB;
          playerToLeave = playerA;
        } else {
          playerToFling = playerA;
          playerToLeave = playerB;
        }
        temporarilyDisableCollision(playerToFling);
        var flingXVelocity = 150;
        if (playerToFling.position.x > playerToLeave.position.x) {
          flingXVelocity *= -1;
        }
        playerToFling.body.velocity.x = flingXVelocity;
        playerToFling.body.velocity.y = -150;
      }());
    } else if (eitherRolling && eitherStanding) {
      (function pop() {
        var playerToPop;
        if (playerA.isRolling) {
          playerToPop = playerB;
        } else {
          playerToPop = playerA;
        }
        temporarilyDisableCollision(playerToPop);
        playerToPop.body.velocity.y = -150;
      }());
    }
  }, function(playerA, playerB) {
    if (!playerA.isCollidable || !playerB.isCollidable) {
      return false;
    }
    return true;
  });
};

var game = new Phaser.Game(nativeWidth, nativeHeight, Phaser.AUTO, 'game', {
  preload: preload,
  create: create,
  update: update,
}, false, false); // disable anti-aliasing

module.exports = checkForGameOver;

},{"./map.js":2,"./player.js":3,"./utils.js":4}],2:[function(require,module,exports){
var buildPlatforms = function buildPlatforms(game) {
  var platforms = game.add.group();
  platforms.enableBody = true;
  var platformPositions = [[48, 64], [208, 64], 
                               [128, 104],
                           [48, 154,], [208, 154]];

  platformPositions.forEach(function(position) {
    var platform = platforms.create(position[0], position[1], 'pink');
    platform.scale.setTo(24, 4);
    platform.body.immovable = true;
  });

  var walls = [];
  walls.push(platforms.create(-16, 32, 'pink'));
  walls.push(platforms.create(304, 32, 'pink'));
  walls.forEach(function(wall) {
    wall.scale.setTo(16, 74);
    wall.body.immovable = true;
  });
  
  return platforms;
};

module.exports = buildPlatforms;

},{}],3:[function(require,module,exports){
var createPlayer = function createPlayer(game, options) {
  var defaults = {
    position: {
      x: 4,
      y: 8
    },
    orientation: 'right',
    keys: {
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
    },
    scale: {
      x: 4,
      y: 8
    },
    color: 'pink',
  };

  var settings = Object.assign({}, defaults, options);

  var keys = {
    up: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.up]),
    down: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.down]),
    left: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.left]),
    right: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.right]),
  };

  var actions = {
    run: function run(direction) {
      var maxSpeed = 64;
      var acceleration = player.body.touching.down ? 8 : 3; // players have less control in the air
      player.orientation = direction;

      switch (direction) {
        case 'left':
          player.body.velocity.x = Math.max(player.body.velocity.x - acceleration, -maxSpeed);
          break;
        case 'right':
          player.body.velocity.x = Math.min(player.body.velocity.x + acceleration, maxSpeed);
          break;
      }

      actions.orientHearts(direction);
    },
    
    // TODO: fix left hearts position when hp is less than max
    orientHearts: function orientHearts(direction) {
      var heartDistance = 1.1; // how close hearts float by player
      switch (direction) {
        case 'left':
          player.hearts.anchor.setTo(-heartDistance, 0);
          break;
        case 'right':
          player.hearts.anchor.setTo(heartDistance, 0);
          break;
      }
    },

    jump: function jump() {
      // soften upward velocity when player releases jump key
      var dampenJump = function dampenJump() {
        var dampenToPercent = 0.5;
        // TODO: decouple key tracking from actions
        keys.up.onUp.addOnce(function() {
          if (player.body.velocity.y < 0) {
            player.body.velocity.y *= dampenToPercent;
          }
        });
      };

      if (player.body.touching.down) {
        player.body.velocity.y = -200;
        dampenJump();
      // wall jumps
      } else if (player.body.touching.left) {
        player.body.velocity.y = -240;
        player.body.velocity.x = 90;
        dampenJump();
      } else if (player.body.touching.right) {
        player.body.velocity.y = -240;
        player.body.velocity.x = -90;
        dampenJump();
      }
    },

    duck: function duck() {
      if (!player.isDucking) {
        player.scale.setTo(settings.scale.x, settings.scale.y / 2);
        player.y += settings.scale.y;
      }
      player.isDucking = true;

      (function roll() {
        var canRoll = Math.abs(player.body.velocity.x) > 50 && player.body.touching.down;
        if (canRoll) {
          player.isRolling = true;
        }
      }());
    },

    stand: function stand() {
      player.y -= settings.scale.y;
      player.scale.setTo(settings.scale.x, settings.scale.y);
      player.isDucking = false;
      player.isRolling = false;
    },

    takeDamage: function takeDamage(amount) {
      player.hp -= amount;
      if (player.hp < 0) {
        player.hp = 0;
      }
      if (player.hp % 2 === 0) {
        actions.die();
      }
      actions.updateHearts();
    },

    updateHearts() {
      var healthPercentage = player.hp / player.maxHp;
      var cropWidth = Math.ceil(healthPercentage * heartsWidth);
      var cropRect = new Phaser.Rectangle(0, 0, cropWidth, player.hearts.height);
      player.hearts.crop(cropRect);
    },

    die: function() {
      if (player.hp > 0) {
        player.position.x = settings.position.x;
        player.position.y = settings.position.y;
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
      } else {
        // TODO: detangle this
        var checkForGameOver = require('./game.js');
        checkForGameOver();
      }
    }
  };

  var player = game.add.sprite(settings.position.x, settings.position.y, settings.color);
  player.name = settings.name;
  player.orientation = settings.orientation;
  player.scale.setTo(settings.scale.x, settings.scale.y); // TODO: add giant mode

  game.physics.arcade.enable(player);
  player.body.collideWorldBounds = true;
  player.body.bounce.y = .2; // TODO: allow bounce configuration
  player.body.gravity.y = 380; // TODO: allow gravity configuration

  player.isRolling = false;
  player.isDucking = false;
  player.isCollidable = true;

  // track health
  player.hp = player.maxHp = 6;
  player.hearts = game.add.sprite(0, 0, 'hearts');
  var heartsWidth = player.hearts.width;
  player.hearts.setScaleMinMax(1, 1); // prevent hearts scaling w/ player
  var bob = player.hearts.animations.add('bob', [0,1,2,1], 3, true); // name, frames, framerate, loop
  player.hearts.animations.play('bob');
  player.addChild(player.hearts);
  actions.orientHearts(player.orientation);

  // phaser apparently automatically calls any function named update attached to a sprite!
  player.update = function() {
    // kill player if he falls off the screen
    if (player.position.y > 180 && player.hp !== 0) { // TODO: how to access native height from game.js?
      // if player was already down half a heart, he'll only lose 1/2 heart
      if (player.hp % 2 === 0) {
        actions.takeDamage(2);
      } else {
        actions.takeDamage(1);
      }
    }

    if (keys.left.isDown && !keys.right.isDown) {
      actions.run('left');
    } else if (keys.right.isDown && !keys.left.isDown) {
      actions.run('right');
    }

    if (keys.up.isDown) {
      actions.jump();
    }

    if (keys.down.isDown) {
      actions.duck();
    } else if (player.isDucking) {
      actions.stand();
    }

    (function applyFriction() {
      // here's an idea which solves the sliding glitch, but it doesn't feel as good
      /*if (player.body.touching.down && !keys.left.isDown && !keys.right.isDown) {
        if (player.body.velocity.x !== 0) {
          player.body.velocity.x -= player.body.velocity.x / 8;
        }
      }*/
      if (player.body.touching.down && !player.isRolling) {
        if (player.body.velocity.x > 0) {
          player.body.velocity.x -= 4;
        } else if (player.body.velocity.x < 0) {
          player.body.velocity.x += 4;
        }
      }
    }());
  };

  return player;
};

module.exports = createPlayer;

},{"./game.js":1}],4:[function(require,module,exports){
var utils = {
  // from underscore
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2dhbWUuanMiLCJzY3JpcHRzL21hcC5qcyIsInNjcmlwdHMvcGxheWVyLmpzIiwic2NyaXB0cy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBuYXRpdmVXaWR0aCA9IDMyMDtcbnZhciBuYXRpdmVIZWlnaHQgPSAxODA7XG52YXIgcGxhdGZvcm1zLCBwbGF5ZXJzO1xuXG52YXIgcmVzaXplID0gZnVuY3Rpb24gcmVzaXplKCkge1xuICBkb2N1bWVudC5ib2R5LnN0eWxlLnpvb20gPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG5hdGl2ZVdpZHRoO1xufTtcblxudmFyIGNoZWNrRm9yR2FtZU92ZXIgPSBmdW5jdGlvbiBjaGVja0ZvckdhbWVPdmVyKCkge1xuICB2YXIgYWxpdmVQbGF5ZXJzID0gW107XG4gIHBsYXllcnMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihwbGF5ZXIpIHtcbiAgICBpZiAocGxheWVyLmhwID4gMCkge1xuICAgICAgYWxpdmVQbGF5ZXJzLnB1c2gocGxheWVyLm5hbWUpO1xuICAgIH1cbiAgfSk7XG4gIGlmIChhbGl2ZVBsYXllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgLy8gVE9ETzogd2h5IGlzIHRoaXMgZm9udCBzdGlsbCBhbnRpLWFsaWFzZWQ/XG4gICAgdmFyIHN0eWxlID0geyBmb250OiBcIjEycHggSGVsbG92ZXRpY2FcIiwgZmlsbDogXCIjZWVlXCIsIGFsaWduOiBcImNlbnRlclwiLCBib3VuZHNBbGlnbkg6IFwiY2VudGVyXCIsIGJvdW5kc0FsaWduVjogXCJtaWRkbGVcIiB9O1xuICAgIHZhciBtZXNzYWdlID0gJ0dhbWUgb3ZlciEgICcgKyBhbGl2ZVBsYXllcnNbMF0gKyAnICB3aW5zIVxcblJlZnJlc2ggIHRvICByZXN0YXJ0JzsgLy8gVE9ETzogYWxsb3cgcHJlc3NpbmcgYW55IGtleSB0byByZXN0YXJ0XG4gICAgZ2FtZS5hZGQudGV4dCgwLCAwLCBtZXNzYWdlLCBzdHlsZSlcbiAgICAgIC5zZXRUZXh0Qm91bmRzKDAsIDAsIG5hdGl2ZVdpZHRoLCBuYXRpdmVIZWlnaHQpO1xuICB9XG59O1xuXG52YXIgcHJlbG9hZCA9IGZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbiAgcmVzaXplKCk7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IHV0aWxzLmRlYm91bmNlKHJlc2l6ZSwgMTAwKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdwaW5rJywgJ2ltYWdlcy9waW5rLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3llbGxvdycsICdpbWFnZXMveWVsbG93LnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ2JsdWUnLCAnaW1hZ2VzL2JsdWUucG5nJyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnaGVhcnRzJywgJ2ltYWdlcy9oZWFydHMucG5nJywgOSwgNSk7IC8vIHBsYXllciBoZWFsdGhcbn07XG5cbnZhciBjcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICBnYW1lLndvcmxkLnNldEJvdW5kcygwLCAtbmF0aXZlSGVpZ2h0LCBuYXRpdmVXaWR0aCwgbmF0aXZlSGVpZ2h0ICogMyk7IC8vIGFsbG93IGFueXRoaW5nIGFzIHRhbGwgYXMgd29ybGQgdG8gZmFsbCBvZmYtc2NyZWVuIHVwIG9yIGRvd25cblxuICB2YXIgYnVpbGRQbGF0Zm9ybXMgPSByZXF1aXJlKCcuL21hcC5qcycpO1xuICBwbGF0Zm9ybXMgPSBidWlsZFBsYXRmb3JtcyhnYW1lKTtcblxuICB2YXIgY3JlYXRlUGxheWVyID0gcmVxdWlyZSgnLi9wbGF5ZXIuanMnKTtcbiAgcGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG5cbiAgdmFyIHBsYXllcjEgPSB7XG4gICAgbmFtZTogJ0JsdWUnLFxuICAgIGNvbG9yOiAnYmx1ZScsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCdcbiAgICB9LFxuICB9O1xuXG4gIHZhciBwbGF5ZXIyID0ge1xuICAgIG5hbWU6ICdZZWxsb3cnLFxuICAgIGNvbG9yOiAneWVsbG93JyxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgeDogMzA2LCB5OiA4XG4gICAgfSxcbiAgICBvcmllbnRhdGlvbjogJ2xlZnQnLFxuICAgIGtleXM6IHtcbiAgICAgIHVwOiAnSScsIGRvd246ICdLJywgbGVmdDogJ0onLCByaWdodDogJ0wnXG4gICAgfSxcbiAgfVxuXG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIxKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIyKSk7XG59O1xuXG52YXIgdXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZShwbGF5ZXJzLCBwbGF0Zm9ybXMpO1xuICAvLyBUT0RPOiBob3cgZG8gaSBkbyB0aGlzIG9uIHRoZSBwbGF5ZXIgaXRzZWxmIHdpdGhvdXQgYWNjZXNzIHRvIHBsYXllcnM/IG9yIHNob3VsZCBpIGFkZCBhIGZ0biB0byBwbGF5ZXIgYW5kIHNldCB0aGF0IGFzIHRoZSBjYj9cbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHBsYXllcnMsIHBsYXllcnMsIGZ1bmN0aW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAvLyBsZXQncyBub3Qga25vY2sgYW55Ym9keSBhcm91bmQgaWYgc29tZXRoaW5nJ3Mgb24gb25lIG9mIHRoZXNlIGR1ZGUncyBoZWFkc1xuICAgIC8vIHByZXZlbnRzIGNhbm5vbmJhbGwgYXR0YWNrcyBhbmQgdGhlIGxpa2UsIGFuZCBhbGxvd3Mgc3RhbmRpbmcgb24gaGVhZHNcbiAgICBpZiAocGxheWVyQS5ib2R5LnRvdWNoaW5nLnVwIHx8IHBsYXllckIuYm9keS50b3VjaGluZy51cCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICB2YXIgYm90aFJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyAmJiBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICB2YXIgYm90aFN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nICYmICFwbGF5ZXJCLmlzRHVja2luZztcbiAgICB2YXIgbmVpdGhlclJvbGxpbmcgPSAhcGxheWVyQS5pc1JvbGxpbmcgJiYgIXBsYXllckIuaXNSb2xsaW5nO1xuICAgIHZhciBlaXRoZXJEdWNraW5nID0gcGxheWVyQS5pc0R1Y2tpbmcgfHwgcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgdmFyIGVpdGhlclJ1bm5pbmcgPSBNYXRoLmFicyhwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCkgPiAyOCB8fCBNYXRoLmFicyhwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCkgPj0gMjg7XG4gICAgdmFyIGVpdGhlclJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyB8fCBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICB2YXIgZWl0aGVyU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgfHwgIXBsYXllckIuaXNEdWNraW5nO1xuXG4gICAgZnVuY3Rpb24gdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllcikge1xuICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICB9LCAxMDApO1xuICAgIH1cblxuICAgIGlmIChib3RoUm9sbGluZyB8fCBib3RoU3RhbmRpbmcpIHtcbiAgICAgIChmdW5jdGlvbiBib3VuY2UoKSB7XG4gICAgICAgIHZhciBib3VuY2VWZWxvY2l0eSA9IDEwMDtcbiAgICAgICAgdmFyIHZlbG9jaXR5QSA9IHZlbG9jaXR5QiA9IGJvdW5jZVZlbG9jaXR5O1xuICAgICAgICBpZiAocGxheWVyQS5wb3NpdGlvbi54ID4gcGxheWVyQi5wb3NpdGlvbi54KSB7XG4gICAgICAgICAgdmVsb2NpdHlCICo9IC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZlbG9jaXR5QSAqPSAtMTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QTtcbiAgICAgICAgcGxheWVyQi5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eUI7XG4gICAgICAgIHBsYXllckEuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIHBsYXllckIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICB9KCkpO1xuICAgIH0gZWxzZSBpZiAobmVpdGhlclJvbGxpbmcgJiYgZWl0aGVyUnVubmluZyAmJiBlaXRoZXJEdWNraW5nKSB7XG4gICAgICAoZnVuY3Rpb24gZmxpbmcoKSB7XG4gICAgICAgIHZhciBwbGF5ZXJUb0ZsaW5nO1xuICAgICAgICB2YXIgcGxheWVyVG9MZWF2ZTtcbiAgICAgICAgaWYgKHBsYXllckEuaXNEdWNraW5nKSB7XG4gICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckI7XG4gICAgICAgICAgcGxheWVyVG9MZWF2ZSA9IHBsYXllckE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckE7XG4gICAgICAgICAgcGxheWVyVG9MZWF2ZSA9IHBsYXllckI7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvRmxpbmcpO1xuICAgICAgICB2YXIgZmxpbmdYVmVsb2NpdHkgPSAxNTA7XG4gICAgICAgIGlmIChwbGF5ZXJUb0ZsaW5nLnBvc2l0aW9uLnggPiBwbGF5ZXJUb0xlYXZlLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICBmbGluZ1hWZWxvY2l0eSAqPSAtMTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueCA9IGZsaW5nWFZlbG9jaXR5O1xuICAgICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueSA9IC0xNTA7XG4gICAgICB9KCkpO1xuICAgIH0gZWxzZSBpZiAoZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJTdGFuZGluZykge1xuICAgICAgKGZ1bmN0aW9uIHBvcCgpIHtcbiAgICAgICAgdmFyIHBsYXllclRvUG9wO1xuICAgICAgICBpZiAocGxheWVyQS5pc1JvbGxpbmcpIHtcbiAgICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJBO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXJUb1BvcCk7XG4gICAgICAgIHBsYXllclRvUG9wLmJvZHkudmVsb2NpdHkueSA9IC0xNTA7XG4gICAgICB9KCkpO1xuICAgIH1cbiAgfSwgZnVuY3Rpb24ocGxheWVyQSwgcGxheWVyQikge1xuICAgIGlmICghcGxheWVyQS5pc0NvbGxpZGFibGUgfHwgIXBsYXllckIuaXNDb2xsaWRhYmxlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn07XG5cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKG5hdGl2ZVdpZHRoLCBuYXRpdmVIZWlnaHQsIFBoYXNlci5BVVRPLCAnZ2FtZScsIHtcbiAgcHJlbG9hZDogcHJlbG9hZCxcbiAgY3JlYXRlOiBjcmVhdGUsXG4gIHVwZGF0ZTogdXBkYXRlLFxufSwgZmFsc2UsIGZhbHNlKTsgLy8gZGlzYWJsZSBhbnRpLWFsaWFzaW5nXG5cbm1vZHVsZS5leHBvcnRzID0gY2hlY2tGb3JHYW1lT3ZlcjtcbiIsInZhciBidWlsZFBsYXRmb3JtcyA9IGZ1bmN0aW9uIGJ1aWxkUGxhdGZvcm1zKGdhbWUpIHtcbiAgdmFyIHBsYXRmb3JtcyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIHBsYXRmb3Jtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcbiAgdmFyIHBsYXRmb3JtUG9zaXRpb25zID0gW1s0OCwgNjRdLCBbMjA4LCA2NF0sIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsxMjgsIDEwNF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBbNDgsIDE1NCxdLCBbMjA4LCAxNTRdXTtcblxuICBwbGF0Zm9ybVBvc2l0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG4gICAgdmFyIHBsYXRmb3JtID0gcGxhdGZvcm1zLmNyZWF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sICdwaW5rJyk7XG4gICAgcGxhdGZvcm0uc2NhbGUuc2V0VG8oMjQsIDQpO1xuICAgIHBsYXRmb3JtLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgfSk7XG5cbiAgdmFyIHdhbGxzID0gW107XG4gIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgtMTYsIDMyLCAncGluaycpKTtcbiAgd2FsbHMucHVzaChwbGF0Zm9ybXMuY3JlYXRlKDMwNCwgMzIsICdwaW5rJykpO1xuICB3YWxscy5mb3JFYWNoKGZ1bmN0aW9uKHdhbGwpIHtcbiAgICB3YWxsLnNjYWxlLnNldFRvKDE2LCA3NCk7XG4gICAgd2FsbC5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gIH0pO1xuICBcbiAgcmV0dXJuIHBsYXRmb3Jtcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnVpbGRQbGF0Zm9ybXM7XG4iLCJ2YXIgY3JlYXRlUGxheWVyID0gZnVuY3Rpb24gY3JlYXRlUGxheWVyKGdhbWUsIG9wdGlvbnMpIHtcbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIHBvc2l0aW9uOiB7XG4gICAgICB4OiA0LFxuICAgICAgeTogOFxuICAgIH0sXG4gICAgb3JpZW50YXRpb246ICdyaWdodCcsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdVUCcsXG4gICAgICBkb3duOiAnRE9XTicsXG4gICAgICBsZWZ0OiAnTEVGVCcsXG4gICAgICByaWdodDogJ1JJR0hUJyxcbiAgICB9LFxuICAgIHNjYWxlOiB7XG4gICAgICB4OiA0LFxuICAgICAgeTogOFxuICAgIH0sXG4gICAgY29sb3I6ICdwaW5rJyxcbiAgfTtcblxuICB2YXIgc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgdmFyIGtleXMgPSB7XG4gICAgdXA6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnVwXSksXG4gICAgZG93bjogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuZG93bl0pLFxuICAgIGxlZnQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmxlZnRdKSxcbiAgICByaWdodDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMucmlnaHRdKSxcbiAgfTtcblxuICB2YXIgYWN0aW9ucyA9IHtcbiAgICBydW46IGZ1bmN0aW9uIHJ1bihkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBtYXhTcGVlZCA9IDY0O1xuICAgICAgdmFyIGFjY2VsZXJhdGlvbiA9IHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gPyA4IDogMzsgLy8gcGxheWVycyBoYXZlIGxlc3MgY29udHJvbCBpbiB0aGUgYWlyXG4gICAgICBwbGF5ZXIub3JpZW50YXRpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1heChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC0gYWNjZWxlcmF0aW9uLCAtbWF4U3BlZWQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWluKHBsYXllci5ib2R5LnZlbG9jaXR5LnggKyBhY2NlbGVyYXRpb24sIG1heFNwZWVkKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgYWN0aW9ucy5vcmllbnRIZWFydHMoZGlyZWN0aW9uKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIFRPRE86IGZpeCBsZWZ0IGhlYXJ0cyBwb3NpdGlvbiB3aGVuIGhwIGlzIGxlc3MgdGhhbiBtYXhcbiAgICBvcmllbnRIZWFydHM6IGZ1bmN0aW9uIG9yaWVudEhlYXJ0cyhkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBoZWFydERpc3RhbmNlID0gMS4xOyAvLyBob3cgY2xvc2UgaGVhcnRzIGZsb2F0IGJ5IHBsYXllclxuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcGxheWVyLmhlYXJ0cy5hbmNob3Iuc2V0VG8oLWhlYXJ0RGlzdGFuY2UsIDApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmhlYXJ0cy5hbmNob3Iuc2V0VG8oaGVhcnREaXN0YW5jZSwgMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGp1bXA6IGZ1bmN0aW9uIGp1bXAoKSB7XG4gICAgICAvLyBzb2Z0ZW4gdXB3YXJkIHZlbG9jaXR5IHdoZW4gcGxheWVyIHJlbGVhc2VzIGp1bXAga2V5XG4gICAgICB2YXIgZGFtcGVuSnVtcCA9IGZ1bmN0aW9uIGRhbXBlbkp1bXAoKSB7XG4gICAgICAgIHZhciBkYW1wZW5Ub1BlcmNlbnQgPSAwLjU7XG4gICAgICAgIC8vIFRPRE86IGRlY291cGxlIGtleSB0cmFja2luZyBmcm9tIGFjdGlvbnNcbiAgICAgICAga2V5cy51cC5vblVwLmFkZE9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ICo9IGRhbXBlblRvUGVyY2VudDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24pIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0yMDA7XG4gICAgICAgIGRhbXBlbkp1bXAoKTtcbiAgICAgIC8vIHdhbGwganVtcHNcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTI0MDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDkwO1xuICAgICAgICBkYW1wZW5KdW1wKCk7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLnJpZ2h0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMjQwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLTkwO1xuICAgICAgICBkYW1wZW5KdW1wKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGR1Y2s6IGZ1bmN0aW9uIGR1Y2soKSB7XG4gICAgICBpZiAoIXBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkgLyAyKTtcbiAgICAgICAgcGxheWVyLnkgKz0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSB0cnVlO1xuXG4gICAgICAoZnVuY3Rpb24gcm9sbCgpIHtcbiAgICAgICAgdmFyIGNhblJvbGwgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA+IDUwICYmIHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd247XG4gICAgICAgIGlmIChjYW5Sb2xsKSB7XG4gICAgICAgICAgcGxheWVyLmlzUm9sbGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0oKSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgIHBsYXllci55IC09IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSk7XG4gICAgICBwbGF5ZXIuaXNEdWNraW5nID0gZmFsc2U7XG4gICAgICBwbGF5ZXIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHRha2VEYW1hZ2U6IGZ1bmN0aW9uIHRha2VEYW1hZ2UoYW1vdW50KSB7XG4gICAgICBwbGF5ZXIuaHAgLT0gYW1vdW50O1xuICAgICAgaWYgKHBsYXllci5ocCA8IDApIHtcbiAgICAgICAgcGxheWVyLmhwID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChwbGF5ZXIuaHAgJSAyID09PSAwKSB7XG4gICAgICAgIGFjdGlvbnMuZGllKCk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLnVwZGF0ZUhlYXJ0cygpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVIZWFydHMoKSB7XG4gICAgICB2YXIgaGVhbHRoUGVyY2VudGFnZSA9IHBsYXllci5ocCAvIHBsYXllci5tYXhIcDtcbiAgICAgIHZhciBjcm9wV2lkdGggPSBNYXRoLmNlaWwoaGVhbHRoUGVyY2VudGFnZSAqIGhlYXJ0c1dpZHRoKTtcbiAgICAgIHZhciBjcm9wUmVjdCA9IG5ldyBQaGFzZXIuUmVjdGFuZ2xlKDAsIDAsIGNyb3BXaWR0aCwgcGxheWVyLmhlYXJ0cy5oZWlnaHQpO1xuICAgICAgcGxheWVyLmhlYXJ0cy5jcm9wKGNyb3BSZWN0KTtcbiAgICB9LFxuXG4gICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAwKSB7XG4gICAgICAgIHBsYXllci5wb3NpdGlvbi54ID0gc2V0dGluZ3MucG9zaXRpb24ueDtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnkgPSBzZXR0aW5ncy5wb3NpdGlvbi55O1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUT0RPOiBkZXRhbmdsZSB0aGlzXG4gICAgICAgIHZhciBjaGVja0ZvckdhbWVPdmVyID0gcmVxdWlyZSgnLi9nYW1lLmpzJyk7XG4gICAgICAgIGNoZWNrRm9yR2FtZU92ZXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIHBsYXllciA9IGdhbWUuYWRkLnNwcml0ZShzZXR0aW5ncy5wb3NpdGlvbi54LCBzZXR0aW5ncy5wb3NpdGlvbi55LCBzZXR0aW5ncy5jb2xvcik7XG4gIHBsYXllci5uYW1lID0gc2V0dGluZ3MubmFtZTtcbiAgcGxheWVyLm9yaWVudGF0aW9uID0gc2V0dGluZ3Mub3JpZW50YXRpb247XG4gIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBzZXR0aW5ncy5zY2FsZS55KTsgLy8gVE9ETzogYWRkIGdpYW50IG1vZGVcblxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZShwbGF5ZXIpO1xuICBwbGF5ZXIuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICBwbGF5ZXIuYm9keS5ib3VuY2UueSA9IC4yOyAvLyBUT0RPOiBhbGxvdyBib3VuY2UgY29uZmlndXJhdGlvblxuICBwbGF5ZXIuYm9keS5ncmF2aXR5LnkgPSAzODA7IC8vIFRPRE86IGFsbG93IGdyYXZpdHkgY29uZmlndXJhdGlvblxuXG4gIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuICAvLyB0cmFjayBoZWFsdGhcbiAgcGxheWVyLmhwID0gcGxheWVyLm1heEhwID0gNjtcbiAgcGxheWVyLmhlYXJ0cyA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnaGVhcnRzJyk7XG4gIHZhciBoZWFydHNXaWR0aCA9IHBsYXllci5oZWFydHMud2lkdGg7XG4gIHBsYXllci5oZWFydHMuc2V0U2NhbGVNaW5NYXgoMSwgMSk7IC8vIHByZXZlbnQgaGVhcnRzIHNjYWxpbmcgdy8gcGxheWVyXG4gIHZhciBib2IgPSBwbGF5ZXIuaGVhcnRzLmFuaW1hdGlvbnMuYWRkKCdib2InLCBbMCwxLDIsMV0sIDMsIHRydWUpOyAvLyBuYW1lLCBmcmFtZXMsIGZyYW1lcmF0ZSwgbG9vcFxuICBwbGF5ZXIuaGVhcnRzLmFuaW1hdGlvbnMucGxheSgnYm9iJyk7XG4gIHBsYXllci5hZGRDaGlsZChwbGF5ZXIuaGVhcnRzKTtcbiAgYWN0aW9ucy5vcmllbnRIZWFydHMocGxheWVyLm9yaWVudGF0aW9uKTtcblxuICAvLyBwaGFzZXIgYXBwYXJlbnRseSBhdXRvbWF0aWNhbGx5IGNhbGxzIGFueSBmdW5jdGlvbiBuYW1lZCB1cGRhdGUgYXR0YWNoZWQgdG8gYSBzcHJpdGUhXG4gIHBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBraWxsIHBsYXllciBpZiBoZSBmYWxscyBvZmYgdGhlIHNjcmVlblxuICAgIGlmIChwbGF5ZXIucG9zaXRpb24ueSA+IDE4MCAmJiBwbGF5ZXIuaHAgIT09IDApIHsgLy8gVE9ETzogaG93IHRvIGFjY2VzcyBuYXRpdmUgaGVpZ2h0IGZyb20gZ2FtZS5qcz9cbiAgICAgIC8vIGlmIHBsYXllciB3YXMgYWxyZWFkeSBkb3duIGhhbGYgYSBoZWFydCwgaGUnbGwgb25seSBsb3NlIDEvMiBoZWFydFxuICAgICAgaWYgKHBsYXllci5ocCAlIDIgPT09IDApIHtcbiAgICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChrZXlzLmxlZnQuaXNEb3duICYmICFrZXlzLnJpZ2h0LmlzRG93bikge1xuICAgICAgYWN0aW9ucy5ydW4oJ2xlZnQnKTtcbiAgICB9IGVsc2UgaWYgKGtleXMucmlnaHQuaXNEb3duICYmICFrZXlzLmxlZnQuaXNEb3duKSB7XG4gICAgICBhY3Rpb25zLnJ1bigncmlnaHQnKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5cy51cC5pc0Rvd24pIHtcbiAgICAgIGFjdGlvbnMuanVtcCgpO1xuICAgIH1cblxuICAgIGlmIChrZXlzLmRvd24uaXNEb3duKSB7XG4gICAgICBhY3Rpb25zLmR1Y2soKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgIGFjdGlvbnMuc3RhbmQoKTtcbiAgICB9XG5cbiAgICAoZnVuY3Rpb24gYXBwbHlGcmljdGlvbigpIHtcbiAgICAgIC8vIGhlcmUncyBhbiBpZGVhIHdoaWNoIHNvbHZlcyB0aGUgc2xpZGluZyBnbGl0Y2gsIGJ1dCBpdCBkb2Vzbid0IGZlZWwgYXMgZ29vZFxuICAgICAgLyppZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAha2V5cy5sZWZ0LmlzRG93biAmJiAha2V5cy5yaWdodC5pc0Rvd24pIHtcbiAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggIT09IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IHBsYXllci5ib2R5LnZlbG9jaXR5LnggLyA4O1xuICAgICAgICB9XG4gICAgICB9Ki9cbiAgICAgIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmICFwbGF5ZXIuaXNSb2xsaW5nKSB7XG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID4gMCkge1xuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gNDtcbiAgICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IDwgMCkge1xuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKz0gNDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0oKSk7XG4gIH07XG5cbiAgcmV0dXJuIHBsYXllcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUGxheWVyO1xuIiwidmFyIHV0aWxzID0ge1xuICAvLyBmcm9tIHVuZGVyc2NvcmVcbiAgZGVib3VuY2U6IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuXHR2YXIgdGltZW91dDtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0aWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0fTtcblx0XHR2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcblx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzOyJdfQ==
