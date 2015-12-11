(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var nativeWidth = 320;
var nativeHeight = 180;
var platforms, players, text;

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
    text.setText('Game over!  ' + alivePlayers[0] + '  wins!\nClick  to  restart');
    text.visible = true;
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

  game.input.gamepad.start();

  // TODO: why is this font still anti-aliased?
  var fontStyle = { font: "12px Hellovetica", fill: "#eee", align: "center", boundsAlignH: "center", boundsAlignV: "middle" };
  text = game.add.text(0, 0, '', fontStyle);
  text.setTextBounds(0, 0, nativeWidth, nativeHeight);

  players = game.add.group();
  restart();
};

var restart = function() {
  text.visible = false;
  // TODO: why does this seem to occasionally only eliminate one of the players?
  players.forEach(function eliminatePlayer(player) {
    player.destroy();
  });

  var createPlayer = require('./player.js');

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
    gamepad: game.input.gamepad.pad2,
  };

  players.add(createPlayer(game, player1));
  players.add(createPlayer(game, player2));
};

var update = function update() {
  game.input.onDown.addOnce(restart, this);

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
  var platformPositions = [[48, 64], [224, 64],
                               [136, 104],
                           [48, 154,], [224, 154]];

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
    gamepad: game.input.gamepad.pad1,
  };

  var settings = Object.assign({}, defaults, options);

  var keys = {
    up: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.up]),
    down: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.down]),
    left: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.left]),
    right: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.right]),
    attack: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.attack]),
  };

  var gamepad = settings.gamepad;

  var upWasDown = false; // track input change for variable jump height

  var actions = {
    attack: function attack() {
      var duration = 200;
      var interval = 400;
      var velocity = 200;

      var canAttack = (Date.now() > player.lastAttacked + interval) && !player.isDucking;
      if (!canAttack) {
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
      setTimeout(actions.endAttack, duration);
    },

    endAttack: function endAttack() {
      if (player.isAttacking) {
        player.loadTexture(settings.color);
        player.isAttacking = false;
      }
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
      if (player.body.touching.down) {
        player.body.velocity.y = -200;
      // wall jumps
      } else if (player.body.touching.left) {
        player.body.velocity.y = -240;
        player.body.velocity.x = 90;
      } else if (player.body.touching.right) {
        player.body.velocity.y = -240;
        player.body.velocity.x = -90;
      }
    },

    dampenJump: function dampenJump() {
      // soften upward velocity when player releases jump key
        var dampenToPercent = 0.5;

        if (player.body.velocity.y < 0) {
          player.body.velocity.y *= dampenToPercent;
        }
    },

    duck: function duck() {
      if (player.isAttacking) {
        return;
      }

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

    updateHearts: function() {
      var healthPercentage = player.hp / player.maxHp;
      var cropWidth = Math.ceil(healthPercentage * heartsWidth);
      var cropRect = new Phaser.Rectangle(0, 0, cropWidth, player.hearts.height);
      player.hearts.crop(cropRect);
    },

    die: function() {
      if (player.hp > 0) {
        actions.endAttack();
        player.lastAttacked = 0;

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
  player.body.bounce.y = 0.2; // TODO: allow bounce configuration
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

    var input = {
      left:   (keys.left.isDown && !keys.right.isDown) ||
              (gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) && !gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT)) ||
              gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1 ||
              gamepad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) < -0.1,
      right:  (keys.right.isDown && !keys.left.isDown) ||
              (gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) && !gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT)) ||
              gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1 ||
              gamepad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) > 0.1,
      up:     keys.up.isDown ||
              gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_UP) ||
              gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1 ||
              gamepad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) < -0.1 ||
              gamepad.isDown(Phaser.Gamepad.XBOX360_A),
      down:   keys.down.isDown ||
              gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN) ||
              gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1 ||
              gamepad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) > 0.1,
      attack: keys.attack.isDown ||
              gamepad.justPressed(Phaser.Gamepad.XBOX360_X) ||
              gamepad.justPressed(Phaser.Gamepad.XBOX360_Y) ||
              gamepad.justPressed(Phaser.Gamepad.XBOX360_B) ||
              gamepad.justPressed(Phaser.Gamepad.XBOX360_LEFT_BUMPER) ||
              gamepad.justPressed(Phaser.Gamepad.XBOX360_LEFT_TRIGGER) ||
              gamepad.justPressed(Phaser.Gamepad.XBOX360_RIGHT_BUMPER) ||
              gamepad.justPressed(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER),
    };

    if (input.left) {
      console.log(Phaser.Gamepad.toString());
      actions.run('left');
    } else if (input.right) {
      actions.run('right');
    }

    if (input.up) {
      upWasDown = true;
      actions.jump();
    } else if (upWasDown) {
      upWasDown = false;
      actions.dampenJump();
    }

    if (input.down) {
      actions.duck();
    } else if (player.isDucking) {
      actions.stand();
    }

    if (input.attack) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2dhbWUuanMiLCJzY3JpcHRzL21hcC5qcyIsInNjcmlwdHMvcGxheWVyLmpzIiwic2NyaXB0cy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbmF0aXZlV2lkdGggPSAzMjA7XG52YXIgbmF0aXZlSGVpZ2h0ID0gMTgwO1xudmFyIHBsYXRmb3JtcywgcGxheWVycywgdGV4dDtcblxudmFyIHJlc2l6ZSA9IGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS56b29tID0gd2luZG93LmlubmVyV2lkdGggLyBuYXRpdmVXaWR0aDtcbn07XG5cbnZhciBjaGVja0ZvckdhbWVPdmVyID0gZnVuY3Rpb24gY2hlY2tGb3JHYW1lT3ZlcigpIHtcbiAgdmFyIGFsaXZlUGxheWVycyA9IFtdO1xuICBwbGF5ZXJzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24ocGxheWVyKSB7XG4gICAgaWYgKHBsYXllci5ocCA+IDApIHtcbiAgICAgIGFsaXZlUGxheWVycy5wdXNoKHBsYXllci5uYW1lKTtcbiAgICB9XG4gIH0pO1xuICBpZiAoYWxpdmVQbGF5ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgIHRleHQuc2V0VGV4dCgnR2FtZSBvdmVyISAgJyArIGFsaXZlUGxheWVyc1swXSArICcgIHdpbnMhXFxuQ2xpY2sgIHRvICByZXN0YXJ0Jyk7XG4gICAgdGV4dC52aXNpYmxlID0gdHJ1ZTtcbiAgfVxufTtcblxudmFyIHByZWxvYWQgPSBmdW5jdGlvbiBwcmVsb2FkKCkge1xuICB2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG4gIHJlc2l6ZSgpO1xuICB3aW5kb3cub25yZXNpemUgPSB1dGlscy5kZWJvdW5jZShyZXNpemUsIDEwMCk7XG4gIGdhbWUubG9hZC5pbWFnZSgncGluaycsICdpbWFnZXMvcGluay5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCd5ZWxsb3cnLCAnaW1hZ2VzL3llbGxvdy5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdibHVlJywgJ2ltYWdlcy9ibHVlLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3doaXRlJywgJ2ltYWdlcy93aGl0ZS5wbmcnKTtcbiAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdoZWFydHMnLCAnaW1hZ2VzL2hlYXJ0cy5wbmcnLCA5LCA1KTsgLy8gcGxheWVyIGhlYWx0aFxufTtcblxudmFyIGNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgZ2FtZS5waHlzaWNzLnN0YXJ0U3lzdGVtKFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gIGdhbWUud29ybGQuc2V0Qm91bmRzKDAsIC1uYXRpdmVIZWlnaHQsIG5hdGl2ZVdpZHRoLCBuYXRpdmVIZWlnaHQgKiAzKTsgLy8gYWxsb3cgYW55dGhpbmcgYXMgdGFsbCBhcyB3b3JsZCB0byBmYWxsIG9mZi1zY3JlZW4gdXAgb3IgZG93blxuXG4gIHZhciBidWlsZFBsYXRmb3JtcyA9IHJlcXVpcmUoJy4vbWFwLmpzJyk7XG4gIHBsYXRmb3JtcyA9IGJ1aWxkUGxhdGZvcm1zKGdhbWUpO1xuXG4gIGdhbWUuaW5wdXQuZ2FtZXBhZC5zdGFydCgpO1xuXG4gIC8vIFRPRE86IHdoeSBpcyB0aGlzIGZvbnQgc3RpbGwgYW50aS1hbGlhc2VkP1xuICB2YXIgZm9udFN0eWxlID0geyBmb250OiBcIjEycHggSGVsbG92ZXRpY2FcIiwgZmlsbDogXCIjZWVlXCIsIGFsaWduOiBcImNlbnRlclwiLCBib3VuZHNBbGlnbkg6IFwiY2VudGVyXCIsIGJvdW5kc0FsaWduVjogXCJtaWRkbGVcIiB9O1xuICB0ZXh0ID0gZ2FtZS5hZGQudGV4dCgwLCAwLCAnJywgZm9udFN0eWxlKTtcbiAgdGV4dC5zZXRUZXh0Qm91bmRzKDAsIDAsIG5hdGl2ZVdpZHRoLCBuYXRpdmVIZWlnaHQpO1xuXG4gIHBsYXllcnMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICByZXN0YXJ0KCk7XG59O1xuXG52YXIgcmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0ZXh0LnZpc2libGUgPSBmYWxzZTtcbiAgLy8gVE9ETzogd2h5IGRvZXMgdGhpcyBzZWVtIHRvIG9jY2FzaW9uYWxseSBvbmx5IGVsaW1pbmF0ZSBvbmUgb2YgdGhlIHBsYXllcnM/XG4gIHBsYXllcnMuZm9yRWFjaChmdW5jdGlvbiBlbGltaW5hdGVQbGF5ZXIocGxheWVyKSB7XG4gICAgcGxheWVyLmRlc3Ryb3koKTtcbiAgfSk7XG5cbiAgdmFyIGNyZWF0ZVBsYXllciA9IHJlcXVpcmUoJy4vcGxheWVyLmpzJyk7XG5cbiAgdmFyIHBsYXllcjEgPSB7XG4gICAgbmFtZTogJ0JsdWUnLFxuICAgIGNvbG9yOiAnYmx1ZScsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCcsIGF0dGFjazogJ1EnXG4gICAgfSxcbiAgfTtcblxuICB2YXIgcGxheWVyMiA9IHtcbiAgICBuYW1lOiAnWWVsbG93JyxcbiAgICBjb2xvcjogJ3llbGxvdycsXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDMwNiwgeTogOFxuICAgIH0sXG4gICAgb3JpZW50YXRpb246ICdsZWZ0JyxcbiAgICBrZXlzOiB7XG4gICAgICB1cDogJ0knLCBkb3duOiAnSycsIGxlZnQ6ICdKJywgcmlnaHQ6ICdMJywgYXR0YWNrOiAnVSdcbiAgICB9LFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLFxuICB9O1xuXG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIxKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIyKSk7XG59O1xuXG52YXIgdXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuICBnYW1lLmlucHV0Lm9uRG93bi5hZGRPbmNlKHJlc3RhcnQsIHRoaXMpO1xuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZShwbGF5ZXJzLCBwbGF0Zm9ybXMpO1xuICAvLyBUT0RPOiBob3cgZG8gaSBkbyB0aGlzIG9uIHRoZSBwbGF5ZXIgaXRzZWxmIHdpdGhvdXQgYWNjZXNzIHRvIHBsYXllcnM/IG9yIHNob3VsZCBpIGFkZCBhIGZ0biB0byBwbGF5ZXIgYW5kIHNldCB0aGF0IGFzIHRoZSBjYj9cbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHBsYXllcnMsIHBsYXllcnMsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckNvbGxpc2lvbihwbGF5ZXJBLCBwbGF5ZXJCKSB7XG4gICAgZnVuY3Rpb24gdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllcikge1xuICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICB9LCAxMDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJvdW5jZSgpIHtcbiAgICAgIHZhciBib3VuY2VWZWxvY2l0eSA9IDEwMDtcbiAgICAgIHZhciB2ZWxvY2l0eUEgPSB2ZWxvY2l0eUIgPSBib3VuY2VWZWxvY2l0eTtcbiAgICAgIGlmIChwbGF5ZXJBLnBvc2l0aW9uLnggPiBwbGF5ZXJCLnBvc2l0aW9uLngpIHtcbiAgICAgICAgdmVsb2NpdHlCICo9IC0xO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmVsb2NpdHlBICo9IC0xO1xuICAgICAgfVxuICAgICAgcGxheWVyQS5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eUE7XG4gICAgICBwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QjtcbiAgICAgIHBsYXllckEuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICBwbGF5ZXJCLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZsaW5nKCkge1xuICAgICAgdmFyIHBsYXllclRvRmxpbmc7XG4gICAgICB2YXIgcGxheWVyVG9MZWF2ZTtcbiAgICAgIGlmIChwbGF5ZXJBLmlzRHVja2luZykge1xuICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQjtcbiAgICAgICAgcGxheWVyVG9MZWF2ZSA9IHBsYXllckE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQTtcbiAgICAgICAgcGxheWVyVG9MZWF2ZSA9IHBsYXllckI7XG4gICAgICB9XG4gICAgICB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyVG9GbGluZyk7XG4gICAgICB2YXIgZmxpbmdYVmVsb2NpdHkgPSAxNTA7XG4gICAgICBpZiAocGxheWVyVG9GbGluZy5wb3NpdGlvbi54ID4gcGxheWVyVG9MZWF2ZS5wb3NpdGlvbi54KSB7XG4gICAgICAgIGZsaW5nWFZlbG9jaXR5ICo9IC0xO1xuICAgICAgfVxuICAgICAgcGxheWVyVG9GbGluZy5ib2R5LnZlbG9jaXR5LnggPSBmbGluZ1hWZWxvY2l0eTtcbiAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS55ID0gLTE1MDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3AoKSB7XG4gICAgICB2YXIgcGxheWVyVG9Qb3A7XG4gICAgICBpZiAocGxheWVyQS5pc1JvbGxpbmcpIHtcbiAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJCO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJBO1xuICAgICAgfVxuICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvUG9wKTtcbiAgICAgIHBsYXllclRvUG9wLmJvZHkudmVsb2NpdHkueSA9IC0xNTA7XG4gICAgfVxuXG4gICAgdmFyIGJvdGhSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgJiYgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgdmFyIGJvdGhTdGFuZGluZyA9ICFwbGF5ZXJBLmlzRHVja2luZyAmJiAhcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgdmFyIG5laXRoZXJSb2xsaW5nID0gIXBsYXllckEuaXNSb2xsaW5nICYmICFwbGF5ZXJCLmlzUm9sbGluZztcbiAgICB2YXIgZWl0aGVyRHVja2luZyA9IHBsYXllckEuaXNEdWNraW5nIHx8IHBsYXllckIuaXNEdWNraW5nO1xuICAgIHZhciBlaXRoZXJSdW5uaW5nID0gTWF0aC5hYnMocGxheWVyQS5ib2R5LnZlbG9jaXR5LngpID4gMjggfHwgTWF0aC5hYnMocGxheWVyQi5ib2R5LnZlbG9jaXR5LngpID49IDI4O1xuICAgIHZhciBlaXRoZXJSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgfHwgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgdmFyIGVpdGhlclN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nIHx8ICFwbGF5ZXJCLmlzRHVja2luZztcblxuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgY2FzZSBib3RoUm9sbGluZyB8fCBib3RoU3RhbmRpbmc6XG4gICAgICAgIGJvdW5jZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgbmVpdGhlclJvbGxpbmcgJiYgZWl0aGVyUnVubmluZyAmJiBlaXRoZXJEdWNraW5nOlxuICAgICAgICBmbGluZygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJTdGFuZGluZzpcbiAgICAgICAgcG9wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIGlmIG9ubHkgb25lIG9mIHRoZSB0b3VjaGluZyBwbGF5ZXJzIGlzIGF0dGFja2luZy4uLlxuICAgIGlmIChwbGF5ZXJBLmlzQXR0YWNraW5nICE9PSBwbGF5ZXJCLmlzQXR0YWNraW5nKSB7XG4gICAgICB2YXIgdmljdGltID0gcGxheWVyQS5pc0F0dGFja2luZyA/IHBsYXllckIgOiBwbGF5ZXJBO1xuICAgICAgaWYgKHBsYXllckEub3JpZW50YXRpb24gIT09IHBsYXllckIub3JpZW50YXRpb24pIHtcbiAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMik7IC8vIGF0dGFja2VkIGZyb20gYmVoaW5kIGZvciBkb3VibGUgZGFtYWdlXG4gICAgICB9XG4gICAgfVxuXG4gIH0sIGZ1bmN0aW9uIGFsbG93UGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAvKiBkb24ndCBhbGxvdyBjb2xsaXNpb24gaWYgZWl0aGVyIHBsYXllciBpc24ndCBjb2xsaWRhYmxlLlxuICAgICAgIGFsc28sIGxldCdzIG5vdCBrbm9jayBhbnlib2R5IGFyb3VuZCBpZiBzb21ldGhpbmcncyBvbiBvbmUgb2YgdGhlc2UgZHVkZSdzIGhlYWRzLlxuICAgICAgIHByZXZlbnRzIGNhbm5vbmJhbGwgYXR0YWNrcyBhbmQgdGhlIGxpa2UsIGFuZCBhbGxvd3Mgc3RhbmRpbmcgb24gaGVhZHMuICovXG4gICAgdmFyIGVpdGhlckhhc0hlYWR3ZWFyID0gcGxheWVyQS5ib2R5LnRvdWNoaW5nLnVwIHx8IHBsYXllckIuYm9keS50b3VjaGluZy51cDtcbiAgICBpZiAoIXBsYXllckEuaXNDb2xsaWRhYmxlIHx8ICFwbGF5ZXJCLmlzQ29sbGlkYWJsZSB8fCBlaXRoZXJIYXNIZWFkd2Vhcikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59O1xuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZShuYXRpdmVXaWR0aCwgbmF0aXZlSGVpZ2h0LCBQaGFzZXIuQVVUTywgJ2dhbWUnLCB7XG4gIHByZWxvYWQ6IHByZWxvYWQsXG4gIGNyZWF0ZTogY3JlYXRlLFxuICB1cGRhdGU6IHVwZGF0ZSxcbn0sIGZhbHNlLCBmYWxzZSk7IC8vIGRpc2FibGUgYW50aS1hbGlhc2luZ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNoZWNrRm9yR2FtZU92ZXI7XG4iLCJ2YXIgYnVpbGRQbGF0Zm9ybXMgPSBmdW5jdGlvbiBidWlsZFBsYXRmb3JtcyhnYW1lKSB7XG4gIHZhciBwbGF0Zm9ybXMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICBwbGF0Zm9ybXMuZW5hYmxlQm9keSA9IHRydWU7XG4gIHZhciBwbGF0Zm9ybVBvc2l0aW9ucyA9IFtbNDgsIDY0XSwgWzIyNCwgNjRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsxMzYsIDEwNF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBbNDgsIDE1NCxdLCBbMjI0LCAxNTRdXTtcblxuICBwbGF0Zm9ybVBvc2l0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG4gICAgdmFyIHBsYXRmb3JtID0gcGxhdGZvcm1zLmNyZWF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sICdwaW5rJyk7XG4gICAgcGxhdGZvcm0uc2NhbGUuc2V0VG8oMjQsIDQpO1xuICAgIHBsYXRmb3JtLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgfSk7XG5cbiAgdmFyIHdhbGxzID0gW107XG4gIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgtMTYsIDMyLCAncGluaycpKTtcbiAgd2FsbHMucHVzaChwbGF0Zm9ybXMuY3JlYXRlKDMwNCwgMzIsICdwaW5rJykpO1xuICB3YWxscy5mb3JFYWNoKGZ1bmN0aW9uKHdhbGwpIHtcbiAgICB3YWxsLnNjYWxlLnNldFRvKDE2LCA3NCk7XG4gICAgd2FsbC5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gIH0pO1xuICBcbiAgcmV0dXJuIHBsYXRmb3Jtcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnVpbGRQbGF0Zm9ybXM7XG4iLCJ2YXIgY3JlYXRlUGxheWVyID0gZnVuY3Rpb24gY3JlYXRlUGxheWVyKGdhbWUsIG9wdGlvbnMpIHtcbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIHBvc2l0aW9uOiB7XG4gICAgICB4OiA0LFxuICAgICAgeTogOFxuICAgIH0sXG4gICAgb3JpZW50YXRpb246ICdyaWdodCcsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdVUCcsXG4gICAgICBkb3duOiAnRE9XTicsXG4gICAgICBsZWZ0OiAnTEVGVCcsXG4gICAgICByaWdodDogJ1JJR0hUJyxcbiAgICB9LFxuICAgIHNjYWxlOiB7XG4gICAgICB4OiA0LFxuICAgICAgeTogOFxuICAgIH0sXG4gICAgY29sb3I6ICdwaW5rJyxcbiAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgfTtcblxuICB2YXIgc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgdmFyIGtleXMgPSB7XG4gICAgdXA6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnVwXSksXG4gICAgZG93bjogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuZG93bl0pLFxuICAgIGxlZnQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmxlZnRdKSxcbiAgICByaWdodDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMucmlnaHRdKSxcbiAgICBhdHRhY2s6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmF0dGFja10pLFxuICB9O1xuXG4gIHZhciBnYW1lcGFkID0gc2V0dGluZ3MuZ2FtZXBhZDtcblxuICB2YXIgdXBXYXNEb3duID0gZmFsc2U7IC8vIHRyYWNrIGlucHV0IGNoYW5nZSBmb3IgdmFyaWFibGUganVtcCBoZWlnaHRcblxuICB2YXIgYWN0aW9ucyA9IHtcbiAgICBhdHRhY2s6IGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDIwMDtcbiAgICAgIHZhciBpbnRlcnZhbCA9IDQwMDtcbiAgICAgIHZhciB2ZWxvY2l0eSA9IDIwMDtcblxuICAgICAgdmFyIGNhbkF0dGFjayA9IChEYXRlLm5vdygpID4gcGxheWVyLmxhc3RBdHRhY2tlZCArIGludGVydmFsKSAmJiAhcGxheWVyLmlzRHVja2luZztcbiAgICAgIGlmICghY2FuQXR0YWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmlzQXR0YWNraW5nID0gdHJ1ZTtcbiAgICAgIHBsYXllci5sYXN0QXR0YWNrZWQgPSBEYXRlLm5vdygpO1xuXG4gICAgICBzd2l0Y2gocGxheWVyLm9yaWVudGF0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAtdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5sb2FkVGV4dHVyZSgnd2hpdGUnKTtcbiAgICAgIHNldFRpbWVvdXQoYWN0aW9ucy5lbmRBdHRhY2ssIGR1cmF0aW9uKTtcbiAgICB9LFxuXG4gICAgZW5kQXR0YWNrOiBmdW5jdGlvbiBlbmRBdHRhY2soKSB7XG4gICAgICBpZiAocGxheWVyLmlzQXR0YWNraW5nKSB7XG4gICAgICAgIHBsYXllci5sb2FkVGV4dHVyZShzZXR0aW5ncy5jb2xvcik7XG4gICAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uIHJ1bihkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBtYXhTcGVlZCA9IDY0O1xuICAgICAgdmFyIGFjY2VsZXJhdGlvbiA9IHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gPyA4IDogMzsgLy8gcGxheWVycyBoYXZlIGxlc3MgY29udHJvbCBpbiB0aGUgYWlyXG4gICAgICBwbGF5ZXIub3JpZW50YXRpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1heChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC0gYWNjZWxlcmF0aW9uLCAtbWF4U3BlZWQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWluKHBsYXllci5ib2R5LnZlbG9jaXR5LnggKyBhY2NlbGVyYXRpb24sIG1heFNwZWVkKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgYWN0aW9ucy5vcmllbnRIZWFydHMoZGlyZWN0aW9uKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIFRPRE86IGZpeCBsZWZ0IGhlYXJ0cyBwb3NpdGlvbiB3aGVuIGhwIGlzIGxlc3MgdGhhbiBtYXhcbiAgICBvcmllbnRIZWFydHM6IGZ1bmN0aW9uIG9yaWVudEhlYXJ0cyhkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBoZWFydERpc3RhbmNlID0gMS4xOyAvLyBob3cgY2xvc2UgaGVhcnRzIGZsb2F0IGJ5IHBsYXllclxuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcGxheWVyLmhlYXJ0cy5hbmNob3Iuc2V0VG8oLWhlYXJ0RGlzdGFuY2UsIDApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmhlYXJ0cy5hbmNob3Iuc2V0VG8oaGVhcnREaXN0YW5jZSwgMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGp1bXA6IGZ1bmN0aW9uIGp1bXAoKSB7XG4gICAgICBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93bikge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTIwMDtcbiAgICAgIC8vIHdhbGwganVtcHNcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTI0MDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDkwO1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5yaWdodCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTI0MDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC05MDtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGFtcGVuSnVtcDogZnVuY3Rpb24gZGFtcGVuSnVtcCgpIHtcbiAgICAgIC8vIHNvZnRlbiB1cHdhcmQgdmVsb2NpdHkgd2hlbiBwbGF5ZXIgcmVsZWFzZXMganVtcCBrZXlcbiAgICAgICAgdmFyIGRhbXBlblRvUGVyY2VudCA9IDAuNTtcblxuICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueSA8IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ICo9IGRhbXBlblRvUGVyY2VudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkdWNrOiBmdW5jdGlvbiBkdWNrKCkge1xuICAgICAgaWYgKHBsYXllci5pc0F0dGFja2luZykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxheWVyLmlzRHVja2luZykge1xuICAgICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSAvIDIpO1xuICAgICAgICBwbGF5ZXIueSArPSBzZXR0aW5ncy5zY2FsZS55O1xuICAgICAgfVxuICAgICAgcGxheWVyLmlzRHVja2luZyA9IHRydWU7XG5cbiAgICAgIChmdW5jdGlvbiByb2xsKCkge1xuICAgICAgICB2YXIgY2FuUm9sbCA9IE1hdGguYWJzKHBsYXllci5ib2R5LnZlbG9jaXR5LngpID4gNTAgJiYgcGxheWVyLmJvZHkudG91Y2hpbmcuZG93bjtcbiAgICAgICAgaWYgKGNhblJvbGwpIHtcbiAgICAgICAgICBwbGF5ZXIuaXNSb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSgpKTtcbiAgICB9LFxuXG4gICAgc3RhbmQ6IGZ1bmN0aW9uIHN0YW5kKCkge1xuICAgICAgcGxheWVyLnkgLT0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBzZXR0aW5ncy5zY2FsZS55KTtcbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSBmYWxzZTtcbiAgICAgIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgdGFrZURhbWFnZTogZnVuY3Rpb24gdGFrZURhbWFnZShhbW91bnQpIHtcbiAgICAgIC8vIHByZXZlbnQgdGFraW5nIG1vcmUgZGFtYWdlIHRoYW4gaHAgcmVtYWluaW5nIGluIGEgY3VycmVudCBoZWFydFxuICAgICAgaWYgKGFtb3VudCA+IDEgJiYgKHBsYXllci5ocCAtIGFtb3VudCkgJSAyICE9PSAwKSB7XG4gICAgICAgIGFtb3VudCA9IDE7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5ocCAtPSBhbW91bnQ7XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPCAwKSB7XG4gICAgICAgIHBsYXllci5ocCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAocGxheWVyLmhwICUgMiA9PT0gMCkge1xuICAgICAgICBhY3Rpb25zLmRpZSgpO1xuICAgICAgfVxuICAgICAgYWN0aW9ucy51cGRhdGVIZWFydHMoKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlSGVhcnRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBoZWFsdGhQZXJjZW50YWdlID0gcGxheWVyLmhwIC8gcGxheWVyLm1heEhwO1xuICAgICAgdmFyIGNyb3BXaWR0aCA9IE1hdGguY2VpbChoZWFsdGhQZXJjZW50YWdlICogaGVhcnRzV2lkdGgpO1xuICAgICAgdmFyIGNyb3BSZWN0ID0gbmV3IFBoYXNlci5SZWN0YW5nbGUoMCwgMCwgY3JvcFdpZHRoLCBwbGF5ZXIuaGVhcnRzLmhlaWdodCk7XG4gICAgICBwbGF5ZXIuaGVhcnRzLmNyb3AoY3JvcFJlY3QpO1xuICAgIH0sXG5cbiAgICBkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5ocCA+IDApIHtcbiAgICAgICAgYWN0aW9ucy5lbmRBdHRhY2soKTtcbiAgICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IDA7XG5cbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnggPSBzZXR0aW5ncy5wb3NpdGlvbi54O1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueSA9IHNldHRpbmdzLnBvc2l0aW9uLnk7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRPRE86IGRldGFuZ2xlIHRoaXNcbiAgICAgICAgdmFyIGNoZWNrRm9yR2FtZU92ZXIgPSByZXF1aXJlKCcuL2dhbWUuanMnKTtcbiAgICAgICAgY2hlY2tGb3JHYW1lT3ZlcigpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB2YXIgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKHNldHRpbmdzLnBvc2l0aW9uLngsIHNldHRpbmdzLnBvc2l0aW9uLnksIHNldHRpbmdzLmNvbG9yKTtcbiAgcGxheWVyLm5hbWUgPSBzZXR0aW5ncy5uYW1lO1xuICBwbGF5ZXIub3JpZW50YXRpb24gPSBzZXR0aW5ncy5vcmllbnRhdGlvbjtcbiAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkpOyAvLyBUT0RPOiBhZGQgZ2lhbnQgbW9kZVxuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHBsYXllcik7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5ib2R5LmJvdW5jZS55ID0gMC4yOyAvLyBUT0RPOiBhbGxvdyBib3VuY2UgY29uZmlndXJhdGlvblxuICBwbGF5ZXIuYm9keS5ncmF2aXR5LnkgPSAzODA7IC8vIFRPRE86IGFsbG93IGdyYXZpdHkgY29uZmlndXJhdGlvblxuXG4gIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IDA7XG4gIHBsYXllci5pc0NvbGxpZGFibGUgPSB0cnVlO1xuXG4gIHBsYXllci5hY3Rpb25zID0gYWN0aW9ucztcblxuICAvLyB0cmFjayBoZWFsdGhcbiAgcGxheWVyLmhwID0gcGxheWVyLm1heEhwID0gNjsgLy8gVE9ETzogYWxsb3cgc2V0dGluZyBjdXN0b20gaHAgYW1vdW50IGZvciBlYWNoIHBsYXllclxuICBwbGF5ZXIuaGVhcnRzID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdoZWFydHMnKTtcbiAgdmFyIGhlYXJ0c1dpZHRoID0gcGxheWVyLmhlYXJ0cy53aWR0aDtcbiAgcGxheWVyLmhlYXJ0cy5zZXRTY2FsZU1pbk1heCgxLCAxKTsgLy8gcHJldmVudCBoZWFydHMgc2NhbGluZyB3LyBwbGF5ZXJcbiAgdmFyIGJvYiA9IHBsYXllci5oZWFydHMuYW5pbWF0aW9ucy5hZGQoJ2JvYicsIFswLDEsMiwxXSwgMywgdHJ1ZSk7IC8vIG5hbWUsIGZyYW1lcywgZnJhbWVyYXRlLCBsb29wXG4gIHBsYXllci5oZWFydHMuYW5pbWF0aW9ucy5wbGF5KCdib2InKTtcbiAgcGxheWVyLmFkZENoaWxkKHBsYXllci5oZWFydHMpO1xuICBhY3Rpb25zLm9yaWVudEhlYXJ0cyhwbGF5ZXIub3JpZW50YXRpb24pO1xuXG4gIC8vIHBoYXNlciBhcHBhcmVudGx5IGF1dG9tYXRpY2FsbHkgY2FsbHMgYW55IGZ1bmN0aW9uIG5hbWVkIHVwZGF0ZSBhdHRhY2hlZCB0byBhIHNwcml0ZSFcbiAgcGxheWVyLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGtpbGwgcGxheWVyIGlmIGhlIGZhbGxzIG9mZiB0aGUgc2NyZWVuXG4gICAgaWYgKHBsYXllci5wb3NpdGlvbi55ID4gMTgwICYmIHBsYXllci5ocCAhPT0gMCkgeyAvLyBUT0RPOiBob3cgdG8gYWNjZXNzIG5hdGl2ZSBoZWlnaHQgZnJvbSBnYW1lLmpzP1xuICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDIpO1xuICAgIH1cblxuICAgIHZhciBpbnB1dCA9IHtcbiAgICAgIGxlZnQ6ICAgKGtleXMubGVmdC5pc0Rvd24gJiYgIWtleXMucmlnaHQuaXNEb3duKSB8fFxuICAgICAgICAgICAgICAoZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0xFRlQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1gpIDwgLTAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9YKSA8IC0wLjEsXG4gICAgICByaWdodDogIChrZXlzLnJpZ2h0LmlzRG93biAmJiAha2V5cy5sZWZ0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9SSUdIVCkgJiYgIWdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9YKSA+IDAuMSxcbiAgICAgIHVwOiAgICAga2V5cy51cC5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1VQKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1kpIDwgLTAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9ZKSA8IC0wLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9BKSxcbiAgICAgIGRvd246ICAga2V5cy5kb3duLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfRE9XTikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9ZKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9ZKSA+IDAuMSxcbiAgICAgIGF0dGFjazoga2V5cy5hdHRhY2suaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9YKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0IpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0xFRlRfVFJJR0dFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX1RSSUdHRVIpLFxuICAgIH07XG5cbiAgICBpZiAoaW5wdXQubGVmdCkge1xuICAgICAgY29uc29sZS5sb2coUGhhc2VyLkdhbWVwYWQudG9TdHJpbmcoKSk7XG4gICAgICBhY3Rpb25zLnJ1bignbGVmdCcpO1xuICAgIH0gZWxzZSBpZiAoaW5wdXQucmlnaHQpIHtcbiAgICAgIGFjdGlvbnMucnVuKCdyaWdodCcpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC51cCkge1xuICAgICAgdXBXYXNEb3duID0gdHJ1ZTtcbiAgICAgIGFjdGlvbnMuanVtcCgpO1xuICAgIH0gZWxzZSBpZiAodXBXYXNEb3duKSB7XG4gICAgICB1cFdhc0Rvd24gPSBmYWxzZTtcbiAgICAgIGFjdGlvbnMuZGFtcGVuSnVtcCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5kb3duKSB7XG4gICAgICBhY3Rpb25zLmR1Y2soKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgIGFjdGlvbnMuc3RhbmQoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuYXR0YWNrKSB7XG4gICAgICBhY3Rpb25zLmF0dGFjaygpO1xuICAgIH1cblxuICAgIChmdW5jdGlvbiBhcHBseUZyaWN0aW9uKCkge1xuICAgICAgLy8gaGVyZSdzIGFuIGlkZWEgd2hpY2ggc29sdmVzIHRoZSBzbGlkaW5nIGdsaXRjaCwgYnV0IGl0IGRvZXNuJ3QgZmVlbCBhcyBnb29kXG4gICAgICAvKmlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmICFrZXlzLmxlZnQuaXNEb3duICYmICFrZXlzLnJpZ2h0LmlzRG93bikge1xuICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCAhPT0gMCkge1xuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gcGxheWVyLmJvZHkudmVsb2NpdHkueCAvIDg7XG4gICAgICAgIH1cbiAgICAgIH0qL1xuICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgIXBsYXllci5pc1JvbGxpbmcpIHtcbiAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPiAwKSB7XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSA0O1xuICAgICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPCAwKSB7XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCArPSA0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSgpKTtcbiAgfTtcblxuICByZXR1cm4gcGxheWVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQbGF5ZXI7XG4iLCJ2YXIgdXRpbHMgPSB7XG4gIC8vIGZyb20gdW5kZXJzY29yZVxuICBkZWJvdW5jZTogZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG5cdHZhciB0aW1lb3V0O1xuXHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGltZW91dCA9IG51bGw7XG5cdFx0XHRpZiAoIWltbWVkaWF0ZSkgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHR9O1xuXHRcdHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuXHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0aWYgKGNhbGxOb3cpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdH07XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHM7Il19
