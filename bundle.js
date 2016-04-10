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
var Players = function(game) {
    var players = [{
      name: 'Blue',
      color: 'blue',
      gamepad: game.input.gamepad.pad1,
      keys: {
        up: 'W', down: 'S', left: 'A', right: 'D', attack: 'Q'
      },
    }, {
      name: 'Pink',
      color: 'pink',
      gamepad: game.input.gamepad.pad2,
      orientation: 'left',
    }, {
      name: 'Green',
      color: 'green',
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

},{}],4:[function(require,module,exports){
var stages = require('./stages');

var settings = {
  playerCount: {
    options: [2, 3, 4],
    selected: 4,
  },
  bgm: {
    options: ['test.xm', 'title.xm', 'None'],
    selected: 'test.xm',
  },
  stage: {
    options: stages.map(function(stage) {
      return stage.name;
    }),
    selected: 'Hangar',
  }
};

module.exports = settings;

},{"./stages":5}],5:[function(require,module,exports){
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
    "color": "yellow"
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
    "color": "gray"
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
  "name": "Hangar",
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
  "backgrounds": [{
    image: 'hangar'
  }],
  "foreground": "clear",
  "spawnPoints": [
    { "x": 10, "y": 27 },
    { "x": 19, "y": 27 },
    { "x": 41, "y": 27 },
    { "x": 50, "y": 27 }
  ],
  "uiColor": "#8D8D8D"
},{
  "name": "Waterfall",
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
  "backgrounds": [{
    image: 'waterfall'
  }],
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

},{}],6:[function(require,module,exports){
var resize = function resize() {
  document.body.style.zoom = window.innerHeight / game.height;
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

},{"./states/play.js":12,"./states/splash.js":13,"./utils.js":14}],7:[function(require,module,exports){
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
  }, {
    name: 'BGM',
    setting: settings.bgm,
    action: function() {
      cycleSetting.call(this);
      state.resetMusic(settings);
    },
  }, {
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
  var changeBgm = menu[1].action.bind(menu[1]);
  var changeStage = menu[2].action.bind(menu[2]);
  var restart = menu[3].action.bind(menu[3]);

  game.input.keyboard.addKey(Phaser.Keyboard.P).onDown.add(changePlayerCount);
  game.input.keyboard.addKey(Phaser.Keyboard.M).onDown.add(changeStage);
  game.input.keyboard.addKey(Phaser.Keyboard.B).onDown.add(changeBgm);
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

},{"./data/settings.js":4}],8:[function(require,module,exports){
var bgm = function() {
  var player = new ChiptuneJsPlayer(new ChiptuneJsConfig(-1));

  return {
    play: function(fileName) {
      if (fileName === 'None') {
        player.stop.call(player);
      } else {
        player.load('./music/' + fileName, function(buffer) {
          player.play(buffer);
        });
      }
    }
  };
};

module.exports = bgm;

},{}],9:[function(require,module,exports){
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
      var interval = 600;
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
        actions.applyOrientation();
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
      actions.applyOrientation();

      var newPlayerAlpha = player.hp % 2 === 0 ? 1 : 0.75;
      player.alpha = newPlayerAlpha;
    },

    applyOrientation: function() {
      player.scale.setTo(player.orientation === 'left' ? settings.scale.x : -settings.scale.x, player.scale.y);
    },

    die: function() {
      if (player.isPermadead) {
        return;
      }

      if (player.hp > 0) {
        setTimeout(function() {
          actions.applyInvulnerability();
        }, 100); // delay invuln so players don't spawn behind one another

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
    },

    applyInvulnerability: function() {
      player.isCollidable = false;
      var makeWhite = function() {
        player.loadTexture('white');
      };
      var makeColor = function() {
        player.loadTexture(settings.color);
      };
      var colorInterval = setInterval(makeColor, 150);
      var whiteInterval;
      setTimeout(function() {
        whiteInterval = setInterval(makeWhite, 150);
      }, 75);
      makeColor();
      setTimeout(function() {
        clearInterval(whiteInterval);
        clearInterval(colorInterval);
        player.isCollidable = true;
      }, 1500);
    },
  };

  var player = game.add.sprite(0, 0, settings.color);
  player.name = settings.name;
  player.orientation = settings.orientation;
  player.anchor.setTo(.5,.5); // anchor to center to allow flipping

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
      player.actions.applyOrientation();
    } else if (input.right) {
      actions.run('right');
      player.actions.applyOrientation();
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
    walls.push(platforms.create(-3, -12, stage.platforms.color));
    walls.push(platforms.create(61, -12, stage.platforms.color));
    walls.forEach(function(wall) {
      wall.scale.setTo(3, 38);
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

},{"./data/settings.js":4,"./utils.js":14}],12:[function(require,module,exports){
var Play = function(game) {
  var play = {
    create: function create() {
      var self = this;

      self.subUi = game.add.group(); // place to keep anything on-screen that's not UI to depth sort below UI

      // game over victory message, e.g. PINK WINS
      self.victoryMsg = game.add.sprite(9, 24, 'victoryMsg');
      self.victoryMsg.visible = false;

      // menu
      var buildMenu = require('../menu.js');
      buildMenu(game, self); // TODO: is there a better approach than injecting the whole state into the menu to let it access functions for resetting stage, players, music?

      self.restart();
      game.physics.startSystem(Phaser.Physics.ARCADE);
      game.input.gamepad.start();
    },

    resetMusic: function(settings) {
      var self = this;
      game.bgm.play(settings.bgm.selected);
    },

    restart: function restart() {
      var self = this;
      var players = require('../data/players.js')(game);
      var settings = require('../data/settings');
      var utils = require('../utils.js');
      var stageBuilder = require('../stageBuilder.js')(game);
      var stage = utils.getStage();

      self.resetMusic(settings);

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
            var playerIndex = players.map(function(player) { return player.name }).indexOf(alivePlayers[0]);
            self.victoryMsg.frame = playerIndex;
            self.victoryMsg.visible = true;
            setTimeout(function() {
              self.victoryMsg.visible = false;
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
          game.sfx.bounce();

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
          game.sfx.bounce();

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
          game.sfx.bounce();

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

},{"../data/players.js":3,"../data/settings":4,"../menu.js":7,"../player.js":9,"../stageBuilder.js":11,"../utils.js":14}],13:[function(require,module,exports){
var Splash = function(game) {
  var splash = {
    init: function() {
      // TODO: intro animation
      game.sfx = require('../sfx.js');
      game.bgm = require('../music')();
    },

    preload: function() {
      // images
      game.load.image('title', 'images/title.gif');
      game.load.image('clear', 'images/clear.png');
      game.load.image('white', 'images/white.png');
      game.load.image('pink', 'images/pink.png');
      game.load.image('yellow', 'images/yellow.png');
      game.load.image('blue', 'images/blue.png');
      game.load.image('orange', 'images/orange.png');
      game.load.image('green', 'images/green.png');
      game.load.image('gray', 'images/gray.png');
      game.load.image('brown', 'images/brown.png');
      game.load.image('waterfall', 'images/waterfall.gif');
      game.load.image('hangar', 'images/hangar.gif');
      game.load.spritesheet('victoryMsg', 'images/victoryMsg.png', 47, 6);
    },

    create: function() {
      game.bgm.play('title.xm');
      game.add.sprite(0, 0, 'hangar');
      game.add.sprite(0, 0, 'title');

      var startGame = function startGame() {
        if (game.state.current === 'splash') {
          game.bgm.play('None');
          game.state.start('play');
        }
      };
      
      // start game when start/enter is pressed
      game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(startGame);
      if (game.input.gamepad.supported && game.input.gamepad.active && game.input.gamepad.pad1.connected) {
        game.input.gamepad.pad1.getButton(Phaser.Gamepad.XBOX360_START).onDown.addOnce(startGame);
      }
    }
  };
  
  return splash;
};

module.exports = Splash;

},{"../music":8,"../sfx.js":10}],14:[function(require,module,exports){
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

},{"./data/settings":4,"./data/stages":5}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL3N1YnBvbHkvbm9kZV9tb2R1bGVzL3N1Ym1vbm8vc3VibW9uby5qcyIsIm5vZGVfbW9kdWxlcy9zdWJwb2x5L3N1YnBvbHkuanMiLCJzY3JpcHRzL2RhdGEvcGxheWVycy5qcyIsInNjcmlwdHMvZGF0YS9zZXR0aW5ncy5qcyIsInNjcmlwdHMvZGF0YS9zdGFnZXMuanMiLCJzY3JpcHRzL21haW4uanMiLCJzY3JpcHRzL21lbnUuanMiLCJzY3JpcHRzL211c2ljLmpzIiwic2NyaXB0cy9wbGF5ZXIuanMiLCJzY3JpcHRzL3NmeC5qcyIsInNjcmlwdHMvc3RhZ2VCdWlsZGVyLmpzIiwic2NyaXB0cy9zdGF0ZXMvcGxheS5qcyIsInNjcmlwdHMvc3RhdGVzL3NwbGFzaC5qcyIsInNjcmlwdHMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIE1vbm9zeW50aCA9IGZ1bmN0aW9uIE1vbm9zeW50aChhdWRpb0N0eCwgY29uZmlnKSB7XG4gIHZhciBzeW50aDtcbiAgdmFyIFN5bnRoID0gZnVuY3Rpb24gU3ludGgoKSB7XG4gICAgc3ludGggPSB0aGlzO1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICBjb25maWcuY3V0b2ZmID0gY29uZmlnLmN1dG9mZiB8fCB7fTtcblxuICAgIHN5bnRoLmF1ZGlvQ3R4ID0gYXVkaW9DdHgsXG4gICAgc3ludGguYW1wICAgICAgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCksXG4gICAgc3ludGguZmlsdGVyICAgPSBhdWRpb0N0eC5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICBzeW50aC5vc2MgICAgICA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICBzeW50aC5wYW4gICAgICA9IGF1ZGlvQ3R4LmNyZWF0ZVBhbm5lcigpLFxuXG4gICAgc3ludGgubWF4R2FpbiAgPSBjb25maWcubWF4R2FpbiAgfHwgMC45LCAvLyBvdXQgb2YgMVxuICAgIHN5bnRoLmF0dGFjayAgID0gY29uZmlnLmF0dGFjayAgIHx8IDAuMSwgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLmRlY2F5ICAgID0gY29uZmlnLmRlY2F5ICAgIHx8IDAuMCwgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLnN1c3RhaW4gID0gY29uZmlnLnN1c3RhaW4gIHx8IDEuMCwgLy8gb3V0IG9mIDFcbiAgICBzeW50aC5yZWxlYXNlICA9IGNvbmZpZy5yZWxlYXNlICB8fCAwLjgsIC8vIGluIHNlY29uZHNcblxuICAgIC8vIGxvdy1wYXNzIGZpbHRlclxuICAgIHN5bnRoLmN1dG9mZiAgICAgICAgICAgICAgPSBzeW50aC5maWx0ZXIuZnJlcXVlbmN5O1xuICAgIHN5bnRoLmN1dG9mZi5tYXhGcmVxdWVuY3kgPSBjb25maWcuY3V0b2ZmLm1heEZyZXF1ZW5jeSB8fCA3NTAwOyAvLyBpbiBoZXJ0elxuICAgIHN5bnRoLmN1dG9mZi5hdHRhY2sgICAgICAgPSBjb25maWcuY3V0b2ZmLmF0dGFjayAgICAgICB8fCAwLjE7IC8vIGluIHNlY29uZHNcbiAgICBzeW50aC5jdXRvZmYuZGVjYXkgICAgICAgID0gY29uZmlnLmN1dG9mZi5kZWNheSAgICAgICAgfHwgMi41OyAvLyBpbiBzZWNvbmRzXG4gICAgc3ludGguY3V0b2ZmLnN1c3RhaW4gICAgICA9IGNvbmZpZy5jdXRvZmYuc3VzdGFpbiAgICAgIHx8IDAuMjsgLy8gb3V0IG9mIDFcbiAgICBcbiAgICBzeW50aC5hbXAuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgc3ludGguZmlsdGVyLnR5cGUgPSAnbG93cGFzcyc7XG4gICAgc3ludGguZmlsdGVyLmNvbm5lY3Qoc3ludGguYW1wKTtcbiAgICBzeW50aC5hbXAuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG4gICAgc3ludGgucGFuLnBhbm5pbmdNb2RlbCA9ICdlcXVhbHBvd2VyJztcbiAgICBzeW50aC5wYW4uc2V0UG9zaXRpb24oMCwgMCwgMSk7IC8vIHN0YXJ0IHdpdGggc3RlcmVvIGltYWdlIGNlbnRlcmVkXG4gICAgc3ludGgub3NjLmNvbm5lY3Qoc3ludGgucGFuKTtcbiAgICBzeW50aC5wYW4uY29ubmVjdChzeW50aC5maWx0ZXIpO1xuICAgIHN5bnRoLm9zYy5zdGFydCgwKTtcbiAgICBcbiAgICBzeW50aC53YXZlZm9ybShjb25maWcud2F2ZWZvcm0gfHwgJ3NpbmUnKTtcbiAgICBzeW50aC5waXRjaChjb25maWcucGl0Y2ggfHwgNDQwKTtcblxuICAgIHJldHVybiBzeW50aDtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXROb3coKSB7XG4gICAgdmFyIG5vdyA9IHN5bnRoLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xuICAgIHN5bnRoLmFtcC5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyhub3cpO1xuICAgIHN5bnRoLmFtcC5nYWluLnNldFZhbHVlQXRUaW1lKHN5bnRoLmFtcC5nYWluLnZhbHVlLCBub3cpO1xuICAgIHJldHVybiBub3c7XG4gIH07XG4gIFxuICBTeW50aC5wcm90b3R5cGUucGl0Y2ggPSBmdW5jdGlvbiBwaXRjaChuZXdQaXRjaCkge1xuICAgIGlmIChuZXdQaXRjaCkge1xuICAgICAgdmFyIG5vdyA9IHN5bnRoLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xuICAgICAgc3ludGgub3NjLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShuZXdQaXRjaCwgbm93KTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bnRoLm9zYy5mcmVxdWVuY3kudmFsdWU7XG4gIH07XG5cbiAgU3ludGgucHJvdG90eXBlLndhdmVmb3JtID0gZnVuY3Rpb24gd2F2ZWZvcm0obmV3V2F2ZWZvcm0pIHtcbiAgICBpZiAobmV3V2F2ZWZvcm0pIHtcbiAgICAgIHN5bnRoLm9zYy50eXBlID0gbmV3V2F2ZWZvcm07XG4gICAgfVxuICAgIHJldHVybiBzeW50aC5vc2MudHlwZTtcbiAgfTtcblxuICAvLyBhcHBseSBhdHRhY2ssIGRlY2F5LCBzdXN0YWluIGVudmVsb3BlXG4gIFN5bnRoLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIHN0YXJ0U3ludGgoKSB7XG4gICAgdmFyIGF0ayAgPSBwYXJzZUZsb2F0KHN5bnRoLmF0dGFjayk7XG4gICAgdmFyIGRlYyAgPSBwYXJzZUZsb2F0KHN5bnRoLmRlY2F5KTtcbiAgICB2YXIgY0F0ayA9IHBhcnNlRmxvYXQoc3ludGguY3V0b2ZmLmF0dGFjayk7XG4gICAgdmFyIGNEZWMgPSBwYXJzZUZsb2F0KHN5bnRoLmN1dG9mZi5kZWNheSk7XG4gICAgdmFyIG5vdyAgPSBnZXROb3coKTtcbiAgICBzeW50aC5jdXRvZmYuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKG5vdyk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi52YWx1ZSwgbm93KTtcbiAgICBzeW50aC5jdXRvZmYubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoc3ludGguY3V0b2ZmLm1heEZyZXF1ZW5jeSwgbm93ICsgY0F0ayk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi5zdXN0YWluICogc3ludGguY3V0b2ZmLm1heEZyZXF1ZW5jeSwgbm93ICsgY0F0ayArIGNEZWMpO1xuICAgIHN5bnRoLmFtcC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLm1heEdhaW4sIG5vdyArIGF0ayk7XG4gICAgc3ludGguYW1wLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoc3ludGguc3VzdGFpbiAqIHN5bnRoLm1heEdhaW4sIG5vdyArIGF0ayArIGRlYyk7XG4gIH07XG5cbiAgLy8gYXBwbHkgcmVsZWFzZSBlbnZlbG9wZVxuICBTeW50aC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3BTeW50aCgpIHtcbiAgICB2YXIgcmVsID0gcGFyc2VGbG9hdChzeW50aC5yZWxlYXNlKTtcbiAgICB2YXIgbm93ID0gZ2V0Tm93KCk7XG4gICAgc3ludGguYW1wLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMCwgbm93ICsgcmVsKTtcbiAgfTtcblxuICByZXR1cm4gbmV3IFN5bnRoKCk7XG59O1xuXG4vLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBNb25vc3ludGg7XG59XG4iLCIvLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJykge1xuICB2YXIgTW9ub3N5bnRoID0gcmVxdWlyZSgnc3VibW9ubycpO1xufVxuXG52YXIgUG9seXN5bnRoID0gZnVuY3Rpb24gUG9seXN5bnRoKGF1ZGlvQ3R4LCBjb25maWcpIHtcbiAgdmFyIHN5bnRoO1xuICB2YXIgU3ludGggPSBmdW5jdGlvbiBTeW50aCgpIHtcbiAgICBzeW50aCA9IHRoaXM7XG4gICAgc3ludGguYXVkaW9DdHggPSBhdWRpb0N0eDtcbiAgICBzeW50aC52b2ljZXMgPSBbXTtcbiAgICBcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uZmlnLmN1dG9mZiA9IGNvbmZpZy5jdXRvZmYgfHwge307XG5cblxuICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGNvbmZpZy5udW1Wb2ljZXMgfHwgMTY7IGkgPCBpaTsgaSsrKSB7XG4gICAgICBzeW50aC52b2ljZXMucHVzaChuZXcgTW9ub3N5bnRoKGF1ZGlvQ3R4LCBjb25maWcpKTtcbiAgICB9XG5cbiAgICBzeW50aC5zdGVyZW9XaWR0aCA9IGNvbmZpZy5zdGVyZW9XaWR0aCB8fCAwLjU7IC8vIG91dCBvZiAxXG4gICAgc3ludGgud2lkdGgoc3ludGguc3RlcmVvV2lkdGgpO1xuXG4gICAgcmV0dXJuIHN5bnRoO1xuICB9O1xuXG4gIC8vIGFwcGx5IGF0dGFjaywgZGVjYXksIHN1c3RhaW4gZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gc3RhcnRTeW50aCgpIHtcbiAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBzdGFydFZvaWNlKHZvaWNlKSB7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIGFwcGx5IHJlbGVhc2UgZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wU3ludGgoKSB7XG4gICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc3RvcFZvaWNlKHZvaWNlKSB7XG4gICAgICB2b2ljZS5zdG9wKCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZ2V0L3NldCBzeW50aCBzdGVyZW8gd2lkdGhcbiAgU3ludGgucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24gd2lkdGgobmV3V2lkdGgpIHtcbiAgICBpZiAoc3ludGgudm9pY2VzLmxlbmd0aCA+IDEgJiYgbmV3V2lkdGgpIHtcbiAgICAgIHN5bnRoLnN0ZXJlb1dpZHRoID0gbmV3V2lkdGg7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBwYW5Wb2ljZSh2b2ljZSwgaSkge1xuICAgICAgICB2YXIgc3ByZWFkID0gMS8oc3ludGgudm9pY2VzLmxlbmd0aCAtIDEpO1xuICAgICAgICB2YXIgeFBvcyA9IHNwcmVhZCAqIGkgKiBzeW50aC5zdGVyZW9XaWR0aDtcbiAgICAgICAgdmFyIHpQb3MgPSAxIC0gTWF0aC5hYnMoeFBvcyk7XG4gICAgICAgIHZvaWNlLnBhbi5zZXRQb3NpdGlvbih4UG9zLCAwLCB6UG9zKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBzeW50aC5zdGVyZW9XaWR0aDtcbiAgfTtcblxuICAvLyBjb252ZW5pZW5jZSBtZXRob2RzIGZvciBjaGFuZ2luZyB2YWx1ZXMgb2YgYWxsIE1vbm9zeW50aHMnIHByb3BlcnRpZXMgYXQgb25jZVxuICAoZnVuY3Rpb24gY3JlYXRlU2V0dGVycygpIHtcbiAgICB2YXIgbW9ub3N5bnRoUHJvcGVydGllcyA9IFsnbWF4R2FpbicsICdhdHRhY2snLCAnZGVjYXknLCAnc3VzdGFpbicsICdyZWxlYXNlJ107XG4gICAgdmFyIG1vbm9zeW50aEN1dG9mZlByb3BlcnRpZXMgPSBbJ21heEZyZXF1ZW5jeScsICdhdHRhY2snLCAnZGVjYXknLCAnc3VzdGFpbiddO1xuXG4gICAgbW9ub3N5bnRoUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihwcm9wZXJ0eSkge1xuICAgICAgU3ludGgucHJvdG90eXBlW3Byb3BlcnR5XSA9IGZ1bmN0aW9uIHNldFZhbHVlcyhuZXdWYWx1ZSkge1xuICAgICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBzZXRWYWx1ZSh2b2ljZSkge1xuICAgICAgICAgIHZvaWNlW3Byb3BlcnR5XSA9IG5ld1ZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBTeW50aC5wcm90b3R5cGUuY3V0b2ZmID0ge307XG4gICAgbW9ub3N5bnRoQ3V0b2ZmUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihwcm9wZXJ0eSkge1xuICAgICAgU3ludGgucHJvdG90eXBlLmN1dG9mZltwcm9wZXJ0eV0gPSBmdW5jdGlvbiBzZXRWYWx1ZXMobmV3VmFsdWUpIHtcbiAgICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc2V0VmFsdWUodm9pY2UpIHtcbiAgICAgICAgICB2b2ljZS5jdXRvZmZbcHJvcGVydHldID0gbmV3VmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIFN5bnRoLnByb3RvdHlwZS53YXZlZm9ybSA9IGZ1bmN0aW9uIHdhdmVmb3JtKG5ld1dhdmVmb3JtKSB7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiB3YXZlZm9ybSh2b2ljZSkge1xuICAgICAgICB2b2ljZS53YXZlZm9ybShuZXdXYXZlZm9ybSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgU3ludGgucHJvdG90eXBlLnBpdGNoID0gZnVuY3Rpb24gcGl0Y2gobmV3UGl0Y2gpIHtcbiAgICAgIHN5bnRoLnZvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIHBpdGNoKHZvaWNlKSB7XG4gICAgICAgIHZvaWNlLnBpdGNoKG5ld1BpdGNoKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pKCk7XG5cbiAgcmV0dXJuIG5ldyBTeW50aDtcbn07XG5cbi8vIG5wbSBzdXBwb3J0XG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IFBvbHlzeW50aDtcbn1cbiIsInZhciBQbGF5ZXJzID0gZnVuY3Rpb24oZ2FtZSkge1xuICAgIHZhciBwbGF5ZXJzID0gW3tcbiAgICAgIG5hbWU6ICdCbHVlJyxcbiAgICAgIGNvbG9yOiAnYmx1ZScsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCcsIGF0dGFjazogJ1EnXG4gICAgICB9LFxuICAgIH0sIHtcbiAgICAgIG5hbWU6ICdQaW5rJyxcbiAgICAgIGNvbG9yOiAncGluaycsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMixcbiAgICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gICAgfSwge1xuICAgICAgbmFtZTogJ0dyZWVuJyxcbiAgICAgIGNvbG9yOiAnZ3JlZW4nLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnSScsIGRvd246ICdLJywgbGVmdDogJ0onLCByaWdodDogJ0wnLCBhdHRhY2s6ICdVJ1xuICAgICAgfSxcbiAgICB9LCB7XG4gICAgICBuYW1lOiAnUHVycGxlJyxcbiAgICAgIGNvbG9yOiAncHVycGxlJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LFxuICAgICAgb3JpZW50YXRpb246ICdsZWZ0JyxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdUJywgZG93bjogJ0cnLCBsZWZ0OiAnRicsIHJpZ2h0OiAnSCcsIGF0dGFjazogJ1InXG4gICAgICB9LFxuICB9XTtcbiAgXG4gIHJldHVybiBwbGF5ZXJzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJzO1xuIiwidmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vc3RhZ2VzJyk7XG5cbnZhciBzZXR0aW5ncyA9IHtcbiAgcGxheWVyQ291bnQ6IHtcbiAgICBvcHRpb25zOiBbMiwgMywgNF0sXG4gICAgc2VsZWN0ZWQ6IDQsXG4gIH0sXG4gIGJnbToge1xuICAgIG9wdGlvbnM6IFsndGVzdC54bScsICd0aXRsZS54bScsICdOb25lJ10sXG4gICAgc2VsZWN0ZWQ6ICd0ZXN0LnhtJyxcbiAgfSxcbiAgc3RhZ2U6IHtcbiAgICBvcHRpb25zOiBzdGFnZXMubWFwKGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICByZXR1cm4gc3RhZ2UubmFtZTtcbiAgICB9KSxcbiAgICBzZWxlY3RlZDogJ0hhbmdhcicsXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3M7XG4iLCJ2YXIgc3RhZ2VzID0gW3tcbiAgXCJuYW1lXCI6IFwiQVwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFsxMCwgN10sXG4gICAgICBbNDUsIDddLFxuICAgICAgWzI3LCAxNV0sXG4gICAgICBbMTAsIDI1XSxcbiAgICAgIFs0NSwgMjVdLFxuICAgICAgWzEwLCA0NF0sXG4gICAgICBbNDUsIDQ0XSxcbiAgICAgIFsyNywgNTJdLFxuICAgICAgWzEwLCA2Ml0sXG4gICAgICBbNDUsIDYyXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcInllbGxvd1wiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW10sXG4gIFwiZm9yZWdyb3VuZFwiOiBcImNsZWFyXCIsXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogMCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMCB9LFxuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogMTggfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDE4IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzI4RjEyOVwiXG59LHtcbiAgXCJuYW1lXCI6IFwiQlwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFsyNywgNl0sXG4gICAgICBbMTAsIDEzXSxcbiAgICAgIFs0NSwgMTNdLFxuICAgICAgWzQsIDIyXSxcbiAgICAgIFs1MCwgMjJdLFxuICAgICAgWzE4LCAzMV0sXG4gICAgICBbMjcsIDMxXSxcbiAgICAgIFszNywgMzFdLFxuICAgICAgWzQsIDQ0XSxcbiAgICAgIFs1MCwgNDRdLFxuICAgICAgWzI3LCA2MF1cbiAgICBdLFxuICAgIFwiY29sb3JcIjogXCJncmF5XCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbXSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogOSwgXCJ5XCI6IDE1IH0sXG4gICAgeyBcInhcIjogNTQsIFwieVwiOiAxNSB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiMyOEQ2RjFcIlxufSx7XG4gIFwibmFtZVwiOiBcIkhhbmdhclwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFs4LCAzNF0sXG4gICAgICBbMTIsIDM0XSxcbiAgICAgIFsyMiwgMzRdLFxuICAgICAgWzMxLCAzNF0sXG4gICAgICBbNDEsIDM0XSxcbiAgICAgIFs0NiwgMzRdLFxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcImdyYXlcIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFt7XG4gICAgaW1hZ2U6ICdoYW5nYXInXG4gIH1dLFxuICBcImZvcmVncm91bmRcIjogXCJjbGVhclwiLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxMCwgXCJ5XCI6IDI3IH0sXG4gICAgeyBcInhcIjogMTksIFwieVwiOiAyNyB9LFxuICAgIHsgXCJ4XCI6IDQxLCBcInlcIjogMjcgfSxcbiAgICB7IFwieFwiOiA1MCwgXCJ5XCI6IDI3IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzhEOEQ4RFwiXG59LHtcbiAgXCJuYW1lXCI6IFwiV2F0ZXJmYWxsXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzEwLCAxM10sXG4gICAgICBbNDUsIDEzXSxcbiAgICAgIFsyNywgMjFdLFxuICAgICAgWzEwLCAzMV0sXG4gICAgICBbNDUsIDMxXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcImJyb3duXCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIGltYWdlOiAnd2F0ZXJmYWxsJ1xuICB9XSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAyNCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMjQgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjNzgzRTA4XCJcbn1dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YWdlcztcbiIsInZhciByZXNpemUgPSBmdW5jdGlvbiByZXNpemUoKSB7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUuem9vbSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIGdhbWUuaGVpZ2h0O1xufTtcblxudmFyIG1haW4gPSB7XG4gIHByZWxvYWQ6IGZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xuXG4gICAgcmVzaXplKCk7XG4gICAgd2luZG93Lm9ucmVzaXplID0gdXRpbHMuZGVib3VuY2UocmVzaXplLCAxMDApO1xuICAgIFxuICAgIC8vIGFsbG93IGFueXRoaW5nIHVwIHRvIGhlaWdodCBvZiB3b3JsZCB0byBmYWxsIG9mZi1zY3JlZW4gdXAgb3IgZG93blxuICAgIGdhbWUud29ybGQuc2V0Qm91bmRzKDAsIC1nYW1lLndpZHRoLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCAqIDMpO1xuICAgIFxuICAgIC8vIHByZXZlbnQgZ2FtZSBwYXVzaW5nIHdoZW4gaXQgbG9zZXMgZm9jdXNcbiAgICBnYW1lLnN0YWdlLmRpc2FibGVWaXNpYmlsaXR5Q2hhbmdlID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBhc3NldHMgdXNlZCBpbiBzcGxhc2ggc2NyZWVuIGludHJvIGFuaW1hdGlvblxuICAgIGdhbWUubG9hZC5pbWFnZSgncHVycGxlJywgJ2ltYWdlcy9wdXJwbGUucG5nJyk7XG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG5cbiAgICBnYW1lLnN0YXRlLmFkZCgnc3BsYXNoJywgcmVxdWlyZSgnLi9zdGF0ZXMvc3BsYXNoLmpzJykoZ2FtZSkpO1xuICAgIGdhbWUuc3RhdGUuYWRkKCdwbGF5JywgcmVxdWlyZSgnLi9zdGF0ZXMvcGxheS5qcycpKGdhbWUpKTtcblxuICAgIGdhbWUuc3RhdGUuc3RhcnQoJ3NwbGFzaCcpO1xuICB9XG59O1xuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg2NCwgNjQsIFBoYXNlci5BVVRPLCAnZ2FtZScsIHtcbiAgcHJlbG9hZDogbWFpbi5wcmVsb2FkLFxuICBjcmVhdGU6IG1haW4uY3JlYXRlXG59LCBmYWxzZSwgZmFsc2UpOyAvLyBkaXNhYmxlIGFudGktYWxpYXNpbmdcblxuZ2FtZS5zdGF0ZS5hZGQoJ21haW4nLCBtYWluKTtcbmdhbWUuc3RhdGUuc3RhcnQoJ21haW4nKTtcbiIsInZhciBidWlsZE1lbnUgPSBmdW5jdGlvbiBidWlsZE1lbnUoZ2FtZSwgc3RhdGUpIHtcbiAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzLmpzJyk7XG5cbiAgdmFyIGN5Y2xlU2V0dGluZyA9IGZ1bmN0aW9uIGN5Y2xlU2V0dGluZygpIHtcbiAgICB2YXIgb3B0aW9uSW5kZXggPSB0aGlzLnNldHRpbmcub3B0aW9ucy5pbmRleE9mKHRoaXMuc2V0dGluZy5zZWxlY3RlZCk7XG4gICAgb3B0aW9uSW5kZXgrKztcbiAgICBpZiAob3B0aW9uSW5kZXggPT09IHRoaXMuc2V0dGluZy5vcHRpb25zLmxlbmd0aCkge1xuICAgICAgb3B0aW9uSW5kZXggPSAwO1xuICAgIH1cbiAgICB0aGlzLnNldHRpbmcuc2VsZWN0ZWQgPSB0aGlzLnNldHRpbmcub3B0aW9uc1tvcHRpb25JbmRleF07XG4gIH07XG5cbiAgdmFyIG1lbnUgPSBbe1xuICAgIG5hbWU6ICdQbGF5ZXJzJyxcbiAgICBzZXR0aW5nOiBzZXR0aW5ncy5wbGF5ZXJDb3VudCxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgY3ljbGVTZXR0aW5nLmNhbGwodGhpcyk7XG4gICAgICBzdGF0ZS5yZXN0YXJ0KCk7XG4gICAgfSxcbiAgICBzZWxlY3RlZDogdHJ1ZVxuICB9LCB7XG4gICAgbmFtZTogJ0JHTScsXG4gICAgc2V0dGluZzogc2V0dGluZ3MuYmdtLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcbiAgICAgIHN0YXRlLnJlc2V0TXVzaWMoc2V0dGluZ3MpO1xuICAgIH0sXG4gIH0sIHtcbiAgICBuYW1lOiAnU3RhZ2UnLFxuICAgIHNldHRpbmc6IHNldHRpbmdzLnN0YWdlLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcbiAgICAgIHN0YXRlLnJlc3RhcnQoKTtcbiAgICB9LFxuICB9LCB7XG4gICAgbmFtZTogJ1N0YXJ0JyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH1cbiAgfV07XG5cbiAgdmFyIGNoYW5nZVBsYXllckNvdW50ID0gbWVudVswXS5hY3Rpb24uYmluZChtZW51WzBdKTtcbiAgdmFyIGNoYW5nZUJnbSA9IG1lbnVbMV0uYWN0aW9uLmJpbmQobWVudVsxXSk7XG4gIHZhciBjaGFuZ2VTdGFnZSA9IG1lbnVbMl0uYWN0aW9uLmJpbmQobWVudVsyXSk7XG4gIHZhciByZXN0YXJ0ID0gbWVudVszXS5hY3Rpb24uYmluZChtZW51WzNdKTtcblxuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuUCkub25Eb3duLmFkZChjaGFuZ2VQbGF5ZXJDb3VudCk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5NKS5vbkRvd24uYWRkKGNoYW5nZVN0YWdlKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkIpLm9uRG93bi5hZGQoY2hhbmdlQmdtKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnN1cHBvcnRlZCAmJiBnYW1lLmlucHV0LmdhbWVwYWQuYWN0aXZlKSB7XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkMi5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMy5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDQuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1lbnU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1aWxkTWVudTtcbiIsInZhciBiZ20gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBsYXllciA9IG5ldyBDaGlwdHVuZUpzUGxheWVyKG5ldyBDaGlwdHVuZUpzQ29uZmlnKC0xKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBwbGF5OiBmdW5jdGlvbihmaWxlTmFtZSkge1xuICAgICAgaWYgKGZpbGVOYW1lID09PSAnTm9uZScpIHtcbiAgICAgICAgcGxheWVyLnN0b3AuY2FsbChwbGF5ZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyLmxvYWQoJy4vbXVzaWMvJyArIGZpbGVOYW1lLCBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICBwbGF5ZXIucGxheShidWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJnbTtcbiIsInZhciBjcmVhdGVQbGF5ZXIgPSBmdW5jdGlvbiBjcmVhdGVQbGF5ZXIoZ2FtZSwgb3B0aW9ucywgb25EZWF0aCkge1xuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgb3JpZW50YXRpb246ICdyaWdodCcsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdVUCcsXG4gICAgICBkb3duOiAnRE9XTicsXG4gICAgICBsZWZ0OiAnTEVGVCcsXG4gICAgICByaWdodDogJ1JJR0hUJyxcbiAgICAgIGF0dGFjazogJ1NISUZUJ1xuICAgIH0sXG4gICAgc2NhbGU6IHtcbiAgICAgIHg6IDEsXG4gICAgICB5OiAyXG4gICAgfSxcbiAgICBjb2xvcjogJ3BpbmsnLFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLFxuICB9O1xuXG4gIHZhciBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICB2YXIga2V5cyA9IHtcbiAgICB1cDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMudXBdKSxcbiAgICBkb3duOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5kb3duXSksXG4gICAgbGVmdDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMubGVmdF0pLFxuICAgIHJpZ2h0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5yaWdodF0pLFxuICAgIGF0dGFjazogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuYXR0YWNrXSksXG4gIH07XG5cbiAgdmFyIGdhbWVwYWQgPSBzZXR0aW5ncy5nYW1lcGFkO1xuXG4gIHZhciBzZnggPSByZXF1aXJlKCcuL3NmeC5qcycpO1xuXG4gIHZhciBhY3Rpb25zID0ge1xuICAgIGF0dGFjazogZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgdmFyIGR1cmF0aW9uID0gMjAwO1xuICAgICAgdmFyIGludGVydmFsID0gNjAwO1xuICAgICAgdmFyIHZlbG9jaXR5ID0gMTAwO1xuXG4gICAgICB2YXIgY2FuQXR0YWNrID0gKERhdGUubm93KCkgPiBwbGF5ZXIubGFzdEF0dGFja2VkICsgaW50ZXJ2YWwpICYmICFwbGF5ZXIuaXNEdWNraW5nICYmICFwbGF5ZXIuaXNQZXJtYWRlYWQ7XG4gICAgICBpZiAoIWNhbkF0dGFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IHRydWU7XG4gICAgICBwbGF5ZXIubGFzdEF0dGFja2VkID0gRGF0ZS5ub3coKTtcblxuICAgICAgc2Z4LmF0dGFjaygpO1xuXG4gICAgICBzd2l0Y2gocGxheWVyLm9yaWVudGF0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAtdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5sb2FkVGV4dHVyZSgnd2hpdGUnKTtcbiAgICAgIHNldFRpbWVvdXQoYWN0aW9ucy5lbmRBdHRhY2ssIGR1cmF0aW9uKTtcbiAgICB9LFxuXG4gICAgZW5kQXR0YWNrOiBmdW5jdGlvbiBlbmRBdHRhY2soKSB7XG4gICAgICBpZiAocGxheWVyLmlzQXR0YWNraW5nKSB7XG4gICAgICAgIHBsYXllci5sb2FkVGV4dHVyZShzZXR0aW5ncy5jb2xvcik7XG4gICAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uIHJ1bihkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBtYXhTcGVlZCA9IDMyO1xuICAgICAgdmFyIGFjY2VsZXJhdGlvbiA9IHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gPyA4IDogMzsgLy8gcGxheWVycyBoYXZlIGxlc3MgY29udHJvbCBpbiB0aGUgYWlyXG4gICAgICBwbGF5ZXIub3JpZW50YXRpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIC8vIGlmIHBsYXllciBpcyBnb2luZyBmYXN0ZXIgdGhhbiBtYXggcnVubmluZyBzcGVlZCAoZHVlIHRvIGF0dGFjaywgZXRjKSwgc2xvdyB0aGVtIGRvd24gb3ZlciB0aW1lXG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPCAtbWF4U3BlZWQpIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKz0gYWNjZWxlcmF0aW9uO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gTWF0aC5tYXgocGxheWVyLmJvZHkudmVsb2NpdHkueCAtIGFjY2VsZXJhdGlvbiwgLW1heFNwZWVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IG1heFNwZWVkKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWluKHBsYXllci5ib2R5LnZlbG9jaXR5LnggKyBhY2NlbGVyYXRpb24sIG1heFNwZWVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGp1bXA6IGZ1bmN0aW9uIGp1bXAoKSB7XG4gICAgICBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93bikge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEwMDtcbiAgICAgICAgc2Z4Lmp1bXAoKTtcbiAgICAgIC8vIHdhbGwganVtcHNcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEyMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDQ1O1xuICAgICAgICBzZnguanVtcCgpO1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5yaWdodCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEyMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC00NTtcbiAgICAgICAgc2Z4Lmp1bXAoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGFtcGVuSnVtcDogZnVuY3Rpb24gZGFtcGVuSnVtcCgpIHtcbiAgICAgIC8vIHNvZnRlbiB1cHdhcmQgdmVsb2NpdHkgd2hlbiBwbGF5ZXIgcmVsZWFzZXMganVtcCBrZXlcbiAgICAgICAgdmFyIGRhbXBlblRvUGVyY2VudCA9IDAuNTtcblxuICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueSA8IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ICo9IGRhbXBlblRvUGVyY2VudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkdWNrOiBmdW5jdGlvbiBkdWNrKCkge1xuICAgICAgaWYgKHBsYXllci5pc0F0dGFja2luZyB8fCBwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYXllci5pc0R1Y2tpbmcgJiYgcGxheWVyLmhwID4gMikge1xuICAgICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSAvIDIpO1xuICAgICAgICBhY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcbiAgICAgICAgcGxheWVyLnkgKz0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSB0cnVlO1xuXG4gICAgICAoZnVuY3Rpb24gcm9sbCgpIHtcbiAgICAgICAgdmFyIGNhblJvbGwgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA+IDI1ICYmIHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd247XG4gICAgICAgIGlmIChjYW5Sb2xsKSB7XG4gICAgICAgICAgcGxheWVyLmlzUm9sbGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0oKSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAyKSB7XG4gICAgICAgIHBsYXllci55IC09IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgICAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICAgICAgcGxheWVyLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbiB0YWtlRGFtYWdlKGFtb3VudCkge1xuICAgICAgLy8gcHJldmVudCB0YWtpbmcgbW9yZSBkYW1hZ2UgdGhhbiBocCByZW1haW5pbmcgaW4gY3VycmVudCBsaWZlXG4gICAgICBpZiAoYW1vdW50ID4gMSAmJiAocGxheWVyLmhwIC0gYW1vdW50KSAlIDIgIT09IDApIHtcbiAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmhwIC09IGFtb3VudDtcblxuICAgICAgaWYgKHBsYXllci5ocCA8IDApIHtcbiAgICAgICAgcGxheWVyLmhwID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChwbGF5ZXIuaHAgJSAyID09PSAwKSB7XG4gICAgICAgIGFjdGlvbnMuZGllKCk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgIH0sXG5cbiAgICBhcHBseUhlYWx0aEVmZmVjdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5ld1BsYXllckhlaWdodCA9IE1hdGgubWF4KE1hdGgucm91bmQocGxheWVyLmhwIC8gMiksIDEpO1xuICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIG5ld1BsYXllckhlaWdodCk7XG4gICAgICBhY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcblxuICAgICAgdmFyIG5ld1BsYXllckFscGhhID0gcGxheWVyLmhwICUgMiA9PT0gMCA/IDEgOiAwLjc1O1xuICAgICAgcGxheWVyLmFscGhhID0gbmV3UGxheWVyQWxwaGE7XG4gICAgfSxcblxuICAgIGFwcGx5T3JpZW50YXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHBsYXllci5vcmllbnRhdGlvbiA9PT0gJ2xlZnQnID8gc2V0dGluZ3Muc2NhbGUueCA6IC1zZXR0aW5ncy5zY2FsZS54LCBwbGF5ZXIuc2NhbGUueSk7XG4gICAgfSxcblxuICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocGxheWVyLmlzUGVybWFkZWFkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHBsYXllci5ocCA+IDApIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBhY3Rpb25zLmFwcGx5SW52dWxuZXJhYmlsaXR5KCk7XG4gICAgICAgIH0sIDEwMCk7IC8vIGRlbGF5IGludnVsbiBzbyBwbGF5ZXJzIGRvbid0IHNwYXduIGJlaGluZCBvbmUgYW5vdGhlclxuXG4gICAgICAgIHNmeC5kaWUoKTtcbiAgICAgICAgYWN0aW9ucy5lbmRBdHRhY2soKTtcbiAgICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IDA7XG5cbiAgICAgICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICAgICAgICB2YXIgcmVzcGF3blBvc2l0aW9uID0gdXRpbHMuZ2V0UmFuZG9tQXJyYXlFbGVtZW50KHV0aWxzLmdldFN0YWdlKCkuc3Bhd25Qb2ludHMpO1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueCA9IHJlc3Bhd25Qb3NpdGlvbi54O1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueSA9IHJlc3Bhd25Qb3NpdGlvbi55O1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZngucGVybWFkaWUoKTtcbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKCd3aGl0ZScpO1xuICAgICAgICBwbGF5ZXIuaXNQZXJtYWRlYWQgPSB0cnVlO1xuICAgICAgICBvbkRlYXRoKCk7IC8vIFRPRE86IHRoaXMgY291bGQgcHJvYmFibHkgYmUgYmV0dGVyIGFyY2hpdGVjdGVkXG4gICAgICB9XG4gICAgfSxcblxuICAgIGFwcGx5SW52dWxuZXJhYmlsaXR5OiBmdW5jdGlvbigpIHtcbiAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSBmYWxzZTtcbiAgICAgIHZhciBtYWtlV2hpdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKCd3aGl0ZScpO1xuICAgICAgfTtcbiAgICAgIHZhciBtYWtlQ29sb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKHNldHRpbmdzLmNvbG9yKTtcbiAgICAgIH07XG4gICAgICB2YXIgY29sb3JJbnRlcnZhbCA9IHNldEludGVydmFsKG1ha2VDb2xvciwgMTUwKTtcbiAgICAgIHZhciB3aGl0ZUludGVydmFsO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgd2hpdGVJbnRlcnZhbCA9IHNldEludGVydmFsKG1ha2VXaGl0ZSwgMTUwKTtcbiAgICAgIH0sIDc1KTtcbiAgICAgIG1ha2VDb2xvcigpO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh3aGl0ZUludGVydmFsKTtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChjb2xvckludGVydmFsKTtcbiAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICB9LCAxNTAwKTtcbiAgICB9LFxuICB9O1xuXG4gIHZhciBwbGF5ZXIgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgc2V0dGluZ3MuY29sb3IpO1xuICBwbGF5ZXIubmFtZSA9IHNldHRpbmdzLm5hbWU7XG4gIHBsYXllci5vcmllbnRhdGlvbiA9IHNldHRpbmdzLm9yaWVudGF0aW9uO1xuICBwbGF5ZXIuYW5jaG9yLnNldFRvKC41LC41KTsgLy8gYW5jaG9yIHRvIGNlbnRlciB0byBhbGxvdyBmbGlwcGluZ1xuXG4gIC8vIHRyYWNrIGhlYWx0aFxuICBwbGF5ZXIuaHAgPSBwbGF5ZXIubWF4SHAgPSA2OyAvLyBUT0RPOiBhbGxvdyBzZXR0aW5nIGN1c3RvbSBocCBhbW91bnQgZm9yIGVhY2ggcGxheWVyXG4gIHBsYXllci5hY3Rpb25zID0gYWN0aW9ucztcbiAgcGxheWVyLmFjdGlvbnMuYXBwbHlIZWFsdGhFZmZlY3RzKCk7IC8vIFRPRE86IGFkZCBnaWFudCBtb2RlXG5cbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5lbmFibGUocGxheWVyKTtcbiAgcGxheWVyLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgcGxheWVyLmJvZHkuYm91bmNlLnkgPSAwLjI7IC8vIFRPRE86IGFsbG93IGJvdW5jZSBjb25maWd1cmF0aW9uXG4gIHBsYXllci5ib2R5LmdyYXZpdHkueSA9IDM4MDsgLy8gVE9ETzogYWxsb3cgZ3Jhdml0eSBjb25maWd1cmF0aW9uXG5cbiAgcGxheWVyLnVwV2FzRG93biA9IGZhbHNlOyAvLyB0cmFjayBpbnB1dCBjaGFuZ2UgZm9yIHZhcmlhYmxlIGp1bXAgaGVpZ2h0XG4gIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzUGVybWFkZWFkID0gZmFsc2U7XG4gIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuICAvLyBwaGFzZXIgYXBwYXJlbnRseSBhdXRvbWF0aWNhbGx5IGNhbGxzIGFueSBmdW5jdGlvbiBuYW1lZCB1cGRhdGUgYXR0YWNoZWQgdG8gYSBzcHJpdGUhXG4gIHBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBraWxsIHBsYXllciBpZiBoZSBmYWxscyBvZmYgdGhlIHNjcmVlblxuICAgIGlmIChwbGF5ZXIucG9zaXRpb24ueSA+IDY0ICYmIHBsYXllci5ocCAhPT0gMCkgeyAvLyBUT0RPOiBob3cgdG8gYWNjZXNzIG5hdGl2ZSBoZWlnaHQgZnJvbSBnYW1lLmpzP1xuICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDIpO1xuICAgIH1cblxuICAgIHZhciBpbnB1dCA9IHtcbiAgICAgIGxlZnQ6ICAgKGtleXMubGVmdC5pc0Rvd24gJiYgIWtleXMucmlnaHQuaXNEb3duKSB8fFxuICAgICAgICAgICAgICAoZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0xFRlQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1gpIDwgLTAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9YKSA8IC0wLjEsXG4gICAgICByaWdodDogIChrZXlzLnJpZ2h0LmlzRG93biAmJiAha2V5cy5sZWZ0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9SSUdIVCkgJiYgIWdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9YKSA+IDAuMSxcbiAgICAgIHVwOiAgICAga2V5cy51cC5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1VQKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0EpLFxuICAgICAgZG93bjogICBrZXlzLmRvd24uaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9ET1dOKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1kpID4gMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1kpID4gMC4xLFxuICAgICAgYXR0YWNrOiBrZXlzLmF0dGFjay5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1gpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9ZKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfQikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0xFRlRfQlVNUEVSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfTEVGVF9UUklHR0VSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfUklHSFRfQlVNUEVSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfUklHSFRfVFJJR0dFUiksXG4gICAgfTtcblxuICAgIGlmIChpbnB1dC5sZWZ0KSB7XG4gICAgICBhY3Rpb25zLnJ1bignbGVmdCcpO1xuICAgICAgcGxheWVyLmFjdGlvbnMuYXBwbHlPcmllbnRhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoaW5wdXQucmlnaHQpIHtcbiAgICAgIGFjdGlvbnMucnVuKCdyaWdodCcpO1xuICAgICAgcGxheWVyLmFjdGlvbnMuYXBwbHlPcmllbnRhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAhcGxheWVyLmlzUm9sbGluZykge1xuICAgICAgLy8gYXBwbHkgZnJpY3Rpb25cbiAgICAgIGlmIChNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA8IDIpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAqPSAwLjU7IC8vIHF1aWNrbHkgYnJpbmcgc2xvdy1tb3ZpbmcgcGxheWVycyB0byBhIHN0b3BcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IDApIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSAyO1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IDwgMCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICs9IDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LnVwKSB7XG4gICAgICBwbGF5ZXIudXBXYXNEb3duID0gdHJ1ZTtcbiAgICAgIGFjdGlvbnMuanVtcCgpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLnVwV2FzRG93bikge1xuICAgICAgcGxheWVyLnVwV2FzRG93biA9IGZhbHNlO1xuICAgICAgYWN0aW9ucy5kYW1wZW5KdW1wKCk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmRvd24pIHtcbiAgICAgIGFjdGlvbnMuZHVjaygpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLmlzRHVja2luZykge1xuICAgICAgYWN0aW9ucy5zdGFuZCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5hdHRhY2spIHtcbiAgICAgIGFjdGlvbnMuYXR0YWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBwbGF5ZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBsYXllcjtcbiIsInZhciBzZnggPSAoZnVuY3Rpb24gc2Z4KCkge1xuICBQb2x5c3ludGggPSByZXF1aXJlKCdzdWJwb2x5Jyk7XG5cbiAgdmFyIGF1ZGlvQ3R4O1xuICBpZiAodHlwZW9mIEF1ZGlvQ29udGV4dCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGF1ZGlvQ3R4ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICB9IGVsc2Uge1xuICAgIGF1ZGlvQ3R4ID0gbmV3IHdlYmtpdEF1ZGlvQ29udGV4dCgpO1xuICB9XG5cbiAgdmFyIHB1bHNlID0gbmV3IFBvbHlzeW50aChhdWRpb0N0eCwge1xuICAgIHdhdmVmb3JtOiAnc3F1YXJlJyxcbiAgICByZWxlYXNlOiAwLjAxLFxuICAgIG51bVZvaWNlczogNFxuICB9KTtcbiAgXG4gIGZ1bmN0aW9uIGdldE5vdyh2b2ljZSkge1xuICAgIHZhciBub3cgPSB2b2ljZS5hdWRpb0N0eC5jdXJyZW50VGltZTtcbiAgICByZXR1cm4gbm93O1xuICB9O1xuICBcbiAgdmFyIGp1bXBUaW1lb3V0LCBhdHRhY2tUaW1lb3V0O1xuICB2YXIgZGllVGltZW91dHMgPSBbXTtcblxuICB2YXIgc291bmRFZmZlY3RzID0ge1xuICAgIGp1bXA6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGp1bXBUaW1lb3V0KTtcbiAgICAgIFxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzBdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMC4xOyAvLyBpbiBzZWNvbmRzXG4gICAgICBcbiAgICAgIHZvaWNlLnBpdGNoKDQ0MCk7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuXG4gICAgICB2YXIgbm93ID0gZ2V0Tm93KHZvaWNlKTtcbiAgICAgIHZvaWNlLm9zYy5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoODgwLCBub3cgKyBkdXJhdGlvbik7XG4gICAgICBqdW1wVGltZW91dCA9IHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiAxMDAwKTtcbiAgICB9LFxuXG4gICAgYXR0YWNrOiBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyVGltZW91dChhdHRhY2tUaW1lb3V0KTtcbiAgICAgIFxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzFdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMC4xOyAvLyBpbiBzZWNvbmRzXG4gICAgICBcbiAgICAgIHZvaWNlLnBpdGNoKDg4MCk7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuXG4gICAgICB2YXIgbm93ID0gZ2V0Tm93KHZvaWNlKTtcbiAgICAgIHZvaWNlLm9zYy5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMCwgbm93ICsgZHVyYXRpb24pO1xuICAgICAgYXR0YWNrVGltZW91dCA9IHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiAxMDAwKTtcbiAgICB9LFxuICAgIFxuICAgIGJvdW5jZTogZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhclRpbWVvdXQoYXR0YWNrVGltZW91dCk7XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1syXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDAuMTsgLy8gaW4gc2Vjb25kc1xuICAgICAgXG4gICAgICB2b2ljZS5waXRjaCg0NDApO1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgdmFyIG5vdyA9IGdldE5vdyh2b2ljZSk7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDIyMCwgbm93ICsgZHVyYXRpb24gLyAyKTtcbiAgICAgIHZvaWNlLm9zYy5mcmVxdWVuY3kubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoNjYwLCBub3cgKyBkdXJhdGlvbik7XG4gICAgICBhdHRhY2tUaW1lb3V0ID0gc2V0VGltZW91dCh2b2ljZS5zdG9wLCBkdXJhdGlvbiAqIDEwMDApO1xuICAgIH0sXG4gICAgXG4gICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIHdoaWxlIChkaWVUaW1lb3V0cy5sZW5ndGgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRpZVRpbWVvdXRzLnBvcCgpKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzNdO1xuICAgICAgdmFyIHBpdGNoZXMgPSBbNDQwLCAyMjAsIDExMF07XG4gICAgICB2YXIgZHVyYXRpb24gPSAxMDA7XG5cbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG4gICAgICBcbiAgICAgIHBpdGNoZXMuZm9yRWFjaChmdW5jdGlvbihwaXRjaCwgaSkge1xuICAgICAgICBkaWVUaW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdm9pY2UucGl0Y2gocGl0Y2gpO1xuICAgICAgICB9LCBpICogZHVyYXRpb24pKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBkaWVUaW1lb3V0cy5wdXNoKHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiBwaXRjaGVzLmxlbmd0aCkpO1xuICAgIH0sXG4gICAgcGVybWFkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgd2hpbGUgKGRpZVRpbWVvdXRzLmxlbmd0aCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoZGllVGltZW91dHMucG9wKCkpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdm9pY2UgPSBwdWxzZS52b2ljZXNbM107XG4gICAgICB2YXIgcGl0Y2hlcyA9IFsyMjAsIDE5NiwgMTg1XTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDIwMDtcblxuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgcGl0Y2hlcy5mb3JFYWNoKGZ1bmN0aW9uKHBpdGNoLCBpKSB7XG4gICAgICAgIGRpZVRpbWVvdXRzLnB1c2goc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2b2ljZS5waXRjaChwaXRjaCk7XG4gICAgICAgIH0sIGkgKiBkdXJhdGlvbikpO1xuICAgICAgfSk7XG5cbiAgICAgIGRpZVRpbWVvdXRzLnB1c2goc2V0VGltZW91dCh2b2ljZS5zdG9wLCBkdXJhdGlvbiAqIHBpdGNoZXMubGVuZ3RoKSk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHNvdW5kRWZmZWN0cztcbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2Z4O1xuIiwidmFyIHN0YWdlQnVpbGRlciA9IGZ1bmN0aW9uIHN0YWdlQnVpbGRlcihnYW1lKSB7XG4gIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4vZGF0YS9zZXR0aW5ncy5qcycpO1xuICB2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG4gIHZhciBzdGFnZSA9IHV0aWxzLmdldFN0YWdlKCk7XG5cbiAgZ2FtZS5zdGFnZS5iYWNrZ3JvdW5kQ29sb3IgPSBzdGFnZS5iYWNrZ3JvdW5kQ29sb3I7XG5cbiAgdmFyIGJ1aWxkUGxhdGZvcm1zID0gZnVuY3Rpb24gYnVpbGRQbGF0Zm9ybXMoKSB7XG4gICAgdmFyIHBsYXRmb3JtcyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgcGxhdGZvcm1zLmVuYWJsZUJvZHkgPSB0cnVlO1xuXG4gICAgdmFyIHBsYXRmb3JtUG9zaXRpb25zID0gc3RhZ2UucGxhdGZvcm1zLnBvc2l0aW9ucztcbiAgICBwbGF0Zm9ybVBvc2l0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvc2l0aW9uKSB7XG4gICAgICB2YXIgcGxhdGZvcm0gPSBwbGF0Zm9ybXMuY3JlYXRlKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKTtcbiAgICAgIHBsYXRmb3JtLnNjYWxlLnNldFRvKDUsIDEpO1xuICAgICAgcGxhdGZvcm0uYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIH0pO1xuXG4gICAgdmFyIHdhbGxzID0gW107XG4gICAgd2FsbHMucHVzaChwbGF0Zm9ybXMuY3JlYXRlKC0zLCAtMTIsIHN0YWdlLnBsYXRmb3Jtcy5jb2xvcikpO1xuICAgIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSg2MSwgLTEyLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpKTtcbiAgICB3YWxscy5mb3JFYWNoKGZ1bmN0aW9uKHdhbGwpIHtcbiAgICAgIHdhbGwuc2NhbGUuc2V0VG8oMywgMzgpO1xuICAgICAgd2FsbC5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gICAgfSk7XG5cbiAgICB2YXIgY2VpbGluZyA9IHBsYXRmb3Jtcy5jcmVhdGUoMCwgLTEyLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpO1xuICAgIGNlaWxpbmcuc2NhbGUuc2V0VG8oMzIsIDMpO1xuICAgIGNlaWxpbmcuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIFxuICAgIHJldHVybiBwbGF0Zm9ybXM7XG4gIH07XG5cbiAgdmFyIGJ1aWxkQmFja2dyb3VuZHMgPSBmdW5jdGlvbiBidWlsZEJhY2tncm91bmRzKCkge1xuICAgIHZhciBiYWNrZ3JvdW5kcyA9IGdhbWUuYWRkLmdyb3VwKCk7XG5cbiAgICBzdGFnZS5iYWNrZ3JvdW5kcy5mb3JFYWNoKGZ1bmN0aW9uKGxheWVyKSB7XG4gICAgICB2YXIgYmc7XG4gICAgICBpZiAobGF5ZXIuc2Nyb2xsaW5nKSB7XG4gICAgICAgIGJnID0gZ2FtZS5hZGQudGlsZVNwcml0ZSgwLCAwLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCwgbGF5ZXIuaW1hZ2UpO1xuICAgICAgICBiYWNrZ3JvdW5kcy5sb29wID0gZ2FtZS50aW1lLmV2ZW50cy5sb29wKFBoYXNlci5UaW1lci5RVUFSVEVSLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBiZy50aWxlUG9zaXRpb24ueCAtPTE7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmcgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgbGF5ZXIuaW1hZ2UpO1xuICAgICAgfVxuICAgICAgYmFja2dyb3VuZHMuYWRkKGJnKTtcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gYmFja2dyb3VuZHM7XG4gIH07XG5cbiAgdmFyIGJ1aWxkRm9yZWdyb3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmb3JlZ3JvdW5kID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIHN0YWdlLmZvcmVncm91bmQpO1xuICAgIHJldHVybiBmb3JlZ3JvdW5kO1xuICB9O1xuICBcbiAgcmV0dXJuIHtcbiAgICBidWlsZFBsYXRmb3JtczogYnVpbGRQbGF0Zm9ybXMsXG4gICAgYnVpbGRGb3JlZ3JvdW5kOiBidWlsZEZvcmVncm91bmQsXG4gICAgYnVpbGRCYWNrZ3JvdW5kczogYnVpbGRCYWNrZ3JvdW5kc1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzdGFnZUJ1aWxkZXI7XG4iLCJ2YXIgUGxheSA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHBsYXkgPSB7XG4gICAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHNlbGYuc3ViVWkgPSBnYW1lLmFkZC5ncm91cCgpOyAvLyBwbGFjZSB0byBrZWVwIGFueXRoaW5nIG9uLXNjcmVlbiB0aGF0J3Mgbm90IFVJIHRvIGRlcHRoIHNvcnQgYmVsb3cgVUlcblxuICAgICAgLy8gZ2FtZSBvdmVyIHZpY3RvcnkgbWVzc2FnZSwgZS5nLiBQSU5LIFdJTlNcbiAgICAgIHNlbGYudmljdG9yeU1zZyA9IGdhbWUuYWRkLnNwcml0ZSg5LCAyNCwgJ3ZpY3RvcnlNc2cnKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy52aXNpYmxlID0gZmFsc2U7XG5cbiAgICAgIC8vIG1lbnVcbiAgICAgIHZhciBidWlsZE1lbnUgPSByZXF1aXJlKCcuLi9tZW51LmpzJyk7XG4gICAgICBidWlsZE1lbnUoZ2FtZSwgc2VsZik7IC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIGFwcHJvYWNoIHRoYW4gaW5qZWN0aW5nIHRoZSB3aG9sZSBzdGF0ZSBpbnRvIHRoZSBtZW51IHRvIGxldCBpdCBhY2Nlc3MgZnVuY3Rpb25zIGZvciByZXNldHRpbmcgc3RhZ2UsIHBsYXllcnMsIG11c2ljP1xuXG4gICAgICBzZWxmLnJlc3RhcnQoKTtcbiAgICAgIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIHJlc2V0TXVzaWM6IGZ1bmN0aW9uKHNldHRpbmdzKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBnYW1lLmJnbS5wbGF5KHNldHRpbmdzLmJnbS5zZWxlY3RlZCk7XG4gICAgfSxcblxuICAgIHJlc3RhcnQ6IGZ1bmN0aW9uIHJlc3RhcnQoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGxheWVycyA9IHJlcXVpcmUoJy4uL2RhdGEvcGxheWVycy5qcycpKGdhbWUpO1xuICAgICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vZGF0YS9zZXR0aW5ncycpO1xuICAgICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMuanMnKTtcbiAgICAgIHZhciBzdGFnZUJ1aWxkZXIgPSByZXF1aXJlKCcuLi9zdGFnZUJ1aWxkZXIuanMnKShnYW1lKTtcbiAgICAgIHZhciBzdGFnZSA9IHV0aWxzLmdldFN0YWdlKCk7XG5cbiAgICAgIHNlbGYucmVzZXRNdXNpYyhzZXR0aW5ncyk7XG5cbiAgICAgIC8vIGRlc3Ryb3kgYW5kIHJlYnVpbGQgc3RhZ2UgYW5kIHBsYXllcnNcbiAgICAgIHZhciBkZXN0cm95R3JvdXAgPSBmdW5jdGlvbiBkZXN0cm95R3JvdXAoZ3JvdXApIHtcbiAgICAgICAgaWYgKCFncm91cCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChncm91cC5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZ3JvdXAuY2hpbGRyZW5bMF0uZGVzdHJveSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JvdXAuZGVzdHJveSgpO1xuICAgICAgfVxuXG4gICAgICBkZXN0cm95R3JvdXAoc2VsZi5wbGF5ZXJzKTtcbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLnBsYXRmb3Jtcyk7XG4gICAgICBkZXN0cm95R3JvdXAoc2VsZi5iYWNrZ3JvdW5kcyk7XG5cbiAgICAgIC8vIFRPRE86IHVnaCwgY2xlYW4gdGhpcyB1cCFcbiAgICAgIGlmIChzZWxmLmJhY2tncm91bmRzICYmIHNlbGYuYmFja2dyb3VuZHMubG9vcCkge1xuICAgICAgICBnYW1lLnRpbWUuZXZlbnRzLnJlbW92ZShzZWxmLmJhY2tncm91bmRzLmxvb3ApO1xuICAgICAgfVxuICAgICAgaWYgKHNlbGYuZm9yZWdyb3VuZCkge1xuICAgICAgICBzZWxmLmZvcmVncm91bmQuZGVzdHJveSgpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLnBsYXRmb3JtcyA9IHN0YWdlQnVpbGRlci5idWlsZFBsYXRmb3JtcygpO1xuICAgICAgc2VsZi5iYWNrZ3JvdW5kcyA9IHN0YWdlQnVpbGRlci5idWlsZEJhY2tncm91bmRzKCk7XG4gICAgICBzZWxmLnN1YlVpLmFkZChzZWxmLnBsYXRmb3Jtcyk7XG4gICAgICBzZWxmLnN1YlVpLmFkZChzZWxmLmJhY2tncm91bmRzKTtcblxuICAgICAgc2VsZi5wbGF5ZXJzID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgICAgIHNlbGYuc3ViVWkuYWRkKHNlbGYucGxheWVycyk7XG5cbiAgICAgIHZhciBhZGRQbGF5ZXIgPSBmdW5jdGlvbiBhZGRQbGF5ZXIocGxheWVyKSB7XG4gICAgICAgIHZhciBjaGVja0ZvckdhbWVPdmVyID0gZnVuY3Rpb24gY2hlY2tGb3JHYW1lT3ZlcigpIHtcbiAgICAgICAgICB2YXIgYWxpdmVQbGF5ZXJzID0gW107XG4gICAgICAgICAgc2VsZi5wbGF5ZXJzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24ocGxheWVyLCBpKSB7XG4gICAgICAgICAgICBpZiAoIXBsYXllci5pc1Blcm1hZGVhZCkge1xuICAgICAgICAgICAgICBhbGl2ZVBsYXllcnMucHVzaChwbGF5ZXIubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKGFsaXZlUGxheWVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJJbmRleCA9IHBsYXllcnMubWFwKGZ1bmN0aW9uKHBsYXllcikgeyByZXR1cm4gcGxheWVyLm5hbWUgfSkuaW5kZXhPZihhbGl2ZVBsYXllcnNbMF0pO1xuICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLmZyYW1lID0gcGxheWVySW5kZXg7XG4gICAgICAgICAgICBzZWxmLnZpY3RvcnlNc2cudmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnZpY3RvcnlNc2cudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICBzZWxmLnJlc3RhcnQoKTtcbiAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNyZWF0ZVBsYXllciA9IHJlcXVpcmUoJy4uL3BsYXllci5qcycpO1xuICAgICAgICB2YXIgbmV3UGxheWVyID0gc2VsZi5wbGF5ZXJzLmFkZChjcmVhdGVQbGF5ZXIoZ2FtZSwgcGxheWVyLCBjaGVja0ZvckdhbWVPdmVyKSk7XG4gICAgICAgIHZhciBwb3MgPSBzdGFnZS5zcGF3blBvaW50c1tpXTtcbiAgICAgICAgbmV3UGxheWVyLnBvc2l0aW9uLnggPSBwb3MueDtcbiAgICAgICAgbmV3UGxheWVyLnBvc2l0aW9uLnkgPSBwb3MueTtcbiAgICAgIH07XG5cbiAgICAgIC8vcGxheWVycy5mb3JFYWNoKGFkZFBsYXllcik7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2V0dGluZ3MucGxheWVyQ291bnQuc2VsZWN0ZWQ7IGkrKykge1xuICAgICAgICBhZGRQbGF5ZXIocGxheWVyc1tpXSwgaSk7XG4gICAgICB9XG5cbiAgICAgIHNlbGYuZm9yZWdyb3VuZCA9IHN0YWdlQnVpbGRlci5idWlsZEZvcmVncm91bmQoKTtcbiAgICAgIHNlbGYuc3ViVWkuYWRkKHNlbGYuZm9yZWdyb3VuZCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgXG4gICAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5wbGF5ZXJzLCB0aGlzLnBsYXRmb3Jtcyk7XG4gICAgICAvLyBUT0RPOiBob3cgZG8gaSBkbyB0aGlzIG9uIHRoZSBwbGF5ZXIgaXRzZWxmIHdpdGhvdXQgYWNjZXNzIHRvIHBsYXllcnM/IG9yIHNob3VsZCBpIGFkZCBhIGZ0biB0byBwbGF5ZXIgYW5kIHNldCB0aGF0IGFzIHRoZSBjYj9cbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllcnMsIHRoaXMucGxheWVycywgZnVuY3Rpb24gaGFuZGxlUGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAgICAgIC8qIGxldCdzIG5vdCBrbm9jayBhbnlib2R5IGFyb3VuZCBpZiBzb21ldGhpbmcncyBvbiBvbmUgb2YgdGhlc2UgZHVkZXMnL2R1ZGV0dGVzJyBoZWFkcy5cbiAgICAgICAgIHByZXZlbnRzIGNhbm5vbmJhbGwgYXR0YWNrcyBhbmQgdGhlIGxpa2UsIGFuZCBhbGxvd3Mgc3RhbmRpbmcgb24gaGVhZHMuXG4gICAgICAgICBub3RlOiBzdGlsbCBuZWVkIHRvIGNvbGxpZGUgaW4gb3JkZXIgdG8gdGVzdCB0b3VjaGluZy51cCwgc28gZG9uJ3QgbW92ZSB0aGlzIHRvIGFsbG93UGxheWVyQ29sbGlzaW9uISAqL1xuICAgICAgICBpZiAocGxheWVyQS5ib2R5LnRvdWNoaW5nLnVwIHx8IHBsYXllckIuYm9keS50b3VjaGluZy51cCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXIpIHtcbiAgICAgICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gZmFsc2U7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSB0cnVlO1xuICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBib3VuY2UoKSB7XG4gICAgICAgICAgZ2FtZS5zZnguYm91bmNlKCk7XG5cbiAgICAgICAgICB2YXIgYm91bmNlVmVsb2NpdHkgPSA1MDtcbiAgICAgICAgICB2YXIgdmVsb2NpdHlBLCB2ZWxvY2l0eUI7XG4gICAgICAgICAgdmVsb2NpdHlBID0gdmVsb2NpdHlCID0gYm91bmNlVmVsb2NpdHk7XG4gICAgICAgICAgaWYgKHBsYXllckEucG9zaXRpb24ueCA+IHBsYXllckIucG9zaXRpb24ueCkge1xuICAgICAgICAgICAgdmVsb2NpdHlCICo9IC0xO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2ZWxvY2l0eUEgKj0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXllckEuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlBO1xuICAgICAgICAgIHBsYXllckIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlCO1xuICAgICAgICAgIHBsYXllckEuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgcGxheWVyQi5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGZsaW5nKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LmJvdW5jZSgpO1xuXG4gICAgICAgICAgdmFyIHBsYXllclRvRmxpbmc7XG4gICAgICAgICAgdmFyIHBsYXllclRvTGVhdmU7XG4gICAgICAgICAgaWYgKHBsYXllckEuaXNEdWNraW5nKSB7XG4gICAgICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQjtcbiAgICAgICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJBO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQTtcbiAgICAgICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJCO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyVG9GbGluZyk7XG4gICAgICAgICAgdmFyIGZsaW5nWFZlbG9jaXR5ID0gNzU7XG4gICAgICAgICAgaWYgKHBsYXllclRvRmxpbmcucG9zaXRpb24ueCA+IHBsYXllclRvTGVhdmUucG9zaXRpb24ueCkge1xuICAgICAgICAgICAgZmxpbmdYVmVsb2NpdHkgKj0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS54ID0gZmxpbmdYVmVsb2NpdHk7XG4gICAgICAgICAgcGxheWVyVG9GbGluZy5ib2R5LnZlbG9jaXR5LnkgPSAtNzU7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwb3AoKSB7XG4gICAgICAgICAgZ2FtZS5zZnguYm91bmNlKCk7XG5cbiAgICAgICAgICB2YXIgcGxheWVyVG9Qb3A7XG4gICAgICAgICAgaWYgKHBsYXllckEuaXNSb2xsaW5nKSB7XG4gICAgICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllclRvUG9wID0gcGxheWVyQTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvUG9wKTtcbiAgICAgICAgICBwbGF5ZXJUb1BvcC5ib2R5LnZlbG9jaXR5LnkgPSAtNzU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYm90aFJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyAmJiBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICAgICAgdmFyIGJvdGhTdGFuZGluZyA9ICFwbGF5ZXJBLmlzRHVja2luZyAmJiAhcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgICAgIHZhciBuZWl0aGVyUm9sbGluZyA9ICFwbGF5ZXJBLmlzUm9sbGluZyAmJiAhcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgICAgIHZhciBlaXRoZXJEdWNraW5nID0gcGxheWVyQS5pc0R1Y2tpbmcgfHwgcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgICAgIHZhciBlaXRoZXJSdW5uaW5nID0gTWF0aC5hYnMocGxheWVyQS5ib2R5LnZlbG9jaXR5LngpID4gMjggfHwgTWF0aC5hYnMocGxheWVyQi5ib2R5LnZlbG9jaXR5LngpID49IDI4O1xuICAgICAgICB2YXIgZWl0aGVyUm9sbGluZyA9IHBsYXllckEuaXNSb2xsaW5nIHx8IHBsYXllckIuaXNSb2xsaW5nO1xuICAgICAgICB2YXIgZWl0aGVyU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgfHwgIXBsYXllckIuaXNEdWNraW5nO1xuXG4gICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICAgIGNhc2UgYm90aFJvbGxpbmcgfHwgYm90aFN0YW5kaW5nOlxuICAgICAgICAgICAgYm91bmNlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIG5laXRoZXJSb2xsaW5nICYmIGVpdGhlclJ1bm5pbmcgJiYgZWl0aGVyRHVja2luZzpcbiAgICAgICAgICAgIGZsaW5nKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGVpdGhlclJvbGxpbmcgJiYgZWl0aGVyU3RhbmRpbmc6XG4gICAgICAgICAgICBwb3AoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgb25seSBvbmUgb2YgdGhlIHRvdWNoaW5nIHBsYXllcnMgaXMgYXR0YWNraW5nLi4uXG4gICAgICAgIGlmIChwbGF5ZXJBLmlzQXR0YWNraW5nICE9PSBwbGF5ZXJCLmlzQXR0YWNraW5nKSB7XG4gICAgICAgICAgdmFyIHZpY3RpbSA9IHBsYXllckEuaXNBdHRhY2tpbmcgPyBwbGF5ZXJCIDogcGxheWVyQTtcbiAgICAgICAgICBpZiAocGxheWVyQS5vcmllbnRhdGlvbiAhPT0gcGxheWVyQi5vcmllbnRhdGlvbikge1xuICAgICAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgyKTsgLy8gYXR0YWNrZWQgZnJvbSBiZWhpbmQgZm9yIGRvdWJsZSBkYW1hZ2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSwgZnVuY3Rpb24gYWxsb3dQbGF5ZXJDb2xsaXNpb24ocGxheWVyQSwgcGxheWVyQikge1xuICAgICAgICAvLyBkb24ndCBhbGxvdyBjb2xsaXNpb24gaWYgZWl0aGVyIHBsYXllciBpc24ndCBjb2xsaWRhYmxlLlxuICAgICAgICAvLyBhbHNvIGRpc2FsbG93IGlmIHBsYXllciBpcyBpbiBsaW1ibyBiZWxvdyB0aGUgc2NyZWVuIDpdXG4gICAgICAgIGlmICghcGxheWVyQS5pc0NvbGxpZGFibGUgfHwgIXBsYXllckIuaXNDb2xsaWRhYmxlIHx8IHBsYXllckEucG9zaXRpb24ueSA+IGdhbWUuaGVpZ2h0IHx8IHBsYXllckIucG9zaXRpb24ueSA+IGdhbWUuaGVpZ2h0KSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHBsYXk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXk7XG4iLCJ2YXIgU3BsYXNoID0gZnVuY3Rpb24oZ2FtZSkge1xuICB2YXIgc3BsYXNoID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVE9ETzogaW50cm8gYW5pbWF0aW9uXG4gICAgICBnYW1lLnNmeCA9IHJlcXVpcmUoJy4uL3NmeC5qcycpO1xuICAgICAgZ2FtZS5iZ20gPSByZXF1aXJlKCcuLi9tdXNpYycpKCk7XG4gICAgfSxcblxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gaW1hZ2VzXG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3RpdGxlJywgJ2ltYWdlcy90aXRsZS5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnY2xlYXInLCAnaW1hZ2VzL2NsZWFyLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCd3aGl0ZScsICdpbWFnZXMvd2hpdGUucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3BpbmsnLCAnaW1hZ2VzL3BpbmsucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3llbGxvdycsICdpbWFnZXMveWVsbG93LnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdibHVlJywgJ2ltYWdlcy9ibHVlLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdvcmFuZ2UnLCAnaW1hZ2VzL29yYW5nZS5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnZ3JlZW4nLCAnaW1hZ2VzL2dyZWVuLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdncmF5JywgJ2ltYWdlcy9ncmF5LnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdicm93bicsICdpbWFnZXMvYnJvd24ucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3dhdGVyZmFsbCcsICdpbWFnZXMvd2F0ZXJmYWxsLmdpZicpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdoYW5nYXInLCAnaW1hZ2VzL2hhbmdhci5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgndmljdG9yeU1zZycsICdpbWFnZXMvdmljdG9yeU1zZy5wbmcnLCA0NywgNik7XG4gICAgfSxcblxuICAgIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICBnYW1lLmJnbS5wbGF5KCd0aXRsZS54bScpO1xuICAgICAgZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdoYW5nYXInKTtcbiAgICAgIGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAndGl0bGUnKTtcblxuICAgICAgdmFyIHN0YXJ0R2FtZSA9IGZ1bmN0aW9uIHN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKGdhbWUuc3RhdGUuY3VycmVudCA9PT0gJ3NwbGFzaCcpIHtcbiAgICAgICAgICBnYW1lLmJnbS5wbGF5KCdOb25lJyk7XG4gICAgICAgICAgZ2FtZS5zdGF0ZS5zdGFydCgncGxheScpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBzdGFydCBnYW1lIHdoZW4gc3RhcnQvZW50ZXIgaXMgcHJlc3NlZFxuICAgICAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkT25jZShzdGFydEdhbWUpO1xuICAgICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5zdXBwb3J0ZWQgJiYgZ2FtZS5pbnB1dC5nYW1lcGFkLmFjdGl2ZSAmJiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5jb25uZWN0ZWQpIHtcbiAgICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGRPbmNlKHN0YXJ0R2FtZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHNwbGFzaDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3BsYXNoO1xuIiwidmFyIHV0aWxzID0ge1xuICAvLyBmcm9tIHVuZGVyc2NvcmVcbiAgZGVib3VuY2U6IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuXHR2YXIgdGltZW91dDtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0aWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0fTtcblx0XHR2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcblx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9O1xuICB9LFxuXG4gIGNlbnRlcjogZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgZW50aXR5LmFuY2hvci5zZXRUbygwLjUpO1xuICB9LFxuXG4gIC8vIFRPRE86IGNvbnNpZGVyIGluamVjdGluZyBkZXBlbmRlbmNpZXNcbiAgZ2V0U3RhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFnZXMgPSByZXF1aXJlKCcuL2RhdGEvc3RhZ2VzJyk7XG4gICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzJyk7XG4gICAgdmFyIHN0YWdlID0gc3RhZ2VzLmZpbHRlcihmdW5jdGlvbihzdGFnZSkge1xuICAgICAgcmV0dXJuIHN0YWdlLm5hbWUgPT09IHNldHRpbmdzLnN0YWdlLnNlbGVjdGVkO1xuICAgIH0pWzBdO1xuICAgIHJldHVybiBzdGFnZTtcbiAgfSxcblxuICBnZXRSYW5kb21BcnJheUVsZW1lbnQ6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIGFycmF5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFycmF5Lmxlbmd0aCldO1xuICB9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlscztcbiJdfQ==
