(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Monosynth = function Monosynth(audioCtx, config) {
  var synth;
  var Synth = function Synth() {
    synth = this;
    config = config || {};
    config.cutoff = config.cutoff || {};

    synth.audioCtx = audioCtx,
    synth.amp      = audioCtx.createGain(),
    synth.filter   = audioCtx.createBiquadFilter(),
    synth.osc      = audioCtx.createOscillator(),
    synth.pan      = audioCtx.createPanner(),

    synth.maxGain  = config.maxGain  || 0.9, // out of 1
    synth.attack   = config.attack   || 0.1, // in seconds
    synth.decay    = config.decay    || 0.0, // in seconds
    synth.sustain  = config.sustain  || 1.0, // out of 1
    synth.release  = config.release  || 0.8, // in seconds

    // low-pass filter
    synth.cutoff              = synth.filter.frequency;
    synth.cutoff.maxFrequency = config.cutoff.maxFrequency || 7500; // in hertz
    synth.cutoff.attack       = config.cutoff.attack       || 0.1; // in seconds
    synth.cutoff.decay        = config.cutoff.decay        || 2.5; // in seconds
    synth.cutoff.sustain      = config.cutoff.sustain      || 0.2; // out of 1
    
    synth.amp.gain.value = 0;
    synth.filter.type = 'lowpass';
    synth.filter.connect(synth.amp);
    synth.amp.connect(audioCtx.destination);
    synth.pan.panningModel = 'equalpower';
    synth.pan.setPosition(0, 0, 1); // start with stereo image centered
    synth.osc.connect(synth.pan);
    synth.pan.connect(synth.filter);
    synth.osc.start(0);
    
    synth.waveform(config.waveform || 'sine');
    synth.pitch(config.pitch || 440);

    return synth;
  };

  function getNow() {
    var now = synth.audioCtx.currentTime;
    synth.amp.gain.cancelScheduledValues(now);
    synth.amp.gain.setValueAtTime(synth.amp.gain.value, now);
    return now;
  };
  
  Synth.prototype.pitch = function pitch(newPitch) {
    if (newPitch) {
      var now = synth.audioCtx.currentTime;
      synth.osc.frequency.setValueAtTime(newPitch, now);
    }
    return synth.osc.frequency.value;
  };

  Synth.prototype.waveform = function waveform(newWaveform) {
    if (newWaveform) {
      synth.osc.type = newWaveform;
    }
    return synth.osc.type;
  };

  // apply attack, decay, sustain envelope
  Synth.prototype.start = function startSynth() {
    var atk  = parseFloat(synth.attack);
    var dec  = parseFloat(synth.decay);
    var cAtk = parseFloat(synth.cutoff.attack);
    var cDec = parseFloat(synth.cutoff.decay);
    var now  = getNow();
    synth.cutoff.cancelScheduledValues(now);
    synth.cutoff.linearRampToValueAtTime(synth.cutoff.value, now);
    synth.cutoff.linearRampToValueAtTime(synth.cutoff.maxFrequency, now + cAtk);
    synth.cutoff.linearRampToValueAtTime(synth.cutoff.sustain * synth.cutoff.maxFrequency, now + cAtk + cDec);
    synth.amp.gain.linearRampToValueAtTime(synth.maxGain, now + atk);
    synth.amp.gain.linearRampToValueAtTime(synth.sustain * synth.maxGain, now + atk + dec);
  };

  // apply release envelope
  Synth.prototype.stop = function stopSynth() {
    var rel = parseFloat(synth.release);
    var now = getNow();
    synth.amp.gain.linearRampToValueAtTime(0, now + rel);
  };

  return new Synth();
};

// npm support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Monosynth;
}

},{}],2:[function(require,module,exports){
// npm support
if (typeof require !== 'undefined') {
  var Monosynth = require('submono');
}

var Polysynth = function Polysynth(audioCtx, config) {
  var synth;
  var Synth = function Synth() {
    synth = this;
    synth.audioCtx = audioCtx;
    synth.voices = [];
    
    config = config || {};
    config.cutoff = config.cutoff || {};


    for (var i = 0, ii = config.numVoices || 16; i < ii; i++) {
      synth.voices.push(new Monosynth(audioCtx, config));
    }

    synth.stereoWidth = config.stereoWidth || 0.5; // out of 1
    synth.width(synth.stereoWidth);

    return synth;
  };

  // apply attack, decay, sustain envelope
  Synth.prototype.start = function startSynth() {
    synth.voices.forEach(function startVoice(voice) {
      voice.start();
    });
  };

  // apply release envelope
  Synth.prototype.stop = function stopSynth() {
    synth.voices.forEach(function stopVoice(voice) {
      voice.stop();
    });
  };

  // get/set synth stereo width
  Synth.prototype.width = function width(newWidth) {
    if (synth.voices.length > 1 && newWidth) {
      synth.stereoWidth = newWidth;
      synth.voices.forEach(function panVoice(voice, i) {
        var spread = 1/(synth.voices.length - 1);
        var xPos = spread * i * synth.stereoWidth;
        var zPos = 1 - Math.abs(xPos);
        voice.pan.setPosition(xPos, 0, zPos);
      });
    }

    return synth.stereoWidth;
  };

  // convenience methods for changing values of all Monosynths' properties at once
  (function createSetters() {
    var monosynthProperties = ['maxGain', 'attack', 'decay', 'sustain', 'release'];
    var monosynthCutoffProperties = ['maxFrequency', 'attack', 'decay', 'sustain'];

    monosynthProperties.forEach(function createSetter(property) {
      Synth.prototype[property] = function setValues(newValue) {
        synth.voices.forEach(function setValue(voice) {
          voice[property] = newValue;
        });
      };
    });

    Synth.prototype.cutoff = {};
    monosynthCutoffProperties.forEach(function createSetter(property) {
      Synth.prototype.cutoff[property] = function setValues(newValue) {
        synth.voices.forEach(function setValue(voice) {
          voice.cutoff[property] = newValue;
        });
      };
    });

    Synth.prototype.waveform = function waveform(newWaveform) {
      synth.voices.forEach(function waveform(voice) {
        voice.waveform(newWaveform);
      });
    };

    Synth.prototype.pitch = function pitch(newPitch) {
      synth.voices.forEach(function pitch(voice) {
        voice.pitch(newPitch);
      });
    };
  })();

  return new Synth;
};

// npm support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Polysynth;
}

},{"submono":1}],3:[function(require,module,exports){
var nativeWidth = 320;
var nativeHeight = 180;
var platforms, players, text, sfx;

var resize = function resize() {
  document.body.style.zoom = window.innerWidth / nativeWidth;
};

var checkForGameOver = function checkForGameOver() {
  var alivePlayers = [];
  players.children.forEach(function(player) {
    if (!player.isDead) {
      alivePlayers.push(player.name);
    }
  });
  if (alivePlayers.length === 1) {
    text.setText('Game over!  ' + alivePlayers[0] + '  wins!\nClick  to  restart');
    text.visible = true;
    game.input.onDown.addOnce(restart, this); // restart game on mouse click
  }
};

var preload = function preload() {
  var utils = require('./utils.js');
  sfx = require('./sfx.js');

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

  while (players.children.length > 0) {
    players.children[0].destroy();
  }

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
  game.physics.arcade.collide(players, platforms);
  // TODO: how do i do this on the player itself without access to players? or should i add a ftn to player and set that as the cb?
  game.physics.arcade.collide(players, players, function handlePlayerCollision(playerA, playerB) {
     /* let's not knock anybody around if something's on one of these dudes'/dudettes' heads.
     prevents cannonball attacks and the like, and allows standing on heads.
     note: still need to collide in order to test touching.up, so don't move this to allowPlayerCollision! */
    if (playerA.body.touching.up || playerB.body.touching.up) {
      return;
    }

    function temporarilyDisableCollision(player) {
      player.isCollidable = false;
      setTimeout(function() {
        player.isCollidable = true;
      }, 100);
    }

    function bounce() {
      sfx.bounce();

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
    // don't allow collision if either player isn't collidable.
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

},{"./map.js":4,"./player.js":5,"./sfx.js":6,"./utils.js":7}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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
      attack: 'ENTER'
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

  var sfx = require('./sfx.js');

  var actions = {
    attack: function attack() {
      var duration = 200;
      var interval = 400;
      var velocity = 200;

      var canAttack = (Date.now() > player.lastAttacked + interval) && !player.isDucking && !player.isDead;
      if (!canAttack) {
        return;
      }

      player.isAttacking = true;
      player.lastAttacked = Date.now();

      sfx.attack();

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
          // if player is going faster than max running speed (due to attack, etc), slow them down over time
          if (player.body.velocity.x < -maxSpeed) {
            player.body.velocity.x += acceleration;
          } else {
            player.body.velocity.x = Math.max(player.body.velocity.x - acceleration, -maxSpeed);
          }
          break;
        case 'right':
          if (player.body.velocity.x > maxSpeed) {
            player.body.velocity.x -= acceleration;
          } else {
            player.body.velocity.x = Math.min(player.body.velocity.x + acceleration, maxSpeed);
          }
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
        sfx.jump();
      // wall jumps
      } else if (player.body.touching.left) {
        player.body.velocity.y = -240;
        player.body.velocity.x = 90;
        sfx.jump();
      } else if (player.body.touching.right) {
        player.body.velocity.y = -240;
        player.body.velocity.x = -90;
        sfx.jump();
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
      if (player.isAttacking || player.isDead) {
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
      sfx.die();

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
        player.isDead = true;
        // knock player on his/her side
        player.scale.setTo(settings.scale.y, settings.scale.x);
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

  player.upWasDown = false; // track input change for variable jump height
  player.isRolling = false;
  player.isDucking = false;
  player.isAttacking = false;
  player.isDead = false;
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
    } else if (player.body.touching.down && !player.isRolling) {
      // apply friction
      if (Math.abs(player.body.velocity.x) < 4) {
        player.body.velocity.x *= 0.5; // quickly bring slow-moving players to a stop
      } else if (player.body.velocity.x > 0) {
        player.body.velocity.x -= 4;
      } else if (player.body.velocity.x < 0) {
        player.body.velocity.x += 4;
      }
    }

    if (input.up) {
      player.upWasDown = true;
      actions.jump();
    } else if (player.upWasDown) {
      player.upWasDown = false;
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
  };

  return player;
};

module.exports = createPlayer;

},{"./game.js":3,"./sfx.js":6}],6:[function(require,module,exports){
var sfx = (function sfx() {
  Polysynth = require('subpoly');

  var audioCtx = new AudioContext();

  var pulse = new Polysynth(audioCtx, {
    waveform: 'square',
    release: 0.1,
    numVoices: 4
  });
  
  function getNow(voice) {
    var now = voice.audioCtx.currentTime;
//    voice.amp.gain.cancelScheduledValues(now);
//    voice.amp.gain.setValueAtTime(voice.amp.gain.value, now);
    return now;
  };
  
  var jumpTimeout, attackTimeout;
  var dieTimeouts = [];

  var soundEffects = {
    jump: function() {
      clearTimeout(jumpTimeout);
      
      var voice = pulse.voices[0];
      var duration = 0.1; // in seconds
      
      voice.pitch(440);
      voice.start();

      var now = getNow(voice);
      voice.osc.frequency.linearRampToValueAtTime(880, now + duration);
      jumpTimeout = setTimeout(voice.stop, duration * 1000);
    },

    attack: function() {
      clearTimeout(attackTimeout);
      
      var voice = pulse.voices[1];
      var duration = 0.1; // in seconds
      
      voice.pitch(880);
      voice.start();

      var now = getNow(voice);
      voice.osc.frequency.linearRampToValueAtTime(0, now + duration);
      attackTimeout = setTimeout(voice.stop, duration * 1000);
    },
    
    bounce: function() {
      clearTimeout(attackTimeout);
      
      var voice = pulse.voices[2];
      var duration = 0.1; // in seconds
      
      voice.pitch(440);
      voice.start();

      var now = getNow(voice);
      voice.osc.frequency.linearRampToValueAtTime(220, now + duration / 2);
      voice.osc.frequency.linearRampToValueAtTime(660, now + duration);
      attackTimeout = setTimeout(voice.stop, duration * 1000);
    },
    
    die: function() {
      while (dieTimeouts.length) {
        clearTimeout(dieTimeouts.pop());
      }
      
      var voice = pulse.voices[3];
      var pitches = [440, 220, 110];
      var duration = 100;

      voice.start();
      
      pitches.forEach(function(pitch, i) {
        dieTimeouts.push(setTimeout(function() {
          voice.pitch(pitch);
        }, i * duration));
      });
      
      dieTimeouts.push(setTimeout(voice.stop, duration * pitches.length));
    }
  };
  
  return soundEffects;
}());

module.exports = sfx;

},{"subpoly":2}],7:[function(require,module,exports){
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
},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc3VibW9uby9zdWJtb25vLmpzIiwibm9kZV9tb2R1bGVzL3N1YnBvbHkvc3VicG9seS5qcyIsInNjcmlwdHMvZ2FtZS5qcyIsInNjcmlwdHMvbWFwLmpzIiwic2NyaXB0cy9wbGF5ZXIuanMiLCJzY3JpcHRzL3NmeC5qcyIsInNjcmlwdHMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIE1vbm9zeW50aCA9IGZ1bmN0aW9uIE1vbm9zeW50aChhdWRpb0N0eCwgY29uZmlnKSB7XG4gIHZhciBzeW50aDtcbiAgdmFyIFN5bnRoID0gZnVuY3Rpb24gU3ludGgoKSB7XG4gICAgc3ludGggPSB0aGlzO1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICBjb25maWcuY3V0b2ZmID0gY29uZmlnLmN1dG9mZiB8fCB7fTtcblxuICAgIHN5bnRoLmF1ZGlvQ3R4ID0gYXVkaW9DdHgsXG4gICAgc3ludGguYW1wICAgICAgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCksXG4gICAgc3ludGguZmlsdGVyICAgPSBhdWRpb0N0eC5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICBzeW50aC5vc2MgICAgICA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICBzeW50aC5wYW4gICAgICA9IGF1ZGlvQ3R4LmNyZWF0ZVBhbm5lcigpLFxuXG4gICAgc3ludGgubWF4R2FpbiAgPSBjb25maWcubWF4R2FpbiAgfHwgMC45LCAvLyBvdXQgb2YgMVxuICAgIHN5bnRoLmF0dGFjayAgID0gY29uZmlnLmF0dGFjayAgIHx8IDAuMSwgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLmRlY2F5ICAgID0gY29uZmlnLmRlY2F5ICAgIHx8IDAuMCwgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLnN1c3RhaW4gID0gY29uZmlnLnN1c3RhaW4gIHx8IDEuMCwgLy8gb3V0IG9mIDFcbiAgICBzeW50aC5yZWxlYXNlICA9IGNvbmZpZy5yZWxlYXNlICB8fCAwLjgsIC8vIGluIHNlY29uZHNcblxuICAgIC8vIGxvdy1wYXNzIGZpbHRlclxuICAgIHN5bnRoLmN1dG9mZiAgICAgICAgICAgICAgPSBzeW50aC5maWx0ZXIuZnJlcXVlbmN5O1xuICAgIHN5bnRoLmN1dG9mZi5tYXhGcmVxdWVuY3kgPSBjb25maWcuY3V0b2ZmLm1heEZyZXF1ZW5jeSB8fCA3NTAwOyAvLyBpbiBoZXJ0elxuICAgIHN5bnRoLmN1dG9mZi5hdHRhY2sgICAgICAgPSBjb25maWcuY3V0b2ZmLmF0dGFjayAgICAgICB8fCAwLjE7IC8vIGluIHNlY29uZHNcbiAgICBzeW50aC5jdXRvZmYuZGVjYXkgICAgICAgID0gY29uZmlnLmN1dG9mZi5kZWNheSAgICAgICAgfHwgMi41OyAvLyBpbiBzZWNvbmRzXG4gICAgc3ludGguY3V0b2ZmLnN1c3RhaW4gICAgICA9IGNvbmZpZy5jdXRvZmYuc3VzdGFpbiAgICAgIHx8IDAuMjsgLy8gb3V0IG9mIDFcbiAgICBcbiAgICBzeW50aC5hbXAuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgc3ludGguZmlsdGVyLnR5cGUgPSAnbG93cGFzcyc7XG4gICAgc3ludGguZmlsdGVyLmNvbm5lY3Qoc3ludGguYW1wKTtcbiAgICBzeW50aC5hbXAuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG4gICAgc3ludGgucGFuLnBhbm5pbmdNb2RlbCA9ICdlcXVhbHBvd2VyJztcbiAgICBzeW50aC5wYW4uc2V0UG9zaXRpb24oMCwgMCwgMSk7IC8vIHN0YXJ0IHdpdGggc3RlcmVvIGltYWdlIGNlbnRlcmVkXG4gICAgc3ludGgub3NjLmNvbm5lY3Qoc3ludGgucGFuKTtcbiAgICBzeW50aC5wYW4uY29ubmVjdChzeW50aC5maWx0ZXIpO1xuICAgIHN5bnRoLm9zYy5zdGFydCgwKTtcbiAgICBcbiAgICBzeW50aC53YXZlZm9ybShjb25maWcud2F2ZWZvcm0gfHwgJ3NpbmUnKTtcbiAgICBzeW50aC5waXRjaChjb25maWcucGl0Y2ggfHwgNDQwKTtcblxuICAgIHJldHVybiBzeW50aDtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXROb3coKSB7XG4gICAgdmFyIG5vdyA9IHN5bnRoLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xuICAgIHN5bnRoLmFtcC5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyhub3cpO1xuICAgIHN5bnRoLmFtcC5nYWluLnNldFZhbHVlQXRUaW1lKHN5bnRoLmFtcC5nYWluLnZhbHVlLCBub3cpO1xuICAgIHJldHVybiBub3c7XG4gIH07XG4gIFxuICBTeW50aC5wcm90b3R5cGUucGl0Y2ggPSBmdW5jdGlvbiBwaXRjaChuZXdQaXRjaCkge1xuICAgIGlmIChuZXdQaXRjaCkge1xuICAgICAgdmFyIG5vdyA9IHN5bnRoLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xuICAgICAgc3ludGgub3NjLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShuZXdQaXRjaCwgbm93KTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bnRoLm9zYy5mcmVxdWVuY3kudmFsdWU7XG4gIH07XG5cbiAgU3ludGgucHJvdG90eXBlLndhdmVmb3JtID0gZnVuY3Rpb24gd2F2ZWZvcm0obmV3V2F2ZWZvcm0pIHtcbiAgICBpZiAobmV3V2F2ZWZvcm0pIHtcbiAgICAgIHN5bnRoLm9zYy50eXBlID0gbmV3V2F2ZWZvcm07XG4gICAgfVxuICAgIHJldHVybiBzeW50aC5vc2MudHlwZTtcbiAgfTtcblxuICAvLyBhcHBseSBhdHRhY2ssIGRlY2F5LCBzdXN0YWluIGVudmVsb3BlXG4gIFN5bnRoLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIHN0YXJ0U3ludGgoKSB7XG4gICAgdmFyIGF0ayAgPSBwYXJzZUZsb2F0KHN5bnRoLmF0dGFjayk7XG4gICAgdmFyIGRlYyAgPSBwYXJzZUZsb2F0KHN5bnRoLmRlY2F5KTtcbiAgICB2YXIgY0F0ayA9IHBhcnNlRmxvYXQoc3ludGguY3V0b2ZmLmF0dGFjayk7XG4gICAgdmFyIGNEZWMgPSBwYXJzZUZsb2F0KHN5bnRoLmN1dG9mZi5kZWNheSk7XG4gICAgdmFyIG5vdyAgPSBnZXROb3coKTtcbiAgICBzeW50aC5jdXRvZmYuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKG5vdyk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi52YWx1ZSwgbm93KTtcbiAgICBzeW50aC5jdXRvZmYubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoc3ludGguY3V0b2ZmLm1heEZyZXF1ZW5jeSwgbm93ICsgY0F0ayk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi5zdXN0YWluICogc3ludGguY3V0b2ZmLm1heEZyZXF1ZW5jeSwgbm93ICsgY0F0ayArIGNEZWMpO1xuICAgIHN5bnRoLmFtcC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLm1heEdhaW4sIG5vdyArIGF0ayk7XG4gICAgc3ludGguYW1wLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoc3ludGguc3VzdGFpbiAqIHN5bnRoLm1heEdhaW4sIG5vdyArIGF0ayArIGRlYyk7XG4gIH07XG5cbiAgLy8gYXBwbHkgcmVsZWFzZSBlbnZlbG9wZVxuICBTeW50aC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3BTeW50aCgpIHtcbiAgICB2YXIgcmVsID0gcGFyc2VGbG9hdChzeW50aC5yZWxlYXNlKTtcbiAgICB2YXIgbm93ID0gZ2V0Tm93KCk7XG4gICAgc3ludGguYW1wLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMCwgbm93ICsgcmVsKTtcbiAgfTtcblxuICByZXR1cm4gbmV3IFN5bnRoKCk7XG59O1xuXG4vLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBNb25vc3ludGg7XG59XG4iLCIvLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJykge1xuICB2YXIgTW9ub3N5bnRoID0gcmVxdWlyZSgnc3VibW9ubycpO1xufVxuXG52YXIgUG9seXN5bnRoID0gZnVuY3Rpb24gUG9seXN5bnRoKGF1ZGlvQ3R4LCBjb25maWcpIHtcbiAgdmFyIHN5bnRoO1xuICB2YXIgU3ludGggPSBmdW5jdGlvbiBTeW50aCgpIHtcbiAgICBzeW50aCA9IHRoaXM7XG4gICAgc3ludGguYXVkaW9DdHggPSBhdWRpb0N0eDtcbiAgICBzeW50aC52b2ljZXMgPSBbXTtcbiAgICBcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uZmlnLmN1dG9mZiA9IGNvbmZpZy5jdXRvZmYgfHwge307XG5cblxuICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGNvbmZpZy5udW1Wb2ljZXMgfHwgMTY7IGkgPCBpaTsgaSsrKSB7XG4gICAgICBzeW50aC52b2ljZXMucHVzaChuZXcgTW9ub3N5bnRoKGF1ZGlvQ3R4LCBjb25maWcpKTtcbiAgICB9XG5cbiAgICBzeW50aC5zdGVyZW9XaWR0aCA9IGNvbmZpZy5zdGVyZW9XaWR0aCB8fCAwLjU7IC8vIG91dCBvZiAxXG4gICAgc3ludGgud2lkdGgoc3ludGguc3RlcmVvV2lkdGgpO1xuXG4gICAgcmV0dXJuIHN5bnRoO1xuICB9O1xuXG4gIC8vIGFwcGx5IGF0dGFjaywgZGVjYXksIHN1c3RhaW4gZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gc3RhcnRTeW50aCgpIHtcbiAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBzdGFydFZvaWNlKHZvaWNlKSB7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIGFwcGx5IHJlbGVhc2UgZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wU3ludGgoKSB7XG4gICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc3RvcFZvaWNlKHZvaWNlKSB7XG4gICAgICB2b2ljZS5zdG9wKCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZ2V0L3NldCBzeW50aCBzdGVyZW8gd2lkdGhcbiAgU3ludGgucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24gd2lkdGgobmV3V2lkdGgpIHtcbiAgICBpZiAoc3ludGgudm9pY2VzLmxlbmd0aCA+IDEgJiYgbmV3V2lkdGgpIHtcbiAgICAgIHN5bnRoLnN0ZXJlb1dpZHRoID0gbmV3V2lkdGg7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBwYW5Wb2ljZSh2b2ljZSwgaSkge1xuICAgICAgICB2YXIgc3ByZWFkID0gMS8oc3ludGgudm9pY2VzLmxlbmd0aCAtIDEpO1xuICAgICAgICB2YXIgeFBvcyA9IHNwcmVhZCAqIGkgKiBzeW50aC5zdGVyZW9XaWR0aDtcbiAgICAgICAgdmFyIHpQb3MgPSAxIC0gTWF0aC5hYnMoeFBvcyk7XG4gICAgICAgIHZvaWNlLnBhbi5zZXRQb3NpdGlvbih4UG9zLCAwLCB6UG9zKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBzeW50aC5zdGVyZW9XaWR0aDtcbiAgfTtcblxuICAvLyBjb252ZW5pZW5jZSBtZXRob2RzIGZvciBjaGFuZ2luZyB2YWx1ZXMgb2YgYWxsIE1vbm9zeW50aHMnIHByb3BlcnRpZXMgYXQgb25jZVxuICAoZnVuY3Rpb24gY3JlYXRlU2V0dGVycygpIHtcbiAgICB2YXIgbW9ub3N5bnRoUHJvcGVydGllcyA9IFsnbWF4R2FpbicsICdhdHRhY2snLCAnZGVjYXknLCAnc3VzdGFpbicsICdyZWxlYXNlJ107XG4gICAgdmFyIG1vbm9zeW50aEN1dG9mZlByb3BlcnRpZXMgPSBbJ21heEZyZXF1ZW5jeScsICdhdHRhY2snLCAnZGVjYXknLCAnc3VzdGFpbiddO1xuXG4gICAgbW9ub3N5bnRoUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihwcm9wZXJ0eSkge1xuICAgICAgU3ludGgucHJvdG90eXBlW3Byb3BlcnR5XSA9IGZ1bmN0aW9uIHNldFZhbHVlcyhuZXdWYWx1ZSkge1xuICAgICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBzZXRWYWx1ZSh2b2ljZSkge1xuICAgICAgICAgIHZvaWNlW3Byb3BlcnR5XSA9IG5ld1ZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBTeW50aC5wcm90b3R5cGUuY3V0b2ZmID0ge307XG4gICAgbW9ub3N5bnRoQ3V0b2ZmUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihwcm9wZXJ0eSkge1xuICAgICAgU3ludGgucHJvdG90eXBlLmN1dG9mZltwcm9wZXJ0eV0gPSBmdW5jdGlvbiBzZXRWYWx1ZXMobmV3VmFsdWUpIHtcbiAgICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc2V0VmFsdWUodm9pY2UpIHtcbiAgICAgICAgICB2b2ljZS5jdXRvZmZbcHJvcGVydHldID0gbmV3VmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIFN5bnRoLnByb3RvdHlwZS53YXZlZm9ybSA9IGZ1bmN0aW9uIHdhdmVmb3JtKG5ld1dhdmVmb3JtKSB7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiB3YXZlZm9ybSh2b2ljZSkge1xuICAgICAgICB2b2ljZS53YXZlZm9ybShuZXdXYXZlZm9ybSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgU3ludGgucHJvdG90eXBlLnBpdGNoID0gZnVuY3Rpb24gcGl0Y2gobmV3UGl0Y2gpIHtcbiAgICAgIHN5bnRoLnZvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIHBpdGNoKHZvaWNlKSB7XG4gICAgICAgIHZvaWNlLnBpdGNoKG5ld1BpdGNoKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pKCk7XG5cbiAgcmV0dXJuIG5ldyBTeW50aDtcbn07XG5cbi8vIG5wbSBzdXBwb3J0XG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IFBvbHlzeW50aDtcbn1cbiIsInZhciBuYXRpdmVXaWR0aCA9IDMyMDtcbnZhciBuYXRpdmVIZWlnaHQgPSAxODA7XG52YXIgcGxhdGZvcm1zLCBwbGF5ZXJzLCB0ZXh0LCBzZng7XG5cbnZhciByZXNpemUgPSBmdW5jdGlvbiByZXNpemUoKSB7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUuem9vbSA9IHdpbmRvdy5pbm5lcldpZHRoIC8gbmF0aXZlV2lkdGg7XG59O1xuXG52YXIgY2hlY2tGb3JHYW1lT3ZlciA9IGZ1bmN0aW9uIGNoZWNrRm9yR2FtZU92ZXIoKSB7XG4gIHZhciBhbGl2ZVBsYXllcnMgPSBbXTtcbiAgcGxheWVycy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKHBsYXllcikge1xuICAgIGlmICghcGxheWVyLmlzRGVhZCkge1xuICAgICAgYWxpdmVQbGF5ZXJzLnB1c2gocGxheWVyLm5hbWUpO1xuICAgIH1cbiAgfSk7XG4gIGlmIChhbGl2ZVBsYXllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgdGV4dC5zZXRUZXh0KCdHYW1lIG92ZXIhICAnICsgYWxpdmVQbGF5ZXJzWzBdICsgJyAgd2lucyFcXG5DbGljayAgdG8gIHJlc3RhcnQnKTtcbiAgICB0ZXh0LnZpc2libGUgPSB0cnVlO1xuICAgIGdhbWUuaW5wdXQub25Eb3duLmFkZE9uY2UocmVzdGFydCwgdGhpcyk7IC8vIHJlc3RhcnQgZ2FtZSBvbiBtb3VzZSBjbGlja1xuICB9XG59O1xuXG52YXIgcHJlbG9hZCA9IGZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbiAgc2Z4ID0gcmVxdWlyZSgnLi9zZnguanMnKTtcblxuICByZXNpemUoKTtcbiAgd2luZG93Lm9ucmVzaXplID0gdXRpbHMuZGVib3VuY2UocmVzaXplLCAxMDApO1xuXG4gIGdhbWUubG9hZC5pbWFnZSgncGluaycsICdpbWFnZXMvcGluay5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCd5ZWxsb3cnLCAnaW1hZ2VzL3llbGxvdy5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdibHVlJywgJ2ltYWdlcy9ibHVlLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ29yYW5nZScsICdpbWFnZXMvb3JhbmdlLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3B1cnBsZScsICdpbWFnZXMvcHVycGxlLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ2dyZWVuJywgJ2ltYWdlcy9ncmVlbi5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCd3aGl0ZScsICdpbWFnZXMvd2hpdGUucG5nJyk7XG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnaGVhcnRzJywgJ2ltYWdlcy9oZWFydHMucG5nJywgOSwgNSk7IC8vIHBsYXllciBoZWFsdGhcbn07XG5cbnZhciBjcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICBnYW1lLndvcmxkLnNldEJvdW5kcygwLCAtbmF0aXZlSGVpZ2h0LCBuYXRpdmVXaWR0aCwgbmF0aXZlSGVpZ2h0ICogMyk7IC8vIGFsbG93IGFueXRoaW5nIGFzIHRhbGwgYXMgd29ybGQgdG8gZmFsbCBvZmYtc2NyZWVuIHVwIG9yIGRvd25cblxuICB2YXIgYnVpbGRQbGF0Zm9ybXMgPSByZXF1aXJlKCcuL21hcC5qcycpO1xuICBwbGF0Zm9ybXMgPSBidWlsZFBsYXRmb3JtcyhnYW1lKTtcblxuICBnYW1lLmlucHV0LmdhbWVwYWQuc3RhcnQoKTtcblxuICAvLyBUT0RPOiB3aHkgaXMgdGhpcyBmb250IHN0aWxsIGFudGktYWxpYXNlZD9cbiAgdmFyIGZvbnRTdHlsZSA9IHsgZm9udDogXCIxMnB4IEhlbGxvdmV0aWNhXCIsIGZpbGw6IFwiI2VlZVwiLCBhbGlnbjogXCJjZW50ZXJcIiwgYm91bmRzQWxpZ25IOiBcImNlbnRlclwiLCBib3VuZHNBbGlnblY6IFwibWlkZGxlXCIgfTtcbiAgdGV4dCA9IGdhbWUuYWRkLnRleHQoMCwgMCwgJycsIGZvbnRTdHlsZSk7XG4gIHRleHQuc2V0VGV4dEJvdW5kcygwLCAwLCBuYXRpdmVXaWR0aCwgbmF0aXZlSGVpZ2h0KTtcblxuICBwbGF5ZXJzID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgcmVzdGFydCgpO1xufTtcblxudmFyIHJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdGV4dC52aXNpYmxlID0gZmFsc2U7XG5cbiAgd2hpbGUgKHBsYXllcnMuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgIHBsYXllcnMuY2hpbGRyZW5bMF0uZGVzdHJveSgpO1xuICB9XG5cbiAgdmFyIGNyZWF0ZVBsYXllciA9IHJlcXVpcmUoJy4vcGxheWVyLmpzJyk7XG5cbiAgdmFyIHBsYXllcjEgPSB7XG4gICAgbmFtZTogJ0JsdWUnLFxuICAgIGNvbG9yOiAnYmx1ZScsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEsXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDcyLCB5OiA0NFxuICAgIH0sXG4gIH07XG5cbiAgdmFyIHBsYXllcjIgPSB7XG4gICAgbmFtZTogJ1llbGxvdycsXG4gICAgY29sb3I6ICd5ZWxsb3cnLFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLFxuICAgIHBvc2l0aW9uOiB7XG4gICAgICB4OiAyNDgsIHk6IDQ0XG4gICAgfSxcbiAgICBvcmllbnRhdGlvbjogJ2xlZnQnLFxuICB9O1xuXG4gIHZhciBwbGF5ZXIzID0ge1xuICAgIG5hbWU6ICdHcmVlbicsXG4gICAgY29sb3I6ICdncmVlbicsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCcsIGF0dGFjazogJ1EnXG4gICAgfSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgeDogNzIsIHk6IDEzNlxuICAgIH0sXG4gIH07XG5cbiAgdmFyIHBsYXllcjQgPSB7XG4gICAgbmFtZTogJ1B1cnBsZScsXG4gICAgY29sb3I6ICdwdXJwbGUnLFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LFxuICAgIGtleXM6IHtcbiAgICAgIHVwOiAnSScsIGRvd246ICdLJywgbGVmdDogJ0onLCByaWdodDogJ0wnLCBhdHRhY2s6ICdVJ1xuICAgIH0sXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDI0OCwgeTogMTM2XG4gICAgfSxcbiAgICBvcmllbnRhdGlvbjogJ2xlZnQnLFxuICB9O1xuXG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIxKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIyKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIzKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXI0KSk7XG59O1xuXG52YXIgdXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKCkge1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUocGxheWVycywgcGxhdGZvcm1zKTtcbiAgLy8gVE9ETzogaG93IGRvIGkgZG8gdGhpcyBvbiB0aGUgcGxheWVyIGl0c2VsZiB3aXRob3V0IGFjY2VzcyB0byBwbGF5ZXJzPyBvciBzaG91bGQgaSBhZGQgYSBmdG4gdG8gcGxheWVyIGFuZCBzZXQgdGhhdCBhcyB0aGUgY2I/XG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZShwbGF5ZXJzLCBwbGF5ZXJzLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJDb2xsaXNpb24ocGxheWVyQSwgcGxheWVyQikge1xuICAgICAvKiBsZXQncyBub3Qga25vY2sgYW55Ym9keSBhcm91bmQgaWYgc29tZXRoaW5nJ3Mgb24gb25lIG9mIHRoZXNlIGR1ZGVzJy9kdWRldHRlcycgaGVhZHMuXG4gICAgIHByZXZlbnRzIGNhbm5vbmJhbGwgYXR0YWNrcyBhbmQgdGhlIGxpa2UsIGFuZCBhbGxvd3Mgc3RhbmRpbmcgb24gaGVhZHMuXG4gICAgIG5vdGU6IHN0aWxsIG5lZWQgdG8gY29sbGlkZSBpbiBvcmRlciB0byB0ZXN0IHRvdWNoaW5nLnVwLCBzbyBkb24ndCBtb3ZlIHRoaXMgdG8gYWxsb3dQbGF5ZXJDb2xsaXNpb24hICovXG4gICAgaWYgKHBsYXllckEuYm9keS50b3VjaGluZy51cCB8fCBwbGF5ZXJCLmJvZHkudG91Y2hpbmcudXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyKSB7XG4gICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gZmFsc2U7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcbiAgICAgIH0sIDEwMCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYm91bmNlKCkge1xuICAgICAgc2Z4LmJvdW5jZSgpO1xuXG4gICAgICB2YXIgYm91bmNlVmVsb2NpdHkgPSAxMDA7XG4gICAgICB2YXIgdmVsb2NpdHlBID0gdmVsb2NpdHlCID0gYm91bmNlVmVsb2NpdHk7XG4gICAgICBpZiAocGxheWVyQS5wb3NpdGlvbi54ID4gcGxheWVyQi5wb3NpdGlvbi54KSB7XG4gICAgICAgIHZlbG9jaXR5QiAqPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZlbG9jaXR5QSAqPSAtMTtcbiAgICAgIH1cbiAgICAgIHBsYXllckEuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlBO1xuICAgICAgcGxheWVyQi5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eUI7XG4gICAgICBwbGF5ZXJBLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgICAgcGxheWVyQi5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbGluZygpIHtcbiAgICAgIHZhciBwbGF5ZXJUb0ZsaW5nO1xuICAgICAgdmFyIHBsYXllclRvTGVhdmU7XG4gICAgICBpZiAocGxheWVyQS5pc0R1Y2tpbmcpIHtcbiAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckI7XG4gICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJBO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckE7XG4gICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJCO1xuICAgICAgfVxuICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvRmxpbmcpO1xuICAgICAgdmFyIGZsaW5nWFZlbG9jaXR5ID0gMTUwO1xuICAgICAgaWYgKHBsYXllclRvRmxpbmcucG9zaXRpb24ueCA+IHBsYXllclRvTGVhdmUucG9zaXRpb24ueCkge1xuICAgICAgICBmbGluZ1hWZWxvY2l0eSAqPSAtMTtcbiAgICAgIH1cbiAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS54ID0gZmxpbmdYVmVsb2NpdHk7XG4gICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueSA9IC0xNTA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9wKCkge1xuICAgICAgdmFyIHBsYXllclRvUG9wO1xuICAgICAgaWYgKHBsYXllckEuaXNSb2xsaW5nKSB7XG4gICAgICAgIHBsYXllclRvUG9wID0gcGxheWVyQjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBsYXllclRvUG9wID0gcGxheWVyQTtcbiAgICAgIH1cbiAgICAgIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXJUb1BvcCk7XG4gICAgICBwbGF5ZXJUb1BvcC5ib2R5LnZlbG9jaXR5LnkgPSAtMTUwO1xuICAgIH1cblxuICAgIHZhciBib3RoUm9sbGluZyA9IHBsYXllckEuaXNSb2xsaW5nICYmIHBsYXllckIuaXNSb2xsaW5nO1xuICAgIHZhciBib3RoU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgJiYgIXBsYXllckIuaXNEdWNraW5nO1xuICAgIHZhciBuZWl0aGVyUm9sbGluZyA9ICFwbGF5ZXJBLmlzUm9sbGluZyAmJiAhcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgdmFyIGVpdGhlckR1Y2tpbmcgPSBwbGF5ZXJBLmlzRHVja2luZyB8fCBwbGF5ZXJCLmlzRHVja2luZztcbiAgICB2YXIgZWl0aGVyUnVubmluZyA9IE1hdGguYWJzKHBsYXllckEuYm9keS52ZWxvY2l0eS54KSA+IDI4IHx8IE1hdGguYWJzKHBsYXllckIuYm9keS52ZWxvY2l0eS54KSA+PSAyODtcbiAgICB2YXIgZWl0aGVyUm9sbGluZyA9IHBsYXllckEuaXNSb2xsaW5nIHx8IHBsYXllckIuaXNSb2xsaW5nO1xuICAgIHZhciBlaXRoZXJTdGFuZGluZyA9ICFwbGF5ZXJBLmlzRHVja2luZyB8fCAhcGxheWVyQi5pc0R1Y2tpbmc7XG5cbiAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgIGNhc2UgYm90aFJvbGxpbmcgfHwgYm90aFN0YW5kaW5nOlxuICAgICAgICBib3VuY2UoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIG5laXRoZXJSb2xsaW5nICYmIGVpdGhlclJ1bm5pbmcgJiYgZWl0aGVyRHVja2luZzpcbiAgICAgICAgZmxpbmcoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGVpdGhlclJvbGxpbmcgJiYgZWl0aGVyU3RhbmRpbmc6XG4gICAgICAgIHBvcCgpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBpZiBvbmx5IG9uZSBvZiB0aGUgdG91Y2hpbmcgcGxheWVycyBpcyBhdHRhY2tpbmcuLi5cbiAgICBpZiAocGxheWVyQS5pc0F0dGFja2luZyAhPT0gcGxheWVyQi5pc0F0dGFja2luZykge1xuICAgICAgdmFyIHZpY3RpbSA9IHBsYXllckEuaXNBdHRhY2tpbmcgPyBwbGF5ZXJCIDogcGxheWVyQTtcbiAgICAgIGlmIChwbGF5ZXJBLm9yaWVudGF0aW9uICE9PSBwbGF5ZXJCLm9yaWVudGF0aW9uKSB7XG4gICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWN0aW0uYWN0aW9ucy50YWtlRGFtYWdlKDIpOyAvLyBhdHRhY2tlZCBmcm9tIGJlaGluZCBmb3IgZG91YmxlIGRhbWFnZVxuICAgICAgfVxuICAgIH1cblxuICB9LCBmdW5jdGlvbiBhbGxvd1BsYXllckNvbGxpc2lvbihwbGF5ZXJBLCBwbGF5ZXJCKSB7XG4gICAgLy8gZG9uJ3QgYWxsb3cgY29sbGlzaW9uIGlmIGVpdGhlciBwbGF5ZXIgaXNuJ3QgY29sbGlkYWJsZS5cbiAgICBpZiAoIXBsYXllckEuaXNDb2xsaWRhYmxlIHx8ICFwbGF5ZXJCLmlzQ29sbGlkYWJsZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59O1xuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZShuYXRpdmVXaWR0aCwgbmF0aXZlSGVpZ2h0LCBQaGFzZXIuQVVUTywgJ2dhbWUnLCB7XG4gIHByZWxvYWQ6IHByZWxvYWQsXG4gIGNyZWF0ZTogY3JlYXRlLFxuICB1cGRhdGU6IHVwZGF0ZSxcbn0sIGZhbHNlLCBmYWxzZSk7IC8vIGRpc2FibGUgYW50aS1hbGlhc2luZ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNoZWNrRm9yR2FtZU92ZXI7XG4iLCJ2YXIgYnVpbGRQbGF0Zm9ybXMgPSBmdW5jdGlvbiBidWlsZFBsYXRmb3JtcyhnYW1lKSB7XG4gIHZhciBwbGF0Zm9ybXMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICBwbGF0Zm9ybXMuZW5hYmxlQm9keSA9IHRydWU7XG4gIHZhciBwbGF0Zm9ybVBvc2l0aW9ucyA9IFtbNDgsIDY0XSwgWzIyNCwgNjRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsxMzYsIDEwNF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBbNDgsIDE1NCxdLCBbMjI0LCAxNTRdXTtcblxuICBwbGF0Zm9ybVBvc2l0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG4gICAgdmFyIHBsYXRmb3JtID0gcGxhdGZvcm1zLmNyZWF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sICdwaW5rJyk7XG4gICAgcGxhdGZvcm0uc2NhbGUuc2V0VG8oMjQsIDQpO1xuICAgIHBsYXRmb3JtLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgfSk7XG5cbiAgdmFyIHdhbGxzID0gW107XG4gIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgtMTYsIDMyLCAncGluaycpKTtcbiAgd2FsbHMucHVzaChwbGF0Zm9ybXMuY3JlYXRlKDMwNCwgMzIsICdwaW5rJykpO1xuICB3YWxscy5mb3JFYWNoKGZ1bmN0aW9uKHdhbGwpIHtcbiAgICB3YWxsLnNjYWxlLnNldFRvKDE2LCA3NCk7XG4gICAgd2FsbC5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gIH0pO1xuICBcbiAgcmV0dXJuIHBsYXRmb3Jtcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnVpbGRQbGF0Zm9ybXM7XG4iLCJ2YXIgY3JlYXRlUGxheWVyID0gZnVuY3Rpb24gY3JlYXRlUGxheWVyKGdhbWUsIG9wdGlvbnMpIHtcbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIHBvc2l0aW9uOiB7XG4gICAgICB4OiA0LFxuICAgICAgeTogOFxuICAgIH0sXG4gICAgb3JpZW50YXRpb246ICdyaWdodCcsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdVUCcsXG4gICAgICBkb3duOiAnRE9XTicsXG4gICAgICBsZWZ0OiAnTEVGVCcsXG4gICAgICByaWdodDogJ1JJR0hUJyxcbiAgICAgIGF0dGFjazogJ0VOVEVSJ1xuICAgIH0sXG4gICAgc2NhbGU6IHtcbiAgICAgIHg6IDQsXG4gICAgICB5OiA4XG4gICAgfSxcbiAgICBjb2xvcjogJ3BpbmsnLFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLFxuICB9O1xuXG4gIHZhciBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICB2YXIga2V5cyA9IHtcbiAgICB1cDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMudXBdKSxcbiAgICBkb3duOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5kb3duXSksXG4gICAgbGVmdDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMubGVmdF0pLFxuICAgIHJpZ2h0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5yaWdodF0pLFxuICAgIGF0dGFjazogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuYXR0YWNrXSksXG4gIH07XG5cbiAgdmFyIGdhbWVwYWQgPSBzZXR0aW5ncy5nYW1lcGFkO1xuXG4gIHZhciBzZnggPSByZXF1aXJlKCcuL3NmeC5qcycpO1xuXG4gIHZhciBhY3Rpb25zID0ge1xuICAgIGF0dGFjazogZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgdmFyIGR1cmF0aW9uID0gMjAwO1xuICAgICAgdmFyIGludGVydmFsID0gNDAwO1xuICAgICAgdmFyIHZlbG9jaXR5ID0gMjAwO1xuXG4gICAgICB2YXIgY2FuQXR0YWNrID0gKERhdGUubm93KCkgPiBwbGF5ZXIubGFzdEF0dGFja2VkICsgaW50ZXJ2YWwpICYmICFwbGF5ZXIuaXNEdWNraW5nICYmICFwbGF5ZXIuaXNEZWFkO1xuICAgICAgaWYgKCFjYW5BdHRhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSB0cnVlO1xuICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IERhdGUubm93KCk7XG5cbiAgICAgIHNmeC5hdHRhY2soKTtcblxuICAgICAgc3dpdGNoKHBsYXllci5vcmllbnRhdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLXZlbG9jaXR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIubG9hZFRleHR1cmUoJ3doaXRlJyk7XG4gICAgICBzZXRUaW1lb3V0KGFjdGlvbnMuZW5kQXR0YWNrLCBkdXJhdGlvbik7XG4gICAgfSxcblxuICAgIGVuZEF0dGFjazogZnVuY3Rpb24gZW5kQXR0YWNrKCkge1xuICAgICAgaWYgKHBsYXllci5pc0F0dGFja2luZykge1xuICAgICAgICBwbGF5ZXIubG9hZFRleHR1cmUoc2V0dGluZ3MuY29sb3IpO1xuICAgICAgICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcnVuOiBmdW5jdGlvbiBydW4oZGlyZWN0aW9uKSB7XG4gICAgICB2YXIgbWF4U3BlZWQgPSA2NDtcbiAgICAgIHZhciBhY2NlbGVyYXRpb24gPSBwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duID8gOCA6IDM7IC8vIHBsYXllcnMgaGF2ZSBsZXNzIGNvbnRyb2wgaW4gdGhlIGFpclxuICAgICAgcGxheWVyLm9yaWVudGF0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAvLyBpZiBwbGF5ZXIgaXMgZ29pbmcgZmFzdGVyIHRoYW4gbWF4IHJ1bm5pbmcgc3BlZWQgKGR1ZSB0byBhdHRhY2ssIGV0YyksIHNsb3cgdGhlbSBkb3duIG92ZXIgdGltZVxuICAgICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IDwgLW1heFNwZWVkKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICs9IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWF4KHBsYXllci5ib2R5LnZlbG9jaXR5LnggLSBhY2NlbGVyYXRpb24sIC1tYXhTcGVlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPiBtYXhTcGVlZCkge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSBhY2NlbGVyYXRpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1pbihwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICsgYWNjZWxlcmF0aW9uLCBtYXhTcGVlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBhY3Rpb25zLm9yaWVudEhlYXJ0cyhkaXJlY3Rpb24pO1xuICAgIH0sXG4gICAgXG4gICAgLy8gVE9ETzogZml4IGxlZnQgaGVhcnRzIHBvc2l0aW9uIHdoZW4gaHAgaXMgbGVzcyB0aGFuIG1heFxuICAgIG9yaWVudEhlYXJ0czogZnVuY3Rpb24gb3JpZW50SGVhcnRzKGRpcmVjdGlvbikge1xuICAgICAgdmFyIGhlYXJ0RGlzdGFuY2UgPSAxLjE7IC8vIGhvdyBjbG9zZSBoZWFydHMgZmxvYXQgYnkgcGxheWVyXG4gICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICBwbGF5ZXIuaGVhcnRzLmFuY2hvci5zZXRUbygtaGVhcnREaXN0YW5jZSwgMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBwbGF5ZXIuaGVhcnRzLmFuY2hvci5zZXRUbyhoZWFydERpc3RhbmNlLCAwKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAganVtcDogZnVuY3Rpb24ganVtcCgpIHtcbiAgICAgIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMjAwO1xuICAgICAgICBzZnguanVtcCgpO1xuICAgICAgLy8gd2FsbCBqdW1wc1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5sZWZ0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMjQwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gOTA7XG4gICAgICAgIHNmeC5qdW1wKCk7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLnJpZ2h0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMjQwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLTkwO1xuICAgICAgICBzZnguanVtcCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBkYW1wZW5KdW1wOiBmdW5jdGlvbiBkYW1wZW5KdW1wKCkge1xuICAgICAgLy8gc29mdGVuIHVwd2FyZCB2ZWxvY2l0eSB3aGVuIHBsYXllciByZWxlYXNlcyBqdW1wIGtleVxuICAgICAgICB2YXIgZGFtcGVuVG9QZXJjZW50ID0gMC41O1xuXG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS55IDwgMCkge1xuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgKj0gZGFtcGVuVG9QZXJjZW50O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGR1Y2s6IGZ1bmN0aW9uIGR1Y2soKSB7XG4gICAgICBpZiAocGxheWVyLmlzQXR0YWNraW5nIHx8IHBsYXllci5pc0RlYWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkgLyAyKTtcbiAgICAgICAgcGxheWVyLnkgKz0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSB0cnVlO1xuXG4gICAgICAoZnVuY3Rpb24gcm9sbCgpIHtcbiAgICAgICAgdmFyIGNhblJvbGwgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA+IDUwICYmIHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd247XG4gICAgICAgIGlmIChjYW5Sb2xsKSB7XG4gICAgICAgICAgcGxheWVyLmlzUm9sbGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0oKSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgIHBsYXllci55IC09IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSk7XG4gICAgICBwbGF5ZXIuaXNEdWNraW5nID0gZmFsc2U7XG4gICAgICBwbGF5ZXIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHRha2VEYW1hZ2U6IGZ1bmN0aW9uIHRha2VEYW1hZ2UoYW1vdW50KSB7XG4gICAgICAvLyBwcmV2ZW50IHRha2luZyBtb3JlIGRhbWFnZSB0aGFuIGhwIHJlbWFpbmluZyBpbiBhIGN1cnJlbnQgaGVhcnRcbiAgICAgIGlmIChhbW91bnQgPiAxICYmIChwbGF5ZXIuaHAgLSBhbW91bnQpICUgMiAhPT0gMCkge1xuICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIuaHAgLT0gYW1vdW50O1xuXG4gICAgICBpZiAocGxheWVyLmhwIDwgMCkge1xuICAgICAgICBwbGF5ZXIuaHAgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHBsYXllci5ocCAlIDIgPT09IDApIHtcbiAgICAgICAgYWN0aW9ucy5kaWUoKTtcbiAgICAgIH1cbiAgICAgIGFjdGlvbnMudXBkYXRlSGVhcnRzKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUhlYXJ0czogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGVhbHRoUGVyY2VudGFnZSA9IHBsYXllci5ocCAvIHBsYXllci5tYXhIcDtcbiAgICAgIHZhciBjcm9wV2lkdGggPSBNYXRoLmNlaWwoaGVhbHRoUGVyY2VudGFnZSAqIGhlYXJ0c1dpZHRoKTtcbiAgICAgIHZhciBjcm9wUmVjdCA9IG5ldyBQaGFzZXIuUmVjdGFuZ2xlKDAsIDAsIGNyb3BXaWR0aCwgcGxheWVyLmhlYXJ0cy5oZWlnaHQpO1xuICAgICAgcGxheWVyLmhlYXJ0cy5jcm9wKGNyb3BSZWN0KTtcbiAgICB9LFxuXG4gICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIHNmeC5kaWUoKTtcblxuICAgICAgaWYgKHBsYXllci5ocCA+IDApIHtcbiAgICAgICAgYWN0aW9ucy5lbmRBdHRhY2soKTtcbiAgICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IDA7XG5cbiAgICAgICAgdmFyIHJlc3Bhd25Qb3NpdGlvbiA9IHtcbiAgICAgICAgICB4OiBNYXRoLnJhbmRvbSgpID4gMC41ID8gNCA6IDMwNixcbiAgICAgICAgICB5OiA4XG4gICAgICAgIH07XG5cbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnggPSByZXNwYXduUG9zaXRpb24ueDtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnkgPSByZXNwYXduUG9zaXRpb24ueTtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyLmlzRGVhZCA9IHRydWU7XG4gICAgICAgIC8vIGtub2NrIHBsYXllciBvbiBoaXMvaGVyIHNpZGVcbiAgICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLnksIHNldHRpbmdzLnNjYWxlLngpO1xuICAgICAgICAvLyBUT0RPOiBkZXRhbmdsZSB0aGlzXG4gICAgICAgIHZhciBjaGVja0ZvckdhbWVPdmVyID0gcmVxdWlyZSgnLi9nYW1lLmpzJyk7XG4gICAgICAgIGNoZWNrRm9yR2FtZU92ZXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgdmFyIHBsYXllciA9IGdhbWUuYWRkLnNwcml0ZShzZXR0aW5ncy5wb3NpdGlvbi54LCBzZXR0aW5ncy5wb3NpdGlvbi55LCBzZXR0aW5ncy5jb2xvcik7XG4gIHBsYXllci5uYW1lID0gc2V0dGluZ3MubmFtZTtcbiAgcGxheWVyLm9yaWVudGF0aW9uID0gc2V0dGluZ3Mub3JpZW50YXRpb247XG4gIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBzZXR0aW5ncy5zY2FsZS55KTsgLy8gVE9ETzogYWRkIGdpYW50IG1vZGVcblxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZShwbGF5ZXIpO1xuICBwbGF5ZXIuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICBwbGF5ZXIuYm9keS5ib3VuY2UueSA9IDAuMjsgLy8gVE9ETzogYWxsb3cgYm91bmNlIGNvbmZpZ3VyYXRpb25cbiAgcGxheWVyLmJvZHkuZ3Jhdml0eS55ID0gMzgwOyAvLyBUT0RPOiBhbGxvdyBncmF2aXR5IGNvbmZpZ3VyYXRpb25cblxuICBwbGF5ZXIudXBXYXNEb3duID0gZmFsc2U7IC8vIHRyYWNrIGlucHV0IGNoYW5nZSBmb3IgdmFyaWFibGUganVtcCBoZWlnaHRcbiAgcGxheWVyLmlzUm9sbGluZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNEdWNraW5nID0gZmFsc2U7XG4gIHBsYXllci5pc0F0dGFja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNEZWFkID0gZmFsc2U7XG4gIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuICBwbGF5ZXIuYWN0aW9ucyA9IGFjdGlvbnM7XG5cbiAgLy8gdHJhY2sgaGVhbHRoXG4gIHBsYXllci5ocCA9IHBsYXllci5tYXhIcCA9IDY7IC8vIFRPRE86IGFsbG93IHNldHRpbmcgY3VzdG9tIGhwIGFtb3VudCBmb3IgZWFjaCBwbGF5ZXJcbiAgcGxheWVyLmhlYXJ0cyA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnaGVhcnRzJyk7XG4gIHZhciBoZWFydHNXaWR0aCA9IHBsYXllci5oZWFydHMud2lkdGg7XG4gIHBsYXllci5oZWFydHMuc2V0U2NhbGVNaW5NYXgoMSwgMSk7IC8vIHByZXZlbnQgaGVhcnRzIHNjYWxpbmcgdy8gcGxheWVyXG4gIHZhciBib2IgPSBwbGF5ZXIuaGVhcnRzLmFuaW1hdGlvbnMuYWRkKCdib2InLCBbMCwxLDIsMV0sIDMsIHRydWUpOyAvLyBuYW1lLCBmcmFtZXMsIGZyYW1lcmF0ZSwgbG9vcFxuICBwbGF5ZXIuaGVhcnRzLmFuaW1hdGlvbnMucGxheSgnYm9iJyk7XG4gIHBsYXllci5hZGRDaGlsZChwbGF5ZXIuaGVhcnRzKTtcbiAgYWN0aW9ucy5vcmllbnRIZWFydHMocGxheWVyLm9yaWVudGF0aW9uKTtcblxuICAvLyBwaGFzZXIgYXBwYXJlbnRseSBhdXRvbWF0aWNhbGx5IGNhbGxzIGFueSBmdW5jdGlvbiBuYW1lZCB1cGRhdGUgYXR0YWNoZWQgdG8gYSBzcHJpdGUhXG4gIHBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBraWxsIHBsYXllciBpZiBoZSBmYWxscyBvZmYgdGhlIHNjcmVlblxuICAgIGlmIChwbGF5ZXIucG9zaXRpb24ueSA+IDE4MCAmJiBwbGF5ZXIuaHAgIT09IDApIHsgLy8gVE9ETzogaG93IHRvIGFjY2VzcyBuYXRpdmUgaGVpZ2h0IGZyb20gZ2FtZS5qcz9cbiAgICAgIGFjdGlvbnMudGFrZURhbWFnZSgyKTtcbiAgICB9XG5cbiAgICB2YXIgaW5wdXQgPSB7XG4gICAgICBsZWZ0OiAgIChrZXlzLmxlZnQuaXNEb3duICYmICFrZXlzLnJpZ2h0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSAmJiAhZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1JJR0hUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA8IC0wLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPCAtMC4xLFxuICAgICAgcmlnaHQ6ICAoa2V5cy5yaWdodC5pc0Rvd24gJiYgIWtleXMubGVmdC5pc0Rvd24pIHx8XG4gICAgICAgICAgICAgIChnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfTEVGVCkpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWCkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPiAwLjEsXG4gICAgICB1cDogICAgIGtleXMudXAuaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9VUCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9BKSxcbiAgICAgIGRvd246ICAga2V5cy5kb3duLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfRE9XTikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9ZKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9ZKSA+IDAuMSxcbiAgICAgIGF0dGFjazoga2V5cy5hdHRhY2suaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9YKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0IpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0xFRlRfVFJJR0dFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX1RSSUdHRVIpLFxuICAgIH07XG5cbiAgICBpZiAoaW5wdXQubGVmdCkge1xuICAgICAgYWN0aW9ucy5ydW4oJ2xlZnQnKTtcbiAgICB9IGVsc2UgaWYgKGlucHV0LnJpZ2h0KSB7XG4gICAgICBhY3Rpb25zLnJ1bigncmlnaHQnKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgIXBsYXllci5pc1JvbGxpbmcpIHtcbiAgICAgIC8vIGFwcGx5IGZyaWN0aW9uXG4gICAgICBpZiAoTWF0aC5hYnMocGxheWVyLmJvZHkudmVsb2NpdHkueCkgPCA0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKj0gMC41OyAvLyBxdWlja2x5IGJyaW5nIHNsb3ctbW92aW5nIHBsYXllcnMgdG8gYSBzdG9wXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPiAwKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gNDtcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IDApIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCArPSA0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbnB1dC51cCkge1xuICAgICAgcGxheWVyLnVwV2FzRG93biA9IHRydWU7XG4gICAgICBhY3Rpb25zLmp1bXAoKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci51cFdhc0Rvd24pIHtcbiAgICAgIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTtcbiAgICAgIGFjdGlvbnMuZGFtcGVuSnVtcCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5kb3duKSB7XG4gICAgICBhY3Rpb25zLmR1Y2soKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgIGFjdGlvbnMuc3RhbmQoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuYXR0YWNrKSB7XG4gICAgICBhY3Rpb25zLmF0dGFjaygpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gcGxheWVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQbGF5ZXI7XG4iLCJ2YXIgc2Z4ID0gKGZ1bmN0aW9uIHNmeCgpIHtcbiAgUG9seXN5bnRoID0gcmVxdWlyZSgnc3VicG9seScpO1xuXG4gIHZhciBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcblxuICB2YXIgcHVsc2UgPSBuZXcgUG9seXN5bnRoKGF1ZGlvQ3R4LCB7XG4gICAgd2F2ZWZvcm06ICdzcXVhcmUnLFxuICAgIHJlbGVhc2U6IDAuMSxcbiAgICBudW1Wb2ljZXM6IDRcbiAgfSk7XG4gIFxuICBmdW5jdGlvbiBnZXROb3codm9pY2UpIHtcbiAgICB2YXIgbm93ID0gdm9pY2UuYXVkaW9DdHguY3VycmVudFRpbWU7XG4vLyAgICB2b2ljZS5hbXAuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMobm93KTtcbi8vICAgIHZvaWNlLmFtcC5nYWluLnNldFZhbHVlQXRUaW1lKHZvaWNlLmFtcC5nYWluLnZhbHVlLCBub3cpO1xuICAgIHJldHVybiBub3c7XG4gIH07XG4gIFxuICB2YXIganVtcFRpbWVvdXQsIGF0dGFja1RpbWVvdXQ7XG4gIHZhciBkaWVUaW1lb3V0cyA9IFtdO1xuXG4gIHZhciBzb3VuZEVmZmVjdHMgPSB7XG4gICAganVtcDogZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhclRpbWVvdXQoanVtcFRpbWVvdXQpO1xuICAgICAgXG4gICAgICB2YXIgdm9pY2UgPSBwdWxzZS52b2ljZXNbMF07XG4gICAgICB2YXIgZHVyYXRpb24gPSAwLjE7IC8vIGluIHNlY29uZHNcbiAgICAgIFxuICAgICAgdm9pY2UucGl0Y2goNDQwKTtcbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG5cbiAgICAgIHZhciBub3cgPSBnZXROb3codm9pY2UpO1xuICAgICAgdm9pY2Uub3NjLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSg4ODAsIG5vdyArIGR1cmF0aW9uKTtcbiAgICAgIGp1bXBUaW1lb3V0ID0gc2V0VGltZW91dCh2b2ljZS5zdG9wLCBkdXJhdGlvbiAqIDEwMDApO1xuICAgIH0sXG5cbiAgICBhdHRhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGF0dGFja1RpbWVvdXQpO1xuICAgICAgXG4gICAgICB2YXIgdm9pY2UgPSBwdWxzZS52b2ljZXNbMV07XG4gICAgICB2YXIgZHVyYXRpb24gPSAwLjE7IC8vIGluIHNlY29uZHNcbiAgICAgIFxuICAgICAgdm9pY2UucGl0Y2goODgwKTtcbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG5cbiAgICAgIHZhciBub3cgPSBnZXROb3codm9pY2UpO1xuICAgICAgdm9pY2Uub3NjLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgwLCBub3cgKyBkdXJhdGlvbik7XG4gICAgICBhdHRhY2tUaW1lb3V0ID0gc2V0VGltZW91dCh2b2ljZS5zdG9wLCBkdXJhdGlvbiAqIDEwMDApO1xuICAgIH0sXG4gICAgXG4gICAgYm91bmNlOiBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyVGltZW91dChhdHRhY2tUaW1lb3V0KTtcbiAgICAgIFxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzJdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMC4xOyAvLyBpbiBzZWNvbmRzXG4gICAgICBcbiAgICAgIHZvaWNlLnBpdGNoKDQ0MCk7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuXG4gICAgICB2YXIgbm93ID0gZ2V0Tm93KHZvaWNlKTtcbiAgICAgIHZvaWNlLm9zYy5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMjIwLCBub3cgKyBkdXJhdGlvbiAvIDIpO1xuICAgICAgdm9pY2Uub3NjLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSg2NjAsIG5vdyArIGR1cmF0aW9uKTtcbiAgICAgIGF0dGFja1RpbWVvdXQgPSBzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogMTAwMCk7XG4gICAgfSxcbiAgICBcbiAgICBkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgd2hpbGUgKGRpZVRpbWVvdXRzLmxlbmd0aCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoZGllVGltZW91dHMucG9wKCkpO1xuICAgICAgfVxuICAgICAgXG4gICAgICB2YXIgdm9pY2UgPSBwdWxzZS52b2ljZXNbM107XG4gICAgICB2YXIgcGl0Y2hlcyA9IFs0NDAsIDIyMCwgMTEwXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDEwMDtcblxuICAgICAgdm9pY2Uuc3RhcnQoKTtcbiAgICAgIFxuICAgICAgcGl0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uKHBpdGNoLCBpKSB7XG4gICAgICAgIGRpZVRpbWVvdXRzLnB1c2goc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2b2ljZS5waXRjaChwaXRjaCk7XG4gICAgICAgIH0sIGkgKiBkdXJhdGlvbikpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGRpZVRpbWVvdXRzLnB1c2goc2V0VGltZW91dCh2b2ljZS5zdG9wLCBkdXJhdGlvbiAqIHBpdGNoZXMubGVuZ3RoKSk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHNvdW5kRWZmZWN0cztcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2Z4O1xuIiwidmFyIHV0aWxzID0ge1xuICAvLyBmcm9tIHVuZGVyc2NvcmVcbiAgZGVib3VuY2U6IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuXHR2YXIgdGltZW91dDtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0aWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0fTtcblx0XHR2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcblx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzOyJdfQ==
