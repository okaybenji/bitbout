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
    text.setText(alivePlayers[0] + '  wins!\nClick  to  restart');
    text.visible = true;
    game.input.onDown.addOnce(restart, this); // restart game on mouse click
  }
};

var preload = function preload() {
  var utils = require('./utils.js');
  sfx = require('./sfx.js');

  resize();
  window.onresize = utils.debounce(resize, 100);

  // color blocks
  game.load.image('clear', 'images/clear.png');
  game.load.image('white', 'images/white.png');
  game.load.image('pink', 'images/pink.png');
  game.load.image('yellow', 'images/yellow.png');
  game.load.image('orange', 'images/orange.png');
  game.load.image('purple', 'images/purple.png');

  game.load.spritesheet('hearts', 'images/hearts.png', 9, 5); // player health

  // background images
  game.load.image('bg', 'images/bg.png');
  game.load.image('suns', 'images/suns.png');
  game.load.image('clouds', 'images/clouds.png');
  game.load.image('platforms', 'images/platforms.png');
  game.load.image('platformsFg', 'images/platformsFg.png'); // grass to go in front of players
};

var create = function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.world.setBounds(0, -nativeHeight, nativeWidth, nativeHeight * 3); // allow anything as tall as world to fall off-screen up or down

  // bg
  game.stage.backgroundColor = 0x4DD8FF;
  game.add.tileSprite(0, 0, 320, 180, 'suns');
  clouds = game.add.tileSprite(0, 0, 320, 180, 'clouds');
  // scroll the clouds
  game.time.events.loop(Phaser.Timer.QUARTER, function() {
    clouds.tilePosition.x -= 1;
  }, this);

  var buildPlatforms = require('./map.js');
  platforms = buildPlatforms(game);
  game.add.tileSprite(0, 0, 320, 180, 'platforms');
  

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
    name: 'Orange',
    color: 'orange',
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
    name: 'Pink',
    color: 'pink',
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
  
  game.add.tileSprite(0, 0, 320, 180, 'platformsFg');
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
      sfx.bounce();

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
      sfx.bounce();

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
    var platform = platforms.create(position[0], position[1], 'clear'); // set to pink for debugging
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

  var audioCtx;
  if (typeof AudioContext !== "undefined") {
    audioCtx = new AudioContext();
  } else {
    audioCtx = new webkitAudioContext();
  }

  var pulse = new Polysynth(audioCtx, {
    waveform: 'square',
    release: 0.01,
    numVoices: 4
  });
  
  function getNow(voice) {
    var now = voice.audioCtx.currentTime;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc3VibW9uby9zdWJtb25vLmpzIiwibm9kZV9tb2R1bGVzL3N1YnBvbHkvc3VicG9seS5qcyIsInNjcmlwdHMvZ2FtZS5qcyIsInNjcmlwdHMvbWFwLmpzIiwic2NyaXB0cy9wbGF5ZXIuanMiLCJzY3JpcHRzL3NmeC5qcyIsInNjcmlwdHMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBNb25vc3ludGggPSBmdW5jdGlvbiBNb25vc3ludGgoYXVkaW9DdHgsIGNvbmZpZykge1xuICB2YXIgc3ludGg7XG4gIHZhciBTeW50aCA9IGZ1bmN0aW9uIFN5bnRoKCkge1xuICAgIHN5bnRoID0gdGhpcztcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uZmlnLmN1dG9mZiA9IGNvbmZpZy5jdXRvZmYgfHwge307XG5cbiAgICBzeW50aC5hdWRpb0N0eCA9IGF1ZGlvQ3R4LFxuICAgIHN5bnRoLmFtcCAgICAgID0gYXVkaW9DdHguY3JlYXRlR2FpbigpLFxuICAgIHN5bnRoLmZpbHRlciAgID0gYXVkaW9DdHguY3JlYXRlQmlxdWFkRmlsdGVyKCksXG4gICAgc3ludGgub3NjICAgICAgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgc3ludGgucGFuICAgICAgPSBhdWRpb0N0eC5jcmVhdGVQYW5uZXIoKSxcblxuICAgIHN5bnRoLm1heEdhaW4gID0gY29uZmlnLm1heEdhaW4gIHx8IDAuOSwgLy8gb3V0IG9mIDFcbiAgICBzeW50aC5hdHRhY2sgICA9IGNvbmZpZy5hdHRhY2sgICB8fCAwLjEsIC8vIGluIHNlY29uZHNcbiAgICBzeW50aC5kZWNheSAgICA9IGNvbmZpZy5kZWNheSAgICB8fCAwLjAsIC8vIGluIHNlY29uZHNcbiAgICBzeW50aC5zdXN0YWluICA9IGNvbmZpZy5zdXN0YWluICB8fCAxLjAsIC8vIG91dCBvZiAxXG4gICAgc3ludGgucmVsZWFzZSAgPSBjb25maWcucmVsZWFzZSAgfHwgMC44LCAvLyBpbiBzZWNvbmRzXG5cbiAgICAvLyBsb3ctcGFzcyBmaWx0ZXJcbiAgICBzeW50aC5jdXRvZmYgICAgICAgICAgICAgID0gc3ludGguZmlsdGVyLmZyZXF1ZW5jeTtcbiAgICBzeW50aC5jdXRvZmYubWF4RnJlcXVlbmN5ID0gY29uZmlnLmN1dG9mZi5tYXhGcmVxdWVuY3kgfHwgNzUwMDsgLy8gaW4gaGVydHpcbiAgICBzeW50aC5jdXRvZmYuYXR0YWNrICAgICAgID0gY29uZmlnLmN1dG9mZi5hdHRhY2sgICAgICAgfHwgMC4xOyAvLyBpbiBzZWNvbmRzXG4gICAgc3ludGguY3V0b2ZmLmRlY2F5ICAgICAgICA9IGNvbmZpZy5jdXRvZmYuZGVjYXkgICAgICAgIHx8IDIuNTsgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLmN1dG9mZi5zdXN0YWluICAgICAgPSBjb25maWcuY3V0b2ZmLnN1c3RhaW4gICAgICB8fCAwLjI7IC8vIG91dCBvZiAxXG4gICAgXG4gICAgc3ludGguYW1wLmdhaW4udmFsdWUgPSAwO1xuICAgIHN5bnRoLmZpbHRlci50eXBlID0gJ2xvd3Bhc3MnO1xuICAgIHN5bnRoLmZpbHRlci5jb25uZWN0KHN5bnRoLmFtcCk7XG4gICAgc3ludGguYW1wLmNvbm5lY3QoYXVkaW9DdHguZGVzdGluYXRpb24pO1xuICAgIHN5bnRoLnBhbi5wYW5uaW5nTW9kZWwgPSAnZXF1YWxwb3dlcic7XG4gICAgc3ludGgucGFuLnNldFBvc2l0aW9uKDAsIDAsIDEpOyAvLyBzdGFydCB3aXRoIHN0ZXJlbyBpbWFnZSBjZW50ZXJlZFxuICAgIHN5bnRoLm9zYy5jb25uZWN0KHN5bnRoLnBhbik7XG4gICAgc3ludGgucGFuLmNvbm5lY3Qoc3ludGguZmlsdGVyKTtcbiAgICBzeW50aC5vc2Muc3RhcnQoMCk7XG4gICAgXG4gICAgc3ludGgud2F2ZWZvcm0oY29uZmlnLndhdmVmb3JtIHx8ICdzaW5lJyk7XG4gICAgc3ludGgucGl0Y2goY29uZmlnLnBpdGNoIHx8IDQ0MCk7XG5cbiAgICByZXR1cm4gc3ludGg7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0Tm93KCkge1xuICAgIHZhciBub3cgPSBzeW50aC5hdWRpb0N0eC5jdXJyZW50VGltZTtcbiAgICBzeW50aC5hbXAuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMobm93KTtcbiAgICBzeW50aC5hbXAuZ2Fpbi5zZXRWYWx1ZUF0VGltZShzeW50aC5hbXAuZ2Fpbi52YWx1ZSwgbm93KTtcbiAgICByZXR1cm4gbm93O1xuICB9O1xuICBcbiAgU3ludGgucHJvdG90eXBlLnBpdGNoID0gZnVuY3Rpb24gcGl0Y2gobmV3UGl0Y2gpIHtcbiAgICBpZiAobmV3UGl0Y2gpIHtcbiAgICAgIHZhciBub3cgPSBzeW50aC5hdWRpb0N0eC5jdXJyZW50VGltZTtcbiAgICAgIHN5bnRoLm9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUobmV3UGl0Y2gsIG5vdyk7XG4gICAgfVxuICAgIHJldHVybiBzeW50aC5vc2MuZnJlcXVlbmN5LnZhbHVlO1xuICB9O1xuXG4gIFN5bnRoLnByb3RvdHlwZS53YXZlZm9ybSA9IGZ1bmN0aW9uIHdhdmVmb3JtKG5ld1dhdmVmb3JtKSB7XG4gICAgaWYgKG5ld1dhdmVmb3JtKSB7XG4gICAgICBzeW50aC5vc2MudHlwZSA9IG5ld1dhdmVmb3JtO1xuICAgIH1cbiAgICByZXR1cm4gc3ludGgub3NjLnR5cGU7XG4gIH07XG5cbiAgLy8gYXBwbHkgYXR0YWNrLCBkZWNheSwgc3VzdGFpbiBlbnZlbG9wZVxuICBTeW50aC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiBzdGFydFN5bnRoKCkge1xuICAgIHZhciBhdGsgID0gcGFyc2VGbG9hdChzeW50aC5hdHRhY2spO1xuICAgIHZhciBkZWMgID0gcGFyc2VGbG9hdChzeW50aC5kZWNheSk7XG4gICAgdmFyIGNBdGsgPSBwYXJzZUZsb2F0KHN5bnRoLmN1dG9mZi5hdHRhY2spO1xuICAgIHZhciBjRGVjID0gcGFyc2VGbG9hdChzeW50aC5jdXRvZmYuZGVjYXkpO1xuICAgIHZhciBub3cgID0gZ2V0Tm93KCk7XG4gICAgc3ludGguY3V0b2ZmLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyhub3cpO1xuICAgIHN5bnRoLmN1dG9mZi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShzeW50aC5jdXRvZmYudmFsdWUsIG5vdyk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi5tYXhGcmVxdWVuY3ksIG5vdyArIGNBdGspO1xuICAgIHN5bnRoLmN1dG9mZi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShzeW50aC5jdXRvZmYuc3VzdGFpbiAqIHN5bnRoLmN1dG9mZi5tYXhGcmVxdWVuY3ksIG5vdyArIGNBdGsgKyBjRGVjKTtcbiAgICBzeW50aC5hbXAuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShzeW50aC5tYXhHYWluLCBub3cgKyBhdGspO1xuICAgIHN5bnRoLmFtcC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLnN1c3RhaW4gKiBzeW50aC5tYXhHYWluLCBub3cgKyBhdGsgKyBkZWMpO1xuICB9O1xuXG4gIC8vIGFwcGx5IHJlbGVhc2UgZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wU3ludGgoKSB7XG4gICAgdmFyIHJlbCA9IHBhcnNlRmxvYXQoc3ludGgucmVsZWFzZSk7XG4gICAgdmFyIG5vdyA9IGdldE5vdygpO1xuICAgIHN5bnRoLmFtcC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAsIG5vdyArIHJlbCk7XG4gIH07XG5cbiAgcmV0dXJuIG5ldyBTeW50aCgpO1xufTtcblxuLy8gbnBtIHN1cHBvcnRcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gTW9ub3N5bnRoO1xufVxuIiwiLy8gbnBtIHN1cHBvcnRcbmlmICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgdmFyIE1vbm9zeW50aCA9IHJlcXVpcmUoJ3N1Ym1vbm8nKTtcbn1cblxudmFyIFBvbHlzeW50aCA9IGZ1bmN0aW9uIFBvbHlzeW50aChhdWRpb0N0eCwgY29uZmlnKSB7XG4gIHZhciBzeW50aDtcbiAgdmFyIFN5bnRoID0gZnVuY3Rpb24gU3ludGgoKSB7XG4gICAgc3ludGggPSB0aGlzO1xuICAgIHN5bnRoLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XG4gICAgc3ludGgudm9pY2VzID0gW107XG4gICAgXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGNvbmZpZy5jdXRvZmYgPSBjb25maWcuY3V0b2ZmIHx8IHt9O1xuXG5cbiAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBjb25maWcubnVtVm9pY2VzIHx8IDE2OyBpIDwgaWk7IGkrKykge1xuICAgICAgc3ludGgudm9pY2VzLnB1c2gobmV3IE1vbm9zeW50aChhdWRpb0N0eCwgY29uZmlnKSk7XG4gICAgfVxuXG4gICAgc3ludGguc3RlcmVvV2lkdGggPSBjb25maWcuc3RlcmVvV2lkdGggfHwgMC41OyAvLyBvdXQgb2YgMVxuICAgIHN5bnRoLndpZHRoKHN5bnRoLnN0ZXJlb1dpZHRoKTtcblxuICAgIHJldHVybiBzeW50aDtcbiAgfTtcblxuICAvLyBhcHBseSBhdHRhY2ssIGRlY2F5LCBzdXN0YWluIGVudmVsb3BlXG4gIFN5bnRoLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIHN0YXJ0U3ludGgoKSB7XG4gICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc3RhcnRWb2ljZSh2b2ljZSkge1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBhcHBseSByZWxlYXNlIGVudmVsb3BlXG4gIFN5bnRoLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gc3RvcFN5bnRoKCkge1xuICAgIHN5bnRoLnZvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIHN0b3BWb2ljZSh2b2ljZSkge1xuICAgICAgdm9pY2Uuc3RvcCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIGdldC9zZXQgc3ludGggc3RlcmVvIHdpZHRoXG4gIFN5bnRoLnByb3RvdHlwZS53aWR0aCA9IGZ1bmN0aW9uIHdpZHRoKG5ld1dpZHRoKSB7XG4gICAgaWYgKHN5bnRoLnZvaWNlcy5sZW5ndGggPiAxICYmIG5ld1dpZHRoKSB7XG4gICAgICBzeW50aC5zdGVyZW9XaWR0aCA9IG5ld1dpZHRoO1xuICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gcGFuVm9pY2Uodm9pY2UsIGkpIHtcbiAgICAgICAgdmFyIHNwcmVhZCA9IDEvKHN5bnRoLnZvaWNlcy5sZW5ndGggLSAxKTtcbiAgICAgICAgdmFyIHhQb3MgPSBzcHJlYWQgKiBpICogc3ludGguc3RlcmVvV2lkdGg7XG4gICAgICAgIHZhciB6UG9zID0gMSAtIE1hdGguYWJzKHhQb3MpO1xuICAgICAgICB2b2ljZS5wYW4uc2V0UG9zaXRpb24oeFBvcywgMCwgelBvcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3ludGguc3RlcmVvV2lkdGg7XG4gIH07XG5cbiAgLy8gY29udmVuaWVuY2UgbWV0aG9kcyBmb3IgY2hhbmdpbmcgdmFsdWVzIG9mIGFsbCBNb25vc3ludGhzJyBwcm9wZXJ0aWVzIGF0IG9uY2VcbiAgKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcnMoKSB7XG4gICAgdmFyIG1vbm9zeW50aFByb3BlcnRpZXMgPSBbJ21heEdhaW4nLCAnYXR0YWNrJywgJ2RlY2F5JywgJ3N1c3RhaW4nLCAncmVsZWFzZSddO1xuICAgIHZhciBtb25vc3ludGhDdXRvZmZQcm9wZXJ0aWVzID0gWydtYXhGcmVxdWVuY3knLCAnYXR0YWNrJywgJ2RlY2F5JywgJ3N1c3RhaW4nXTtcblxuICAgIG1vbm9zeW50aFByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiBjcmVhdGVTZXR0ZXIocHJvcGVydHkpIHtcbiAgICAgIFN5bnRoLnByb3RvdHlwZVtwcm9wZXJ0eV0gPSBmdW5jdGlvbiBzZXRWYWx1ZXMobmV3VmFsdWUpIHtcbiAgICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc2V0VmFsdWUodm9pY2UpIHtcbiAgICAgICAgICB2b2ljZVtwcm9wZXJ0eV0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgU3ludGgucHJvdG90eXBlLmN1dG9mZiA9IHt9O1xuICAgIG1vbm9zeW50aEN1dG9mZlByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiBjcmVhdGVTZXR0ZXIocHJvcGVydHkpIHtcbiAgICAgIFN5bnRoLnByb3RvdHlwZS5jdXRvZmZbcHJvcGVydHldID0gZnVuY3Rpb24gc2V0VmFsdWVzKG5ld1ZhbHVlKSB7XG4gICAgICAgIHN5bnRoLnZvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIHNldFZhbHVlKHZvaWNlKSB7XG4gICAgICAgICAgdm9pY2UuY3V0b2ZmW3Byb3BlcnR5XSA9IG5ld1ZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBTeW50aC5wcm90b3R5cGUud2F2ZWZvcm0gPSBmdW5jdGlvbiB3YXZlZm9ybShuZXdXYXZlZm9ybSkge1xuICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gd2F2ZWZvcm0odm9pY2UpIHtcbiAgICAgICAgdm9pY2Uud2F2ZWZvcm0obmV3V2F2ZWZvcm0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIFN5bnRoLnByb3RvdHlwZS5waXRjaCA9IGZ1bmN0aW9uIHBpdGNoKG5ld1BpdGNoKSB7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBwaXRjaCh2b2ljZSkge1xuICAgICAgICB2b2ljZS5waXRjaChuZXdQaXRjaCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KSgpO1xuXG4gIHJldHVybiBuZXcgU3ludGg7XG59O1xuXG4vLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBQb2x5c3ludGg7XG59XG4iLCJ2YXIgbmF0aXZlV2lkdGggPSAzMjA7XG52YXIgbmF0aXZlSGVpZ2h0ID0gMTgwO1xudmFyIHBsYXRmb3JtcywgcGxheWVycywgdGV4dCwgc2Z4O1xuXG52YXIgcmVzaXplID0gZnVuY3Rpb24gcmVzaXplKCkge1xuICBkb2N1bWVudC5ib2R5LnN0eWxlLnpvb20gPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG5hdGl2ZVdpZHRoO1xufTtcblxudmFyIGNoZWNrRm9yR2FtZU92ZXIgPSBmdW5jdGlvbiBjaGVja0ZvckdhbWVPdmVyKCkge1xuICB2YXIgYWxpdmVQbGF5ZXJzID0gW107XG4gIHBsYXllcnMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihwbGF5ZXIpIHtcbiAgICBpZiAoIXBsYXllci5pc0RlYWQpIHtcbiAgICAgIGFsaXZlUGxheWVycy5wdXNoKHBsYXllci5uYW1lKTtcbiAgICB9XG4gIH0pO1xuICBpZiAoYWxpdmVQbGF5ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgIHRleHQuc2V0VGV4dChhbGl2ZVBsYXllcnNbMF0gKyAnICB3aW5zIVxcbkNsaWNrICB0byAgcmVzdGFydCcpO1xuICAgIHRleHQudmlzaWJsZSA9IHRydWU7XG4gICAgZ2FtZS5pbnB1dC5vbkRvd24uYWRkT25jZShyZXN0YXJ0LCB0aGlzKTsgLy8gcmVzdGFydCBnYW1lIG9uIG1vdXNlIGNsaWNrXG4gIH1cbn07XG5cbnZhciBwcmVsb2FkID0gZnVuY3Rpb24gcHJlbG9hZCgpIHtcbiAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xuICBzZnggPSByZXF1aXJlKCcuL3NmeC5qcycpO1xuXG4gIHJlc2l6ZSgpO1xuICB3aW5kb3cub25yZXNpemUgPSB1dGlscy5kZWJvdW5jZShyZXNpemUsIDEwMCk7XG5cbiAgLy8gY29sb3IgYmxvY2tzXG4gIGdhbWUubG9hZC5pbWFnZSgnY2xlYXInLCAnaW1hZ2VzL2NsZWFyLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3doaXRlJywgJ2ltYWdlcy93aGl0ZS5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdwaW5rJywgJ2ltYWdlcy9waW5rLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3llbGxvdycsICdpbWFnZXMveWVsbG93LnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ29yYW5nZScsICdpbWFnZXMvb3JhbmdlLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3B1cnBsZScsICdpbWFnZXMvcHVycGxlLnBuZycpO1xuXG4gIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnaGVhcnRzJywgJ2ltYWdlcy9oZWFydHMucG5nJywgOSwgNSk7IC8vIHBsYXllciBoZWFsdGhcblxuICAvLyBiYWNrZ3JvdW5kIGltYWdlc1xuICBnYW1lLmxvYWQuaW1hZ2UoJ2JnJywgJ2ltYWdlcy9iZy5wbmcnKTtcbiAgZ2FtZS5sb2FkLmltYWdlKCdzdW5zJywgJ2ltYWdlcy9zdW5zLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ2Nsb3VkcycsICdpbWFnZXMvY2xvdWRzLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3BsYXRmb3JtcycsICdpbWFnZXMvcGxhdGZvcm1zLnBuZycpO1xuICBnYW1lLmxvYWQuaW1hZ2UoJ3BsYXRmb3Jtc0ZnJywgJ2ltYWdlcy9wbGF0Zm9ybXNGZy5wbmcnKTsgLy8gZ3Jhc3MgdG8gZ28gaW4gZnJvbnQgb2YgcGxheWVyc1xufTtcblxudmFyIGNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgZ2FtZS5waHlzaWNzLnN0YXJ0U3lzdGVtKFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gIGdhbWUud29ybGQuc2V0Qm91bmRzKDAsIC1uYXRpdmVIZWlnaHQsIG5hdGl2ZVdpZHRoLCBuYXRpdmVIZWlnaHQgKiAzKTsgLy8gYWxsb3cgYW55dGhpbmcgYXMgdGFsbCBhcyB3b3JsZCB0byBmYWxsIG9mZi1zY3JlZW4gdXAgb3IgZG93blxuXG4gIC8vIGJnXG4gIGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gMHg0REQ4RkY7XG4gIGdhbWUuYWRkLnRpbGVTcHJpdGUoMCwgMCwgMzIwLCAxODAsICdzdW5zJyk7XG4gIGNsb3VkcyA9IGdhbWUuYWRkLnRpbGVTcHJpdGUoMCwgMCwgMzIwLCAxODAsICdjbG91ZHMnKTtcbiAgLy8gc2Nyb2xsIHRoZSBjbG91ZHNcbiAgZ2FtZS50aW1lLmV2ZW50cy5sb29wKFBoYXNlci5UaW1lci5RVUFSVEVSLCBmdW5jdGlvbigpIHtcbiAgICBjbG91ZHMudGlsZVBvc2l0aW9uLnggLT0gMTtcbiAgfSwgdGhpcyk7XG5cbiAgdmFyIGJ1aWxkUGxhdGZvcm1zID0gcmVxdWlyZSgnLi9tYXAuanMnKTtcbiAgcGxhdGZvcm1zID0gYnVpbGRQbGF0Zm9ybXMoZ2FtZSk7XG4gIGdhbWUuYWRkLnRpbGVTcHJpdGUoMCwgMCwgMzIwLCAxODAsICdwbGF0Zm9ybXMnKTtcbiAgXG5cbiAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG5cbiAgLy8gVE9ETzogd2h5IGlzIHRoaXMgZm9udCBzdGlsbCBhbnRpLWFsaWFzZWQ/XG4gIHZhciBmb250U3R5bGUgPSB7IGZvbnQ6IFwiMTJweCBIZWxsb3ZldGljYVwiLCBmaWxsOiBcIiNlZWVcIiwgYWxpZ246IFwiY2VudGVyXCIsIGJvdW5kc0FsaWduSDogXCJjZW50ZXJcIiwgYm91bmRzQWxpZ25WOiBcIm1pZGRsZVwiIH07XG4gIHRleHQgPSBnYW1lLmFkZC50ZXh0KDAsIDAsICcnLCBmb250U3R5bGUpO1xuICB0ZXh0LnNldFRleHRCb3VuZHMoMCwgMCwgbmF0aXZlV2lkdGgsIG5hdGl2ZUhlaWdodCk7XG5cbiAgcGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIHJlc3RhcnQoKTtcbn07XG5cbnZhciByZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHRleHQudmlzaWJsZSA9IGZhbHNlO1xuXG4gIHdoaWxlIChwbGF5ZXJzLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICBwbGF5ZXJzLmNoaWxkcmVuWzBdLmRlc3Ryb3koKTtcbiAgfVxuXG4gIHZhciBjcmVhdGVQbGF5ZXIgPSByZXF1aXJlKCcuL3BsYXllci5qcycpO1xuXG4gIHZhciBwbGF5ZXIxID0ge1xuICAgIG5hbWU6ICdPcmFuZ2UnLFxuICAgIGNvbG9yOiAnb3JhbmdlJyxcbiAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgeDogNzIsIHk6IDQ0XG4gICAgfSxcbiAgfTtcblxuICB2YXIgcGxheWVyMiA9IHtcbiAgICBuYW1lOiAnWWVsbG93JyxcbiAgICBjb2xvcjogJ3llbGxvdycsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDIsXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDI0OCwgeTogNDRcbiAgICB9LFxuICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gIH07XG5cbiAgdmFyIHBsYXllcjMgPSB7XG4gICAgbmFtZTogJ1BpbmsnLFxuICAgIGNvbG9yOiAncGluaycsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCcsIGF0dGFjazogJ1EnXG4gICAgfSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgeDogNzIsIHk6IDEzNlxuICAgIH0sXG4gIH07XG5cbiAgdmFyIHBsYXllcjQgPSB7XG4gICAgbmFtZTogJ1B1cnBsZScsXG4gICAgY29sb3I6ICdwdXJwbGUnLFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LFxuICAgIGtleXM6IHtcbiAgICAgIHVwOiAnSScsIGRvd246ICdLJywgbGVmdDogJ0onLCByaWdodDogJ0wnLCBhdHRhY2s6ICdVJ1xuICAgIH0sXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDI0OCwgeTogMTM2XG4gICAgfSxcbiAgICBvcmllbnRhdGlvbjogJ2xlZnQnLFxuICB9O1xuXG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIxKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIyKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIzKSk7XG4gIHBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXI0KSk7XG4gIFxuICBnYW1lLmFkZC50aWxlU3ByaXRlKDAsIDAsIDMyMCwgMTgwLCAncGxhdGZvcm1zRmcnKTtcbn07XG5cbnZhciB1cGRhdGUgPSBmdW5jdGlvbiB1cGRhdGUoKSB7XG5cbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHBsYXllcnMsIHBsYXRmb3Jtcyk7XG4gIC8vIFRPRE86IGhvdyBkbyBpIGRvIHRoaXMgb24gdGhlIHBsYXllciBpdHNlbGYgd2l0aG91dCBhY2Nlc3MgdG8gcGxheWVycz8gb3Igc2hvdWxkIGkgYWRkIGEgZnRuIHRvIHBsYXllciBhbmQgc2V0IHRoYXQgYXMgdGhlIGNiP1xuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUocGxheWVycywgcGxheWVycywgZnVuY3Rpb24gaGFuZGxlUGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAgLyogbGV0J3Mgbm90IGtub2NrIGFueWJvZHkgYXJvdW5kIGlmIHNvbWV0aGluZydzIG9uIG9uZSBvZiB0aGVzZSBkdWRlcycvZHVkZXR0ZXMnIGhlYWRzLlxuICAgICBwcmV2ZW50cyBjYW5ub25iYWxsIGF0dGFja3MgYW5kIHRoZSBsaWtlLCBhbmQgYWxsb3dzIHN0YW5kaW5nIG9uIGhlYWRzLlxuICAgICBub3RlOiBzdGlsbCBuZWVkIHRvIGNvbGxpZGUgaW4gb3JkZXIgdG8gdGVzdCB0b3VjaGluZy51cCwgc28gZG9uJ3QgbW92ZSB0aGlzIHRvIGFsbG93UGxheWVyQ29sbGlzaW9uISAqL1xuICAgIGlmIChwbGF5ZXJBLmJvZHkudG91Y2hpbmcudXAgfHwgcGxheWVyQi5ib2R5LnRvdWNoaW5nLnVwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllcikge1xuICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICB9LCAxMDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJvdW5jZSgpIHtcbiAgICAgIHNmeC5ib3VuY2UoKTtcblxuICAgICAgdmFyIGJvdW5jZVZlbG9jaXR5ID0gMTAwO1xuICAgICAgdmFyIHZlbG9jaXR5QSA9IHZlbG9jaXR5QiA9IGJvdW5jZVZlbG9jaXR5O1xuICAgICAgaWYgKHBsYXllckEucG9zaXRpb24ueCA+IHBsYXllckIucG9zaXRpb24ueCkge1xuICAgICAgICB2ZWxvY2l0eUIgKj0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2ZWxvY2l0eUEgKj0gLTE7XG4gICAgICB9XG4gICAgICBwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QTtcbiAgICAgIHBsYXllckIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlCO1xuICAgICAgcGxheWVyQS5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICAgIHBsYXllckIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmxpbmcoKSB7XG4gICAgICBzZnguYm91bmNlKCk7XG5cbiAgICAgIHZhciBwbGF5ZXJUb0ZsaW5nO1xuICAgICAgdmFyIHBsYXllclRvTGVhdmU7XG4gICAgICBpZiAocGxheWVyQS5pc0R1Y2tpbmcpIHtcbiAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckI7XG4gICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJBO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckE7XG4gICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJCO1xuICAgICAgfVxuICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvRmxpbmcpO1xuICAgICAgdmFyIGZsaW5nWFZlbG9jaXR5ID0gMTUwO1xuICAgICAgaWYgKHBsYXllclRvRmxpbmcucG9zaXRpb24ueCA+IHBsYXllclRvTGVhdmUucG9zaXRpb24ueCkge1xuICAgICAgICBmbGluZ1hWZWxvY2l0eSAqPSAtMTtcbiAgICAgIH1cbiAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS54ID0gZmxpbmdYVmVsb2NpdHk7XG4gICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueSA9IC0xNTA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9wKCkge1xuICAgICAgc2Z4LmJvdW5jZSgpO1xuXG4gICAgICB2YXIgcGxheWVyVG9Qb3A7XG4gICAgICBpZiAocGxheWVyQS5pc1JvbGxpbmcpIHtcbiAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJCO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJBO1xuICAgICAgfVxuICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvUG9wKTtcbiAgICAgIHBsYXllclRvUG9wLmJvZHkudmVsb2NpdHkueSA9IC0xNTA7XG4gICAgfVxuXG4gICAgdmFyIGJvdGhSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgJiYgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgdmFyIGJvdGhTdGFuZGluZyA9ICFwbGF5ZXJBLmlzRHVja2luZyAmJiAhcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgdmFyIG5laXRoZXJSb2xsaW5nID0gIXBsYXllckEuaXNSb2xsaW5nICYmICFwbGF5ZXJCLmlzUm9sbGluZztcbiAgICB2YXIgZWl0aGVyRHVja2luZyA9IHBsYXllckEuaXNEdWNraW5nIHx8IHBsYXllckIuaXNEdWNraW5nO1xuICAgIHZhciBlaXRoZXJSdW5uaW5nID0gTWF0aC5hYnMocGxheWVyQS5ib2R5LnZlbG9jaXR5LngpID4gMjggfHwgTWF0aC5hYnMocGxheWVyQi5ib2R5LnZlbG9jaXR5LngpID49IDI4O1xuICAgIHZhciBlaXRoZXJSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgfHwgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgdmFyIGVpdGhlclN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nIHx8ICFwbGF5ZXJCLmlzRHVja2luZztcblxuICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgY2FzZSBib3RoUm9sbGluZyB8fCBib3RoU3RhbmRpbmc6XG4gICAgICAgIGJvdW5jZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgbmVpdGhlclJvbGxpbmcgJiYgZWl0aGVyUnVubmluZyAmJiBlaXRoZXJEdWNraW5nOlxuICAgICAgICBmbGluZygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJTdGFuZGluZzpcbiAgICAgICAgcG9wKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIGlmIG9ubHkgb25lIG9mIHRoZSB0b3VjaGluZyBwbGF5ZXJzIGlzIGF0dGFja2luZy4uLlxuICAgIGlmIChwbGF5ZXJBLmlzQXR0YWNraW5nICE9PSBwbGF5ZXJCLmlzQXR0YWNraW5nKSB7XG4gICAgICB2YXIgdmljdGltID0gcGxheWVyQS5pc0F0dGFja2luZyA/IHBsYXllckIgOiBwbGF5ZXJBO1xuICAgICAgaWYgKHBsYXllckEub3JpZW50YXRpb24gIT09IHBsYXllckIub3JpZW50YXRpb24pIHtcbiAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgxKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMik7IC8vIGF0dGFja2VkIGZyb20gYmVoaW5kIGZvciBkb3VibGUgZGFtYWdlXG4gICAgICB9XG4gICAgfVxuXG4gIH0sIGZ1bmN0aW9uIGFsbG93UGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAvLyBkb24ndCBhbGxvdyBjb2xsaXNpb24gaWYgZWl0aGVyIHBsYXllciBpc24ndCBjb2xsaWRhYmxlLlxuICAgIGlmICghcGxheWVyQS5pc0NvbGxpZGFibGUgfHwgIXBsYXllckIuaXNDb2xsaWRhYmxlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9KTtcbn07XG5cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKG5hdGl2ZVdpZHRoLCBuYXRpdmVIZWlnaHQsIFBoYXNlci5BVVRPLCAnZ2FtZScsIHtcbiAgcHJlbG9hZDogcHJlbG9hZCxcbiAgY3JlYXRlOiBjcmVhdGUsXG4gIHVwZGF0ZTogdXBkYXRlLFxufSwgZmFsc2UsIGZhbHNlKTsgLy8gZGlzYWJsZSBhbnRpLWFsaWFzaW5nXG5cbm1vZHVsZS5leHBvcnRzID0gY2hlY2tGb3JHYW1lT3ZlcjtcbiIsInZhciBidWlsZFBsYXRmb3JtcyA9IGZ1bmN0aW9uIGJ1aWxkUGxhdGZvcm1zKGdhbWUpIHtcbiAgdmFyIHBsYXRmb3JtcyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gIHBsYXRmb3Jtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcbiAgdmFyIHBsYXRmb3JtUG9zaXRpb25zID0gW1s0OCwgNjRdLCBbMjI0LCA2NF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWzEzNiwgMTA0XSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFs0OCwgMTU0LF0sIFsyMjQsIDE1NF1dO1xuXG4gIHBsYXRmb3JtUG9zaXRpb25zLmZvckVhY2goZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICB2YXIgcGxhdGZvcm0gPSBwbGF0Zm9ybXMuY3JlYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSwgJ2NsZWFyJyk7IC8vIHNldCB0byBwaW5rIGZvciBkZWJ1Z2dpbmdcbiAgICBwbGF0Zm9ybS5zY2FsZS5zZXRUbygyNCwgNCk7XG4gICAgcGxhdGZvcm0uYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICB9KTtcblxuICB2YXIgd2FsbHMgPSBbXTtcbiAgd2FsbHMucHVzaChwbGF0Zm9ybXMuY3JlYXRlKC0xNiwgMzIsICdwaW5rJykpO1xuICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoMzA0LCAzMiwgJ3BpbmsnKSk7XG4gIHdhbGxzLmZvckVhY2goZnVuY3Rpb24od2FsbCkge1xuICAgIHdhbGwuc2NhbGUuc2V0VG8oMTYsIDc0KTtcbiAgICB3YWxsLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgfSk7XG4gIFxuICByZXR1cm4gcGxhdGZvcm1zO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBidWlsZFBsYXRmb3JtcztcbiIsInZhciBjcmVhdGVQbGF5ZXIgPSBmdW5jdGlvbiBjcmVhdGVQbGF5ZXIoZ2FtZSwgb3B0aW9ucykge1xuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IDQsXG4gICAgICB5OiA4XG4gICAgfSxcbiAgICBvcmllbnRhdGlvbjogJ3JpZ2h0JyxcbiAgICBrZXlzOiB7XG4gICAgICB1cDogJ1VQJyxcbiAgICAgIGRvd246ICdET1dOJyxcbiAgICAgIGxlZnQ6ICdMRUZUJyxcbiAgICAgIHJpZ2h0OiAnUklHSFQnLFxuICAgICAgYXR0YWNrOiAnRU5URVInXG4gICAgfSxcbiAgICBzY2FsZToge1xuICAgICAgeDogNCxcbiAgICAgIHk6IDhcbiAgICB9LFxuICAgIGNvbG9yOiAncGluaycsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEsXG4gIH07XG5cbiAgdmFyIHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gIHZhciBrZXlzID0ge1xuICAgIHVwOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy51cF0pLFxuICAgIGRvd246IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmRvd25dKSxcbiAgICBsZWZ0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5sZWZ0XSksXG4gICAgcmlnaHQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnJpZ2h0XSksXG4gICAgYXR0YWNrOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5hdHRhY2tdKSxcbiAgfTtcblxuICB2YXIgZ2FtZXBhZCA9IHNldHRpbmdzLmdhbWVwYWQ7XG5cbiAgdmFyIHNmeCA9IHJlcXVpcmUoJy4vc2Z4LmpzJyk7XG5cbiAgdmFyIGFjdGlvbnMgPSB7XG4gICAgYXR0YWNrOiBmdW5jdGlvbiBhdHRhY2soKSB7XG4gICAgICB2YXIgZHVyYXRpb24gPSAyMDA7XG4gICAgICB2YXIgaW50ZXJ2YWwgPSA0MDA7XG4gICAgICB2YXIgdmVsb2NpdHkgPSAyMDA7XG5cbiAgICAgIHZhciBjYW5BdHRhY2sgPSAoRGF0ZS5ub3coKSA+IHBsYXllci5sYXN0QXR0YWNrZWQgKyBpbnRlcnZhbCkgJiYgIXBsYXllci5pc0R1Y2tpbmcgJiYgIXBsYXllci5pc0RlYWQ7XG4gICAgICBpZiAoIWNhbkF0dGFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IHRydWU7XG4gICAgICBwbGF5ZXIubGFzdEF0dGFja2VkID0gRGF0ZS5ub3coKTtcblxuICAgICAgc2Z4LmF0dGFjaygpO1xuXG4gICAgICBzd2l0Y2gocGxheWVyLm9yaWVudGF0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAtdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5sb2FkVGV4dHVyZSgnd2hpdGUnKTtcbiAgICAgIHNldFRpbWVvdXQoYWN0aW9ucy5lbmRBdHRhY2ssIGR1cmF0aW9uKTtcbiAgICB9LFxuXG4gICAgZW5kQXR0YWNrOiBmdW5jdGlvbiBlbmRBdHRhY2soKSB7XG4gICAgICBpZiAocGxheWVyLmlzQXR0YWNraW5nKSB7XG4gICAgICAgIHBsYXllci5sb2FkVGV4dHVyZShzZXR0aW5ncy5jb2xvcik7XG4gICAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uIHJ1bihkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBtYXhTcGVlZCA9IDY0O1xuICAgICAgdmFyIGFjY2VsZXJhdGlvbiA9IHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gPyA4IDogMzsgLy8gcGxheWVycyBoYXZlIGxlc3MgY29udHJvbCBpbiB0aGUgYWlyXG4gICAgICBwbGF5ZXIub3JpZW50YXRpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIC8vIGlmIHBsYXllciBpcyBnb2luZyBmYXN0ZXIgdGhhbiBtYXggcnVubmluZyBzcGVlZCAoZHVlIHRvIGF0dGFjaywgZXRjKSwgc2xvdyB0aGVtIGRvd24gb3ZlciB0aW1lXG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPCAtbWF4U3BlZWQpIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKz0gYWNjZWxlcmF0aW9uO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gTWF0aC5tYXgocGxheWVyLmJvZHkudmVsb2NpdHkueCAtIGFjY2VsZXJhdGlvbiwgLW1heFNwZWVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IG1heFNwZWVkKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWluKHBsYXllci5ib2R5LnZlbG9jaXR5LnggKyBhY2NlbGVyYXRpb24sIG1heFNwZWVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGFjdGlvbnMub3JpZW50SGVhcnRzKGRpcmVjdGlvbik7XG4gICAgfSxcbiAgICBcbiAgICAvLyBUT0RPOiBmaXggbGVmdCBoZWFydHMgcG9zaXRpb24gd2hlbiBocCBpcyBsZXNzIHRoYW4gbWF4XG4gICAgb3JpZW50SGVhcnRzOiBmdW5jdGlvbiBvcmllbnRIZWFydHMoZGlyZWN0aW9uKSB7XG4gICAgICB2YXIgaGVhcnREaXN0YW5jZSA9IDEuMTsgLy8gaG93IGNsb3NlIGhlYXJ0cyBmbG9hdCBieSBwbGF5ZXJcbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5oZWFydHMuYW5jaG9yLnNldFRvKC1oZWFydERpc3RhbmNlLCAwKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIHBsYXllci5oZWFydHMuYW5jaG9yLnNldFRvKGhlYXJ0RGlzdGFuY2UsIDApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBqdW1wOiBmdW5jdGlvbiBqdW1wKCkge1xuICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24pIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0yMDA7XG4gICAgICAgIHNmeC5qdW1wKCk7XG4gICAgICAvLyB3YWxsIGp1bXBzXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmxlZnQpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0yNDA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSA5MDtcbiAgICAgICAgc2Z4Lmp1bXAoKTtcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcucmlnaHQpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0yNDA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAtOTA7XG4gICAgICAgIHNmeC5qdW1wKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGRhbXBlbkp1bXA6IGZ1bmN0aW9uIGRhbXBlbkp1bXAoKSB7XG4gICAgICAvLyBzb2Z0ZW4gdXB3YXJkIHZlbG9jaXR5IHdoZW4gcGxheWVyIHJlbGVhc2VzIGp1bXAga2V5XG4gICAgICAgIHZhciBkYW1wZW5Ub1BlcmNlbnQgPSAwLjU7XG5cbiAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSAqPSBkYW1wZW5Ub1BlcmNlbnQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHVjazogZnVuY3Rpb24gZHVjaygpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNBdHRhY2tpbmcgfHwgcGxheWVyLmlzRGVhZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxheWVyLmlzRHVja2luZykge1xuICAgICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSAvIDIpO1xuICAgICAgICBwbGF5ZXIueSArPSBzZXR0aW5ncy5zY2FsZS55O1xuICAgICAgfVxuICAgICAgcGxheWVyLmlzRHVja2luZyA9IHRydWU7XG5cbiAgICAgIChmdW5jdGlvbiByb2xsKCkge1xuICAgICAgICB2YXIgY2FuUm9sbCA9IE1hdGguYWJzKHBsYXllci5ib2R5LnZlbG9jaXR5LngpID4gNTAgJiYgcGxheWVyLmJvZHkudG91Y2hpbmcuZG93bjtcbiAgICAgICAgaWYgKGNhblJvbGwpIHtcbiAgICAgICAgICBwbGF5ZXIuaXNSb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSgpKTtcbiAgICB9LFxuXG4gICAgc3RhbmQ6IGZ1bmN0aW9uIHN0YW5kKCkge1xuICAgICAgcGxheWVyLnkgLT0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBzZXR0aW5ncy5zY2FsZS55KTtcbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSBmYWxzZTtcbiAgICAgIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgdGFrZURhbWFnZTogZnVuY3Rpb24gdGFrZURhbWFnZShhbW91bnQpIHtcbiAgICAgIC8vIHByZXZlbnQgdGFraW5nIG1vcmUgZGFtYWdlIHRoYW4gaHAgcmVtYWluaW5nIGluIGEgY3VycmVudCBoZWFydFxuICAgICAgaWYgKGFtb3VudCA+IDEgJiYgKHBsYXllci5ocCAtIGFtb3VudCkgJSAyICE9PSAwKSB7XG4gICAgICAgIGFtb3VudCA9IDE7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5ocCAtPSBhbW91bnQ7XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPCAwKSB7XG4gICAgICAgIHBsYXllci5ocCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAocGxheWVyLmhwICUgMiA9PT0gMCkge1xuICAgICAgICBhY3Rpb25zLmRpZSgpO1xuICAgICAgfVxuICAgICAgYWN0aW9ucy51cGRhdGVIZWFydHMoKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlSGVhcnRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBoZWFsdGhQZXJjZW50YWdlID0gcGxheWVyLmhwIC8gcGxheWVyLm1heEhwO1xuICAgICAgdmFyIGNyb3BXaWR0aCA9IE1hdGguY2VpbChoZWFsdGhQZXJjZW50YWdlICogaGVhcnRzV2lkdGgpO1xuICAgICAgdmFyIGNyb3BSZWN0ID0gbmV3IFBoYXNlci5SZWN0YW5nbGUoMCwgMCwgY3JvcFdpZHRoLCBwbGF5ZXIuaGVhcnRzLmhlaWdodCk7XG4gICAgICBwbGF5ZXIuaGVhcnRzLmNyb3AoY3JvcFJlY3QpO1xuICAgIH0sXG5cbiAgICBkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgc2Z4LmRpZSgpO1xuXG4gICAgICBpZiAocGxheWVyLmhwID4gMCkge1xuICAgICAgICBhY3Rpb25zLmVuZEF0dGFjaygpO1xuICAgICAgICBwbGF5ZXIubGFzdEF0dGFja2VkID0gMDtcblxuICAgICAgICB2YXIgcmVzcGF3blBvc2l0aW9uID0ge1xuICAgICAgICAgIHg6IE1hdGgucmFuZG9tKCkgPiAwLjUgPyA0IDogMzA2LFxuICAgICAgICAgIHk6IDhcbiAgICAgICAgfTtcblxuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueCA9IHJlc3Bhd25Qb3NpdGlvbi54O1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueSA9IHJlc3Bhd25Qb3NpdGlvbi55O1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXIuaXNEZWFkID0gdHJ1ZTtcbiAgICAgICAgLy8ga25vY2sgcGxheWVyIG9uIGhpcy9oZXIgc2lkZVxuICAgICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueSwgc2V0dGluZ3Muc2NhbGUueCk7XG4gICAgICAgIC8vIFRPRE86IGRldGFuZ2xlIHRoaXNcbiAgICAgICAgdmFyIGNoZWNrRm9yR2FtZU92ZXIgPSByZXF1aXJlKCcuL2dhbWUuanMnKTtcbiAgICAgICAgY2hlY2tGb3JHYW1lT3ZlcigpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB2YXIgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKHNldHRpbmdzLnBvc2l0aW9uLngsIHNldHRpbmdzLnBvc2l0aW9uLnksIHNldHRpbmdzLmNvbG9yKTtcbiAgcGxheWVyLm5hbWUgPSBzZXR0aW5ncy5uYW1lO1xuICBwbGF5ZXIub3JpZW50YXRpb24gPSBzZXR0aW5ncy5vcmllbnRhdGlvbjtcbiAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkpOyAvLyBUT0RPOiBhZGQgZ2lhbnQgbW9kZVxuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHBsYXllcik7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5ib2R5LmJvdW5jZS55ID0gMC4yOyAvLyBUT0RPOiBhbGxvdyBib3VuY2UgY29uZmlndXJhdGlvblxuICBwbGF5ZXIuYm9keS5ncmF2aXR5LnkgPSAzODA7IC8vIFRPRE86IGFsbG93IGdyYXZpdHkgY29uZmlndXJhdGlvblxuXG4gIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTsgLy8gdHJhY2sgaW5wdXQgY2hhbmdlIGZvciB2YXJpYWJsZSBqdW1wIGhlaWdodFxuICBwbGF5ZXIuaXNSb2xsaW5nID0gZmFsc2U7XG4gIHBsYXllci5pc0R1Y2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzQXR0YWNraW5nID0gZmFsc2U7XG4gIHBsYXllci5pc0RlYWQgPSBmYWxzZTtcbiAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IDA7XG4gIHBsYXllci5pc0NvbGxpZGFibGUgPSB0cnVlO1xuXG4gIHBsYXllci5hY3Rpb25zID0gYWN0aW9ucztcblxuICAvLyB0cmFjayBoZWFsdGhcbiAgcGxheWVyLmhwID0gcGxheWVyLm1heEhwID0gNjsgLy8gVE9ETzogYWxsb3cgc2V0dGluZyBjdXN0b20gaHAgYW1vdW50IGZvciBlYWNoIHBsYXllclxuICBwbGF5ZXIuaGVhcnRzID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdoZWFydHMnKTtcbiAgdmFyIGhlYXJ0c1dpZHRoID0gcGxheWVyLmhlYXJ0cy53aWR0aDtcbiAgcGxheWVyLmhlYXJ0cy5zZXRTY2FsZU1pbk1heCgxLCAxKTsgLy8gcHJldmVudCBoZWFydHMgc2NhbGluZyB3LyBwbGF5ZXJcbiAgdmFyIGJvYiA9IHBsYXllci5oZWFydHMuYW5pbWF0aW9ucy5hZGQoJ2JvYicsIFswLDEsMiwxXSwgMywgdHJ1ZSk7IC8vIG5hbWUsIGZyYW1lcywgZnJhbWVyYXRlLCBsb29wXG4gIHBsYXllci5oZWFydHMuYW5pbWF0aW9ucy5wbGF5KCdib2InKTtcbiAgcGxheWVyLmFkZENoaWxkKHBsYXllci5oZWFydHMpO1xuICBhY3Rpb25zLm9yaWVudEhlYXJ0cyhwbGF5ZXIub3JpZW50YXRpb24pO1xuXG4gIC8vIHBoYXNlciBhcHBhcmVudGx5IGF1dG9tYXRpY2FsbHkgY2FsbHMgYW55IGZ1bmN0aW9uIG5hbWVkIHVwZGF0ZSBhdHRhY2hlZCB0byBhIHNwcml0ZSFcbiAgcGxheWVyLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGtpbGwgcGxheWVyIGlmIGhlIGZhbGxzIG9mZiB0aGUgc2NyZWVuXG4gICAgaWYgKHBsYXllci5wb3NpdGlvbi55ID4gMTgwICYmIHBsYXllci5ocCAhPT0gMCkgeyAvLyBUT0RPOiBob3cgdG8gYWNjZXNzIG5hdGl2ZSBoZWlnaHQgZnJvbSBnYW1lLmpzP1xuICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDIpO1xuICAgIH1cblxuICAgIHZhciBpbnB1dCA9IHtcbiAgICAgIGxlZnQ6ICAgKGtleXMubGVmdC5pc0Rvd24gJiYgIWtleXMucmlnaHQuaXNEb3duKSB8fFxuICAgICAgICAgICAgICAoZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0xFRlQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1gpIDwgLTAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9YKSA8IC0wLjEsXG4gICAgICByaWdodDogIChrZXlzLnJpZ2h0LmlzRG93biAmJiAha2V5cy5sZWZ0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9SSUdIVCkgJiYgIWdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9YKSA+IDAuMSxcbiAgICAgIHVwOiAgICAga2V5cy51cC5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1VQKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0EpLFxuICAgICAgZG93bjogICBrZXlzLmRvd24uaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9ET1dOKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1kpID4gMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1kpID4gMC4xLFxuICAgICAgYXR0YWNrOiBrZXlzLmF0dGFjay5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1gpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9ZKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfQikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0xFRlRfQlVNUEVSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfTEVGVF9UUklHR0VSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfUklHSFRfQlVNUEVSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfUklHSFRfVFJJR0dFUiksXG4gICAgfTtcblxuICAgIGlmIChpbnB1dC5sZWZ0KSB7XG4gICAgICBhY3Rpb25zLnJ1bignbGVmdCcpO1xuICAgIH0gZWxzZSBpZiAoaW5wdXQucmlnaHQpIHtcbiAgICAgIGFjdGlvbnMucnVuKCdyaWdodCcpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAhcGxheWVyLmlzUm9sbGluZykge1xuICAgICAgLy8gYXBwbHkgZnJpY3Rpb25cbiAgICAgIGlmIChNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA8IDQpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAqPSAwLjU7IC8vIHF1aWNrbHkgYnJpbmcgc2xvdy1tb3ZpbmcgcGxheWVycyB0byBhIHN0b3BcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IDApIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSA0O1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IDwgMCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICs9IDQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LnVwKSB7XG4gICAgICBwbGF5ZXIudXBXYXNEb3duID0gdHJ1ZTtcbiAgICAgIGFjdGlvbnMuanVtcCgpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLnVwV2FzRG93bikge1xuICAgICAgcGxheWVyLnVwV2FzRG93biA9IGZhbHNlO1xuICAgICAgYWN0aW9ucy5kYW1wZW5KdW1wKCk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmRvd24pIHtcbiAgICAgIGFjdGlvbnMuZHVjaygpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLmlzRHVja2luZykge1xuICAgICAgYWN0aW9ucy5zdGFuZCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5hdHRhY2spIHtcbiAgICAgIGFjdGlvbnMuYXR0YWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBwbGF5ZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBsYXllcjtcbiIsInZhciBzZnggPSAoZnVuY3Rpb24gc2Z4KCkge1xuICBQb2x5c3ludGggPSByZXF1aXJlKCdzdWJwb2x5Jyk7XG5cbiAgdmFyIGF1ZGlvQ3R4O1xuICBpZiAodHlwZW9mIEF1ZGlvQ29udGV4dCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICB9IGVsc2Uge1xuICAgIGF1ZGlvQ3R4ID0gbmV3IHdlYmtpdEF1ZGlvQ29udGV4dCgpO1xuICB9XG5cbiAgdmFyIHB1bHNlID0gbmV3IFBvbHlzeW50aChhdWRpb0N0eCwge1xuICAgIHdhdmVmb3JtOiAnc3F1YXJlJyxcbiAgICByZWxlYXNlOiAwLjAxLFxuICAgIG51bVZvaWNlczogNFxuICB9KTtcbiAgXG4gIGZ1bmN0aW9uIGdldE5vdyh2b2ljZSkge1xuICAgIHZhciBub3cgPSB2b2ljZS5hdWRpb0N0eC5jdXJyZW50VGltZTtcbiAgICByZXR1cm4gbm93O1xuICB9O1xuICBcbiAgdmFyIGp1bXBUaW1lb3V0LCBhdHRhY2tUaW1lb3V0O1xuICB2YXIgZGllVGltZW91dHMgPSBbXTtcblxuICB2YXIgc291bmRFZmZlY3RzID0ge1xuICAgIGp1bXA6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGp1bXBUaW1lb3V0KTtcbiAgICAgIFxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzBdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMC4xOyAvLyBpbiBzZWNvbmRzXG4gICAgICBcbiAgICAgIHZvaWNlLnBpdGNoKDQ0MCk7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuXG4gICAgICB2YXIgbm93ID0gZ2V0Tm93KHZvaWNlKTtcbiAgICAgIHZvaWNlLm9zYy5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoODgwLCBub3cgKyBkdXJhdGlvbik7XG4gICAgICBqdW1wVGltZW91dCA9IHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiAxMDAwKTtcbiAgICB9LFxuXG4gICAgYXR0YWNrOiBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyVGltZW91dChhdHRhY2tUaW1lb3V0KTtcbiAgICAgIFxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzFdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMC4xOyAvLyBpbiBzZWNvbmRzXG4gICAgICBcbiAgICAgIHZvaWNlLnBpdGNoKDg4MCk7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuXG4gICAgICB2YXIgbm93ID0gZ2V0Tm93KHZvaWNlKTtcbiAgICAgIHZvaWNlLm9zYy5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMCwgbm93ICsgZHVyYXRpb24pO1xuICAgICAgYXR0YWNrVGltZW91dCA9IHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiAxMDAwKTtcbiAgICB9LFxuICAgIFxuICAgIGJvdW5jZTogZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhclRpbWVvdXQoYXR0YWNrVGltZW91dCk7XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1syXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDAuMTsgLy8gaW4gc2Vjb25kc1xuICAgICAgXG4gICAgICB2b2ljZS5waXRjaCg0NDApO1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgdmFyIG5vdyA9IGdldE5vdyh2b2ljZSk7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDIyMCwgbm93ICsgZHVyYXRpb24gLyAyKTtcbiAgICAgIHZvaWNlLm9zYy5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoNjYwLCBub3cgKyBkdXJhdGlvbik7XG4gICAgICBhdHRhY2tUaW1lb3V0ID0gc2V0VGltZW91dCh2b2ljZS5zdG9wLCBkdXJhdGlvbiAqIDEwMDApO1xuICAgIH0sXG4gICAgXG4gICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIHdoaWxlIChkaWVUaW1lb3V0cy5sZW5ndGgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRpZVRpbWVvdXRzLnBvcCgpKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzNdO1xuICAgICAgdmFyIHBpdGNoZXMgPSBbNDQwLCAyMjAsIDExMF07XG4gICAgICB2YXIgZHVyYXRpb24gPSAxMDA7XG5cbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG4gICAgICBcbiAgICAgIHBpdGNoZXMuZm9yRWFjaChmdW5jdGlvbihwaXRjaCwgaSkge1xuICAgICAgICBkaWVUaW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdm9pY2UucGl0Y2gocGl0Y2gpO1xuICAgICAgICB9LCBpICogZHVyYXRpb24pKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBkaWVUaW1lb3V0cy5wdXNoKHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiBwaXRjaGVzLmxlbmd0aCkpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBzb3VuZEVmZmVjdHM7XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNmeDtcbiIsInZhciB1dGlscyA9IHtcbiAgLy8gZnJvbSB1bmRlcnNjb3JlXG4gIGRlYm91bmNlOiBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcblx0dmFyIHRpbWVvdXQ7XG5cdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdH07XG5cdFx0dmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG5cdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0fTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsczsiXX0=
