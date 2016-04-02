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
var font = { font: "9px Helvetica", fill: "#777", align: "center", boundsAlignH: "center", boundsAlignV: "middle" };

module.exports = font;

},{}],4:[function(require,module,exports){
var Players = function(game) {
    var players = [{
      name: 'Orange',
      color: 'orange',
      gamepad: game.input.gamepad.pad1,
      keys: {
        up: 'W', down: 'S', left: 'A', right: 'D', attack: 'Q'
      },
    }, {
      name: 'Yellow',
      color: 'yellow',
      gamepad: game.input.gamepad.pad2,
      orientation: 'left',
    }, {
      name: 'Pink',
      color: 'pink',
      gamepad: game.input.gamepad.pad3,
      keys: {
        up: 'I', down: 'K', left: 'J', right: 'L', attack: 'U'
      },
    }, {
      name: 'Purple',
      color: 'purple',
      gamepad: game.input.gamepad.pad4,
      orientation: 'left',
      keys: {
        up: 'T', down: 'G', left: 'F', right: 'H', attack: 'R'
      },
  }];
  
  return players;
};

module.exports = Players;

},{}],5:[function(require,module,exports){
var stages = require('./stages');

var settings = {
  playerCount: {
    options: [2, 3, 4],
    selected: 4,
  },
  bgm: {
    options: ['A', 'None'],
    selected: 'None',
  },
  stage: {
    options: stages.map(function(stage) {
      return stage.name;
    }),
    selected: 'A',
  }
};

module.exports = settings;

},{"./stages":6}],6:[function(require,module,exports){
var stages = [{
  "name": "A",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [10, 7],
      [45, 7],
      [27, 15],
      [10, 25],
      [45, 25],
      [10, 44],
      [45, 44],
      [27, 52],
      [10, 62],
      [45, 62]
    ],
    "color": "green"
  },
  "backgrounds": [],
  "foreground": "clear",
  "spawnPoints": [
    { "x": 14, "y": 0 },
    { "x": 48, "y": 0 },
    { "x": 14, "y": 18 },
    { "x": 48, "y": 18 }
  ],
  "uiColor": "#28F129"
},{
  "name": "B",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [27, 6],
      [10, 13],
      [45, 13],
      [4, 22],
      [50, 22],
      [18, 31],
      [27, 31],
      [37, 31],
      [4, 44],
      [50, 44],
      [27, 60]
    ],
    "color": "blue"
  },
  "backgrounds": [],
  "foreground": "clear",
  "spawnPoints": [
    { "x": 14, "y": 6 },
    { "x": 48, "y": 6 },
    { "x": 9, "y": 15 },
    { "x": 54, "y": 15 }
  ],
  "uiColor": "#28D6F1"
},{
  "name": "C",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [8, 34],
      [12, 34],
      [22, 34],
      [31, 34],
      [41, 34],
      [46, 34],
    ],
    "color": "gray"
  },
  "backgrounds": [],
  "foreground": "clear",
  "spawnPoints": [
    { "x": 10, "y": 27 },
    { "x": 19, "y": 27 },
    { "x": 41, "y": 27 },
    { "x": 50, "y": 27 }
  ],
  "uiColor": "#8D8D8D"
},{
  "name": "D",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [10, 13],
      [45, 13],
      [27, 21],
      [10, 31],
      [45, 31]
    ],
    "color": "brown"
  },
  "backgrounds": [],
  "foreground": "clear",
  "spawnPoints": [
    { "x": 14, "y": 6 },
    { "x": 48, "y": 6 },
    { "x": 14, "y": 24 },
    { "x": 48, "y": 24 }
  ],
  "uiColor": "#783E08"
}];

module.exports = stages;

},{}],7:[function(require,module,exports){
var resize = function resize() {
  document.body.style.zoom = window.innerWidth / game.width;
};

var main = {
  preload: function preload() {
    var utils = require('./utils.js');

    resize();
    window.onresize = utils.debounce(resize, 100);
    
    // allow anything up to height of world to fall off-screen up or down
    game.world.setBounds(0, -game.width, game.width, game.height * 3);
    
    // prevent game pausing when it loses focus
    game.stage.disableVisibilityChange = true;
    
    // assets used in splash screen intro animation
    game.load.image('purple', 'images/purple.png');
  },

  create: function create() {
    game.input.gamepad.start();

    game.state.add('splash', require('./states/splash.js')(game));
    game.state.add('play', require('./states/play.js')(game));

    game.state.start('splash');
  }
};

var game = new Phaser.Game(64, 64, Phaser.AUTO, 'game', {
  preload: main.preload,
  create: main.create
}, false, false); // disable anti-aliasing

game.state.add('main', main);
game.state.start('main');

},{"./states/play.js":12,"./states/splash.js":13,"./utils.js":14}],8:[function(require,module,exports){
var buildMenu = function buildMenu(game, state) {
  var settings = require('./data/settings.js');

  var cycleSetting = function cycleSetting() {
    var optionIndex = this.setting.options.indexOf(this.setting.selected);
    optionIndex++;
    if (optionIndex === this.setting.options.length) {
      optionIndex = 0;
    }
    this.setting.selected = this.setting.options[optionIndex];
  };

  var menu = [{
    name: 'Players',
    setting: settings.playerCount,
    action: function() {
      cycleSetting.call(this);
      state.restart();
    },
    selected: true
  }, /*{
    name: 'BGM',
    setting: settings.bgm,
    action: function() {
      cycleSetting.call(this);
      state.resetMusic(settings);
    },
  },*/ {
    name: 'Stage',
    setting: settings.stage,
    action: function() {
      cycleSetting.call(this);
      state.restart();
    },
  }, {
    name: 'Start',
    action: function() {
      state.restart();
    }
  }];

  var changePlayerCount = menu[0].action.bind(menu[0]);
  var changeStage = menu[1].action.bind(menu[1]);
  var restart = menu[2].action.bind(menu[2]);

  game.input.keyboard.addKey(Phaser.Keyboard.P).onDown.add(changePlayerCount);
  game.input.keyboard.addKey(Phaser.Keyboard.M).onDown.add(changeStage);
  game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(restart);
  if (game.input.gamepad.supported && game.input.gamepad.active) {
    if (game.input.gamepad.pad1.connected) {
      game.input.gamepad.pad1.getButton(Phaser.Gamepad.XBOX360_START).onDown.add(restart);
    }
    if (game.input.gamepad.pad2.connected) {
      game.input.gamepad.pad2.getButton(Phaser.Gamepad.XBOX360_START).onDown.add(restart);
    }
    if (game.input.gamepad.pad3.connected) {
      game.input.gamepad.pad3.getButton(Phaser.Gamepad.XBOX360_START).onDown.add(restart);
    }
    if (game.input.gamepad.pad4.connected) {
      game.input.gamepad.pad4.getButton(Phaser.Gamepad.XBOX360_START).onDown.add(restart);
    }
  }

  return menu;
};

module.exports = buildMenu;

},{"./data/settings.js":5}],9:[function(require,module,exports){
var createPlayer = function createPlayer(game, options, onDeath) {
  var defaults = {
    orientation: 'right',
    keys: {
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      attack: 'SHIFT'
    },
    scale: {
      x: 1,
      y: 2
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
      var velocity = 100;

      var canAttack = (Date.now() > player.lastAttacked + interval) && !player.isDucking && !player.isPermadead;
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
      var maxSpeed = 32;
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
    },

    jump: function jump() {
      if (player.body.touching.down) {
        player.body.velocity.y = -100;
        sfx.jump();
      // wall jumps
      } else if (player.body.touching.left) {
        player.body.velocity.y = -120;
        player.body.velocity.x = 45;
        sfx.jump();
      } else if (player.body.touching.right) {
        player.body.velocity.y = -120;
        player.body.velocity.x = -45;
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
      if (player.isAttacking || player.isPermadead) {
        return;
      }

      if (!player.isDucking && player.hp > 2) {
        player.scale.setTo(settings.scale.x, settings.scale.y / 2);
        player.y += settings.scale.y;
      }
      player.isDucking = true;

      (function roll() {
        var canRoll = Math.abs(player.body.velocity.x) > 25 && player.body.touching.down;
        if (canRoll) {
          player.isRolling = true;
        }
      }());
    },

    stand: function stand() {
      if (player.hp > 2) {
        player.y -= settings.scale.y;
      }
      actions.applyHealthEffects();
      player.isDucking = false;
      player.isRolling = false;
    },

    takeDamage: function takeDamage(amount) {
      // prevent taking more damage than hp remaining in current life
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
      actions.applyHealthEffects();
    },

    applyHealthEffects: function() {
      var newPlayerHeight = Math.max(Math.round(player.hp / 2), 1);
      player.scale.setTo(settings.scale.x, newPlayerHeight);

      var newPlayerAlpha = player.hp % 2 === 0 ? 1 : 0.75;
      player.alpha = newPlayerAlpha;
    },

    die: function() {
      if (player.isPermadead) {
        return;
      }

      if (player.hp > 0) {
        sfx.die();
        actions.endAttack();
        player.lastAttacked = 0;

        var utils = require('./utils');
        var respawnPosition = utils.getRandomArrayElement(utils.getStage().spawnPoints);
        player.position.x = respawnPosition.x;
        player.position.y = respawnPosition.y;
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
      } else {
        sfx.permadie();
        player.loadTexture('white');
        player.isPermadead = true;
        onDeath(); // TODO: this could probably be better architected
      }
    }
  };

  var player = game.add.sprite(0, 0, settings.color);
  player.name = settings.name;
  player.orientation = settings.orientation;

  // track health
  player.hp = player.maxHp = 6; // TODO: allow setting custom hp amount for each player
  player.actions = actions;
  player.actions.applyHealthEffects(); // TODO: add giant mode

  game.physics.arcade.enable(player);
  player.body.collideWorldBounds = true;
  player.body.bounce.y = 0.2; // TODO: allow bounce configuration
  player.body.gravity.y = 380; // TODO: allow gravity configuration

  player.upWasDown = false; // track input change for variable jump height
  player.isRolling = false;
  player.isDucking = false;
  player.isAttacking = false;
  player.isPermadead = false;
  player.lastAttacked = 0;
  player.isCollidable = true;



  // phaser apparently automatically calls any function named update attached to a sprite!
  player.update = function() {
    // kill player if he falls off the screen
    if (player.position.y > 64 && player.hp !== 0) { // TODO: how to access native height from game.js?
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
      if (Math.abs(player.body.velocity.x) < 2) {
        player.body.velocity.x *= 0.5; // quickly bring slow-moving players to a stop
      } else if (player.body.velocity.x > 0) {
        player.body.velocity.x -= 2;
      } else if (player.body.velocity.x < 0) {
        player.body.velocity.x += 2;
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

},{"./sfx.js":10,"./utils":14}],10:[function(require,module,exports){
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
    },
    permadie: function() {
      console.log('permadying');
      while (dieTimeouts.length) {
        clearTimeout(dieTimeouts.pop());
      }

      var voice = pulse.voices[3];
      var pitches = [220, 196, 185];
      var duration = 200;

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

},{"subpoly":2}],11:[function(require,module,exports){
var stageBuilder = function stageBuilder(game) {
  var settings = require('./data/settings.js');
  var utils = require('./utils.js');
  var stage = utils.getStage();

  game.stage.backgroundColor = stage.backgroundColor;

  var buildPlatforms = function buildPlatforms() {
    var platforms = game.add.group();
    platforms.enableBody = true;

    var platformPositions = stage.platforms.positions;
    platformPositions.forEach(function(position) {
      var platform = platforms.create(position[0], position[1], stage.platforms.color);
      platform.scale.setTo(5, 1);
      platform.body.immovable = true;
    });

    var walls = [];
    walls.push(platforms.create(-3, -3, stage.platforms.color));
    walls.push(platforms.create(61, -3, stage.platforms.color));
    walls.forEach(function(wall) {
      wall.scale.setTo(3, 35);
      wall.body.immovable = true;
    });

    var ceiling = platforms.create(0, -12, stage.platforms.color);
    ceiling.scale.setTo(32, 3);
    ceiling.body.immovable = true;
    
    return platforms;
  };

  var buildBackgrounds = function buildBackgrounds() {
    var backgrounds = game.add.group();

    stage.backgrounds.forEach(function(layer) {
      var bg;
      if (layer.scrolling) {
        bg = game.add.tileSprite(0, 0, game.width, game.height, layer.image);
        backgrounds.loop = game.time.events.loop(Phaser.Timer.QUARTER, function() {
          bg.tilePosition.x -=1;
        }, this);
      } else {
        bg = game.add.sprite(0, 0, layer.image);
      }
      backgrounds.add(bg);
    });
    
    return backgrounds;
  };

  var buildForeground = function() {
    var foreground = game.add.sprite(0, 0, stage.foreground);
    return foreground;
  };
  
  return {
    buildPlatforms: buildPlatforms,
    buildForeground: buildForeground,
    buildBackgrounds: buildBackgrounds
  };
};

module.exports = stageBuilder;

},{"./data/settings.js":5,"./utils.js":14}],12:[function(require,module,exports){
var Play = function(game) {
  var play = {
    create: function create() {
      var self = this;

      self.sfx = require('../sfx.js');
      self.subUi = game.add.group(); // place to keep anything on-screen that's not UI to depth sort below UI

      // game over message
      var font = require('../data/font.js');
      self.text = game.add.text(0, 0, '', font);
      self.text.setTextBounds(0, 0, game.width, game.height);
      
      // menu
      var buildMenu = require('../menu.js');
      buildMenu(game, self); // TODO: is there a better approach than injecting the whole state into the menu to let it access functions for resetting stage, players, music?

      self.restart();
      game.physics.startSystem(Phaser.Physics.ARCADE);
      game.input.gamepad.start();
    },

    resetMusic: function(settings) {
      // play music
      if (this.music) {
        this.music.stop();
      }
      if (settings.bgm.selected !== 'None') {
        this.music = game.add.audio(settings.bgm.selected);
        this.music.loopFull();
      }
    },

    restart: function restart() {
      var self = this;
      var players = require('../data/players.js')(game);
      var settings = require('../data/settings');
      var utils = require('../utils.js');
      var stageBuilder = require('../stageBuilder.js')(game);
      var stage = utils.getStage();

      // destroy and rebuild stage and players
      var destroyGroup = function destroyGroup(group) {
        if (!group) {
          return;
        }

        while (group.children.length > 0) {
          group.children[0].destroy();
        }

        group.destroy();
      }

      destroyGroup(self.players);
      destroyGroup(self.platforms);
      destroyGroup(self.backgrounds);

      // TODO: ugh, clean this up!
      if (self.backgrounds && self.backgrounds.loop) {
        game.time.events.remove(self.backgrounds.loop);
      }
      if (self.foreground) {
        self.foreground.destroy();
      }

      self.platforms = stageBuilder.buildPlatforms();
      self.backgrounds = stageBuilder.buildBackgrounds();
      self.subUi.add(self.platforms);
      self.subUi.add(self.backgrounds);

      self.players = game.add.group();
      self.subUi.add(self.players);

      var addPlayer = function addPlayer(player) {
        var checkForGameOver = function checkForGameOver() {
          var alivePlayers = [];
          self.players.children.forEach(function(player, i) {
            if (!player.isPermadead) {
              alivePlayers.push(player.name);
            }
          });
          if (alivePlayers.length === 1) {
            var font = Object.assign({}, require('../data/font.js'), {fill: stage.uiColor});
            self.text.setStyle(font);
            self.text.setText(alivePlayers[0] + '  wins!\n');
            self.text.visible = true;
            setTimeout(function() {
              self.text.visible = false;
              self.restart();
            }, 3000);
          }
        };
        var createPlayer = require('../player.js');
        var newPlayer = self.players.add(createPlayer(game, player, checkForGameOver));
        var pos = stage.spawnPoints[i];
        newPlayer.position.x = pos.x;
        newPlayer.position.y = pos.y;
      };

      //players.forEach(addPlayer);
      for (var i=0; i<settings.playerCount.selected; i++) {
        addPlayer(players[i], i);
      }

      self.foreground = stageBuilder.buildForeground();
      self.subUi.add(self.foreground);
    },

    update: function update() {
      var self = this;
      
      game.physics.arcade.collide(this.players, this.platforms);
      // TODO: how do i do this on the player itself without access to players? or should i add a ftn to player and set that as the cb?
      game.physics.arcade.collide(this.players, this.players, function handlePlayerCollision(playerA, playerB) {
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
          self.sfx.bounce();

          var bounceVelocity = 50;
          var velocityA, velocityB;
          velocityA = velocityB = bounceVelocity;
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
          self.sfx.bounce();

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
          var flingXVelocity = 75;
          if (playerToFling.position.x > playerToLeave.position.x) {
            flingXVelocity *= -1;
          }
          playerToFling.body.velocity.x = flingXVelocity;
          playerToFling.body.velocity.y = -75;
        }

        function pop() {
          self.sfx.bounce();

          var playerToPop;
          if (playerA.isRolling) {
            playerToPop = playerB;
          } else {
            playerToPop = playerA;
          }
          temporarilyDisableCollision(playerToPop);
          playerToPop.body.velocity.y = -75;
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
        // also disallow if player is in limbo below the screen :]
        if (!playerA.isCollidable || !playerB.isCollidable || playerA.position.y > game.height || playerB.position.y > game.height) {
          return false;
        }
        return true;
      });
    }
  };
  
  return play;
};

module.exports = Play;

},{"../data/font.js":3,"../data/players.js":4,"../data/settings":5,"../menu.js":8,"../player.js":9,"../sfx.js":10,"../stageBuilder.js":11,"../utils.js":14}],13:[function(require,module,exports){
var Splash = function(game) {
  var splash = {
    init: function() {
      // TODO: intro animation
    },

    preload: function() {
      // images
      game.load.image('clear', 'images/clear.png');
      game.load.image('white', 'images/white.png');
      game.load.image('pink', 'images/pink.png');
      game.load.image('yellow', 'images/yellow.png');
      game.load.image('blue', 'images/blue.png');
      game.load.image('orange', 'images/orange.png');
      game.load.image('green', 'images/green.png');
      game.load.image('gray', 'images/gray.png');
      game.load.image('brown', 'images/brown.png');
    },

    create: function() {
      var startGame = function startGame() {
        clearTimeout(timeout);
        if (game.state.current === 'splash') {
          game.state.start('play');
        }
      };
      
      // start game after a delay...
      var timeout = setTimeout(startGame, 0); // TODO: increase delay...

      // ...or when start/enter is pressed
      /*game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(startGame);
      if (game.input.gamepad.supported && game.input.gamepad.active && game.input.gamepad.pad1.connected) {
        game.input.gamepad.pad1.getButton(Phaser.Gamepad.XBOX360_START).onDown.addOnce(startGame);
      }*/
    }
  };
  
  return splash;
};

module.exports = Splash;

},{}],14:[function(require,module,exports){
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
  },

  center: function(entity) {
    entity.anchor.setTo(0.5);
  },

  // TODO: consider injecting dependencies
  getStage: function() {
    var stages = require('./data/stages');
    var settings = require('./data/settings');
    var stage = stages.filter(function(stage) {
      return stage.name === settings.stage.selected;
    })[0];
    return stage;
  },

  getRandomArrayElement: function(array) {
    return array[Math.floor(Math.random() * array.length)];
  },
};

module.exports = utils;

},{"./data/settings":5,"./data/stages":6}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL3N1YnBvbHkvbm9kZV9tb2R1bGVzL3N1Ym1vbm8vc3VibW9uby5qcyIsIm5vZGVfbW9kdWxlcy9zdWJwb2x5L3N1YnBvbHkuanMiLCJzY3JpcHRzL2RhdGEvZm9udC5qcyIsInNjcmlwdHMvZGF0YS9wbGF5ZXJzLmpzIiwic2NyaXB0cy9kYXRhL3NldHRpbmdzLmpzIiwic2NyaXB0cy9kYXRhL3N0YWdlcy5qcyIsInNjcmlwdHMvbWFpbi5qcyIsInNjcmlwdHMvbWVudS5qcyIsInNjcmlwdHMvcGxheWVyLmpzIiwic2NyaXB0cy9zZnguanMiLCJzY3JpcHRzL3N0YWdlQnVpbGRlci5qcyIsInNjcmlwdHMvc3RhdGVzL3BsYXkuanMiLCJzY3JpcHRzL3N0YXRlcy9zcGxhc2guanMiLCJzY3JpcHRzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIE1vbm9zeW50aCA9IGZ1bmN0aW9uIE1vbm9zeW50aChhdWRpb0N0eCwgY29uZmlnKSB7XG4gIHZhciBzeW50aDtcbiAgdmFyIFN5bnRoID0gZnVuY3Rpb24gU3ludGgoKSB7XG4gICAgc3ludGggPSB0aGlzO1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICBjb25maWcuY3V0b2ZmID0gY29uZmlnLmN1dG9mZiB8fCB7fTtcblxuICAgIHN5bnRoLmF1ZGlvQ3R4ID0gYXVkaW9DdHgsXG4gICAgc3ludGguYW1wICAgICAgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCksXG4gICAgc3ludGguZmlsdGVyICAgPSBhdWRpb0N0eC5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICBzeW50aC5vc2MgICAgICA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICBzeW50aC5wYW4gICAgICA9IGF1ZGlvQ3R4LmNyZWF0ZVBhbm5lcigpLFxuXG4gICAgc3ludGgubWF4R2FpbiAgPSBjb25maWcubWF4R2FpbiAgfHwgMC45LCAvLyBvdXQgb2YgMVxuICAgIHN5bnRoLmF0dGFjayAgID0gY29uZmlnLmF0dGFjayAgIHx8IDAuMSwgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLmRlY2F5ICAgID0gY29uZmlnLmRlY2F5ICAgIHx8IDAuMCwgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLnN1c3RhaW4gID0gY29uZmlnLnN1c3RhaW4gIHx8IDEuMCwgLy8gb3V0IG9mIDFcbiAgICBzeW50aC5yZWxlYXNlICA9IGNvbmZpZy5yZWxlYXNlICB8fCAwLjgsIC8vIGluIHNlY29uZHNcblxuICAgIC8vIGxvdy1wYXNzIGZpbHRlclxuICAgIHN5bnRoLmN1dG9mZiAgICAgICAgICAgICAgPSBzeW50aC5maWx0ZXIuZnJlcXVlbmN5O1xuICAgIHN5bnRoLmN1dG9mZi5tYXhGcmVxdWVuY3kgPSBjb25maWcuY3V0b2ZmLm1heEZyZXF1ZW5jeSB8fCA3NTAwOyAvLyBpbiBoZXJ0elxuICAgIHN5bnRoLmN1dG9mZi5hdHRhY2sgICAgICAgPSBjb25maWcuY3V0b2ZmLmF0dGFjayAgICAgICB8fCAwLjE7IC8vIGluIHNlY29uZHNcbiAgICBzeW50aC5jdXRvZmYuZGVjYXkgICAgICAgID0gY29uZmlnLmN1dG9mZi5kZWNheSAgICAgICAgfHwgMi41OyAvLyBpbiBzZWNvbmRzXG4gICAgc3ludGguY3V0b2ZmLnN1c3RhaW4gICAgICA9IGNvbmZpZy5jdXRvZmYuc3VzdGFpbiAgICAgIHx8IDAuMjsgLy8gb3V0IG9mIDFcbiAgICBcbiAgICBzeW50aC5hbXAuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgc3ludGguZmlsdGVyLnR5cGUgPSAnbG93cGFzcyc7XG4gICAgc3ludGguZmlsdGVyLmNvbm5lY3Qoc3ludGguYW1wKTtcbiAgICBzeW50aC5hbXAuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG4gICAgc3ludGgucGFuLnBhbm5pbmdNb2RlbCA9ICdlcXVhbHBvd2VyJztcbiAgICBzeW50aC5wYW4uc2V0UG9zaXRpb24oMCwgMCwgMSk7IC8vIHN0YXJ0IHdpdGggc3RlcmVvIGltYWdlIGNlbnRlcmVkXG4gICAgc3ludGgub3NjLmNvbm5lY3Qoc3ludGgucGFuKTtcbiAgICBzeW50aC5wYW4uY29ubmVjdChzeW50aC5maWx0ZXIpO1xuICAgIHN5bnRoLm9zYy5zdGFydCgwKTtcbiAgICBcbiAgICBzeW50aC53YXZlZm9ybShjb25maWcud2F2ZWZvcm0gfHwgJ3NpbmUnKTtcbiAgICBzeW50aC5waXRjaChjb25maWcucGl0Y2ggfHwgNDQwKTtcblxuICAgIHJldHVybiBzeW50aDtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXROb3coKSB7XG4gICAgdmFyIG5vdyA9IHN5bnRoLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xuICAgIHN5bnRoLmFtcC5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyhub3cpO1xuICAgIHN5bnRoLmFtcC5nYWluLnNldFZhbHVlQXRUaW1lKHN5bnRoLmFtcC5nYWluLnZhbHVlLCBub3cpO1xuICAgIHJldHVybiBub3c7XG4gIH07XG4gIFxuICBTeW50aC5wcm90b3R5cGUucGl0Y2ggPSBmdW5jdGlvbiBwaXRjaChuZXdQaXRjaCkge1xuICAgIGlmIChuZXdQaXRjaCkge1xuICAgICAgdmFyIG5vdyA9IHN5bnRoLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xuICAgICAgc3ludGgub3NjLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShuZXdQaXRjaCwgbm93KTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bnRoLm9zYy5mcmVxdWVuY3kudmFsdWU7XG4gIH07XG5cbiAgU3ludGgucHJvdG90eXBlLndhdmVmb3JtID0gZnVuY3Rpb24gd2F2ZWZvcm0obmV3V2F2ZWZvcm0pIHtcbiAgICBpZiAobmV3V2F2ZWZvcm0pIHtcbiAgICAgIHN5bnRoLm9zYy50eXBlID0gbmV3V2F2ZWZvcm07XG4gICAgfVxuICAgIHJldHVybiBzeW50aC5vc2MudHlwZTtcbiAgfTtcblxuICAvLyBhcHBseSBhdHRhY2ssIGRlY2F5LCBzdXN0YWluIGVudmVsb3BlXG4gIFN5bnRoLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIHN0YXJ0U3ludGgoKSB7XG4gICAgdmFyIGF0ayAgPSBwYXJzZUZsb2F0KHN5bnRoLmF0dGFjayk7XG4gICAgdmFyIGRlYyAgPSBwYXJzZUZsb2F0KHN5bnRoLmRlY2F5KTtcbiAgICB2YXIgY0F0ayA9IHBhcnNlRmxvYXQoc3ludGguY3V0b2ZmLmF0dGFjayk7XG4gICAgdmFyIGNEZWMgPSBwYXJzZUZsb2F0KHN5bnRoLmN1dG9mZi5kZWNheSk7XG4gICAgdmFyIG5vdyAgPSBnZXROb3coKTtcbiAgICBzeW50aC5jdXRvZmYuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKG5vdyk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi52YWx1ZSwgbm93KTtcbiAgICBzeW50aC5jdXRvZmYubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoc3ludGguY3V0b2ZmLm1heEZyZXF1ZW5jeSwgbm93ICsgY0F0ayk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi5zdXN0YWluICogc3ludGguY3V0b2ZmLm1heEZyZXF1ZW5jeSwgbm93ICsgY0F0ayArIGNEZWMpO1xuICAgIHN5bnRoLmFtcC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLm1heEdhaW4sIG5vdyArIGF0ayk7XG4gICAgc3ludGguYW1wLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoc3ludGguc3VzdGFpbiAqIHN5bnRoLm1heEdhaW4sIG5vdyArIGF0ayArIGRlYyk7XG4gIH07XG5cbiAgLy8gYXBwbHkgcmVsZWFzZSBlbnZlbG9wZVxuICBTeW50aC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3BTeW50aCgpIHtcbiAgICB2YXIgcmVsID0gcGFyc2VGbG9hdChzeW50aC5yZWxlYXNlKTtcbiAgICB2YXIgbm93ID0gZ2V0Tm93KCk7XG4gICAgc3ludGguYW1wLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMCwgbm93ICsgcmVsKTtcbiAgfTtcblxuICByZXR1cm4gbmV3IFN5bnRoKCk7XG59O1xuXG4vLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBNb25vc3ludGg7XG59XG4iLCIvLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJykge1xuICB2YXIgTW9ub3N5bnRoID0gcmVxdWlyZSgnc3VibW9ubycpO1xufVxuXG52YXIgUG9seXN5bnRoID0gZnVuY3Rpb24gUG9seXN5bnRoKGF1ZGlvQ3R4LCBjb25maWcpIHtcbiAgdmFyIHN5bnRoO1xuICB2YXIgU3ludGggPSBmdW5jdGlvbiBTeW50aCgpIHtcbiAgICBzeW50aCA9IHRoaXM7XG4gICAgc3ludGguYXVkaW9DdHggPSBhdWRpb0N0eDtcbiAgICBzeW50aC52b2ljZXMgPSBbXTtcbiAgICBcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uZmlnLmN1dG9mZiA9IGNvbmZpZy5jdXRvZmYgfHwge307XG5cblxuICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGNvbmZpZy5udW1Wb2ljZXMgfHwgMTY7IGkgPCBpaTsgaSsrKSB7XG4gICAgICBzeW50aC52b2ljZXMucHVzaChuZXcgTW9ub3N5bnRoKGF1ZGlvQ3R4LCBjb25maWcpKTtcbiAgICB9XG5cbiAgICBzeW50aC5zdGVyZW9XaWR0aCA9IGNvbmZpZy5zdGVyZW9XaWR0aCB8fCAwLjU7IC8vIG91dCBvZiAxXG4gICAgc3ludGgud2lkdGgoc3ludGguc3RlcmVvV2lkdGgpO1xuXG4gICAgcmV0dXJuIHN5bnRoO1xuICB9O1xuXG4gIC8vIGFwcGx5IGF0dGFjaywgZGVjYXksIHN1c3RhaW4gZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gc3RhcnRTeW50aCgpIHtcbiAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBzdGFydFZvaWNlKHZvaWNlKSB7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIGFwcGx5IHJlbGVhc2UgZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wU3ludGgoKSB7XG4gICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc3RvcFZvaWNlKHZvaWNlKSB7XG4gICAgICB2b2ljZS5zdG9wKCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZ2V0L3NldCBzeW50aCBzdGVyZW8gd2lkdGhcbiAgU3ludGgucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24gd2lkdGgobmV3V2lkdGgpIHtcbiAgICBpZiAoc3ludGgudm9pY2VzLmxlbmd0aCA+IDEgJiYgbmV3V2lkdGgpIHtcbiAgICAgIHN5bnRoLnN0ZXJlb1dpZHRoID0gbmV3V2lkdGg7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBwYW5Wb2ljZSh2b2ljZSwgaSkge1xuICAgICAgICB2YXIgc3ByZWFkID0gMS8oc3ludGgudm9pY2VzLmxlbmd0aCAtIDEpO1xuICAgICAgICB2YXIgeFBvcyA9IHNwcmVhZCAqIGkgKiBzeW50aC5zdGVyZW9XaWR0aDtcbiAgICAgICAgdmFyIHpQb3MgPSAxIC0gTWF0aC5hYnMoeFBvcyk7XG4gICAgICAgIHZvaWNlLnBhbi5zZXRQb3NpdGlvbih4UG9zLCAwLCB6UG9zKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBzeW50aC5zdGVyZW9XaWR0aDtcbiAgfTtcblxuICAvLyBjb252ZW5pZW5jZSBtZXRob2RzIGZvciBjaGFuZ2luZyB2YWx1ZXMgb2YgYWxsIE1vbm9zeW50aHMnIHByb3BlcnRpZXMgYXQgb25jZVxuICAoZnVuY3Rpb24gY3JlYXRlU2V0dGVycygpIHtcbiAgICB2YXIgbW9ub3N5bnRoUHJvcGVydGllcyA9IFsnbWF4R2FpbicsICdhdHRhY2snLCAnZGVjYXknLCAnc3VzdGFpbicsICdyZWxlYXNlJ107XG4gICAgdmFyIG1vbm9zeW50aEN1dG9mZlByb3BlcnRpZXMgPSBbJ21heEZyZXF1ZW5jeScsICdhdHRhY2snLCAnZGVjYXknLCAnc3VzdGFpbiddO1xuXG4gICAgbW9ub3N5bnRoUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihwcm9wZXJ0eSkge1xuICAgICAgU3ludGgucHJvdG90eXBlW3Byb3BlcnR5XSA9IGZ1bmN0aW9uIHNldFZhbHVlcyhuZXdWYWx1ZSkge1xuICAgICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBzZXRWYWx1ZSh2b2ljZSkge1xuICAgICAgICAgIHZvaWNlW3Byb3BlcnR5XSA9IG5ld1ZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBTeW50aC5wcm90b3R5cGUuY3V0b2ZmID0ge307XG4gICAgbW9ub3N5bnRoQ3V0b2ZmUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihwcm9wZXJ0eSkge1xuICAgICAgU3ludGgucHJvdG90eXBlLmN1dG9mZltwcm9wZXJ0eV0gPSBmdW5jdGlvbiBzZXRWYWx1ZXMobmV3VmFsdWUpIHtcbiAgICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc2V0VmFsdWUodm9pY2UpIHtcbiAgICAgICAgICB2b2ljZS5jdXRvZmZbcHJvcGVydHldID0gbmV3VmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIFN5bnRoLnByb3RvdHlwZS53YXZlZm9ybSA9IGZ1bmN0aW9uIHdhdmVmb3JtKG5ld1dhdmVmb3JtKSB7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiB3YXZlZm9ybSh2b2ljZSkge1xuICAgICAgICB2b2ljZS53YXZlZm9ybShuZXdXYXZlZm9ybSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgU3ludGgucHJvdG90eXBlLnBpdGNoID0gZnVuY3Rpb24gcGl0Y2gobmV3UGl0Y2gpIHtcbiAgICAgIHN5bnRoLnZvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIHBpdGNoKHZvaWNlKSB7XG4gICAgICAgIHZvaWNlLnBpdGNoKG5ld1BpdGNoKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pKCk7XG5cbiAgcmV0dXJuIG5ldyBTeW50aDtcbn07XG5cbi8vIG5wbSBzdXBwb3J0XG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IFBvbHlzeW50aDtcbn1cbiIsInZhciBmb250ID0geyBmb250OiBcIjlweCBIZWx2ZXRpY2FcIiwgZmlsbDogXCIjNzc3XCIsIGFsaWduOiBcImNlbnRlclwiLCBib3VuZHNBbGlnbkg6IFwiY2VudGVyXCIsIGJvdW5kc0FsaWduVjogXCJtaWRkbGVcIiB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvbnQ7XG4iLCJ2YXIgUGxheWVycyA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICB2YXIgcGxheWVycyA9IFt7XG4gICAgICBuYW1lOiAnT3JhbmdlJyxcbiAgICAgIGNvbG9yOiAnb3JhbmdlJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLFxuICAgICAga2V5czoge1xuICAgICAgICB1cDogJ1cnLCBkb3duOiAnUycsIGxlZnQ6ICdBJywgcmlnaHQ6ICdEJywgYXR0YWNrOiAnUSdcbiAgICAgIH0sXG4gICAgfSwge1xuICAgICAgbmFtZTogJ1llbGxvdycsXG4gICAgICBjb2xvcjogJ3llbGxvdycsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMixcbiAgICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gICAgfSwge1xuICAgICAgbmFtZTogJ1BpbmsnLFxuICAgICAgY29sb3I6ICdwaW5rJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQzLFxuICAgICAga2V5czoge1xuICAgICAgICB1cDogJ0knLCBkb3duOiAnSycsIGxlZnQ6ICdKJywgcmlnaHQ6ICdMJywgYXR0YWNrOiAnVSdcbiAgICAgIH0sXG4gICAgfSwge1xuICAgICAgbmFtZTogJ1B1cnBsZScsXG4gICAgICBjb2xvcjogJ3B1cnBsZScsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkNCxcbiAgICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnVCcsIGRvd246ICdHJywgbGVmdDogJ0YnLCByaWdodDogJ0gnLCBhdHRhY2s6ICdSJ1xuICAgICAgfSxcbiAgfV07XG4gIFxuICByZXR1cm4gcGxheWVycztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVycztcbiIsInZhciBzdGFnZXMgPSByZXF1aXJlKCcuL3N0YWdlcycpO1xuXG52YXIgc2V0dGluZ3MgPSB7XG4gIHBsYXllckNvdW50OiB7XG4gICAgb3B0aW9uczogWzIsIDMsIDRdLFxuICAgIHNlbGVjdGVkOiA0LFxuICB9LFxuICBiZ206IHtcbiAgICBvcHRpb25zOiBbJ0EnLCAnTm9uZSddLFxuICAgIHNlbGVjdGVkOiAnTm9uZScsXG4gIH0sXG4gIHN0YWdlOiB7XG4gICAgb3B0aW9uczogc3RhZ2VzLm1hcChmdW5jdGlvbihzdGFnZSkge1xuICAgICAgcmV0dXJuIHN0YWdlLm5hbWU7XG4gICAgfSksXG4gICAgc2VsZWN0ZWQ6ICdBJyxcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZXR0aW5ncztcbiIsInZhciBzdGFnZXMgPSBbe1xuICBcIm5hbWVcIjogXCJBXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzEwLCA3XSxcbiAgICAgIFs0NSwgN10sXG4gICAgICBbMjcsIDE1XSxcbiAgICAgIFsxMCwgMjVdLFxuICAgICAgWzQ1LCAyNV0sXG4gICAgICBbMTAsIDQ0XSxcbiAgICAgIFs0NSwgNDRdLFxuICAgICAgWzI3LCA1Ml0sXG4gICAgICBbMTAsIDYyXSxcbiAgICAgIFs0NSwgNjJdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwiZ3JlZW5cIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFtdLFxuICBcImZvcmVncm91bmRcIjogXCJjbGVhclwiLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDAgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDAgfSxcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDE4IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiAxOCB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiMyOEYxMjlcIlxufSx7XG4gIFwibmFtZVwiOiBcIkJcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbMjcsIDZdLFxuICAgICAgWzEwLCAxM10sXG4gICAgICBbNDUsIDEzXSxcbiAgICAgIFs0LCAyMl0sXG4gICAgICBbNTAsIDIyXSxcbiAgICAgIFsxOCwgMzFdLFxuICAgICAgWzI3LCAzMV0sXG4gICAgICBbMzcsIDMxXSxcbiAgICAgIFs0LCA0NF0sXG4gICAgICBbNTAsIDQ0XSxcbiAgICAgIFsyNywgNjBdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwiYmx1ZVwiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW10sXG4gIFwiZm9yZWdyb3VuZFwiOiBcImNsZWFyXCIsXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogNiB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogNiB9LFxuICAgIHsgXCJ4XCI6IDksIFwieVwiOiAxNSB9LFxuICAgIHsgXCJ4XCI6IDU0LCBcInlcIjogMTUgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjMjhENkYxXCJcbn0se1xuICBcIm5hbWVcIjogXCJDXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzgsIDM0XSxcbiAgICAgIFsxMiwgMzRdLFxuICAgICAgWzIyLCAzNF0sXG4gICAgICBbMzEsIDM0XSxcbiAgICAgIFs0MSwgMzRdLFxuICAgICAgWzQ2LCAzNF0sXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwiZ3JheVwiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW10sXG4gIFwiZm9yZWdyb3VuZFwiOiBcImNsZWFyXCIsXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDEwLCBcInlcIjogMjcgfSxcbiAgICB7IFwieFwiOiAxOSwgXCJ5XCI6IDI3IH0sXG4gICAgeyBcInhcIjogNDEsIFwieVwiOiAyNyB9LFxuICAgIHsgXCJ4XCI6IDUwLCBcInlcIjogMjcgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjOEQ4RDhEXCJcbn0se1xuICBcIm5hbWVcIjogXCJEXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzEwLCAxM10sXG4gICAgICBbNDUsIDEzXSxcbiAgICAgIFsyNywgMjFdLFxuICAgICAgWzEwLCAzMV0sXG4gICAgICBbNDUsIDMxXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcImJyb3duXCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbXSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAyNCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMjQgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjNzgzRTA4XCJcbn1dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YWdlcztcbiIsInZhciByZXNpemUgPSBmdW5jdGlvbiByZXNpemUoKSB7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUuem9vbSA9IHdpbmRvdy5pbm5lcldpZHRoIC8gZ2FtZS53aWR0aDtcbn07XG5cbnZhciBtYWluID0ge1xuICBwcmVsb2FkOiBmdW5jdGlvbiBwcmVsb2FkKCkge1xuICAgIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcblxuICAgIHJlc2l6ZSgpO1xuICAgIHdpbmRvdy5vbnJlc2l6ZSA9IHV0aWxzLmRlYm91bmNlKHJlc2l6ZSwgMTAwKTtcbiAgICBcbiAgICAvLyBhbGxvdyBhbnl0aGluZyB1cCB0byBoZWlnaHQgb2Ygd29ybGQgdG8gZmFsbCBvZmYtc2NyZWVuIHVwIG9yIGRvd25cbiAgICBnYW1lLndvcmxkLnNldEJvdW5kcygwLCAtZ2FtZS53aWR0aCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQgKiAzKTtcbiAgICBcbiAgICAvLyBwcmV2ZW50IGdhbWUgcGF1c2luZyB3aGVuIGl0IGxvc2VzIGZvY3VzXG4gICAgZ2FtZS5zdGFnZS5kaXNhYmxlVmlzaWJpbGl0eUNoYW5nZSA9IHRydWU7XG4gICAgXG4gICAgLy8gYXNzZXRzIHVzZWQgaW4gc3BsYXNoIHNjcmVlbiBpbnRybyBhbmltYXRpb25cbiAgICBnYW1lLmxvYWQuaW1hZ2UoJ3B1cnBsZScsICdpbWFnZXMvcHVycGxlLnBuZycpO1xuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5zdGFydCgpO1xuXG4gICAgZ2FtZS5zdGF0ZS5hZGQoJ3NwbGFzaCcsIHJlcXVpcmUoJy4vc3RhdGVzL3NwbGFzaC5qcycpKGdhbWUpKTtcbiAgICBnYW1lLnN0YXRlLmFkZCgncGxheScsIHJlcXVpcmUoJy4vc3RhdGVzL3BsYXkuanMnKShnYW1lKSk7XG5cbiAgICBnYW1lLnN0YXRlLnN0YXJ0KCdzcGxhc2gnKTtcbiAgfVxufTtcblxudmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoNjQsIDY0LCBQaGFzZXIuQVVUTywgJ2dhbWUnLCB7XG4gIHByZWxvYWQ6IG1haW4ucHJlbG9hZCxcbiAgY3JlYXRlOiBtYWluLmNyZWF0ZVxufSwgZmFsc2UsIGZhbHNlKTsgLy8gZGlzYWJsZSBhbnRpLWFsaWFzaW5nXG5cbmdhbWUuc3RhdGUuYWRkKCdtYWluJywgbWFpbik7XG5nYW1lLnN0YXRlLnN0YXJ0KCdtYWluJyk7XG4iLCJ2YXIgYnVpbGRNZW51ID0gZnVuY3Rpb24gYnVpbGRNZW51KGdhbWUsIHN0YXRlKSB7XG4gIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4vZGF0YS9zZXR0aW5ncy5qcycpO1xuXG4gIHZhciBjeWNsZVNldHRpbmcgPSBmdW5jdGlvbiBjeWNsZVNldHRpbmcoKSB7XG4gICAgdmFyIG9wdGlvbkluZGV4ID0gdGhpcy5zZXR0aW5nLm9wdGlvbnMuaW5kZXhPZih0aGlzLnNldHRpbmcuc2VsZWN0ZWQpO1xuICAgIG9wdGlvbkluZGV4Kys7XG4gICAgaWYgKG9wdGlvbkluZGV4ID09PSB0aGlzLnNldHRpbmcub3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgIG9wdGlvbkluZGV4ID0gMDtcbiAgICB9XG4gICAgdGhpcy5zZXR0aW5nLnNlbGVjdGVkID0gdGhpcy5zZXR0aW5nLm9wdGlvbnNbb3B0aW9uSW5kZXhdO1xuICB9O1xuXG4gIHZhciBtZW51ID0gW3tcbiAgICBuYW1lOiAnUGxheWVycycsXG4gICAgc2V0dGluZzogc2V0dGluZ3MucGxheWVyQ291bnQsXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGN5Y2xlU2V0dGluZy5jYWxsKHRoaXMpO1xuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH0sXG4gICAgc2VsZWN0ZWQ6IHRydWVcbiAgfSwgLyp7XG4gICAgbmFtZTogJ0JHTScsXG4gICAgc2V0dGluZzogc2V0dGluZ3MuYmdtLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcbiAgICAgIHN0YXRlLnJlc2V0TXVzaWMoc2V0dGluZ3MpO1xuICAgIH0sXG4gIH0sKi8ge1xuICAgIG5hbWU6ICdTdGFnZScsXG4gICAgc2V0dGluZzogc2V0dGluZ3Muc3RhZ2UsXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGN5Y2xlU2V0dGluZy5jYWxsKHRoaXMpO1xuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH0sXG4gIH0sIHtcbiAgICBuYW1lOiAnU3RhcnQnLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBzdGF0ZS5yZXN0YXJ0KCk7XG4gICAgfVxuICB9XTtcblxuICB2YXIgY2hhbmdlUGxheWVyQ291bnQgPSBtZW51WzBdLmFjdGlvbi5iaW5kKG1lbnVbMF0pO1xuICB2YXIgY2hhbmdlU3RhZ2UgPSBtZW51WzFdLmFjdGlvbi5iaW5kKG1lbnVbMV0pO1xuICB2YXIgcmVzdGFydCA9IG1lbnVbMl0uYWN0aW9uLmJpbmQobWVudVsyXSk7XG5cbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLlApLm9uRG93bi5hZGQoY2hhbmdlUGxheWVyQ291bnQpO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuTSkub25Eb3duLmFkZChjaGFuZ2VTdGFnZSk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5FTlRFUikub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5zdXBwb3J0ZWQgJiYgZ2FtZS5pbnB1dC5nYW1lcGFkLmFjdGl2ZSkge1xuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDIuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMi5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQzLmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkNC5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtZW51O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBidWlsZE1lbnU7XG4iLCJ2YXIgY3JlYXRlUGxheWVyID0gZnVuY3Rpb24gY3JlYXRlUGxheWVyKGdhbWUsIG9wdGlvbnMsIG9uRGVhdGgpIHtcbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIG9yaWVudGF0aW9uOiAncmlnaHQnLFxuICAgIGtleXM6IHtcbiAgICAgIHVwOiAnVVAnLFxuICAgICAgZG93bjogJ0RPV04nLFxuICAgICAgbGVmdDogJ0xFRlQnLFxuICAgICAgcmlnaHQ6ICdSSUdIVCcsXG4gICAgICBhdHRhY2s6ICdTSElGVCdcbiAgICB9LFxuICAgIHNjYWxlOiB7XG4gICAgICB4OiAxLFxuICAgICAgeTogMlxuICAgIH0sXG4gICAgY29sb3I6ICdwaW5rJyxcbiAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgfTtcblxuICB2YXIgc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgdmFyIGtleXMgPSB7XG4gICAgdXA6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnVwXSksXG4gICAgZG93bjogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuZG93bl0pLFxuICAgIGxlZnQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmxlZnRdKSxcbiAgICByaWdodDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMucmlnaHRdKSxcbiAgICBhdHRhY2s6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmF0dGFja10pLFxuICB9O1xuXG4gIHZhciBnYW1lcGFkID0gc2V0dGluZ3MuZ2FtZXBhZDtcblxuICB2YXIgc2Z4ID0gcmVxdWlyZSgnLi9zZnguanMnKTtcblxuICB2YXIgYWN0aW9ucyA9IHtcbiAgICBhdHRhY2s6IGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDIwMDtcbiAgICAgIHZhciBpbnRlcnZhbCA9IDQwMDtcbiAgICAgIHZhciB2ZWxvY2l0eSA9IDEwMDtcblxuICAgICAgdmFyIGNhbkF0dGFjayA9IChEYXRlLm5vdygpID4gcGxheWVyLmxhc3RBdHRhY2tlZCArIGludGVydmFsKSAmJiAhcGxheWVyLmlzRHVja2luZyAmJiAhcGxheWVyLmlzUGVybWFkZWFkO1xuICAgICAgaWYgKCFjYW5BdHRhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSB0cnVlO1xuICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IERhdGUubm93KCk7XG5cbiAgICAgIHNmeC5hdHRhY2soKTtcblxuICAgICAgc3dpdGNoKHBsYXllci5vcmllbnRhdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLXZlbG9jaXR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIubG9hZFRleHR1cmUoJ3doaXRlJyk7XG4gICAgICBzZXRUaW1lb3V0KGFjdGlvbnMuZW5kQXR0YWNrLCBkdXJhdGlvbik7XG4gICAgfSxcblxuICAgIGVuZEF0dGFjazogZnVuY3Rpb24gZW5kQXR0YWNrKCkge1xuICAgICAgaWYgKHBsYXllci5pc0F0dGFja2luZykge1xuICAgICAgICBwbGF5ZXIubG9hZFRleHR1cmUoc2V0dGluZ3MuY29sb3IpO1xuICAgICAgICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcnVuOiBmdW5jdGlvbiBydW4oZGlyZWN0aW9uKSB7XG4gICAgICB2YXIgbWF4U3BlZWQgPSAzMjtcbiAgICAgIHZhciBhY2NlbGVyYXRpb24gPSBwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duID8gOCA6IDM7IC8vIHBsYXllcnMgaGF2ZSBsZXNzIGNvbnRyb2wgaW4gdGhlIGFpclxuICAgICAgcGxheWVyLm9yaWVudGF0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAvLyBpZiBwbGF5ZXIgaXMgZ29pbmcgZmFzdGVyIHRoYW4gbWF4IHJ1bm5pbmcgc3BlZWQgKGR1ZSB0byBhdHRhY2ssIGV0YyksIHNsb3cgdGhlbSBkb3duIG92ZXIgdGltZVxuICAgICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IDwgLW1heFNwZWVkKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICs9IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWF4KHBsYXllci5ib2R5LnZlbG9jaXR5LnggLSBhY2NlbGVyYXRpb24sIC1tYXhTcGVlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPiBtYXhTcGVlZCkge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSBhY2NlbGVyYXRpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1pbihwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICsgYWNjZWxlcmF0aW9uLCBtYXhTcGVlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBqdW1wOiBmdW5jdGlvbiBqdW1wKCkge1xuICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24pIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMDA7XG4gICAgICAgIHNmeC5qdW1wKCk7XG4gICAgICAvLyB3YWxsIGp1bXBzXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmxlZnQpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMjA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSA0NTtcbiAgICAgICAgc2Z4Lmp1bXAoKTtcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcucmlnaHQpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMjA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAtNDU7XG4gICAgICAgIHNmeC5qdW1wKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGRhbXBlbkp1bXA6IGZ1bmN0aW9uIGRhbXBlbkp1bXAoKSB7XG4gICAgICAvLyBzb2Z0ZW4gdXB3YXJkIHZlbG9jaXR5IHdoZW4gcGxheWVyIHJlbGVhc2VzIGp1bXAga2V5XG4gICAgICAgIHZhciBkYW1wZW5Ub1BlcmNlbnQgPSAwLjU7XG5cbiAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSAqPSBkYW1wZW5Ub1BlcmNlbnQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHVjazogZnVuY3Rpb24gZHVjaygpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNBdHRhY2tpbmcgfHwgcGxheWVyLmlzUGVybWFkZWFkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwbGF5ZXIuaXNEdWNraW5nICYmIHBsYXllci5ocCA+IDIpIHtcbiAgICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkgLyAyKTtcbiAgICAgICAgcGxheWVyLnkgKz0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSB0cnVlO1xuXG4gICAgICAoZnVuY3Rpb24gcm9sbCgpIHtcbiAgICAgICAgdmFyIGNhblJvbGwgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA+IDI1ICYmIHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd247XG4gICAgICAgIGlmIChjYW5Sb2xsKSB7XG4gICAgICAgICAgcGxheWVyLmlzUm9sbGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0oKSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAyKSB7XG4gICAgICAgIHBsYXllci55IC09IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgICAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICAgICAgcGxheWVyLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbiB0YWtlRGFtYWdlKGFtb3VudCkge1xuICAgICAgLy8gcHJldmVudCB0YWtpbmcgbW9yZSBkYW1hZ2UgdGhhbiBocCByZW1haW5pbmcgaW4gY3VycmVudCBsaWZlXG4gICAgICBpZiAoYW1vdW50ID4gMSAmJiAocGxheWVyLmhwIC0gYW1vdW50KSAlIDIgIT09IDApIHtcbiAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmhwIC09IGFtb3VudDtcblxuICAgICAgaWYgKHBsYXllci5ocCA8IDApIHtcbiAgICAgICAgcGxheWVyLmhwID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChwbGF5ZXIuaHAgJSAyID09PSAwKSB7XG4gICAgICAgIGFjdGlvbnMuZGllKCk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgIH0sXG5cbiAgICBhcHBseUhlYWx0aEVmZmVjdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5ld1BsYXllckhlaWdodCA9IE1hdGgubWF4KE1hdGgucm91bmQocGxheWVyLmhwIC8gMiksIDEpO1xuICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIG5ld1BsYXllckhlaWdodCk7XG5cbiAgICAgIHZhciBuZXdQbGF5ZXJBbHBoYSA9IHBsYXllci5ocCAlIDIgPT09IDAgPyAxIDogMC43NTtcbiAgICAgIHBsYXllci5hbHBoYSA9IG5ld1BsYXllckFscGhhO1xuICAgIH0sXG5cbiAgICBkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5pc1Blcm1hZGVhZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAwKSB7XG4gICAgICAgIHNmeC5kaWUoKTtcbiAgICAgICAgYWN0aW9ucy5lbmRBdHRhY2soKTtcbiAgICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IDA7XG5cbiAgICAgICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICAgICAgICB2YXIgcmVzcGF3blBvc2l0aW9uID0gdXRpbHMuZ2V0UmFuZG9tQXJyYXlFbGVtZW50KHV0aWxzLmdldFN0YWdlKCkuc3Bhd25Qb2ludHMpO1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueCA9IHJlc3Bhd25Qb3NpdGlvbi54O1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueSA9IHJlc3Bhd25Qb3NpdGlvbi55O1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZngucGVybWFkaWUoKTtcbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKCd3aGl0ZScpO1xuICAgICAgICBwbGF5ZXIuaXNQZXJtYWRlYWQgPSB0cnVlO1xuICAgICAgICBvbkRlYXRoKCk7IC8vIFRPRE86IHRoaXMgY291bGQgcHJvYmFibHkgYmUgYmV0dGVyIGFyY2hpdGVjdGVkXG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHZhciBwbGF5ZXIgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgc2V0dGluZ3MuY29sb3IpO1xuICBwbGF5ZXIubmFtZSA9IHNldHRpbmdzLm5hbWU7XG4gIHBsYXllci5vcmllbnRhdGlvbiA9IHNldHRpbmdzLm9yaWVudGF0aW9uO1xuXG4gIC8vIHRyYWNrIGhlYWx0aFxuICBwbGF5ZXIuaHAgPSBwbGF5ZXIubWF4SHAgPSA2OyAvLyBUT0RPOiBhbGxvdyBzZXR0aW5nIGN1c3RvbSBocCBhbW91bnQgZm9yIGVhY2ggcGxheWVyXG4gIHBsYXllci5hY3Rpb25zID0gYWN0aW9ucztcbiAgcGxheWVyLmFjdGlvbnMuYXBwbHlIZWFsdGhFZmZlY3RzKCk7IC8vIFRPRE86IGFkZCBnaWFudCBtb2RlXG5cbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5lbmFibGUocGxheWVyKTtcbiAgcGxheWVyLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgcGxheWVyLmJvZHkuYm91bmNlLnkgPSAwLjI7IC8vIFRPRE86IGFsbG93IGJvdW5jZSBjb25maWd1cmF0aW9uXG4gIHBsYXllci5ib2R5LmdyYXZpdHkueSA9IDM4MDsgLy8gVE9ETzogYWxsb3cgZ3Jhdml0eSBjb25maWd1cmF0aW9uXG5cbiAgcGxheWVyLnVwV2FzRG93biA9IGZhbHNlOyAvLyB0cmFjayBpbnB1dCBjaGFuZ2UgZm9yIHZhcmlhYmxlIGp1bXAgaGVpZ2h0XG4gIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzUGVybWFkZWFkID0gZmFsc2U7XG4gIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuXG5cbiAgLy8gcGhhc2VyIGFwcGFyZW50bHkgYXV0b21hdGljYWxseSBjYWxscyBhbnkgZnVuY3Rpb24gbmFtZWQgdXBkYXRlIGF0dGFjaGVkIHRvIGEgc3ByaXRlIVxuICBwbGF5ZXIudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8ga2lsbCBwbGF5ZXIgaWYgaGUgZmFsbHMgb2ZmIHRoZSBzY3JlZW5cbiAgICBpZiAocGxheWVyLnBvc2l0aW9uLnkgPiA2NCAmJiBwbGF5ZXIuaHAgIT09IDApIHsgLy8gVE9ETzogaG93IHRvIGFjY2VzcyBuYXRpdmUgaGVpZ2h0IGZyb20gZ2FtZS5qcz9cbiAgICAgIGFjdGlvbnMudGFrZURhbWFnZSgyKTtcbiAgICB9XG5cbiAgICB2YXIgaW5wdXQgPSB7XG4gICAgICBsZWZ0OiAgIChrZXlzLmxlZnQuaXNEb3duICYmICFrZXlzLnJpZ2h0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSAmJiAhZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1JJR0hUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA8IC0wLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPCAtMC4xLFxuICAgICAgcmlnaHQ6ICAoa2V5cy5yaWdodC5pc0Rvd24gJiYgIWtleXMubGVmdC5pc0Rvd24pIHx8XG4gICAgICAgICAgICAgIChnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfTEVGVCkpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWCkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPiAwLjEsXG4gICAgICB1cDogICAgIGtleXMudXAuaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9VUCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9BKSxcbiAgICAgIGRvd246ICAga2V5cy5kb3duLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfRE9XTikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9ZKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9ZKSA+IDAuMSxcbiAgICAgIGF0dGFjazoga2V5cy5hdHRhY2suaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9YKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0IpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0xFRlRfVFJJR0dFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX1RSSUdHRVIpLFxuICAgIH07XG5cbiAgICBpZiAoaW5wdXQubGVmdCkge1xuICAgICAgYWN0aW9ucy5ydW4oJ2xlZnQnKTtcbiAgICB9IGVsc2UgaWYgKGlucHV0LnJpZ2h0KSB7XG4gICAgICBhY3Rpb25zLnJ1bigncmlnaHQnKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgIXBsYXllci5pc1JvbGxpbmcpIHtcbiAgICAgIC8vIGFwcGx5IGZyaWN0aW9uXG4gICAgICBpZiAoTWF0aC5hYnMocGxheWVyLmJvZHkudmVsb2NpdHkueCkgPCAyKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKj0gMC41OyAvLyBxdWlja2x5IGJyaW5nIHNsb3ctbW92aW5nIHBsYXllcnMgdG8gYSBzdG9wXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPiAwKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gMjtcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IDApIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCArPSAyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbnB1dC51cCkge1xuICAgICAgcGxheWVyLnVwV2FzRG93biA9IHRydWU7XG4gICAgICBhY3Rpb25zLmp1bXAoKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci51cFdhc0Rvd24pIHtcbiAgICAgIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTtcbiAgICAgIGFjdGlvbnMuZGFtcGVuSnVtcCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5kb3duKSB7XG4gICAgICBhY3Rpb25zLmR1Y2soKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgIGFjdGlvbnMuc3RhbmQoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuYXR0YWNrKSB7XG4gICAgICBhY3Rpb25zLmF0dGFjaygpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gcGxheWVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQbGF5ZXI7XG4iLCJ2YXIgc2Z4ID0gKGZ1bmN0aW9uIHNmeCgpIHtcbiAgUG9seXN5bnRoID0gcmVxdWlyZSgnc3VicG9seScpO1xuXG4gIHZhciBhdWRpb0N0eDtcbiAgaWYgKHR5cGVvZiBBdWRpb0NvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgfSBlbHNlIHtcbiAgICBhdWRpb0N0eCA9IG5ldyB3ZWJraXRBdWRpb0NvbnRleHQoKTtcbiAgfVxuXG4gIHZhciBwdWxzZSA9IG5ldyBQb2x5c3ludGgoYXVkaW9DdHgsIHtcbiAgICB3YXZlZm9ybTogJ3NxdWFyZScsXG4gICAgcmVsZWFzZTogMC4wMSxcbiAgICBudW1Wb2ljZXM6IDRcbiAgfSk7XG4gIFxuICBmdW5jdGlvbiBnZXROb3codm9pY2UpIHtcbiAgICB2YXIgbm93ID0gdm9pY2UuYXVkaW9DdHguY3VycmVudFRpbWU7XG4gICAgcmV0dXJuIG5vdztcbiAgfTtcbiAgXG4gIHZhciBqdW1wVGltZW91dCwgYXR0YWNrVGltZW91dDtcbiAgdmFyIGRpZVRpbWVvdXRzID0gW107XG5cbiAgdmFyIHNvdW5kRWZmZWN0cyA9IHtcbiAgICBqdW1wOiBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyVGltZW91dChqdW1wVGltZW91dCk7XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1swXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDAuMTsgLy8gaW4gc2Vjb25kc1xuICAgICAgXG4gICAgICB2b2ljZS5waXRjaCg0NDApO1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgdmFyIG5vdyA9IGdldE5vdyh2b2ljZSk7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDg4MCwgbm93ICsgZHVyYXRpb24pO1xuICAgICAganVtcFRpbWVvdXQgPSBzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogMTAwMCk7XG4gICAgfSxcblxuICAgIGF0dGFjazogZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhclRpbWVvdXQoYXR0YWNrVGltZW91dCk7XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1sxXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDAuMTsgLy8gaW4gc2Vjb25kc1xuICAgICAgXG4gICAgICB2b2ljZS5waXRjaCg4ODApO1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgdmFyIG5vdyA9IGdldE5vdyh2b2ljZSk7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAsIG5vdyArIGR1cmF0aW9uKTtcbiAgICAgIGF0dGFja1RpbWVvdXQgPSBzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogMTAwMCk7XG4gICAgfSxcbiAgICBcbiAgICBib3VuY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGF0dGFja1RpbWVvdXQpO1xuICAgICAgXG4gICAgICB2YXIgdm9pY2UgPSBwdWxzZS52b2ljZXNbMl07XG4gICAgICB2YXIgZHVyYXRpb24gPSAwLjE7IC8vIGluIHNlY29uZHNcbiAgICAgIFxuICAgICAgdm9pY2UucGl0Y2goNDQwKTtcbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG5cbiAgICAgIHZhciBub3cgPSBnZXROb3codm9pY2UpO1xuICAgICAgdm9pY2Uub3NjLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgyMjAsIG5vdyArIGR1cmF0aW9uIC8gMik7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDY2MCwgbm93ICsgZHVyYXRpb24pO1xuICAgICAgYXR0YWNrVGltZW91dCA9IHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiAxMDAwKTtcbiAgICB9LFxuICAgIFxuICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICB3aGlsZSAoZGllVGltZW91dHMubGVuZ3RoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChkaWVUaW1lb3V0cy5wb3AoKSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1szXTtcbiAgICAgIHZhciBwaXRjaGVzID0gWzQ0MCwgMjIwLCAxMTBdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMTAwO1xuXG4gICAgICB2b2ljZS5zdGFydCgpO1xuICAgICAgXG4gICAgICBwaXRjaGVzLmZvckVhY2goZnVuY3Rpb24ocGl0Y2gsIGkpIHtcbiAgICAgICAgZGllVGltZW91dHMucHVzaChzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZvaWNlLnBpdGNoKHBpdGNoKTtcbiAgICAgICAgfSwgaSAqIGR1cmF0aW9uKSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZGllVGltZW91dHMucHVzaChzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogcGl0Y2hlcy5sZW5ndGgpKTtcbiAgICB9LFxuICAgIHBlcm1hZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdwZXJtYWR5aW5nJyk7XG4gICAgICB3aGlsZSAoZGllVGltZW91dHMubGVuZ3RoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChkaWVUaW1lb3V0cy5wb3AoKSk7XG4gICAgICB9XG5cbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1szXTtcbiAgICAgIHZhciBwaXRjaGVzID0gWzIyMCwgMTk2LCAxODVdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMjAwO1xuXG4gICAgICB2b2ljZS5zdGFydCgpO1xuXG4gICAgICBwaXRjaGVzLmZvckVhY2goZnVuY3Rpb24ocGl0Y2gsIGkpIHtcbiAgICAgICAgZGllVGltZW91dHMucHVzaChzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZvaWNlLnBpdGNoKHBpdGNoKTtcbiAgICAgICAgfSwgaSAqIGR1cmF0aW9uKSk7XG4gICAgICB9KTtcblxuICAgICAgZGllVGltZW91dHMucHVzaChzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogcGl0Y2hlcy5sZW5ndGgpKTtcbiAgICB9XG4gIH07XG4gIFxuICByZXR1cm4gc291bmRFZmZlY3RzO1xufSgpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZng7XG4iLCJ2YXIgc3RhZ2VCdWlsZGVyID0gZnVuY3Rpb24gc3RhZ2VCdWlsZGVyKGdhbWUpIHtcbiAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzLmpzJyk7XG4gIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMuanMnKTtcbiAgdmFyIHN0YWdlID0gdXRpbHMuZ2V0U3RhZ2UoKTtcblxuICBnYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IHN0YWdlLmJhY2tncm91bmRDb2xvcjtcblxuICB2YXIgYnVpbGRQbGF0Zm9ybXMgPSBmdW5jdGlvbiBidWlsZFBsYXRmb3JtcygpIHtcbiAgICB2YXIgcGxhdGZvcm1zID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgICBwbGF0Zm9ybXMuZW5hYmxlQm9keSA9IHRydWU7XG5cbiAgICB2YXIgcGxhdGZvcm1Qb3NpdGlvbnMgPSBzdGFnZS5wbGF0Zm9ybXMucG9zaXRpb25zO1xuICAgIHBsYXRmb3JtUG9zaXRpb25zLmZvckVhY2goZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICAgIHZhciBwbGF0Zm9ybSA9IHBsYXRmb3Jtcy5jcmVhdGUocG9zaXRpb25bMF0sIHBvc2l0aW9uWzFdLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpO1xuICAgICAgcGxhdGZvcm0uc2NhbGUuc2V0VG8oNSwgMSk7XG4gICAgICBwbGF0Zm9ybS5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gICAgfSk7XG5cbiAgICB2YXIgd2FsbHMgPSBbXTtcbiAgICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoLTMsIC0zLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpKTtcbiAgICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoNjEsIC0zLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpKTtcbiAgICB3YWxscy5mb3JFYWNoKGZ1bmN0aW9uKHdhbGwpIHtcbiAgICAgIHdhbGwuc2NhbGUuc2V0VG8oMywgMzUpO1xuICAgICAgd2FsbC5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gICAgfSk7XG5cbiAgICB2YXIgY2VpbGluZyA9IHBsYXRmb3Jtcy5jcmVhdGUoMCwgLTEyLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpO1xuICAgIGNlaWxpbmcuc2NhbGUuc2V0VG8oMzIsIDMpO1xuICAgIGNlaWxpbmcuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIFxuICAgIHJldHVybiBwbGF0Zm9ybXM7XG4gIH07XG5cbiAgdmFyIGJ1aWxkQmFja2dyb3VuZHMgPSBmdW5jdGlvbiBidWlsZEJhY2tncm91bmRzKCkge1xuICAgIHZhciBiYWNrZ3JvdW5kcyA9IGdhbWUuYWRkLmdyb3VwKCk7XG5cbiAgICBzdGFnZS5iYWNrZ3JvdW5kcy5mb3JFYWNoKGZ1bmN0aW9uKGxheWVyKSB7XG4gICAgICB2YXIgYmc7XG4gICAgICBpZiAobGF5ZXIuc2Nyb2xsaW5nKSB7XG4gICAgICAgIGJnID0gZ2FtZS5hZGQudGlsZVNwcml0ZSgwLCAwLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCwgbGF5ZXIuaW1hZ2UpO1xuICAgICAgICBiYWNrZ3JvdW5kcy5sb29wID0gZ2FtZS50aW1lLmV2ZW50cy5sb29wKFBoYXNlci5UaW1lci5RVUFSVEVSLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBiZy50aWxlUG9zaXRpb24ueCAtPTE7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmcgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgbGF5ZXIuaW1hZ2UpO1xuICAgICAgfVxuICAgICAgYmFja2dyb3VuZHMuYWRkKGJnKTtcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gYmFja2dyb3VuZHM7XG4gIH07XG5cbiAgdmFyIGJ1aWxkRm9yZWdyb3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmb3JlZ3JvdW5kID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIHN0YWdlLmZvcmVncm91bmQpO1xuICAgIHJldHVybiBmb3JlZ3JvdW5kO1xuICB9O1xuICBcbiAgcmV0dXJuIHtcbiAgICBidWlsZFBsYXRmb3JtczogYnVpbGRQbGF0Zm9ybXMsXG4gICAgYnVpbGRGb3JlZ3JvdW5kOiBidWlsZEZvcmVncm91bmQsXG4gICAgYnVpbGRCYWNrZ3JvdW5kczogYnVpbGRCYWNrZ3JvdW5kc1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzdGFnZUJ1aWxkZXI7XG4iLCJ2YXIgUGxheSA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHBsYXkgPSB7XG4gICAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHNlbGYuc2Z4ID0gcmVxdWlyZSgnLi4vc2Z4LmpzJyk7XG4gICAgICBzZWxmLnN1YlVpID0gZ2FtZS5hZGQuZ3JvdXAoKTsgLy8gcGxhY2UgdG8ga2VlcCBhbnl0aGluZyBvbi1zY3JlZW4gdGhhdCdzIG5vdCBVSSB0byBkZXB0aCBzb3J0IGJlbG93IFVJXG5cbiAgICAgIC8vIGdhbWUgb3ZlciBtZXNzYWdlXG4gICAgICB2YXIgZm9udCA9IHJlcXVpcmUoJy4uL2RhdGEvZm9udC5qcycpO1xuICAgICAgc2VsZi50ZXh0ID0gZ2FtZS5hZGQudGV4dCgwLCAwLCAnJywgZm9udCk7XG4gICAgICBzZWxmLnRleHQuc2V0VGV4dEJvdW5kcygwLCAwLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCk7XG4gICAgICBcbiAgICAgIC8vIG1lbnVcbiAgICAgIHZhciBidWlsZE1lbnUgPSByZXF1aXJlKCcuLi9tZW51LmpzJyk7XG4gICAgICBidWlsZE1lbnUoZ2FtZSwgc2VsZik7IC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIGFwcHJvYWNoIHRoYW4gaW5qZWN0aW5nIHRoZSB3aG9sZSBzdGF0ZSBpbnRvIHRoZSBtZW51IHRvIGxldCBpdCBhY2Nlc3MgZnVuY3Rpb25zIGZvciByZXNldHRpbmcgc3RhZ2UsIHBsYXllcnMsIG11c2ljP1xuXG4gICAgICBzZWxmLnJlc3RhcnQoKTtcbiAgICAgIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIHJlc2V0TXVzaWM6IGZ1bmN0aW9uKHNldHRpbmdzKSB7XG4gICAgICAvLyBwbGF5IG11c2ljXG4gICAgICBpZiAodGhpcy5tdXNpYykge1xuICAgICAgICB0aGlzLm11c2ljLnN0b3AoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZXR0aW5ncy5iZ20uc2VsZWN0ZWQgIT09ICdOb25lJykge1xuICAgICAgICB0aGlzLm11c2ljID0gZ2FtZS5hZGQuYXVkaW8oc2V0dGluZ3MuYmdtLnNlbGVjdGVkKTtcbiAgICAgICAgdGhpcy5tdXNpYy5sb29wRnVsbCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICByZXN0YXJ0OiBmdW5jdGlvbiByZXN0YXJ0KCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBsYXllcnMgPSByZXF1aXJlKCcuLi9kYXRhL3BsYXllcnMuanMnKShnYW1lKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL2RhdGEvc2V0dGluZ3MnKTtcbiAgICAgIHZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzLmpzJyk7XG4gICAgICB2YXIgc3RhZ2VCdWlsZGVyID0gcmVxdWlyZSgnLi4vc3RhZ2VCdWlsZGVyLmpzJykoZ2FtZSk7XG4gICAgICB2YXIgc3RhZ2UgPSB1dGlscy5nZXRTdGFnZSgpO1xuXG4gICAgICAvLyBkZXN0cm95IGFuZCByZWJ1aWxkIHN0YWdlIGFuZCBwbGF5ZXJzXG4gICAgICB2YXIgZGVzdHJveUdyb3VwID0gZnVuY3Rpb24gZGVzdHJveUdyb3VwKGdyb3VwKSB7XG4gICAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoZ3JvdXAuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGdyb3VwLmNoaWxkcmVuWzBdLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyb3VwLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgZGVzdHJveUdyb3VwKHNlbGYucGxheWVycyk7XG4gICAgICBkZXN0cm95R3JvdXAoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgZGVzdHJveUdyb3VwKHNlbGYuYmFja2dyb3VuZHMpO1xuXG4gICAgICAvLyBUT0RPOiB1Z2gsIGNsZWFuIHRoaXMgdXAhXG4gICAgICBpZiAoc2VsZi5iYWNrZ3JvdW5kcyAmJiBzZWxmLmJhY2tncm91bmRzLmxvb3ApIHtcbiAgICAgICAgZ2FtZS50aW1lLmV2ZW50cy5yZW1vdmUoc2VsZi5iYWNrZ3JvdW5kcy5sb29wKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLmZvcmVncm91bmQpIHtcbiAgICAgICAgc2VsZi5mb3JlZ3JvdW5kLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5wbGF0Zm9ybXMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRQbGF0Zm9ybXMoKTtcbiAgICAgIHNlbGYuYmFja2dyb3VuZHMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRCYWNrZ3JvdW5kcygpO1xuICAgICAgc2VsZi5zdWJVaS5hZGQoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgc2VsZi5zdWJVaS5hZGQoc2VsZi5iYWNrZ3JvdW5kcyk7XG5cbiAgICAgIHNlbGYucGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICBzZWxmLnN1YlVpLmFkZChzZWxmLnBsYXllcnMpO1xuXG4gICAgICB2YXIgYWRkUGxheWVyID0gZnVuY3Rpb24gYWRkUGxheWVyKHBsYXllcikge1xuICAgICAgICB2YXIgY2hlY2tGb3JHYW1lT3ZlciA9IGZ1bmN0aW9uIGNoZWNrRm9yR2FtZU92ZXIoKSB7XG4gICAgICAgICAgdmFyIGFsaXZlUGxheWVycyA9IFtdO1xuICAgICAgICAgIHNlbGYucGxheWVycy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKHBsYXllciwgaSkge1xuICAgICAgICAgICAgaWYgKCFwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgICAgICAgYWxpdmVQbGF5ZXJzLnB1c2gocGxheWVyLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChhbGl2ZVBsYXllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB2YXIgZm9udCA9IE9iamVjdC5hc3NpZ24oe30sIHJlcXVpcmUoJy4uL2RhdGEvZm9udC5qcycpLCB7ZmlsbDogc3RhZ2UudWlDb2xvcn0pO1xuICAgICAgICAgICAgc2VsZi50ZXh0LnNldFN0eWxlKGZvbnQpO1xuICAgICAgICAgICAgc2VsZi50ZXh0LnNldFRleHQoYWxpdmVQbGF5ZXJzWzBdICsgJyAgd2lucyFcXG4nKTtcbiAgICAgICAgICAgIHNlbGYudGV4dC52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYudGV4dC52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgIHNlbGYucmVzdGFydCgpO1xuICAgICAgICAgICAgfSwgMzAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgY3JlYXRlUGxheWVyID0gcmVxdWlyZSgnLi4vcGxheWVyLmpzJyk7XG4gICAgICAgIHZhciBuZXdQbGF5ZXIgPSBzZWxmLnBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIsIGNoZWNrRm9yR2FtZU92ZXIpKTtcbiAgICAgICAgdmFyIHBvcyA9IHN0YWdlLnNwYXduUG9pbnRzW2ldO1xuICAgICAgICBuZXdQbGF5ZXIucG9zaXRpb24ueCA9IHBvcy54O1xuICAgICAgICBuZXdQbGF5ZXIucG9zaXRpb24ueSA9IHBvcy55O1xuICAgICAgfTtcblxuICAgICAgLy9wbGF5ZXJzLmZvckVhY2goYWRkUGxheWVyKTtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxzZXR0aW5ncy5wbGF5ZXJDb3VudC5zZWxlY3RlZDsgaSsrKSB7XG4gICAgICAgIGFkZFBsYXllcihwbGF5ZXJzW2ldLCBpKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5mb3JlZ3JvdW5kID0gc3RhZ2VCdWlsZGVyLmJ1aWxkRm9yZWdyb3VuZCgpO1xuICAgICAgc2VsZi5zdWJVaS5hZGQoc2VsZi5mb3JlZ3JvdW5kKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBcbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllcnMsIHRoaXMucGxhdGZvcm1zKTtcbiAgICAgIC8vIFRPRE86IGhvdyBkbyBpIGRvIHRoaXMgb24gdGhlIHBsYXllciBpdHNlbGYgd2l0aG91dCBhY2Nlc3MgdG8gcGxheWVycz8gb3Igc2hvdWxkIGkgYWRkIGEgZnRuIHRvIHBsYXllciBhbmQgc2V0IHRoYXQgYXMgdGhlIGNiP1xuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMucGxheWVycywgdGhpcy5wbGF5ZXJzLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJDb2xsaXNpb24ocGxheWVyQSwgcGxheWVyQikge1xuICAgICAgICAgLyogbGV0J3Mgbm90IGtub2NrIGFueWJvZHkgYXJvdW5kIGlmIHNvbWV0aGluZydzIG9uIG9uZSBvZiB0aGVzZSBkdWRlcycvZHVkZXR0ZXMnIGhlYWRzLlxuICAgICAgICAgcHJldmVudHMgY2Fubm9uYmFsbCBhdHRhY2tzIGFuZCB0aGUgbGlrZSwgYW5kIGFsbG93cyBzdGFuZGluZyBvbiBoZWFkcy5cbiAgICAgICAgIG5vdGU6IHN0aWxsIG5lZWQgdG8gY29sbGlkZSBpbiBvcmRlciB0byB0ZXN0IHRvdWNoaW5nLnVwLCBzbyBkb24ndCBtb3ZlIHRoaXMgdG8gYWxsb3dQbGF5ZXJDb2xsaXNpb24hICovXG4gICAgICAgIGlmIChwbGF5ZXJBLmJvZHkudG91Y2hpbmcudXAgfHwgcGxheWVyQi5ib2R5LnRvdWNoaW5nLnVwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllcikge1xuICAgICAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSBmYWxzZTtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGJvdW5jZSgpIHtcbiAgICAgICAgICBzZWxmLnNmeC5ib3VuY2UoKTtcblxuICAgICAgICAgIHZhciBib3VuY2VWZWxvY2l0eSA9IDUwO1xuICAgICAgICAgIHZhciB2ZWxvY2l0eUEsIHZlbG9jaXR5QjtcbiAgICAgICAgICB2ZWxvY2l0eUEgPSB2ZWxvY2l0eUIgPSBib3VuY2VWZWxvY2l0eTtcbiAgICAgICAgICBpZiAocGxheWVyQS5wb3NpdGlvbi54ID4gcGxheWVyQi5wb3NpdGlvbi54KSB7XG4gICAgICAgICAgICB2ZWxvY2l0eUIgKj0gLTE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZlbG9jaXR5QSAqPSAtMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGxheWVyQS5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eUE7XG4gICAgICAgICAgcGxheWVyQi5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eUI7XG4gICAgICAgICAgcGxheWVyQS5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICBwbGF5ZXJCLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZmxpbmcoKSB7XG4gICAgICAgICAgc2VsZi5zZnguYm91bmNlKCk7XG5cbiAgICAgICAgICB2YXIgcGxheWVyVG9GbGluZztcbiAgICAgICAgICB2YXIgcGxheWVyVG9MZWF2ZTtcbiAgICAgICAgICBpZiAocGxheWVyQS5pc0R1Y2tpbmcpIHtcbiAgICAgICAgICAgIHBsYXllclRvRmxpbmcgPSBwbGF5ZXJCO1xuICAgICAgICAgICAgcGxheWVyVG9MZWF2ZSA9IHBsYXllckE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllclRvRmxpbmcgPSBwbGF5ZXJBO1xuICAgICAgICAgICAgcGxheWVyVG9MZWF2ZSA9IHBsYXllckI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXJUb0ZsaW5nKTtcbiAgICAgICAgICB2YXIgZmxpbmdYVmVsb2NpdHkgPSA3NTtcbiAgICAgICAgICBpZiAocGxheWVyVG9GbGluZy5wb3NpdGlvbi54ID4gcGxheWVyVG9MZWF2ZS5wb3NpdGlvbi54KSB7XG4gICAgICAgICAgICBmbGluZ1hWZWxvY2l0eSAqPSAtMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGxheWVyVG9GbGluZy5ib2R5LnZlbG9jaXR5LnggPSBmbGluZ1hWZWxvY2l0eTtcbiAgICAgICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueSA9IC03NTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHBvcCgpIHtcbiAgICAgICAgICBzZWxmLnNmeC5ib3VuY2UoKTtcblxuICAgICAgICAgIHZhciBwbGF5ZXJUb1BvcDtcbiAgICAgICAgICBpZiAocGxheWVyQS5pc1JvbGxpbmcpIHtcbiAgICAgICAgICAgIHBsYXllclRvUG9wID0gcGxheWVyQjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJBO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyVG9Qb3ApO1xuICAgICAgICAgIHBsYXllclRvUG9wLmJvZHkudmVsb2NpdHkueSA9IC03NTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBib3RoUm9sbGluZyA9IHBsYXllckEuaXNSb2xsaW5nICYmIHBsYXllckIuaXNSb2xsaW5nO1xuICAgICAgICB2YXIgYm90aFN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nICYmICFwbGF5ZXJCLmlzRHVja2luZztcbiAgICAgICAgdmFyIG5laXRoZXJSb2xsaW5nID0gIXBsYXllckEuaXNSb2xsaW5nICYmICFwbGF5ZXJCLmlzUm9sbGluZztcbiAgICAgICAgdmFyIGVpdGhlckR1Y2tpbmcgPSBwbGF5ZXJBLmlzRHVja2luZyB8fCBwbGF5ZXJCLmlzRHVja2luZztcbiAgICAgICAgdmFyIGVpdGhlclJ1bm5pbmcgPSBNYXRoLmFicyhwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCkgPiAyOCB8fCBNYXRoLmFicyhwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCkgPj0gMjg7XG4gICAgICAgIHZhciBlaXRoZXJSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgfHwgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgICAgIHZhciBlaXRoZXJTdGFuZGluZyA9ICFwbGF5ZXJBLmlzRHVja2luZyB8fCAhcGxheWVyQi5pc0R1Y2tpbmc7XG5cbiAgICAgICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICAgICAgY2FzZSBib3RoUm9sbGluZyB8fCBib3RoU3RhbmRpbmc6XG4gICAgICAgICAgICBib3VuY2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgbmVpdGhlclJvbGxpbmcgJiYgZWl0aGVyUnVubmluZyAmJiBlaXRoZXJEdWNraW5nOlxuICAgICAgICAgICAgZmxpbmcoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJTdGFuZGluZzpcbiAgICAgICAgICAgIHBvcCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBvbmx5IG9uZSBvZiB0aGUgdG91Y2hpbmcgcGxheWVycyBpcyBhdHRhY2tpbmcuLi5cbiAgICAgICAgaWYgKHBsYXllckEuaXNBdHRhY2tpbmcgIT09IHBsYXllckIuaXNBdHRhY2tpbmcpIHtcbiAgICAgICAgICB2YXIgdmljdGltID0gcGxheWVyQS5pc0F0dGFja2luZyA/IHBsYXllckIgOiBwbGF5ZXJBO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLm9yaWVudGF0aW9uICE9PSBwbGF5ZXJCLm9yaWVudGF0aW9uKSB7XG4gICAgICAgICAgICB2aWN0aW0uYWN0aW9ucy50YWtlRGFtYWdlKDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2aWN0aW0uYWN0aW9ucy50YWtlRGFtYWdlKDIpOyAvLyBhdHRhY2tlZCBmcm9tIGJlaGluZCBmb3IgZG91YmxlIGRhbWFnZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICB9LCBmdW5jdGlvbiBhbGxvd1BsYXllckNvbGxpc2lvbihwbGF5ZXJBLCBwbGF5ZXJCKSB7XG4gICAgICAgIC8vIGRvbid0IGFsbG93IGNvbGxpc2lvbiBpZiBlaXRoZXIgcGxheWVyIGlzbid0IGNvbGxpZGFibGUuXG4gICAgICAgIC8vIGFsc28gZGlzYWxsb3cgaWYgcGxheWVyIGlzIGluIGxpbWJvIGJlbG93IHRoZSBzY3JlZW4gOl1cbiAgICAgICAgaWYgKCFwbGF5ZXJBLmlzQ29sbGlkYWJsZSB8fCAhcGxheWVyQi5pc0NvbGxpZGFibGUgfHwgcGxheWVyQS5wb3NpdGlvbi55ID4gZ2FtZS5oZWlnaHQgfHwgcGxheWVyQi5wb3NpdGlvbi55ID4gZ2FtZS5oZWlnaHQpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG4gIFxuICByZXR1cm4gcGxheTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheTtcbiIsInZhciBTcGxhc2ggPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBzcGxhc2ggPSB7XG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBUT0RPOiBpbnRybyBhbmltYXRpb25cbiAgICB9LFxuXG4gICAgcHJlbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBpbWFnZXNcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnY2xlYXInLCAnaW1hZ2VzL2NsZWFyLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCd3aGl0ZScsICdpbWFnZXMvd2hpdGUucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3BpbmsnLCAnaW1hZ2VzL3BpbmsucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3llbGxvdycsICdpbWFnZXMveWVsbG93LnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdibHVlJywgJ2ltYWdlcy9ibHVlLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdvcmFuZ2UnLCAnaW1hZ2VzL29yYW5nZS5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnZ3JlZW4nLCAnaW1hZ2VzL2dyZWVuLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdncmF5JywgJ2ltYWdlcy9ncmF5LnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdicm93bicsICdpbWFnZXMvYnJvd24ucG5nJyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc3RhcnRHYW1lID0gZnVuY3Rpb24gc3RhcnRHYW1lKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIGlmIChnYW1lLnN0YXRlLmN1cnJlbnQgPT09ICdzcGxhc2gnKSB7XG4gICAgICAgICAgZ2FtZS5zdGF0ZS5zdGFydCgncGxheScpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBzdGFydCBnYW1lIGFmdGVyIGEgZGVsYXkuLi5cbiAgICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChzdGFydEdhbWUsIDApOyAvLyBUT0RPOiBpbmNyZWFzZSBkZWxheS4uLlxuXG4gICAgICAvLyAuLi5vciB3aGVuIHN0YXJ0L2VudGVyIGlzIHByZXNzZWRcbiAgICAgIC8qZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkT25jZShzdGFydEdhbWUpO1xuICAgICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5zdXBwb3J0ZWQgJiYgZ2FtZS5pbnB1dC5nYW1lcGFkLmFjdGl2ZSAmJiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5jb25uZWN0ZWQpIHtcbiAgICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGRPbmNlKHN0YXJ0R2FtZSk7XG4gICAgICB9Ki9cbiAgICB9XG4gIH07XG4gIFxuICByZXR1cm4gc3BsYXNoO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcGxhc2g7XG4iLCJ2YXIgdXRpbHMgPSB7XG4gIC8vIGZyb20gdW5kZXJzY29yZVxuICBkZWJvdW5jZTogZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG5cdHZhciB0aW1lb3V0O1xuXHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGltZW91dCA9IG51bGw7XG5cdFx0XHRpZiAoIWltbWVkaWF0ZSkgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHR9O1xuXHRcdHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuXHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0aWYgKGNhbGxOb3cpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdH07XG4gIH0sXG5cbiAgY2VudGVyOiBmdW5jdGlvbihlbnRpdHkpIHtcbiAgICBlbnRpdHkuYW5jaG9yLnNldFRvKDAuNSk7XG4gIH0sXG5cbiAgLy8gVE9ETzogY29uc2lkZXIgaW5qZWN0aW5nIGRlcGVuZGVuY2llc1xuICBnZXRTdGFnZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vZGF0YS9zdGFnZXMnKTtcbiAgICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MnKTtcbiAgICB2YXIgc3RhZ2UgPSBzdGFnZXMuZmlsdGVyKGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICByZXR1cm4gc3RhZ2UubmFtZSA9PT0gc2V0dGluZ3Muc3RhZ2Uuc2VsZWN0ZWQ7XG4gICAgfSlbMF07XG4gICAgcmV0dXJuIHN0YWdlO1xuICB9LFxuXG4gIGdldFJhbmRvbUFycmF5RWxlbWVudDogZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gYXJyYXlbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyYXkubGVuZ3RoKV07XG4gIH0sXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzO1xuIl19
