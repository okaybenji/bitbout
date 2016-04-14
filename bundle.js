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
    options: ['hangar.xm', 'title.xm', 'None'],
    selected: 'None',
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
  "theme": "None",
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
  "theme": "hangar.xm",
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
  "theme": "title.xm",
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

      // if stage has a default bgm, load it
      var stages = require('./data/stages.js');
      var selectedStage = stages[settings.stage.options.indexOf(settings.stage.selected)];
      if (selectedStage.theme) {
        settings.bgm.selected = selectedStage.theme;
      }

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

},{"./data/settings.js":4,"./data/stages.js":5}],8:[function(require,module,exports){
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

      if (player.hp % 2 === 1) {
        player.scarf.visible = false;
      } else {
        player.scarf.visible = true;
      }
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
        player.alpha = 0.5;
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

  player.scarf = game.add.sprite(-4, -1, settings.color + 'Scarf');
  player.scarf.animations.add('scarf');
  player.scarf.animations.play('scarf', 32/3, true);
  player.scarf.setScaleMinMax(-1, 1, 1, 1);
  player.addChild(player.scarf);

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
      game.load.spritesheet('title', 'images/spritesheet-title.gif', 64, 64);
      game.load.spritesheet('victoryMsg', 'images/spritesheet-winner.gif', 52, 22);
      game.load.spritesheet('blueScarf', 'images/spritesheet-scarf-bluebit.gif', 5, 2);
      game.load.spritesheet('pinkScarf', 'images/spritesheet-scarf-pinkbit.gif', 5, 2);
      game.load.spritesheet('greenScarf', 'images/spritesheet-scarf-greenbit.gif', 5, 2);
      game.load.spritesheet('purpleScarf', 'images/spritesheet-scarf-purplebit.gif', 5, 2);
      game.load.spritesheet('jump', 'images/spritesheet-jump.gif', 5, 2);
      game.load.spritesheet('land', 'images/spritesheet-land.gif', 5, 2);
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
      game.load.image('waterfall', 'images/level-waterfall-wip.gif');
      game.load.image('hangar', 'images/level-hangar-wip.gif');

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

      // game over victory message declaring the winner
      self.victoryMsg = game.add.sprite(6, 21, 'victoryMsg');
      self.victoryMsg.visible = false;
      self.victoryMsg.animations.add('Blue', [0, 4, 8, 12], 32/3, true);
      self.victoryMsg.animations.add('Pink', [1, 5, 9, 13], 32/3, true);
      self.victoryMsg.animations.add('Green', [2, 6, 10, 14], 32/3, true);
      self.victoryMsg.animations.add('Purple', [3, 7, 11, 15], 32/3, true);

      // menu
      var buildMenu = require('../menu.js');
      buildMenu(game, self); // TODO: is there a better approach than injecting the whole state into the menu to let it access functions for resetting stage, players, music?

      self.restart();
      game.physics.startSystem(Phaser.Physics.ARCADE);
      game.input.gamepad.start();
    },

    resetMusic: function(settings) {
      game.bgm.play(settings.bgm.selected);
    },

    restart: function restart() {
      var self = this;
      var players = require('../data/players.js')(game);
      var settings = require('../data/settings');
      var utils = require('../utils.js');
      var stageBuilder = require('../stageBuilder.js')(game);
      var stage = utils.getStage();

      // if stage has a default bgm, load it
      if (stage.theme) {
        settings.bgm.selected = stage.theme;
      }
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
            self.victoryMsg.play(alivePlayers[0]);
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
      var title = game.add.sprite(0, 0, 'title');
      title.animations.add('title');
      title.animations.play('title', 32/3, true);

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

},{"./data/settings":4,"./data/stages":5}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL3N1YnBvbHkvbm9kZV9tb2R1bGVzL3N1Ym1vbm8vc3VibW9uby5qcyIsIm5vZGVfbW9kdWxlcy9zdWJwb2x5L3N1YnBvbHkuanMiLCJzY3JpcHRzL2RhdGEvcGxheWVycy5qcyIsInNjcmlwdHMvZGF0YS9zZXR0aW5ncy5qcyIsInNjcmlwdHMvZGF0YS9zdGFnZXMuanMiLCJzY3JpcHRzL21haW4uanMiLCJzY3JpcHRzL21lbnUuanMiLCJzY3JpcHRzL211c2ljLmpzIiwic2NyaXB0cy9wbGF5ZXIuanMiLCJzY3JpcHRzL3NmeC5qcyIsInNjcmlwdHMvc3RhZ2VCdWlsZGVyLmpzIiwic2NyaXB0cy9zdGF0ZXMvbG9hZGluZy5qcyIsInNjcmlwdHMvc3RhdGVzL3BsYXkuanMiLCJzY3JpcHRzL3N0YXRlcy9zcGxhc2guanMiLCJzY3JpcHRzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBNb25vc3ludGggPSBmdW5jdGlvbiBNb25vc3ludGgoYXVkaW9DdHgsIGNvbmZpZykge1xuICB2YXIgc3ludGg7XG4gIHZhciBTeW50aCA9IGZ1bmN0aW9uIFN5bnRoKCkge1xuICAgIHN5bnRoID0gdGhpcztcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uZmlnLmN1dG9mZiA9IGNvbmZpZy5jdXRvZmYgfHwge307XG5cbiAgICBzeW50aC5hdWRpb0N0eCA9IGF1ZGlvQ3R4LFxuICAgIHN5bnRoLmFtcCAgICAgID0gYXVkaW9DdHguY3JlYXRlR2FpbigpLFxuICAgIHN5bnRoLmZpbHRlciAgID0gYXVkaW9DdHguY3JlYXRlQmlxdWFkRmlsdGVyKCksXG4gICAgc3ludGgub3NjICAgICAgPSBhdWRpb0N0eC5jcmVhdGVPc2NpbGxhdG9yKCksXG4gICAgc3ludGgucGFuICAgICAgPSBhdWRpb0N0eC5jcmVhdGVQYW5uZXIoKSxcblxuICAgIHN5bnRoLm1heEdhaW4gID0gY29uZmlnLm1heEdhaW4gIHx8IDAuOSwgLy8gb3V0IG9mIDFcbiAgICBzeW50aC5hdHRhY2sgICA9IGNvbmZpZy5hdHRhY2sgICB8fCAwLjEsIC8vIGluIHNlY29uZHNcbiAgICBzeW50aC5kZWNheSAgICA9IGNvbmZpZy5kZWNheSAgICB8fCAwLjAsIC8vIGluIHNlY29uZHNcbiAgICBzeW50aC5zdXN0YWluICA9IGNvbmZpZy5zdXN0YWluICB8fCAxLjAsIC8vIG91dCBvZiAxXG4gICAgc3ludGgucmVsZWFzZSAgPSBjb25maWcucmVsZWFzZSAgfHwgMC44LCAvLyBpbiBzZWNvbmRzXG5cbiAgICAvLyBsb3ctcGFzcyBmaWx0ZXJcbiAgICBzeW50aC5jdXRvZmYgICAgICAgICAgICAgID0gc3ludGguZmlsdGVyLmZyZXF1ZW5jeTtcbiAgICBzeW50aC5jdXRvZmYubWF4RnJlcXVlbmN5ID0gY29uZmlnLmN1dG9mZi5tYXhGcmVxdWVuY3kgfHwgNzUwMDsgLy8gaW4gaGVydHpcbiAgICBzeW50aC5jdXRvZmYuYXR0YWNrICAgICAgID0gY29uZmlnLmN1dG9mZi5hdHRhY2sgICAgICAgfHwgMC4xOyAvLyBpbiBzZWNvbmRzXG4gICAgc3ludGguY3V0b2ZmLmRlY2F5ICAgICAgICA9IGNvbmZpZy5jdXRvZmYuZGVjYXkgICAgICAgIHx8IDIuNTsgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLmN1dG9mZi5zdXN0YWluICAgICAgPSBjb25maWcuY3V0b2ZmLnN1c3RhaW4gICAgICB8fCAwLjI7IC8vIG91dCBvZiAxXG4gICAgXG4gICAgc3ludGguYW1wLmdhaW4udmFsdWUgPSAwO1xuICAgIHN5bnRoLmZpbHRlci50eXBlID0gJ2xvd3Bhc3MnO1xuICAgIHN5bnRoLmZpbHRlci5jb25uZWN0KHN5bnRoLmFtcCk7XG4gICAgc3ludGguYW1wLmNvbm5lY3QoYXVkaW9DdHguZGVzdGluYXRpb24pO1xuICAgIHN5bnRoLnBhbi5wYW5uaW5nTW9kZWwgPSAnZXF1YWxwb3dlcic7XG4gICAgc3ludGgucGFuLnNldFBvc2l0aW9uKDAsIDAsIDEpOyAvLyBzdGFydCB3aXRoIHN0ZXJlbyBpbWFnZSBjZW50ZXJlZFxuICAgIHN5bnRoLm9zYy5jb25uZWN0KHN5bnRoLnBhbik7XG4gICAgc3ludGgucGFuLmNvbm5lY3Qoc3ludGguZmlsdGVyKTtcbiAgICBzeW50aC5vc2Muc3RhcnQoMCk7XG4gICAgXG4gICAgc3ludGgud2F2ZWZvcm0oY29uZmlnLndhdmVmb3JtIHx8ICdzaW5lJyk7XG4gICAgc3ludGgucGl0Y2goY29uZmlnLnBpdGNoIHx8IDQ0MCk7XG5cbiAgICByZXR1cm4gc3ludGg7XG4gIH07XG5cbiAgZnVuY3Rpb24gZ2V0Tm93KCkge1xuICAgIHZhciBub3cgPSBzeW50aC5hdWRpb0N0eC5jdXJyZW50VGltZTtcbiAgICBzeW50aC5hbXAuZ2Fpbi5jYW5jZWxTY2hlZHVsZWRWYWx1ZXMobm93KTtcbiAgICBzeW50aC5hbXAuZ2Fpbi5zZXRWYWx1ZUF0VGltZShzeW50aC5hbXAuZ2Fpbi52YWx1ZSwgbm93KTtcbiAgICByZXR1cm4gbm93O1xuICB9O1xuICBcbiAgU3ludGgucHJvdG90eXBlLnBpdGNoID0gZnVuY3Rpb24gcGl0Y2gobmV3UGl0Y2gpIHtcbiAgICBpZiAobmV3UGl0Y2gpIHtcbiAgICAgIHZhciBub3cgPSBzeW50aC5hdWRpb0N0eC5jdXJyZW50VGltZTtcbiAgICAgIHN5bnRoLm9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUobmV3UGl0Y2gsIG5vdyk7XG4gICAgfVxuICAgIHJldHVybiBzeW50aC5vc2MuZnJlcXVlbmN5LnZhbHVlO1xuICB9O1xuXG4gIFN5bnRoLnByb3RvdHlwZS53YXZlZm9ybSA9IGZ1bmN0aW9uIHdhdmVmb3JtKG5ld1dhdmVmb3JtKSB7XG4gICAgaWYgKG5ld1dhdmVmb3JtKSB7XG4gICAgICBzeW50aC5vc2MudHlwZSA9IG5ld1dhdmVmb3JtO1xuICAgIH1cbiAgICByZXR1cm4gc3ludGgub3NjLnR5cGU7XG4gIH07XG5cbiAgLy8gYXBwbHkgYXR0YWNrLCBkZWNheSwgc3VzdGFpbiBlbnZlbG9wZVxuICBTeW50aC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiBzdGFydFN5bnRoKCkge1xuICAgIHZhciBhdGsgID0gcGFyc2VGbG9hdChzeW50aC5hdHRhY2spO1xuICAgIHZhciBkZWMgID0gcGFyc2VGbG9hdChzeW50aC5kZWNheSk7XG4gICAgdmFyIGNBdGsgPSBwYXJzZUZsb2F0KHN5bnRoLmN1dG9mZi5hdHRhY2spO1xuICAgIHZhciBjRGVjID0gcGFyc2VGbG9hdChzeW50aC5jdXRvZmYuZGVjYXkpO1xuICAgIHZhciBub3cgID0gZ2V0Tm93KCk7XG4gICAgc3ludGguY3V0b2ZmLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyhub3cpO1xuICAgIHN5bnRoLmN1dG9mZi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShzeW50aC5jdXRvZmYudmFsdWUsIG5vdyk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi5tYXhGcmVxdWVuY3ksIG5vdyArIGNBdGspO1xuICAgIHN5bnRoLmN1dG9mZi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShzeW50aC5jdXRvZmYuc3VzdGFpbiAqIHN5bnRoLmN1dG9mZi5tYXhGcmVxdWVuY3ksIG5vdyArIGNBdGsgKyBjRGVjKTtcbiAgICBzeW50aC5hbXAuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZShzeW50aC5tYXhHYWluLCBub3cgKyBhdGspO1xuICAgIHN5bnRoLmFtcC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLnN1c3RhaW4gKiBzeW50aC5tYXhHYWluLCBub3cgKyBhdGsgKyBkZWMpO1xuICB9O1xuXG4gIC8vIGFwcGx5IHJlbGVhc2UgZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wU3ludGgoKSB7XG4gICAgdmFyIHJlbCA9IHBhcnNlRmxvYXQoc3ludGgucmVsZWFzZSk7XG4gICAgdmFyIG5vdyA9IGdldE5vdygpO1xuICAgIHN5bnRoLmFtcC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAsIG5vdyArIHJlbCk7XG4gIH07XG5cbiAgcmV0dXJuIG5ldyBTeW50aCgpO1xufTtcblxuLy8gbnBtIHN1cHBvcnRcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gTW9ub3N5bnRoO1xufVxuIiwiLy8gbnBtIHN1cHBvcnRcbmlmICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgdmFyIE1vbm9zeW50aCA9IHJlcXVpcmUoJ3N1Ym1vbm8nKTtcbn1cblxudmFyIFBvbHlzeW50aCA9IGZ1bmN0aW9uIFBvbHlzeW50aChhdWRpb0N0eCwgY29uZmlnKSB7XG4gIHZhciBzeW50aDtcbiAgdmFyIFN5bnRoID0gZnVuY3Rpb24gU3ludGgoKSB7XG4gICAgc3ludGggPSB0aGlzO1xuICAgIHN5bnRoLmF1ZGlvQ3R4ID0gYXVkaW9DdHg7XG4gICAgc3ludGgudm9pY2VzID0gW107XG4gICAgXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGNvbmZpZy5jdXRvZmYgPSBjb25maWcuY3V0b2ZmIHx8IHt9O1xuXG5cbiAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBjb25maWcubnVtVm9pY2VzIHx8IDE2OyBpIDwgaWk7IGkrKykge1xuICAgICAgc3ludGgudm9pY2VzLnB1c2gobmV3IE1vbm9zeW50aChhdWRpb0N0eCwgY29uZmlnKSk7XG4gICAgfVxuXG4gICAgc3ludGguc3RlcmVvV2lkdGggPSBjb25maWcuc3RlcmVvV2lkdGggfHwgMC41OyAvLyBvdXQgb2YgMVxuICAgIHN5bnRoLndpZHRoKHN5bnRoLnN0ZXJlb1dpZHRoKTtcblxuICAgIHJldHVybiBzeW50aDtcbiAgfTtcblxuICAvLyBhcHBseSBhdHRhY2ssIGRlY2F5LCBzdXN0YWluIGVudmVsb3BlXG4gIFN5bnRoLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIHN0YXJ0U3ludGgoKSB7XG4gICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc3RhcnRWb2ljZSh2b2ljZSkge1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBhcHBseSByZWxlYXNlIGVudmVsb3BlXG4gIFN5bnRoLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gc3RvcFN5bnRoKCkge1xuICAgIHN5bnRoLnZvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIHN0b3BWb2ljZSh2b2ljZSkge1xuICAgICAgdm9pY2Uuc3RvcCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIGdldC9zZXQgc3ludGggc3RlcmVvIHdpZHRoXG4gIFN5bnRoLnByb3RvdHlwZS53aWR0aCA9IGZ1bmN0aW9uIHdpZHRoKG5ld1dpZHRoKSB7XG4gICAgaWYgKHN5bnRoLnZvaWNlcy5sZW5ndGggPiAxICYmIG5ld1dpZHRoKSB7XG4gICAgICBzeW50aC5zdGVyZW9XaWR0aCA9IG5ld1dpZHRoO1xuICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gcGFuVm9pY2Uodm9pY2UsIGkpIHtcbiAgICAgICAgdmFyIHNwcmVhZCA9IDEvKHN5bnRoLnZvaWNlcy5sZW5ndGggLSAxKTtcbiAgICAgICAgdmFyIHhQb3MgPSBzcHJlYWQgKiBpICogc3ludGguc3RlcmVvV2lkdGg7XG4gICAgICAgIHZhciB6UG9zID0gMSAtIE1hdGguYWJzKHhQb3MpO1xuICAgICAgICB2b2ljZS5wYW4uc2V0UG9zaXRpb24oeFBvcywgMCwgelBvcyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3ludGguc3RlcmVvV2lkdGg7XG4gIH07XG5cbiAgLy8gY29udmVuaWVuY2UgbWV0aG9kcyBmb3IgY2hhbmdpbmcgdmFsdWVzIG9mIGFsbCBNb25vc3ludGhzJyBwcm9wZXJ0aWVzIGF0IG9uY2VcbiAgKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcnMoKSB7XG4gICAgdmFyIG1vbm9zeW50aFByb3BlcnRpZXMgPSBbJ21heEdhaW4nLCAnYXR0YWNrJywgJ2RlY2F5JywgJ3N1c3RhaW4nLCAncmVsZWFzZSddO1xuICAgIHZhciBtb25vc3ludGhDdXRvZmZQcm9wZXJ0aWVzID0gWydtYXhGcmVxdWVuY3knLCAnYXR0YWNrJywgJ2RlY2F5JywgJ3N1c3RhaW4nXTtcblxuICAgIG1vbm9zeW50aFByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiBjcmVhdGVTZXR0ZXIocHJvcGVydHkpIHtcbiAgICAgIFN5bnRoLnByb3RvdHlwZVtwcm9wZXJ0eV0gPSBmdW5jdGlvbiBzZXRWYWx1ZXMobmV3VmFsdWUpIHtcbiAgICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc2V0VmFsdWUodm9pY2UpIHtcbiAgICAgICAgICB2b2ljZVtwcm9wZXJ0eV0gPSBuZXdWYWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgU3ludGgucHJvdG90eXBlLmN1dG9mZiA9IHt9O1xuICAgIG1vbm9zeW50aEN1dG9mZlByb3BlcnRpZXMuZm9yRWFjaChmdW5jdGlvbiBjcmVhdGVTZXR0ZXIocHJvcGVydHkpIHtcbiAgICAgIFN5bnRoLnByb3RvdHlwZS5jdXRvZmZbcHJvcGVydHldID0gZnVuY3Rpb24gc2V0VmFsdWVzKG5ld1ZhbHVlKSB7XG4gICAgICAgIHN5bnRoLnZvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIHNldFZhbHVlKHZvaWNlKSB7XG4gICAgICAgICAgdm9pY2UuY3V0b2ZmW3Byb3BlcnR5XSA9IG5ld1ZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBTeW50aC5wcm90b3R5cGUud2F2ZWZvcm0gPSBmdW5jdGlvbiB3YXZlZm9ybShuZXdXYXZlZm9ybSkge1xuICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gd2F2ZWZvcm0odm9pY2UpIHtcbiAgICAgICAgdm9pY2Uud2F2ZWZvcm0obmV3V2F2ZWZvcm0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIFN5bnRoLnByb3RvdHlwZS5waXRjaCA9IGZ1bmN0aW9uIHBpdGNoKG5ld1BpdGNoKSB7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBwaXRjaCh2b2ljZSkge1xuICAgICAgICB2b2ljZS5waXRjaChuZXdQaXRjaCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9KSgpO1xuXG4gIHJldHVybiBuZXcgU3ludGg7XG59O1xuXG4vLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBQb2x5c3ludGg7XG59XG4iLCJ2YXIgUGxheWVycyA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICB2YXIgcGxheWVycyA9IFt7XG4gICAgICBuYW1lOiAnQmx1ZScsXG4gICAgICBjb2xvcjogJ2JsdWUnLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnVycsIGRvd246ICdTJywgbGVmdDogJ0EnLCByaWdodDogJ0QnLCBhdHRhY2s6ICdRJ1xuICAgICAgfSxcbiAgICB9LCB7XG4gICAgICBuYW1lOiAnUGluaycsXG4gICAgICBjb2xvcjogJ3BpbmsnLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDIsXG4gICAgICBvcmllbnRhdGlvbjogJ2xlZnQnLFxuICAgIH0sIHtcbiAgICAgIG5hbWU6ICdHcmVlbicsXG4gICAgICBjb2xvcjogJ2dyZWVuJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQzLFxuICAgICAga2V5czoge1xuICAgICAgICB1cDogJ0knLCBkb3duOiAnSycsIGxlZnQ6ICdKJywgcmlnaHQ6ICdMJywgYXR0YWNrOiAnVSdcbiAgICAgIH0sXG4gICAgfSwge1xuICAgICAgbmFtZTogJ1B1cnBsZScsXG4gICAgICBjb2xvcjogJ3B1cnBsZScsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkNCxcbiAgICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnVCcsIGRvd246ICdHJywgbGVmdDogJ0YnLCByaWdodDogJ0gnLCBhdHRhY2s6ICdSJ1xuICAgICAgfSxcbiAgfV07XG4gIFxuICByZXR1cm4gcGxheWVycztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVycztcbiIsInZhciBzdGFnZXMgPSByZXF1aXJlKCcuL3N0YWdlcycpO1xuXG52YXIgc2V0dGluZ3MgPSB7XG4gIHBsYXllckNvdW50OiB7XG4gICAgb3B0aW9uczogWzIsIDMsIDRdLFxuICAgIHNlbGVjdGVkOiA0LFxuICB9LFxuICBiZ206IHtcbiAgICBvcHRpb25zOiBbJ2hhbmdhci54bScsICd0aXRsZS54bScsICdOb25lJ10sXG4gICAgc2VsZWN0ZWQ6ICdOb25lJyxcbiAgfSxcbiAgc3RhZ2U6IHtcbiAgICBvcHRpb25zOiBzdGFnZXMubWFwKGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICByZXR1cm4gc3RhZ2UubmFtZTtcbiAgICB9KSxcbiAgICBzZWxlY3RlZDogJ0hhbmdhcicsXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3M7XG4iLCJ2YXIgc3RhZ2VzID0gW3tcbiAgXCJuYW1lXCI6IFwiQVwiLFxuICBcInRoZW1lXCI6IFwiTm9uZVwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFsxMCwgN10sXG4gICAgICBbNDUsIDddLFxuICAgICAgWzI3LCAxNV0sXG4gICAgICBbMTAsIDI1XSxcbiAgICAgIFs0NSwgMjVdLFxuICAgICAgWzEwLCA0NF0sXG4gICAgICBbNDUsIDQ0XSxcbiAgICAgIFsyNywgNTJdLFxuICAgICAgWzEwLCA2Ml0sXG4gICAgICBbNDUsIDYyXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcInllbGxvd1wiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW10sXG4gIFwiZm9yZWdyb3VuZFwiOiBcImNsZWFyXCIsXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogMCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMCB9LFxuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogMTggfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDE4IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzI4RjEyOVwiXG59LHtcbiAgXCJuYW1lXCI6IFwiQlwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFsyNywgNl0sXG4gICAgICBbMTAsIDEzXSxcbiAgICAgIFs0NSwgMTNdLFxuICAgICAgWzQsIDIyXSxcbiAgICAgIFs1MCwgMjJdLFxuICAgICAgWzE4LCAzMV0sXG4gICAgICBbMjcsIDMxXSxcbiAgICAgIFszNywgMzFdLFxuICAgICAgWzQsIDQ0XSxcbiAgICAgIFs1MCwgNDRdLFxuICAgICAgWzI3LCA2MF1cbiAgICBdLFxuICAgIFwiY29sb3JcIjogXCJncmF5XCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbXSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogOSwgXCJ5XCI6IDE1IH0sXG4gICAgeyBcInhcIjogNTQsIFwieVwiOiAxNSB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiMyOEQ2RjFcIlxufSx7XG4gIFwibmFtZVwiOiBcIkhhbmdhclwiLFxuICBcInRoZW1lXCI6IFwiaGFuZ2FyLnhtXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzgsIDM0XSxcbiAgICAgIFsxMiwgMzRdLFxuICAgICAgWzIyLCAzNF0sXG4gICAgICBbMzEsIDM0XSxcbiAgICAgIFs0MSwgMzRdLFxuICAgICAgWzQ2LCAzNF0sXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwiZ3JheVwiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW3tcbiAgICBpbWFnZTogJ2hhbmdhcidcbiAgfV0sXG4gIFwiZm9yZWdyb3VuZFwiOiBcImNsZWFyXCIsXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDEwLCBcInlcIjogMjcgfSxcbiAgICB7IFwieFwiOiAxOSwgXCJ5XCI6IDI3IH0sXG4gICAgeyBcInhcIjogNDEsIFwieVwiOiAyNyB9LFxuICAgIHsgXCJ4XCI6IDUwLCBcInlcIjogMjcgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjOEQ4RDhEXCJcbn0se1xuICBcIm5hbWVcIjogXCJXYXRlcmZhbGxcIixcbiAgXCJ0aGVtZVwiOiBcInRpdGxlLnhtXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzEwLCAxM10sXG4gICAgICBbNDUsIDEzXSxcbiAgICAgIFsyNywgMjFdLFxuICAgICAgWzEwLCAzMV0sXG4gICAgICBbNDUsIDMxXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcImJyb3duXCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIGltYWdlOiAnd2F0ZXJmYWxsJ1xuICB9XSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAyNCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMjQgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjNzgzRTA4XCJcbn1dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YWdlcztcbiIsInZhciByZXNpemUgPSBmdW5jdGlvbiByZXNpemUoKSB7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUuem9vbSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIGdhbWUuaGVpZ2h0O1xufTtcblxudmFyIG1haW4gPSB7XG4gIHByZWxvYWQ6IGZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xuXG4gICAgcmVzaXplKCk7XG4gICAgd2luZG93Lm9ucmVzaXplID0gdXRpbHMuZGVib3VuY2UocmVzaXplLCAxMDApO1xuICAgIFxuICAgIC8vIGFsbG93IGFueXRoaW5nIHVwIHRvIGhlaWdodCBvZiB3b3JsZCB0byBmYWxsIG9mZi1zY3JlZW4gdXAgb3IgZG93blxuICAgIGdhbWUud29ybGQuc2V0Qm91bmRzKDAsIC1nYW1lLndpZHRoLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCAqIDMpO1xuICAgIFxuICAgIC8vIHByZXZlbnQgZ2FtZSBwYXVzaW5nIHdoZW4gaXQgbG9zZXMgZm9jdXNcbiAgICBnYW1lLnN0YWdlLmRpc2FibGVWaXNpYmlsaXR5Q2hhbmdlID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBhc3NldHMgdXNlZCBpbiBsb2FkaW5nIHNjcmVlblxuICAgIGdhbWUubG9hZC5pbWFnZSgnbG9hZGluZycsICdpbWFnZXMvbG9hZGluZy5naWYnKTtcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgICBnYW1lLnN0YXRlLmFkZCgnbG9hZGluZycsIHJlcXVpcmUoJy4vc3RhdGVzL2xvYWRpbmcuanMnKShnYW1lKSk7XG4gICAgZ2FtZS5zdGF0ZS5zdGFydCgnbG9hZGluZycpO1xuICB9XG59O1xuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg2NCwgNjQsIFBoYXNlci5BVVRPLCAnZ2FtZScsIHtcbiAgcHJlbG9hZDogbWFpbi5wcmVsb2FkLFxuICBjcmVhdGU6IG1haW4uY3JlYXRlXG59LCBmYWxzZSwgZmFsc2UpOyAvLyBkaXNhYmxlIGFudGktYWxpYXNpbmdcblxuZ2FtZS5zdGF0ZS5hZGQoJ21haW4nLCBtYWluKTtcbmdhbWUuc3RhdGUuc3RhcnQoJ21haW4nKTtcbiIsInZhciBidWlsZE1lbnUgPSBmdW5jdGlvbiBidWlsZE1lbnUoZ2FtZSwgc3RhdGUpIHtcbiAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzLmpzJyk7XG5cbiAgdmFyIGN5Y2xlU2V0dGluZyA9IGZ1bmN0aW9uIGN5Y2xlU2V0dGluZygpIHtcbiAgICB2YXIgb3B0aW9uSW5kZXggPSB0aGlzLnNldHRpbmcub3B0aW9ucy5pbmRleE9mKHRoaXMuc2V0dGluZy5zZWxlY3RlZCk7XG4gICAgb3B0aW9uSW5kZXgrKztcbiAgICBpZiAob3B0aW9uSW5kZXggPT09IHRoaXMuc2V0dGluZy5vcHRpb25zLmxlbmd0aCkge1xuICAgICAgb3B0aW9uSW5kZXggPSAwO1xuICAgIH1cbiAgICB0aGlzLnNldHRpbmcuc2VsZWN0ZWQgPSB0aGlzLnNldHRpbmcub3B0aW9uc1tvcHRpb25JbmRleF07XG4gIH07XG5cbiAgdmFyIG1lbnUgPSBbe1xuICAgIG5hbWU6ICdQbGF5ZXJzJyxcbiAgICBzZXR0aW5nOiBzZXR0aW5ncy5wbGF5ZXJDb3VudCxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgY3ljbGVTZXR0aW5nLmNhbGwodGhpcyk7XG4gICAgICBzdGF0ZS5yZXN0YXJ0KCk7XG4gICAgfSxcbiAgICBzZWxlY3RlZDogdHJ1ZVxuICB9LCB7XG4gICAgbmFtZTogJ0JHTScsXG4gICAgc2V0dGluZzogc2V0dGluZ3MuYmdtLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcbiAgICAgIHN0YXRlLnJlc2V0TXVzaWMoc2V0dGluZ3MpO1xuICAgIH0sXG4gIH0sIHtcbiAgICBuYW1lOiAnU3RhZ2UnLFxuICAgIHNldHRpbmc6IHNldHRpbmdzLnN0YWdlLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcblxuICAgICAgLy8gaWYgc3RhZ2UgaGFzIGEgZGVmYXVsdCBiZ20sIGxvYWQgaXRcbiAgICAgIHZhciBzdGFnZXMgPSByZXF1aXJlKCcuL2RhdGEvc3RhZ2VzLmpzJyk7XG4gICAgICB2YXIgc2VsZWN0ZWRTdGFnZSA9IHN0YWdlc1tzZXR0aW5ncy5zdGFnZS5vcHRpb25zLmluZGV4T2Yoc2V0dGluZ3Muc3RhZ2Uuc2VsZWN0ZWQpXTtcbiAgICAgIGlmIChzZWxlY3RlZFN0YWdlLnRoZW1lKSB7XG4gICAgICAgIHNldHRpbmdzLmJnbS5zZWxlY3RlZCA9IHNlbGVjdGVkU3RhZ2UudGhlbWU7XG4gICAgICB9XG5cbiAgICAgIHN0YXRlLnJlc3RhcnQoKTtcbiAgICB9LFxuICB9LCB7XG4gICAgbmFtZTogJ1N0YXJ0JyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH1cbiAgfV07XG5cbiAgdmFyIGNoYW5nZVBsYXllckNvdW50ID0gbWVudVswXS5hY3Rpb24uYmluZChtZW51WzBdKTtcbiAgdmFyIGNoYW5nZUJnbSA9IG1lbnVbMV0uYWN0aW9uLmJpbmQobWVudVsxXSk7XG4gIHZhciBjaGFuZ2VTdGFnZSA9IG1lbnVbMl0uYWN0aW9uLmJpbmQobWVudVsyXSk7XG4gIHZhciByZXN0YXJ0ID0gbWVudVszXS5hY3Rpb24uYmluZChtZW51WzNdKTtcblxuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuUCkub25Eb3duLmFkZChjaGFuZ2VQbGF5ZXJDb3VudCk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5NKS5vbkRvd24uYWRkKGNoYW5nZVN0YWdlKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkIpLm9uRG93bi5hZGQoY2hhbmdlQmdtKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnN1cHBvcnRlZCAmJiBnYW1lLmlucHV0LmdhbWVwYWQuYWN0aXZlKSB7XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkMi5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMy5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDQuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1lbnU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1aWxkTWVudTtcbiIsInZhciBiZ20gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBsYXllciA9IG5ldyBDaGlwdHVuZUpzUGxheWVyKG5ldyBDaGlwdHVuZUpzQ29uZmlnKC0xKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBwbGF5OiBmdW5jdGlvbihmaWxlTmFtZSkge1xuICAgICAgaWYgKGZpbGVOYW1lID09PSAnTm9uZScpIHtcbiAgICAgICAgcGxheWVyLnN0b3AuY2FsbChwbGF5ZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyLmxvYWQoJy4vbXVzaWMvJyArIGZpbGVOYW1lLCBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICBwbGF5ZXIucGxheShidWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJnbTtcbiIsInZhciBjcmVhdGVQbGF5ZXIgPSBmdW5jdGlvbiBjcmVhdGVQbGF5ZXIoZ2FtZSwgb3B0aW9ucywgb25EZWF0aCkge1xuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgb3JpZW50YXRpb246ICdyaWdodCcsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdVUCcsXG4gICAgICBkb3duOiAnRE9XTicsXG4gICAgICBsZWZ0OiAnTEVGVCcsXG4gICAgICByaWdodDogJ1JJR0hUJyxcbiAgICAgIGF0dGFjazogJ1NISUZUJ1xuICAgIH0sXG4gICAgc2NhbGU6IHtcbiAgICAgIHg6IDEsXG4gICAgICB5OiAyXG4gICAgfSxcbiAgICBjb2xvcjogJ3BpbmsnLFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLFxuICB9O1xuXG4gIHZhciBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICB2YXIga2V5cyA9IHtcbiAgICB1cDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMudXBdKSxcbiAgICBkb3duOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5kb3duXSksXG4gICAgbGVmdDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMubGVmdF0pLFxuICAgIHJpZ2h0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5yaWdodF0pLFxuICAgIGF0dGFjazogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuYXR0YWNrXSksXG4gIH07XG5cbiAgdmFyIGdhbWVwYWQgPSBzZXR0aW5ncy5nYW1lcGFkO1xuXG4gIHZhciBzZnggPSByZXF1aXJlKCcuL3NmeC5qcycpO1xuXG4gIHZhciBhY3Rpb25zID0ge1xuICAgIGF0dGFjazogZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgdmFyIGR1cmF0aW9uID0gMjAwO1xuICAgICAgdmFyIGludGVydmFsID0gNjAwO1xuICAgICAgdmFyIHZlbG9jaXR5ID0gMTAwO1xuXG4gICAgICB2YXIgY2FuQXR0YWNrID0gKERhdGUubm93KCkgPiBwbGF5ZXIubGFzdEF0dGFja2VkICsgaW50ZXJ2YWwpICYmICFwbGF5ZXIuaXNEdWNraW5nICYmICFwbGF5ZXIuaXNQZXJtYWRlYWQ7XG4gICAgICBpZiAoIWNhbkF0dGFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IHRydWU7XG4gICAgICBwbGF5ZXIubGFzdEF0dGFja2VkID0gRGF0ZS5ub3coKTtcblxuICAgICAgc2Z4LmF0dGFjaygpO1xuXG4gICAgICBzd2l0Y2gocGxheWVyLm9yaWVudGF0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAtdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5sb2FkVGV4dHVyZSgnd2hpdGUnKTtcbiAgICAgIHNldFRpbWVvdXQoYWN0aW9ucy5lbmRBdHRhY2ssIGR1cmF0aW9uKTtcbiAgICB9LFxuXG4gICAgZW5kQXR0YWNrOiBmdW5jdGlvbiBlbmRBdHRhY2soKSB7XG4gICAgICBpZiAocGxheWVyLmlzQXR0YWNraW5nKSB7XG4gICAgICAgIHBsYXllci5sb2FkVGV4dHVyZShzZXR0aW5ncy5jb2xvcik7XG4gICAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uIHJ1bihkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBtYXhTcGVlZCA9IDMyO1xuICAgICAgdmFyIGFjY2VsZXJhdGlvbiA9IHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gPyA4IDogMzsgLy8gcGxheWVycyBoYXZlIGxlc3MgY29udHJvbCBpbiB0aGUgYWlyXG4gICAgICBwbGF5ZXIub3JpZW50YXRpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIC8vIGlmIHBsYXllciBpcyBnb2luZyBmYXN0ZXIgdGhhbiBtYXggcnVubmluZyBzcGVlZCAoZHVlIHRvIGF0dGFjaywgZXRjKSwgc2xvdyB0aGVtIGRvd24gb3ZlciB0aW1lXG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPCAtbWF4U3BlZWQpIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKz0gYWNjZWxlcmF0aW9uO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gTWF0aC5tYXgocGxheWVyLmJvZHkudmVsb2NpdHkueCAtIGFjY2VsZXJhdGlvbiwgLW1heFNwZWVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IG1heFNwZWVkKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWluKHBsYXllci5ib2R5LnZlbG9jaXR5LnggKyBhY2NlbGVyYXRpb24sIG1heFNwZWVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGp1bXA6IGZ1bmN0aW9uIGp1bXAoKSB7XG4gICAgICBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93bikge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEwMDtcbiAgICAgICAgc2Z4Lmp1bXAoKTtcbiAgICAgIC8vIHdhbGwganVtcHNcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEyMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDQ1O1xuICAgICAgICBzZnguanVtcCgpO1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5yaWdodCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEyMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC00NTtcbiAgICAgICAgc2Z4Lmp1bXAoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGFtcGVuSnVtcDogZnVuY3Rpb24gZGFtcGVuSnVtcCgpIHtcbiAgICAgIC8vIHNvZnRlbiB1cHdhcmQgdmVsb2NpdHkgd2hlbiBwbGF5ZXIgcmVsZWFzZXMganVtcCBrZXlcbiAgICAgICAgdmFyIGRhbXBlblRvUGVyY2VudCA9IDAuNTtcblxuICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueSA8IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ICo9IGRhbXBlblRvUGVyY2VudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkdWNrOiBmdW5jdGlvbiBkdWNrKCkge1xuICAgICAgaWYgKHBsYXllci5pc0F0dGFja2luZyB8fCBwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYXllci5pc0R1Y2tpbmcgJiYgcGxheWVyLmhwID4gMikge1xuICAgICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSAvIDIpO1xuICAgICAgICBhY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcbiAgICAgICAgcGxheWVyLnkgKz0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSB0cnVlO1xuXG4gICAgICAoZnVuY3Rpb24gcm9sbCgpIHtcbiAgICAgICAgdmFyIGNhblJvbGwgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA+IDI1ICYmIHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd247XG4gICAgICAgIGlmIChjYW5Sb2xsKSB7XG4gICAgICAgICAgcGxheWVyLmlzUm9sbGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0oKSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAyKSB7XG4gICAgICAgIHBsYXllci55IC09IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgICAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICAgICAgcGxheWVyLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbiB0YWtlRGFtYWdlKGFtb3VudCkge1xuICAgICAgLy8gcHJldmVudCB0YWtpbmcgbW9yZSBkYW1hZ2UgdGhhbiBocCByZW1haW5pbmcgaW4gY3VycmVudCBsaWZlXG4gICAgICBpZiAoYW1vdW50ID4gMSAmJiAocGxheWVyLmhwIC0gYW1vdW50KSAlIDIgIT09IDApIHtcbiAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmhwIC09IGFtb3VudDtcblxuICAgICAgaWYgKHBsYXllci5ocCA8IDApIHtcbiAgICAgICAgcGxheWVyLmhwID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChwbGF5ZXIuaHAgJSAyID09PSAwKSB7XG4gICAgICAgIGFjdGlvbnMuZGllKCk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgIH0sXG5cbiAgICBhcHBseUhlYWx0aEVmZmVjdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5ld1BsYXllckhlaWdodCA9IE1hdGgubWF4KE1hdGgucm91bmQocGxheWVyLmhwIC8gMiksIDEpO1xuICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIG5ld1BsYXllckhlaWdodCk7XG4gICAgICBhY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcblxuICAgICAgaWYgKHBsYXllci5ocCAlIDIgPT09IDEpIHtcbiAgICAgICAgcGxheWVyLnNjYXJmLnZpc2libGUgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBsYXllci5zY2FyZi52aXNpYmxlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXBwbHlPcmllbnRhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8ocGxheWVyLm9yaWVudGF0aW9uID09PSAnbGVmdCcgPyBzZXR0aW5ncy5zY2FsZS54IDogLXNldHRpbmdzLnNjYWxlLngsIHBsYXllci5zY2FsZS55KTtcbiAgICB9LFxuXG4gICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocGxheWVyLmhwID4gMCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFjdGlvbnMuYXBwbHlJbnZ1bG5lcmFiaWxpdHkoKTtcbiAgICAgICAgfSwgMTAwKTsgLy8gZGVsYXkgaW52dWxuIHNvIHBsYXllcnMgZG9uJ3Qgc3Bhd24gYmVoaW5kIG9uZSBhbm90aGVyXG5cbiAgICAgICAgc2Z4LmRpZSgpO1xuICAgICAgICBhY3Rpb25zLmVuZEF0dGFjaygpO1xuICAgICAgICBwbGF5ZXIubGFzdEF0dGFja2VkID0gMDtcblxuICAgICAgICB2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG4gICAgICAgIHZhciByZXNwYXduUG9zaXRpb24gPSB1dGlscy5nZXRSYW5kb21BcnJheUVsZW1lbnQodXRpbHMuZ2V0U3RhZ2UoKS5zcGF3blBvaW50cyk7XG4gICAgICAgIHBsYXllci5wb3NpdGlvbi54ID0gcmVzcGF3blBvc2l0aW9uLng7XG4gICAgICAgIHBsYXllci5wb3NpdGlvbi55ID0gcmVzcGF3blBvc2l0aW9uLnk7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNmeC5wZXJtYWRpZSgpO1xuICAgICAgICBwbGF5ZXIuYWxwaGEgPSAwLjU7XG4gICAgICAgIHBsYXllci5pc1Blcm1hZGVhZCA9IHRydWU7XG4gICAgICAgIG9uRGVhdGgoKTsgLy8gVE9ETzogdGhpcyBjb3VsZCBwcm9iYWJseSBiZSBiZXR0ZXIgYXJjaGl0ZWN0ZWRcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXBwbHlJbnZ1bG5lcmFiaWxpdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgdmFyIG1ha2VXaGl0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwbGF5ZXIubG9hZFRleHR1cmUoJ3doaXRlJyk7XG4gICAgICB9O1xuICAgICAgdmFyIG1ha2VDb2xvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBwbGF5ZXIubG9hZFRleHR1cmUoc2V0dGluZ3MuY29sb3IpO1xuICAgICAgfTtcbiAgICAgIHZhciBjb2xvckludGVydmFsID0gc2V0SW50ZXJ2YWwobWFrZUNvbG9yLCAxNTApO1xuICAgICAgdmFyIHdoaXRlSW50ZXJ2YWw7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB3aGl0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwobWFrZVdoaXRlLCAxNTApO1xuICAgICAgfSwgNzUpO1xuICAgICAgbWFrZUNvbG9yKCk7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhckludGVydmFsKHdoaXRlSW50ZXJ2YWwpO1xuICAgICAgICBjbGVhckludGVydmFsKGNvbG9ySW50ZXJ2YWwpO1xuICAgICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcbiAgICAgIH0sIDE1MDApO1xuICAgIH0sXG4gIH07XG5cbiAgdmFyIHBsYXllciA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCBzZXR0aW5ncy5jb2xvcik7XG4gIHBsYXllci5uYW1lID0gc2V0dGluZ3MubmFtZTtcbiAgcGxheWVyLm9yaWVudGF0aW9uID0gc2V0dGluZ3Mub3JpZW50YXRpb247XG4gIHBsYXllci5hbmNob3Iuc2V0VG8oLjUsLjUpOyAvLyBhbmNob3IgdG8gY2VudGVyIHRvIGFsbG93IGZsaXBwaW5nXG5cbiAgcGxheWVyLnNjYXJmID0gZ2FtZS5hZGQuc3ByaXRlKC00LCAtMSwgc2V0dGluZ3MuY29sb3IgKyAnU2NhcmYnKTtcbiAgcGxheWVyLnNjYXJmLmFuaW1hdGlvbnMuYWRkKCdzY2FyZicpO1xuICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9ucy5wbGF5KCdzY2FyZicsIDMyLzMsIHRydWUpO1xuICBwbGF5ZXIuc2NhcmYuc2V0U2NhbGVNaW5NYXgoLTEsIDEsIDEsIDEpO1xuICBwbGF5ZXIuYWRkQ2hpbGQocGxheWVyLnNjYXJmKTtcblxuICAvLyB0cmFjayBoZWFsdGhcbiAgcGxheWVyLmhwID0gcGxheWVyLm1heEhwID0gNjsgLy8gVE9ETzogYWxsb3cgc2V0dGluZyBjdXN0b20gaHAgYW1vdW50IGZvciBlYWNoIHBsYXllclxuICBwbGF5ZXIuYWN0aW9ucyA9IGFjdGlvbnM7XG4gIHBsYXllci5hY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpOyAvLyBUT0RPOiBhZGQgZ2lhbnQgbW9kZVxuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHBsYXllcik7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5ib2R5LmJvdW5jZS55ID0gMC4yOyAvLyBUT0RPOiBhbGxvdyBib3VuY2UgY29uZmlndXJhdGlvblxuICBwbGF5ZXIuYm9keS5ncmF2aXR5LnkgPSAzODA7IC8vIFRPRE86IGFsbG93IGdyYXZpdHkgY29uZmlndXJhdGlvblxuXG4gIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTsgLy8gdHJhY2sgaW5wdXQgY2hhbmdlIGZvciB2YXJpYWJsZSBqdW1wIGhlaWdodFxuICBwbGF5ZXIuaXNSb2xsaW5nID0gZmFsc2U7XG4gIHBsYXllci5pc0R1Y2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzQXR0YWNraW5nID0gZmFsc2U7XG4gIHBsYXllci5pc1Blcm1hZGVhZCA9IGZhbHNlO1xuICBwbGF5ZXIubGFzdEF0dGFja2VkID0gMDtcbiAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG5cbiAgLy8gcGhhc2VyIGFwcGFyZW50bHkgYXV0b21hdGljYWxseSBjYWxscyBhbnkgZnVuY3Rpb24gbmFtZWQgdXBkYXRlIGF0dGFjaGVkIHRvIGEgc3ByaXRlIVxuICBwbGF5ZXIudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8ga2lsbCBwbGF5ZXIgaWYgaGUgZmFsbHMgb2ZmIHRoZSBzY3JlZW5cbiAgICBpZiAocGxheWVyLnBvc2l0aW9uLnkgPiA2NCAmJiBwbGF5ZXIuaHAgIT09IDApIHsgLy8gVE9ETzogaG93IHRvIGFjY2VzcyBuYXRpdmUgaGVpZ2h0IGZyb20gZ2FtZS5qcz9cbiAgICAgIGFjdGlvbnMudGFrZURhbWFnZSgyKTtcbiAgICB9XG5cbiAgICB2YXIgaW5wdXQgPSB7XG4gICAgICBsZWZ0OiAgIChrZXlzLmxlZnQuaXNEb3duICYmICFrZXlzLnJpZ2h0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSAmJiAhZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1JJR0hUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA8IC0wLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPCAtMC4xLFxuICAgICAgcmlnaHQ6ICAoa2V5cy5yaWdodC5pc0Rvd24gJiYgIWtleXMubGVmdC5pc0Rvd24pIHx8XG4gICAgICAgICAgICAgIChnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfTEVGVCkpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWCkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPiAwLjEsXG4gICAgICB1cDogICAgIGtleXMudXAuaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9VUCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9BKSxcbiAgICAgIGRvd246ICAga2V5cy5kb3duLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfRE9XTikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9ZKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9ZKSA+IDAuMSxcbiAgICAgIGF0dGFjazoga2V5cy5hdHRhY2suaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9YKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0IpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0xFRlRfVFJJR0dFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX1RSSUdHRVIpLFxuICAgIH07XG5cbiAgICBpZiAoaW5wdXQubGVmdCkge1xuICAgICAgYWN0aW9ucy5ydW4oJ2xlZnQnKTtcbiAgICAgIHBsYXllci5hY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGlucHV0LnJpZ2h0KSB7XG4gICAgICBhY3Rpb25zLnJ1bigncmlnaHQnKTtcbiAgICAgIHBsYXllci5hY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgIXBsYXllci5pc1JvbGxpbmcpIHtcbiAgICAgIC8vIGFwcGx5IGZyaWN0aW9uXG4gICAgICBpZiAoTWF0aC5hYnMocGxheWVyLmJvZHkudmVsb2NpdHkueCkgPCAyKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKj0gMC41OyAvLyBxdWlja2x5IGJyaW5nIHNsb3ctbW92aW5nIHBsYXllcnMgdG8gYSBzdG9wXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPiAwKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gMjtcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IDApIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCArPSAyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbnB1dC51cCkge1xuICAgICAgcGxheWVyLnVwV2FzRG93biA9IHRydWU7XG4gICAgICBhY3Rpb25zLmp1bXAoKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci51cFdhc0Rvd24pIHtcbiAgICAgIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTtcbiAgICAgIGFjdGlvbnMuZGFtcGVuSnVtcCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5kb3duKSB7XG4gICAgICBhY3Rpb25zLmR1Y2soKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgIGFjdGlvbnMuc3RhbmQoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuYXR0YWNrKSB7XG4gICAgICBhY3Rpb25zLmF0dGFjaygpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gcGxheWVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQbGF5ZXI7XG4iLCJ2YXIgc2Z4ID0gKGZ1bmN0aW9uIHNmeCgpIHtcbiAgUG9seXN5bnRoID0gcmVxdWlyZSgnc3VicG9seScpO1xuXG4gIHZhciBhdWRpb0N0eDtcbiAgaWYgKHR5cGVvZiBBdWRpb0NvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgfSBlbHNlIHtcbiAgICBhdWRpb0N0eCA9IG5ldyB3ZWJraXRBdWRpb0NvbnRleHQoKTtcbiAgfVxuXG4gIHZhciBwdWxzZSA9IG5ldyBQb2x5c3ludGgoYXVkaW9DdHgsIHtcbiAgICB3YXZlZm9ybTogJ3NxdWFyZScsXG4gICAgcmVsZWFzZTogMC4wMSxcbiAgICBudW1Wb2ljZXM6IDRcbiAgfSk7XG4gIFxuICBmdW5jdGlvbiBnZXROb3codm9pY2UpIHtcbiAgICB2YXIgbm93ID0gdm9pY2UuYXVkaW9DdHguY3VycmVudFRpbWU7XG4gICAgcmV0dXJuIG5vdztcbiAgfTtcbiAgXG4gIHZhciBqdW1wVGltZW91dCwgYXR0YWNrVGltZW91dDtcbiAgdmFyIGRpZVRpbWVvdXRzID0gW107XG5cbiAgdmFyIHNvdW5kRWZmZWN0cyA9IHtcbiAgICBqdW1wOiBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyVGltZW91dChqdW1wVGltZW91dCk7XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1swXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDAuMTsgLy8gaW4gc2Vjb25kc1xuICAgICAgXG4gICAgICB2b2ljZS5waXRjaCg0NDApO1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgdmFyIG5vdyA9IGdldE5vdyh2b2ljZSk7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDg4MCwgbm93ICsgZHVyYXRpb24pO1xuICAgICAganVtcFRpbWVvdXQgPSBzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogMTAwMCk7XG4gICAgfSxcblxuICAgIGF0dGFjazogZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhclRpbWVvdXQoYXR0YWNrVGltZW91dCk7XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1sxXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDAuMTsgLy8gaW4gc2Vjb25kc1xuICAgICAgXG4gICAgICB2b2ljZS5waXRjaCg4ODApO1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgdmFyIG5vdyA9IGdldE5vdyh2b2ljZSk7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAsIG5vdyArIGR1cmF0aW9uKTtcbiAgICAgIGF0dGFja1RpbWVvdXQgPSBzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogMTAwMCk7XG4gICAgfSxcbiAgICBcbiAgICBib3VuY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGF0dGFja1RpbWVvdXQpO1xuICAgICAgXG4gICAgICB2YXIgdm9pY2UgPSBwdWxzZS52b2ljZXNbMl07XG4gICAgICB2YXIgZHVyYXRpb24gPSAwLjE7IC8vIGluIHNlY29uZHNcbiAgICAgIFxuICAgICAgdm9pY2UucGl0Y2goNDQwKTtcbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG5cbiAgICAgIHZhciBub3cgPSBnZXROb3codm9pY2UpO1xuICAgICAgdm9pY2Uub3NjLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgyMjAsIG5vdyArIGR1cmF0aW9uIC8gMik7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDY2MCwgbm93ICsgZHVyYXRpb24pO1xuICAgICAgYXR0YWNrVGltZW91dCA9IHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiAxMDAwKTtcbiAgICB9LFxuICAgIFxuICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICB3aGlsZSAoZGllVGltZW91dHMubGVuZ3RoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChkaWVUaW1lb3V0cy5wb3AoKSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1szXTtcbiAgICAgIHZhciBwaXRjaGVzID0gWzQ0MCwgMjIwLCAxMTBdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMTAwO1xuXG4gICAgICB2b2ljZS5zdGFydCgpO1xuICAgICAgXG4gICAgICBwaXRjaGVzLmZvckVhY2goZnVuY3Rpb24ocGl0Y2gsIGkpIHtcbiAgICAgICAgZGllVGltZW91dHMucHVzaChzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZvaWNlLnBpdGNoKHBpdGNoKTtcbiAgICAgICAgfSwgaSAqIGR1cmF0aW9uKSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZGllVGltZW91dHMucHVzaChzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogcGl0Y2hlcy5sZW5ndGgpKTtcbiAgICB9LFxuICAgIHBlcm1hZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIHdoaWxlIChkaWVUaW1lb3V0cy5sZW5ndGgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRpZVRpbWVvdXRzLnBvcCgpKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzNdO1xuICAgICAgdmFyIHBpdGNoZXMgPSBbMjIwLCAxOTYsIDE4NV07XG4gICAgICB2YXIgZHVyYXRpb24gPSAyMDA7XG5cbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG5cbiAgICAgIHBpdGNoZXMuZm9yRWFjaChmdW5jdGlvbihwaXRjaCwgaSkge1xuICAgICAgICBkaWVUaW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdm9pY2UucGl0Y2gocGl0Y2gpO1xuICAgICAgICB9LCBpICogZHVyYXRpb24pKTtcbiAgICAgIH0pO1xuXG4gICAgICBkaWVUaW1lb3V0cy5wdXNoKHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiBwaXRjaGVzLmxlbmd0aCkpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBzb3VuZEVmZmVjdHM7XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNmeDtcbiIsInZhciBzdGFnZUJ1aWxkZXIgPSBmdW5jdGlvbiBzdGFnZUJ1aWxkZXIoZ2FtZSkge1xuICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MuanMnKTtcbiAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xuICB2YXIgc3RhZ2UgPSB1dGlscy5nZXRTdGFnZSgpO1xuXG4gIGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gc3RhZ2UuYmFja2dyb3VuZENvbG9yO1xuXG4gIHZhciBidWlsZFBsYXRmb3JtcyA9IGZ1bmN0aW9uIGJ1aWxkUGxhdGZvcm1zKCkge1xuICAgIHZhciBwbGF0Zm9ybXMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICAgIHBsYXRmb3Jtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcblxuICAgIHZhciBwbGF0Zm9ybVBvc2l0aW9ucyA9IHN0YWdlLnBsYXRmb3Jtcy5wb3NpdGlvbnM7XG4gICAgcGxhdGZvcm1Qb3NpdGlvbnMuZm9yRWFjaChmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgdmFyIHBsYXRmb3JtID0gcGxhdGZvcm1zLmNyZWF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sIHN0YWdlLnBsYXRmb3Jtcy5jb2xvcik7XG4gICAgICBwbGF0Zm9ybS5zY2FsZS5zZXRUbyg1LCAxKTtcbiAgICAgIHBsYXRmb3JtLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHZhciB3YWxscyA9IFtdO1xuICAgIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgtMywgLTEyLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpKTtcbiAgICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoNjEsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKSk7XG4gICAgd2FsbHMuZm9yRWFjaChmdW5jdGlvbih3YWxsKSB7XG4gICAgICB3YWxsLnNjYWxlLnNldFRvKDMsIDM4KTtcbiAgICAgIHdhbGwuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIH0pO1xuXG4gICAgdmFyIGNlaWxpbmcgPSBwbGF0Zm9ybXMuY3JlYXRlKDAsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKTtcbiAgICBjZWlsaW5nLnNjYWxlLnNldFRvKDMyLCAzKTtcbiAgICBjZWlsaW5nLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICBcbiAgICByZXR1cm4gcGxhdGZvcm1zO1xuICB9O1xuXG4gIHZhciBidWlsZEJhY2tncm91bmRzID0gZnVuY3Rpb24gYnVpbGRCYWNrZ3JvdW5kcygpIHtcbiAgICB2YXIgYmFja2dyb3VuZHMgPSBnYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgc3RhZ2UuYmFja2dyb3VuZHMuZm9yRWFjaChmdW5jdGlvbihsYXllcikge1xuICAgICAgdmFyIGJnO1xuICAgICAgaWYgKGxheWVyLnNjcm9sbGluZykge1xuICAgICAgICBiZyA9IGdhbWUuYWRkLnRpbGVTcHJpdGUoMCwgMCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQsIGxheWVyLmltYWdlKTtcbiAgICAgICAgYmFja2dyb3VuZHMubG9vcCA9IGdhbWUudGltZS5ldmVudHMubG9vcChQaGFzZXIuVGltZXIuUVVBUlRFUiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmcudGlsZVBvc2l0aW9uLnggLT0xO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJnID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIGxheWVyLmltYWdlKTtcbiAgICAgIH1cbiAgICAgIGJhY2tncm91bmRzLmFkZChiZyk7XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIGJhY2tncm91bmRzO1xuICB9O1xuXG4gIHZhciBidWlsZEZvcmVncm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9yZWdyb3VuZCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCBzdGFnZS5mb3JlZ3JvdW5kKTtcbiAgICByZXR1cm4gZm9yZWdyb3VuZDtcbiAgfTtcbiAgXG4gIHJldHVybiB7XG4gICAgYnVpbGRQbGF0Zm9ybXM6IGJ1aWxkUGxhdGZvcm1zLFxuICAgIGJ1aWxkRm9yZWdyb3VuZDogYnVpbGRGb3JlZ3JvdW5kLFxuICAgIGJ1aWxkQmFja2dyb3VuZHM6IGJ1aWxkQmFja2dyb3VuZHNcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VCdWlsZGVyO1xuIiwidmFyIExvYWRpbmcgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBsb2FkaW5nID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsb2FkaW5nJyk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZycpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfSxcblxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gaW1hZ2VzXG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3RpdGxlJywgJ2ltYWdlcy9zcHJpdGVzaGVldC10aXRsZS5naWYnLCA2NCwgNjQpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCd2aWN0b3J5TXNnJywgJ2ltYWdlcy9zcHJpdGVzaGVldC13aW5uZXIuZ2lmJywgNTIsIDIyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYmx1ZVNjYXJmJywgJ2ltYWdlcy9zcHJpdGVzaGVldC1zY2FyZi1ibHVlYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdwaW5rU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXNoZWV0LXNjYXJmLXBpbmtiaXQuZ2lmJywgNSwgMik7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2dyZWVuU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXNoZWV0LXNjYXJmLWdyZWVuYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdwdXJwbGVTY2FyZicsICdpbWFnZXMvc3ByaXRlc2hlZXQtc2NhcmYtcHVycGxlYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdqdW1wJywgJ2ltYWdlcy9zcHJpdGVzaGVldC1qdW1wLmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdsYW5kJywgJ2ltYWdlcy9zcHJpdGVzaGVldC1sYW5kLmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdjbGVhcicsICdpbWFnZXMvY2xlYXIucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3doaXRlJywgJ2ltYWdlcy93aGl0ZS5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgncGluaycsICdpbWFnZXMvcGluay5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgneWVsbG93JywgJ2ltYWdlcy95ZWxsb3cucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2JsdWUnLCAnaW1hZ2VzL2JsdWUucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3B1cnBsZScsICdpbWFnZXMvcHVycGxlLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdvcmFuZ2UnLCAnaW1hZ2VzL29yYW5nZS5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnZ3JlZW4nLCAnaW1hZ2VzL2dyZWVuLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdncmF5JywgJ2ltYWdlcy9ncmF5LnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdicm93bicsICdpbWFnZXMvYnJvd24ucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3dhdGVyZmFsbCcsICdpbWFnZXMvbGV2ZWwtd2F0ZXJmYWxsLXdpcC5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnaGFuZ2FyJywgJ2ltYWdlcy9sZXZlbC1oYW5nYXItd2lwLmdpZicpO1xuXG4gICAgICAvLyBzb3VuZFxuICAgICAgZ2FtZS5zZnggPSByZXF1aXJlKCcuLi9zZnguanMnKTtcbiAgICAgIGdhbWUuYmdtID0gcmVxdWlyZSgnLi4vbXVzaWMnKSgpO1xuICAgIH0sXG5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG5cbiAgICAgIGdhbWUuc3RhdGUuYWRkKCdzcGxhc2gnLCByZXF1aXJlKCcuL3NwbGFzaC5qcycpKGdhbWUpKTtcbiAgICAgIGdhbWUuc3RhdGUuYWRkKCdwbGF5JywgcmVxdWlyZSgnLi9wbGF5LmpzJykoZ2FtZSkpO1xuICAgICAgZ2FtZS5zdGF0ZS5zdGFydCgnc3BsYXNoJyk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIGxvYWRpbmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRpbmc7XG4iLCJ2YXIgUGxheSA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHBsYXkgPSB7XG4gICAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHNlbGYuc3ViVWkgPSBnYW1lLmFkZC5ncm91cCgpOyAvLyBwbGFjZSB0byBrZWVwIGFueXRoaW5nIG9uLXNjcmVlbiB0aGF0J3Mgbm90IFVJIHRvIGRlcHRoIHNvcnQgYmVsb3cgVUlcblxuICAgICAgLy8gZ2FtZSBvdmVyIHZpY3RvcnkgbWVzc2FnZSBkZWNsYXJpbmcgdGhlIHdpbm5lclxuICAgICAgc2VsZi52aWN0b3J5TXNnID0gZ2FtZS5hZGQuc3ByaXRlKDYsIDIxLCAndmljdG9yeU1zZycpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSBmYWxzZTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnQmx1ZScsIFswLCA0LCA4LCAxMl0sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdQaW5rJywgWzEsIDUsIDksIDEzXSwgMzIvMywgdHJ1ZSk7XG4gICAgICBzZWxmLnZpY3RvcnlNc2cuYW5pbWF0aW9ucy5hZGQoJ0dyZWVuJywgWzIsIDYsIDEwLCAxNF0sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdQdXJwbGUnLCBbMywgNywgMTEsIDE1XSwgMzIvMywgdHJ1ZSk7XG5cbiAgICAgIC8vIG1lbnVcbiAgICAgIHZhciBidWlsZE1lbnUgPSByZXF1aXJlKCcuLi9tZW51LmpzJyk7XG4gICAgICBidWlsZE1lbnUoZ2FtZSwgc2VsZik7IC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIGFwcHJvYWNoIHRoYW4gaW5qZWN0aW5nIHRoZSB3aG9sZSBzdGF0ZSBpbnRvIHRoZSBtZW51IHRvIGxldCBpdCBhY2Nlc3MgZnVuY3Rpb25zIGZvciByZXNldHRpbmcgc3RhZ2UsIHBsYXllcnMsIG11c2ljP1xuXG4gICAgICBzZWxmLnJlc3RhcnQoKTtcbiAgICAgIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIHJlc2V0TXVzaWM6IGZ1bmN0aW9uKHNldHRpbmdzKSB7XG4gICAgICBnYW1lLmJnbS5wbGF5KHNldHRpbmdzLmJnbS5zZWxlY3RlZCk7XG4gICAgfSxcblxuICAgIHJlc3RhcnQ6IGZ1bmN0aW9uIHJlc3RhcnQoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGxheWVycyA9IHJlcXVpcmUoJy4uL2RhdGEvcGxheWVycy5qcycpKGdhbWUpO1xuICAgICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vZGF0YS9zZXR0aW5ncycpO1xuICAgICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMuanMnKTtcbiAgICAgIHZhciBzdGFnZUJ1aWxkZXIgPSByZXF1aXJlKCcuLi9zdGFnZUJ1aWxkZXIuanMnKShnYW1lKTtcbiAgICAgIHZhciBzdGFnZSA9IHV0aWxzLmdldFN0YWdlKCk7XG5cbiAgICAgIC8vIGlmIHN0YWdlIGhhcyBhIGRlZmF1bHQgYmdtLCBsb2FkIGl0XG4gICAgICBpZiAoc3RhZ2UudGhlbWUpIHtcbiAgICAgICAgc2V0dGluZ3MuYmdtLnNlbGVjdGVkID0gc3RhZ2UudGhlbWU7XG4gICAgICB9XG4gICAgICBzZWxmLnJlc2V0TXVzaWMoc2V0dGluZ3MpO1xuXG4gICAgICAvLyBkZXN0cm95IGFuZCByZWJ1aWxkIHN0YWdlIGFuZCBwbGF5ZXJzXG4gICAgICB2YXIgZGVzdHJveUdyb3VwID0gZnVuY3Rpb24gZGVzdHJveUdyb3VwKGdyb3VwKSB7XG4gICAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoZ3JvdXAuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGdyb3VwLmNoaWxkcmVuWzBdLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyb3VwLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgZGVzdHJveUdyb3VwKHNlbGYucGxheWVycyk7XG4gICAgICBkZXN0cm95R3JvdXAoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgZGVzdHJveUdyb3VwKHNlbGYuYmFja2dyb3VuZHMpO1xuXG4gICAgICAvLyBUT0RPOiB1Z2gsIGNsZWFuIHRoaXMgdXAhXG4gICAgICBpZiAoc2VsZi5iYWNrZ3JvdW5kcyAmJiBzZWxmLmJhY2tncm91bmRzLmxvb3ApIHtcbiAgICAgICAgZ2FtZS50aW1lLmV2ZW50cy5yZW1vdmUoc2VsZi5iYWNrZ3JvdW5kcy5sb29wKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLmZvcmVncm91bmQpIHtcbiAgICAgICAgc2VsZi5mb3JlZ3JvdW5kLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5wbGF0Zm9ybXMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRQbGF0Zm9ybXMoKTtcbiAgICAgIHNlbGYuYmFja2dyb3VuZHMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRCYWNrZ3JvdW5kcygpO1xuICAgICAgc2VsZi5zdWJVaS5hZGQoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgc2VsZi5zdWJVaS5hZGQoc2VsZi5iYWNrZ3JvdW5kcyk7XG5cbiAgICAgIHNlbGYucGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICBzZWxmLnN1YlVpLmFkZChzZWxmLnBsYXllcnMpO1xuXG4gICAgICB2YXIgYWRkUGxheWVyID0gZnVuY3Rpb24gYWRkUGxheWVyKHBsYXllcikge1xuICAgICAgICB2YXIgY2hlY2tGb3JHYW1lT3ZlciA9IGZ1bmN0aW9uIGNoZWNrRm9yR2FtZU92ZXIoKSB7XG4gICAgICAgICAgdmFyIGFsaXZlUGxheWVycyA9IFtdO1xuICAgICAgICAgIHNlbGYucGxheWVycy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKHBsYXllciwgaSkge1xuICAgICAgICAgICAgaWYgKCFwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgICAgICAgYWxpdmVQbGF5ZXJzLnB1c2gocGxheWVyLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChhbGl2ZVBsYXllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzZWxmLnZpY3RvcnlNc2cucGxheShhbGl2ZVBsYXllcnNbMF0pO1xuICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgc2VsZi5yZXN0YXJ0KCk7XG4gICAgICAgICAgICB9LCAzMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBjcmVhdGVQbGF5ZXIgPSByZXF1aXJlKCcuLi9wbGF5ZXIuanMnKTtcbiAgICAgICAgdmFyIG5ld1BsYXllciA9IHNlbGYucGxheWVycy5hZGQoY3JlYXRlUGxheWVyKGdhbWUsIHBsYXllciwgY2hlY2tGb3JHYW1lT3ZlcikpO1xuICAgICAgICB2YXIgcG9zID0gc3RhZ2Uuc3Bhd25Qb2ludHNbaV07XG4gICAgICAgIG5ld1BsYXllci5wb3NpdGlvbi54ID0gcG9zLng7XG4gICAgICAgIG5ld1BsYXllci5wb3NpdGlvbi55ID0gcG9zLnk7XG4gICAgICB9O1xuXG4gICAgICAvL3BsYXllcnMuZm9yRWFjaChhZGRQbGF5ZXIpO1xuICAgICAgZm9yICh2YXIgaT0wOyBpPHNldHRpbmdzLnBsYXllckNvdW50LnNlbGVjdGVkOyBpKyspIHtcbiAgICAgICAgYWRkUGxheWVyKHBsYXllcnNbaV0sIGkpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLmZvcmVncm91bmQgPSBzdGFnZUJ1aWxkZXIuYnVpbGRGb3JlZ3JvdW5kKCk7XG4gICAgICBzZWxmLnN1YlVpLmFkZChzZWxmLmZvcmVncm91bmQpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIFxuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMucGxheWVycywgdGhpcy5wbGF0Zm9ybXMpO1xuICAgICAgLy8gVE9ETzogaG93IGRvIGkgZG8gdGhpcyBvbiB0aGUgcGxheWVyIGl0c2VsZiB3aXRob3V0IGFjY2VzcyB0byBwbGF5ZXJzPyBvciBzaG91bGQgaSBhZGQgYSBmdG4gdG8gcGxheWVyIGFuZCBzZXQgdGhhdCBhcyB0aGUgY2I/XG4gICAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5wbGF5ZXJzLCB0aGlzLnBsYXllcnMsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckNvbGxpc2lvbihwbGF5ZXJBLCBwbGF5ZXJCKSB7XG4gICAgICAgICAvKiBsZXQncyBub3Qga25vY2sgYW55Ym9keSBhcm91bmQgaWYgc29tZXRoaW5nJ3Mgb24gb25lIG9mIHRoZXNlIGR1ZGVzJy9kdWRldHRlcycgaGVhZHMuXG4gICAgICAgICBwcmV2ZW50cyBjYW5ub25iYWxsIGF0dGFja3MgYW5kIHRoZSBsaWtlLCBhbmQgYWxsb3dzIHN0YW5kaW5nIG9uIGhlYWRzLlxuICAgICAgICAgbm90ZTogc3RpbGwgbmVlZCB0byBjb2xsaWRlIGluIG9yZGVyIHRvIHRlc3QgdG91Y2hpbmcudXAsIHNvIGRvbid0IG1vdmUgdGhpcyB0byBhbGxvd1BsYXllckNvbGxpc2lvbiEgKi9cbiAgICAgICAgaWYgKHBsYXllckEuYm9keS50b3VjaGluZy51cCB8fCBwbGF5ZXJCLmJvZHkudG91Y2hpbmcudXApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyKSB7XG4gICAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYm91bmNlKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LmJvdW5jZSgpO1xuXG4gICAgICAgICAgdmFyIGJvdW5jZVZlbG9jaXR5ID0gNTA7XG4gICAgICAgICAgdmFyIHZlbG9jaXR5QSwgdmVsb2NpdHlCO1xuICAgICAgICAgIHZlbG9jaXR5QSA9IHZlbG9jaXR5QiA9IGJvdW5jZVZlbG9jaXR5O1xuICAgICAgICAgIGlmIChwbGF5ZXJBLnBvc2l0aW9uLnggPiBwbGF5ZXJCLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5QiAqPSAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmVsb2NpdHlBICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QTtcbiAgICAgICAgICBwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QjtcbiAgICAgICAgICBwbGF5ZXJBLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgIHBsYXllckIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmbGluZygpIHtcbiAgICAgICAgICBnYW1lLnNmeC5ib3VuY2UoKTtcblxuICAgICAgICAgIHZhciBwbGF5ZXJUb0ZsaW5nO1xuICAgICAgICAgIHZhciBwbGF5ZXJUb0xlYXZlO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLmlzRHVja2luZykge1xuICAgICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckI7XG4gICAgICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckE7XG4gICAgICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvRmxpbmcpO1xuICAgICAgICAgIHZhciBmbGluZ1hWZWxvY2l0eSA9IDc1O1xuICAgICAgICAgIGlmIChwbGF5ZXJUb0ZsaW5nLnBvc2l0aW9uLnggPiBwbGF5ZXJUb0xlYXZlLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICAgIGZsaW5nWFZlbG9jaXR5ICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueCA9IGZsaW5nWFZlbG9jaXR5O1xuICAgICAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS55ID0gLTc1O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcG9wKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LmJvdW5jZSgpO1xuXG4gICAgICAgICAgdmFyIHBsYXllclRvUG9wO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLmlzUm9sbGluZykge1xuICAgICAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJCO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXJUb1BvcCk7XG4gICAgICAgICAgcGxheWVyVG9Qb3AuYm9keS52ZWxvY2l0eS55ID0gLTc1O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJvdGhSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgJiYgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgICAgIHZhciBib3RoU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgJiYgIXBsYXllckIuaXNEdWNraW5nO1xuICAgICAgICB2YXIgbmVpdGhlclJvbGxpbmcgPSAhcGxheWVyQS5pc1JvbGxpbmcgJiYgIXBsYXllckIuaXNSb2xsaW5nO1xuICAgICAgICB2YXIgZWl0aGVyRHVja2luZyA9IHBsYXllckEuaXNEdWNraW5nIHx8IHBsYXllckIuaXNEdWNraW5nO1xuICAgICAgICB2YXIgZWl0aGVyUnVubmluZyA9IE1hdGguYWJzKHBsYXllckEuYm9keS52ZWxvY2l0eS54KSA+IDI4IHx8IE1hdGguYWJzKHBsYXllckIuYm9keS52ZWxvY2l0eS54KSA+PSAyODtcbiAgICAgICAgdmFyIGVpdGhlclJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyB8fCBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICAgICAgdmFyIGVpdGhlclN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nIHx8ICFwbGF5ZXJCLmlzRHVja2luZztcblxuICAgICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgICBjYXNlIGJvdGhSb2xsaW5nIHx8IGJvdGhTdGFuZGluZzpcbiAgICAgICAgICAgIGJvdW5jZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBuZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJSdW5uaW5nICYmIGVpdGhlckR1Y2tpbmc6XG4gICAgICAgICAgICBmbGluZygpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBlaXRoZXJSb2xsaW5nICYmIGVpdGhlclN0YW5kaW5nOlxuICAgICAgICAgICAgcG9wKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIG9mIHRoZSB0b3VjaGluZyBwbGF5ZXJzIGlzIGF0dGFja2luZy4uLlxuICAgICAgICBpZiAocGxheWVyQS5pc0F0dGFja2luZyAhPT0gcGxheWVyQi5pc0F0dGFja2luZykge1xuICAgICAgICAgIHZhciB2aWN0aW0gPSBwbGF5ZXJBLmlzQXR0YWNraW5nID8gcGxheWVyQiA6IHBsYXllckE7XG4gICAgICAgICAgaWYgKHBsYXllckEub3JpZW50YXRpb24gIT09IHBsYXllckIub3JpZW50YXRpb24pIHtcbiAgICAgICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMik7IC8vIGF0dGFja2VkIGZyb20gYmVoaW5kIGZvciBkb3VibGUgZGFtYWdlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH0sIGZ1bmN0aW9uIGFsbG93UGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAgICAgLy8gZG9uJ3QgYWxsb3cgY29sbGlzaW9uIGlmIGVpdGhlciBwbGF5ZXIgaXNuJ3QgY29sbGlkYWJsZS5cbiAgICAgICAgLy8gYWxzbyBkaXNhbGxvdyBpZiBwbGF5ZXIgaXMgaW4gbGltYm8gYmVsb3cgdGhlIHNjcmVlbiA6XVxuICAgICAgICBpZiAoIXBsYXllckEuaXNDb2xsaWRhYmxlIHx8ICFwbGF5ZXJCLmlzQ29sbGlkYWJsZSB8fCBwbGF5ZXJBLnBvc2l0aW9uLnkgPiBnYW1lLmhlaWdodCB8fCBwbGF5ZXJCLnBvc2l0aW9uLnkgPiBnYW1lLmhlaWdodCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBwbGF5O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5O1xuIiwidmFyIFNwbGFzaCA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHNwbGFzaCA9IHtcbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5iZ20ucGxheSgndGl0bGUueG0nKTtcbiAgICAgIGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnaGFuZ2FyJyk7XG4gICAgICB2YXIgdGl0bGUgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3RpdGxlJyk7XG4gICAgICB0aXRsZS5hbmltYXRpb25zLmFkZCgndGl0bGUnKTtcbiAgICAgIHRpdGxlLmFuaW1hdGlvbnMucGxheSgndGl0bGUnLCAzMi8zLCB0cnVlKTtcblxuICAgICAgdmFyIHN0YXJ0R2FtZSA9IGZ1bmN0aW9uIHN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKGdhbWUuc3RhdGUuY3VycmVudCA9PT0gJ3NwbGFzaCcpIHtcbiAgICAgICAgICBnYW1lLmJnbS5wbGF5KCdOb25lJyk7XG4gICAgICAgICAgZ2FtZS5zdGF0ZS5zdGFydCgncGxheScpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBzdGFydCBnYW1lIHdoZW4gc3RhcnQvZW50ZXIgaXMgcHJlc3NlZFxuICAgICAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkT25jZShzdGFydEdhbWUpO1xuICAgICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5zdXBwb3J0ZWQgJiYgZ2FtZS5pbnB1dC5nYW1lcGFkLmFjdGl2ZSAmJiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5jb25uZWN0ZWQpIHtcbiAgICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGRPbmNlKHN0YXJ0R2FtZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHNwbGFzaDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3BsYXNoO1xuIiwidmFyIHV0aWxzID0ge1xuICAvLyBmcm9tIHVuZGVyc2NvcmVcbiAgZGVib3VuY2U6IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuXHR2YXIgdGltZW91dDtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0aWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0fTtcblx0XHR2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcblx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9O1xuICB9LFxuXG4gIGNlbnRlcjogZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgZW50aXR5LmFuY2hvci5zZXRUbygwLjUpO1xuICB9LFxuXG4gIC8vIFRPRE86IGNvbnNpZGVyIGluamVjdGluZyBkZXBlbmRlbmNpZXNcbiAgZ2V0U3RhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFnZXMgPSByZXF1aXJlKCcuL2RhdGEvc3RhZ2VzJyk7XG4gICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzJyk7XG4gICAgdmFyIHN0YWdlID0gc3RhZ2VzLmZpbHRlcihmdW5jdGlvbihzdGFnZSkge1xuICAgICAgcmV0dXJuIHN0YWdlLm5hbWUgPT09IHNldHRpbmdzLnN0YWdlLnNlbGVjdGVkO1xuICAgIH0pWzBdO1xuICAgIHJldHVybiBzdGFnZTtcbiAgfSxcblxuICBnZXRSYW5kb21BcnJheUVsZW1lbnQ6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIGFycmF5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFycmF5Lmxlbmd0aCldO1xuICB9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlscztcbiJdfQ==
