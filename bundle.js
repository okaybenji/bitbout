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
  game.load.image('orange', 'images/orange.png');
  game.load.image('purple', 'images/purple.png');
  game.load.image('green', 'images/green.png');
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
    gamepad: game.input.gamepad.pad1,
    position: {
      x: 72, y: 44
    },
  };

  var player2 = {
    name: 'Yellow',
    color: 'yellow',
    gamepad: game.input.gamepad.pad2,
    position: {
      x: 248, y: 44
    },
    orientation: 'left',
  };

  var player3 = {
    name: 'Green',
    color: 'green',
    gamepad: game.input.gamepad.pad3,
    keys: {
      up: 'W', down: 'S', left: 'A', right: 'D', attack: 'Q'
    },
    position: {
      x: 72, y: 136
    },
  };

  var player4 = {
    name: 'Purple',
    color: 'purple',
    gamepad: game.input.gamepad.pad4,
    keys: {
      up: 'I', down: 'K', left: 'J', right: 'L', attack: 'U'
    },
    position: {
      x: 248, y: 136
    },
    orientation: 'left',
  };

  players.add(createPlayer(game, player1));
  players.add(createPlayer(game, player2));
  players.add(createPlayer(game, player3));
  players.add(createPlayer(game, player4));
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

        var respawnPosition = {
          x: Math.random() > 0.5 ? 4 : 306,
          y: 8
        };

        player.position.x = respawnPosition.x;
        player.position.y = respawnPosition.y;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2dhbWUuanMiLCJzY3JpcHRzL21hcC5qcyIsInNjcmlwdHMvcGxheWVyLmpzIiwic2NyaXB0cy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIG5hdGl2ZVdpZHRoID0gMzIwO1xudmFyIG5hdGl2ZUhlaWdodCA9IDE4MDtcbnZhciBwbGF0Zm9ybXMsIHBsYXllcnMsIHRleHQ7XG5cbnZhciByZXNpemUgPSBmdW5jdGlvbiByZXNpemUoKSB7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUuem9vbSA9IHdpbmRvdy5pbm5lcldpZHRoIC8gbmF0aXZlV2lkdGg7XG59O1xuXG52YXIgY2hlY2tGb3JHYW1lT3ZlciA9IGZ1bmN0aW9uIGNoZWNrRm9yR2FtZU92ZXIoKSB7XG4gIHZhciBhbGl2ZVBsYXllcnMgPSBbXTtcbiAgcGxheWVycy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKHBsYXllcikge1xuICAgIGlmIChwbGF5ZXIuaHAgPiAwKSB7XG4gICAgICBhbGl2ZVBsYXllcnMucHVzaChwbGF5ZXIubmFtZSk7XG4gICAgfVxuICB9KTtcbiAgaWYgKGFsaXZlUGxheWVycy5sZW5ndGggPT09IDEpIHtcbiAgICB0ZXh0LnNldFRleHQoJ0dhbWUgb3ZlciEgICcgKyBhbGl2ZVBsYXllcnNbMF0gKyAnICB3aW5zIVxcbkNsaWNrICB0byAgcmVzdGFydCcpO1xuICAgIHRleHQudmlzaWJsZSA9IHRydWU7XG4gIH1cbn07XG5cbnZhciBwcmVsb2FkID0gZnVuY3Rpb24gcHJlbG9hZCgpIHtcbiAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xuICByZXNpemUoKTtcbiAgd2luZG93Lm9ucmVzaXplID0gdXRpbHMuZGVib3VuY2UocmVzaXplLCAxMDApO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3BpbmsnLCAnaW1hZ2VzL3BpbmsucG5nJyk7XG4gIGdhbWUubG9hZC5pbWFnZSgneWVsbG93JywgJ2ltYWdlcy95ZWxsb3cucG5nJyk7XG4gIGdhbWUubG9hZC5pbWFnZSgnYmx1ZScsICdpbWFnZXMvYmx1ZS5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdvcmFuZ2UnLCAnaW1hZ2VzL29yYW5nZS5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdwdXJwbGUnLCAnaW1hZ2VzL3B1cnBsZS5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdncmVlbicsICdpbWFnZXMvZ3JlZW4ucG5nJyk7XG4gIGdhbWUubG9hZC5pbWFnZSgnd2hpdGUnLCAnaW1hZ2VzL3doaXRlLnBuZycpO1xuICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2hlYXJ0cycsICdpbWFnZXMvaGVhcnRzLnBuZycsIDksIDUpOyAvLyBwbGF5ZXIgaGVhbHRoXG59O1xuXG52YXIgY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKCkge1xuICBnYW1lLnBoeXNpY3Muc3RhcnRTeXN0ZW0oUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgZ2FtZS53b3JsZC5zZXRCb3VuZHMoMCwgLW5hdGl2ZUhlaWdodCwgbmF0aXZlV2lkdGgsIG5hdGl2ZUhlaWdodCAqIDMpOyAvLyBhbGxvdyBhbnl0aGluZyBhcyB0YWxsIGFzIHdvcmxkIHRvIGZhbGwgb2ZmLXNjcmVlbiB1cCBvciBkb3duXG5cbiAgdmFyIGJ1aWxkUGxhdGZvcm1zID0gcmVxdWlyZSgnLi9tYXAuanMnKTtcbiAgcGxhdGZvcm1zID0gYnVpbGRQbGF0Zm9ybXMoZ2FtZSk7XG5cbiAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG5cbiAgLy8gVE9ETzogd2h5IGlzIHRoaXMgZm9udCBzdGlsbCBhbnRpLWFsaWFzZWQ/XG4gIHZhciBmb250U3R5bGUgPSB7IGZvbnQ6IFwiMTJweCBIZWxsb3ZldGljYVwiLCBmaWxsOiBcIiNlZWVcIiwgYWxpZ246IFwiY2VudGVyXCIsIGJvdW5kc0FsaWduSDogXCJjZW50ZXJcIiwgYm91bmRzQWxpZ25WOiBcIm1pZGRsZVwiIH07XG4gIHRleHQgPSBnYW1lLmFkZC50ZXh0KDAsIDAsICcnLCBmb250U3R5bGUpO1xuICB0ZXh0LnNldFRleHRCb3VuZHMoMCwgMCwgbmF0aXZlV2lkdGgsIG5hdGl2ZUhlaWdodCk7XG5cbiAgcGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIHJlc3RhcnQoKTtcbn07XG5cbnZhciByZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHRleHQudmlzaWJsZSA9IGZhbHNlO1xuICAvLyBUT0RPOiB3aHkgZG9lcyB0aGlzIHNlZW0gdG8gb2NjYXNpb25hbGx5IG9ubHkgZWxpbWluYXRlIG9uZSBvZiB0aGUgcGxheWVycz9cbiAgcGxheWVycy5mb3JFYWNoKGZ1bmN0aW9uIGVsaW1pbmF0ZVBsYXllcihwbGF5ZXIpIHtcbiAgICBwbGF5ZXIuZGVzdHJveSgpO1xuICB9KTtcblxuICB2YXIgY3JlYXRlUGxheWVyID0gcmVxdWlyZSgnLi9wbGF5ZXIuanMnKTtcblxuICB2YXIgcGxheWVyMSA9IHtcbiAgICBuYW1lOiAnQmx1ZScsXG4gICAgY29sb3I6ICdibHVlJyxcbiAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgeDogNzIsIHk6IDQ0XG4gICAgfSxcbiAgfTtcblxuICB2YXIgcGxheWVyMiA9IHtcbiAgICBuYW1lOiAnWWVsbG93JyxcbiAgICBjb2xvcjogJ3llbGxvdycsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDIsXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDI0OCwgeTogNDRcbiAgICB9LFxuICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gIH07XG5cbiAgdmFyIHBsYXllcjMgPSB7XG4gICAgbmFtZTogJ0dyZWVuJyxcbiAgICBjb2xvcjogJ2dyZWVuJyxcbiAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMyxcbiAgICBrZXlzOiB7XG4gICAgICB1cDogJ1cnLCBkb3duOiAnUycsIGxlZnQ6ICdBJywgcmlnaHQ6ICdEJywgYXR0YWNrOiAnUSdcbiAgICB9LFxuICAgIHBvc2l0aW9uOiB7XG4gICAgICB4OiA3MiwgeTogMTM2XG4gICAgfSxcbiAgfTtcblxuICB2YXIgcGxheWVyNCA9IHtcbiAgICBuYW1lOiAnUHVycGxlJyxcbiAgICBjb2xvcjogJ3B1cnBsZScsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDQsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdJJywgZG93bjogJ0snLCBsZWZ0OiAnSicsIHJpZ2h0OiAnTCcsIGF0dGFjazogJ1UnXG4gICAgfSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgeDogMjQ4LCB5OiAxMzZcbiAgICB9LFxuICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gIH07XG5cbiAgcGxheWVycy5hZGQoY3JlYXRlUGxheWVyKGdhbWUsIHBsYXllcjEpKTtcbiAgcGxheWVycy5hZGQoY3JlYXRlUGxheWVyKGdhbWUsIHBsYXllcjIpKTtcbiAgcGxheWVycy5hZGQoY3JlYXRlUGxheWVyKGdhbWUsIHBsYXllcjMpKTtcbiAgcGxheWVycy5hZGQoY3JlYXRlUGxheWVyKGdhbWUsIHBsYXllcjQpKTtcbn07XG5cbnZhciB1cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gIGdhbWUuaW5wdXQub25Eb3duLmFkZE9uY2UocmVzdGFydCwgdGhpcyk7XG5cbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHBsYXllcnMsIHBsYXRmb3Jtcyk7XG4gIC8vIFRPRE86IGhvdyBkbyBpIGRvIHRoaXMgb24gdGhlIHBsYXllciBpdHNlbGYgd2l0aG91dCBhY2Nlc3MgdG8gcGxheWVycz8gb3Igc2hvdWxkIGkgYWRkIGEgZnRuIHRvIHBsYXllciBhbmQgc2V0IHRoYXQgYXMgdGhlIGNiP1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUocGxheWVycywgcGxheWVycywgZnVuY3Rpb24gaGFuZGxlUGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICBmdW5jdGlvbiB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyKSB7XG4gICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gZmFsc2U7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcbiAgICAgIH0sIDEwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYm91bmNlKCkge1xuICAgICAgdmFyIGJvdW5jZVZlbG9jaXR5ID0gMTAwO1xuICAgICAgdmFyIHZlbG9jaXR5QSA9IHZlbG9jaXR5QiA9IGJvdW5jZVZlbG9jaXR5O1xuICAgICAgaWYgKHBsYXllckEucG9zaXRpb24ueCA+IHBsYXllckIucG9zaXRpb24ueCkge1xuICAgICAgICB2ZWxvY2l0eUIgKj0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2ZWxvY2l0eUEgKj0gLTE7XG4gICAgICB9XG4gICAgICBwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QTtcbiAgICAgIHBsYXllckIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlCO1xuICAgICAgcGxheWVyQS5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICAgIHBsYXllckIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmxpbmcoKSB7XG4gICAgICB2YXIgcGxheWVyVG9GbGluZztcbiAgICAgIHZhciBwbGF5ZXJUb0xlYXZlO1xuICAgICAgaWYgKHBsYXllckEuaXNEdWNraW5nKSB7XG4gICAgICAgIHBsYXllclRvRmxpbmcgPSBwbGF5ZXJCO1xuICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBsYXllclRvRmxpbmcgPSBwbGF5ZXJBO1xuICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQjtcbiAgICAgIH1cbiAgICAgIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXJUb0ZsaW5nKTtcbiAgICAgIHZhciBmbGluZ1hWZWxvY2l0eSA9IDE1MDtcbiAgICAgIGlmIChwbGF5ZXJUb0ZsaW5nLnBvc2l0aW9uLnggPiBwbGF5ZXJUb0xlYXZlLnBvc2l0aW9uLngpIHtcbiAgICAgICAgZmxpbmdYVmVsb2NpdHkgKj0gLTE7XG4gICAgICB9XG4gICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueCA9IGZsaW5nWFZlbG9jaXR5O1xuICAgICAgcGxheWVyVG9GbGluZy5ib2R5LnZlbG9jaXR5LnkgPSAtMTUwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvcCgpIHtcbiAgICAgIHZhciBwbGF5ZXJUb1BvcDtcbiAgICAgIGlmIChwbGF5ZXJBLmlzUm9sbGluZykge1xuICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckE7XG4gICAgICB9XG4gICAgICB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyVG9Qb3ApO1xuICAgICAgcGxheWVyVG9Qb3AuYm9keS52ZWxvY2l0eS55ID0gLTE1MDtcbiAgICB9XG5cbiAgICB2YXIgYm90aFJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyAmJiBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICB2YXIgYm90aFN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nICYmICFwbGF5ZXJCLmlzRHVja2luZztcbiAgICB2YXIgbmVpdGhlclJvbGxpbmcgPSAhcGxheWVyQS5pc1JvbGxpbmcgJiYgIXBsYXllckIuaXNSb2xsaW5nO1xuICAgIHZhciBlaXRoZXJEdWNraW5nID0gcGxheWVyQS5pc0R1Y2tpbmcgfHwgcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgdmFyIGVpdGhlclJ1bm5pbmcgPSBNYXRoLmFicyhwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCkgPiAyOCB8fCBNYXRoLmFicyhwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCkgPj0gMjg7XG4gICAgdmFyIGVpdGhlclJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyB8fCBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICB2YXIgZWl0aGVyU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgfHwgIXBsYXllckIuaXNEdWNraW5nO1xuXG4gICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICBjYXNlIGJvdGhSb2xsaW5nIHx8IGJvdGhTdGFuZGluZzpcbiAgICAgICAgYm91bmNlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBuZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJSdW5uaW5nICYmIGVpdGhlckR1Y2tpbmc6XG4gICAgICAgIGZsaW5nKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBlaXRoZXJSb2xsaW5nICYmIGVpdGhlclN0YW5kaW5nOlxuICAgICAgICBwb3AoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gaWYgb25seSBvbmUgb2YgdGhlIHRvdWNoaW5nIHBsYXllcnMgaXMgYXR0YWNraW5nLi4uXG4gICAgaWYgKHBsYXllckEuaXNBdHRhY2tpbmcgIT09IHBsYXllckIuaXNBdHRhY2tpbmcpIHtcbiAgICAgIHZhciB2aWN0aW0gPSBwbGF5ZXJBLmlzQXR0YWNraW5nID8gcGxheWVyQiA6IHBsYXllckE7XG4gICAgICBpZiAocGxheWVyQS5vcmllbnRhdGlvbiAhPT0gcGxheWVyQi5vcmllbnRhdGlvbikge1xuICAgICAgICB2aWN0aW0uYWN0aW9ucy50YWtlRGFtYWdlKDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgyKTsgLy8gYXR0YWNrZWQgZnJvbSBiZWhpbmQgZm9yIGRvdWJsZSBkYW1hZ2VcbiAgICAgIH1cbiAgICB9XG5cbiAgfSwgZnVuY3Rpb24gYWxsb3dQbGF5ZXJDb2xsaXNpb24ocGxheWVyQSwgcGxheWVyQikge1xuICAgIC8qIGRvbid0IGFsbG93IGNvbGxpc2lvbiBpZiBlaXRoZXIgcGxheWVyIGlzbid0IGNvbGxpZGFibGUuXG4gICAgICAgYWxzbywgbGV0J3Mgbm90IGtub2NrIGFueWJvZHkgYXJvdW5kIGlmIHNvbWV0aGluZydzIG9uIG9uZSBvZiB0aGVzZSBkdWRlJ3MgaGVhZHMuXG4gICAgICAgcHJldmVudHMgY2Fubm9uYmFsbCBhdHRhY2tzIGFuZCB0aGUgbGlrZSwgYW5kIGFsbG93cyBzdGFuZGluZyBvbiBoZWFkcy4gKi9cbiAgICB2YXIgZWl0aGVySGFzSGVhZHdlYXIgPSBwbGF5ZXJBLmJvZHkudG91Y2hpbmcudXAgfHwgcGxheWVyQi5ib2R5LnRvdWNoaW5nLnVwO1xuICAgIGlmICghcGxheWVyQS5pc0NvbGxpZGFibGUgfHwgIXBsYXllckIuaXNDb2xsaWRhYmxlIHx8IGVpdGhlckhhc0hlYWR3ZWFyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn07XG5cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKG5hdGl2ZVdpZHRoLCBuYXRpdmVIZWlnaHQsIFBoYXNlci5BVVRPLCAnZ2FtZScsIHtcbiAgcHJlbG9hZDogcHJlbG9hZCxcbiAgY3JlYXRlOiBjcmVhdGUsXG4gIHVwZGF0ZTogdXBkYXRlLFxufSwgZmFsc2UsIGZhbHNlKTsgLy8gZGlzYWJsZSBhbnRpLWFsaWFzaW5nXG5cbm1vZHVsZS5leHBvcnRzID0gY2hlY2tGb3JHYW1lT3ZlcjtcbiIsInZhciBidWlsZFBsYXRmb3JtcyA9IGZ1bmN0aW9uIGJ1aWxkUGxhdGZvcm1zKGdhbWUpIHtcbiAgdmFyIHBsYXRmb3JtcyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIHBsYXRmb3Jtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcbiAgdmFyIHBsYXRmb3JtUG9zaXRpb25zID0gW1s0OCwgNjRdLCBbMjI0LCA2NF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWzEzNiwgMTA0XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFs0OCwgMTU0LF0sIFsyMjQsIDE1NF1dO1xuXG4gIHBsYXRmb3JtUG9zaXRpb25zLmZvckVhY2goZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICB2YXIgcGxhdGZvcm0gPSBwbGF0Zm9ybXMuY3JlYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSwgJ3BpbmsnKTtcbiAgICBwbGF0Zm9ybS5zY2FsZS5zZXRUbygyNCwgNCk7XG4gICAgcGxhdGZvcm0uYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICB9KTtcblxuICB2YXIgd2FsbHMgPSBbXTtcbiAgd2FsbHMucHVzaChwbGF0Zm9ybXMuY3JlYXRlKC0xNiwgMzIsICdwaW5rJykpO1xuICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoMzA0LCAzMiwgJ3BpbmsnKSk7XG4gIHdhbGxzLmZvckVhY2goZnVuY3Rpb24od2FsbCkge1xuICAgIHdhbGwuc2NhbGUuc2V0VG8oMTYsIDc0KTtcbiAgICB3YWxsLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgfSk7XG4gIFxuICByZXR1cm4gcGxhdGZvcm1zO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBidWlsZFBsYXRmb3JtcztcbiIsInZhciBjcmVhdGVQbGF5ZXIgPSBmdW5jdGlvbiBjcmVhdGVQbGF5ZXIoZ2FtZSwgb3B0aW9ucykge1xuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDQsXG4gICAgICB5OiA4XG4gICAgfSxcbiAgICBvcmllbnRhdGlvbjogJ3JpZ2h0JyxcbiAgICBrZXlzOiB7XG4gICAgICB1cDogJ1VQJyxcbiAgICAgIGRvd246ICdET1dOJyxcbiAgICAgIGxlZnQ6ICdMRUZUJyxcbiAgICAgIHJpZ2h0OiAnUklHSFQnLFxuICAgIH0sXG4gICAgc2NhbGU6IHtcbiAgICAgIHg6IDQsXG4gICAgICB5OiA4XG4gICAgfSxcbiAgICBjb2xvcjogJ3BpbmsnLFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLFxuICB9O1xuXG4gIHZhciBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICB2YXIga2V5cyA9IHtcbiAgICB1cDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMudXBdKSxcbiAgICBkb3duOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5kb3duXSksXG4gICAgbGVmdDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMubGVmdF0pLFxuICAgIHJpZ2h0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5yaWdodF0pLFxuICAgIGF0dGFjazogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuYXR0YWNrXSksXG4gIH07XG5cbiAgdmFyIGdhbWVwYWQgPSBzZXR0aW5ncy5nYW1lcGFkO1xuXG4gIHZhciB1cFdhc0Rvd24gPSBmYWxzZTsgLy8gdHJhY2sgaW5wdXQgY2hhbmdlIGZvciB2YXJpYWJsZSBqdW1wIGhlaWdodFxuXG4gIHZhciBhY3Rpb25zID0ge1xuICAgIGF0dGFjazogZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgdmFyIGR1cmF0aW9uID0gMjAwO1xuICAgICAgdmFyIGludGVydmFsID0gNDAwO1xuICAgICAgdmFyIHZlbG9jaXR5ID0gMjAwO1xuXG4gICAgICB2YXIgY2FuQXR0YWNrID0gKERhdGUubm93KCkgPiBwbGF5ZXIubGFzdEF0dGFja2VkICsgaW50ZXJ2YWwpICYmICFwbGF5ZXIuaXNEdWNraW5nO1xuICAgICAgaWYgKCFjYW5BdHRhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSB0cnVlO1xuICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IERhdGUubm93KCk7XG5cbiAgICAgIHN3aXRjaChwbGF5ZXIub3JpZW50YXRpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC12ZWxvY2l0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKCd3aGl0ZScpO1xuICAgICAgc2V0VGltZW91dChhY3Rpb25zLmVuZEF0dGFjaywgZHVyYXRpb24pO1xuICAgIH0sXG5cbiAgICBlbmRBdHRhY2s6IGZ1bmN0aW9uIGVuZEF0dGFjaygpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNBdHRhY2tpbmcpIHtcbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKHNldHRpbmdzLmNvbG9yKTtcbiAgICAgICAgcGxheWVyLmlzQXR0YWNraW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJ1bjogZnVuY3Rpb24gcnVuKGRpcmVjdGlvbikge1xuICAgICAgdmFyIG1heFNwZWVkID0gNjQ7XG4gICAgICB2YXIgYWNjZWxlcmF0aW9uID0gcGxheWVyLmJvZHkudG91Y2hpbmcuZG93biA/IDggOiAzOyAvLyBwbGF5ZXJzIGhhdmUgbGVzcyBjb250cm9sIGluIHRoZSBhaXJcbiAgICAgIHBsYXllci5vcmllbnRhdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWF4KHBsYXllci5ib2R5LnZlbG9jaXR5LnggLSBhY2NlbGVyYXRpb24sIC1tYXhTcGVlZCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gTWF0aC5taW4ocGxheWVyLmJvZHkudmVsb2NpdHkueCArIGFjY2VsZXJhdGlvbiwgbWF4U3BlZWQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBhY3Rpb25zLm9yaWVudEhlYXJ0cyhkaXJlY3Rpb24pO1xuICAgIH0sXG4gICAgXG4gICAgLy8gVE9ETzogZml4IGxlZnQgaGVhcnRzIHBvc2l0aW9uIHdoZW4gaHAgaXMgbGVzcyB0aGFuIG1heFxuICAgIG9yaWVudEhlYXJ0czogZnVuY3Rpb24gb3JpZW50SGVhcnRzKGRpcmVjdGlvbikge1xuICAgICAgdmFyIGhlYXJ0RGlzdGFuY2UgPSAxLjE7IC8vIGhvdyBjbG9zZSBoZWFydHMgZmxvYXQgYnkgcGxheWVyXG4gICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICBwbGF5ZXIuaGVhcnRzLmFuY2hvci5zZXRUbygtaGVhcnREaXN0YW5jZSwgMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBwbGF5ZXIuaGVhcnRzLmFuY2hvci5zZXRUbyhoZWFydERpc3RhbmNlLCAwKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAganVtcDogZnVuY3Rpb24ganVtcCgpIHtcbiAgICAgIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMjAwO1xuICAgICAgLy8gd2FsbCBqdW1wc1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5sZWZ0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMjQwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gOTA7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLnJpZ2h0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMjQwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLTkwO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBkYW1wZW5KdW1wOiBmdW5jdGlvbiBkYW1wZW5KdW1wKCkge1xuICAgICAgLy8gc29mdGVuIHVwd2FyZCB2ZWxvY2l0eSB3aGVuIHBsYXllciByZWxlYXNlcyBqdW1wIGtleVxuICAgICAgICB2YXIgZGFtcGVuVG9QZXJjZW50ID0gMC41O1xuXG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS55IDwgMCkge1xuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgKj0gZGFtcGVuVG9QZXJjZW50O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGR1Y2s6IGZ1bmN0aW9uIGR1Y2soKSB7XG4gICAgICBpZiAocGxheWVyLmlzQXR0YWNraW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwbGF5ZXIuaXNEdWNraW5nKSB7XG4gICAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBzZXR0aW5ncy5zY2FsZS55IC8gMik7XG4gICAgICAgIHBsYXllci55ICs9IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICB9XG4gICAgICBwbGF5ZXIuaXNEdWNraW5nID0gdHJ1ZTtcblxuICAgICAgKGZ1bmN0aW9uIHJvbGwoKSB7XG4gICAgICAgIHZhciBjYW5Sb2xsID0gTWF0aC5hYnMocGxheWVyLmJvZHkudmVsb2NpdHkueCkgPiA1MCAmJiBwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duO1xuICAgICAgICBpZiAoY2FuUm9sbCkge1xuICAgICAgICAgIHBsYXllci5pc1JvbGxpbmcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KCkpO1xuICAgIH0sXG5cbiAgICBzdGFuZDogZnVuY3Rpb24gc3RhbmQoKSB7XG4gICAgICBwbGF5ZXIueSAtPSBzZXR0aW5ncy5zY2FsZS55O1xuICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkpO1xuICAgICAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICAgICAgcGxheWVyLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbiB0YWtlRGFtYWdlKGFtb3VudCkge1xuICAgICAgLy8gcHJldmVudCB0YWtpbmcgbW9yZSBkYW1hZ2UgdGhhbiBocCByZW1haW5pbmcgaW4gYSBjdXJyZW50IGhlYXJ0XG4gICAgICBpZiAoYW1vdW50ID4gMSAmJiAocGxheWVyLmhwIC0gYW1vdW50KSAlIDIgIT09IDApIHtcbiAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmhwIC09IGFtb3VudDtcblxuICAgICAgaWYgKHBsYXllci5ocCA8IDApIHtcbiAgICAgICAgcGxheWVyLmhwID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChwbGF5ZXIuaHAgJSAyID09PSAwKSB7XG4gICAgICAgIGFjdGlvbnMuZGllKCk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLnVwZGF0ZUhlYXJ0cygpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVIZWFydHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGhlYWx0aFBlcmNlbnRhZ2UgPSBwbGF5ZXIuaHAgLyBwbGF5ZXIubWF4SHA7XG4gICAgICB2YXIgY3JvcFdpZHRoID0gTWF0aC5jZWlsKGhlYWx0aFBlcmNlbnRhZ2UgKiBoZWFydHNXaWR0aCk7XG4gICAgICB2YXIgY3JvcFJlY3QgPSBuZXcgUGhhc2VyLlJlY3RhbmdsZSgwLCAwLCBjcm9wV2lkdGgsIHBsYXllci5oZWFydHMuaGVpZ2h0KTtcbiAgICAgIHBsYXllci5oZWFydHMuY3JvcChjcm9wUmVjdCk7XG4gICAgfSxcblxuICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocGxheWVyLmhwID4gMCkge1xuICAgICAgICBhY3Rpb25zLmVuZEF0dGFjaygpO1xuICAgICAgICBwbGF5ZXIubGFzdEF0dGFja2VkID0gMDtcblxuICAgICAgICB2YXIgcmVzcGF3blBvc2l0aW9uID0ge1xuICAgICAgICAgIHg6IE1hdGgucmFuZG9tKCkgPiAwLjUgPyA0IDogMzA2LFxuICAgICAgICAgIHk6IDhcbiAgICAgICAgfTtcblxuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueCA9IHJlc3Bhd25Qb3NpdGlvbi54O1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueSA9IHJlc3Bhd25Qb3NpdGlvbi55O1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUT0RPOiBkZXRhbmdsZSB0aGlzXG4gICAgICAgIHZhciBjaGVja0ZvckdhbWVPdmVyID0gcmVxdWlyZSgnLi9nYW1lLmpzJyk7XG4gICAgICAgIGNoZWNrRm9yR2FtZU92ZXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIHBsYXllciA9IGdhbWUuYWRkLnNwcml0ZShzZXR0aW5ncy5wb3NpdGlvbi54LCBzZXR0aW5ncy5wb3NpdGlvbi55LCBzZXR0aW5ncy5jb2xvcik7XG4gIHBsYXllci5uYW1lID0gc2V0dGluZ3MubmFtZTtcbiAgcGxheWVyLm9yaWVudGF0aW9uID0gc2V0dGluZ3Mub3JpZW50YXRpb247XG4gIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBzZXR0aW5ncy5zY2FsZS55KTsgLy8gVE9ETzogYWRkIGdpYW50IG1vZGVcblxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZShwbGF5ZXIpO1xuICBwbGF5ZXIuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICBwbGF5ZXIuYm9keS5ib3VuY2UueSA9IDAuMjsgLy8gVE9ETzogYWxsb3cgYm91bmNlIGNvbmZpZ3VyYXRpb25cbiAgcGxheWVyLmJvZHkuZ3Jhdml0eS55ID0gMzgwOyAvLyBUT0RPOiBhbGxvdyBncmF2aXR5IGNvbmZpZ3VyYXRpb25cblxuICBwbGF5ZXIuaXNSb2xsaW5nID0gZmFsc2U7XG4gIHBsYXllci5pc0R1Y2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzQXR0YWNraW5nID0gZmFsc2U7XG4gIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuICBwbGF5ZXIuYWN0aW9ucyA9IGFjdGlvbnM7XG5cbiAgLy8gdHJhY2sgaGVhbHRoXG4gIHBsYXllci5ocCA9IHBsYXllci5tYXhIcCA9IDY7IC8vIFRPRE86IGFsbG93IHNldHRpbmcgY3VzdG9tIGhwIGFtb3VudCBmb3IgZWFjaCBwbGF5ZXJcbiAgcGxheWVyLmhlYXJ0cyA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnaGVhcnRzJyk7XG4gIHZhciBoZWFydHNXaWR0aCA9IHBsYXllci5oZWFydHMud2lkdGg7XG4gIHBsYXllci5oZWFydHMuc2V0U2NhbGVNaW5NYXgoMSwgMSk7IC8vIHByZXZlbnQgaGVhcnRzIHNjYWxpbmcgdy8gcGxheWVyXG4gIHZhciBib2IgPSBwbGF5ZXIuaGVhcnRzLmFuaW1hdGlvbnMuYWRkKCdib2InLCBbMCwxLDIsMV0sIDMsIHRydWUpOyAvLyBuYW1lLCBmcmFtZXMsIGZyYW1lcmF0ZSwgbG9vcFxuICBwbGF5ZXIuaGVhcnRzLmFuaW1hdGlvbnMucGxheSgnYm9iJyk7XG4gIHBsYXllci5hZGRDaGlsZChwbGF5ZXIuaGVhcnRzKTtcbiAgYWN0aW9ucy5vcmllbnRIZWFydHMocGxheWVyLm9yaWVudGF0aW9uKTtcblxuICAvLyBwaGFzZXIgYXBwYXJlbnRseSBhdXRvbWF0aWNhbGx5IGNhbGxzIGFueSBmdW5jdGlvbiBuYW1lZCB1cGRhdGUgYXR0YWNoZWQgdG8gYSBzcHJpdGUhXG4gIHBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBraWxsIHBsYXllciBpZiBoZSBmYWxscyBvZmYgdGhlIHNjcmVlblxuICAgIGlmIChwbGF5ZXIucG9zaXRpb24ueSA+IDE4MCAmJiBwbGF5ZXIuaHAgIT09IDApIHsgLy8gVE9ETzogaG93IHRvIGFjY2VzcyBuYXRpdmUgaGVpZ2h0IGZyb20gZ2FtZS5qcz9cbiAgICAgIGFjdGlvbnMudGFrZURhbWFnZSgyKTtcbiAgICB9XG5cbiAgICB2YXIgaW5wdXQgPSB7XG4gICAgICBsZWZ0OiAgIChrZXlzLmxlZnQuaXNEb3duICYmICFrZXlzLnJpZ2h0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSAmJiAhZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1JJR0hUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA8IC0wLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPCAtMC4xLFxuICAgICAgcmlnaHQ6ICAoa2V5cy5yaWdodC5pc0Rvd24gJiYgIWtleXMubGVmdC5pc0Rvd24pIHx8XG4gICAgICAgICAgICAgIChnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfTEVGVCkpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWCkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPiAwLjEsXG4gICAgICB1cDogICAgIGtleXMudXAuaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9VUCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9ZKSA8IC0wLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWSkgPCAtMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfQSksXG4gICAgICBkb3duOiAgIGtleXMuZG93bi5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0RPV04pIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWSkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWSkgPiAwLjEsXG4gICAgICBhdHRhY2s6IGtleXMuYXR0YWNrLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1kpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9CKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfTEVGVF9CVU1QRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX1RSSUdHRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9SSUdIVF9CVU1QRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9SSUdIVF9UUklHR0VSKSxcbiAgICB9O1xuXG4gICAgaWYgKGlucHV0LmxlZnQpIHtcbiAgICAgIGFjdGlvbnMucnVuKCdsZWZ0Jyk7XG4gICAgfSBlbHNlIGlmIChpbnB1dC5yaWdodCkge1xuICAgICAgYWN0aW9ucy5ydW4oJ3JpZ2h0Jyk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LnVwKSB7XG4gICAgICB1cFdhc0Rvd24gPSB0cnVlO1xuICAgICAgYWN0aW9ucy5qdW1wKCk7XG4gICAgfSBlbHNlIGlmICh1cFdhc0Rvd24pIHtcbiAgICAgIHVwV2FzRG93biA9IGZhbHNlO1xuICAgICAgYWN0aW9ucy5kYW1wZW5KdW1wKCk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmRvd24pIHtcbiAgICAgIGFjdGlvbnMuZHVjaygpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLmlzRHVja2luZykge1xuICAgICAgYWN0aW9ucy5zdGFuZCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5hdHRhY2spIHtcbiAgICAgIGFjdGlvbnMuYXR0YWNrKCk7XG4gICAgfVxuXG4gICAgKGZ1bmN0aW9uIGFwcGx5RnJpY3Rpb24oKSB7XG4gICAgICAvLyBoZXJlJ3MgYW4gaWRlYSB3aGljaCBzb2x2ZXMgdGhlIHNsaWRpbmcgZ2xpdGNoLCBidXQgaXQgZG9lc24ndCBmZWVsIGFzIGdvb2RcbiAgICAgIC8qaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgIWtleXMubGVmdC5pc0Rvd24gJiYgIWtleXMucmlnaHQuaXNEb3duKSB7XG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICE9PSAwKSB7XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC8gODtcbiAgICAgICAgfVxuICAgICAgfSovXG4gICAgICBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAhcGxheWVyLmlzUm9sbGluZykge1xuICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IDQ7XG4gICAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICs9IDQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KCkpO1xuICB9O1xuXG4gIHJldHVybiBwbGF5ZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBsYXllcjtcbiIsInZhciB1dGlscyA9IHtcbiAgLy8gZnJvbSB1bmRlcnNjb3JlXG4gIGRlYm91bmNlOiBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcblx0dmFyIHRpbWVvdXQ7XG5cdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdH07XG5cdFx0dmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG5cdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0fTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsczsiXX0=
