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
    
    // assets used in loading screen
    game.load.image('loading', 'images/loading.gif');
  },

  create: function create() {
    game.state.add('loading', require('./states/loading.js')(game));
    game.state.start('loading');
  }
};

var game = new Phaser.Game(64, 64, Phaser.AUTO, 'game', {
  preload: main.preload,
  create: main.create
}, false, false); // disable anti-aliasing

game.state.add('main', main);
game.state.start('main');

},{"./states/loading.js":12,"./utils.js":15}],7:[function(require,module,exports){
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

},{"./sfx.js":10,"./utils":15}],10:[function(require,module,exports){
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

},{"./data/settings.js":4,"./utils.js":15}],12:[function(require,module,exports){
var Loading = function(game) {
  var loading = {
    init: function() {
      game.add.sprite(0, 0, 'loading');
      document.getElementById('loading').style.display = 'none';
    },

    preload: function() {
      // images
      game.load.image('title', 'images/title.gif');
      game.load.image('clear', 'images/clear.png');
      game.load.image('white', 'images/white.png');
      game.load.image('pink', 'images/pink.png');
      game.load.image('yellow', 'images/yellow.png');
      game.load.image('blue', 'images/blue.png');
      game.load.image('purple', 'images/purple.png');
      game.load.image('orange', 'images/orange.png');
      game.load.image('green', 'images/green.png');
      game.load.image('gray', 'images/gray.png');
      game.load.image('brown', 'images/brown.png');
      game.load.image('waterfall', 'images/waterfall.gif');
      game.load.image('hangar', 'images/hangar.gif');
      game.load.spritesheet('victoryMsg', 'images/victoryMsg.png', 47, 6);

      // sound
      game.sfx = require('../sfx.js');
      game.bgm = require('../music')();
    },

    create: function() {
      game.input.gamepad.start();

      game.state.add('splash', require('./splash.js')(game));
      game.state.add('play', require('./play.js')(game));
      game.state.start('splash');
    }
  };
  
  return loading;
};

module.exports = Loading;

},{"../music":8,"../sfx.js":10,"./play.js":13,"./splash.js":14}],13:[function(require,module,exports){
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

},{"../data/players.js":3,"../data/settings":4,"../menu.js":7,"../player.js":9,"../stageBuilder.js":11,"../utils.js":15}],14:[function(require,module,exports){
var Splash = function(game) {
  var splash = {
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

},{}],15:[function(require,module,exports){
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

},{"./data/settings":4,"./data/stages":5}]},{},[6]);
