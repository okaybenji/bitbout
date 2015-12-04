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
  game.load.image('white', 'images/white.png');
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
      up: 'W', down: 'S', left: 'A', right: 'D', attack: 'Q'
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
      up: 'I', down: 'K', left: 'J', right: 'L', attack: 'U'
    },
  };

  players.add(createPlayer(game, player1));
  players.add(createPlayer(game, player2));
};

var update = function update() {

  game.physics.arcade.collide(players, platforms);
  // TODO: how do i do this on the player itself without access to players? or should i add a ftn to player and set that as the cb?
  game.physics.arcade.collide(players, players, function handlePlayerCollision(playerA, playerB) {
    function temporarilyDisableCollision(player) {
      player.isCollidable = false;
      setTimeout(function() {
        player.isCollidable = true;
      }, 100);
    }

    function bounce() {
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
    }

    function fling() {
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
    }

    function pop() {
      var playerToPop;
      if (playerA.isRolling) {
        playerToPop = playerB;
      } else {
        playerToPop = playerA;
      }
      temporarilyDisableCollision(playerToPop);
      playerToPop.body.velocity.y = -150;
    }

    var bothRolling = playerA.isRolling && playerB.isRolling;
    var bothStanding = !playerA.isDucking && !playerB.isDucking;
    var neitherRolling = !playerA.isRolling && !playerB.isRolling;
    var eitherDucking = playerA.isDucking || playerB.isDucking;
    var eitherRunning = Math.abs(playerA.body.velocity.x) > 28 || Math.abs(playerB.body.velocity.x) >= 28;
    var eitherRolling = playerA.isRolling || playerB.isRolling;
    var eitherStanding = !playerA.isDucking || !playerB.isDucking;

    switch (true) {
      case bothRolling || bothStanding:
        bounce();
        break;
      case neitherRolling && eitherRunning && eitherDucking:
        fling();
        break;
      case eitherRolling && eitherStanding:
        pop();
        break;
    }

    // if only one of the touching players is attacking...
    if (playerA.isAttacking !== playerB.isAttacking) {
      var victim = playerA.isAttacking ? playerB : playerA;
      if (playerA.orientation !== playerB.orientation) {
        victim.actions.takeDamage(1);
      } else {
        victim.actions.takeDamage(2); // attacked from behind for double damage
      }
    }

  }, function allowPlayerCollision(playerA, playerB) {
    /* don't allow collision if either player isn't collidable.
       also, let's not knock anybody around if something's on one of these dude's heads.
       prevents cannonball attacks and the like, and allows standing on heads. */
    var eitherHasHeadwear = playerA.body.touching.up || playerB.body.touching.up;
    if (!playerA.isCollidable || !playerB.isCollidable || eitherHasHeadwear) {
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
    attack: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.attack]),
  };

  var actions = {
    attack: function attack() {
      var duration = 200;
      var interval = 400;
      var velocity = 200;

      if (Date.now() < player.lastAttacked + interval) {
        return;
      }

      player.isAttacking = true;
      player.lastAttacked = Date.now();

      switch(player.orientation) {
        case 'left':
          player.body.velocity.x = -velocity;
          break;
        case 'right':
          player.body.velocity.x = velocity;
          break;
      }

      player.loadTexture('white');
      setTimeout(function endAttack() {
        player.loadTexture(settings.color);
        player.isAttacking = false;
      }, duration);
    },

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
      // prevent taking more damage than hp remaining in a current heart
      if (amount > 1 && (player.hp - amount) % 2 !== 0) {
        amount = 1;
      }

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
  player.isAttacking = false;
  player.lastAttacked = 0;
  player.isCollidable = true;

  player.actions = actions;

  // track health
  player.hp = player.maxHp = 6; // TODO: allow setting custom hp amount for each player
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
      actions.takeDamage(2);
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

    if (keys.attack.isDown) {
      actions.attack();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2dhbWUuanMiLCJzY3JpcHRzL21hcC5qcyIsInNjcmlwdHMvcGxheWVyLmpzIiwic2NyaXB0cy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIG5hdGl2ZVdpZHRoID0gMzIwO1xudmFyIG5hdGl2ZUhlaWdodCA9IDE4MDtcbnZhciBwbGF0Zm9ybXMsIHBsYXllcnM7XG5cbnZhciByZXNpemUgPSBmdW5jdGlvbiByZXNpemUoKSB7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUuem9vbSA9IHdpbmRvdy5pbm5lcldpZHRoIC8gbmF0aXZlV2lkdGg7XG59O1xuXG52YXIgY2hlY2tGb3JHYW1lT3ZlciA9IGZ1bmN0aW9uIGNoZWNrRm9yR2FtZU92ZXIoKSB7XG4gIHZhciBhbGl2ZVBsYXllcnMgPSBbXTtcbiAgcGxheWVycy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKHBsYXllcikge1xuICAgIGlmIChwbGF5ZXIuaHAgPiAwKSB7XG4gICAgICBhbGl2ZVBsYXllcnMucHVzaChwbGF5ZXIubmFtZSk7XG4gICAgfVxuICB9KTtcbiAgaWYgKGFsaXZlUGxheWVycy5sZW5ndGggPT09IDEpIHtcbiAgICAvLyBUT0RPOiB3aHkgaXMgdGhpcyBmb250IHN0aWxsIGFudGktYWxpYXNlZD9cbiAgICB2YXIgc3R5bGUgPSB7IGZvbnQ6IFwiMTJweCBIZWxsb3ZldGljYVwiLCBmaWxsOiBcIiNlZWVcIiwgYWxpZ246IFwiY2VudGVyXCIsIGJvdW5kc0FsaWduSDogXCJjZW50ZXJcIiwgYm91bmRzQWxpZ25WOiBcIm1pZGRsZVwiIH07XG4gICAgdmFyIG1lc3NhZ2UgPSAnR2FtZSBvdmVyISAgJyArIGFsaXZlUGxheWVyc1swXSArICcgIHdpbnMhXFxuUmVmcmVzaCAgdG8gIHJlc3RhcnQnOyAvLyBUT0RPOiBhbGxvdyBwcmVzc2luZyBhbnkga2V5IHRvIHJlc3RhcnRcbiAgICBnYW1lLmFkZC50ZXh0KDAsIDAsIG1lc3NhZ2UsIHN0eWxlKVxuICAgICAgLnNldFRleHRCb3VuZHMoMCwgMCwgbmF0aXZlV2lkdGgsIG5hdGl2ZUhlaWdodCk7XG4gIH1cbn07XG5cbnZhciBwcmVsb2FkID0gZnVuY3Rpb24gcHJlbG9hZCgpIHtcbiAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xuICByZXNpemUoKTtcbiAgd2luZG93Lm9ucmVzaXplID0gdXRpbHMuZGVib3VuY2UocmVzaXplLCAxMDApO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3BpbmsnLCAnaW1hZ2VzL3BpbmsucG5nJyk7XG4gIGdhbWUubG9hZC5pbWFnZSgneWVsbG93JywgJ2ltYWdlcy95ZWxsb3cucG5nJyk7XG4gIGdhbWUubG9hZC5pbWFnZSgnYmx1ZScsICdpbWFnZXMvYmx1ZS5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCd3aGl0ZScsICdpbWFnZXMvd2hpdGUucG5nJyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnaGVhcnRzJywgJ2ltYWdlcy9oZWFydHMucG5nJywgOSwgNSk7IC8vIHBsYXllciBoZWFsdGhcbn07XG5cbnZhciBjcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICBnYW1lLndvcmxkLnNldEJvdW5kcygwLCAtbmF0aXZlSGVpZ2h0LCBuYXRpdmVXaWR0aCwgbmF0aXZlSGVpZ2h0ICogMyk7IC8vIGFsbG93IGFueXRoaW5nIGFzIHRhbGwgYXMgd29ybGQgdG8gZmFsbCBvZmYtc2NyZWVuIHVwIG9yIGRvd25cblxuICB2YXIgYnVpbGRQbGF0Zm9ybXMgPSByZXF1aXJlKCcuL21hcC5qcycpO1xuICBwbGF0Zm9ybXMgPSBidWlsZFBsYXRmb3JtcyhnYW1lKTtcblxuICB2YXIgY3JlYXRlUGxheWVyID0gcmVxdWlyZSgnLi9wbGF5ZXIuanMnKTtcbiAgcGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG5cbiAgdmFyIHBsYXllcjEgPSB7XG4gICAgbmFtZTogJ0JsdWUnLFxuICAgIGNvbG9yOiAnYmx1ZScsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCcsIGF0dGFjazogJ1EnXG4gICAgfSxcbiAgfTtcblxuICB2YXIgcGxheWVyMiA9IHtcbiAgICBuYW1lOiAnWWVsbG93JyxcbiAgICBjb2xvcjogJ3llbGxvdycsXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDMwNiwgeTogOFxuICAgIH0sXG4gICAgb3JpZW50YXRpb246ICdsZWZ0JyxcbiAgICBrZXlzOiB7XG4gICAgICB1cDogJ0knLCBkb3duOiAnSycsIGxlZnQ6ICdKJywgcmlnaHQ6ICdMJywgYXR0YWNrOiAnVSdcbiAgICB9LFxuICB9O1xuXG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIxKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIyKSk7XG59O1xuXG52YXIgdXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZShwbGF5ZXJzLCBwbGF0Zm9ybXMpO1xuICAvLyBUT0RPOiBob3cgZG8gaSBkbyB0aGlzIG9uIHRoZSBwbGF5ZXIgaXRzZWxmIHdpdGhvdXQgYWNjZXNzIHRvIHBsYXllcnM/IG9yIHNob3VsZCBpIGFkZCBhIGZ0biB0byBwbGF5ZXIgYW5kIHNldCB0aGF0IGFzIHRoZSBjYj9cbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHBsYXllcnMsIHBsYXllcnMsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckNvbGxpc2lvbihwbGF5ZXJBLCBwbGF5ZXJCKSB7XG4gICAgZnVuY3Rpb24gdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllcikge1xuICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICB9LCAxMDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJvdW5jZSgpIHtcbiAgICAgIHZhciBib3VuY2VWZWxvY2l0eSA9IDEwMDtcbiAgICAgIHZhciB2ZWxvY2l0eUEgPSB2ZWxvY2l0eUIgPSBib3VuY2VWZWxvY2l0eTtcbiAgICAgIGlmIChwbGF5ZXJBLnBvc2l0aW9uLnggPiBwbGF5ZXJCLnBvc2l0aW9uLngpIHtcbiAgICAgICAgdmVsb2NpdHlCICo9IC0xO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmVsb2NpdHlBICo9IC0xO1xuICAgICAgfVxuICAgICAgcGxheWVyQS5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eUE7XG4gICAgICBwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QjtcbiAgICAgIHBsYXllckEuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICBwbGF5ZXJCLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZsaW5nKCkge1xuICAgICAgdmFyIHBsYXllclRvRmxpbmc7XG4gICAgICB2YXIgcGxheWVyVG9MZWF2ZTtcbiAgICAgIGlmIChwbGF5ZXJBLmlzRHVja2luZykge1xuICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQjtcbiAgICAgICAgcGxheWVyVG9MZWF2ZSA9IHBsYXllckE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQTtcbiAgICAgICAgcGxheWVyVG9MZWF2ZSA9IHBsYXllckI7XG4gICAgICB9XG4gICAgICB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyVG9GbGluZyk7XG4gICAgICB2YXIgZmxpbmdYVmVsb2NpdHkgPSAxNTA7XG4gICAgICBpZiAocGxheWVyVG9GbGluZy5wb3NpdGlvbi54ID4gcGxheWVyVG9MZWF2ZS5wb3NpdGlvbi54KSB7XG4gICAgICAgIGZsaW5nWFZlbG9jaXR5ICo9IC0xO1xuICAgICAgfVxuICAgICAgcGxheWVyVG9GbGluZy5ib2R5LnZlbG9jaXR5LnggPSBmbGluZ1hWZWxvY2l0eTtcbiAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS55ID0gLTE1MDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3AoKSB7XG4gICAgICB2YXIgcGxheWVyVG9Qb3A7XG4gICAgICBpZiAocGxheWVyQS5pc1JvbGxpbmcpIHtcbiAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJCO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJBO1xuICAgICAgfVxuICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvUG9wKTtcbiAgICAgIHBsYXllclRvUG9wLmJvZHkudmVsb2NpdHkueSA9IC0xNTA7XG4gICAgfVxuXG4gICAgdmFyIGJvdGhSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgJiYgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgdmFyIGJvdGhTdGFuZGluZyA9ICFwbGF5ZXJBLmlzRHVja2luZyAmJiAhcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgdmFyIG5laXRoZXJSb2xsaW5nID0gIXBsYXllckEuaXNSb2xsaW5nICYmICFwbGF5ZXJCLmlzUm9sbGluZztcbiAgICB2YXIgZWl0aGVyRHVja2luZyA9IHBsYXllckEuaXNEdWNraW5nIHx8IHBsYXllckIuaXNEdWNraW5nO1xuICAgIHZhciBlaXRoZXJSdW5uaW5nID0gTWF0aC5hYnMocGxheWVyQS5ib2R5LnZlbG9jaXR5LngpID4gMjggfHwgTWF0aC5hYnMocGxheWVyQi5ib2R5LnZlbG9jaXR5LngpID49IDI4O1xuICAgIHZhciBlaXRoZXJSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgfHwgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgdmFyIGVpdGhlclN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nIHx8ICFwbGF5ZXJCLmlzRHVja2luZztcblxuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgY2FzZSBib3RoUm9sbGluZyB8fCBib3RoU3RhbmRpbmc6XG4gICAgICAgIGJvdW5jZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgbmVpdGhlclJvbGxpbmcgJiYgZWl0aGVyUnVubmluZyAmJiBlaXRoZXJEdWNraW5nOlxuICAgICAgICBmbGluZygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJTdGFuZGluZzpcbiAgICAgICAgcG9wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIGlmIG9ubHkgb25lIG9mIHRoZSB0b3VjaGluZyBwbGF5ZXJzIGlzIGF0dGFja2luZy4uLlxuICAgIGlmIChwbGF5ZXJBLmlzQXR0YWNraW5nICE9PSBwbGF5ZXJCLmlzQXR0YWNraW5nKSB7XG4gICAgICB2YXIgdmljdGltID0gcGxheWVyQS5pc0F0dGFja2luZyA/IHBsYXllckIgOiBwbGF5ZXJBO1xuICAgICAgaWYgKHBsYXllckEub3JpZW50YXRpb24gIT09IHBsYXllckIub3JpZW50YXRpb24pIHtcbiAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMik7IC8vIGF0dGFja2VkIGZyb20gYmVoaW5kIGZvciBkb3VibGUgZGFtYWdlXG4gICAgICB9XG4gICAgfVxuXG4gIH0sIGZ1bmN0aW9uIGFsbG93UGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAvKiBkb24ndCBhbGxvdyBjb2xsaXNpb24gaWYgZWl0aGVyIHBsYXllciBpc24ndCBjb2xsaWRhYmxlLlxuICAgICAgIGFsc28sIGxldCdzIG5vdCBrbm9jayBhbnlib2R5IGFyb3VuZCBpZiBzb21ldGhpbmcncyBvbiBvbmUgb2YgdGhlc2UgZHVkZSdzIGhlYWRzLlxuICAgICAgIHByZXZlbnRzIGNhbm5vbmJhbGwgYXR0YWNrcyBhbmQgdGhlIGxpa2UsIGFuZCBhbGxvd3Mgc3RhbmRpbmcgb24gaGVhZHMuICovXG4gICAgdmFyIGVpdGhlckhhc0hlYWR3ZWFyID0gcGxheWVyQS5ib2R5LnRvdWNoaW5nLnVwIHx8IHBsYXllckIuYm9keS50b3VjaGluZy51cDtcbiAgICBpZiAoIXBsYXllckEuaXNDb2xsaWRhYmxlIHx8ICFwbGF5ZXJCLmlzQ29sbGlkYWJsZSB8fCBlaXRoZXJIYXNIZWFkd2Vhcikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59O1xuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZShuYXRpdmVXaWR0aCwgbmF0aXZlSGVpZ2h0LCBQaGFzZXIuQVVUTywgJ2dhbWUnLCB7XG4gIHByZWxvYWQ6IHByZWxvYWQsXG4gIGNyZWF0ZTogY3JlYXRlLFxuICB1cGRhdGU6IHVwZGF0ZSxcbn0sIGZhbHNlLCBmYWxzZSk7IC8vIGRpc2FibGUgYW50aS1hbGlhc2luZ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNoZWNrRm9yR2FtZU92ZXI7XG4iLCJ2YXIgYnVpbGRQbGF0Zm9ybXMgPSBmdW5jdGlvbiBidWlsZFBsYXRmb3JtcyhnYW1lKSB7XG4gIHZhciBwbGF0Zm9ybXMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICBwbGF0Zm9ybXMuZW5hYmxlQm9keSA9IHRydWU7XG4gIHZhciBwbGF0Zm9ybVBvc2l0aW9ucyA9IFtbNDgsIDY0XSwgWzIwOCwgNjRdLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbMTI4LCAxMDRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgWzQ4LCAxNTQsXSwgWzIwOCwgMTU0XV07XG5cbiAgcGxhdGZvcm1Qb3NpdGlvbnMuZm9yRWFjaChmdW5jdGlvbihwb3NpdGlvbikge1xuICAgIHZhciBwbGF0Zm9ybSA9IHBsYXRmb3Jtcy5jcmVhdGUocG9zaXRpb25bMF0sIHBvc2l0aW9uWzFdLCAncGluaycpO1xuICAgIHBsYXRmb3JtLnNjYWxlLnNldFRvKDI0LCA0KTtcbiAgICBwbGF0Zm9ybS5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gIH0pO1xuXG4gIHZhciB3YWxscyA9IFtdO1xuICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoLTE2LCAzMiwgJ3BpbmsnKSk7XG4gIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgzMDQsIDMyLCAncGluaycpKTtcbiAgd2FsbHMuZm9yRWFjaChmdW5jdGlvbih3YWxsKSB7XG4gICAgd2FsbC5zY2FsZS5zZXRUbygxNiwgNzQpO1xuICAgIHdhbGwuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICB9KTtcbiAgXG4gIHJldHVybiBwbGF0Zm9ybXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1aWxkUGxhdGZvcm1zO1xuIiwidmFyIGNyZWF0ZVBsYXllciA9IGZ1bmN0aW9uIGNyZWF0ZVBsYXllcihnYW1lLCBvcHRpb25zKSB7XG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBwb3NpdGlvbjoge1xuICAgICAgeDogNCxcbiAgICAgIHk6IDhcbiAgICB9LFxuICAgIG9yaWVudGF0aW9uOiAncmlnaHQnLFxuICAgIGtleXM6IHtcbiAgICAgIHVwOiAnVVAnLFxuICAgICAgZG93bjogJ0RPV04nLFxuICAgICAgbGVmdDogJ0xFRlQnLFxuICAgICAgcmlnaHQ6ICdSSUdIVCcsXG4gICAgfSxcbiAgICBzY2FsZToge1xuICAgICAgeDogNCxcbiAgICAgIHk6IDhcbiAgICB9LFxuICAgIGNvbG9yOiAncGluaycsXG4gIH07XG5cbiAgdmFyIHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gIHZhciBrZXlzID0ge1xuICAgIHVwOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy51cF0pLFxuICAgIGRvd246IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmRvd25dKSxcbiAgICBsZWZ0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5sZWZ0XSksXG4gICAgcmlnaHQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnJpZ2h0XSksXG4gICAgYXR0YWNrOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5hdHRhY2tdKSxcbiAgfTtcblxuICB2YXIgYWN0aW9ucyA9IHtcbiAgICBhdHRhY2s6IGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDIwMDtcbiAgICAgIHZhciBpbnRlcnZhbCA9IDQwMDtcbiAgICAgIHZhciB2ZWxvY2l0eSA9IDIwMDtcblxuICAgICAgaWYgKERhdGUubm93KCkgPCBwbGF5ZXIubGFzdEF0dGFja2VkICsgaW50ZXJ2YWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSB0cnVlO1xuICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IERhdGUubm93KCk7XG5cbiAgICAgIHN3aXRjaChwbGF5ZXIub3JpZW50YXRpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC12ZWxvY2l0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKCd3aGl0ZScpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiBlbmRBdHRhY2soKSB7XG4gICAgICAgIHBsYXllci5sb2FkVGV4dHVyZShzZXR0aW5ncy5jb2xvcik7XG4gICAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IGZhbHNlO1xuICAgICAgfSwgZHVyYXRpb24pO1xuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uIHJ1bihkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBtYXhTcGVlZCA9IDY0O1xuICAgICAgdmFyIGFjY2VsZXJhdGlvbiA9IHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gPyA4IDogMzsgLy8gcGxheWVycyBoYXZlIGxlc3MgY29udHJvbCBpbiB0aGUgYWlyXG4gICAgICBwbGF5ZXIub3JpZW50YXRpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1heChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC0gYWNjZWxlcmF0aW9uLCAtbWF4U3BlZWQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWluKHBsYXllci5ib2R5LnZlbG9jaXR5LnggKyBhY2NlbGVyYXRpb24sIG1heFNwZWVkKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgYWN0aW9ucy5vcmllbnRIZWFydHMoZGlyZWN0aW9uKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIFRPRE86IGZpeCBsZWZ0IGhlYXJ0cyBwb3NpdGlvbiB3aGVuIGhwIGlzIGxlc3MgdGhhbiBtYXhcbiAgICBvcmllbnRIZWFydHM6IGZ1bmN0aW9uIG9yaWVudEhlYXJ0cyhkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBoZWFydERpc3RhbmNlID0gMS4xOyAvLyBob3cgY2xvc2UgaGVhcnRzIGZsb2F0IGJ5IHBsYXllclxuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcGxheWVyLmhlYXJ0cy5hbmNob3Iuc2V0VG8oLWhlYXJ0RGlzdGFuY2UsIDApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmhlYXJ0cy5hbmNob3Iuc2V0VG8oaGVhcnREaXN0YW5jZSwgMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGp1bXA6IGZ1bmN0aW9uIGp1bXAoKSB7XG4gICAgICAvLyBzb2Z0ZW4gdXB3YXJkIHZlbG9jaXR5IHdoZW4gcGxheWVyIHJlbGVhc2VzIGp1bXAga2V5XG4gICAgICB2YXIgZGFtcGVuSnVtcCA9IGZ1bmN0aW9uIGRhbXBlbkp1bXAoKSB7XG4gICAgICAgIHZhciBkYW1wZW5Ub1BlcmNlbnQgPSAwLjU7XG4gICAgICAgIC8vIFRPRE86IGRlY291cGxlIGtleSB0cmFja2luZyBmcm9tIGFjdGlvbnNcbiAgICAgICAga2V5cy51cC5vblVwLmFkZE9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ICo9IGRhbXBlblRvUGVyY2VudDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24pIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0yMDA7XG4gICAgICAgIGRhbXBlbkp1bXAoKTtcbiAgICAgIC8vIHdhbGwganVtcHNcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTI0MDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDkwO1xuICAgICAgICBkYW1wZW5KdW1wKCk7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLnJpZ2h0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMjQwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLTkwO1xuICAgICAgICBkYW1wZW5KdW1wKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGR1Y2s6IGZ1bmN0aW9uIGR1Y2soKSB7XG4gICAgICBpZiAoIXBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkgLyAyKTtcbiAgICAgICAgcGxheWVyLnkgKz0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSB0cnVlO1xuXG4gICAgICAoZnVuY3Rpb24gcm9sbCgpIHtcbiAgICAgICAgdmFyIGNhblJvbGwgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA+IDUwICYmIHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd247XG4gICAgICAgIGlmIChjYW5Sb2xsKSB7XG4gICAgICAgICAgcGxheWVyLmlzUm9sbGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0oKSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgIHBsYXllci55IC09IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSk7XG4gICAgICBwbGF5ZXIuaXNEdWNraW5nID0gZmFsc2U7XG4gICAgICBwbGF5ZXIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHRha2VEYW1hZ2U6IGZ1bmN0aW9uIHRha2VEYW1hZ2UoYW1vdW50KSB7XG4gICAgICAvLyBwcmV2ZW50IHRha2luZyBtb3JlIGRhbWFnZSB0aGFuIGhwIHJlbWFpbmluZyBpbiBhIGN1cnJlbnQgaGVhcnRcbiAgICAgIGlmIChhbW91bnQgPiAxICYmIChwbGF5ZXIuaHAgLSBhbW91bnQpICUgMiAhPT0gMCkge1xuICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIuaHAgLT0gYW1vdW50O1xuXG4gICAgICBpZiAocGxheWVyLmhwIDwgMCkge1xuICAgICAgICBwbGF5ZXIuaHAgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHBsYXllci5ocCAlIDIgPT09IDApIHtcbiAgICAgICAgYWN0aW9ucy5kaWUoKTtcbiAgICAgIH1cbiAgICAgIGFjdGlvbnMudXBkYXRlSGVhcnRzKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUhlYXJ0cygpIHtcbiAgICAgIHZhciBoZWFsdGhQZXJjZW50YWdlID0gcGxheWVyLmhwIC8gcGxheWVyLm1heEhwO1xuICAgICAgdmFyIGNyb3BXaWR0aCA9IE1hdGguY2VpbChoZWFsdGhQZXJjZW50YWdlICogaGVhcnRzV2lkdGgpO1xuICAgICAgdmFyIGNyb3BSZWN0ID0gbmV3IFBoYXNlci5SZWN0YW5nbGUoMCwgMCwgY3JvcFdpZHRoLCBwbGF5ZXIuaGVhcnRzLmhlaWdodCk7XG4gICAgICBwbGF5ZXIuaGVhcnRzLmNyb3AoY3JvcFJlY3QpO1xuICAgIH0sXG5cbiAgICBkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5ocCA+IDApIHtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnggPSBzZXR0aW5ncy5wb3NpdGlvbi54O1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueSA9IHNldHRpbmdzLnBvc2l0aW9uLnk7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRPRE86IGRldGFuZ2xlIHRoaXNcbiAgICAgICAgdmFyIGNoZWNrRm9yR2FtZU92ZXIgPSByZXF1aXJlKCcuL2dhbWUuanMnKTtcbiAgICAgICAgY2hlY2tGb3JHYW1lT3ZlcigpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB2YXIgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKHNldHRpbmdzLnBvc2l0aW9uLngsIHNldHRpbmdzLnBvc2l0aW9uLnksIHNldHRpbmdzLmNvbG9yKTtcbiAgcGxheWVyLm5hbWUgPSBzZXR0aW5ncy5uYW1lO1xuICBwbGF5ZXIub3JpZW50YXRpb24gPSBzZXR0aW5ncy5vcmllbnRhdGlvbjtcbiAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkpOyAvLyBUT0RPOiBhZGQgZ2lhbnQgbW9kZVxuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHBsYXllcik7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5ib2R5LmJvdW5jZS55ID0gLjI7IC8vIFRPRE86IGFsbG93IGJvdW5jZSBjb25maWd1cmF0aW9uXG4gIHBsYXllci5ib2R5LmdyYXZpdHkueSA9IDM4MDsgLy8gVE9ETzogYWxsb3cgZ3Jhdml0eSBjb25maWd1cmF0aW9uXG5cbiAgcGxheWVyLmlzUm9sbGluZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNEdWNraW5nID0gZmFsc2U7XG4gIHBsYXllci5pc0F0dGFja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIubGFzdEF0dGFja2VkID0gMDtcbiAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG5cbiAgcGxheWVyLmFjdGlvbnMgPSBhY3Rpb25zO1xuXG4gIC8vIHRyYWNrIGhlYWx0aFxuICBwbGF5ZXIuaHAgPSBwbGF5ZXIubWF4SHAgPSA2OyAvLyBUT0RPOiBhbGxvdyBzZXR0aW5nIGN1c3RvbSBocCBhbW91bnQgZm9yIGVhY2ggcGxheWVyXG4gIHBsYXllci5oZWFydHMgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2hlYXJ0cycpO1xuICB2YXIgaGVhcnRzV2lkdGggPSBwbGF5ZXIuaGVhcnRzLndpZHRoO1xuICBwbGF5ZXIuaGVhcnRzLnNldFNjYWxlTWluTWF4KDEsIDEpOyAvLyBwcmV2ZW50IGhlYXJ0cyBzY2FsaW5nIHcvIHBsYXllclxuICB2YXIgYm9iID0gcGxheWVyLmhlYXJ0cy5hbmltYXRpb25zLmFkZCgnYm9iJywgWzAsMSwyLDFdLCAzLCB0cnVlKTsgLy8gbmFtZSwgZnJhbWVzLCBmcmFtZXJhdGUsIGxvb3BcbiAgcGxheWVyLmhlYXJ0cy5hbmltYXRpb25zLnBsYXkoJ2JvYicpO1xuICBwbGF5ZXIuYWRkQ2hpbGQocGxheWVyLmhlYXJ0cyk7XG4gIGFjdGlvbnMub3JpZW50SGVhcnRzKHBsYXllci5vcmllbnRhdGlvbik7XG5cbiAgLy8gcGhhc2VyIGFwcGFyZW50bHkgYXV0b21hdGljYWxseSBjYWxscyBhbnkgZnVuY3Rpb24gbmFtZWQgdXBkYXRlIGF0dGFjaGVkIHRvIGEgc3ByaXRlIVxuICBwbGF5ZXIudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8ga2lsbCBwbGF5ZXIgaWYgaGUgZmFsbHMgb2ZmIHRoZSBzY3JlZW5cbiAgICBpZiAocGxheWVyLnBvc2l0aW9uLnkgPiAxODAgJiYgcGxheWVyLmhwICE9PSAwKSB7IC8vIFRPRE86IGhvdyB0byBhY2Nlc3MgbmF0aXZlIGhlaWdodCBmcm9tIGdhbWUuanM/XG4gICAgICBhY3Rpb25zLnRha2VEYW1hZ2UoMik7XG4gICAgfVxuXG4gICAgaWYgKGtleXMubGVmdC5pc0Rvd24gJiYgIWtleXMucmlnaHQuaXNEb3duKSB7XG4gICAgICBhY3Rpb25zLnJ1bignbGVmdCcpO1xuICAgIH0gZWxzZSBpZiAoa2V5cy5yaWdodC5pc0Rvd24gJiYgIWtleXMubGVmdC5pc0Rvd24pIHtcbiAgICAgIGFjdGlvbnMucnVuKCdyaWdodCcpO1xuICAgIH1cblxuICAgIGlmIChrZXlzLnVwLmlzRG93bikge1xuICAgICAgYWN0aW9ucy5qdW1wKCk7XG4gICAgfVxuXG4gICAgaWYgKGtleXMuZG93bi5pc0Rvd24pIHtcbiAgICAgIGFjdGlvbnMuZHVjaygpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLmlzRHVja2luZykge1xuICAgICAgYWN0aW9ucy5zdGFuZCgpO1xuICAgIH1cblxuICAgIGlmIChrZXlzLmF0dGFjay5pc0Rvd24pIHtcbiAgICAgIGFjdGlvbnMuYXR0YWNrKCk7XG4gICAgfVxuXG4gICAgKGZ1bmN0aW9uIGFwcGx5RnJpY3Rpb24oKSB7XG4gICAgICAvLyBoZXJlJ3MgYW4gaWRlYSB3aGljaCBzb2x2ZXMgdGhlIHNsaWRpbmcgZ2xpdGNoLCBidXQgaXQgZG9lc24ndCBmZWVsIGFzIGdvb2RcbiAgICAgIC8qaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgIWtleXMubGVmdC5pc0Rvd24gJiYgIWtleXMucmlnaHQuaXNEb3duKSB7XG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICE9PSAwKSB7XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC8gODtcbiAgICAgICAgfVxuICAgICAgfSovXG4gICAgICBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAhcGxheWVyLmlzUm9sbGluZykge1xuICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IDQ7XG4gICAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICs9IDQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KCkpO1xuICB9O1xuXG4gIHJldHVybiBwbGF5ZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBsYXllcjtcbiIsInZhciB1dGlscyA9IHtcbiAgLy8gZnJvbSB1bmRlcnNjb3JlXG4gIGRlYm91bmNlOiBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcblx0dmFyIHRpbWVvdXQ7XG5cdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdH07XG5cdFx0dmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG5cdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0fTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsczsiXX0=
