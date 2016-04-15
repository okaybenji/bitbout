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
      if (!player.body.touching.down && !player.body.touching.left && !player.body.touching.right) {
        return;
      }

      var dust = game.add.sprite(0, 0, 'jump');
      var anim = dust.animations.add('dust');
      dust.animations.play('dust', 32/3);
      anim.onComplete.add(function() {
        dust.kill();
      }, this);

      if (player.body.touching.down) {
        player.body.velocity.y = -100;
        sfx.jump();
        dust.position.x = player.body.position.x - 4;
        dust.position.y = player.body.position.y + player.body.height - 2;
      // wall jumps
      } else if (player.body.touching.left) {
        player.body.velocity.y = -120;
        player.body.velocity.x = 45;
        sfx.jump();
        dust.position.x = player.body.position.x + 2;
        dust.position.y = player.body.position.y - player.body.height;
        dust.angle = 90;
      } else if (player.body.touching.right) {
        player.body.velocity.y = -120;
        player.body.velocity.x = -45;
        sfx.jump();
        dust.position.x = player.body.position.x;
        dust.position.y = player.body.position.y + player.body.height;
        dust.angle = -90;
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

      if (player.hp === 0) {
        return; // bit's becoming a ghost; leaves its scarf (or lack thereof) alone
      } else if (player.hp % 2 === 1) {
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

  player.scarf = game.add.sprite(-1, -1, settings.color + 'Scarf');
  player.scarf.animations.add('scarf');
  player.scarf.animation = player.scarf.animations.play('scarf', 32/3, true);
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
  player.isFalling = false;
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

    if (player.body.velocity.y > 85) {
      player.isFalling = true;
    }

    player.scarf.animation.speed = Math.abs(player.body.velocity.x) * .75 + 32/3;

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
      game.load.spritesheet('jump', 'images/spritesheet-jump.gif', 10, 2);
      game.load.spritesheet('land', 'images/spritesheet-land.gif', 10, 2);
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
      
      game.physics.arcade.collide(this.players, this.platforms, function handlePlatformCollision(player, platform) {
        if (player.body.touching.down && player.isFalling) {
          player.isFalling = false;
          // kick up dust
          var dust = game.add.sprite(0, 0, 'land');
          dust.position.x = player.body.position.x - 4;
          dust.position.y = player.body.position.y + player.body.height - 2;

          var anim = dust.animations.add('dust');
          dust.animations.play('dust', 32/3);
          anim.onComplete.add(function() {
            dust.kill();
          }, this);
        }
      });

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL3N1YnBvbHkvbm9kZV9tb2R1bGVzL3N1Ym1vbm8vc3VibW9uby5qcyIsIm5vZGVfbW9kdWxlcy9zdWJwb2x5L3N1YnBvbHkuanMiLCJzY3JpcHRzL2RhdGEvcGxheWVycy5qcyIsInNjcmlwdHMvZGF0YS9zZXR0aW5ncy5qcyIsInNjcmlwdHMvZGF0YS9zdGFnZXMuanMiLCJzY3JpcHRzL21haW4uanMiLCJzY3JpcHRzL21lbnUuanMiLCJzY3JpcHRzL211c2ljLmpzIiwic2NyaXB0cy9wbGF5ZXIuanMiLCJzY3JpcHRzL3NmeC5qcyIsInNjcmlwdHMvc3RhZ2VCdWlsZGVyLmpzIiwic2NyaXB0cy9zdGF0ZXMvbG9hZGluZy5qcyIsInNjcmlwdHMvc3RhdGVzL3BsYXkuanMiLCJzY3JpcHRzL3N0YXRlcy9zcGxhc2guanMiLCJzY3JpcHRzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIE1vbm9zeW50aCA9IGZ1bmN0aW9uIE1vbm9zeW50aChhdWRpb0N0eCwgY29uZmlnKSB7XG4gIHZhciBzeW50aDtcbiAgdmFyIFN5bnRoID0gZnVuY3Rpb24gU3ludGgoKSB7XG4gICAgc3ludGggPSB0aGlzO1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICBjb25maWcuY3V0b2ZmID0gY29uZmlnLmN1dG9mZiB8fCB7fTtcblxuICAgIHN5bnRoLmF1ZGlvQ3R4ID0gYXVkaW9DdHgsXG4gICAgc3ludGguYW1wICAgICAgPSBhdWRpb0N0eC5jcmVhdGVHYWluKCksXG4gICAgc3ludGguZmlsdGVyICAgPSBhdWRpb0N0eC5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICBzeW50aC5vc2MgICAgICA9IGF1ZGlvQ3R4LmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICBzeW50aC5wYW4gICAgICA9IGF1ZGlvQ3R4LmNyZWF0ZVBhbm5lcigpLFxuXG4gICAgc3ludGgubWF4R2FpbiAgPSBjb25maWcubWF4R2FpbiAgfHwgMC45LCAvLyBvdXQgb2YgMVxuICAgIHN5bnRoLmF0dGFjayAgID0gY29uZmlnLmF0dGFjayAgIHx8IDAuMSwgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLmRlY2F5ICAgID0gY29uZmlnLmRlY2F5ICAgIHx8IDAuMCwgLy8gaW4gc2Vjb25kc1xuICAgIHN5bnRoLnN1c3RhaW4gID0gY29uZmlnLnN1c3RhaW4gIHx8IDEuMCwgLy8gb3V0IG9mIDFcbiAgICBzeW50aC5yZWxlYXNlICA9IGNvbmZpZy5yZWxlYXNlICB8fCAwLjgsIC8vIGluIHNlY29uZHNcblxuICAgIC8vIGxvdy1wYXNzIGZpbHRlclxuICAgIHN5bnRoLmN1dG9mZiAgICAgICAgICAgICAgPSBzeW50aC5maWx0ZXIuZnJlcXVlbmN5O1xuICAgIHN5bnRoLmN1dG9mZi5tYXhGcmVxdWVuY3kgPSBjb25maWcuY3V0b2ZmLm1heEZyZXF1ZW5jeSB8fCA3NTAwOyAvLyBpbiBoZXJ0elxuICAgIHN5bnRoLmN1dG9mZi5hdHRhY2sgICAgICAgPSBjb25maWcuY3V0b2ZmLmF0dGFjayAgICAgICB8fCAwLjE7IC8vIGluIHNlY29uZHNcbiAgICBzeW50aC5jdXRvZmYuZGVjYXkgICAgICAgID0gY29uZmlnLmN1dG9mZi5kZWNheSAgICAgICAgfHwgMi41OyAvLyBpbiBzZWNvbmRzXG4gICAgc3ludGguY3V0b2ZmLnN1c3RhaW4gICAgICA9IGNvbmZpZy5jdXRvZmYuc3VzdGFpbiAgICAgIHx8IDAuMjsgLy8gb3V0IG9mIDFcbiAgICBcbiAgICBzeW50aC5hbXAuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgc3ludGguZmlsdGVyLnR5cGUgPSAnbG93cGFzcyc7XG4gICAgc3ludGguZmlsdGVyLmNvbm5lY3Qoc3ludGguYW1wKTtcbiAgICBzeW50aC5hbXAuY29ubmVjdChhdWRpb0N0eC5kZXN0aW5hdGlvbik7XG4gICAgc3ludGgucGFuLnBhbm5pbmdNb2RlbCA9ICdlcXVhbHBvd2VyJztcbiAgICBzeW50aC5wYW4uc2V0UG9zaXRpb24oMCwgMCwgMSk7IC8vIHN0YXJ0IHdpdGggc3RlcmVvIGltYWdlIGNlbnRlcmVkXG4gICAgc3ludGgub3NjLmNvbm5lY3Qoc3ludGgucGFuKTtcbiAgICBzeW50aC5wYW4uY29ubmVjdChzeW50aC5maWx0ZXIpO1xuICAgIHN5bnRoLm9zYy5zdGFydCgwKTtcbiAgICBcbiAgICBzeW50aC53YXZlZm9ybShjb25maWcud2F2ZWZvcm0gfHwgJ3NpbmUnKTtcbiAgICBzeW50aC5waXRjaChjb25maWcucGl0Y2ggfHwgNDQwKTtcblxuICAgIHJldHVybiBzeW50aDtcbiAgfTtcblxuICBmdW5jdGlvbiBnZXROb3coKSB7XG4gICAgdmFyIG5vdyA9IHN5bnRoLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xuICAgIHN5bnRoLmFtcC5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyhub3cpO1xuICAgIHN5bnRoLmFtcC5nYWluLnNldFZhbHVlQXRUaW1lKHN5bnRoLmFtcC5nYWluLnZhbHVlLCBub3cpO1xuICAgIHJldHVybiBub3c7XG4gIH07XG4gIFxuICBTeW50aC5wcm90b3R5cGUucGl0Y2ggPSBmdW5jdGlvbiBwaXRjaChuZXdQaXRjaCkge1xuICAgIGlmIChuZXdQaXRjaCkge1xuICAgICAgdmFyIG5vdyA9IHN5bnRoLmF1ZGlvQ3R4LmN1cnJlbnRUaW1lO1xuICAgICAgc3ludGgub3NjLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShuZXdQaXRjaCwgbm93KTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bnRoLm9zYy5mcmVxdWVuY3kudmFsdWU7XG4gIH07XG5cbiAgU3ludGgucHJvdG90eXBlLndhdmVmb3JtID0gZnVuY3Rpb24gd2F2ZWZvcm0obmV3V2F2ZWZvcm0pIHtcbiAgICBpZiAobmV3V2F2ZWZvcm0pIHtcbiAgICAgIHN5bnRoLm9zYy50eXBlID0gbmV3V2F2ZWZvcm07XG4gICAgfVxuICAgIHJldHVybiBzeW50aC5vc2MudHlwZTtcbiAgfTtcblxuICAvLyBhcHBseSBhdHRhY2ssIGRlY2F5LCBzdXN0YWluIGVudmVsb3BlXG4gIFN5bnRoLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIHN0YXJ0U3ludGgoKSB7XG4gICAgdmFyIGF0ayAgPSBwYXJzZUZsb2F0KHN5bnRoLmF0dGFjayk7XG4gICAgdmFyIGRlYyAgPSBwYXJzZUZsb2F0KHN5bnRoLmRlY2F5KTtcbiAgICB2YXIgY0F0ayA9IHBhcnNlRmxvYXQoc3ludGguY3V0b2ZmLmF0dGFjayk7XG4gICAgdmFyIGNEZWMgPSBwYXJzZUZsb2F0KHN5bnRoLmN1dG9mZi5kZWNheSk7XG4gICAgdmFyIG5vdyAgPSBnZXROb3coKTtcbiAgICBzeW50aC5jdXRvZmYuY2FuY2VsU2NoZWR1bGVkVmFsdWVzKG5vdyk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi52YWx1ZSwgbm93KTtcbiAgICBzeW50aC5jdXRvZmYubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoc3ludGguY3V0b2ZmLm1heEZyZXF1ZW5jeSwgbm93ICsgY0F0ayk7XG4gICAgc3ludGguY3V0b2ZmLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLmN1dG9mZi5zdXN0YWluICogc3ludGguY3V0b2ZmLm1heEZyZXF1ZW5jeSwgbm93ICsgY0F0ayArIGNEZWMpO1xuICAgIHN5bnRoLmFtcC5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKHN5bnRoLm1heEdhaW4sIG5vdyArIGF0ayk7XG4gICAgc3ludGguYW1wLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoc3ludGguc3VzdGFpbiAqIHN5bnRoLm1heEdhaW4sIG5vdyArIGF0ayArIGRlYyk7XG4gIH07XG5cbiAgLy8gYXBwbHkgcmVsZWFzZSBlbnZlbG9wZVxuICBTeW50aC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3BTeW50aCgpIHtcbiAgICB2YXIgcmVsID0gcGFyc2VGbG9hdChzeW50aC5yZWxlYXNlKTtcbiAgICB2YXIgbm93ID0gZ2V0Tm93KCk7XG4gICAgc3ludGguYW1wLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMCwgbm93ICsgcmVsKTtcbiAgfTtcblxuICByZXR1cm4gbmV3IFN5bnRoKCk7XG59O1xuXG4vLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBNb25vc3ludGg7XG59XG4iLCIvLyBucG0gc3VwcG9ydFxuaWYgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJykge1xuICB2YXIgTW9ub3N5bnRoID0gcmVxdWlyZSgnc3VibW9ubycpO1xufVxuXG52YXIgUG9seXN5bnRoID0gZnVuY3Rpb24gUG9seXN5bnRoKGF1ZGlvQ3R4LCBjb25maWcpIHtcbiAgdmFyIHN5bnRoO1xuICB2YXIgU3ludGggPSBmdW5jdGlvbiBTeW50aCgpIHtcbiAgICBzeW50aCA9IHRoaXM7XG4gICAgc3ludGguYXVkaW9DdHggPSBhdWRpb0N0eDtcbiAgICBzeW50aC52b2ljZXMgPSBbXTtcbiAgICBcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uZmlnLmN1dG9mZiA9IGNvbmZpZy5jdXRvZmYgfHwge307XG5cblxuICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGNvbmZpZy5udW1Wb2ljZXMgfHwgMTY7IGkgPCBpaTsgaSsrKSB7XG4gICAgICBzeW50aC52b2ljZXMucHVzaChuZXcgTW9ub3N5bnRoKGF1ZGlvQ3R4LCBjb25maWcpKTtcbiAgICB9XG5cbiAgICBzeW50aC5zdGVyZW9XaWR0aCA9IGNvbmZpZy5zdGVyZW9XaWR0aCB8fCAwLjU7IC8vIG91dCBvZiAxXG4gICAgc3ludGgud2lkdGgoc3ludGguc3RlcmVvV2lkdGgpO1xuXG4gICAgcmV0dXJuIHN5bnRoO1xuICB9O1xuXG4gIC8vIGFwcGx5IGF0dGFjaywgZGVjYXksIHN1c3RhaW4gZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gc3RhcnRTeW50aCgpIHtcbiAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBzdGFydFZvaWNlKHZvaWNlKSB7XG4gICAgICB2b2ljZS5zdGFydCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIGFwcGx5IHJlbGVhc2UgZW52ZWxvcGVcbiAgU3ludGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wU3ludGgoKSB7XG4gICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc3RvcFZvaWNlKHZvaWNlKSB7XG4gICAgICB2b2ljZS5zdG9wKCk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZ2V0L3NldCBzeW50aCBzdGVyZW8gd2lkdGhcbiAgU3ludGgucHJvdG90eXBlLndpZHRoID0gZnVuY3Rpb24gd2lkdGgobmV3V2lkdGgpIHtcbiAgICBpZiAoc3ludGgudm9pY2VzLmxlbmd0aCA+IDEgJiYgbmV3V2lkdGgpIHtcbiAgICAgIHN5bnRoLnN0ZXJlb1dpZHRoID0gbmV3V2lkdGg7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBwYW5Wb2ljZSh2b2ljZSwgaSkge1xuICAgICAgICB2YXIgc3ByZWFkID0gMS8oc3ludGgudm9pY2VzLmxlbmd0aCAtIDEpO1xuICAgICAgICB2YXIgeFBvcyA9IHNwcmVhZCAqIGkgKiBzeW50aC5zdGVyZW9XaWR0aDtcbiAgICAgICAgdmFyIHpQb3MgPSAxIC0gTWF0aC5hYnMoeFBvcyk7XG4gICAgICAgIHZvaWNlLnBhbi5zZXRQb3NpdGlvbih4UG9zLCAwLCB6UG9zKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBzeW50aC5zdGVyZW9XaWR0aDtcbiAgfTtcblxuICAvLyBjb252ZW5pZW5jZSBtZXRob2RzIGZvciBjaGFuZ2luZyB2YWx1ZXMgb2YgYWxsIE1vbm9zeW50aHMnIHByb3BlcnRpZXMgYXQgb25jZVxuICAoZnVuY3Rpb24gY3JlYXRlU2V0dGVycygpIHtcbiAgICB2YXIgbW9ub3N5bnRoUHJvcGVydGllcyA9IFsnbWF4R2FpbicsICdhdHRhY2snLCAnZGVjYXknLCAnc3VzdGFpbicsICdyZWxlYXNlJ107XG4gICAgdmFyIG1vbm9zeW50aEN1dG9mZlByb3BlcnRpZXMgPSBbJ21heEZyZXF1ZW5jeScsICdhdHRhY2snLCAnZGVjYXknLCAnc3VzdGFpbiddO1xuXG4gICAgbW9ub3N5bnRoUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihwcm9wZXJ0eSkge1xuICAgICAgU3ludGgucHJvdG90eXBlW3Byb3BlcnR5XSA9IGZ1bmN0aW9uIHNldFZhbHVlcyhuZXdWYWx1ZSkge1xuICAgICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiBzZXRWYWx1ZSh2b2ljZSkge1xuICAgICAgICAgIHZvaWNlW3Byb3BlcnR5XSA9IG5ld1ZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICBTeW50aC5wcm90b3R5cGUuY3V0b2ZmID0ge307XG4gICAgbW9ub3N5bnRoQ3V0b2ZmUHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIGNyZWF0ZVNldHRlcihwcm9wZXJ0eSkge1xuICAgICAgU3ludGgucHJvdG90eXBlLmN1dG9mZltwcm9wZXJ0eV0gPSBmdW5jdGlvbiBzZXRWYWx1ZXMobmV3VmFsdWUpIHtcbiAgICAgICAgc3ludGgudm9pY2VzLmZvckVhY2goZnVuY3Rpb24gc2V0VmFsdWUodm9pY2UpIHtcbiAgICAgICAgICB2b2ljZS5jdXRvZmZbcHJvcGVydHldID0gbmV3VmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIFN5bnRoLnByb3RvdHlwZS53YXZlZm9ybSA9IGZ1bmN0aW9uIHdhdmVmb3JtKG5ld1dhdmVmb3JtKSB7XG4gICAgICBzeW50aC52b2ljZXMuZm9yRWFjaChmdW5jdGlvbiB3YXZlZm9ybSh2b2ljZSkge1xuICAgICAgICB2b2ljZS53YXZlZm9ybShuZXdXYXZlZm9ybSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgU3ludGgucHJvdG90eXBlLnBpdGNoID0gZnVuY3Rpb24gcGl0Y2gobmV3UGl0Y2gpIHtcbiAgICAgIHN5bnRoLnZvaWNlcy5mb3JFYWNoKGZ1bmN0aW9uIHBpdGNoKHZvaWNlKSB7XG4gICAgICAgIHZvaWNlLnBpdGNoKG5ld1BpdGNoKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pKCk7XG5cbiAgcmV0dXJuIG5ldyBTeW50aDtcbn07XG5cbi8vIG5wbSBzdXBwb3J0XG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IFBvbHlzeW50aDtcbn1cbiIsInZhciBQbGF5ZXJzID0gZnVuY3Rpb24oZ2FtZSkge1xuICAgIHZhciBwbGF5ZXJzID0gW3tcbiAgICAgIG5hbWU6ICdCbHVlJyxcbiAgICAgIGNvbG9yOiAnYmx1ZScsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCcsIGF0dGFjazogJ1EnXG4gICAgICB9LFxuICAgIH0sIHtcbiAgICAgIG5hbWU6ICdQaW5rJyxcbiAgICAgIGNvbG9yOiAncGluaycsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMixcbiAgICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gICAgfSwge1xuICAgICAgbmFtZTogJ0dyZWVuJyxcbiAgICAgIGNvbG9yOiAnZ3JlZW4nLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnSScsIGRvd246ICdLJywgbGVmdDogJ0onLCByaWdodDogJ0wnLCBhdHRhY2s6ICdVJ1xuICAgICAgfSxcbiAgICB9LCB7XG4gICAgICBuYW1lOiAnUHVycGxlJyxcbiAgICAgIGNvbG9yOiAncHVycGxlJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LFxuICAgICAgb3JpZW50YXRpb246ICdsZWZ0JyxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdUJywgZG93bjogJ0cnLCBsZWZ0OiAnRicsIHJpZ2h0OiAnSCcsIGF0dGFjazogJ1InXG4gICAgICB9LFxuICB9XTtcbiAgXG4gIHJldHVybiBwbGF5ZXJzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJzO1xuIiwidmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vc3RhZ2VzJyk7XG5cbnZhciBzZXR0aW5ncyA9IHtcbiAgcGxheWVyQ291bnQ6IHtcbiAgICBvcHRpb25zOiBbMiwgMywgNF0sXG4gICAgc2VsZWN0ZWQ6IDQsXG4gIH0sXG4gIGJnbToge1xuICAgIG9wdGlvbnM6IFsnaGFuZ2FyLnhtJywgJ3RpdGxlLnhtJywgJ05vbmUnXSxcbiAgICBzZWxlY3RlZDogJ05vbmUnLFxuICB9LFxuICBzdGFnZToge1xuICAgIG9wdGlvbnM6IHN0YWdlcy5tYXAoZnVuY3Rpb24oc3RhZ2UpIHtcbiAgICAgIHJldHVybiBzdGFnZS5uYW1lO1xuICAgIH0pLFxuICAgIHNlbGVjdGVkOiAnSGFuZ2FyJyxcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZXR0aW5ncztcbiIsInZhciBzdGFnZXMgPSBbe1xuICBcIm5hbWVcIjogXCJBXCIsXG4gIFwidGhlbWVcIjogXCJOb25lXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzEwLCA3XSxcbiAgICAgIFs0NSwgN10sXG4gICAgICBbMjcsIDE1XSxcbiAgICAgIFsxMCwgMjVdLFxuICAgICAgWzQ1LCAyNV0sXG4gICAgICBbMTAsIDQ0XSxcbiAgICAgIFs0NSwgNDRdLFxuICAgICAgWzI3LCA1Ml0sXG4gICAgICBbMTAsIDYyXSxcbiAgICAgIFs0NSwgNjJdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwieWVsbG93XCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbXSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAwIH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiAwIH0sXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAxOCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMTggfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjMjhGMTI5XCJcbn0se1xuICBcIm5hbWVcIjogXCJCXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzI3LCA2XSxcbiAgICAgIFsxMCwgMTNdLFxuICAgICAgWzQ1LCAxM10sXG4gICAgICBbNCwgMjJdLFxuICAgICAgWzUwLCAyMl0sXG4gICAgICBbMTgsIDMxXSxcbiAgICAgIFsyNywgMzFdLFxuICAgICAgWzM3LCAzMV0sXG4gICAgICBbNCwgNDRdLFxuICAgICAgWzUwLCA0NF0sXG4gICAgICBbMjcsIDYwXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcImdyYXlcIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFtdLFxuICBcImZvcmVncm91bmRcIjogXCJjbGVhclwiLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA5LCBcInlcIjogMTUgfSxcbiAgICB7IFwieFwiOiA1NCwgXCJ5XCI6IDE1IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzI4RDZGMVwiXG59LHtcbiAgXCJuYW1lXCI6IFwiSGFuZ2FyXCIsXG4gIFwidGhlbWVcIjogXCJoYW5nYXIueG1cIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbOCwgMzRdLFxuICAgICAgWzEyLCAzNF0sXG4gICAgICBbMjIsIDM0XSxcbiAgICAgIFszMSwgMzRdLFxuICAgICAgWzQxLCAzNF0sXG4gICAgICBbNDYsIDM0XSxcbiAgICBdLFxuICAgIFwiY29sb3JcIjogXCJncmF5XCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIGltYWdlOiAnaGFuZ2FyJ1xuICB9XSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTAsIFwieVwiOiAyNyB9LFxuICAgIHsgXCJ4XCI6IDE5LCBcInlcIjogMjcgfSxcbiAgICB7IFwieFwiOiA0MSwgXCJ5XCI6IDI3IH0sXG4gICAgeyBcInhcIjogNTAsIFwieVwiOiAyNyB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiM4RDhEOERcIlxufSx7XG4gIFwibmFtZVwiOiBcIldhdGVyZmFsbFwiLFxuICBcInRoZW1lXCI6IFwidGl0bGUueG1cIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbMTAsIDEzXSxcbiAgICAgIFs0NSwgMTNdLFxuICAgICAgWzI3LCAyMV0sXG4gICAgICBbMTAsIDMxXSxcbiAgICAgIFs0NSwgMzFdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwiYnJvd25cIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFt7XG4gICAgaW1hZ2U6ICd3YXRlcmZhbGwnXG4gIH1dLFxuICBcImZvcmVncm91bmRcIjogXCJjbGVhclwiLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDI0IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiAyNCB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiM3ODNFMDhcIlxufV07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VzO1xuIiwidmFyIHJlc2l6ZSA9IGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS56b29tID0gd2luZG93LmlubmVySGVpZ2h0IC8gZ2FtZS5oZWlnaHQ7XG59O1xuXG52YXIgbWFpbiA9IHtcbiAgcHJlbG9hZDogZnVuY3Rpb24gcHJlbG9hZCgpIHtcbiAgICB2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG5cbiAgICByZXNpemUoKTtcbiAgICB3aW5kb3cub25yZXNpemUgPSB1dGlscy5kZWJvdW5jZShyZXNpemUsIDEwMCk7XG4gICAgXG4gICAgLy8gYWxsb3cgYW55dGhpbmcgdXAgdG8gaGVpZ2h0IG9mIHdvcmxkIHRvIGZhbGwgb2ZmLXNjcmVlbiB1cCBvciBkb3duXG4gICAgZ2FtZS53b3JsZC5zZXRCb3VuZHMoMCwgLWdhbWUud2lkdGgsIGdhbWUud2lkdGgsIGdhbWUuaGVpZ2h0ICogMyk7XG4gICAgXG4gICAgLy8gcHJldmVudCBnYW1lIHBhdXNpbmcgd2hlbiBpdCBsb3NlcyBmb2N1c1xuICAgIGdhbWUuc3RhZ2UuZGlzYWJsZVZpc2liaWxpdHlDaGFuZ2UgPSB0cnVlO1xuICAgIFxuICAgIC8vIGFzc2V0cyB1c2VkIGluIGxvYWRpbmcgc2NyZWVuXG4gICAgZ2FtZS5sb2FkLmltYWdlKCdsb2FkaW5nJywgJ2ltYWdlcy9sb2FkaW5nLmdpZicpO1xuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgIGdhbWUuc3RhdGUuYWRkKCdsb2FkaW5nJywgcmVxdWlyZSgnLi9zdGF0ZXMvbG9hZGluZy5qcycpKGdhbWUpKTtcbiAgICBnYW1lLnN0YXRlLnN0YXJ0KCdsb2FkaW5nJyk7XG4gIH1cbn07XG5cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDY0LCA2NCwgUGhhc2VyLkFVVE8sICdnYW1lJywge1xuICBwcmVsb2FkOiBtYWluLnByZWxvYWQsXG4gIGNyZWF0ZTogbWFpbi5jcmVhdGVcbn0sIGZhbHNlLCBmYWxzZSk7IC8vIGRpc2FibGUgYW50aS1hbGlhc2luZ1xuXG5nYW1lLnN0YXRlLmFkZCgnbWFpbicsIG1haW4pO1xuZ2FtZS5zdGF0ZS5zdGFydCgnbWFpbicpO1xuIiwidmFyIGJ1aWxkTWVudSA9IGZ1bmN0aW9uIGJ1aWxkTWVudShnYW1lLCBzdGF0ZSkge1xuICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MuanMnKTtcblxuICB2YXIgY3ljbGVTZXR0aW5nID0gZnVuY3Rpb24gY3ljbGVTZXR0aW5nKCkge1xuICAgIHZhciBvcHRpb25JbmRleCA9IHRoaXMuc2V0dGluZy5vcHRpb25zLmluZGV4T2YodGhpcy5zZXR0aW5nLnNlbGVjdGVkKTtcbiAgICBvcHRpb25JbmRleCsrO1xuICAgIGlmIChvcHRpb25JbmRleCA9PT0gdGhpcy5zZXR0aW5nLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICBvcHRpb25JbmRleCA9IDA7XG4gICAgfVxuICAgIHRoaXMuc2V0dGluZy5zZWxlY3RlZCA9IHRoaXMuc2V0dGluZy5vcHRpb25zW29wdGlvbkluZGV4XTtcbiAgfTtcblxuICB2YXIgbWVudSA9IFt7XG4gICAgbmFtZTogJ1BsYXllcnMnLFxuICAgIHNldHRpbmc6IHNldHRpbmdzLnBsYXllckNvdW50LFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcbiAgICAgIHN0YXRlLnJlc3RhcnQoKTtcbiAgICB9LFxuICAgIHNlbGVjdGVkOiB0cnVlXG4gIH0sIHtcbiAgICBuYW1lOiAnQkdNJyxcbiAgICBzZXR0aW5nOiBzZXR0aW5ncy5iZ20sXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGN5Y2xlU2V0dGluZy5jYWxsKHRoaXMpO1xuICAgICAgc3RhdGUucmVzZXRNdXNpYyhzZXR0aW5ncyk7XG4gICAgfSxcbiAgfSwge1xuICAgIG5hbWU6ICdTdGFnZScsXG4gICAgc2V0dGluZzogc2V0dGluZ3Muc3RhZ2UsXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGN5Y2xlU2V0dGluZy5jYWxsKHRoaXMpO1xuXG4gICAgICAvLyBpZiBzdGFnZSBoYXMgYSBkZWZhdWx0IGJnbSwgbG9hZCBpdFxuICAgICAgdmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vZGF0YS9zdGFnZXMuanMnKTtcbiAgICAgIHZhciBzZWxlY3RlZFN0YWdlID0gc3RhZ2VzW3NldHRpbmdzLnN0YWdlLm9wdGlvbnMuaW5kZXhPZihzZXR0aW5ncy5zdGFnZS5zZWxlY3RlZCldO1xuICAgICAgaWYgKHNlbGVjdGVkU3RhZ2UudGhlbWUpIHtcbiAgICAgICAgc2V0dGluZ3MuYmdtLnNlbGVjdGVkID0gc2VsZWN0ZWRTdGFnZS50aGVtZTtcbiAgICAgIH1cblxuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH0sXG4gIH0sIHtcbiAgICBuYW1lOiAnU3RhcnQnLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBzdGF0ZS5yZXN0YXJ0KCk7XG4gICAgfVxuICB9XTtcblxuICB2YXIgY2hhbmdlUGxheWVyQ291bnQgPSBtZW51WzBdLmFjdGlvbi5iaW5kKG1lbnVbMF0pO1xuICB2YXIgY2hhbmdlQmdtID0gbWVudVsxXS5hY3Rpb24uYmluZChtZW51WzFdKTtcbiAgdmFyIGNoYW5nZVN0YWdlID0gbWVudVsyXS5hY3Rpb24uYmluZChtZW51WzJdKTtcbiAgdmFyIHJlc3RhcnQgPSBtZW51WzNdLmFjdGlvbi5iaW5kKG1lbnVbM10pO1xuXG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5QKS5vbkRvd24uYWRkKGNoYW5nZVBsYXllckNvdW50KTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLk0pLm9uRG93bi5hZGQoY2hhbmdlU3RhZ2UpO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuQikub25Eb3duLmFkZChjaGFuZ2VCZ20pO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuRU5URVIpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gIGlmIChnYW1lLmlucHV0LmdhbWVwYWQuc3VwcG9ydGVkICYmIGdhbWUuaW5wdXQuZ2FtZXBhZC5hY3RpdmUpIHtcbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDIuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkMy5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQzLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDQuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkNC5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWVudTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnVpbGRNZW51O1xuIiwidmFyIGJnbSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGxheWVyID0gbmV3IENoaXB0dW5lSnNQbGF5ZXIobmV3IENoaXB0dW5lSnNDb25maWcoLTEpKTtcblxuICByZXR1cm4ge1xuICAgIHBsYXk6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XG4gICAgICBpZiAoZmlsZU5hbWUgPT09ICdOb25lJykge1xuICAgICAgICBwbGF5ZXIuc3RvcC5jYWxsKHBsYXllcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXIubG9hZCgnLi9tdXNpYy8nICsgZmlsZU5hbWUsIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgIHBsYXllci5wbGF5KGJ1ZmZlcik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYmdtO1xuIiwidmFyIGNyZWF0ZVBsYXllciA9IGZ1bmN0aW9uIGNyZWF0ZVBsYXllcihnYW1lLCBvcHRpb25zLCBvbkRlYXRoKSB7XG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBvcmllbnRhdGlvbjogJ3JpZ2h0JyxcbiAgICBrZXlzOiB7XG4gICAgICB1cDogJ1VQJyxcbiAgICAgIGRvd246ICdET1dOJyxcbiAgICAgIGxlZnQ6ICdMRUZUJyxcbiAgICAgIHJpZ2h0OiAnUklHSFQnLFxuICAgICAgYXR0YWNrOiAnU0hJRlQnXG4gICAgfSxcbiAgICBzY2FsZToge1xuICAgICAgeDogMSxcbiAgICAgIHk6IDJcbiAgICB9LFxuICAgIGNvbG9yOiAncGluaycsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEsXG4gIH07XG5cbiAgdmFyIHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gIHZhciBrZXlzID0ge1xuICAgIHVwOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy51cF0pLFxuICAgIGRvd246IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmRvd25dKSxcbiAgICBsZWZ0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5sZWZ0XSksXG4gICAgcmlnaHQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnJpZ2h0XSksXG4gICAgYXR0YWNrOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5hdHRhY2tdKSxcbiAgfTtcblxuICB2YXIgZ2FtZXBhZCA9IHNldHRpbmdzLmdhbWVwYWQ7XG5cbiAgdmFyIHNmeCA9IHJlcXVpcmUoJy4vc2Z4LmpzJyk7XG5cbiAgdmFyIGFjdGlvbnMgPSB7XG4gICAgYXR0YWNrOiBmdW5jdGlvbiBhdHRhY2soKSB7XG4gICAgICB2YXIgZHVyYXRpb24gPSAyMDA7XG4gICAgICB2YXIgaW50ZXJ2YWwgPSA2MDA7XG4gICAgICB2YXIgdmVsb2NpdHkgPSAxMDA7XG5cbiAgICAgIHZhciBjYW5BdHRhY2sgPSAoRGF0ZS5ub3coKSA+IHBsYXllci5sYXN0QXR0YWNrZWQgKyBpbnRlcnZhbCkgJiYgIXBsYXllci5pc0R1Y2tpbmcgJiYgIXBsYXllci5pc1Blcm1hZGVhZDtcbiAgICAgIGlmICghY2FuQXR0YWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmlzQXR0YWNraW5nID0gdHJ1ZTtcbiAgICAgIHBsYXllci5sYXN0QXR0YWNrZWQgPSBEYXRlLm5vdygpO1xuXG4gICAgICBzZnguYXR0YWNrKCk7XG5cbiAgICAgIHN3aXRjaChwbGF5ZXIub3JpZW50YXRpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC12ZWxvY2l0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKCd3aGl0ZScpO1xuICAgICAgc2V0VGltZW91dChhY3Rpb25zLmVuZEF0dGFjaywgZHVyYXRpb24pO1xuICAgIH0sXG5cbiAgICBlbmRBdHRhY2s6IGZ1bmN0aW9uIGVuZEF0dGFjaygpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNBdHRhY2tpbmcpIHtcbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKHNldHRpbmdzLmNvbG9yKTtcbiAgICAgICAgcGxheWVyLmlzQXR0YWNraW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJ1bjogZnVuY3Rpb24gcnVuKGRpcmVjdGlvbikge1xuICAgICAgdmFyIG1heFNwZWVkID0gMzI7XG4gICAgICB2YXIgYWNjZWxlcmF0aW9uID0gcGxheWVyLmJvZHkudG91Y2hpbmcuZG93biA/IDggOiAzOyAvLyBwbGF5ZXJzIGhhdmUgbGVzcyBjb250cm9sIGluIHRoZSBhaXJcbiAgICAgIHBsYXllci5vcmllbnRhdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgLy8gaWYgcGxheWVyIGlzIGdvaW5nIGZhc3RlciB0aGFuIG1heCBydW5uaW5nIHNwZWVkIChkdWUgdG8gYXR0YWNrLCBldGMpLCBzbG93IHRoZW0gZG93biBvdmVyIHRpbWVcbiAgICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IC1tYXhTcGVlZCkge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCArPSBhY2NlbGVyYXRpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1heChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC0gYWNjZWxlcmF0aW9uLCAtbWF4U3BlZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID4gbWF4U3BlZWQpIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gYWNjZWxlcmF0aW9uO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gTWF0aC5taW4ocGxheWVyLmJvZHkudmVsb2NpdHkueCArIGFjY2VsZXJhdGlvbiwgbWF4U3BlZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAganVtcDogZnVuY3Rpb24ganVtcCgpIHtcbiAgICAgIGlmICghcGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAhcGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCAmJiAhcGxheWVyLmJvZHkudG91Y2hpbmcucmlnaHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgZHVzdCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnanVtcCcpO1xuICAgICAgdmFyIGFuaW0gPSBkdXN0LmFuaW1hdGlvbnMuYWRkKCdkdXN0Jyk7XG4gICAgICBkdXN0LmFuaW1hdGlvbnMucGxheSgnZHVzdCcsIDMyLzMpO1xuICAgICAgYW5pbS5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgZHVzdC5raWxsKCk7XG4gICAgICB9LCB0aGlzKTtcblxuICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24pIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMDA7XG4gICAgICAgIHNmeC5qdW1wKCk7XG4gICAgICAgIGR1c3QucG9zaXRpb24ueCA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnggLSA0O1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnkgPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi55ICsgcGxheWVyLmJvZHkuaGVpZ2h0IC0gMjtcbiAgICAgIC8vIHdhbGwganVtcHNcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEyMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDQ1O1xuICAgICAgICBzZnguanVtcCgpO1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnggPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi54ICsgMjtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi55ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueSAtIHBsYXllci5ib2R5LmhlaWdodDtcbiAgICAgICAgZHVzdC5hbmdsZSA9IDkwO1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5yaWdodCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEyMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC00NTtcbiAgICAgICAgc2Z4Lmp1bXAoKTtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi54ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueDtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi55ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueSArIHBsYXllci5ib2R5LmhlaWdodDtcbiAgICAgICAgZHVzdC5hbmdsZSA9IC05MDtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGFtcGVuSnVtcDogZnVuY3Rpb24gZGFtcGVuSnVtcCgpIHtcbiAgICAgIC8vIHNvZnRlbiB1cHdhcmQgdmVsb2NpdHkgd2hlbiBwbGF5ZXIgcmVsZWFzZXMganVtcCBrZXlcbiAgICAgICAgdmFyIGRhbXBlblRvUGVyY2VudCA9IDAuNTtcblxuICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueSA8IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ICo9IGRhbXBlblRvUGVyY2VudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkdWNrOiBmdW5jdGlvbiBkdWNrKCkge1xuICAgICAgaWYgKHBsYXllci5pc0F0dGFja2luZyB8fCBwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYXllci5pc0R1Y2tpbmcgJiYgcGxheWVyLmhwID4gMikge1xuICAgICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSAvIDIpO1xuICAgICAgICBhY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcbiAgICAgICAgcGxheWVyLnkgKz0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSB0cnVlO1xuXG4gICAgICAoZnVuY3Rpb24gcm9sbCgpIHtcbiAgICAgICAgdmFyIGNhblJvbGwgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA+IDI1ICYmIHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd247XG4gICAgICAgIGlmIChjYW5Sb2xsKSB7XG4gICAgICAgICAgcGxheWVyLmlzUm9sbGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0oKSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAyKSB7XG4gICAgICAgIHBsYXllci55IC09IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgICAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICAgICAgcGxheWVyLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbiB0YWtlRGFtYWdlKGFtb3VudCkge1xuICAgICAgLy8gcHJldmVudCB0YWtpbmcgbW9yZSBkYW1hZ2UgdGhhbiBocCByZW1haW5pbmcgaW4gY3VycmVudCBsaWZlXG4gICAgICBpZiAoYW1vdW50ID4gMSAmJiAocGxheWVyLmhwIC0gYW1vdW50KSAlIDIgIT09IDApIHtcbiAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmhwIC09IGFtb3VudDtcblxuICAgICAgaWYgKHBsYXllci5ocCA8IDApIHtcbiAgICAgICAgcGxheWVyLmhwID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChwbGF5ZXIuaHAgJSAyID09PSAwKSB7XG4gICAgICAgIGFjdGlvbnMuZGllKCk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgIH0sXG5cbiAgICBhcHBseUhlYWx0aEVmZmVjdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5ld1BsYXllckhlaWdodCA9IE1hdGgubWF4KE1hdGgucm91bmQocGxheWVyLmhwIC8gMiksIDEpO1xuICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIG5ld1BsYXllckhlaWdodCk7XG4gICAgICBhY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcblxuICAgICAgaWYgKHBsYXllci5ocCA9PT0gMCkge1xuICAgICAgICByZXR1cm47IC8vIGJpdCdzIGJlY29taW5nIGEgZ2hvc3Q7IGxlYXZlcyBpdHMgc2NhcmYgKG9yIGxhY2sgdGhlcmVvZikgYWxvbmVcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmhwICUgMiA9PT0gMSkge1xuICAgICAgICBwbGF5ZXIuc2NhcmYudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyLnNjYXJmLnZpc2libGUgPSB0cnVlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBhcHBseU9yaWVudGF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhwbGF5ZXIub3JpZW50YXRpb24gPT09ICdsZWZ0JyA/IHNldHRpbmdzLnNjYWxlLnggOiAtc2V0dGluZ3Muc2NhbGUueCwgcGxheWVyLnNjYWxlLnkpO1xuICAgIH0sXG5cbiAgICBkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5pc1Blcm1hZGVhZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAwKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYWN0aW9ucy5hcHBseUludnVsbmVyYWJpbGl0eSgpO1xuICAgICAgICB9LCAxMDApOyAvLyBkZWxheSBpbnZ1bG4gc28gcGxheWVycyBkb24ndCBzcGF3biBiZWhpbmQgb25lIGFub3RoZXJcblxuICAgICAgICBzZnguZGllKCk7XG4gICAgICAgIGFjdGlvbnMuZW5kQXR0YWNrKCk7XG4gICAgICAgIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuXG4gICAgICAgIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICAgICAgdmFyIHJlc3Bhd25Qb3NpdGlvbiA9IHV0aWxzLmdldFJhbmRvbUFycmF5RWxlbWVudCh1dGlscy5nZXRTdGFnZSgpLnNwYXduUG9pbnRzKTtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnggPSByZXNwYXduUG9zaXRpb24ueDtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnkgPSByZXNwYXduUG9zaXRpb24ueTtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2Z4LnBlcm1hZGllKCk7XG4gICAgICAgIHBsYXllci5hbHBoYSA9IDAuNTtcbiAgICAgICAgcGxheWVyLmlzUGVybWFkZWFkID0gdHJ1ZTtcbiAgICAgICAgb25EZWF0aCgpOyAvLyBUT0RPOiB0aGlzIGNvdWxkIHByb2JhYmx5IGJlIGJldHRlciBhcmNoaXRlY3RlZFxuICAgICAgfVxuICAgIH0sXG5cbiAgICBhcHBseUludnVsbmVyYWJpbGl0eTogZnVuY3Rpb24oKSB7XG4gICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gZmFsc2U7XG4gICAgICB2YXIgbWFrZVdoaXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHBsYXllci5sb2FkVGV4dHVyZSgnd2hpdGUnKTtcbiAgICAgIH07XG4gICAgICB2YXIgbWFrZUNvbG9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHBsYXllci5sb2FkVGV4dHVyZShzZXR0aW5ncy5jb2xvcik7XG4gICAgICB9O1xuICAgICAgdmFyIGNvbG9ySW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChtYWtlQ29sb3IsIDE1MCk7XG4gICAgICB2YXIgd2hpdGVJbnRlcnZhbDtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHdoaXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChtYWtlV2hpdGUsIDE1MCk7XG4gICAgICB9LCA3NSk7XG4gICAgICBtYWtlQ29sb3IoKTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwod2hpdGVJbnRlcnZhbCk7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoY29sb3JJbnRlcnZhbCk7XG4gICAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSB0cnVlO1xuICAgICAgfSwgMTUwMCk7XG4gICAgfSxcbiAgfTtcblxuICB2YXIgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIHNldHRpbmdzLmNvbG9yKTtcbiAgcGxheWVyLm5hbWUgPSBzZXR0aW5ncy5uYW1lO1xuICBwbGF5ZXIub3JpZW50YXRpb24gPSBzZXR0aW5ncy5vcmllbnRhdGlvbjtcbiAgcGxheWVyLmFuY2hvci5zZXRUbyguNSwuNSk7IC8vIGFuY2hvciB0byBjZW50ZXIgdG8gYWxsb3cgZmxpcHBpbmdcblxuICBwbGF5ZXIuc2NhcmYgPSBnYW1lLmFkZC5zcHJpdGUoLTEsIC0xLCBzZXR0aW5ncy5jb2xvciArICdTY2FyZicpO1xuICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9ucy5hZGQoJ3NjYXJmJyk7XG4gIHBsYXllci5zY2FyZi5hbmltYXRpb24gPSBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9ucy5wbGF5KCdzY2FyZicsIDMyLzMsIHRydWUpO1xuICBwbGF5ZXIuc2NhcmYuc2V0U2NhbGVNaW5NYXgoLTEsIDEsIDEsIDEpO1xuICBwbGF5ZXIuYWRkQ2hpbGQocGxheWVyLnNjYXJmKTtcblxuICAvLyB0cmFjayBoZWFsdGhcbiAgcGxheWVyLmhwID0gcGxheWVyLm1heEhwID0gNjsgLy8gVE9ETzogYWxsb3cgc2V0dGluZyBjdXN0b20gaHAgYW1vdW50IGZvciBlYWNoIHBsYXllclxuICBwbGF5ZXIuYWN0aW9ucyA9IGFjdGlvbnM7XG4gIHBsYXllci5hY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpOyAvLyBUT0RPOiBhZGQgZ2lhbnQgbW9kZVxuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHBsYXllcik7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5ib2R5LmJvdW5jZS55ID0gMC4yOyAvLyBUT0RPOiBhbGxvdyBib3VuY2UgY29uZmlndXJhdGlvblxuICBwbGF5ZXIuYm9keS5ncmF2aXR5LnkgPSAzODA7IC8vIFRPRE86IGFsbG93IGdyYXZpdHkgY29uZmlndXJhdGlvblxuXG4gIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTsgLy8gdHJhY2sgaW5wdXQgY2hhbmdlIGZvciB2YXJpYWJsZSBqdW1wIGhlaWdodFxuICBwbGF5ZXIuaXNGYWxsaW5nID0gZmFsc2U7XG4gIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzUGVybWFkZWFkID0gZmFsc2U7XG4gIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuICAvLyBwaGFzZXIgYXBwYXJlbnRseSBhdXRvbWF0aWNhbGx5IGNhbGxzIGFueSBmdW5jdGlvbiBuYW1lZCB1cGRhdGUgYXR0YWNoZWQgdG8gYSBzcHJpdGUhXG4gIHBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBraWxsIHBsYXllciBpZiBoZSBmYWxscyBvZmYgdGhlIHNjcmVlblxuICAgIGlmIChwbGF5ZXIucG9zaXRpb24ueSA+IDY0ICYmIHBsYXllci5ocCAhPT0gMCkgeyAvLyBUT0RPOiBob3cgdG8gYWNjZXNzIG5hdGl2ZSBoZWlnaHQgZnJvbSBnYW1lLmpzP1xuICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDIpO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID4gODUpIHtcbiAgICAgIHBsYXllci5pc0ZhbGxpbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIHBsYXllci5zY2FyZi5hbmltYXRpb24uc3BlZWQgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSAqIC43NSArIDMyLzM7XG5cbiAgICB2YXIgaW5wdXQgPSB7XG4gICAgICBsZWZ0OiAgIChrZXlzLmxlZnQuaXNEb3duICYmICFrZXlzLnJpZ2h0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSAmJiAhZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1JJR0hUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA8IC0wLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPCAtMC4xLFxuICAgICAgcmlnaHQ6ICAoa2V5cy5yaWdodC5pc0Rvd24gJiYgIWtleXMubGVmdC5pc0Rvd24pIHx8XG4gICAgICAgICAgICAgIChnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfTEVGVCkpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWCkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWCkgPiAwLjEsXG4gICAgICB1cDogICAgIGtleXMudXAuaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9VUCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9BKSxcbiAgICAgIGRvd246ICAga2V5cy5kb3duLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfRE9XTikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9ZKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9ZKSA+IDAuMSxcbiAgICAgIGF0dGFjazoga2V5cy5hdHRhY2suaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9YKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0IpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0xFRlRfVFJJR0dFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX0JVTVBFUikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1JJR0hUX1RSSUdHRVIpLFxuICAgIH07XG5cbiAgICBpZiAoaW5wdXQubGVmdCkge1xuICAgICAgYWN0aW9ucy5ydW4oJ2xlZnQnKTtcbiAgICAgIHBsYXllci5hY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGlucHV0LnJpZ2h0KSB7XG4gICAgICBhY3Rpb25zLnJ1bigncmlnaHQnKTtcbiAgICAgIHBsYXllci5hY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgIXBsYXllci5pc1JvbGxpbmcpIHtcbiAgICAgIC8vIGFwcGx5IGZyaWN0aW9uXG4gICAgICBpZiAoTWF0aC5hYnMocGxheWVyLmJvZHkudmVsb2NpdHkueCkgPCAyKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKj0gMC41OyAvLyBxdWlja2x5IGJyaW5nIHNsb3ctbW92aW5nIHBsYXllcnMgdG8gYSBzdG9wXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPiAwKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gMjtcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IDApIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCArPSAyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbnB1dC51cCkge1xuICAgICAgcGxheWVyLnVwV2FzRG93biA9IHRydWU7XG4gICAgICBhY3Rpb25zLmp1bXAoKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci51cFdhc0Rvd24pIHtcbiAgICAgIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTtcbiAgICAgIGFjdGlvbnMuZGFtcGVuSnVtcCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5kb3duKSB7XG4gICAgICBhY3Rpb25zLmR1Y2soKTtcbiAgICB9IGVsc2UgaWYgKHBsYXllci5pc0R1Y2tpbmcpIHtcbiAgICAgIGFjdGlvbnMuc3RhbmQoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuYXR0YWNrKSB7XG4gICAgICBhY3Rpb25zLmF0dGFjaygpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gcGxheWVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVQbGF5ZXI7XG4iLCJ2YXIgc2Z4ID0gKGZ1bmN0aW9uIHNmeCgpIHtcbiAgUG9seXN5bnRoID0gcmVxdWlyZSgnc3VicG9seScpO1xuXG4gIHZhciBhdWRpb0N0eDtcbiAgaWYgKHR5cGVvZiBBdWRpb0NvbnRleHQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBhdWRpb0N0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgfSBlbHNlIHtcbiAgICBhdWRpb0N0eCA9IG5ldyB3ZWJraXRBdWRpb0NvbnRleHQoKTtcbiAgfVxuXG4gIHZhciBwdWxzZSA9IG5ldyBQb2x5c3ludGgoYXVkaW9DdHgsIHtcbiAgICB3YXZlZm9ybTogJ3NxdWFyZScsXG4gICAgcmVsZWFzZTogMC4wMSxcbiAgICBudW1Wb2ljZXM6IDRcbiAgfSk7XG4gIFxuICBmdW5jdGlvbiBnZXROb3codm9pY2UpIHtcbiAgICB2YXIgbm93ID0gdm9pY2UuYXVkaW9DdHguY3VycmVudFRpbWU7XG4gICAgcmV0dXJuIG5vdztcbiAgfTtcbiAgXG4gIHZhciBqdW1wVGltZW91dCwgYXR0YWNrVGltZW91dDtcbiAgdmFyIGRpZVRpbWVvdXRzID0gW107XG5cbiAgdmFyIHNvdW5kRWZmZWN0cyA9IHtcbiAgICBqdW1wOiBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyVGltZW91dChqdW1wVGltZW91dCk7XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1swXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDAuMTsgLy8gaW4gc2Vjb25kc1xuICAgICAgXG4gICAgICB2b2ljZS5waXRjaCg0NDApO1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgdmFyIG5vdyA9IGdldE5vdyh2b2ljZSk7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDg4MCwgbm93ICsgZHVyYXRpb24pO1xuICAgICAganVtcFRpbWVvdXQgPSBzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogMTAwMCk7XG4gICAgfSxcblxuICAgIGF0dGFjazogZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhclRpbWVvdXQoYXR0YWNrVGltZW91dCk7XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1sxXTtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDAuMTsgLy8gaW4gc2Vjb25kc1xuICAgICAgXG4gICAgICB2b2ljZS5waXRjaCg4ODApO1xuICAgICAgdm9pY2Uuc3RhcnQoKTtcblxuICAgICAgdmFyIG5vdyA9IGdldE5vdyh2b2ljZSk7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDAsIG5vdyArIGR1cmF0aW9uKTtcbiAgICAgIGF0dGFja1RpbWVvdXQgPSBzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogMTAwMCk7XG4gICAgfSxcbiAgICBcbiAgICBib3VuY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KGF0dGFja1RpbWVvdXQpO1xuICAgICAgXG4gICAgICB2YXIgdm9pY2UgPSBwdWxzZS52b2ljZXNbMl07XG4gICAgICB2YXIgZHVyYXRpb24gPSAwLjE7IC8vIGluIHNlY29uZHNcbiAgICAgIFxuICAgICAgdm9pY2UucGl0Y2goNDQwKTtcbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG5cbiAgICAgIHZhciBub3cgPSBnZXROb3codm9pY2UpO1xuICAgICAgdm9pY2Uub3NjLmZyZXF1ZW5jeS5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgyMjAsIG5vdyArIGR1cmF0aW9uIC8gMik7XG4gICAgICB2b2ljZS5vc2MuZnJlcXVlbmN5LmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDY2MCwgbm93ICsgZHVyYXRpb24pO1xuICAgICAgYXR0YWNrVGltZW91dCA9IHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiAxMDAwKTtcbiAgICB9LFxuICAgIFxuICAgIGRpZTogZnVuY3Rpb24oKSB7XG4gICAgICB3aGlsZSAoZGllVGltZW91dHMubGVuZ3RoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChkaWVUaW1lb3V0cy5wb3AoKSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHZhciB2b2ljZSA9IHB1bHNlLnZvaWNlc1szXTtcbiAgICAgIHZhciBwaXRjaGVzID0gWzQ0MCwgMjIwLCAxMTBdO1xuICAgICAgdmFyIGR1cmF0aW9uID0gMTAwO1xuXG4gICAgICB2b2ljZS5zdGFydCgpO1xuICAgICAgXG4gICAgICBwaXRjaGVzLmZvckVhY2goZnVuY3Rpb24ocGl0Y2gsIGkpIHtcbiAgICAgICAgZGllVGltZW91dHMucHVzaChzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZvaWNlLnBpdGNoKHBpdGNoKTtcbiAgICAgICAgfSwgaSAqIGR1cmF0aW9uKSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZGllVGltZW91dHMucHVzaChzZXRUaW1lb3V0KHZvaWNlLnN0b3AsIGR1cmF0aW9uICogcGl0Y2hlcy5sZW5ndGgpKTtcbiAgICB9LFxuICAgIHBlcm1hZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIHdoaWxlIChkaWVUaW1lb3V0cy5sZW5ndGgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGRpZVRpbWVvdXRzLnBvcCgpKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHZvaWNlID0gcHVsc2Uudm9pY2VzWzNdO1xuICAgICAgdmFyIHBpdGNoZXMgPSBbMjIwLCAxOTYsIDE4NV07XG4gICAgICB2YXIgZHVyYXRpb24gPSAyMDA7XG5cbiAgICAgIHZvaWNlLnN0YXJ0KCk7XG5cbiAgICAgIHBpdGNoZXMuZm9yRWFjaChmdW5jdGlvbihwaXRjaCwgaSkge1xuICAgICAgICBkaWVUaW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdm9pY2UucGl0Y2gocGl0Y2gpO1xuICAgICAgICB9LCBpICogZHVyYXRpb24pKTtcbiAgICAgIH0pO1xuXG4gICAgICBkaWVUaW1lb3V0cy5wdXNoKHNldFRpbWVvdXQodm9pY2Uuc3RvcCwgZHVyYXRpb24gKiBwaXRjaGVzLmxlbmd0aCkpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBzb3VuZEVmZmVjdHM7XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNmeDtcbiIsInZhciBzdGFnZUJ1aWxkZXIgPSBmdW5jdGlvbiBzdGFnZUJ1aWxkZXIoZ2FtZSkge1xuICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MuanMnKTtcbiAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscy5qcycpO1xuICB2YXIgc3RhZ2UgPSB1dGlscy5nZXRTdGFnZSgpO1xuXG4gIGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gc3RhZ2UuYmFja2dyb3VuZENvbG9yO1xuXG4gIHZhciBidWlsZFBsYXRmb3JtcyA9IGZ1bmN0aW9uIGJ1aWxkUGxhdGZvcm1zKCkge1xuICAgIHZhciBwbGF0Zm9ybXMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICAgIHBsYXRmb3Jtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcblxuICAgIHZhciBwbGF0Zm9ybVBvc2l0aW9ucyA9IHN0YWdlLnBsYXRmb3Jtcy5wb3NpdGlvbnM7XG4gICAgcGxhdGZvcm1Qb3NpdGlvbnMuZm9yRWFjaChmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgdmFyIHBsYXRmb3JtID0gcGxhdGZvcm1zLmNyZWF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sIHN0YWdlLnBsYXRmb3Jtcy5jb2xvcik7XG4gICAgICBwbGF0Zm9ybS5zY2FsZS5zZXRUbyg1LCAxKTtcbiAgICAgIHBsYXRmb3JtLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHZhciB3YWxscyA9IFtdO1xuICAgIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgtMywgLTEyLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpKTtcbiAgICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoNjEsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKSk7XG4gICAgd2FsbHMuZm9yRWFjaChmdW5jdGlvbih3YWxsKSB7XG4gICAgICB3YWxsLnNjYWxlLnNldFRvKDMsIDM4KTtcbiAgICAgIHdhbGwuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIH0pO1xuXG4gICAgdmFyIGNlaWxpbmcgPSBwbGF0Zm9ybXMuY3JlYXRlKDAsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKTtcbiAgICBjZWlsaW5nLnNjYWxlLnNldFRvKDMyLCAzKTtcbiAgICBjZWlsaW5nLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICBcbiAgICByZXR1cm4gcGxhdGZvcm1zO1xuICB9O1xuXG4gIHZhciBidWlsZEJhY2tncm91bmRzID0gZnVuY3Rpb24gYnVpbGRCYWNrZ3JvdW5kcygpIHtcbiAgICB2YXIgYmFja2dyb3VuZHMgPSBnYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgc3RhZ2UuYmFja2dyb3VuZHMuZm9yRWFjaChmdW5jdGlvbihsYXllcikge1xuICAgICAgdmFyIGJnO1xuICAgICAgaWYgKGxheWVyLnNjcm9sbGluZykge1xuICAgICAgICBiZyA9IGdhbWUuYWRkLnRpbGVTcHJpdGUoMCwgMCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQsIGxheWVyLmltYWdlKTtcbiAgICAgICAgYmFja2dyb3VuZHMubG9vcCA9IGdhbWUudGltZS5ldmVudHMubG9vcChQaGFzZXIuVGltZXIuUVVBUlRFUiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmcudGlsZVBvc2l0aW9uLnggLT0xO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJnID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIGxheWVyLmltYWdlKTtcbiAgICAgIH1cbiAgICAgIGJhY2tncm91bmRzLmFkZChiZyk7XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIGJhY2tncm91bmRzO1xuICB9O1xuXG4gIHZhciBidWlsZEZvcmVncm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9yZWdyb3VuZCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCBzdGFnZS5mb3JlZ3JvdW5kKTtcbiAgICByZXR1cm4gZm9yZWdyb3VuZDtcbiAgfTtcbiAgXG4gIHJldHVybiB7XG4gICAgYnVpbGRQbGF0Zm9ybXM6IGJ1aWxkUGxhdGZvcm1zLFxuICAgIGJ1aWxkRm9yZWdyb3VuZDogYnVpbGRGb3JlZ3JvdW5kLFxuICAgIGJ1aWxkQmFja2dyb3VuZHM6IGJ1aWxkQmFja2dyb3VuZHNcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VCdWlsZGVyO1xuIiwidmFyIExvYWRpbmcgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBsb2FkaW5nID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsb2FkaW5nJyk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZycpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfSxcblxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gaW1hZ2VzXG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3RpdGxlJywgJ2ltYWdlcy9zcHJpdGVzaGVldC10aXRsZS5naWYnLCA2NCwgNjQpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCd2aWN0b3J5TXNnJywgJ2ltYWdlcy9zcHJpdGVzaGVldC13aW5uZXIuZ2lmJywgNTIsIDIyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYmx1ZVNjYXJmJywgJ2ltYWdlcy9zcHJpdGVzaGVldC1zY2FyZi1ibHVlYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdwaW5rU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXNoZWV0LXNjYXJmLXBpbmtiaXQuZ2lmJywgNSwgMik7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2dyZWVuU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXNoZWV0LXNjYXJmLWdyZWVuYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdwdXJwbGVTY2FyZicsICdpbWFnZXMvc3ByaXRlc2hlZXQtc2NhcmYtcHVycGxlYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdqdW1wJywgJ2ltYWdlcy9zcHJpdGVzaGVldC1qdW1wLmdpZicsIDEwLCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnbGFuZCcsICdpbWFnZXMvc3ByaXRlc2hlZXQtbGFuZC5naWYnLCAxMCwgMik7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2NsZWFyJywgJ2ltYWdlcy9jbGVhci5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnd2hpdGUnLCAnaW1hZ2VzL3doaXRlLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdwaW5rJywgJ2ltYWdlcy9waW5rLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCd5ZWxsb3cnLCAnaW1hZ2VzL3llbGxvdy5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnYmx1ZScsICdpbWFnZXMvYmx1ZS5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgncHVycGxlJywgJ2ltYWdlcy9wdXJwbGUucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ29yYW5nZScsICdpbWFnZXMvb3JhbmdlLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdncmVlbicsICdpbWFnZXMvZ3JlZW4ucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2dyYXknLCAnaW1hZ2VzL2dyYXkucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2Jyb3duJywgJ2ltYWdlcy9icm93bi5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnd2F0ZXJmYWxsJywgJ2ltYWdlcy93YXRlcmZhbGwuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2hhbmdhcicsICdpbWFnZXMvbGV2ZWwtaGFuZ2FyLXdpcC5naWYnKTtcblxuICAgICAgLy8gc291bmRcbiAgICAgIGdhbWUuc2Z4ID0gcmVxdWlyZSgnLi4vc2Z4LmpzJyk7XG4gICAgICBnYW1lLmJnbSA9IHJlcXVpcmUoJy4uL211c2ljJykoKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5zdGFydCgpO1xuXG4gICAgICBnYW1lLnN0YXRlLmFkZCgnc3BsYXNoJywgcmVxdWlyZSgnLi9zcGxhc2guanMnKShnYW1lKSk7XG4gICAgICBnYW1lLnN0YXRlLmFkZCgncGxheScsIHJlcXVpcmUoJy4vcGxheS5qcycpKGdhbWUpKTtcbiAgICAgIGdhbWUuc3RhdGUuc3RhcnQoJ3NwbGFzaCcpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBsb2FkaW5nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nO1xuIiwidmFyIFBsYXkgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBwbGF5ID0ge1xuICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBzZWxmLnN1YlVpID0gZ2FtZS5hZGQuZ3JvdXAoKTsgLy8gcGxhY2UgdG8ga2VlcCBhbnl0aGluZyBvbi1zY3JlZW4gdGhhdCdzIG5vdCBVSSB0byBkZXB0aCBzb3J0IGJlbG93IFVJXG5cbiAgICAgIC8vIGdhbWUgb3ZlciB2aWN0b3J5IG1lc3NhZ2UgZGVjbGFyaW5nIHRoZSB3aW5uZXJcbiAgICAgIHNlbGYudmljdG9yeU1zZyA9IGdhbWUuYWRkLnNwcml0ZSg2LCAyMSwgJ3ZpY3RvcnlNc2cnKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy52aXNpYmxlID0gZmFsc2U7XG4gICAgICBzZWxmLnZpY3RvcnlNc2cuYW5pbWF0aW9ucy5hZGQoJ0JsdWUnLCBbMCwgNCwgOCwgMTJdLCAzMi8zLCB0cnVlKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnUGluaycsIFsxLCA1LCA5LCAxM10sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdHcmVlbicsIFsyLCA2LCAxMCwgMTRdLCAzMi8zLCB0cnVlKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnUHVycGxlJywgWzMsIDcsIDExLCAxNV0sIDMyLzMsIHRydWUpO1xuXG4gICAgICAvLyBtZW51XG4gICAgICB2YXIgYnVpbGRNZW51ID0gcmVxdWlyZSgnLi4vbWVudS5qcycpO1xuICAgICAgYnVpbGRNZW51KGdhbWUsIHNlbGYpOyAvLyBUT0RPOiBpcyB0aGVyZSBhIGJldHRlciBhcHByb2FjaCB0aGFuIGluamVjdGluZyB0aGUgd2hvbGUgc3RhdGUgaW50byB0aGUgbWVudSB0byBsZXQgaXQgYWNjZXNzIGZ1bmN0aW9ucyBmb3IgcmVzZXR0aW5nIHN0YWdlLCBwbGF5ZXJzLCBtdXNpYz9cblxuICAgICAgc2VsZi5yZXN0YXJ0KCk7XG4gICAgICBnYW1lLnBoeXNpY3Muc3RhcnRTeXN0ZW0oUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5zdGFydCgpO1xuICAgIH0sXG5cbiAgICByZXNldE11c2ljOiBmdW5jdGlvbihzZXR0aW5ncykge1xuICAgICAgZ2FtZS5iZ20ucGxheShzZXR0aW5ncy5iZ20uc2VsZWN0ZWQpO1xuICAgIH0sXG5cbiAgICByZXN0YXJ0OiBmdW5jdGlvbiByZXN0YXJ0KCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBsYXllcnMgPSByZXF1aXJlKCcuLi9kYXRhL3BsYXllcnMuanMnKShnYW1lKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL2RhdGEvc2V0dGluZ3MnKTtcbiAgICAgIHZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzLmpzJyk7XG4gICAgICB2YXIgc3RhZ2VCdWlsZGVyID0gcmVxdWlyZSgnLi4vc3RhZ2VCdWlsZGVyLmpzJykoZ2FtZSk7XG4gICAgICB2YXIgc3RhZ2UgPSB1dGlscy5nZXRTdGFnZSgpO1xuXG4gICAgICAvLyBpZiBzdGFnZSBoYXMgYSBkZWZhdWx0IGJnbSwgbG9hZCBpdFxuICAgICAgaWYgKHN0YWdlLnRoZW1lKSB7XG4gICAgICAgIHNldHRpbmdzLmJnbS5zZWxlY3RlZCA9IHN0YWdlLnRoZW1lO1xuICAgICAgfVxuICAgICAgc2VsZi5yZXNldE11c2ljKHNldHRpbmdzKTtcblxuICAgICAgLy8gZGVzdHJveSBhbmQgcmVidWlsZCBzdGFnZSBhbmQgcGxheWVyc1xuICAgICAgdmFyIGRlc3Ryb3lHcm91cCA9IGZ1bmN0aW9uIGRlc3Ryb3lHcm91cChncm91cCkge1xuICAgICAgICBpZiAoIWdyb3VwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGdyb3VwLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBncm91cC5jaGlsZHJlblswXS5kZXN0cm95KCk7XG4gICAgICAgIH1cblxuICAgICAgICBncm91cC5kZXN0cm95KCk7XG4gICAgICB9XG5cbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLnBsYXllcnMpO1xuICAgICAgZGVzdHJveUdyb3VwKHNlbGYucGxhdGZvcm1zKTtcbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLmJhY2tncm91bmRzKTtcblxuICAgICAgLy8gVE9ETzogdWdoLCBjbGVhbiB0aGlzIHVwIVxuICAgICAgaWYgKHNlbGYuYmFja2dyb3VuZHMgJiYgc2VsZi5iYWNrZ3JvdW5kcy5sb29wKSB7XG4gICAgICAgIGdhbWUudGltZS5ldmVudHMucmVtb3ZlKHNlbGYuYmFja2dyb3VuZHMubG9vcCk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5mb3JlZ3JvdW5kKSB7XG4gICAgICAgIHNlbGYuZm9yZWdyb3VuZC5kZXN0cm95KCk7XG4gICAgICB9XG5cbiAgICAgIHNlbGYucGxhdGZvcm1zID0gc3RhZ2VCdWlsZGVyLmJ1aWxkUGxhdGZvcm1zKCk7XG4gICAgICBzZWxmLmJhY2tncm91bmRzID0gc3RhZ2VCdWlsZGVyLmJ1aWxkQmFja2dyb3VuZHMoKTtcbiAgICAgIHNlbGYuc3ViVWkuYWRkKHNlbGYucGxhdGZvcm1zKTtcbiAgICAgIHNlbGYuc3ViVWkuYWRkKHNlbGYuYmFja2dyb3VuZHMpO1xuXG4gICAgICBzZWxmLnBsYXllcnMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICAgICAgc2VsZi5zdWJVaS5hZGQoc2VsZi5wbGF5ZXJzKTtcblxuICAgICAgdmFyIGFkZFBsYXllciA9IGZ1bmN0aW9uIGFkZFBsYXllcihwbGF5ZXIpIHtcbiAgICAgICAgdmFyIGNoZWNrRm9yR2FtZU92ZXIgPSBmdW5jdGlvbiBjaGVja0ZvckdhbWVPdmVyKCkge1xuICAgICAgICAgIHZhciBhbGl2ZVBsYXllcnMgPSBbXTtcbiAgICAgICAgICBzZWxmLnBsYXllcnMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihwbGF5ZXIsIGkpIHtcbiAgICAgICAgICAgIGlmICghcGxheWVyLmlzUGVybWFkZWFkKSB7XG4gICAgICAgICAgICAgIGFsaXZlUGxheWVycy5wdXNoKHBsYXllci5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoYWxpdmVQbGF5ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnBsYXkoYWxpdmVQbGF5ZXJzWzBdKTtcbiAgICAgICAgICAgIHNlbGYudmljdG9yeU1zZy52aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYudmljdG9yeU1zZy52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgIHNlbGYucmVzdGFydCgpO1xuICAgICAgICAgICAgfSwgMzAwMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgY3JlYXRlUGxheWVyID0gcmVxdWlyZSgnLi4vcGxheWVyLmpzJyk7XG4gICAgICAgIHZhciBuZXdQbGF5ZXIgPSBzZWxmLnBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIsIGNoZWNrRm9yR2FtZU92ZXIpKTtcbiAgICAgICAgdmFyIHBvcyA9IHN0YWdlLnNwYXduUG9pbnRzW2ldO1xuICAgICAgICBuZXdQbGF5ZXIucG9zaXRpb24ueCA9IHBvcy54O1xuICAgICAgICBuZXdQbGF5ZXIucG9zaXRpb24ueSA9IHBvcy55O1xuICAgICAgfTtcblxuICAgICAgLy9wbGF5ZXJzLmZvckVhY2goYWRkUGxheWVyKTtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxzZXR0aW5ncy5wbGF5ZXJDb3VudC5zZWxlY3RlZDsgaSsrKSB7XG4gICAgICAgIGFkZFBsYXllcihwbGF5ZXJzW2ldLCBpKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5mb3JlZ3JvdW5kID0gc3RhZ2VCdWlsZGVyLmJ1aWxkRm9yZWdyb3VuZCgpO1xuICAgICAgc2VsZi5zdWJVaS5hZGQoc2VsZi5mb3JlZ3JvdW5kKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBcbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllcnMsIHRoaXMucGxhdGZvcm1zLCBmdW5jdGlvbiBoYW5kbGVQbGF0Zm9ybUNvbGxpc2lvbihwbGF5ZXIsIHBsYXRmb3JtKSB7XG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmIHBsYXllci5pc0ZhbGxpbmcpIHtcbiAgICAgICAgICBwbGF5ZXIuaXNGYWxsaW5nID0gZmFsc2U7XG4gICAgICAgICAgLy8ga2ljayB1cCBkdXN0XG4gICAgICAgICAgdmFyIGR1c3QgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2xhbmQnKTtcbiAgICAgICAgICBkdXN0LnBvc2l0aW9uLnggPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi54IC0gNDtcbiAgICAgICAgICBkdXN0LnBvc2l0aW9uLnkgPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi55ICsgcGxheWVyLmJvZHkuaGVpZ2h0IC0gMjtcblxuICAgICAgICAgIHZhciBhbmltID0gZHVzdC5hbmltYXRpb25zLmFkZCgnZHVzdCcpO1xuICAgICAgICAgIGR1c3QuYW5pbWF0aW9ucy5wbGF5KCdkdXN0JywgMzIvMyk7XG4gICAgICAgICAgYW5pbS5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGR1c3Qua2lsbCgpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVE9ETzogaG93IGRvIGkgZG8gdGhpcyBvbiB0aGUgcGxheWVyIGl0c2VsZiB3aXRob3V0IGFjY2VzcyB0byBwbGF5ZXJzPyBvciBzaG91bGQgaSBhZGQgYSBmdG4gdG8gcGxheWVyIGFuZCBzZXQgdGhhdCBhcyB0aGUgY2I/XG4gICAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5wbGF5ZXJzLCB0aGlzLnBsYXllcnMsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckNvbGxpc2lvbihwbGF5ZXJBLCBwbGF5ZXJCKSB7XG4gICAgICAgICAvKiBsZXQncyBub3Qga25vY2sgYW55Ym9keSBhcm91bmQgaWYgc29tZXRoaW5nJ3Mgb24gb25lIG9mIHRoZXNlIGR1ZGVzJy9kdWRldHRlcycgaGVhZHMuXG4gICAgICAgICBwcmV2ZW50cyBjYW5ub25iYWxsIGF0dGFja3MgYW5kIHRoZSBsaWtlLCBhbmQgYWxsb3dzIHN0YW5kaW5nIG9uIGhlYWRzLlxuICAgICAgICAgbm90ZTogc3RpbGwgbmVlZCB0byBjb2xsaWRlIGluIG9yZGVyIHRvIHRlc3QgdG91Y2hpbmcudXAsIHNvIGRvbid0IG1vdmUgdGhpcyB0byBhbGxvd1BsYXllckNvbGxpc2lvbiEgKi9cbiAgICAgICAgaWYgKHBsYXllckEuYm9keS50b3VjaGluZy51cCB8fCBwbGF5ZXJCLmJvZHkudG91Y2hpbmcudXApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyKSB7XG4gICAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYm91bmNlKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LmJvdW5jZSgpO1xuXG4gICAgICAgICAgdmFyIGJvdW5jZVZlbG9jaXR5ID0gNTA7XG4gICAgICAgICAgdmFyIHZlbG9jaXR5QSwgdmVsb2NpdHlCO1xuICAgICAgICAgIHZlbG9jaXR5QSA9IHZlbG9jaXR5QiA9IGJvdW5jZVZlbG9jaXR5O1xuICAgICAgICAgIGlmIChwbGF5ZXJBLnBvc2l0aW9uLnggPiBwbGF5ZXJCLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5QiAqPSAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmVsb2NpdHlBICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QTtcbiAgICAgICAgICBwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QjtcbiAgICAgICAgICBwbGF5ZXJBLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgIHBsYXllckIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmbGluZygpIHtcbiAgICAgICAgICBnYW1lLnNmeC5ib3VuY2UoKTtcblxuICAgICAgICAgIHZhciBwbGF5ZXJUb0ZsaW5nO1xuICAgICAgICAgIHZhciBwbGF5ZXJUb0xlYXZlO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLmlzRHVja2luZykge1xuICAgICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckI7XG4gICAgICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckE7XG4gICAgICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvRmxpbmcpO1xuICAgICAgICAgIHZhciBmbGluZ1hWZWxvY2l0eSA9IDc1O1xuICAgICAgICAgIGlmIChwbGF5ZXJUb0ZsaW5nLnBvc2l0aW9uLnggPiBwbGF5ZXJUb0xlYXZlLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICAgIGZsaW5nWFZlbG9jaXR5ICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueCA9IGZsaW5nWFZlbG9jaXR5O1xuICAgICAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS55ID0gLTc1O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcG9wKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LmJvdW5jZSgpO1xuXG4gICAgICAgICAgdmFyIHBsYXllclRvUG9wO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLmlzUm9sbGluZykge1xuICAgICAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJCO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXJUb1BvcCk7XG4gICAgICAgICAgcGxheWVyVG9Qb3AuYm9keS52ZWxvY2l0eS55ID0gLTc1O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJvdGhSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgJiYgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgICAgIHZhciBib3RoU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgJiYgIXBsYXllckIuaXNEdWNraW5nO1xuICAgICAgICB2YXIgbmVpdGhlclJvbGxpbmcgPSAhcGxheWVyQS5pc1JvbGxpbmcgJiYgIXBsYXllckIuaXNSb2xsaW5nO1xuICAgICAgICB2YXIgZWl0aGVyRHVja2luZyA9IHBsYXllckEuaXNEdWNraW5nIHx8IHBsYXllckIuaXNEdWNraW5nO1xuICAgICAgICB2YXIgZWl0aGVyUnVubmluZyA9IE1hdGguYWJzKHBsYXllckEuYm9keS52ZWxvY2l0eS54KSA+IDI4IHx8IE1hdGguYWJzKHBsYXllckIuYm9keS52ZWxvY2l0eS54KSA+PSAyODtcbiAgICAgICAgdmFyIGVpdGhlclJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyB8fCBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICAgICAgdmFyIGVpdGhlclN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nIHx8ICFwbGF5ZXJCLmlzRHVja2luZztcblxuICAgICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgICBjYXNlIGJvdGhSb2xsaW5nIHx8IGJvdGhTdGFuZGluZzpcbiAgICAgICAgICAgIGJvdW5jZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBuZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJSdW5uaW5nICYmIGVpdGhlckR1Y2tpbmc6XG4gICAgICAgICAgICBmbGluZygpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBlaXRoZXJSb2xsaW5nICYmIGVpdGhlclN0YW5kaW5nOlxuICAgICAgICAgICAgcG9wKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIG9mIHRoZSB0b3VjaGluZyBwbGF5ZXJzIGlzIGF0dGFja2luZy4uLlxuICAgICAgICBpZiAocGxheWVyQS5pc0F0dGFja2luZyAhPT0gcGxheWVyQi5pc0F0dGFja2luZykge1xuICAgICAgICAgIHZhciB2aWN0aW0gPSBwbGF5ZXJBLmlzQXR0YWNraW5nID8gcGxheWVyQiA6IHBsYXllckE7XG4gICAgICAgICAgaWYgKHBsYXllckEub3JpZW50YXRpb24gIT09IHBsYXllckIub3JpZW50YXRpb24pIHtcbiAgICAgICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMik7IC8vIGF0dGFja2VkIGZyb20gYmVoaW5kIGZvciBkb3VibGUgZGFtYWdlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH0sIGZ1bmN0aW9uIGFsbG93UGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAgICAgLy8gZG9uJ3QgYWxsb3cgY29sbGlzaW9uIGlmIGVpdGhlciBwbGF5ZXIgaXNuJ3QgY29sbGlkYWJsZS5cbiAgICAgICAgLy8gYWxzbyBkaXNhbGxvdyBpZiBwbGF5ZXIgaXMgaW4gbGltYm8gYmVsb3cgdGhlIHNjcmVlbiA6XVxuICAgICAgICBpZiAoIXBsYXllckEuaXNDb2xsaWRhYmxlIHx8ICFwbGF5ZXJCLmlzQ29sbGlkYWJsZSB8fCBwbGF5ZXJBLnBvc2l0aW9uLnkgPiBnYW1lLmhlaWdodCB8fCBwbGF5ZXJCLnBvc2l0aW9uLnkgPiBnYW1lLmhlaWdodCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBwbGF5O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5O1xuIiwidmFyIFNwbGFzaCA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHNwbGFzaCA9IHtcbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5iZ20ucGxheSgndGl0bGUueG0nKTtcbiAgICAgIGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnaGFuZ2FyJyk7XG4gICAgICB2YXIgdGl0bGUgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3RpdGxlJyk7XG4gICAgICB0aXRsZS5hbmltYXRpb25zLmFkZCgndGl0bGUnKTtcbiAgICAgIHRpdGxlLmFuaW1hdGlvbnMucGxheSgndGl0bGUnLCAzMi8zLCB0cnVlKTtcblxuICAgICAgdmFyIHN0YXJ0R2FtZSA9IGZ1bmN0aW9uIHN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKGdhbWUuc3RhdGUuY3VycmVudCA9PT0gJ3NwbGFzaCcpIHtcbiAgICAgICAgICBnYW1lLmJnbS5wbGF5KCdOb25lJyk7XG4gICAgICAgICAgZ2FtZS5zdGF0ZS5zdGFydCgncGxheScpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBzdGFydCBnYW1lIHdoZW4gc3RhcnQvZW50ZXIgaXMgcHJlc3NlZFxuICAgICAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkT25jZShzdGFydEdhbWUpO1xuICAgICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5zdXBwb3J0ZWQgJiYgZ2FtZS5pbnB1dC5nYW1lcGFkLmFjdGl2ZSAmJiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5jb25uZWN0ZWQpIHtcbiAgICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGRPbmNlKHN0YXJ0R2FtZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHNwbGFzaDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3BsYXNoO1xuIiwidmFyIHV0aWxzID0ge1xuICAvLyBmcm9tIHVuZGVyc2NvcmVcbiAgZGVib3VuY2U6IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuXHR2YXIgdGltZW91dDtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0aWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0fTtcblx0XHR2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcblx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9O1xuICB9LFxuXG4gIGNlbnRlcjogZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgZW50aXR5LmFuY2hvci5zZXRUbygwLjUpO1xuICB9LFxuXG4gIC8vIFRPRE86IGNvbnNpZGVyIGluamVjdGluZyBkZXBlbmRlbmNpZXNcbiAgZ2V0U3RhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFnZXMgPSByZXF1aXJlKCcuL2RhdGEvc3RhZ2VzJyk7XG4gICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzJyk7XG4gICAgdmFyIHN0YWdlID0gc3RhZ2VzLmZpbHRlcihmdW5jdGlvbihzdGFnZSkge1xuICAgICAgcmV0dXJuIHN0YWdlLm5hbWUgPT09IHNldHRpbmdzLnN0YWdlLnNlbGVjdGVkO1xuICAgIH0pWzBdO1xuICAgIHJldHVybiBzdGFnZTtcbiAgfSxcblxuICBnZXRSYW5kb21BcnJheUVsZW1lbnQ6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIGFycmF5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFycmF5Lmxlbmd0aCldO1xuICB9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlscztcbiJdfQ==
