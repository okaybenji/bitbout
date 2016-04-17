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
    options: ['forest', 'hangar', 'tomb', 'waterfall', 'None'],
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
  "theme": "waterfall",
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
  "gravity": 150,
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
    "image": "hangar"
  }, {
    "image": "hangarBg",
    "animated": true,
    "frames": [0, 0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
    "animSpeed": 10,
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
    game.load.spritesheet('loading', 'images/sprites/ui-loading.gif', 11, 6);
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
        if (player.scarf.animation.name !== 'disintegrate') { // only disintegrate it hasn't already
          player.scarf.animation = player.scarf.animations.play('disintegrate', 32/3, false);
        }
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

  // if stage has a gravity setting, use that
  var gameSettings = require('./data/settings');
  var stages = require('./data/stages');
  var selectedStage = stages[gameSettings.stage.options.indexOf(gameSettings.stage.selected)];
  if (selectedStage.gravity) {
    player.body.gravity.y = selectedStage.gravity;
  } else {
    player.body.gravity.y = 380;
  }

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

},{"./data/settings":2,"./data/stages":3,"./utils":13}],8:[function(require,module,exports){
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
          if (sublayer.frames) {
            bg.animations.add('bg', sublayer.frames);
          } else {
            bg.animations.add('bg');
          }
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
      var loading = game.add.sprite(26, 29, 'loading');
      loading.animations.add('loading');
      loading.animations.play('loading');

      document.getElementById('loading').style.display = 'none';
    },

    preload: function() {
      // ui
      game.load.spritesheet('title', 'images/sprites/ui-title.gif', 64, 64);
      game.load.spritesheet('victoryMsg', 'images/sprites/ui-winner.gif', 52, 22);
      // bits
      game.load.spritesheet('blueScarf', 'images/sprites/bit-scarf-blue.gif', 5, 2);
      game.load.spritesheet('pinkScarf', 'images/sprites/bit-scarf-pink.gif', 5, 2);
      game.load.spritesheet('greenScarf', 'images/sprites/bit-scarf-green.gif', 5, 2);
      game.load.spritesheet('purpleScarf', 'images/sprites/bit-scarf-purple.gif', 5, 2);
      game.load.spritesheet('jump', 'images/sprites/bit-jump.gif', 10, 2);
      game.load.spritesheet('land', 'images/sprites/bit-land.gif', 10, 2);
      game.load.image('clear', 'images/colors/clear.gif');
      game.load.image('white', 'images/colors/white.gif');
      game.load.image('blue', 'images/colors/blue.gif');
      game.load.image('pink', 'images/colors/pink.gif');
      game.load.image('green', 'images/colors/green.gif');
      game.load.image('purple', 'images/colors/purple.gif');
      // forest
      game.load.image('forest', 'images/arenas/forest-summer.gif');
      game.load.image('forestBg1', 'images/arenas/forest-bg1.gif');
      game.load.image('forestBg2', 'images/arenas/forest-bg2.gif');
      // tomb
      game.load.image('tomb', 'images/arenas/tomb-warm.gif');
      // waterfall
      game.load.image('waterfall', 'images/arenas/waterfall.gif');
      game.load.spritesheet('waterfallAnim', 'images/arenas/waterfall-anim.gif', 64, 64);
      game.load.spritesheet('waterfallFg', 'images/arenas/waterfall-fg-anim.gif', 64, 64);
      // hangar
      game.load.image('hangar', 'images/arenas/hangar.gif');
      game.load.spritesheet('hangarBg', 'images/arenas/hangar-bg.gif', 64, 64);

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

      // add forest as title bg
      var stageBuilder = require('../stageBuilder')(game);
      stageBuilder.buildBackgrounds();

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

},{"../stageBuilder":9}],13:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic2NyaXB0cy9kYXRhL3BsYXllcnMuanMiLCJzY3JpcHRzL2RhdGEvc2V0dGluZ3MuanMiLCJzY3JpcHRzL2RhdGEvc3RhZ2VzLmpzIiwic2NyaXB0cy9tYWluLmpzIiwic2NyaXB0cy9tZW51LmpzIiwic2NyaXB0cy9tdXNpYy5qcyIsInNjcmlwdHMvcGxheWVyLmpzIiwic2NyaXB0cy9zZnguanMiLCJzY3JpcHRzL3N0YWdlQnVpbGRlci5qcyIsInNjcmlwdHMvc3RhdGVzL2xvYWRpbmcuanMiLCJzY3JpcHRzL3N0YXRlcy9wbGF5LmpzIiwic2NyaXB0cy9zdGF0ZXMvc3BsYXNoLmpzIiwic2NyaXB0cy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBQbGF5ZXJzID0gZnVuY3Rpb24oZ2FtZSkge1xuICAgIHZhciBwbGF5ZXJzID0gW3tcbiAgICAgIG5hbWU6ICdCbHVlJyxcbiAgICAgIGNvbG9yOiAnYmx1ZScsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCcsIGF0dGFjazogJ1EnXG4gICAgICB9LFxuICAgIH0sIHtcbiAgICAgIG5hbWU6ICdQaW5rJyxcbiAgICAgIGNvbG9yOiAncGluaycsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMixcbiAgICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gICAgfSwge1xuICAgICAgbmFtZTogJ0dyZWVuJyxcbiAgICAgIGNvbG9yOiAnZ3JlZW4nLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnSScsIGRvd246ICdLJywgbGVmdDogJ0onLCByaWdodDogJ0wnLCBhdHRhY2s6ICdVJ1xuICAgICAgfSxcbiAgICB9LCB7XG4gICAgICBuYW1lOiAnUHVycGxlJyxcbiAgICAgIGNvbG9yOiAncHVycGxlJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LFxuICAgICAgb3JpZW50YXRpb246ICdsZWZ0JyxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdUJywgZG93bjogJ0cnLCBsZWZ0OiAnRicsIHJpZ2h0OiAnSCcsIGF0dGFjazogJ1InXG4gICAgICB9LFxuICB9XTtcbiAgXG4gIHJldHVybiBwbGF5ZXJzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJzO1xuIiwidmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vc3RhZ2VzJyk7XG5cbnZhciBzZXR0aW5ncyA9IHtcbiAgcGxheWVyQ291bnQ6IHtcbiAgICBvcHRpb25zOiBbMiwgMywgNF0sXG4gICAgc2VsZWN0ZWQ6IDQsXG4gIH0sXG4gIGJnbToge1xuICAgIG9wdGlvbnM6IFsnZm9yZXN0JywgJ2hhbmdhcicsICd0b21iJywgJ3dhdGVyZmFsbCcsICdOb25lJ10sXG4gICAgc2VsZWN0ZWQ6ICdmb3Jlc3QnLFxuICB9LFxuICBzdGFnZToge1xuICAgIG9wdGlvbnM6IHN0YWdlcy5tYXAoZnVuY3Rpb24oc3RhZ2UpIHtcbiAgICAgIHJldHVybiBzdGFnZS5uYW1lO1xuICAgIH0pLFxuICAgIHNlbGVjdGVkOiAnRm9yZXN0JyxcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZXR0aW5ncztcbiIsInZhciBzdGFnZXMgPSBbe1xuICBcIm5hbWVcIjogXCJXYXRlcmZhbGxcIixcbiAgXCJ0aGVtZVwiOiBcIndhdGVyZmFsbFwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFsxMCwgN10sXG4gICAgICBbNDUsIDddLFxuICAgICAgWzI3LCAxNV0sXG4gICAgICBbMTAsIDI1XSxcbiAgICAgIFs0NSwgMjVdLFxuICAgICAgWzEwLCA0NF0sXG4gICAgICBbNDUsIDQ0XSxcbiAgICAgIFsyNywgNTJdLFxuICAgICAgWzEwLCA2Ml0sXG4gICAgICBbNDUsIDYyXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcIndoaXRlXCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIFwiaW1hZ2VcIjogXCJ3YXRlcmZhbGxcIixcbiAgfSxcbiAge1xuICAgIFwiaW1hZ2VcIjogXCJ3YXRlcmZhbGxBbmltXCIsXG4gICAgXCJhbmltYXRlZFwiOiB0cnVlLFxuICB9XSxcbiAgXCJmb3JlZ3JvdW5kc1wiOiBbe1xuICAgIFwiaW1hZ2VcIjogXCJ3YXRlcmZhbGxGZ1wiLFxuICAgIFwiYW5pbWF0ZWRcIjogdHJ1ZSxcbiAgICBcImFuaW1TcGVlZFwiOiAzMi8xNixcbiAgICBcInNjcm9sbGluZ1wiOiB0cnVlLFxuICAgIFwicHVsc2VcIjogdHJ1ZSxcbiAgICBcIm1pbkFscGhhXCI6IDAuOTVcbiAgfV0sXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogMCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMCB9LFxuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogMTggfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDE4IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzI4RjEyOVwiXG59LHtcbiAgXCJuYW1lXCI6IFwiRm9yZXN0XCIsXG4gIFwidGhlbWVcIjogXCJmb3Jlc3RcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbMjcsIDZdLFxuICAgICAgWzEwLCAxM10sXG4gICAgICBbNDQsIDEzXSxcbiAgICAgIFs1LCAyMl0sXG4gICAgICBbNDksIDIyXSxcbiAgICAgIFsxOCwgMzFdLFxuICAgICAgWzI3LCAzMV0sXG4gICAgICBbMzYsIDMxXSxcbiAgICAgIFs1LCA0NF0sXG4gICAgICBbNDksIDQ0XSxcbiAgICAgIFsyNywgNjBdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwid2hpdGVcIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFt7XG4gICAgXCJpbWFnZVwiOiBcImZvcmVzdFwiXG4gIH0sIHtcbiAgICBcImltYWdlXCI6IFwiZm9yZXN0QmcxXCIsXG4gICAgXCJwdWxzZVwiOiB0cnVlLFxuICAgIFwicHVsc2VEdXJhdGlvblwiOiA0MDAwLFxuICB9LCB7XG4gICAgXCJpbWFnZVwiOiBcImZvcmVzdEJnMlwiLFxuICAgIFwicHVsc2VcIjogdHJ1ZSxcbiAgICBcInB1bHNlRGVsYXlcIjogMzAwMCxcbiAgICBcInB1bHNlRHVyYXRpb25cIjogNTAwMCxcbiAgfV0sXG4gIFwiZm9yZWdyb3VuZHNcIjogW10sXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogNiB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogNiB9LFxuICAgIHsgXCJ4XCI6IDksIFwieVwiOiAxNSB9LFxuICAgIHsgXCJ4XCI6IDU0LCBcInlcIjogMTUgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjMjhENkYxXCJcbn0se1xuICBcIm5hbWVcIjogXCJIYW5nYXJcIixcbiAgXCJ0aGVtZVwiOiBcImhhbmdhclwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJncmF2aXR5XCI6IDE1MCxcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFs4LCAzNF0sXG4gICAgICBbMTIsIDM0XSxcbiAgICAgIFsyMiwgMzRdLFxuICAgICAgWzMxLCAzNF0sXG4gICAgICBbNDEsIDM0XSxcbiAgICAgIFs0NiwgMzRdLFxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcIndoaXRlXCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIFwiaW1hZ2VcIjogXCJoYW5nYXJcIlxuICB9LCB7XG4gICAgXCJpbWFnZVwiOiBcImhhbmdhckJnXCIsXG4gICAgXCJhbmltYXRlZFwiOiB0cnVlLFxuICAgIFwiZnJhbWVzXCI6IFswLCAwLCAxLCAyLCAzLCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCA0LCAzLCAyLCAxXSxcbiAgICBcImFuaW1TcGVlZFwiOiAxMCxcbiAgfV0sXG4gIFwiZm9yZWdyb3VuZHNcIjogW3tcbiAgICBcImltYWdlXCI6IFwiY2xlYXJcIixcbiAgfV0sXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDEwLCBcInlcIjogMjcgfSxcbiAgICB7IFwieFwiOiAxOSwgXCJ5XCI6IDI3IH0sXG4gICAgeyBcInhcIjogNDEsIFwieVwiOiAyNyB9LFxuICAgIHsgXCJ4XCI6IDUwLCBcInlcIjogMjcgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjOEQ4RDhEXCJcbn0se1xuICBcIm5hbWVcIjogXCJUb21iXCIsXG4gIFwidGhlbWVcIjogXCJ0b21iXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzEwLCAxM10sXG4gICAgICBbNDQsIDEzXSxcbiAgICAgIFsyNywgMjFdLFxuICAgICAgWzEwLCAzMV0sXG4gICAgICBbNDQsIDMxXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcIndoaXRlXCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIGltYWdlOiAndG9tYidcbiAgfV0sXG4gIFwiZm9yZWdyb3VuZHNcIjogW3tcbiAgICBcImltYWdlXCI6IFwiY2xlYXJcIlxuICB9XSxcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiA2IH0sXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAyNCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMjQgfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjNzgzRTA4XCJcbn1dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YWdlcztcbiIsInZhciByZXNpemUgPSBmdW5jdGlvbiByZXNpemUoKSB7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUuem9vbSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIGdhbWUuaGVpZ2h0O1xufTtcblxudmFyIG1haW4gPSB7XG4gIHByZWxvYWQ6IGZ1bmN0aW9uIHByZWxvYWQoKSB7XG4gICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG4gICAgcmVzaXplKCk7XG4gICAgd2luZG93Lm9ucmVzaXplID0gdXRpbHMuZGVib3VuY2UocmVzaXplLCAxMDApO1xuICAgIFxuICAgIC8vIGFsbG93IGFueXRoaW5nIHVwIHRvIGhlaWdodCBvZiB3b3JsZCB0byBmYWxsIG9mZi1zY3JlZW4gdXAgb3IgZG93blxuICAgIGdhbWUud29ybGQuc2V0Qm91bmRzKDAsIC1nYW1lLndpZHRoLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCAqIDMpO1xuICAgIFxuICAgIC8vIHByZXZlbnQgZ2FtZSBwYXVzaW5nIHdoZW4gaXQgbG9zZXMgZm9jdXNcbiAgICBnYW1lLnN0YWdlLmRpc2FibGVWaXNpYmlsaXR5Q2hhbmdlID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBhc3NldHMgdXNlZCBpbiBsb2FkaW5nIHNjcmVlblxuICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnbG9hZGluZycsICdpbWFnZXMvc3ByaXRlcy91aS1sb2FkaW5nLmdpZicsIDExLCA2KTtcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgICBnYW1lLnN0YXRlLmFkZCgnbG9hZGluZycsIHJlcXVpcmUoJy4vc3RhdGVzL2xvYWRpbmcnKShnYW1lKSk7XG4gICAgZ2FtZS5zdGF0ZS5zdGFydCgnbG9hZGluZycpO1xuICB9XG59O1xuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg2NCwgNjQsIFBoYXNlci5BVVRPLCAnZ2FtZScsIHtcbiAgcHJlbG9hZDogbWFpbi5wcmVsb2FkLFxuICBjcmVhdGU6IG1haW4uY3JlYXRlXG59LCBmYWxzZSwgZmFsc2UpOyAvLyBkaXNhYmxlIGFudGktYWxpYXNpbmdcblxuZ2FtZS5zdGF0ZS5hZGQoJ21haW4nLCBtYWluKTtcbmdhbWUuc3RhdGUuc3RhcnQoJ21haW4nKTtcbiIsInZhciBidWlsZE1lbnUgPSBmdW5jdGlvbiBidWlsZE1lbnUoZ2FtZSwgc3RhdGUpIHtcbiAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzJyk7XG5cbiAgdmFyIGN5Y2xlU2V0dGluZyA9IGZ1bmN0aW9uIGN5Y2xlU2V0dGluZygpIHtcbiAgICB2YXIgb3B0aW9uSW5kZXggPSB0aGlzLnNldHRpbmcub3B0aW9ucy5pbmRleE9mKHRoaXMuc2V0dGluZy5zZWxlY3RlZCk7XG4gICAgb3B0aW9uSW5kZXgrKztcbiAgICBpZiAob3B0aW9uSW5kZXggPT09IHRoaXMuc2V0dGluZy5vcHRpb25zLmxlbmd0aCkge1xuICAgICAgb3B0aW9uSW5kZXggPSAwO1xuICAgIH1cbiAgICB0aGlzLnNldHRpbmcuc2VsZWN0ZWQgPSB0aGlzLnNldHRpbmcub3B0aW9uc1tvcHRpb25JbmRleF07XG4gIH07XG5cbiAgdmFyIG1lbnUgPSBbe1xuICAgIG5hbWU6ICdQbGF5ZXJzJyxcbiAgICBzZXR0aW5nOiBzZXR0aW5ncy5wbGF5ZXJDb3VudCxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgY3ljbGVTZXR0aW5nLmNhbGwodGhpcyk7XG4gICAgICBzdGF0ZS5yZXN0YXJ0KCk7XG4gICAgfSxcbiAgICBzZWxlY3RlZDogdHJ1ZVxuICB9LCB7XG4gICAgbmFtZTogJ0JHTScsXG4gICAgc2V0dGluZzogc2V0dGluZ3MuYmdtLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcbiAgICAgIGdhbWUuYmdtLnBsYXkoc2V0dGluZ3MuYmdtLnNlbGVjdGVkKTtcbiAgICB9LFxuICB9LCB7XG4gICAgbmFtZTogJ1N0YWdlJyxcbiAgICBzZXR0aW5nOiBzZXR0aW5ncy5zdGFnZSxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgY3ljbGVTZXR0aW5nLmNhbGwodGhpcyk7XG5cbiAgICAgIC8vIGlmIHN0YWdlIGhhcyBhIGRlZmF1bHQgYmdtLCBsb2FkIGl0XG4gICAgICB2YXIgc3RhZ2VzID0gcmVxdWlyZSgnLi9kYXRhL3N0YWdlcycpO1xuICAgICAgdmFyIHNlbGVjdGVkU3RhZ2UgPSBzdGFnZXNbc2V0dGluZ3Muc3RhZ2Uub3B0aW9ucy5pbmRleE9mKHNldHRpbmdzLnN0YWdlLnNlbGVjdGVkKV07XG4gICAgICBpZiAoc2VsZWN0ZWRTdGFnZS50aGVtZSkge1xuICAgICAgICBzZXR0aW5ncy5iZ20uc2VsZWN0ZWQgPSBzZWxlY3RlZFN0YWdlLnRoZW1lO1xuICAgICAgfVxuICAgICAgZ2FtZS5iZ20ucGxheShzZXR0aW5ncy5iZ20uc2VsZWN0ZWQpO1xuXG4gICAgICBzdGF0ZS5yZXN0YXJ0KCk7XG4gICAgfSxcbiAgfSwge1xuICAgIG5hbWU6ICdTdGFydCcsXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHN0YXRlLnJlc3RhcnQoKTtcbiAgICB9XG4gIH1dO1xuXG4gIHZhciBjaGFuZ2VQbGF5ZXJDb3VudCA9IG1lbnVbMF0uYWN0aW9uLmJpbmQobWVudVswXSk7XG4gIHZhciBjaGFuZ2VCZ20gPSBtZW51WzFdLmFjdGlvbi5iaW5kKG1lbnVbMV0pO1xuICB2YXIgY2hhbmdlU3RhZ2UgPSBtZW51WzJdLmFjdGlvbi5iaW5kKG1lbnVbMl0pO1xuICB2YXIgcmVzdGFydCA9IG1lbnVbM10uYWN0aW9uLmJpbmQobWVudVszXSk7XG5cbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLlApLm9uRG93bi5hZGQoY2hhbmdlUGxheWVyQ291bnQpO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuTSkub25Eb3duLmFkZChjaGFuZ2VTdGFnZSk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5CKS5vbkRvd24uYWRkKGNoYW5nZUJnbSk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5FTlRFUikub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5zdXBwb3J0ZWQgJiYgZ2FtZS5pbnB1dC5nYW1lcGFkLmFjdGl2ZSkge1xuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDIuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMi5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQzLmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkNC5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtZW51O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBidWlsZE1lbnU7XG4iLCJ2YXIgYmdtID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwbGF5ZXIgPSBuZXcgQ2hpcHR1bmVKc1BsYXllcihuZXcgQ2hpcHR1bmVKc0NvbmZpZygtMSkpO1xuXG4gIHJldHVybiB7XG4gICAgcGxheTogZnVuY3Rpb24oZmlsZU5hbWUpIHtcbiAgICAgIGlmIChmaWxlTmFtZSA9PT0gJ05vbmUnKSB7XG4gICAgICAgIHBsYXllci5zdG9wLmNhbGwocGxheWVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBsYXllci5sb2FkKCcuL211c2ljLycgKyBmaWxlTmFtZSArICcueG0nLCBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICBwbGF5ZXIucGxheShidWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJnbTtcbiIsInZhciBjcmVhdGVQbGF5ZXIgPSBmdW5jdGlvbiBjcmVhdGVQbGF5ZXIoZ2FtZSwgb3B0aW9ucywgb25EZWF0aCkge1xuICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgb3JpZW50YXRpb246ICdyaWdodCcsXG4gICAga2V5czoge1xuICAgICAgdXA6ICdVUCcsXG4gICAgICBkb3duOiAnRE9XTicsXG4gICAgICBsZWZ0OiAnTEVGVCcsXG4gICAgICByaWdodDogJ1JJR0hUJyxcbiAgICAgIGF0dGFjazogJ1NISUZUJ1xuICAgIH0sXG4gICAgc2NhbGU6IHtcbiAgICAgIHg6IDEsXG4gICAgICB5OiAyXG4gICAgfSxcbiAgICBjb2xvcjogJ3BpbmsnLFxuICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLFxuICB9O1xuXG4gIHZhciBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICB2YXIga2V5cyA9IHtcbiAgICB1cDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMudXBdKSxcbiAgICBkb3duOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5kb3duXSksXG4gICAgbGVmdDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMubGVmdF0pLFxuICAgIHJpZ2h0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5yaWdodF0pLFxuICAgIGF0dGFjazogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuYXR0YWNrXSksXG4gIH07XG5cbiAgdmFyIGdhbWVwYWQgPSBzZXR0aW5ncy5nYW1lcGFkO1xuXG4gIHZhciBhY3Rpb25zID0ge1xuICAgIGF0dGFjazogZnVuY3Rpb24gYXR0YWNrKCkge1xuICAgICAgdmFyIGR1cmF0aW9uID0gMjAwO1xuICAgICAgdmFyIGludGVydmFsID0gNjAwO1xuICAgICAgdmFyIHZlbG9jaXR5ID0gMTAwO1xuXG4gICAgICB2YXIgY2FuQXR0YWNrID0gKERhdGUubm93KCkgPiBwbGF5ZXIubGFzdEF0dGFja2VkICsgaW50ZXJ2YWwpICYmICFwbGF5ZXIuaXNEdWNraW5nICYmICFwbGF5ZXIuaXNQZXJtYWRlYWQ7XG4gICAgICBpZiAoIWNhbkF0dGFjaykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IHRydWU7XG4gICAgICBwbGF5ZXIubGFzdEF0dGFja2VkID0gRGF0ZS5ub3coKTtcblxuICAgICAgZ2FtZS5zZngucGxheSgnYXR0YWNrJyk7XG5cbiAgICAgIHN3aXRjaChwbGF5ZXIub3JpZW50YXRpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC12ZWxvY2l0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSB2ZWxvY2l0eTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKCd3aGl0ZScpO1xuICAgICAgc2V0VGltZW91dChhY3Rpb25zLmVuZEF0dGFjaywgZHVyYXRpb24pO1xuICAgIH0sXG5cbiAgICBlbmRBdHRhY2s6IGZ1bmN0aW9uIGVuZEF0dGFjaygpIHtcbiAgICAgIGlmIChwbGF5ZXIuYWxpdmUgJiYgcGxheWVyLmlzQXR0YWNraW5nKSB7XG4gICAgICAgIHBsYXllci5sb2FkVGV4dHVyZShzZXR0aW5ncy5jb2xvcik7XG4gICAgICAgIHBsYXllci5pc0F0dGFja2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uIHJ1bihkaXJlY3Rpb24pIHtcbiAgICAgIHZhciBtYXhTcGVlZCA9IDMyO1xuICAgICAgdmFyIGFjY2VsZXJhdGlvbiA9IHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gPyA4IDogMzsgLy8gcGxheWVycyBoYXZlIGxlc3MgY29udHJvbCBpbiB0aGUgYWlyXG4gICAgICBwbGF5ZXIub3JpZW50YXRpb24gPSBkaXJlY3Rpb247XG5cbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIC8vIGlmIHBsYXllciBpcyBnb2luZyBmYXN0ZXIgdGhhbiBtYXggcnVubmluZyBzcGVlZCAoZHVlIHRvIGF0dGFjaywgZXRjKSwgc2xvdyB0aGVtIGRvd24gb3ZlciB0aW1lXG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPCAtbWF4U3BlZWQpIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKz0gYWNjZWxlcmF0aW9uO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gTWF0aC5tYXgocGxheWVyLmJvZHkudmVsb2NpdHkueCAtIGFjY2VsZXJhdGlvbiwgLW1heFNwZWVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA+IG1heFNwZWVkKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWluKHBsYXllci5ib2R5LnZlbG9jaXR5LnggKyBhY2NlbGVyYXRpb24sIG1heFNwZWVkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGp1bXA6IGZ1bmN0aW9uIGp1bXAoKSB7XG4gICAgICBpZiAoIXBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24gJiYgIXBsYXllci5ib2R5LnRvdWNoaW5nLmxlZnQgJiYgIXBsYXllci5ib2R5LnRvdWNoaW5nLnJpZ2h0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGR1c3Q7XG5cbiAgICAgIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMTAwO1xuICAgICAgICBnYW1lLnNmeC5wbGF5KCdqdW1wJyk7XG4gICAgICAgIGR1c3QgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2p1bXAnKTtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi54ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueCAtIDQ7XG4gICAgICAgIGR1c3QucG9zaXRpb24ueSA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnkgKyBwbGF5ZXIuYm9keS5oZWlnaHQgLSAyO1xuICAgICAgLy8gd2FsbCBqdW1wc1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5sZWZ0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMTIwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gNDU7XG4gICAgICAgIGdhbWUuc2Z4LnBsYXkoJ2p1bXAnKTtcbiAgICAgICAgZHVzdCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnbGFuZCcpO1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnggPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi54ICsgMjtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi55ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueSAtIHBsYXllci5ib2R5LmhlaWdodDtcbiAgICAgICAgZHVzdC5hbmdsZSA9IDkwO1xuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5yaWdodCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEyMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IC00NTtcbiAgICAgICAgZ2FtZS5zZngucGxheSgnanVtcCcpO1xuICAgICAgICBkdXN0ID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsYW5kJyk7XG4gICAgICAgIGR1c3QucG9zaXRpb24ueCA9IHBsYXllci5ib2R5LnBvc2l0aW9uLng7XG4gICAgICAgIGR1c3QucG9zaXRpb24ueSA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnkgKyBwbGF5ZXIuYm9keS5oZWlnaHQ7XG4gICAgICAgIGR1c3QuYW5nbGUgPSAtOTA7XG4gICAgICB9XG5cbiAgICAgIGdhbWUuc3ViVWkuZnguYWRkKGR1c3QpOyAvLyBtb3VudCBiZWxvdyBmb3JlZ3JvdW5kICYgdWlcbiAgICAgIHZhciBhbmltID0gZHVzdC5hbmltYXRpb25zLmFkZCgnZHVzdCcpO1xuICAgICAgZHVzdC5hbmltYXRpb25zLnBsYXkoJ2R1c3QnLCAzMi8zKTtcbiAgICAgIGFuaW0ub25Db21wbGV0ZS5hZGQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGR1c3Qua2lsbCgpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIGRhbXBlbkp1bXA6IGZ1bmN0aW9uIGRhbXBlbkp1bXAoKSB7XG4gICAgICAvLyBzb2Z0ZW4gdXB3YXJkIHZlbG9jaXR5IHdoZW4gcGxheWVyIHJlbGVhc2VzIGp1bXAga2V5XG4gICAgICAgIHZhciBkYW1wZW5Ub1BlcmNlbnQgPSAwLjU7XG5cbiAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSAqPSBkYW1wZW5Ub1BlcmNlbnQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHVjazogZnVuY3Rpb24gZHVjaygpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNBdHRhY2tpbmcgfHwgcGxheWVyLmlzUGVybWFkZWFkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwbGF5ZXIuaXNEdWNraW5nICYmIHBsYXllci5ocCA+IDIpIHtcbiAgICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkgLyAyKTtcbiAgICAgICAgYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG4gICAgICAgIHBsYXllci55ICs9IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICB9XG4gICAgICBwbGF5ZXIuaXNEdWNraW5nID0gdHJ1ZTtcblxuICAgICAgKGZ1bmN0aW9uIHJvbGwoKSB7XG4gICAgICAgIHZhciBjYW5Sb2xsID0gTWF0aC5hYnMocGxheWVyLmJvZHkudmVsb2NpdHkueCkgPiAyNSAmJiBwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duO1xuICAgICAgICBpZiAoY2FuUm9sbCkge1xuICAgICAgICAgIHBsYXllci5pc1JvbGxpbmcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KCkpO1xuICAgIH0sXG5cbiAgICBzdGFuZDogZnVuY3Rpb24gc3RhbmQoKSB7XG4gICAgICBpZiAocGxheWVyLmhwID4gMikge1xuICAgICAgICBwbGF5ZXIueSAtPSBzZXR0aW5ncy5zY2FsZS55O1xuICAgICAgfVxuICAgICAgYWN0aW9ucy5hcHBseUhlYWx0aEVmZmVjdHMoKTtcbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSBmYWxzZTtcbiAgICAgIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgdGFrZURhbWFnZTogZnVuY3Rpb24gdGFrZURhbWFnZShhbW91bnQpIHtcbiAgICAgIC8vIHByZXZlbnQgdGFraW5nIG1vcmUgZGFtYWdlIHRoYW4gaHAgcmVtYWluaW5nIGluIGN1cnJlbnQgbGlmZVxuICAgICAgaWYgKGFtb3VudCA+IDEgJiYgKHBsYXllci5ocCAtIGFtb3VudCkgJSAyICE9PSAwKSB7XG4gICAgICAgIGFtb3VudCA9IDE7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5ocCAtPSBhbW91bnQ7XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPCAwKSB7XG4gICAgICAgIHBsYXllci5ocCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAocGxheWVyLmhwICUgMiA9PT0gMCkge1xuICAgICAgICBhY3Rpb25zLmRpZSgpO1xuICAgICAgfVxuICAgICAgYWN0aW9ucy5hcHBseUhlYWx0aEVmZmVjdHMoKTtcbiAgICB9LFxuXG4gICAgYXBwbHlIZWFsdGhFZmZlY3RzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuZXdQbGF5ZXJIZWlnaHQgPSBNYXRoLm1heChNYXRoLnJvdW5kKHBsYXllci5ocCAvIDIpLCAxKTtcbiAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBuZXdQbGF5ZXJIZWlnaHQpO1xuICAgICAgYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPT09IDApIHtcbiAgICAgICAgcmV0dXJuOyAvLyBiaXQncyBiZWNvbWluZyBhIGdob3N0OyBsZWF2ZXMgaXRzIHNjYXJmIChvciBsYWNrIHRoZXJlb2YpIGFsb25lXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ocCAlIDIgPT09IDEpIHtcbiAgICAgICAgaWYgKHBsYXllci5zY2FyZi5hbmltYXRpb24ubmFtZSAhPT0gJ2Rpc2ludGVncmF0ZScpIHsgLy8gb25seSBkaXNpbnRlZ3JhdGUgaXQgaGFzbid0IGFscmVhZHlcbiAgICAgICAgICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9uID0gcGxheWVyLnNjYXJmLmFuaW1hdGlvbnMucGxheSgnZGlzaW50ZWdyYXRlJywgMzIvMywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9uID0gcGxheWVyLnNjYXJmLmFuaW1hdGlvbnMucGxheSgnZmxhcCcsIDMyLzMsIHRydWUpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBhcHBseU9yaWVudGF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhwbGF5ZXIub3JpZW50YXRpb24gPT09ICdsZWZ0JyA/IHNldHRpbmdzLnNjYWxlLnggOiAtc2V0dGluZ3Muc2NhbGUueCwgcGxheWVyLnNjYWxlLnkpO1xuICAgIH0sXG5cbiAgICBkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5pc1Blcm1hZGVhZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAwKSB7XG4gICAgICAgIGFjdGlvbnMuYXBwbHlJbnZ1bG5lcmFiaWxpdHkoKTtcblxuICAgICAgICBnYW1lLnNmeC5wbGF5KCdkaWUnKTtcbiAgICAgICAgYWN0aW9ucy5lbmRBdHRhY2soKTtcbiAgICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IDA7XG5cbiAgICAgICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICAgICAgICB2YXIgcmVzcGF3blBvc2l0aW9uID0gdXRpbHMuZ2V0UmFuZG9tQXJyYXlFbGVtZW50KHV0aWxzLmdldFN0YWdlKCkuc3Bhd25Qb2ludHMpO1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueCA9IHJlc3Bhd25Qb3NpdGlvbi54O1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueSA9IHJlc3Bhd25Qb3NpdGlvbi55O1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnYW1lLnNmeC5wbGF5KCdwZXJtYWRpZScpO1xuICAgICAgICBwbGF5ZXIuYWxwaGEgPSAwLjU7XG4gICAgICAgIHBsYXllci5pc1Blcm1hZGVhZCA9IHRydWU7XG4gICAgICAgIG9uRGVhdGgoKTsgLy8gVE9ETzogdGhpcyBjb3VsZCBwcm9iYWJseSBiZSBiZXR0ZXIgYXJjaGl0ZWN0ZWRcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXBwbHlJbnZ1bG5lcmFiaWxpdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuXG4gICAgICB2YXIgc2V0Q29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAvLyBpbiBjYXNlIGdhbWUgcmVzdGFydHMgYW5kIHBsYXllciBubyBsb25nZXIgZXhpc3RzLi4uXG4gICAgICAgIGlmICghcGxheWVyLmFsaXZlKSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChjb2xvckludGVydmFsKTtcbiAgICAgICAgICBjbGVhckludGVydmFsKHdoaXRlSW50ZXJ2YWwpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIubG9hZFRleHR1cmUoY29sb3IpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGNvbG9ySW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0Q29sb3Ioc2V0dGluZ3MuY29sb3IpO1xuICAgICAgfSwgMTUwKTtcbiAgICAgIHZhciB3aGl0ZUludGVydmFsO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgd2hpdGVJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNldENvbG9yKCd3aGl0ZScpO1xuICAgICAgICB9LCAxNTApO1xuICAgICAgfSwgNzUpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXBsYXllci5hbGl2ZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjbGVhckludGVydmFsKHdoaXRlSW50ZXJ2YWwpO1xuICAgICAgICBjbGVhckludGVydmFsKGNvbG9ySW50ZXJ2YWwpO1xuICAgICAgICBzZXRDb2xvcihzZXR0aW5ncy5jb2xvcik7IC8vIGVuc3VyZSBwbGF5ZXIgY29sb3IgcmV0dXJucyB0byBub3JtYWxcbiAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICB9LCAxNTAwKTtcbiAgICB9LFxuICB9O1xuXG4gIHZhciBwbGF5ZXIgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgc2V0dGluZ3MuY29sb3IpO1xuICBwbGF5ZXIubmFtZSA9IHNldHRpbmdzLm5hbWU7XG4gIHBsYXllci5vcmllbnRhdGlvbiA9IHNldHRpbmdzLm9yaWVudGF0aW9uO1xuICBwbGF5ZXIuYW5jaG9yLnNldFRvKDAuNSwgMC41KTsgLy8gYW5jaG9yIHRvIGNlbnRlciB0byBhbGxvdyBmbGlwcGluZ1xuXG4gIHBsYXllci5zY2FyZiA9IGdhbWUuYWRkLnNwcml0ZSgtMSwgLTEsIHNldHRpbmdzLmNvbG9yICsgJ1NjYXJmJyk7XG4gIHBsYXllci5zY2FyZi5hbmltYXRpb25zLmFkZCgnZmxhcCcsIFswLCAxLCAyLCAzLCA0LCA1XSk7XG4gIHBsYXllci5zY2FyZi5hbmltYXRpb25zLmFkZCgnZGlzaW50ZWdyYXRlJywgWzcsIDgsIDksIDEwLCAxMSwgNl0pO1xuICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9uID0gcGxheWVyLnNjYXJmLmFuaW1hdGlvbnMucGxheSgnZmxhcCcsIDMyLzMsIHRydWUpO1xuICBwbGF5ZXIuc2NhcmYuc2V0U2NhbGVNaW5NYXgoLTEsIDEsIDEsIDEpO1xuICBwbGF5ZXIuYWRkQ2hpbGQocGxheWVyLnNjYXJmKTtcblxuICAvLyB0cmFjayBoZWFsdGhcbiAgcGxheWVyLmhwID0gcGxheWVyLm1heEhwID0gNjsgLy8gVE9ETzogYWxsb3cgc2V0dGluZyBjdXN0b20gaHAgYW1vdW50IGZvciBlYWNoIHBsYXllclxuICBwbGF5ZXIuYWN0aW9ucyA9IGFjdGlvbnM7XG4gIHBsYXllci5hY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpOyAvLyBUT0RPOiBhZGQgZ2lhbnQgbW9kZVxuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHBsYXllcik7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5ib2R5LmJvdW5jZS55ID0gMC4yOyAvLyBUT0RPOiBhbGxvdyBib3VuY2UgY29uZmlndXJhdGlvblxuXG4gIC8vIGlmIHN0YWdlIGhhcyBhIGdyYXZpdHkgc2V0dGluZywgdXNlIHRoYXRcbiAgdmFyIGdhbWVTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZGF0YS9zZXR0aW5ncycpO1xuICB2YXIgc3RhZ2VzID0gcmVxdWlyZSgnLi9kYXRhL3N0YWdlcycpO1xuICB2YXIgc2VsZWN0ZWRTdGFnZSA9IHN0YWdlc1tnYW1lU2V0dGluZ3Muc3RhZ2Uub3B0aW9ucy5pbmRleE9mKGdhbWVTZXR0aW5ncy5zdGFnZS5zZWxlY3RlZCldO1xuICBpZiAoc2VsZWN0ZWRTdGFnZS5ncmF2aXR5KSB7XG4gICAgcGxheWVyLmJvZHkuZ3Jhdml0eS55ID0gc2VsZWN0ZWRTdGFnZS5ncmF2aXR5O1xuICB9IGVsc2Uge1xuICAgIHBsYXllci5ib2R5LmdyYXZpdHkueSA9IDM4MDtcbiAgfVxuXG4gIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTsgLy8gdHJhY2sgaW5wdXQgY2hhbmdlIGZvciB2YXJpYWJsZSBqdW1wIGhlaWdodFxuICBwbGF5ZXIuaXNGYWxsaW5nID0gZmFsc2U7XG4gIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzUGVybWFkZWFkID0gZmFsc2U7XG4gIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuICAvLyBwaGFzZXIgYXBwYXJlbnRseSBhdXRvbWF0aWNhbGx5IGNhbGxzIGFueSBmdW5jdGlvbiBuYW1lZCB1cGRhdGUgYXR0YWNoZWQgdG8gYSBzcHJpdGUhXG4gIHBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBraWxsIHBsYXllciBpZiBoZSBmYWxscyBvZmYgdGhlIHNjcmVlblxuICAgIGlmIChwbGF5ZXIucG9zaXRpb24ueSA+IDY0ICYmIHBsYXllci5ocCAhPT0gMCkgeyAvLyBUT0RPOiBob3cgdG8gYWNjZXNzIG5hdGl2ZSBoZWlnaHQgZnJvbSBnYW1lLmpzP1xuICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDIpO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID4gODUpIHtcbiAgICAgIHBsYXllci5pc0ZhbGxpbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIHBsYXllci5zY2FyZi5hbmltYXRpb24uc3BlZWQgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSAqIDAuNzUgKyAzMi8zO1xuXG4gICAgdmFyIGlucHV0ID0ge1xuICAgICAgbGVmdDogICAoa2V5cy5sZWZ0LmlzRG93biAmJiAha2V5cy5yaWdodC5pc0Rvd24pIHx8XG4gICAgICAgICAgICAgIChnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfTEVGVCkgJiYgIWdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9SSUdIVCkpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWCkgPCAtMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1gpIDwgLTAuMSxcbiAgICAgIHJpZ2h0OiAgKGtleXMucmlnaHQuaXNEb3duICYmICFrZXlzLmxlZnQuaXNEb3duKSB8fFxuICAgICAgICAgICAgICAoZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1JJR0hUKSAmJiAhZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0xFRlQpKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1gpID4gMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1gpID4gMC4xLFxuICAgICAgdXA6ICAgICBrZXlzLnVwLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfVVApIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfQSksXG4gICAgICBkb3duOiAgIGtleXMuZG93bi5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0RPV04pIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWSkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWSkgPiAwLjEsXG4gICAgICBhdHRhY2s6IGtleXMuYXR0YWNrLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1kpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9CKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfTEVGVF9CVU1QRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX1RSSUdHRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9SSUdIVF9CVU1QRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9SSUdIVF9UUklHR0VSKSxcbiAgICB9O1xuXG4gICAgaWYgKGlucHV0LmxlZnQpIHtcbiAgICAgIGFjdGlvbnMucnVuKCdsZWZ0Jyk7XG4gICAgICBwbGF5ZXIuYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChpbnB1dC5yaWdodCkge1xuICAgICAgYWN0aW9ucy5ydW4oJ3JpZ2h0Jyk7XG4gICAgICBwbGF5ZXIuYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmICFwbGF5ZXIuaXNSb2xsaW5nKSB7XG4gICAgICAvLyBhcHBseSBmcmljdGlvblxuICAgICAgaWYgKE1hdGguYWJzKHBsYXllci5ib2R5LnZlbG9jaXR5LngpIDwgMikge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICo9IDAuNTsgLy8gcXVpY2tseSBicmluZyBzbG93LW1vdmluZyBwbGF5ZXJzIHRvIGEgc3RvcFxuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID4gMCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IDI7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPCAwKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKz0gMjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5wdXQudXApIHtcbiAgICAgIHBsYXllci51cFdhc0Rvd24gPSB0cnVlO1xuICAgICAgYWN0aW9ucy5qdW1wKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIudXBXYXNEb3duKSB7XG4gICAgICBwbGF5ZXIudXBXYXNEb3duID0gZmFsc2U7XG4gICAgICBhY3Rpb25zLmRhbXBlbkp1bXAoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuZG93bikge1xuICAgICAgYWN0aW9ucy5kdWNrKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIuaXNEdWNraW5nKSB7XG4gICAgICBhY3Rpb25zLnN0YW5kKCk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmF0dGFjaykge1xuICAgICAgYWN0aW9ucy5hdHRhY2soKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHBsYXllcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUGxheWVyO1xuIiwiLyoqXG4gKiBFYWNoIHRpbWUgYSB1bmlxdWUgc291bmQgZmlsZW5hbWUgaXMgcGFzc2VkIGluLCBhIG5ldyBpbnN0YW5jZSBvZiBjaGlwdHVuZS5qcyB3aWxsIGJlIGNyZWF0ZWQgd2l0aCB0aGF0IHNvdW5kIGFzIGEgYnVmZmVyLlxuICogSWYgdGhlIHBsYXkgbWV0aG9kIGlzIGNhbGxlZCBvbiBzb3VuZCBmaWxlIHBhc3NlZCBpbiBwcmV2aW91c2x5LCBpdHMgcmVzcGVjdGl2ZSBpbnN0YW5jZSB3aWxsIHBsYXkgdGhlIGV4aXN0aW5nIGJ1ZmZlci5cbiAqIFRoaXMgZW5zdXJlcyB0aGUgZmlsZSBzeXN0ZW0gaXMgb25seSBoaXQgb25jZSBwZXIgc291bmQsIGFzIG5lZWRlZC5cbiAqIEl0IHdpbGwgYWxzbyBwcmV2ZW50IHNvdW5kcyBmcm9tICdzdGFja2luZycgLS0gdGhlIHNhbWUgc291bmQgcGxheWVkIHJlcGVhdGVkbHkgd2lsbCBpbnRlcnJ1cHQgaXRzZWxmIGVhY2ggdGltZS5cbiAqL1xudmFyIHNmeCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc291bmRiYW5rID0ge307XG5cbiAgcmV0dXJuIHtcbiAgICBwbGF5OiBmdW5jdGlvbihmaWxlTmFtZSkge1xuICAgICAgaWYgKHNvdW5kYmFua1tmaWxlTmFtZV0pIHtcbiAgICAgICAgc291bmRiYW5rW2ZpbGVOYW1lXS5wbGF5KHNvdW5kYmFua1tmaWxlTmFtZV0uYnVmZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0gPSBuZXcgQ2hpcHR1bmVKc1BsYXllcihuZXcgQ2hpcHR1bmVKc0NvbmZpZygwKSk7XG4gICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0ubG9hZCgnLi9zZngvJyArIGZpbGVOYW1lICsgJy54bScsIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0uYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0ucGxheShidWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNmeDtcbiIsInZhciBzdGFnZUJ1aWxkZXIgPSBmdW5jdGlvbiBzdGFnZUJ1aWxkZXIoZ2FtZSkge1xuICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MnKTtcbiAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICB2YXIgc3RhZ2UgPSB1dGlscy5nZXRTdGFnZSgpO1xuXG4gIGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gc3RhZ2UuYmFja2dyb3VuZENvbG9yO1xuXG4gIHZhciBidWlsZFBsYXRmb3JtcyA9IGZ1bmN0aW9uIGJ1aWxkUGxhdGZvcm1zKCkge1xuICAgIHZhciBwbGF0Zm9ybXMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICAgIHBsYXRmb3Jtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcblxuICAgIHZhciBwbGF0Zm9ybVBvc2l0aW9ucyA9IHN0YWdlLnBsYXRmb3Jtcy5wb3NpdGlvbnM7XG4gICAgcGxhdGZvcm1Qb3NpdGlvbnMuZm9yRWFjaChmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgdmFyIHBsYXRmb3JtID0gcGxhdGZvcm1zLmNyZWF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sIHN0YWdlLnBsYXRmb3Jtcy5jb2xvcik7XG4gICAgICBwbGF0Zm9ybS5zY2FsZS5zZXRUbyg1LCAxKTtcbiAgICAgIHBsYXRmb3JtLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHZhciB3YWxscyA9IFtdO1xuICAgIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgtMywgLTEyLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpKTtcbiAgICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoNjEsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKSk7XG4gICAgd2FsbHMuZm9yRWFjaChmdW5jdGlvbih3YWxsKSB7XG4gICAgICB3YWxsLnNjYWxlLnNldFRvKDMsIDM4KTtcbiAgICAgIHdhbGwuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIH0pO1xuXG4gICAgdmFyIGNlaWxpbmcgPSBwbGF0Zm9ybXMuY3JlYXRlKDAsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKTtcbiAgICBjZWlsaW5nLnNjYWxlLnNldFRvKDMyLCAzKTtcbiAgICBjZWlsaW5nLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICBcbiAgICByZXR1cm4gcGxhdGZvcm1zO1xuICB9O1xuXG4gIHZhciBidWlsZExheWVyID0gZnVuY3Rpb24gYnVpbGRMYXllcihzdWJsYXllcnMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGF5ZXIgPSBnYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgICBzdWJsYXllcnMuZm9yRWFjaChmdW5jdGlvbihzdWJsYXllcikge1xuICAgICAgICB2YXIgYmc7XG5cbiAgICAgICAgaWYgKHN1YmxheWVyLnNjcm9sbGluZykge1xuICAgICAgICAgIGJnID0gZ2FtZS5hZGQudGlsZVNwcml0ZSgwLCAwLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCwgc3VibGF5ZXIuaW1hZ2UpO1xuICAgICAgICAgIGxheWVyLmxvb3AgPSBnYW1lLnRpbWUuZXZlbnRzLmxvb3AoUGhhc2VyLlRpbWVyLlFVQVJURVIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYmcudGlsZVBvc2l0aW9uLnggLT0xO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJnID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIHN1YmxheWVyLmltYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdWJsYXllci5hbmltYXRlZCkge1xuICAgICAgICAgIGlmIChzdWJsYXllci5mcmFtZXMpIHtcbiAgICAgICAgICAgIGJnLmFuaW1hdGlvbnMuYWRkKCdiZycsIHN1YmxheWVyLmZyYW1lcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJnLmFuaW1hdGlvbnMuYWRkKCdiZycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBiZy5hbmltYXRpb25zLnBsYXkoJ2JnJywgc3VibGF5ZXIuYW5pbVNwZWVkIHx8IDMyLzMsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN1YmxheWVyLnB1bHNlKSB7XG4gICAgICAgICAgdmFyIHJlcGVhdCA9IC0xO1xuICAgICAgICAgIHZhciBhdXRvc3RhcnQgPSB0cnVlO1xuICAgICAgICAgIHZhciB5b3lvID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgZHVyYXRpb24gPSBzdWJsYXllci5wdWxzZUR1cmF0aW9uIHx8IDIwMDA7XG4gICAgICAgICAgdmFyIGRlbGF5ID0gc3VibGF5ZXIucHVsc2VEZWxheSB8fCAwO1xuICAgICAgICAgIHZhciBtaW5BbHBoYSA9IHN1YmxheWVyLm1pbkFscGhhIHx8IDA7XG4gICAgICAgICAgZ2FtZS5hZGQudHdlZW4oYmcpLnRvKHsgYWxwaGE6IG1pbkFscGhhIH0sIGR1cmF0aW9uLCBQaGFzZXIuRWFzaW5nLkxpbmVhci5Ob25lLCBhdXRvc3RhcnQsIGRlbGF5LCByZXBlYXQsIHlveW8pO1xuICAgICAgICB9XG5cbiAgICAgICAgYmcuYWxwaGEgPSBzdWJsYXllci5hbHBoYSB8fCAxO1xuXG4gICAgICAgIGxheWVyLmFkZChiZyk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGxheWVyO1xuICAgIH07XG4gIH07XG4gIFxuICByZXR1cm4ge1xuICAgIGJ1aWxkUGxhdGZvcm1zOiBidWlsZFBsYXRmb3JtcyxcbiAgICBidWlsZEZvcmVncm91bmRzOiBidWlsZExheWVyKHN0YWdlLmZvcmVncm91bmRzKSxcbiAgICBidWlsZEJhY2tncm91bmRzOiBidWlsZExheWVyKHN0YWdlLmJhY2tncm91bmRzKSxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VCdWlsZGVyO1xuIiwidmFyIExvYWRpbmcgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBsb2FkaW5nID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxvYWRpbmcgPSBnYW1lLmFkZC5zcHJpdGUoMjYsIDI5LCAnbG9hZGluZycpO1xuICAgICAgbG9hZGluZy5hbmltYXRpb25zLmFkZCgnbG9hZGluZycpO1xuICAgICAgbG9hZGluZy5hbmltYXRpb25zLnBsYXkoJ2xvYWRpbmcnKTtcblxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmcnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH0sXG5cbiAgICBwcmVsb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIHVpXG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3RpdGxlJywgJ2ltYWdlcy9zcHJpdGVzL3VpLXRpdGxlLmdpZicsIDY0LCA2NCk7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3ZpY3RvcnlNc2cnLCAnaW1hZ2VzL3Nwcml0ZXMvdWktd2lubmVyLmdpZicsIDUyLCAyMik7XG4gICAgICAvLyBiaXRzXG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2JsdWVTY2FyZicsICdpbWFnZXMvc3ByaXRlcy9iaXQtc2NhcmYtYmx1ZS5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgncGlua1NjYXJmJywgJ2ltYWdlcy9zcHJpdGVzL2JpdC1zY2FyZi1waW5rLmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdncmVlblNjYXJmJywgJ2ltYWdlcy9zcHJpdGVzL2JpdC1zY2FyZi1ncmVlbi5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgncHVycGxlU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXMvYml0LXNjYXJmLXB1cnBsZS5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnanVtcCcsICdpbWFnZXMvc3ByaXRlcy9iaXQtanVtcC5naWYnLCAxMCwgMik7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2xhbmQnLCAnaW1hZ2VzL3Nwcml0ZXMvYml0LWxhbmQuZ2lmJywgMTAsIDIpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdjbGVhcicsICdpbWFnZXMvY29sb3JzL2NsZWFyLmdpZicpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCd3aGl0ZScsICdpbWFnZXMvY29sb3JzL3doaXRlLmdpZicpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdibHVlJywgJ2ltYWdlcy9jb2xvcnMvYmx1ZS5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgncGluaycsICdpbWFnZXMvY29sb3JzL3BpbmsuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2dyZWVuJywgJ2ltYWdlcy9jb2xvcnMvZ3JlZW4uZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3B1cnBsZScsICdpbWFnZXMvY29sb3JzL3B1cnBsZS5naWYnKTtcbiAgICAgIC8vIGZvcmVzdFxuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdmb3Jlc3QnLCAnaW1hZ2VzL2FyZW5hcy9mb3Jlc3Qtc3VtbWVyLmdpZicpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdmb3Jlc3RCZzEnLCAnaW1hZ2VzL2FyZW5hcy9mb3Jlc3QtYmcxLmdpZicpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdmb3Jlc3RCZzInLCAnaW1hZ2VzL2FyZW5hcy9mb3Jlc3QtYmcyLmdpZicpO1xuICAgICAgLy8gdG9tYlxuICAgICAgZ2FtZS5sb2FkLmltYWdlKCd0b21iJywgJ2ltYWdlcy9hcmVuYXMvdG9tYi13YXJtLmdpZicpO1xuICAgICAgLy8gd2F0ZXJmYWxsXG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3dhdGVyZmFsbCcsICdpbWFnZXMvYXJlbmFzL3dhdGVyZmFsbC5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnd2F0ZXJmYWxsQW5pbScsICdpbWFnZXMvYXJlbmFzL3dhdGVyZmFsbC1hbmltLmdpZicsIDY0LCA2NCk7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3dhdGVyZmFsbEZnJywgJ2ltYWdlcy9hcmVuYXMvd2F0ZXJmYWxsLWZnLWFuaW0uZ2lmJywgNjQsIDY0KTtcbiAgICAgIC8vIGhhbmdhclxuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdoYW5nYXInLCAnaW1hZ2VzL2FyZW5hcy9oYW5nYXIuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2hhbmdhckJnJywgJ2ltYWdlcy9hcmVuYXMvaGFuZ2FyLWJnLmdpZicsIDY0LCA2NCk7XG5cbiAgICAgIC8vIHNvdW5kXG4gICAgICBnYW1lLmJnbSA9IHJlcXVpcmUoJy4uL211c2ljJykoKTtcbiAgICAgIGdhbWUuc2Z4ID0gcmVxdWlyZSgnLi4vc2Z4JykoKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5zdGFydCgpO1xuXG4gICAgICBnYW1lLnN0YXRlLmFkZCgnc3BsYXNoJywgcmVxdWlyZSgnLi9zcGxhc2gnKShnYW1lKSk7XG4gICAgICBnYW1lLnN0YXRlLmFkZCgncGxheScsIHJlcXVpcmUoJy4vcGxheScpKGdhbWUpKTtcbiAgICAgIGdhbWUuc3RhdGUuc3RhcnQoJ3NwbGFzaCcpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBsb2FkaW5nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nO1xuIiwidmFyIFBsYXkgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBwbGF5ID0ge1xuICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBnYW1lLnN1YlVpID0gZ2FtZS5hZGQuZ3JvdXAoKTsgLy8gcGxhY2UgdG8ga2VlcCBhbnl0aGluZyBvbi1zY3JlZW4gdGhhdCdzIG5vdCBVSSB0byBkZXB0aCBzb3J0IGJlbG93IFVJXG5cbiAgICAgIC8vIGdhbWUgb3ZlciB2aWN0b3J5IG1lc3NhZ2UgZGVjbGFyaW5nIHRoZSB3aW5uZXJcbiAgICAgIHNlbGYudmljdG9yeU1zZyA9IGdhbWUuYWRkLnNwcml0ZSg2LCAyMSwgJ3ZpY3RvcnlNc2cnKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy52aXNpYmxlID0gZmFsc2U7XG4gICAgICBzZWxmLnZpY3RvcnlNc2cuYW5pbWF0aW9ucy5hZGQoJ0JsdWUnLCBbMCwgNCwgOCwgMTJdLCAzMi8zLCB0cnVlKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnUGluaycsIFsxLCA1LCA5LCAxM10sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdHcmVlbicsIFsyLCA2LCAxMCwgMTRdLCAzMi8zLCB0cnVlKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnUHVycGxlJywgWzMsIDcsIDExLCAxNV0sIDMyLzMsIHRydWUpO1xuXG4gICAgICBzZWxmLnRpbWVvdXRzID0gW107IC8vIHN0b3JlIGdhbWUgdGltZW91dHMgdG8gY2FuY2VsIGlmIGdhbWUgcmVzdGFydHNcblxuICAgICAgLy8gbWVudVxuICAgICAgdmFyIGJ1aWxkTWVudSA9IHJlcXVpcmUoJy4uL21lbnUnKTtcbiAgICAgIGJ1aWxkTWVudShnYW1lLCBzZWxmKTsgLy8gVE9ETzogaXMgdGhlcmUgYSBiZXR0ZXIgYXBwcm9hY2ggdGhhbiBpbmplY3RpbmcgdGhlIHdob2xlIHN0YXRlIGludG8gdGhlIG1lbnUgdG8gbGV0IGl0IGFjY2VzcyBmdW5jdGlvbnMgZm9yIHJlc2V0dGluZyBzdGFnZSwgcGxheWVycywgbXVzaWM/XG5cbiAgICAgIHNlbGYucmVzdGFydCgpO1xuICAgICAgZ2FtZS5waHlzaWNzLnN0YXJ0U3lzdGVtKFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQuc3RhcnQoKTtcblxuICAgICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vZGF0YS9zZXR0aW5ncycpXG4gICAgICBnYW1lLmJnbS5wbGF5KHNldHRpbmdzLmJnbS5zZWxlY3RlZCk7XG4gICAgfSxcblxuICAgIHJlc3RhcnQ6IGZ1bmN0aW9uIHJlc3RhcnQoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGxheWVycyA9IHJlcXVpcmUoJy4uL2RhdGEvcGxheWVycycpKGdhbWUpO1xuICAgICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vZGF0YS9zZXR0aW5ncycpO1xuICAgICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbiAgICAgIHZhciBzdGFnZUJ1aWxkZXIgPSByZXF1aXJlKCcuLi9zdGFnZUJ1aWxkZXInKShnYW1lKTtcbiAgICAgIHZhciBzdGFnZSA9IHV0aWxzLmdldFN0YWdlKCk7XG5cbiAgICAgIC8vIGNhbmNlbCBhbnkgdGltZW91dHMgZnJvbSB0aGUgbGFzdCBnYW1lXG4gICAgICBzZWxmLnRpbWVvdXRzLmZvckVhY2goZnVuY3Rpb24odGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gZGVzdHJveSBhbmQgcmVidWlsZCBzdGFnZSBhbmQgcGxheWVyc1xuICAgICAgdmFyIGRlc3Ryb3lHcm91cCA9IGZ1bmN0aW9uIGRlc3Ryb3lHcm91cChncm91cCkge1xuICAgICAgICBpZiAoIWdyb3VwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGdyb3VwLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBncm91cC5jaGlsZHJlblswXS5kZXN0cm95KCk7XG4gICAgICAgIH1cblxuICAgICAgICBncm91cC5kZXN0cm95KCk7XG4gICAgICB9XG5cbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLnBsYXllcnMpO1xuICAgICAgZGVzdHJveUdyb3VwKHNlbGYucGxhdGZvcm1zKTtcbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLmJhY2tncm91bmRzKTtcbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLmZvcmVncm91bmRzKTtcblxuICAgICAgLy8gVE9ETzogdWdoLCBjbGVhbiB0aGlzIHVwIVxuICAgICAgaWYgKHNlbGYuYmFja2dyb3VuZHMgJiYgc2VsZi5iYWNrZ3JvdW5kcy5sb29wKSB7XG4gICAgICAgIGdhbWUudGltZS5ldmVudHMucmVtb3ZlKHNlbGYuYmFja2dyb3VuZHMubG9vcCk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5mb3JlZ3JvdW5kcyAmJiBzZWxmLmZvcmVncm91bmRzLmxvb3ApIHtcbiAgICAgICAgZ2FtZS50aW1lLmV2ZW50cy5yZW1vdmUoc2VsZi5mb3JlZ3JvdW5kcy5sb29wKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5wbGF0Zm9ybXMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRQbGF0Zm9ybXMoKTtcbiAgICAgIHNlbGYuYmFja2dyb3VuZHMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRCYWNrZ3JvdW5kcygpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoc2VsZi5iYWNrZ3JvdW5kcyk7XG5cbiAgICAgIHNlbGYucGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICBnYW1lLnN1YlVpLmFkZChzZWxmLnBsYXllcnMpO1xuXG4gICAgICBnYW1lLnN1YlVpLmZ4ID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgICAgIGdhbWUuc3ViVWkuYWRkKGdhbWUuc3ViVWkuZngpO1xuXG4gICAgICB2YXIgYWRkUGxheWVyID0gZnVuY3Rpb24gYWRkUGxheWVyKHBsYXllcikge1xuICAgICAgICB2YXIgY2hlY2tGb3JHYW1lT3ZlciA9IGZ1bmN0aW9uIGNoZWNrRm9yR2FtZU92ZXIoKSB7XG4gICAgICAgICAgdmFyIGFsaXZlUGxheWVycyA9IFtdO1xuICAgICAgICAgIHNlbGYucGxheWVycy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKHBsYXllciwgaSkge1xuICAgICAgICAgICAgaWYgKCFwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgICAgICAgYWxpdmVQbGF5ZXJzLnB1c2gocGxheWVyLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChhbGl2ZVBsYXllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzZWxmLnZpY3RvcnlNc2cucGxheShhbGl2ZVBsYXllcnNbMF0pO1xuICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgZ2FtZS5zZngucGxheSgndmljdG9yeScpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgICAgc2VsZi50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVzdGFydCgpO1xuICAgICAgICAgICAgfSwgMzAwMCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNyZWF0ZVBsYXllciA9IHJlcXVpcmUoJy4uL3BsYXllcicpO1xuICAgICAgICB2YXIgbmV3UGxheWVyID0gc2VsZi5wbGF5ZXJzLmFkZChjcmVhdGVQbGF5ZXIoZ2FtZSwgcGxheWVyLCBjaGVja0ZvckdhbWVPdmVyKSk7XG4gICAgICAgIHZhciBwb3MgPSBzdGFnZS5zcGF3blBvaW50c1tpXTtcbiAgICAgICAgbmV3UGxheWVyLnBvc2l0aW9uLnggPSBwb3MueDtcbiAgICAgICAgbmV3UGxheWVyLnBvc2l0aW9uLnkgPSBwb3MueTtcbiAgICAgIH07XG5cbiAgICAgIC8vcGxheWVycy5mb3JFYWNoKGFkZFBsYXllcik7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2V0dGluZ3MucGxheWVyQ291bnQuc2VsZWN0ZWQ7IGkrKykge1xuICAgICAgICBhZGRQbGF5ZXIocGxheWVyc1tpXSwgaSk7XG4gICAgICB9XG5cbiAgICAgIHNlbGYuZm9yZWdyb3VuZHMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRGb3JlZ3JvdW5kcygpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoc2VsZi5mb3JlZ3JvdW5kcyk7XG5cbiAgICAgIGdhbWUuc2Z4LnBsYXkoJ3JvdW5kU3RhcnQnKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBcbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllcnMsIHRoaXMucGxhdGZvcm1zLCBmdW5jdGlvbiBoYW5kbGVQbGF0Zm9ybUNvbGxpc2lvbihwbGF5ZXIsIHBsYXRmb3JtKSB7XG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmIHBsYXllci5pc0ZhbGxpbmcpIHtcbiAgICAgICAgICBwbGF5ZXIuaXNGYWxsaW5nID0gZmFsc2U7XG4gICAgICAgICAgLy8ga2ljayB1cCBkdXN0XG4gICAgICAgICAgdmFyIGR1c3QgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2xhbmQnKTtcbiAgICAgICAgICBnYW1lLnN1YlVpLmZ4LmFkZChkdXN0KTtcbiAgICAgICAgICBkdXN0LnBvc2l0aW9uLnggPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi54IC0gNDtcbiAgICAgICAgICBkdXN0LnBvc2l0aW9uLnkgPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi55ICsgcGxheWVyLmJvZHkuaGVpZ2h0IC0gMjtcblxuICAgICAgICAgIHZhciBhbmltID0gZHVzdC5hbmltYXRpb25zLmFkZCgnZHVzdCcpO1xuICAgICAgICAgIGR1c3QuYW5pbWF0aW9ucy5wbGF5KCdkdXN0JywgMzIvMyk7XG4gICAgICAgICAgYW5pbS5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGR1c3Qua2lsbCgpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVE9ETzogaG93IGRvIGkgZG8gdGhpcyBvbiB0aGUgcGxheWVyIGl0c2VsZiB3aXRob3V0IGFjY2VzcyB0byBwbGF5ZXJzPyBvciBzaG91bGQgaSBhZGQgYSBmdG4gdG8gcGxheWVyIGFuZCBzZXQgdGhhdCBhcyB0aGUgY2I/XG4gICAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5wbGF5ZXJzLCB0aGlzLnBsYXllcnMsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckNvbGxpc2lvbihwbGF5ZXJBLCBwbGF5ZXJCKSB7XG4gICAgICAgICAvKiBsZXQncyBub3Qga25vY2sgYW55Ym9keSBhcm91bmQgaWYgc29tZXRoaW5nJ3Mgb24gb25lIG9mIHRoZXNlIGR1ZGVzJy9kdWRldHRlcycgaGVhZHMuXG4gICAgICAgICBwcmV2ZW50cyBjYW5ub25iYWxsIGF0dGFja3MgYW5kIHRoZSBsaWtlLCBhbmQgYWxsb3dzIHN0YW5kaW5nIG9uIGhlYWRzLlxuICAgICAgICAgbm90ZTogc3RpbGwgbmVlZCB0byBjb2xsaWRlIGluIG9yZGVyIHRvIHRlc3QgdG91Y2hpbmcudXAsIHNvIGRvbid0IG1vdmUgdGhpcyB0byBhbGxvd1BsYXllckNvbGxpc2lvbiEgKi9cbiAgICAgICAgaWYgKHBsYXllckEuYm9keS50b3VjaGluZy51cCB8fCBwbGF5ZXJCLmJvZHkudG91Y2hpbmcudXApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyKSB7XG4gICAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgICAgIHNlbGYudGltZW91dHMucHVzaChzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICAgICAgfSwgMTAwKSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBib3VuY2UoKSB7XG4gICAgICAgICAgZ2FtZS5zZngucGxheSgnYm91bmNlJyk7O1xuXG4gICAgICAgICAgdmFyIGJvdW5jZVZlbG9jaXR5ID0gNTA7XG4gICAgICAgICAgdmFyIHZlbG9jaXR5QSwgdmVsb2NpdHlCO1xuICAgICAgICAgIHZlbG9jaXR5QSA9IHZlbG9jaXR5QiA9IGJvdW5jZVZlbG9jaXR5O1xuICAgICAgICAgIGlmIChwbGF5ZXJBLnBvc2l0aW9uLnggPiBwbGF5ZXJCLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5QiAqPSAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmVsb2NpdHlBICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QTtcbiAgICAgICAgICBwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QjtcbiAgICAgICAgICBwbGF5ZXJBLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgIHBsYXllckIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmbGluZygpIHtcbiAgICAgICAgICBnYW1lLnNmeC5wbGF5KCdib3VuY2UnKTtcblxuICAgICAgICAgIHZhciBwbGF5ZXJUb0ZsaW5nO1xuICAgICAgICAgIHZhciBwbGF5ZXJUb0xlYXZlO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLmlzRHVja2luZykge1xuICAgICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckI7XG4gICAgICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckE7XG4gICAgICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvRmxpbmcpO1xuICAgICAgICAgIHZhciBmbGluZ1hWZWxvY2l0eSA9IDc1O1xuICAgICAgICAgIGlmIChwbGF5ZXJUb0ZsaW5nLnBvc2l0aW9uLnggPiBwbGF5ZXJUb0xlYXZlLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICAgIGZsaW5nWFZlbG9jaXR5ICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueCA9IGZsaW5nWFZlbG9jaXR5O1xuICAgICAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS55ID0gLTc1O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcG9wKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LnBsYXkoJ2JvdW5jZScpO1xuXG4gICAgICAgICAgdmFyIHBsYXllclRvUG9wO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLmlzUm9sbGluZykge1xuICAgICAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJCO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXJUb1BvcCk7XG4gICAgICAgICAgcGxheWVyVG9Qb3AuYm9keS52ZWxvY2l0eS55ID0gLTc1O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJvdGhSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgJiYgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgICAgIHZhciBib3RoU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgJiYgIXBsYXllckIuaXNEdWNraW5nO1xuICAgICAgICB2YXIgbmVpdGhlclJvbGxpbmcgPSAhcGxheWVyQS5pc1JvbGxpbmcgJiYgIXBsYXllckIuaXNSb2xsaW5nO1xuICAgICAgICB2YXIgZWl0aGVyRHVja2luZyA9IHBsYXllckEuaXNEdWNraW5nIHx8IHBsYXllckIuaXNEdWNraW5nO1xuICAgICAgICB2YXIgZWl0aGVyUnVubmluZyA9IE1hdGguYWJzKHBsYXllckEuYm9keS52ZWxvY2l0eS54KSA+IDI4IHx8IE1hdGguYWJzKHBsYXllckIuYm9keS52ZWxvY2l0eS54KSA+PSAyODtcbiAgICAgICAgdmFyIGVpdGhlclJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyB8fCBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICAgICAgdmFyIGVpdGhlclN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nIHx8ICFwbGF5ZXJCLmlzRHVja2luZztcblxuICAgICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgICBjYXNlIGJvdGhSb2xsaW5nIHx8IGJvdGhTdGFuZGluZzpcbiAgICAgICAgICAgIGJvdW5jZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBuZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJSdW5uaW5nICYmIGVpdGhlckR1Y2tpbmc6XG4gICAgICAgICAgICBmbGluZygpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBlaXRoZXJSb2xsaW5nICYmIGVpdGhlclN0YW5kaW5nOlxuICAgICAgICAgICAgcG9wKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIG9mIHRoZSB0b3VjaGluZyBwbGF5ZXJzIGlzIGF0dGFja2luZy4uLlxuICAgICAgICBpZiAocGxheWVyQS5pc0F0dGFja2luZyAhPT0gcGxheWVyQi5pc0F0dGFja2luZykge1xuICAgICAgICAgIHZhciB2aWN0aW0gPSBwbGF5ZXJBLmlzQXR0YWNraW5nID8gcGxheWVyQiA6IHBsYXllckE7XG4gICAgICAgICAgaWYgKHBsYXllckEub3JpZW50YXRpb24gIT09IHBsYXllckIub3JpZW50YXRpb24pIHtcbiAgICAgICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMik7IC8vIGF0dGFja2VkIGZyb20gYmVoaW5kIGZvciBkb3VibGUgZGFtYWdlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH0sIGZ1bmN0aW9uIGFsbG93UGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAgICAgLy8gZG9uJ3QgYWxsb3cgY29sbGlzaW9uIGlmIGVpdGhlciBwbGF5ZXIgaXNuJ3QgY29sbGlkYWJsZS5cbiAgICAgICAgLy8gYWxzbyBkaXNhbGxvdyBpZiBwbGF5ZXIgaXMgaW4gbGltYm8gYmVsb3cgdGhlIHNjcmVlbiA6XVxuICAgICAgICBpZiAoIXBsYXllckEuaXNDb2xsaWRhYmxlIHx8ICFwbGF5ZXJCLmlzQ29sbGlkYWJsZSB8fCBwbGF5ZXJBLnBvc2l0aW9uLnkgPiBnYW1lLmhlaWdodCB8fCBwbGF5ZXJCLnBvc2l0aW9uLnkgPiBnYW1lLmhlaWdodCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBwbGF5O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5O1xuIiwidmFyIFNwbGFzaCA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHNwbGFzaCA9IHtcbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5iZ20ucGxheSgndGl0bGUnKTtcblxuICAgICAgLy8gYWRkIGZvcmVzdCBhcyB0aXRsZSBiZ1xuICAgICAgdmFyIHN0YWdlQnVpbGRlciA9IHJlcXVpcmUoJy4uL3N0YWdlQnVpbGRlcicpKGdhbWUpO1xuICAgICAgc3RhZ2VCdWlsZGVyLmJ1aWxkQmFja2dyb3VuZHMoKTtcblxuICAgICAgdmFyIHRpdGxlID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICd0aXRsZScpO1xuICAgICAgdGl0bGUuYW5pbWF0aW9ucy5hZGQoJ3RpdGxlJyk7XG4gICAgICB0aXRsZS5hbmltYXRpb25zLnBsYXkoJ3RpdGxlJywgMzIvMywgdHJ1ZSk7XG5cbiAgICAgIHZhciBzdGFydEdhbWUgPSBmdW5jdGlvbiBzdGFydEdhbWUoKSB7XG4gICAgICAgIGlmIChnYW1lLnN0YXRlLmN1cnJlbnQgPT09ICdzcGxhc2gnKSB7XG4gICAgICAgICAgZ2FtZS5iZ20ucGxheSgnTm9uZScpO1xuICAgICAgICAgIGdhbWUuc3RhdGUuc3RhcnQoJ3BsYXknKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gc3RhcnQgZ2FtZSB3aGVuIHN0YXJ0L2VudGVyIGlzIHByZXNzZWRcbiAgICAgIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5FTlRFUikub25Eb3duLmFkZE9uY2Uoc3RhcnRHYW1lKTtcbiAgICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQuc3VwcG9ydGVkICYmIGdhbWUuaW5wdXQuZ2FtZXBhZC5hY3RpdmUgJiYgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuY29ubmVjdGVkKSB7XG4gICAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkT25jZShzdGFydEdhbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBzcGxhc2g7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwbGFzaDtcbiIsInZhciB1dGlscyA9IHtcbiAgLy8gZnJvbSB1bmRlcnNjb3JlXG4gIGRlYm91bmNlOiBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcblx0dmFyIHRpbWVvdXQ7XG5cdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdGlmICghaW1tZWRpYXRlKSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdH07XG5cdFx0dmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG5cdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuXHRcdHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcblx0XHRpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0fTtcbiAgfSxcblxuICBjZW50ZXI6IGZ1bmN0aW9uKGVudGl0eSkge1xuICAgIGVudGl0eS5hbmNob3Iuc2V0VG8oMC41KTtcbiAgfSxcblxuICAvLyBUT0RPOiBjb25zaWRlciBpbmplY3RpbmcgZGVwZW5kZW5jaWVzXG4gIGdldFN0YWdlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3RhZ2VzID0gcmVxdWlyZSgnLi9kYXRhL3N0YWdlcycpO1xuICAgIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4vZGF0YS9zZXR0aW5ncycpO1xuICAgIHZhciBzdGFnZSA9IHN0YWdlcy5maWx0ZXIoZnVuY3Rpb24oc3RhZ2UpIHtcbiAgICAgIHJldHVybiBzdGFnZS5uYW1lID09PSBzZXR0aW5ncy5zdGFnZS5zZWxlY3RlZDtcbiAgICB9KVswXTtcbiAgICByZXR1cm4gc3RhZ2U7XG4gIH0sXG5cbiAgZ2V0UmFuZG9tQXJyYXlFbGVtZW50OiBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBhcnJheVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnJheS5sZW5ndGgpXTtcbiAgfSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHM7XG4iXX0=
