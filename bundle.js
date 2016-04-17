(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var stages = require('./stages');

var settings = {
  playerCount: {
    options: [2, 3, 4],
    selected: 4,
  },
  bgm: {
    options: ['forest', 'hangar', 'tomb', 'None'],
    selected: 'forest',
  },
  stage: {
    options: stages.map(function(stage) {
      return stage.name;
    }),
    selected: 'Forest',
  }
};

module.exports = settings;

},{"./stages":3}],3:[function(require,module,exports){
var stages = [{
  "name": "Waterfall",
  "theme": "forest",
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
    "color": "white"
  },
  "backgrounds": [{
    "image": "waterfall",
  },
  {
    "image": "waterfallAnim",
    "animated": true,
  }],
  "foregrounds": [{
    "image": "waterfallFg",
    "animated": true,
    "animSpeed": 32/16,
    "scrolling": true,
    "pulse": true,
    "minAlpha": 0.95
  }],
  "spawnPoints": [
    { "x": 14, "y": 0 },
    { "x": 48, "y": 0 },
    { "x": 14, "y": 18 },
    { "x": 48, "y": 18 }
  ],
  "uiColor": "#28F129"
},{
  "name": "Forest",
  "theme": "forest",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [27, 6],
      [10, 13],
      [44, 13],
      [5, 22],
      [49, 22],
      [18, 31],
      [27, 31],
      [36, 31],
      [5, 44],
      [49, 44],
      [27, 60]
    ],
    "color": "white"
  },
  "backgrounds": [{
    "image": "forest"
  }, {
    "image": "forestBg1",
    "pulse": true,
    "pulseDuration": 4000,
  }, {
    "image": "forestBg2",
    "pulse": true,
    "pulseDelay": 3000,
    "pulseDuration": 5000,
  }],
  "foregrounds": [],
  "spawnPoints": [
    { "x": 14, "y": 6 },
    { "x": 48, "y": 6 },
    { "x": 9, "y": 15 },
    { "x": 54, "y": 15 }
  ],
  "uiColor": "#28D6F1"
},{
  "name": "Hangar",
  "theme": "hangar",
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
    "color": "white"
  },
  "backgrounds": [{
    image: "hangar"
  }],
  "foregrounds": [{
    "image": "clear",
  }],
  "spawnPoints": [
    { "x": 10, "y": 27 },
    { "x": 19, "y": 27 },
    { "x": 41, "y": 27 },
    { "x": 50, "y": 27 }
  ],
  "uiColor": "#8D8D8D"
},{
  "name": "Tomb",
  "theme": "tomb",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [10, 13],
      [44, 13],
      [27, 21],
      [10, 31],
      [44, 31]
    ],
    "color": "white"
  },
  "backgrounds": [{
    image: 'tomb'
  }],
  "foregrounds": [{
    "image": "clear"
  }],
  "spawnPoints": [
    { "x": 14, "y": 6 },
    { "x": 48, "y": 6 },
    { "x": 14, "y": 24 },
    { "x": 48, "y": 24 }
  ],
  "uiColor": "#783E08"
}];

module.exports = stages;

},{}],4:[function(require,module,exports){
var resize = function resize() {
  document.body.style.zoom = window.innerHeight / game.height;
};

var main = {
  preload: function preload() {
    var utils = require('./utils');

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
    game.state.add('loading', require('./states/loading')(game));
    game.state.start('loading');
  }
};

var game = new Phaser.Game(64, 64, Phaser.AUTO, 'game', {
  preload: main.preload,
  create: main.create
}, false, false); // disable anti-aliasing

game.state.add('main', main);
game.state.start('main');

},{"./states/loading":10,"./utils":13}],5:[function(require,module,exports){
var buildMenu = function buildMenu(game, state) {
  var settings = require('./data/settings');

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
      game.bgm.play(settings.bgm.selected);
    },
  }, {
    name: 'Stage',
    setting: settings.stage,
    action: function() {
      cycleSetting.call(this);

      // if stage has a default bgm, load it
      var stages = require('./data/stages');
      var selectedStage = stages[settings.stage.options.indexOf(settings.stage.selected)];
      if (selectedStage.theme) {
        settings.bgm.selected = selectedStage.theme;
      }
      game.bgm.play(settings.bgm.selected);

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

},{"./data/settings":2,"./data/stages":3}],6:[function(require,module,exports){
var bgm = function() {
  var player = new ChiptuneJsPlayer(new ChiptuneJsConfig(-1));

  return {
    play: function(fileName) {
      if (fileName === 'None') {
        player.stop.call(player);
      } else {
        player.load('./music/' + fileName + '.xm', function(buffer) {
          player.play(buffer);
        });
      }
    }
  };
};

module.exports = bgm;

},{}],7:[function(require,module,exports){
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

      game.sfx.play('attack');

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
      if (player.alive && player.isAttacking) {
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

      var dust;

      if (player.body.touching.down) {
        player.body.velocity.y = -100;
        game.sfx.play('jump');
        dust = game.add.sprite(0, 0, 'jump');
        dust.position.x = player.body.position.x - 4;
        dust.position.y = player.body.position.y + player.body.height - 2;
      // wall jumps
      } else if (player.body.touching.left) {
        player.body.velocity.y = -120;
        player.body.velocity.x = 45;
        game.sfx.play('jump');
        dust = game.add.sprite(0, 0, 'land');
        dust.position.x = player.body.position.x + 2;
        dust.position.y = player.body.position.y - player.body.height;
        dust.angle = 90;
      } else if (player.body.touching.right) {
        player.body.velocity.y = -120;
        player.body.velocity.x = -45;
        game.sfx.play('jump');
        dust = game.add.sprite(0, 0, 'land');
        dust.position.x = player.body.position.x;
        dust.position.y = player.body.position.y + player.body.height;
        dust.angle = -90;
      }

      game.subUi.fx.add(dust); // mount below foreground & ui
      var anim = dust.animations.add('dust');
      dust.animations.play('dust', 32/3);
      anim.onComplete.add(function() {
        dust.kill();
      }, this);
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
        player.scarf.animation = player.scarf.animations.play('disintegrate', 32/3, false);
      } else {
        player.scarf.animation = player.scarf.animations.play('flap', 32/3, true);
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
        actions.applyInvulnerability();

        game.sfx.play('die');
        actions.endAttack();
        player.lastAttacked = 0;

        var utils = require('./utils');
        var respawnPosition = utils.getRandomArrayElement(utils.getStage().spawnPoints);
        player.position.x = respawnPosition.x;
        player.position.y = respawnPosition.y;
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
      } else {
        game.sfx.play('permadie');
        player.alpha = 0.5;
        player.isPermadead = true;
        onDeath(); // TODO: this could probably be better architected
      }
    },

    applyInvulnerability: function() {
      player.isCollidable = false;

      var setColor = function(color) {
        // in case game restarts and player no longer exists...
        if (!player.alive) {
          clearInterval(colorInterval);
          clearInterval(whiteInterval);
          return;
        }
        player.loadTexture(color);
      };

      var colorInterval = setInterval(function() {
        setColor(settings.color);
      }, 150);
      var whiteInterval;
      setTimeout(function() {
        whiteInterval = setInterval(function() {
          setColor('white');
        }, 150);
      }, 75);

      setTimeout(function() {
        if (!player.alive) {
          return;
        }
        clearInterval(whiteInterval);
        clearInterval(colorInterval);
        setColor(settings.color); // ensure player color returns to normal
        player.isCollidable = true;
      }, 1500);
    },
  };

  var player = game.add.sprite(0, 0, settings.color);
  player.name = settings.name;
  player.orientation = settings.orientation;
  player.anchor.setTo(0.5, 0.5); // anchor to center to allow flipping

  player.scarf = game.add.sprite(-1, -1, settings.color + 'Scarf');
  player.scarf.animations.add('flap', [0, 1, 2, 3, 4, 5]);
  player.scarf.animations.add('disintegrate', [7, 8, 9, 10, 11, 6]);
  player.scarf.animation = player.scarf.animations.play('flap', 32/3, true);
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

    player.scarf.animation.speed = Math.abs(player.body.velocity.x) * 0.75 + 32/3;

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

},{"./utils":13}],8:[function(require,module,exports){
/**
 * Each time a unique sound filename is passed in, a new instance of chiptune.js will be created with that sound as a buffer.
 * If the play method is called on sound file passed in previously, its respective instance will play the existing buffer.
 * This ensures the file system is only hit once per sound, as needed.
 * It will also prevent sounds from 'stacking' -- the same sound played repeatedly will interrupt itself each time.
 */
var sfx = function() {
  var soundbank = {};

  return {
    play: function(fileName) {
      if (soundbank[fileName]) {
        soundbank[fileName].play(soundbank[fileName].buffer);
      } else {
        soundbank[fileName] = new ChiptuneJsPlayer(new ChiptuneJsConfig(0));
        soundbank[fileName].load('./sfx/' + fileName + '.xm', function(buffer) {
          soundbank[fileName].buffer = buffer;
          soundbank[fileName].play(buffer);
        });
      }
    }
  };
};

module.exports = sfx;

},{}],9:[function(require,module,exports){
var stageBuilder = function stageBuilder(game) {
  var settings = require('./data/settings');
  var utils = require('./utils');
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

  var buildLayer = function buildLayer(sublayers) {
    return function() {
      var layer = game.add.group();

      sublayers.forEach(function(sublayer) {
        var bg;

        if (sublayer.scrolling) {
          bg = game.add.tileSprite(0, 0, game.width, game.height, sublayer.image);
          layer.loop = game.time.events.loop(Phaser.Timer.QUARTER, function() {
            bg.tilePosition.x -=1;
          }, this);
        } else {
          bg = game.add.sprite(0, 0, sublayer.image);
        }

        if (sublayer.animated) {
          bg.animations.add('bg');
          bg.animations.play('bg', sublayer.animSpeed || 32/3, true);
        }

        if (sublayer.pulse) {
          var repeat = -1;
          var autostart = true;
          var yoyo = true;
          var duration = sublayer.pulseDuration || 2000;
          var delay = sublayer.pulseDelay || 0;
          var minAlpha = sublayer.minAlpha || 0;
          game.add.tween(bg).to({ alpha: minAlpha }, duration, Phaser.Easing.Linear.None, autostart, delay, repeat, yoyo);
        }

        bg.alpha = sublayer.alpha || 1;

        layer.add(bg);
      });

      return layer;
    };
  };
  
  return {
    buildPlatforms: buildPlatforms,
    buildForegrounds: buildLayer(stage.foregrounds),
    buildBackgrounds: buildLayer(stage.backgrounds),
  };
};

module.exports = stageBuilder;

},{"./data/settings":2,"./utils":13}],10:[function(require,module,exports){
var Loading = function(game) {
  var loading = {
    init: function() {
      game.add.sprite(0, 0, 'loading');
      document.getElementById('loading').style.display = 'none';
    },

    preload: function() {
      // images
      game.load.spritesheet('title', 'images/sprites/ui-title.gif', 64, 64);
      game.load.spritesheet('victoryMsg', 'images/sprites/ui-winner.gif', 52, 22);
      game.load.spritesheet('blueScarf', 'images/sprites/bit-scarf-blue.gif', 5, 2);
      game.load.spritesheet('pinkScarf', 'images/sprites/bit-scarf-pink.gif', 5, 2);
      game.load.spritesheet('greenScarf', 'images/sprites/bit-scarf-green.gif', 5, 2);
      game.load.spritesheet('purpleScarf', 'images/sprites/bit-scarf-purple.gif', 5, 2);
      game.load.spritesheet('jump', 'images/sprites/bit-jump.gif', 10, 2);
      game.load.spritesheet('land', 'images/sprites/bit-land.gif', 10, 2);
      // colors
      game.load.image('clear', 'images/colors/clear.gif');
      game.load.image('white', 'images/colors/white.gif');
      game.load.image('blue', 'images/colors/blue.gif');
      game.load.image('pink', 'images/colors/pink.gif');
      game.load.image('green', 'images/colors/green.gif');
      game.load.image('purple', 'images/colors/purple.gif');
      // arenas
      game.load.image('forest', 'images/arenas/forest-summer.gif');
      game.load.image('forestBg1', 'images/arenas/forest-bg1.gif');
      game.load.image('forestBg2', 'images/arenas/forest-bg2.gif');
      game.load.image('tomb', 'images/arenas/tomb-warm.gif');
      game.load.image('waterfall', 'images/arenas/waterfall.gif');
      game.load.spritesheet('waterfallAnim', 'images/arenas/waterfall-anim.gif', 64, 64);
      game.load.spritesheet('waterfallFg', 'images/arenas/waterfall-fg-anim.gif', 64, 64);
      game.load.image('hangar', 'images/arenas/level-hangar-wip.gif');

      // sound
      game.bgm = require('../music')();
      game.sfx = require('../sfx')();
    },

    create: function() {
      game.input.gamepad.start();

      game.state.add('splash', require('./splash')(game));
      game.state.add('play', require('./play')(game));
      game.state.start('splash');
    }
  };
  
  return loading;
};

module.exports = Loading;

},{"../music":6,"../sfx":8,"./play":11,"./splash":12}],11:[function(require,module,exports){
var Play = function(game) {
  var play = {
    create: function create() {
      var self = this;

      game.subUi = game.add.group(); // place to keep anything on-screen that's not UI to depth sort below UI

      // game over victory message declaring the winner
      self.victoryMsg = game.add.sprite(6, 21, 'victoryMsg');
      self.victoryMsg.visible = false;
      self.victoryMsg.animations.add('Blue', [0, 4, 8, 12], 32/3, true);
      self.victoryMsg.animations.add('Pink', [1, 5, 9, 13], 32/3, true);
      self.victoryMsg.animations.add('Green', [2, 6, 10, 14], 32/3, true);
      self.victoryMsg.animations.add('Purple', [3, 7, 11, 15], 32/3, true);

      self.timeouts = []; // store game timeouts to cancel if game restarts

      // menu
      var buildMenu = require('../menu');
      buildMenu(game, self); // TODO: is there a better approach than injecting the whole state into the menu to let it access functions for resetting stage, players, music?

      self.restart();
      game.physics.startSystem(Phaser.Physics.ARCADE);
      game.input.gamepad.start();

      var settings = require('../data/settings')
      game.bgm.play(settings.bgm.selected);
    },

    restart: function restart() {
      var self = this;
      var players = require('../data/players')(game);
      var settings = require('../data/settings');
      var utils = require('../utils');
      var stageBuilder = require('../stageBuilder')(game);
      var stage = utils.getStage();

      // cancel any timeouts from the last game
      self.timeouts.forEach(function(timeout) {
        clearTimeout(timeout);
      });

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
      destroyGroup(self.foregrounds);

      // TODO: ugh, clean this up!
      if (self.backgrounds && self.backgrounds.loop) {
        game.time.events.remove(self.backgrounds.loop);
      }
      if (self.foregrounds && self.foregrounds.loop) {
        game.time.events.remove(self.foregrounds.loop);
      }

      self.platforms = stageBuilder.buildPlatforms();
      self.backgrounds = stageBuilder.buildBackgrounds();
      game.subUi.add(self.platforms);
      game.subUi.add(self.backgrounds);

      self.players = game.add.group();
      game.subUi.add(self.players);

      game.subUi.fx = game.add.group();
      game.subUi.add(game.subUi.fx);

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
            game.sfx.play('victory');
            setTimeout(function() {
              self.victoryMsg.visible = false;
            }, 3000);
            self.timeouts.push(setTimeout(function() {
              self.restart();
            }, 3000));
          }
        };
        var createPlayer = require('../player');
        var newPlayer = self.players.add(createPlayer(game, player, checkForGameOver));
        var pos = stage.spawnPoints[i];
        newPlayer.position.x = pos.x;
        newPlayer.position.y = pos.y;
      };

      //players.forEach(addPlayer);
      for (var i=0; i<settings.playerCount.selected; i++) {
        addPlayer(players[i], i);
      }

      self.foregrounds = stageBuilder.buildForegrounds();
      game.subUi.add(self.foregrounds);

      game.sfx.play('roundStart');
    },

    update: function update() {
      var self = this;
      
      game.physics.arcade.collide(this.players, this.platforms, function handlePlatformCollision(player, platform) {
        if (player.body.touching.down && player.isFalling) {
          player.isFalling = false;
          // kick up dust
          var dust = game.add.sprite(0, 0, 'land');
          game.subUi.fx.add(dust);
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
          self.timeouts.push(setTimeout(function() {
            player.isCollidable = true;
          }, 100));
        }

        function bounce() {
          game.sfx.play('bounce');;

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
          game.sfx.play('bounce');

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
          game.sfx.play('bounce');

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

},{"../data/players":1,"../data/settings":2,"../menu":5,"../player":7,"../stageBuilder":9,"../utils":13}],12:[function(require,module,exports){
var Splash = function(game) {
  var splash = {
    create: function() {
      game.bgm.play('title');
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

},{}],13:[function(require,module,exports){
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

},{"./data/settings":2,"./data/stages":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic2NyaXB0cy9kYXRhL3BsYXllcnMuanMiLCJzY3JpcHRzL2RhdGEvc2V0dGluZ3MuanMiLCJzY3JpcHRzL2RhdGEvc3RhZ2VzLmpzIiwic2NyaXB0cy9tYWluLmpzIiwic2NyaXB0cy9tZW51LmpzIiwic2NyaXB0cy9tdXNpYy5qcyIsInNjcmlwdHMvcGxheWVyLmpzIiwic2NyaXB0cy9zZnguanMiLCJzY3JpcHRzL3N0YWdlQnVpbGRlci5qcyIsInNjcmlwdHMvc3RhdGVzL2xvYWRpbmcuanMiLCJzY3JpcHRzL3N0YXRlcy9wbGF5LmpzIiwic2NyaXB0cy9zdGF0ZXMvc3BsYXNoLmpzIiwic2NyaXB0cy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFBsYXllcnMgPSBmdW5jdGlvbihnYW1lKSB7XG4gICAgdmFyIHBsYXllcnMgPSBbe1xuICAgICAgbmFtZTogJ0JsdWUnLFxuICAgICAgY29sb3I6ICdibHVlJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLFxuICAgICAga2V5czoge1xuICAgICAgICB1cDogJ1cnLCBkb3duOiAnUycsIGxlZnQ6ICdBJywgcmlnaHQ6ICdEJywgYXR0YWNrOiAnUSdcbiAgICAgIH0sXG4gICAgfSwge1xuICAgICAgbmFtZTogJ1BpbmsnLFxuICAgICAgY29sb3I6ICdwaW5rJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLFxuICAgICAgb3JpZW50YXRpb246ICdsZWZ0JyxcbiAgICB9LCB7XG4gICAgICBuYW1lOiAnR3JlZW4nLFxuICAgICAgY29sb3I6ICdncmVlbicsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMyxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdJJywgZG93bjogJ0snLCBsZWZ0OiAnSicsIHJpZ2h0OiAnTCcsIGF0dGFjazogJ1UnXG4gICAgICB9LFxuICAgIH0sIHtcbiAgICAgIG5hbWU6ICdQdXJwbGUnLFxuICAgICAgY29sb3I6ICdwdXJwbGUnLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDQsXG4gICAgICBvcmllbnRhdGlvbjogJ2xlZnQnLFxuICAgICAga2V5czoge1xuICAgICAgICB1cDogJ1QnLCBkb3duOiAnRycsIGxlZnQ6ICdGJywgcmlnaHQ6ICdIJywgYXR0YWNrOiAnUidcbiAgICAgIH0sXG4gIH1dO1xuICBcbiAgcmV0dXJuIHBsYXllcnM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllcnM7XG4iLCJ2YXIgc3RhZ2VzID0gcmVxdWlyZSgnLi9zdGFnZXMnKTtcblxudmFyIHNldHRpbmdzID0ge1xuICBwbGF5ZXJDb3VudDoge1xuICAgIG9wdGlvbnM6IFsyLCAzLCA0XSxcbiAgICBzZWxlY3RlZDogNCxcbiAgfSxcbiAgYmdtOiB7XG4gICAgb3B0aW9uczogWydmb3Jlc3QnLCAnaGFuZ2FyJywgJ3RvbWInLCAnTm9uZSddLFxuICAgIHNlbGVjdGVkOiAnZm9yZXN0JyxcbiAgfSxcbiAgc3RhZ2U6IHtcbiAgICBvcHRpb25zOiBzdGFnZXMubWFwKGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICByZXR1cm4gc3RhZ2UubmFtZTtcbiAgICB9KSxcbiAgICBzZWxlY3RlZDogJ0ZvcmVzdCcsXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dGluZ3M7XG4iLCJ2YXIgc3RhZ2VzID0gW3tcbiAgXCJuYW1lXCI6IFwiV2F0ZXJmYWxsXCIsXG4gIFwidGhlbWVcIjogXCJmb3Jlc3RcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbMTAsIDddLFxuICAgICAgWzQ1LCA3XSxcbiAgICAgIFsyNywgMTVdLFxuICAgICAgWzEwLCAyNV0sXG4gICAgICBbNDUsIDI1XSxcbiAgICAgIFsxMCwgNDRdLFxuICAgICAgWzQ1LCA0NF0sXG4gICAgICBbMjcsIDUyXSxcbiAgICAgIFsxMCwgNjJdLFxuICAgICAgWzQ1LCA2Ml1cbiAgICBdLFxuICAgIFwiY29sb3JcIjogXCJ3aGl0ZVwiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW3tcbiAgICBcImltYWdlXCI6IFwid2F0ZXJmYWxsXCIsXG4gIH0sXG4gIHtcbiAgICBcImltYWdlXCI6IFwid2F0ZXJmYWxsQW5pbVwiLFxuICAgIFwiYW5pbWF0ZWRcIjogdHJ1ZSxcbiAgfV0sXG4gIFwiZm9yZWdyb3VuZHNcIjogW3tcbiAgICBcImltYWdlXCI6IFwid2F0ZXJmYWxsRmdcIixcbiAgICBcImFuaW1hdGVkXCI6IHRydWUsXG4gICAgXCJhbmltU3BlZWRcIjogMzIvMTYsXG4gICAgXCJzY3JvbGxpbmdcIjogdHJ1ZSxcbiAgICBcInB1bHNlXCI6IHRydWUsXG4gICAgXCJtaW5BbHBoYVwiOiAwLjk1XG4gIH1dLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDAgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDAgfSxcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDE4IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiAxOCB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiMyOEYxMjlcIlxufSx7XG4gIFwibmFtZVwiOiBcIkZvcmVzdFwiLFxuICBcInRoZW1lXCI6IFwiZm9yZXN0XCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzI3LCA2XSxcbiAgICAgIFsxMCwgMTNdLFxuICAgICAgWzQ0LCAxM10sXG4gICAgICBbNSwgMjJdLFxuICAgICAgWzQ5LCAyMl0sXG4gICAgICBbMTgsIDMxXSxcbiAgICAgIFsyNywgMzFdLFxuICAgICAgWzM2LCAzMV0sXG4gICAgICBbNSwgNDRdLFxuICAgICAgWzQ5LCA0NF0sXG4gICAgICBbMjcsIDYwXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcIndoaXRlXCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIFwiaW1hZ2VcIjogXCJmb3Jlc3RcIlxuICB9LCB7XG4gICAgXCJpbWFnZVwiOiBcImZvcmVzdEJnMVwiLFxuICAgIFwicHVsc2VcIjogdHJ1ZSxcbiAgICBcInB1bHNlRHVyYXRpb25cIjogNDAwMCxcbiAgfSwge1xuICAgIFwiaW1hZ2VcIjogXCJmb3Jlc3RCZzJcIixcbiAgICBcInB1bHNlXCI6IHRydWUsXG4gICAgXCJwdWxzZURlbGF5XCI6IDMwMDAsXG4gICAgXCJwdWxzZUR1cmF0aW9uXCI6IDUwMDAsXG4gIH1dLFxuICBcImZvcmVncm91bmRzXCI6IFtdLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA5LCBcInlcIjogMTUgfSxcbiAgICB7IFwieFwiOiA1NCwgXCJ5XCI6IDE1IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzI4RDZGMVwiXG59LHtcbiAgXCJuYW1lXCI6IFwiSGFuZ2FyXCIsXG4gIFwidGhlbWVcIjogXCJoYW5nYXJcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbOCwgMzRdLFxuICAgICAgWzEyLCAzNF0sXG4gICAgICBbMjIsIDM0XSxcbiAgICAgIFszMSwgMzRdLFxuICAgICAgWzQxLCAzNF0sXG4gICAgICBbNDYsIDM0XSxcbiAgICBdLFxuICAgIFwiY29sb3JcIjogXCJ3aGl0ZVwiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW3tcbiAgICBpbWFnZTogXCJoYW5nYXJcIlxuICB9XSxcbiAgXCJmb3JlZ3JvdW5kc1wiOiBbe1xuICAgIFwiaW1hZ2VcIjogXCJjbGVhclwiLFxuICB9XSxcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTAsIFwieVwiOiAyNyB9LFxuICAgIHsgXCJ4XCI6IDE5LCBcInlcIjogMjcgfSxcbiAgICB7IFwieFwiOiA0MSwgXCJ5XCI6IDI3IH0sXG4gICAgeyBcInhcIjogNTAsIFwieVwiOiAyNyB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiM4RDhEOERcIlxufSx7XG4gIFwibmFtZVwiOiBcIlRvbWJcIixcbiAgXCJ0aGVtZVwiOiBcInRvbWJcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbMTAsIDEzXSxcbiAgICAgIFs0NCwgMTNdLFxuICAgICAgWzI3LCAyMV0sXG4gICAgICBbMTAsIDMxXSxcbiAgICAgIFs0NCwgMzFdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwid2hpdGVcIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFt7XG4gICAgaW1hZ2U6ICd0b21iJ1xuICB9XSxcbiAgXCJmb3JlZ3JvdW5kc1wiOiBbe1xuICAgIFwiaW1hZ2VcIjogXCJjbGVhclwiXG4gIH1dLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDI0IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiAyNCB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiM3ODNFMDhcIlxufV07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VzO1xuIiwidmFyIHJlc2l6ZSA9IGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS56b29tID0gd2luZG93LmlubmVySGVpZ2h0IC8gZ2FtZS5oZWlnaHQ7XG59O1xuXG52YXIgbWFpbiA9IHtcbiAgcHJlbG9hZDogZnVuY3Rpb24gcHJlbG9hZCgpIHtcbiAgICB2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbiAgICByZXNpemUoKTtcbiAgICB3aW5kb3cub25yZXNpemUgPSB1dGlscy5kZWJvdW5jZShyZXNpemUsIDEwMCk7XG4gICAgXG4gICAgLy8gYWxsb3cgYW55dGhpbmcgdXAgdG8gaGVpZ2h0IG9mIHdvcmxkIHRvIGZhbGwgb2ZmLXNjcmVlbiB1cCBvciBkb3duXG4gICAgZ2FtZS53b3JsZC5zZXRCb3VuZHMoMCwgLWdhbWUud2lkdGgsIGdhbWUud2lkdGgsIGdhbWUuaGVpZ2h0ICogMyk7XG4gICAgXG4gICAgLy8gcHJldmVudCBnYW1lIHBhdXNpbmcgd2hlbiBpdCBsb3NlcyBmb2N1c1xuICAgIGdhbWUuc3RhZ2UuZGlzYWJsZVZpc2liaWxpdHlDaGFuZ2UgPSB0cnVlO1xuICAgIFxuICAgIC8vIGFzc2V0cyB1c2VkIGluIGxvYWRpbmcgc2NyZWVuXG4gICAgZ2FtZS5sb2FkLmltYWdlKCdsb2FkaW5nJywgJ2ltYWdlcy9sb2FkaW5nLmdpZicpO1xuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgIGdhbWUuc3RhdGUuYWRkKCdsb2FkaW5nJywgcmVxdWlyZSgnLi9zdGF0ZXMvbG9hZGluZycpKGdhbWUpKTtcbiAgICBnYW1lLnN0YXRlLnN0YXJ0KCdsb2FkaW5nJyk7XG4gIH1cbn07XG5cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDY0LCA2NCwgUGhhc2VyLkFVVE8sICdnYW1lJywge1xuICBwcmVsb2FkOiBtYWluLnByZWxvYWQsXG4gIGNyZWF0ZTogbWFpbi5jcmVhdGVcbn0sIGZhbHNlLCBmYWxzZSk7IC8vIGRpc2FibGUgYW50aS1hbGlhc2luZ1xuXG5nYW1lLnN0YXRlLmFkZCgnbWFpbicsIG1haW4pO1xuZ2FtZS5zdGF0ZS5zdGFydCgnbWFpbicpO1xuIiwidmFyIGJ1aWxkTWVudSA9IGZ1bmN0aW9uIGJ1aWxkTWVudShnYW1lLCBzdGF0ZSkge1xuICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MnKTtcblxuICB2YXIgY3ljbGVTZXR0aW5nID0gZnVuY3Rpb24gY3ljbGVTZXR0aW5nKCkge1xuICAgIHZhciBvcHRpb25JbmRleCA9IHRoaXMuc2V0dGluZy5vcHRpb25zLmluZGV4T2YodGhpcy5zZXR0aW5nLnNlbGVjdGVkKTtcbiAgICBvcHRpb25JbmRleCsrO1xuICAgIGlmIChvcHRpb25JbmRleCA9PT0gdGhpcy5zZXR0aW5nLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICBvcHRpb25JbmRleCA9IDA7XG4gICAgfVxuICAgIHRoaXMuc2V0dGluZy5zZWxlY3RlZCA9IHRoaXMuc2V0dGluZy5vcHRpb25zW29wdGlvbkluZGV4XTtcbiAgfTtcblxuICB2YXIgbWVudSA9IFt7XG4gICAgbmFtZTogJ1BsYXllcnMnLFxuICAgIHNldHRpbmc6IHNldHRpbmdzLnBsYXllckNvdW50LFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcbiAgICAgIHN0YXRlLnJlc3RhcnQoKTtcbiAgICB9LFxuICAgIHNlbGVjdGVkOiB0cnVlXG4gIH0sIHtcbiAgICBuYW1lOiAnQkdNJyxcbiAgICBzZXR0aW5nOiBzZXR0aW5ncy5iZ20sXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGN5Y2xlU2V0dGluZy5jYWxsKHRoaXMpO1xuICAgICAgZ2FtZS5iZ20ucGxheShzZXR0aW5ncy5iZ20uc2VsZWN0ZWQpO1xuICAgIH0sXG4gIH0sIHtcbiAgICBuYW1lOiAnU3RhZ2UnLFxuICAgIHNldHRpbmc6IHNldHRpbmdzLnN0YWdlLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcblxuICAgICAgLy8gaWYgc3RhZ2UgaGFzIGEgZGVmYXVsdCBiZ20sIGxvYWQgaXRcbiAgICAgIHZhciBzdGFnZXMgPSByZXF1aXJlKCcuL2RhdGEvc3RhZ2VzJyk7XG4gICAgICB2YXIgc2VsZWN0ZWRTdGFnZSA9IHN0YWdlc1tzZXR0aW5ncy5zdGFnZS5vcHRpb25zLmluZGV4T2Yoc2V0dGluZ3Muc3RhZ2Uuc2VsZWN0ZWQpXTtcbiAgICAgIGlmIChzZWxlY3RlZFN0YWdlLnRoZW1lKSB7XG4gICAgICAgIHNldHRpbmdzLmJnbS5zZWxlY3RlZCA9IHNlbGVjdGVkU3RhZ2UudGhlbWU7XG4gICAgICB9XG4gICAgICBnYW1lLmJnbS5wbGF5KHNldHRpbmdzLmJnbS5zZWxlY3RlZCk7XG5cbiAgICAgIHN0YXRlLnJlc3RhcnQoKTtcbiAgICB9LFxuICB9LCB7XG4gICAgbmFtZTogJ1N0YXJ0JyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH1cbiAgfV07XG5cbiAgdmFyIGNoYW5nZVBsYXllckNvdW50ID0gbWVudVswXS5hY3Rpb24uYmluZChtZW51WzBdKTtcbiAgdmFyIGNoYW5nZUJnbSA9IG1lbnVbMV0uYWN0aW9uLmJpbmQobWVudVsxXSk7XG4gIHZhciBjaGFuZ2VTdGFnZSA9IG1lbnVbMl0uYWN0aW9uLmJpbmQobWVudVsyXSk7XG4gIHZhciByZXN0YXJ0ID0gbWVudVszXS5hY3Rpb24uYmluZChtZW51WzNdKTtcblxuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuUCkub25Eb3duLmFkZChjaGFuZ2VQbGF5ZXJDb3VudCk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5NKS5vbkRvd24uYWRkKGNoYW5nZVN0YWdlKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkIpLm9uRG93bi5hZGQoY2hhbmdlQmdtKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnN1cHBvcnRlZCAmJiBnYW1lLmlucHV0LmdhbWVwYWQuYWN0aXZlKSB7XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkMi5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMy5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDQuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1lbnU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1aWxkTWVudTtcbiIsInZhciBiZ20gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBsYXllciA9IG5ldyBDaGlwdHVuZUpzUGxheWVyKG5ldyBDaGlwdHVuZUpzQ29uZmlnKC0xKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBwbGF5OiBmdW5jdGlvbihmaWxlTmFtZSkge1xuICAgICAgaWYgKGZpbGVOYW1lID09PSAnTm9uZScpIHtcbiAgICAgICAgcGxheWVyLnN0b3AuY2FsbChwbGF5ZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyLmxvYWQoJy4vbXVzaWMvJyArIGZpbGVOYW1lICsgJy54bScsIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgIHBsYXllci5wbGF5KGJ1ZmZlcik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYmdtO1xuIiwidmFyIGNyZWF0ZVBsYXllciA9IGZ1bmN0aW9uIGNyZWF0ZVBsYXllcihnYW1lLCBvcHRpb25zLCBvbkRlYXRoKSB7XG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBvcmllbnRhdGlvbjogJ3JpZ2h0JyxcbiAgICBrZXlzOiB7XG4gICAgICB1cDogJ1VQJyxcbiAgICAgIGRvd246ICdET1dOJyxcbiAgICAgIGxlZnQ6ICdMRUZUJyxcbiAgICAgIHJpZ2h0OiAnUklHSFQnLFxuICAgICAgYXR0YWNrOiAnU0hJRlQnXG4gICAgfSxcbiAgICBzY2FsZToge1xuICAgICAgeDogMSxcbiAgICAgIHk6IDJcbiAgICB9LFxuICAgIGNvbG9yOiAncGluaycsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEsXG4gIH07XG5cbiAgdmFyIHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gIHZhciBrZXlzID0ge1xuICAgIHVwOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy51cF0pLFxuICAgIGRvd246IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmRvd25dKSxcbiAgICBsZWZ0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5sZWZ0XSksXG4gICAgcmlnaHQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnJpZ2h0XSksXG4gICAgYXR0YWNrOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5hdHRhY2tdKSxcbiAgfTtcblxuICB2YXIgZ2FtZXBhZCA9IHNldHRpbmdzLmdhbWVwYWQ7XG5cbiAgdmFyIGFjdGlvbnMgPSB7XG4gICAgYXR0YWNrOiBmdW5jdGlvbiBhdHRhY2soKSB7XG4gICAgICB2YXIgZHVyYXRpb24gPSAyMDA7XG4gICAgICB2YXIgaW50ZXJ2YWwgPSA2MDA7XG4gICAgICB2YXIgdmVsb2NpdHkgPSAxMDA7XG5cbiAgICAgIHZhciBjYW5BdHRhY2sgPSAoRGF0ZS5ub3coKSA+IHBsYXllci5sYXN0QXR0YWNrZWQgKyBpbnRlcnZhbCkgJiYgIXBsYXllci5pc0R1Y2tpbmcgJiYgIXBsYXllci5pc1Blcm1hZGVhZDtcbiAgICAgIGlmICghY2FuQXR0YWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmlzQXR0YWNraW5nID0gdHJ1ZTtcbiAgICAgIHBsYXllci5sYXN0QXR0YWNrZWQgPSBEYXRlLm5vdygpO1xuXG4gICAgICBnYW1lLnNmeC5wbGF5KCdhdHRhY2snKTtcblxuICAgICAgc3dpdGNoKHBsYXllci5vcmllbnRhdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLXZlbG9jaXR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIubG9hZFRleHR1cmUoJ3doaXRlJyk7XG4gICAgICBzZXRUaW1lb3V0KGFjdGlvbnMuZW5kQXR0YWNrLCBkdXJhdGlvbik7XG4gICAgfSxcblxuICAgIGVuZEF0dGFjazogZnVuY3Rpb24gZW5kQXR0YWNrKCkge1xuICAgICAgaWYgKHBsYXllci5hbGl2ZSAmJiBwbGF5ZXIuaXNBdHRhY2tpbmcpIHtcbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKHNldHRpbmdzLmNvbG9yKTtcbiAgICAgICAgcGxheWVyLmlzQXR0YWNraW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJ1bjogZnVuY3Rpb24gcnVuKGRpcmVjdGlvbikge1xuICAgICAgdmFyIG1heFNwZWVkID0gMzI7XG4gICAgICB2YXIgYWNjZWxlcmF0aW9uID0gcGxheWVyLmJvZHkudG91Y2hpbmcuZG93biA/IDggOiAzOyAvLyBwbGF5ZXJzIGhhdmUgbGVzcyBjb250cm9sIGluIHRoZSBhaXJcbiAgICAgIHBsYXllci5vcmllbnRhdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgLy8gaWYgcGxheWVyIGlzIGdvaW5nIGZhc3RlciB0aGFuIG1heCBydW5uaW5nIHNwZWVkIChkdWUgdG8gYXR0YWNrLCBldGMpLCBzbG93IHRoZW0gZG93biBvdmVyIHRpbWVcbiAgICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IC1tYXhTcGVlZCkge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCArPSBhY2NlbGVyYXRpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1heChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC0gYWNjZWxlcmF0aW9uLCAtbWF4U3BlZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID4gbWF4U3BlZWQpIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gYWNjZWxlcmF0aW9uO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gTWF0aC5taW4ocGxheWVyLmJvZHkudmVsb2NpdHkueCArIGFjY2VsZXJhdGlvbiwgbWF4U3BlZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAganVtcDogZnVuY3Rpb24ganVtcCgpIHtcbiAgICAgIGlmICghcGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAhcGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCAmJiAhcGxheWVyLmJvZHkudG91Y2hpbmcucmlnaHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgZHVzdDtcblxuICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24pIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMDA7XG4gICAgICAgIGdhbWUuc2Z4LnBsYXkoJ2p1bXAnKTtcbiAgICAgICAgZHVzdCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnanVtcCcpO1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnggPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi54IC0gNDtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi55ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueSArIHBsYXllci5ib2R5LmhlaWdodCAtIDI7XG4gICAgICAvLyB3YWxsIGp1bXBzXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmxlZnQpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMjA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSA0NTtcbiAgICAgICAgZ2FtZS5zZngucGxheSgnanVtcCcpO1xuICAgICAgICBkdXN0ID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsYW5kJyk7XG4gICAgICAgIGR1c3QucG9zaXRpb24ueCA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnggKyAyO1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnkgPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi55IC0gcGxheWVyLmJvZHkuaGVpZ2h0O1xuICAgICAgICBkdXN0LmFuZ2xlID0gOTA7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLnJpZ2h0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMTIwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLTQ1O1xuICAgICAgICBnYW1lLnNmeC5wbGF5KCdqdW1wJyk7XG4gICAgICAgIGR1c3QgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2xhbmQnKTtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi54ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueDtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi55ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueSArIHBsYXllci5ib2R5LmhlaWdodDtcbiAgICAgICAgZHVzdC5hbmdsZSA9IC05MDtcbiAgICAgIH1cblxuICAgICAgZ2FtZS5zdWJVaS5meC5hZGQoZHVzdCk7IC8vIG1vdW50IGJlbG93IGZvcmVncm91bmQgJiB1aVxuICAgICAgdmFyIGFuaW0gPSBkdXN0LmFuaW1hdGlvbnMuYWRkKCdkdXN0Jyk7XG4gICAgICBkdXN0LmFuaW1hdGlvbnMucGxheSgnZHVzdCcsIDMyLzMpO1xuICAgICAgYW5pbS5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgZHVzdC5raWxsKCk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgZGFtcGVuSnVtcDogZnVuY3Rpb24gZGFtcGVuSnVtcCgpIHtcbiAgICAgIC8vIHNvZnRlbiB1cHdhcmQgdmVsb2NpdHkgd2hlbiBwbGF5ZXIgcmVsZWFzZXMganVtcCBrZXlcbiAgICAgICAgdmFyIGRhbXBlblRvUGVyY2VudCA9IDAuNTtcblxuICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueSA8IDApIHtcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ICo9IGRhbXBlblRvUGVyY2VudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkdWNrOiBmdW5jdGlvbiBkdWNrKCkge1xuICAgICAgaWYgKHBsYXllci5pc0F0dGFja2luZyB8fCBwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYXllci5pc0R1Y2tpbmcgJiYgcGxheWVyLmhwID4gMikge1xuICAgICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgc2V0dGluZ3Muc2NhbGUueSAvIDIpO1xuICAgICAgICBhY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcbiAgICAgICAgcGxheWVyLnkgKz0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSB0cnVlO1xuXG4gICAgICAoZnVuY3Rpb24gcm9sbCgpIHtcbiAgICAgICAgdmFyIGNhblJvbGwgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA+IDI1ICYmIHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd247XG4gICAgICAgIGlmIChjYW5Sb2xsKSB7XG4gICAgICAgICAgcGxheWVyLmlzUm9sbGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0oKSk7XG4gICAgfSxcblxuICAgIHN0YW5kOiBmdW5jdGlvbiBzdGFuZCgpIHtcbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAyKSB7XG4gICAgICAgIHBsYXllci55IC09IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgICAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICAgICAgcGxheWVyLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICB0YWtlRGFtYWdlOiBmdW5jdGlvbiB0YWtlRGFtYWdlKGFtb3VudCkge1xuICAgICAgLy8gcHJldmVudCB0YWtpbmcgbW9yZSBkYW1hZ2UgdGhhbiBocCByZW1haW5pbmcgaW4gY3VycmVudCBsaWZlXG4gICAgICBpZiAoYW1vdW50ID4gMSAmJiAocGxheWVyLmhwIC0gYW1vdW50KSAlIDIgIT09IDApIHtcbiAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmhwIC09IGFtb3VudDtcblxuICAgICAgaWYgKHBsYXllci5ocCA8IDApIHtcbiAgICAgICAgcGxheWVyLmhwID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChwbGF5ZXIuaHAgJSAyID09PSAwKSB7XG4gICAgICAgIGFjdGlvbnMuZGllKCk7XG4gICAgICB9XG4gICAgICBhY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpO1xuICAgIH0sXG5cbiAgICBhcHBseUhlYWx0aEVmZmVjdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5ld1BsYXllckhlaWdodCA9IE1hdGgubWF4KE1hdGgucm91bmQocGxheWVyLmhwIC8gMiksIDEpO1xuICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIG5ld1BsYXllckhlaWdodCk7XG4gICAgICBhY3Rpb25zLmFwcGx5T3JpZW50YXRpb24oKTtcblxuICAgICAgaWYgKHBsYXllci5ocCA9PT0gMCkge1xuICAgICAgICByZXR1cm47IC8vIGJpdCdzIGJlY29taW5nIGEgZ2hvc3Q7IGxlYXZlcyBpdHMgc2NhcmYgKG9yIGxhY2sgdGhlcmVvZikgYWxvbmVcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmhwICUgMiA9PT0gMSkge1xuICAgICAgICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9uID0gcGxheWVyLnNjYXJmLmFuaW1hdGlvbnMucGxheSgnZGlzaW50ZWdyYXRlJywgMzIvMywgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyLnNjYXJmLmFuaW1hdGlvbiA9IHBsYXllci5zY2FyZi5hbmltYXRpb25zLnBsYXkoJ2ZsYXAnLCAzMi8zLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXBwbHlPcmllbnRhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8ocGxheWVyLm9yaWVudGF0aW9uID09PSAnbGVmdCcgPyBzZXR0aW5ncy5zY2FsZS54IDogLXNldHRpbmdzLnNjYWxlLngsIHBsYXllci5zY2FsZS55KTtcbiAgICB9LFxuXG4gICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocGxheWVyLmhwID4gMCkge1xuICAgICAgICBhY3Rpb25zLmFwcGx5SW52dWxuZXJhYmlsaXR5KCk7XG5cbiAgICAgICAgZ2FtZS5zZngucGxheSgnZGllJyk7XG4gICAgICAgIGFjdGlvbnMuZW5kQXR0YWNrKCk7XG4gICAgICAgIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuXG4gICAgICAgIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICAgICAgdmFyIHJlc3Bhd25Qb3NpdGlvbiA9IHV0aWxzLmdldFJhbmRvbUFycmF5RWxlbWVudCh1dGlscy5nZXRTdGFnZSgpLnNwYXduUG9pbnRzKTtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnggPSByZXNwYXduUG9zaXRpb24ueDtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnkgPSByZXNwYXduUG9zaXRpb24ueTtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FtZS5zZngucGxheSgncGVybWFkaWUnKTtcbiAgICAgICAgcGxheWVyLmFscGhhID0gMC41O1xuICAgICAgICBwbGF5ZXIuaXNQZXJtYWRlYWQgPSB0cnVlO1xuICAgICAgICBvbkRlYXRoKCk7IC8vIFRPRE86IHRoaXMgY291bGQgcHJvYmFibHkgYmUgYmV0dGVyIGFyY2hpdGVjdGVkXG4gICAgICB9XG4gICAgfSxcblxuICAgIGFwcGx5SW52dWxuZXJhYmlsaXR5OiBmdW5jdGlvbigpIHtcbiAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSBmYWxzZTtcblxuICAgICAgdmFyIHNldENvbG9yID0gZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgLy8gaW4gY2FzZSBnYW1lIHJlc3RhcnRzIGFuZCBwbGF5ZXIgbm8gbG9uZ2VyIGV4aXN0cy4uLlxuICAgICAgICBpZiAoIXBsYXllci5hbGl2ZSkge1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoY29sb3JJbnRlcnZhbCk7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbCh3aGl0ZUludGVydmFsKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKGNvbG9yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBjb2xvckludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldENvbG9yKHNldHRpbmdzLmNvbG9yKTtcbiAgICAgIH0sIDE1MCk7XG4gICAgICB2YXIgd2hpdGVJbnRlcnZhbDtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHdoaXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZXRDb2xvcignd2hpdGUnKTtcbiAgICAgICAgfSwgMTUwKTtcbiAgICAgIH0sIDc1KTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFwbGF5ZXIuYWxpdmUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xlYXJJbnRlcnZhbCh3aGl0ZUludGVydmFsKTtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChjb2xvckludGVydmFsKTtcbiAgICAgICAgc2V0Q29sb3Ioc2V0dGluZ3MuY29sb3IpOyAvLyBlbnN1cmUgcGxheWVyIGNvbG9yIHJldHVybnMgdG8gbm9ybWFsXG4gICAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSB0cnVlO1xuICAgICAgfSwgMTUwMCk7XG4gICAgfSxcbiAgfTtcblxuICB2YXIgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIHNldHRpbmdzLmNvbG9yKTtcbiAgcGxheWVyLm5hbWUgPSBzZXR0aW5ncy5uYW1lO1xuICBwbGF5ZXIub3JpZW50YXRpb24gPSBzZXR0aW5ncy5vcmllbnRhdGlvbjtcbiAgcGxheWVyLmFuY2hvci5zZXRUbygwLjUsIDAuNSk7IC8vIGFuY2hvciB0byBjZW50ZXIgdG8gYWxsb3cgZmxpcHBpbmdcblxuICBwbGF5ZXIuc2NhcmYgPSBnYW1lLmFkZC5zcHJpdGUoLTEsIC0xLCBzZXR0aW5ncy5jb2xvciArICdTY2FyZicpO1xuICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9ucy5hZGQoJ2ZsYXAnLCBbMCwgMSwgMiwgMywgNCwgNV0pO1xuICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9ucy5hZGQoJ2Rpc2ludGVncmF0ZScsIFs3LCA4LCA5LCAxMCwgMTEsIDZdKTtcbiAgcGxheWVyLnNjYXJmLmFuaW1hdGlvbiA9IHBsYXllci5zY2FyZi5hbmltYXRpb25zLnBsYXkoJ2ZsYXAnLCAzMi8zLCB0cnVlKTtcbiAgcGxheWVyLnNjYXJmLnNldFNjYWxlTWluTWF4KC0xLCAxLCAxLCAxKTtcbiAgcGxheWVyLmFkZENoaWxkKHBsYXllci5zY2FyZik7XG5cbiAgLy8gdHJhY2sgaGVhbHRoXG4gIHBsYXllci5ocCA9IHBsYXllci5tYXhIcCA9IDY7IC8vIFRPRE86IGFsbG93IHNldHRpbmcgY3VzdG9tIGhwIGFtb3VudCBmb3IgZWFjaCBwbGF5ZXJcbiAgcGxheWVyLmFjdGlvbnMgPSBhY3Rpb25zO1xuICBwbGF5ZXIuYWN0aW9ucy5hcHBseUhlYWx0aEVmZmVjdHMoKTsgLy8gVE9ETzogYWRkIGdpYW50IG1vZGVcblxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZShwbGF5ZXIpO1xuICBwbGF5ZXIuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICBwbGF5ZXIuYm9keS5ib3VuY2UueSA9IDAuMjsgLy8gVE9ETzogYWxsb3cgYm91bmNlIGNvbmZpZ3VyYXRpb25cbiAgcGxheWVyLmJvZHkuZ3Jhdml0eS55ID0gMzgwOyAvLyBUT0RPOiBhbGxvdyBncmF2aXR5IGNvbmZpZ3VyYXRpb25cblxuICBwbGF5ZXIudXBXYXNEb3duID0gZmFsc2U7IC8vIHRyYWNrIGlucHV0IGNoYW5nZSBmb3IgdmFyaWFibGUganVtcCBoZWlnaHRcbiAgcGxheWVyLmlzRmFsbGluZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNSb2xsaW5nID0gZmFsc2U7XG4gIHBsYXllci5pc0R1Y2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzQXR0YWNraW5nID0gZmFsc2U7XG4gIHBsYXllci5pc1Blcm1hZGVhZCA9IGZhbHNlO1xuICBwbGF5ZXIubGFzdEF0dGFja2VkID0gMDtcbiAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG5cbiAgLy8gcGhhc2VyIGFwcGFyZW50bHkgYXV0b21hdGljYWxseSBjYWxscyBhbnkgZnVuY3Rpb24gbmFtZWQgdXBkYXRlIGF0dGFjaGVkIHRvIGEgc3ByaXRlIVxuICBwbGF5ZXIudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8ga2lsbCBwbGF5ZXIgaWYgaGUgZmFsbHMgb2ZmIHRoZSBzY3JlZW5cbiAgICBpZiAocGxheWVyLnBvc2l0aW9uLnkgPiA2NCAmJiBwbGF5ZXIuaHAgIT09IDApIHsgLy8gVE9ETzogaG93IHRvIGFjY2VzcyBuYXRpdmUgaGVpZ2h0IGZyb20gZ2FtZS5qcz9cbiAgICAgIGFjdGlvbnMudGFrZURhbWFnZSgyKTtcbiAgICB9XG5cbiAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueSA+IDg1KSB7XG4gICAgICBwbGF5ZXIuaXNGYWxsaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9uLnNwZWVkID0gTWF0aC5hYnMocGxheWVyLmJvZHkudmVsb2NpdHkueCkgKiAwLjc1ICsgMzIvMztcblxuICAgIHZhciBpbnB1dCA9IHtcbiAgICAgIGxlZnQ6ICAgKGtleXMubGVmdC5pc0Rvd24gJiYgIWtleXMucmlnaHQuaXNEb3duKSB8fFxuICAgICAgICAgICAgICAoZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0xFRlQpICYmICFnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfUklHSFQpKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1gpIDwgLTAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9YKSA8IC0wLjEsXG4gICAgICByaWdodDogIChrZXlzLnJpZ2h0LmlzRG93biAmJiAha2V5cy5sZWZ0LmlzRG93bikgfHxcbiAgICAgICAgICAgICAgKGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9SSUdIVCkgJiYgIWdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9MRUZUKSkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfTEVGVF9YKSA+IDAuMSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19SSUdIVF9YKSA+IDAuMSxcbiAgICAgIHVwOiAgICAga2V5cy51cC5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1VQKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0EpLFxuICAgICAgZG93bjogICBrZXlzLmRvd24uaXNEb3duIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9ET1dOKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1kpID4gMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1kpID4gMC4xLFxuICAgICAgYXR0YWNrOiBrZXlzLmF0dGFjay5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1gpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9ZKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfQikgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0xFRlRfQlVNUEVSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfTEVGVF9UUklHR0VSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfUklHSFRfQlVNUEVSKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfUklHSFRfVFJJR0dFUiksXG4gICAgfTtcblxuICAgIGlmIChpbnB1dC5sZWZ0KSB7XG4gICAgICBhY3Rpb25zLnJ1bignbGVmdCcpO1xuICAgICAgcGxheWVyLmFjdGlvbnMuYXBwbHlPcmllbnRhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoaW5wdXQucmlnaHQpIHtcbiAgICAgIGFjdGlvbnMucnVuKCdyaWdodCcpO1xuICAgICAgcGxheWVyLmFjdGlvbnMuYXBwbHlPcmllbnRhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAhcGxheWVyLmlzUm9sbGluZykge1xuICAgICAgLy8gYXBwbHkgZnJpY3Rpb25cbiAgICAgIGlmIChNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSA8IDIpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAqPSAwLjU7IC8vIHF1aWNrbHkgYnJpbmcgc2xvdy1tb3ZpbmcgcGxheWVycyB0byBhIHN0b3BcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IDApIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSAyO1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IDwgMCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICs9IDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LnVwKSB7XG4gICAgICBwbGF5ZXIudXBXYXNEb3duID0gdHJ1ZTtcbiAgICAgIGFjdGlvbnMuanVtcCgpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLnVwV2FzRG93bikge1xuICAgICAgcGxheWVyLnVwV2FzRG93biA9IGZhbHNlO1xuICAgICAgYWN0aW9ucy5kYW1wZW5KdW1wKCk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmRvd24pIHtcbiAgICAgIGFjdGlvbnMuZHVjaygpO1xuICAgIH0gZWxzZSBpZiAocGxheWVyLmlzRHVja2luZykge1xuICAgICAgYWN0aW9ucy5zdGFuZCgpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5hdHRhY2spIHtcbiAgICAgIGFjdGlvbnMuYXR0YWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBwbGF5ZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBsYXllcjtcbiIsIi8qKlxuICogRWFjaCB0aW1lIGEgdW5pcXVlIHNvdW5kIGZpbGVuYW1lIGlzIHBhc3NlZCBpbiwgYSBuZXcgaW5zdGFuY2Ugb2YgY2hpcHR1bmUuanMgd2lsbCBiZSBjcmVhdGVkIHdpdGggdGhhdCBzb3VuZCBhcyBhIGJ1ZmZlci5cbiAqIElmIHRoZSBwbGF5IG1ldGhvZCBpcyBjYWxsZWQgb24gc291bmQgZmlsZSBwYXNzZWQgaW4gcHJldmlvdXNseSwgaXRzIHJlc3BlY3RpdmUgaW5zdGFuY2Ugd2lsbCBwbGF5IHRoZSBleGlzdGluZyBidWZmZXIuXG4gKiBUaGlzIGVuc3VyZXMgdGhlIGZpbGUgc3lzdGVtIGlzIG9ubHkgaGl0IG9uY2UgcGVyIHNvdW5kLCBhcyBuZWVkZWQuXG4gKiBJdCB3aWxsIGFsc28gcHJldmVudCBzb3VuZHMgZnJvbSAnc3RhY2tpbmcnIC0tIHRoZSBzYW1lIHNvdW5kIHBsYXllZCByZXBlYXRlZGx5IHdpbGwgaW50ZXJydXB0IGl0c2VsZiBlYWNoIHRpbWUuXG4gKi9cbnZhciBzZnggPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNvdW5kYmFuayA9IHt9O1xuXG4gIHJldHVybiB7XG4gICAgcGxheTogZnVuY3Rpb24oZmlsZU5hbWUpIHtcbiAgICAgIGlmIChzb3VuZGJhbmtbZmlsZU5hbWVdKSB7XG4gICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0ucGxheShzb3VuZGJhbmtbZmlsZU5hbWVdLmJ1ZmZlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VuZGJhbmtbZmlsZU5hbWVdID0gbmV3IENoaXB0dW5lSnNQbGF5ZXIobmV3IENoaXB0dW5lSnNDb25maWcoMCkpO1xuICAgICAgICBzb3VuZGJhbmtbZmlsZU5hbWVdLmxvYWQoJy4vc2Z4LycgKyBmaWxlTmFtZSArICcueG0nLCBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICBzb3VuZGJhbmtbZmlsZU5hbWVdLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgICBzb3VuZGJhbmtbZmlsZU5hbWVdLnBsYXkoYnVmZmVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZng7XG4iLCJ2YXIgc3RhZ2VCdWlsZGVyID0gZnVuY3Rpb24gc3RhZ2VCdWlsZGVyKGdhbWUpIHtcbiAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzJyk7XG4gIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgdmFyIHN0YWdlID0gdXRpbHMuZ2V0U3RhZ2UoKTtcblxuICBnYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IHN0YWdlLmJhY2tncm91bmRDb2xvcjtcblxuICB2YXIgYnVpbGRQbGF0Zm9ybXMgPSBmdW5jdGlvbiBidWlsZFBsYXRmb3JtcygpIHtcbiAgICB2YXIgcGxhdGZvcm1zID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgICBwbGF0Zm9ybXMuZW5hYmxlQm9keSA9IHRydWU7XG5cbiAgICB2YXIgcGxhdGZvcm1Qb3NpdGlvbnMgPSBzdGFnZS5wbGF0Zm9ybXMucG9zaXRpb25zO1xuICAgIHBsYXRmb3JtUG9zaXRpb25zLmZvckVhY2goZnVuY3Rpb24ocG9zaXRpb24pIHtcbiAgICAgIHZhciBwbGF0Zm9ybSA9IHBsYXRmb3Jtcy5jcmVhdGUocG9zaXRpb25bMF0sIHBvc2l0aW9uWzFdLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpO1xuICAgICAgcGxhdGZvcm0uc2NhbGUuc2V0VG8oNSwgMSk7XG4gICAgICBwbGF0Zm9ybS5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gICAgfSk7XG5cbiAgICB2YXIgd2FsbHMgPSBbXTtcbiAgICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoLTMsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKSk7XG4gICAgd2FsbHMucHVzaChwbGF0Zm9ybXMuY3JlYXRlKDYxLCAtMTIsIHN0YWdlLnBsYXRmb3Jtcy5jb2xvcikpO1xuICAgIHdhbGxzLmZvckVhY2goZnVuY3Rpb24od2FsbCkge1xuICAgICAgd2FsbC5zY2FsZS5zZXRUbygzLCAzOCk7XG4gICAgICB3YWxsLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHZhciBjZWlsaW5nID0gcGxhdGZvcm1zLmNyZWF0ZSgwLCAtMTIsIHN0YWdlLnBsYXRmb3Jtcy5jb2xvcik7XG4gICAgY2VpbGluZy5zY2FsZS5zZXRUbygzMiwgMyk7XG4gICAgY2VpbGluZy5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gICAgXG4gICAgcmV0dXJuIHBsYXRmb3JtcztcbiAgfTtcblxuICB2YXIgYnVpbGRMYXllciA9IGZ1bmN0aW9uIGJ1aWxkTGF5ZXIoc3VibGF5ZXJzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxheWVyID0gZ2FtZS5hZGQuZ3JvdXAoKTtcblxuICAgICAgc3VibGF5ZXJzLmZvckVhY2goZnVuY3Rpb24oc3VibGF5ZXIpIHtcbiAgICAgICAgdmFyIGJnO1xuXG4gICAgICAgIGlmIChzdWJsYXllci5zY3JvbGxpbmcpIHtcbiAgICAgICAgICBiZyA9IGdhbWUuYWRkLnRpbGVTcHJpdGUoMCwgMCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQsIHN1YmxheWVyLmltYWdlKTtcbiAgICAgICAgICBsYXllci5sb29wID0gZ2FtZS50aW1lLmV2ZW50cy5sb29wKFBoYXNlci5UaW1lci5RVUFSVEVSLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJnLnRpbGVQb3NpdGlvbi54IC09MTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiZyA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCBzdWJsYXllci5pbWFnZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3VibGF5ZXIuYW5pbWF0ZWQpIHtcbiAgICAgICAgICBiZy5hbmltYXRpb25zLmFkZCgnYmcnKTtcbiAgICAgICAgICBiZy5hbmltYXRpb25zLnBsYXkoJ2JnJywgc3VibGF5ZXIuYW5pbVNwZWVkIHx8IDMyLzMsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN1YmxheWVyLnB1bHNlKSB7XG4gICAgICAgICAgdmFyIHJlcGVhdCA9IC0xO1xuICAgICAgICAgIHZhciBhdXRvc3RhcnQgPSB0cnVlO1xuICAgICAgICAgIHZhciB5b3lvID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgZHVyYXRpb24gPSBzdWJsYXllci5wdWxzZUR1cmF0aW9uIHx8IDIwMDA7XG4gICAgICAgICAgdmFyIGRlbGF5ID0gc3VibGF5ZXIucHVsc2VEZWxheSB8fCAwO1xuICAgICAgICAgIHZhciBtaW5BbHBoYSA9IHN1YmxheWVyLm1pbkFscGhhIHx8IDA7XG4gICAgICAgICAgZ2FtZS5hZGQudHdlZW4oYmcpLnRvKHsgYWxwaGE6IG1pbkFscGhhIH0sIGR1cmF0aW9uLCBQaGFzZXIuRWFzaW5nLkxpbmVhci5Ob25lLCBhdXRvc3RhcnQsIGRlbGF5LCByZXBlYXQsIHlveW8pO1xuICAgICAgICB9XG5cbiAgICAgICAgYmcuYWxwaGEgPSBzdWJsYXllci5hbHBoYSB8fCAxO1xuXG4gICAgICAgIGxheWVyLmFkZChiZyk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGxheWVyO1xuICAgIH07XG4gIH07XG4gIFxuICByZXR1cm4ge1xuICAgIGJ1aWxkUGxhdGZvcm1zOiBidWlsZFBsYXRmb3JtcyxcbiAgICBidWlsZEZvcmVncm91bmRzOiBidWlsZExheWVyKHN0YWdlLmZvcmVncm91bmRzKSxcbiAgICBidWlsZEJhY2tncm91bmRzOiBidWlsZExheWVyKHN0YWdlLmJhY2tncm91bmRzKSxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VCdWlsZGVyO1xuIiwidmFyIExvYWRpbmcgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBsb2FkaW5nID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsb2FkaW5nJyk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZycpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfSxcblxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gaW1hZ2VzXG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3RpdGxlJywgJ2ltYWdlcy9zcHJpdGVzL3VpLXRpdGxlLmdpZicsIDY0LCA2NCk7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3ZpY3RvcnlNc2cnLCAnaW1hZ2VzL3Nwcml0ZXMvdWktd2lubmVyLmdpZicsIDUyLCAyMik7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2JsdWVTY2FyZicsICdpbWFnZXMvc3ByaXRlcy9iaXQtc2NhcmYtYmx1ZS5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgncGlua1NjYXJmJywgJ2ltYWdlcy9zcHJpdGVzL2JpdC1zY2FyZi1waW5rLmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdncmVlblNjYXJmJywgJ2ltYWdlcy9zcHJpdGVzL2JpdC1zY2FyZi1ncmVlbi5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgncHVycGxlU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXMvYml0LXNjYXJmLXB1cnBsZS5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnanVtcCcsICdpbWFnZXMvc3ByaXRlcy9iaXQtanVtcC5naWYnLCAxMCwgMik7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2xhbmQnLCAnaW1hZ2VzL3Nwcml0ZXMvYml0LWxhbmQuZ2lmJywgMTAsIDIpO1xuICAgICAgLy8gY29sb3JzXG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2NsZWFyJywgJ2ltYWdlcy9jb2xvcnMvY2xlYXIuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3doaXRlJywgJ2ltYWdlcy9jb2xvcnMvd2hpdGUuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2JsdWUnLCAnaW1hZ2VzL2NvbG9ycy9ibHVlLmdpZicpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdwaW5rJywgJ2ltYWdlcy9jb2xvcnMvcGluay5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnZ3JlZW4nLCAnaW1hZ2VzL2NvbG9ycy9ncmVlbi5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgncHVycGxlJywgJ2ltYWdlcy9jb2xvcnMvcHVycGxlLmdpZicpO1xuICAgICAgLy8gYXJlbmFzXG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2ZvcmVzdCcsICdpbWFnZXMvYXJlbmFzL2ZvcmVzdC1zdW1tZXIuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2ZvcmVzdEJnMScsICdpbWFnZXMvYXJlbmFzL2ZvcmVzdC1iZzEuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2ZvcmVzdEJnMicsICdpbWFnZXMvYXJlbmFzL2ZvcmVzdC1iZzIuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3RvbWInLCAnaW1hZ2VzL2FyZW5hcy90b21iLXdhcm0uZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3dhdGVyZmFsbCcsICdpbWFnZXMvYXJlbmFzL3dhdGVyZmFsbC5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnd2F0ZXJmYWxsQW5pbScsICdpbWFnZXMvYXJlbmFzL3dhdGVyZmFsbC1hbmltLmdpZicsIDY0LCA2NCk7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3dhdGVyZmFsbEZnJywgJ2ltYWdlcy9hcmVuYXMvd2F0ZXJmYWxsLWZnLWFuaW0uZ2lmJywgNjQsIDY0KTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnaGFuZ2FyJywgJ2ltYWdlcy9hcmVuYXMvbGV2ZWwtaGFuZ2FyLXdpcC5naWYnKTtcblxuICAgICAgLy8gc291bmRcbiAgICAgIGdhbWUuYmdtID0gcmVxdWlyZSgnLi4vbXVzaWMnKSgpO1xuICAgICAgZ2FtZS5zZnggPSByZXF1aXJlKCcuLi9zZngnKSgpO1xuICAgIH0sXG5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG5cbiAgICAgIGdhbWUuc3RhdGUuYWRkKCdzcGxhc2gnLCByZXF1aXJlKCcuL3NwbGFzaCcpKGdhbWUpKTtcbiAgICAgIGdhbWUuc3RhdGUuYWRkKCdwbGF5JywgcmVxdWlyZSgnLi9wbGF5JykoZ2FtZSkpO1xuICAgICAgZ2FtZS5zdGF0ZS5zdGFydCgnc3BsYXNoJyk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIGxvYWRpbmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRpbmc7XG4iLCJ2YXIgUGxheSA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHBsYXkgPSB7XG4gICAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGdhbWUuc3ViVWkgPSBnYW1lLmFkZC5ncm91cCgpOyAvLyBwbGFjZSB0byBrZWVwIGFueXRoaW5nIG9uLXNjcmVlbiB0aGF0J3Mgbm90IFVJIHRvIGRlcHRoIHNvcnQgYmVsb3cgVUlcblxuICAgICAgLy8gZ2FtZSBvdmVyIHZpY3RvcnkgbWVzc2FnZSBkZWNsYXJpbmcgdGhlIHdpbm5lclxuICAgICAgc2VsZi52aWN0b3J5TXNnID0gZ2FtZS5hZGQuc3ByaXRlKDYsIDIxLCAndmljdG9yeU1zZycpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSBmYWxzZTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnQmx1ZScsIFswLCA0LCA4LCAxMl0sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdQaW5rJywgWzEsIDUsIDksIDEzXSwgMzIvMywgdHJ1ZSk7XG4gICAgICBzZWxmLnZpY3RvcnlNc2cuYW5pbWF0aW9ucy5hZGQoJ0dyZWVuJywgWzIsIDYsIDEwLCAxNF0sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdQdXJwbGUnLCBbMywgNywgMTEsIDE1XSwgMzIvMywgdHJ1ZSk7XG5cbiAgICAgIHNlbGYudGltZW91dHMgPSBbXTsgLy8gc3RvcmUgZ2FtZSB0aW1lb3V0cyB0byBjYW5jZWwgaWYgZ2FtZSByZXN0YXJ0c1xuXG4gICAgICAvLyBtZW51XG4gICAgICB2YXIgYnVpbGRNZW51ID0gcmVxdWlyZSgnLi4vbWVudScpO1xuICAgICAgYnVpbGRNZW51KGdhbWUsIHNlbGYpOyAvLyBUT0RPOiBpcyB0aGVyZSBhIGJldHRlciBhcHByb2FjaCB0aGFuIGluamVjdGluZyB0aGUgd2hvbGUgc3RhdGUgaW50byB0aGUgbWVudSB0byBsZXQgaXQgYWNjZXNzIGZ1bmN0aW9ucyBmb3IgcmVzZXR0aW5nIHN0YWdlLCBwbGF5ZXJzLCBtdXNpYz9cblxuICAgICAgc2VsZi5yZXN0YXJ0KCk7XG4gICAgICBnYW1lLnBoeXNpY3Muc3RhcnRTeXN0ZW0oUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5zdGFydCgpO1xuXG4gICAgICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi9kYXRhL3NldHRpbmdzJylcbiAgICAgIGdhbWUuYmdtLnBsYXkoc2V0dGluZ3MuYmdtLnNlbGVjdGVkKTtcbiAgICB9LFxuXG4gICAgcmVzdGFydDogZnVuY3Rpb24gcmVzdGFydCgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBwbGF5ZXJzID0gcmVxdWlyZSgnLi4vZGF0YS9wbGF5ZXJzJykoZ2FtZSk7XG4gICAgICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuLi9kYXRhL3NldHRpbmdzJyk7XG4gICAgICB2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuICAgICAgdmFyIHN0YWdlQnVpbGRlciA9IHJlcXVpcmUoJy4uL3N0YWdlQnVpbGRlcicpKGdhbWUpO1xuICAgICAgdmFyIHN0YWdlID0gdXRpbHMuZ2V0U3RhZ2UoKTtcblxuICAgICAgLy8gY2FuY2VsIGFueSB0aW1lb3V0cyBmcm9tIHRoZSBsYXN0IGdhbWVcbiAgICAgIHNlbGYudGltZW91dHMuZm9yRWFjaChmdW5jdGlvbih0aW1lb3V0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBkZXN0cm95IGFuZCByZWJ1aWxkIHN0YWdlIGFuZCBwbGF5ZXJzXG4gICAgICB2YXIgZGVzdHJveUdyb3VwID0gZnVuY3Rpb24gZGVzdHJveUdyb3VwKGdyb3VwKSB7XG4gICAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoZ3JvdXAuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGdyb3VwLmNoaWxkcmVuWzBdLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyb3VwLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgZGVzdHJveUdyb3VwKHNlbGYucGxheWVycyk7XG4gICAgICBkZXN0cm95R3JvdXAoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgZGVzdHJveUdyb3VwKHNlbGYuYmFja2dyb3VuZHMpO1xuICAgICAgZGVzdHJveUdyb3VwKHNlbGYuZm9yZWdyb3VuZHMpO1xuXG4gICAgICAvLyBUT0RPOiB1Z2gsIGNsZWFuIHRoaXMgdXAhXG4gICAgICBpZiAoc2VsZi5iYWNrZ3JvdW5kcyAmJiBzZWxmLmJhY2tncm91bmRzLmxvb3ApIHtcbiAgICAgICAgZ2FtZS50aW1lLmV2ZW50cy5yZW1vdmUoc2VsZi5iYWNrZ3JvdW5kcy5sb29wKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLmZvcmVncm91bmRzICYmIHNlbGYuZm9yZWdyb3VuZHMubG9vcCkge1xuICAgICAgICBnYW1lLnRpbWUuZXZlbnRzLnJlbW92ZShzZWxmLmZvcmVncm91bmRzLmxvb3ApO1xuICAgICAgfVxuXG4gICAgICBzZWxmLnBsYXRmb3JtcyA9IHN0YWdlQnVpbGRlci5idWlsZFBsYXRmb3JtcygpO1xuICAgICAgc2VsZi5iYWNrZ3JvdW5kcyA9IHN0YWdlQnVpbGRlci5idWlsZEJhY2tncm91bmRzKCk7XG4gICAgICBnYW1lLnN1YlVpLmFkZChzZWxmLnBsYXRmb3Jtcyk7XG4gICAgICBnYW1lLnN1YlVpLmFkZChzZWxmLmJhY2tncm91bmRzKTtcblxuICAgICAgc2VsZi5wbGF5ZXJzID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgICAgIGdhbWUuc3ViVWkuYWRkKHNlbGYucGxheWVycyk7XG5cbiAgICAgIGdhbWUuc3ViVWkuZnggPSBnYW1lLmFkZC5ncm91cCgpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoZ2FtZS5zdWJVaS5meCk7XG5cbiAgICAgIHZhciBhZGRQbGF5ZXIgPSBmdW5jdGlvbiBhZGRQbGF5ZXIocGxheWVyKSB7XG4gICAgICAgIHZhciBjaGVja0ZvckdhbWVPdmVyID0gZnVuY3Rpb24gY2hlY2tGb3JHYW1lT3ZlcigpIHtcbiAgICAgICAgICB2YXIgYWxpdmVQbGF5ZXJzID0gW107XG4gICAgICAgICAgc2VsZi5wbGF5ZXJzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24ocGxheWVyLCBpKSB7XG4gICAgICAgICAgICBpZiAoIXBsYXllci5pc1Blcm1hZGVhZCkge1xuICAgICAgICAgICAgICBhbGl2ZVBsYXllcnMucHVzaChwbGF5ZXIubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKGFsaXZlUGxheWVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHNlbGYudmljdG9yeU1zZy5wbGF5KGFsaXZlUGxheWVyc1swXSk7XG4gICAgICAgICAgICBzZWxmLnZpY3RvcnlNc2cudmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICBnYW1lLnNmeC5wbGF5KCd2aWN0b3J5Jyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnZpY3RvcnlNc2cudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgMzAwMCk7XG4gICAgICAgICAgICBzZWxmLnRpbWVvdXRzLnB1c2goc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi5yZXN0YXJ0KCk7XG4gICAgICAgICAgICB9LCAzMDAwKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgY3JlYXRlUGxheWVyID0gcmVxdWlyZSgnLi4vcGxheWVyJyk7XG4gICAgICAgIHZhciBuZXdQbGF5ZXIgPSBzZWxmLnBsYXllcnMuYWRkKGNyZWF0ZVBsYXllcihnYW1lLCBwbGF5ZXIsIGNoZWNrRm9yR2FtZU92ZXIpKTtcbiAgICAgICAgdmFyIHBvcyA9IHN0YWdlLnNwYXduUG9pbnRzW2ldO1xuICAgICAgICBuZXdQbGF5ZXIucG9zaXRpb24ueCA9IHBvcy54O1xuICAgICAgICBuZXdQbGF5ZXIucG9zaXRpb24ueSA9IHBvcy55O1xuICAgICAgfTtcblxuICAgICAgLy9wbGF5ZXJzLmZvckVhY2goYWRkUGxheWVyKTtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxzZXR0aW5ncy5wbGF5ZXJDb3VudC5zZWxlY3RlZDsgaSsrKSB7XG4gICAgICAgIGFkZFBsYXllcihwbGF5ZXJzW2ldLCBpKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5mb3JlZ3JvdW5kcyA9IHN0YWdlQnVpbGRlci5idWlsZEZvcmVncm91bmRzKCk7XG4gICAgICBnYW1lLnN1YlVpLmFkZChzZWxmLmZvcmVncm91bmRzKTtcblxuICAgICAgZ2FtZS5zZngucGxheSgncm91bmRTdGFydCcpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIFxuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMucGxheWVycywgdGhpcy5wbGF0Zm9ybXMsIGZ1bmN0aW9uIGhhbmRsZVBsYXRmb3JtQ29sbGlzaW9uKHBsYXllciwgcGxhdGZvcm0pIHtcbiAgICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgcGxheWVyLmlzRmFsbGluZykge1xuICAgICAgICAgIHBsYXllci5pc0ZhbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAvLyBraWNrIHVwIGR1c3RcbiAgICAgICAgICB2YXIgZHVzdCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnbGFuZCcpO1xuICAgICAgICAgIGdhbWUuc3ViVWkuZnguYWRkKGR1c3QpO1xuICAgICAgICAgIGR1c3QucG9zaXRpb24ueCA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnggLSA0O1xuICAgICAgICAgIGR1c3QucG9zaXRpb24ueSA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnkgKyBwbGF5ZXIuYm9keS5oZWlnaHQgLSAyO1xuXG4gICAgICAgICAgdmFyIGFuaW0gPSBkdXN0LmFuaW1hdGlvbnMuYWRkKCdkdXN0Jyk7XG4gICAgICAgICAgZHVzdC5hbmltYXRpb25zLnBsYXkoJ2R1c3QnLCAzMi8zKTtcbiAgICAgICAgICBhbmltLm9uQ29tcGxldGUuYWRkKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZHVzdC5raWxsKCk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBUT0RPOiBob3cgZG8gaSBkbyB0aGlzIG9uIHRoZSBwbGF5ZXIgaXRzZWxmIHdpdGhvdXQgYWNjZXNzIHRvIHBsYXllcnM/IG9yIHNob3VsZCBpIGFkZCBhIGZ0biB0byBwbGF5ZXIgYW5kIHNldCB0aGF0IGFzIHRoZSBjYj9cbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllcnMsIHRoaXMucGxheWVycywgZnVuY3Rpb24gaGFuZGxlUGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAgICAgIC8qIGxldCdzIG5vdCBrbm9jayBhbnlib2R5IGFyb3VuZCBpZiBzb21ldGhpbmcncyBvbiBvbmUgb2YgdGhlc2UgZHVkZXMnL2R1ZGV0dGVzJyBoZWFkcy5cbiAgICAgICAgIHByZXZlbnRzIGNhbm5vbmJhbGwgYXR0YWNrcyBhbmQgdGhlIGxpa2UsIGFuZCBhbGxvd3Mgc3RhbmRpbmcgb24gaGVhZHMuXG4gICAgICAgICBub3RlOiBzdGlsbCBuZWVkIHRvIGNvbGxpZGUgaW4gb3JkZXIgdG8gdGVzdCB0b3VjaGluZy51cCwgc28gZG9uJ3QgbW92ZSB0aGlzIHRvIGFsbG93UGxheWVyQ29sbGlzaW9uISAqL1xuICAgICAgICBpZiAocGxheWVyQS5ib2R5LnRvdWNoaW5nLnVwIHx8IHBsYXllckIuYm9keS50b3VjaGluZy51cCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXIpIHtcbiAgICAgICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gZmFsc2U7XG4gICAgICAgICAgc2VsZi50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICB9LCAxMDApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGJvdW5jZSgpIHtcbiAgICAgICAgICBnYW1lLnNmeC5wbGF5KCdib3VuY2UnKTs7XG5cbiAgICAgICAgICB2YXIgYm91bmNlVmVsb2NpdHkgPSA1MDtcbiAgICAgICAgICB2YXIgdmVsb2NpdHlBLCB2ZWxvY2l0eUI7XG4gICAgICAgICAgdmVsb2NpdHlBID0gdmVsb2NpdHlCID0gYm91bmNlVmVsb2NpdHk7XG4gICAgICAgICAgaWYgKHBsYXllckEucG9zaXRpb24ueCA+IHBsYXllckIucG9zaXRpb24ueCkge1xuICAgICAgICAgICAgdmVsb2NpdHlCICo9IC0xO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2ZWxvY2l0eUEgKj0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXllckEuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlBO1xuICAgICAgICAgIHBsYXllckIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlCO1xuICAgICAgICAgIHBsYXllckEuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgcGxheWVyQi5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGZsaW5nKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LnBsYXkoJ2JvdW5jZScpO1xuXG4gICAgICAgICAgdmFyIHBsYXllclRvRmxpbmc7XG4gICAgICAgICAgdmFyIHBsYXllclRvTGVhdmU7XG4gICAgICAgICAgaWYgKHBsYXllckEuaXNEdWNraW5nKSB7XG4gICAgICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQjtcbiAgICAgICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJBO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQTtcbiAgICAgICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJCO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyVG9GbGluZyk7XG4gICAgICAgICAgdmFyIGZsaW5nWFZlbG9jaXR5ID0gNzU7XG4gICAgICAgICAgaWYgKHBsYXllclRvRmxpbmcucG9zaXRpb24ueCA+IHBsYXllclRvTGVhdmUucG9zaXRpb24ueCkge1xuICAgICAgICAgICAgZmxpbmdYVmVsb2NpdHkgKj0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS54ID0gZmxpbmdYVmVsb2NpdHk7XG4gICAgICAgICAgcGxheWVyVG9GbGluZy5ib2R5LnZlbG9jaXR5LnkgPSAtNzU7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwb3AoKSB7XG4gICAgICAgICAgZ2FtZS5zZngucGxheSgnYm91bmNlJyk7XG5cbiAgICAgICAgICB2YXIgcGxheWVyVG9Qb3A7XG4gICAgICAgICAgaWYgKHBsYXllckEuaXNSb2xsaW5nKSB7XG4gICAgICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllclRvUG9wID0gcGxheWVyQTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvUG9wKTtcbiAgICAgICAgICBwbGF5ZXJUb1BvcC5ib2R5LnZlbG9jaXR5LnkgPSAtNzU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYm90aFJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyAmJiBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICAgICAgdmFyIGJvdGhTdGFuZGluZyA9ICFwbGF5ZXJBLmlzRHVja2luZyAmJiAhcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgICAgIHZhciBuZWl0aGVyUm9sbGluZyA9ICFwbGF5ZXJBLmlzUm9sbGluZyAmJiAhcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgICAgIHZhciBlaXRoZXJEdWNraW5nID0gcGxheWVyQS5pc0R1Y2tpbmcgfHwgcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgICAgIHZhciBlaXRoZXJSdW5uaW5nID0gTWF0aC5hYnMocGxheWVyQS5ib2R5LnZlbG9jaXR5LngpID4gMjggfHwgTWF0aC5hYnMocGxheWVyQi5ib2R5LnZlbG9jaXR5LngpID49IDI4O1xuICAgICAgICB2YXIgZWl0aGVyUm9sbGluZyA9IHBsYXllckEuaXNSb2xsaW5nIHx8IHBsYXllckIuaXNSb2xsaW5nO1xuICAgICAgICB2YXIgZWl0aGVyU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgfHwgIXBsYXllckIuaXNEdWNraW5nO1xuXG4gICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICAgIGNhc2UgYm90aFJvbGxpbmcgfHwgYm90aFN0YW5kaW5nOlxuICAgICAgICAgICAgYm91bmNlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIG5laXRoZXJSb2xsaW5nICYmIGVpdGhlclJ1bm5pbmcgJiYgZWl0aGVyRHVja2luZzpcbiAgICAgICAgICAgIGZsaW5nKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGVpdGhlclJvbGxpbmcgJiYgZWl0aGVyU3RhbmRpbmc6XG4gICAgICAgICAgICBwb3AoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgb25seSBvbmUgb2YgdGhlIHRvdWNoaW5nIHBsYXllcnMgaXMgYXR0YWNraW5nLi4uXG4gICAgICAgIGlmIChwbGF5ZXJBLmlzQXR0YWNraW5nICE9PSBwbGF5ZXJCLmlzQXR0YWNraW5nKSB7XG4gICAgICAgICAgdmFyIHZpY3RpbSA9IHBsYXllckEuaXNBdHRhY2tpbmcgPyBwbGF5ZXJCIDogcGxheWVyQTtcbiAgICAgICAgICBpZiAocGxheWVyQS5vcmllbnRhdGlvbiAhPT0gcGxheWVyQi5vcmllbnRhdGlvbikge1xuICAgICAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgyKTsgLy8gYXR0YWNrZWQgZnJvbSBiZWhpbmQgZm9yIGRvdWJsZSBkYW1hZ2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSwgZnVuY3Rpb24gYWxsb3dQbGF5ZXJDb2xsaXNpb24ocGxheWVyQSwgcGxheWVyQikge1xuICAgICAgICAvLyBkb24ndCBhbGxvdyBjb2xsaXNpb24gaWYgZWl0aGVyIHBsYXllciBpc24ndCBjb2xsaWRhYmxlLlxuICAgICAgICAvLyBhbHNvIGRpc2FsbG93IGlmIHBsYXllciBpcyBpbiBsaW1ibyBiZWxvdyB0aGUgc2NyZWVuIDpdXG4gICAgICAgIGlmICghcGxheWVyQS5pc0NvbGxpZGFibGUgfHwgIXBsYXllckIuaXNDb2xsaWRhYmxlIHx8IHBsYXllckEucG9zaXRpb24ueSA+IGdhbWUuaGVpZ2h0IHx8IHBsYXllckIucG9zaXRpb24ueSA+IGdhbWUuaGVpZ2h0KSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHBsYXk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXk7XG4iLCJ2YXIgU3BsYXNoID0gZnVuY3Rpb24oZ2FtZSkge1xuICB2YXIgc3BsYXNoID0ge1xuICAgIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICBnYW1lLmJnbS5wbGF5KCd0aXRsZScpO1xuICAgICAgZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdoYW5nYXInKTtcbiAgICAgIHZhciB0aXRsZSA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAndGl0bGUnKTtcbiAgICAgIHRpdGxlLmFuaW1hdGlvbnMuYWRkKCd0aXRsZScpO1xuICAgICAgdGl0bGUuYW5pbWF0aW9ucy5wbGF5KCd0aXRsZScsIDMyLzMsIHRydWUpO1xuXG4gICAgICB2YXIgc3RhcnRHYW1lID0gZnVuY3Rpb24gc3RhcnRHYW1lKCkge1xuICAgICAgICBpZiAoZ2FtZS5zdGF0ZS5jdXJyZW50ID09PSAnc3BsYXNoJykge1xuICAgICAgICAgIGdhbWUuYmdtLnBsYXkoJ05vbmUnKTtcbiAgICAgICAgICBnYW1lLnN0YXRlLnN0YXJ0KCdwbGF5Jyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIHN0YXJ0IGdhbWUgd2hlbiBzdGFydC9lbnRlciBpcyBwcmVzc2VkXG4gICAgICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuRU5URVIpLm9uRG93bi5hZGRPbmNlKHN0YXJ0R2FtZSk7XG4gICAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnN1cHBvcnRlZCAmJiBnYW1lLmlucHV0LmdhbWVwYWQuYWN0aXZlICYmIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmNvbm5lY3RlZCkge1xuICAgICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZE9uY2Uoc3RhcnRHYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIFxuICByZXR1cm4gc3BsYXNoO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcGxhc2g7XG4iLCJ2YXIgdXRpbHMgPSB7XG4gIC8vIGZyb20gdW5kZXJzY29yZVxuICBkZWJvdW5jZTogZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG5cdHZhciB0aW1lb3V0O1xuXHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGltZW91dCA9IG51bGw7XG5cdFx0XHRpZiAoIWltbWVkaWF0ZSkgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHR9O1xuXHRcdHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuXHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0aWYgKGNhbGxOb3cpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdH07XG4gIH0sXG5cbiAgY2VudGVyOiBmdW5jdGlvbihlbnRpdHkpIHtcbiAgICBlbnRpdHkuYW5jaG9yLnNldFRvKDAuNSk7XG4gIH0sXG5cbiAgLy8gVE9ETzogY29uc2lkZXIgaW5qZWN0aW5nIGRlcGVuZGVuY2llc1xuICBnZXRTdGFnZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vZGF0YS9zdGFnZXMnKTtcbiAgICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MnKTtcbiAgICB2YXIgc3RhZ2UgPSBzdGFnZXMuZmlsdGVyKGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICByZXR1cm4gc3RhZ2UubmFtZSA9PT0gc2V0dGluZ3Muc3RhZ2Uuc2VsZWN0ZWQ7XG4gICAgfSlbMF07XG4gICAgcmV0dXJuIHN0YWdlO1xuICB9LFxuXG4gIGdldFJhbmRvbUFycmF5RWxlbWVudDogZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gYXJyYXlbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyYXkubGVuZ3RoKV07XG4gIH0sXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzO1xuIl19
