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
    options: ['hangar', 'waterfall', 'title', 'None'],
    selected: 'waterfall',
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
  "foregrounds": [/*{
    "image": "waterfallFg",
    "scrolling": true,
  }*/],
  "spawnPoints": [
    { "x": 14, "y": 0 },
    { "x": 48, "y": 0 },
    { "x": 14, "y": 18 },
    { "x": 48, "y": 18 }
  ],
  "uiColor": "#28F129"
},{
  "name": "Forest",
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
  "theme": "waterfall",
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
          bg.animations.play('bg', 32/3, true);
        }

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
      game.load.image('tomb', 'images/arenas/tomb-warm.gif');
      game.load.image('waterfall', 'images/arenas/waterfall.gif');
      game.load.spritesheet('waterfallAnim', 'images/arenas/waterfall-anim.gif', 64, 64);
      game.load.spritesheet('waterfallFg', 'images/arenas/waterfall-fg.png', 64, 64);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic2NyaXB0cy9kYXRhL3BsYXllcnMuanMiLCJzY3JpcHRzL2RhdGEvc2V0dGluZ3MuanMiLCJzY3JpcHRzL2RhdGEvc3RhZ2VzLmpzIiwic2NyaXB0cy9tYWluLmpzIiwic2NyaXB0cy9tZW51LmpzIiwic2NyaXB0cy9tdXNpYy5qcyIsInNjcmlwdHMvcGxheWVyLmpzIiwic2NyaXB0cy9zZnguanMiLCJzY3JpcHRzL3N0YWdlQnVpbGRlci5qcyIsInNjcmlwdHMvc3RhdGVzL2xvYWRpbmcuanMiLCJzY3JpcHRzL3N0YXRlcy9wbGF5LmpzIiwic2NyaXB0cy9zdGF0ZXMvc3BsYXNoLmpzIiwic2NyaXB0cy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBQbGF5ZXJzID0gZnVuY3Rpb24oZ2FtZSkge1xuICAgIHZhciBwbGF5ZXJzID0gW3tcbiAgICAgIG5hbWU6ICdCbHVlJyxcbiAgICAgIGNvbG9yOiAnYmx1ZScsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdXJywgZG93bjogJ1MnLCBsZWZ0OiAnQScsIHJpZ2h0OiAnRCcsIGF0dGFjazogJ1EnXG4gICAgICB9LFxuICAgIH0sIHtcbiAgICAgIG5hbWU6ICdQaW5rJyxcbiAgICAgIGNvbG9yOiAncGluaycsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMixcbiAgICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gICAgfSwge1xuICAgICAgbmFtZTogJ0dyZWVuJyxcbiAgICAgIGNvbG9yOiAnZ3JlZW4nLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnSScsIGRvd246ICdLJywgbGVmdDogJ0onLCByaWdodDogJ0wnLCBhdHRhY2s6ICdVJ1xuICAgICAgfSxcbiAgICB9LCB7XG4gICAgICBuYW1lOiAnUHVycGxlJyxcbiAgICAgIGNvbG9yOiAncHVycGxlJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LFxuICAgICAgb3JpZW50YXRpb246ICdsZWZ0JyxcbiAgICAgIGtleXM6IHtcbiAgICAgICAgdXA6ICdUJywgZG93bjogJ0cnLCBsZWZ0OiAnRicsIHJpZ2h0OiAnSCcsIGF0dGFjazogJ1InXG4gICAgICB9LFxuICB9XTtcbiAgXG4gIHJldHVybiBwbGF5ZXJzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXJzO1xuIiwidmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vc3RhZ2VzJyk7XG5cbnZhciBzZXR0aW5ncyA9IHtcbiAgcGxheWVyQ291bnQ6IHtcbiAgICBvcHRpb25zOiBbMiwgMywgNF0sXG4gICAgc2VsZWN0ZWQ6IDQsXG4gIH0sXG4gIGJnbToge1xuICAgIG9wdGlvbnM6IFsnaGFuZ2FyJywgJ3dhdGVyZmFsbCcsICd0aXRsZScsICdOb25lJ10sXG4gICAgc2VsZWN0ZWQ6ICd3YXRlcmZhbGwnLFxuICB9LFxuICBzdGFnZToge1xuICAgIG9wdGlvbnM6IHN0YWdlcy5tYXAoZnVuY3Rpb24oc3RhZ2UpIHtcbiAgICAgIHJldHVybiBzdGFnZS5uYW1lO1xuICAgIH0pLFxuICAgIHNlbGVjdGVkOiAnRm9yZXN0JyxcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZXR0aW5ncztcbiIsInZhciBzdGFnZXMgPSBbe1xuICBcIm5hbWVcIjogXCJXYXRlcmZhbGxcIixcbiAgXCJ0aGVtZVwiOiBcIndhdGVyZmFsbFwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFsxMCwgN10sXG4gICAgICBbNDUsIDddLFxuICAgICAgWzI3LCAxNV0sXG4gICAgICBbMTAsIDI1XSxcbiAgICAgIFs0NSwgMjVdLFxuICAgICAgWzEwLCA0NF0sXG4gICAgICBbNDUsIDQ0XSxcbiAgICAgIFsyNywgNTJdLFxuICAgICAgWzEwLCA2Ml0sXG4gICAgICBbNDUsIDYyXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcIndoaXRlXCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIFwiaW1hZ2VcIjogXCJ3YXRlcmZhbGxcIixcbiAgfSxcbiAge1xuICAgIFwiaW1hZ2VcIjogXCJ3YXRlcmZhbGxBbmltXCIsXG4gICAgXCJhbmltYXRlZFwiOiB0cnVlLFxuICB9XSxcbiAgXCJmb3JlZ3JvdW5kc1wiOiBbLyp7XG4gICAgXCJpbWFnZVwiOiBcIndhdGVyZmFsbEZnXCIsXG4gICAgXCJzY3JvbGxpbmdcIjogdHJ1ZSxcbiAgfSovXSxcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAwIH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiAwIH0sXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAxOCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMTggfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjMjhGMTI5XCJcbn0se1xuICBcIm5hbWVcIjogXCJGb3Jlc3RcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbMjcsIDZdLFxuICAgICAgWzEwLCAxM10sXG4gICAgICBbNDQsIDEzXSxcbiAgICAgIFs1LCAyMl0sXG4gICAgICBbNDksIDIyXSxcbiAgICAgIFsxOCwgMzFdLFxuICAgICAgWzI3LCAzMV0sXG4gICAgICBbMzYsIDMxXSxcbiAgICAgIFs1LCA0NF0sXG4gICAgICBbNDksIDQ0XSxcbiAgICAgIFsyNywgNjBdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwid2hpdGVcIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFt7XG4gICAgXCJpbWFnZVwiOiBcImZvcmVzdFwiXG4gIH1dLFxuICBcImZvcmVncm91bmRzXCI6IFtdLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA5LCBcInlcIjogMTUgfSxcbiAgICB7IFwieFwiOiA1NCwgXCJ5XCI6IDE1IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzI4RDZGMVwiXG59LHtcbiAgXCJuYW1lXCI6IFwiSGFuZ2FyXCIsXG4gIFwidGhlbWVcIjogXCJoYW5nYXJcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbOCwgMzRdLFxuICAgICAgWzEyLCAzNF0sXG4gICAgICBbMjIsIDM0XSxcbiAgICAgIFszMSwgMzRdLFxuICAgICAgWzQxLCAzNF0sXG4gICAgICBbNDYsIDM0XSxcbiAgICBdLFxuICAgIFwiY29sb3JcIjogXCJ3aGl0ZVwiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW3tcbiAgICBpbWFnZTogXCJoYW5nYXJcIlxuICB9XSxcbiAgXCJmb3JlZ3JvdW5kc1wiOiBbe1xuICAgIFwiaW1hZ2VcIjogXCJjbGVhclwiLFxuICB9XSxcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTAsIFwieVwiOiAyNyB9LFxuICAgIHsgXCJ4XCI6IDE5LCBcInlcIjogMjcgfSxcbiAgICB7IFwieFwiOiA0MSwgXCJ5XCI6IDI3IH0sXG4gICAgeyBcInhcIjogNTAsIFwieVwiOiAyNyB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiM4RDhEOERcIlxufSx7XG4gIFwibmFtZVwiOiBcIlRvbWJcIixcbiAgXCJ0aGVtZVwiOiBcIndhdGVyZmFsbFwiLFxuICBcImJhY2tncm91bmRDb2xvclwiOiBcIiMwMDBcIixcbiAgXCJwbGF0Zm9ybXNcIjoge1xuICAgIFwicG9zaXRpb25zXCI6IFtcbiAgICAgIFsxMCwgMTNdLFxuICAgICAgWzQ0LCAxM10sXG4gICAgICBbMjcsIDIxXSxcbiAgICAgIFsxMCwgMzFdLFxuICAgICAgWzQ0LCAzMV1cbiAgICBdLFxuICAgIFwiY29sb3JcIjogXCJ3aGl0ZVwiXG4gIH0sXG4gIFwiYmFja2dyb3VuZHNcIjogW3tcbiAgICBpbWFnZTogJ3RvbWInXG4gIH1dLFxuICBcImZvcmVncm91bmRzXCI6IFt7XG4gICAgXCJpbWFnZVwiOiBcImNsZWFyXCJcbiAgfV0sXG4gIFwic3Bhd25Qb2ludHNcIjogW1xuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogNiB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogNiB9LFxuICAgIHsgXCJ4XCI6IDE0LCBcInlcIjogMjQgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDI0IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzc4M0UwOFwiXG59XTtcblxubW9kdWxlLmV4cG9ydHMgPSBzdGFnZXM7XG4iLCJ2YXIgcmVzaXplID0gZnVuY3Rpb24gcmVzaXplKCkge1xuICBkb2N1bWVudC5ib2R5LnN0eWxlLnpvb20gPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBnYW1lLmhlaWdodDtcbn07XG5cbnZhciBtYWluID0ge1xuICBwcmVsb2FkOiBmdW5jdGlvbiBwcmVsb2FkKCkge1xuICAgIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxuICAgIHJlc2l6ZSgpO1xuICAgIHdpbmRvdy5vbnJlc2l6ZSA9IHV0aWxzLmRlYm91bmNlKHJlc2l6ZSwgMTAwKTtcbiAgICBcbiAgICAvLyBhbGxvdyBhbnl0aGluZyB1cCB0byBoZWlnaHQgb2Ygd29ybGQgdG8gZmFsbCBvZmYtc2NyZWVuIHVwIG9yIGRvd25cbiAgICBnYW1lLndvcmxkLnNldEJvdW5kcygwLCAtZ2FtZS53aWR0aCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQgKiAzKTtcbiAgICBcbiAgICAvLyBwcmV2ZW50IGdhbWUgcGF1c2luZyB3aGVuIGl0IGxvc2VzIGZvY3VzXG4gICAgZ2FtZS5zdGFnZS5kaXNhYmxlVmlzaWJpbGl0eUNoYW5nZSA9IHRydWU7XG4gICAgXG4gICAgLy8gYXNzZXRzIHVzZWQgaW4gbG9hZGluZyBzY3JlZW5cbiAgICBnYW1lLmxvYWQuaW1hZ2UoJ2xvYWRpbmcnLCAnaW1hZ2VzL2xvYWRpbmcuZ2lmJyk7XG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgZ2FtZS5zdGF0ZS5hZGQoJ2xvYWRpbmcnLCByZXF1aXJlKCcuL3N0YXRlcy9sb2FkaW5nJykoZ2FtZSkpO1xuICAgIGdhbWUuc3RhdGUuc3RhcnQoJ2xvYWRpbmcnKTtcbiAgfVxufTtcblxudmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoNjQsIDY0LCBQaGFzZXIuQVVUTywgJ2dhbWUnLCB7XG4gIHByZWxvYWQ6IG1haW4ucHJlbG9hZCxcbiAgY3JlYXRlOiBtYWluLmNyZWF0ZVxufSwgZmFsc2UsIGZhbHNlKTsgLy8gZGlzYWJsZSBhbnRpLWFsaWFzaW5nXG5cbmdhbWUuc3RhdGUuYWRkKCdtYWluJywgbWFpbik7XG5nYW1lLnN0YXRlLnN0YXJ0KCdtYWluJyk7XG4iLCJ2YXIgYnVpbGRNZW51ID0gZnVuY3Rpb24gYnVpbGRNZW51KGdhbWUsIHN0YXRlKSB7XG4gIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4vZGF0YS9zZXR0aW5ncycpO1xuXG4gIHZhciBjeWNsZVNldHRpbmcgPSBmdW5jdGlvbiBjeWNsZVNldHRpbmcoKSB7XG4gICAgdmFyIG9wdGlvbkluZGV4ID0gdGhpcy5zZXR0aW5nLm9wdGlvbnMuaW5kZXhPZih0aGlzLnNldHRpbmcuc2VsZWN0ZWQpO1xuICAgIG9wdGlvbkluZGV4Kys7XG4gICAgaWYgKG9wdGlvbkluZGV4ID09PSB0aGlzLnNldHRpbmcub3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgIG9wdGlvbkluZGV4ID0gMDtcbiAgICB9XG4gICAgdGhpcy5zZXR0aW5nLnNlbGVjdGVkID0gdGhpcy5zZXR0aW5nLm9wdGlvbnNbb3B0aW9uSW5kZXhdO1xuICB9O1xuXG4gIHZhciBtZW51ID0gW3tcbiAgICBuYW1lOiAnUGxheWVycycsXG4gICAgc2V0dGluZzogc2V0dGluZ3MucGxheWVyQ291bnQsXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGN5Y2xlU2V0dGluZy5jYWxsKHRoaXMpO1xuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH0sXG4gICAgc2VsZWN0ZWQ6IHRydWVcbiAgfSwge1xuICAgIG5hbWU6ICdCR00nLFxuICAgIHNldHRpbmc6IHNldHRpbmdzLmJnbSxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgY3ljbGVTZXR0aW5nLmNhbGwodGhpcyk7XG4gICAgICBnYW1lLmJnbS5wbGF5KHNldHRpbmdzLmJnbS5zZWxlY3RlZCk7XG4gICAgfSxcbiAgfSwge1xuICAgIG5hbWU6ICdTdGFnZScsXG4gICAgc2V0dGluZzogc2V0dGluZ3Muc3RhZ2UsXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGN5Y2xlU2V0dGluZy5jYWxsKHRoaXMpO1xuXG4gICAgICAvLyBpZiBzdGFnZSBoYXMgYSBkZWZhdWx0IGJnbSwgbG9hZCBpdFxuICAgICAgdmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vZGF0YS9zdGFnZXMnKTtcbiAgICAgIHZhciBzZWxlY3RlZFN0YWdlID0gc3RhZ2VzW3NldHRpbmdzLnN0YWdlLm9wdGlvbnMuaW5kZXhPZihzZXR0aW5ncy5zdGFnZS5zZWxlY3RlZCldO1xuICAgICAgaWYgKHNlbGVjdGVkU3RhZ2UudGhlbWUpIHtcbiAgICAgICAgc2V0dGluZ3MuYmdtLnNlbGVjdGVkID0gc2VsZWN0ZWRTdGFnZS50aGVtZTtcbiAgICAgIH1cbiAgICAgIGdhbWUuYmdtLnBsYXkoc2V0dGluZ3MuYmdtLnNlbGVjdGVkKTtcblxuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH0sXG4gIH0sIHtcbiAgICBuYW1lOiAnU3RhcnQnLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBzdGF0ZS5yZXN0YXJ0KCk7XG4gICAgfVxuICB9XTtcblxuICB2YXIgY2hhbmdlUGxheWVyQ291bnQgPSBtZW51WzBdLmFjdGlvbi5iaW5kKG1lbnVbMF0pO1xuICB2YXIgY2hhbmdlQmdtID0gbWVudVsxXS5hY3Rpb24uYmluZChtZW51WzFdKTtcbiAgdmFyIGNoYW5nZVN0YWdlID0gbWVudVsyXS5hY3Rpb24uYmluZChtZW51WzJdKTtcbiAgdmFyIHJlc3RhcnQgPSBtZW51WzNdLmFjdGlvbi5iaW5kKG1lbnVbM10pO1xuXG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5QKS5vbkRvd24uYWRkKGNoYW5nZVBsYXllckNvdW50KTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLk0pLm9uRG93bi5hZGQoY2hhbmdlU3RhZ2UpO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuQikub25Eb3duLmFkZChjaGFuZ2VCZ20pO1xuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuRU5URVIpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gIGlmIChnYW1lLmlucHV0LmdhbWVwYWQuc3VwcG9ydGVkICYmIGdhbWUuaW5wdXQuZ2FtZXBhZC5hY3RpdmUpIHtcbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDIuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkMy5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQzLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDQuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkNC5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWVudTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYnVpbGRNZW51O1xuIiwidmFyIGJnbSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGxheWVyID0gbmV3IENoaXB0dW5lSnNQbGF5ZXIobmV3IENoaXB0dW5lSnNDb25maWcoLTEpKTtcblxuICByZXR1cm4ge1xuICAgIHBsYXk6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XG4gICAgICBpZiAoZmlsZU5hbWUgPT09ICdOb25lJykge1xuICAgICAgICBwbGF5ZXIuc3RvcC5jYWxsKHBsYXllcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXIubG9hZCgnLi9tdXNpYy8nICsgZmlsZU5hbWUgKyAnLnhtJywgZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICAgICAgcGxheWVyLnBsYXkoYnVmZmVyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBiZ207XG4iLCJ2YXIgY3JlYXRlUGxheWVyID0gZnVuY3Rpb24gY3JlYXRlUGxheWVyKGdhbWUsIG9wdGlvbnMsIG9uRGVhdGgpIHtcbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIG9yaWVudGF0aW9uOiAncmlnaHQnLFxuICAgIGtleXM6IHtcbiAgICAgIHVwOiAnVVAnLFxuICAgICAgZG93bjogJ0RPV04nLFxuICAgICAgbGVmdDogJ0xFRlQnLFxuICAgICAgcmlnaHQ6ICdSSUdIVCcsXG4gICAgICBhdHRhY2s6ICdTSElGVCdcbiAgICB9LFxuICAgIHNjYWxlOiB7XG4gICAgICB4OiAxLFxuICAgICAgeTogMlxuICAgIH0sXG4gICAgY29sb3I6ICdwaW5rJyxcbiAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMSxcbiAgfTtcblxuICB2YXIgc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgdmFyIGtleXMgPSB7XG4gICAgdXA6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnVwXSksXG4gICAgZG93bjogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMuZG93bl0pLFxuICAgIGxlZnQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmxlZnRdKSxcbiAgICByaWdodDogZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkW3NldHRpbmdzLmtleXMucmlnaHRdKSxcbiAgICBhdHRhY2s6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmF0dGFja10pLFxuICB9O1xuXG4gIHZhciBnYW1lcGFkID0gc2V0dGluZ3MuZ2FtZXBhZDtcblxuICB2YXIgYWN0aW9ucyA9IHtcbiAgICBhdHRhY2s6IGZ1bmN0aW9uIGF0dGFjaygpIHtcbiAgICAgIHZhciBkdXJhdGlvbiA9IDIwMDtcbiAgICAgIHZhciBpbnRlcnZhbCA9IDYwMDtcbiAgICAgIHZhciB2ZWxvY2l0eSA9IDEwMDtcblxuICAgICAgdmFyIGNhbkF0dGFjayA9IChEYXRlLm5vdygpID4gcGxheWVyLmxhc3RBdHRhY2tlZCArIGludGVydmFsKSAmJiAhcGxheWVyLmlzRHVja2luZyAmJiAhcGxheWVyLmlzUGVybWFkZWFkO1xuICAgICAgaWYgKCFjYW5BdHRhY2spIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSB0cnVlO1xuICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IERhdGUubm93KCk7XG5cbiAgICAgIGdhbWUuc2Z4LnBsYXkoJ2F0dGFjaycpO1xuXG4gICAgICBzd2l0Y2gocGxheWVyLm9yaWVudGF0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAtdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5sb2FkVGV4dHVyZSgnd2hpdGUnKTtcbiAgICAgIHNldFRpbWVvdXQoYWN0aW9ucy5lbmRBdHRhY2ssIGR1cmF0aW9uKTtcbiAgICB9LFxuXG4gICAgZW5kQXR0YWNrOiBmdW5jdGlvbiBlbmRBdHRhY2soKSB7XG4gICAgICBpZiAocGxheWVyLmFsaXZlICYmIHBsYXllci5pc0F0dGFja2luZykge1xuICAgICAgICBwbGF5ZXIubG9hZFRleHR1cmUoc2V0dGluZ3MuY29sb3IpO1xuICAgICAgICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcnVuOiBmdW5jdGlvbiBydW4oZGlyZWN0aW9uKSB7XG4gICAgICB2YXIgbWF4U3BlZWQgPSAzMjtcbiAgICAgIHZhciBhY2NlbGVyYXRpb24gPSBwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duID8gOCA6IDM7IC8vIHBsYXllcnMgaGF2ZSBsZXNzIGNvbnRyb2wgaW4gdGhlIGFpclxuICAgICAgcGxheWVyLm9yaWVudGF0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICAvLyBpZiBwbGF5ZXIgaXMgZ29pbmcgZmFzdGVyIHRoYW4gbWF4IHJ1bm5pbmcgc3BlZWQgKGR1ZSB0byBhdHRhY2ssIGV0YyksIHNsb3cgdGhlbSBkb3duIG92ZXIgdGltZVxuICAgICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IDwgLW1heFNwZWVkKSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICs9IGFjY2VsZXJhdGlvbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IE1hdGgubWF4KHBsYXllci5ib2R5LnZlbG9jaXR5LnggLSBhY2NlbGVyYXRpb24sIC1tYXhTcGVlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPiBtYXhTcGVlZCkge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCAtPSBhY2NlbGVyYXRpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1pbihwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICsgYWNjZWxlcmF0aW9uLCBtYXhTcGVlZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBqdW1wOiBmdW5jdGlvbiBqdW1wKCkge1xuICAgICAgaWYgKCFwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmICFwbGF5ZXIuYm9keS50b3VjaGluZy5sZWZ0ICYmICFwbGF5ZXIuYm9keS50b3VjaGluZy5yaWdodCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBkdXN0O1xuXG4gICAgICBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93bikge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEwMDtcbiAgICAgICAgZ2FtZS5zZngucGxheSgnanVtcCcpO1xuICAgICAgICBkdXN0ID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdqdW1wJyk7XG4gICAgICAgIGR1c3QucG9zaXRpb24ueCA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnggLSA0O1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnkgPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi55ICsgcGxheWVyLmJvZHkuaGVpZ2h0IC0gMjtcbiAgICAgIC8vIHdhbGwganVtcHNcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID0gLTEyMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDQ1O1xuICAgICAgICBnYW1lLnNmeC5wbGF5KCdqdW1wJyk7XG4gICAgICAgIGR1c3QgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2xhbmQnKTtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi54ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueCArIDI7XG4gICAgICAgIGR1c3QucG9zaXRpb24ueSA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnkgLSBwbGF5ZXIuYm9keS5oZWlnaHQ7XG4gICAgICAgIGR1c3QuYW5nbGUgPSA5MDtcbiAgICAgIH0gZWxzZSBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcucmlnaHQpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMjA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSAtNDU7XG4gICAgICAgIGdhbWUuc2Z4LnBsYXkoJ2p1bXAnKTtcbiAgICAgICAgZHVzdCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnbGFuZCcpO1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnggPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi54O1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnkgPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi55ICsgcGxheWVyLmJvZHkuaGVpZ2h0O1xuICAgICAgICBkdXN0LmFuZ2xlID0gLTkwO1xuICAgICAgfVxuXG4gICAgICBnYW1lLnN1YlVpLmZ4LmFkZChkdXN0KTsgLy8gbW91bnQgYmVsb3cgZm9yZWdyb3VuZCAmIHVpXG4gICAgICB2YXIgYW5pbSA9IGR1c3QuYW5pbWF0aW9ucy5hZGQoJ2R1c3QnKTtcbiAgICAgIGR1c3QuYW5pbWF0aW9ucy5wbGF5KCdkdXN0JywgMzIvMyk7XG4gICAgICBhbmltLm9uQ29tcGxldGUuYWRkKGZ1bmN0aW9uKCkge1xuICAgICAgICBkdXN0LmtpbGwoKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICBkYW1wZW5KdW1wOiBmdW5jdGlvbiBkYW1wZW5KdW1wKCkge1xuICAgICAgLy8gc29mdGVuIHVwd2FyZCB2ZWxvY2l0eSB3aGVuIHBsYXllciByZWxlYXNlcyBqdW1wIGtleVxuICAgICAgICB2YXIgZGFtcGVuVG9QZXJjZW50ID0gMC41O1xuXG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS55IDwgMCkge1xuICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgKj0gZGFtcGVuVG9QZXJjZW50O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGR1Y2s6IGZ1bmN0aW9uIGR1Y2soKSB7XG4gICAgICBpZiAocGxheWVyLmlzQXR0YWNraW5nIHx8IHBsYXllci5pc1Blcm1hZGVhZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICghcGxheWVyLmlzRHVja2luZyAmJiBwbGF5ZXIuaHAgPiAyKSB7XG4gICAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBzZXR0aW5ncy5zY2FsZS55IC8gMik7XG4gICAgICAgIGFjdGlvbnMuYXBwbHlPcmllbnRhdGlvbigpO1xuICAgICAgICBwbGF5ZXIueSArPSBzZXR0aW5ncy5zY2FsZS55O1xuICAgICAgfVxuICAgICAgcGxheWVyLmlzRHVja2luZyA9IHRydWU7XG5cbiAgICAgIChmdW5jdGlvbiByb2xsKCkge1xuICAgICAgICB2YXIgY2FuUm9sbCA9IE1hdGguYWJzKHBsYXllci5ib2R5LnZlbG9jaXR5LngpID4gMjUgJiYgcGxheWVyLmJvZHkudG91Y2hpbmcuZG93bjtcbiAgICAgICAgaWYgKGNhblJvbGwpIHtcbiAgICAgICAgICBwbGF5ZXIuaXNSb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSgpKTtcbiAgICB9LFxuXG4gICAgc3RhbmQ6IGZ1bmN0aW9uIHN0YW5kKCkge1xuICAgICAgaWYgKHBsYXllci5ocCA+IDIpIHtcbiAgICAgICAgcGxheWVyLnkgLT0gc2V0dGluZ3Muc2NhbGUueTtcbiAgICAgIH1cbiAgICAgIGFjdGlvbnMuYXBwbHlIZWFsdGhFZmZlY3RzKCk7XG4gICAgICBwbGF5ZXIuaXNEdWNraW5nID0gZmFsc2U7XG4gICAgICBwbGF5ZXIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgfSxcblxuICAgIHRha2VEYW1hZ2U6IGZ1bmN0aW9uIHRha2VEYW1hZ2UoYW1vdW50KSB7XG4gICAgICAvLyBwcmV2ZW50IHRha2luZyBtb3JlIGRhbWFnZSB0aGFuIGhwIHJlbWFpbmluZyBpbiBjdXJyZW50IGxpZmVcbiAgICAgIGlmIChhbW91bnQgPiAxICYmIChwbGF5ZXIuaHAgLSBhbW91bnQpICUgMiAhPT0gMCkge1xuICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIuaHAgLT0gYW1vdW50O1xuXG4gICAgICBpZiAocGxheWVyLmhwIDwgMCkge1xuICAgICAgICBwbGF5ZXIuaHAgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHBsYXllci5ocCAlIDIgPT09IDApIHtcbiAgICAgICAgYWN0aW9ucy5kaWUoKTtcbiAgICAgIH1cbiAgICAgIGFjdGlvbnMuYXBwbHlIZWFsdGhFZmZlY3RzKCk7XG4gICAgfSxcblxuICAgIGFwcGx5SGVhbHRoRWZmZWN0czogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbmV3UGxheWVySGVpZ2h0ID0gTWF0aC5tYXgoTWF0aC5yb3VuZChwbGF5ZXIuaHAgLyAyKSwgMSk7XG4gICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8oc2V0dGluZ3Muc2NhbGUueCwgbmV3UGxheWVySGVpZ2h0KTtcbiAgICAgIGFjdGlvbnMuYXBwbHlPcmllbnRhdGlvbigpO1xuXG4gICAgICBpZiAocGxheWVyLmhwID09PSAwKSB7XG4gICAgICAgIHJldHVybjsgLy8gYml0J3MgYmVjb21pbmcgYSBnaG9zdDsgbGVhdmVzIGl0cyBzY2FyZiAob3IgbGFjayB0aGVyZW9mKSBhbG9uZVxuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuaHAgJSAyID09PSAxKSB7XG4gICAgICAgIHBsYXllci5zY2FyZi5hbmltYXRpb24gPSBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9ucy5wbGF5KCdkaXNpbnRlZ3JhdGUnLCAzMi8zLCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9uID0gcGxheWVyLnNjYXJmLmFuaW1hdGlvbnMucGxheSgnZmxhcCcsIDMyLzMsIHRydWUpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBhcHBseU9yaWVudGF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhwbGF5ZXIub3JpZW50YXRpb24gPT09ICdsZWZ0JyA/IHNldHRpbmdzLnNjYWxlLnggOiAtc2V0dGluZ3Muc2NhbGUueCwgcGxheWVyLnNjYWxlLnkpO1xuICAgIH0sXG5cbiAgICBkaWU6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHBsYXllci5pc1Blcm1hZGVhZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPiAwKSB7XG4gICAgICAgIGFjdGlvbnMuYXBwbHlJbnZ1bG5lcmFiaWxpdHkoKTtcblxuICAgICAgICBnYW1lLnNmeC5wbGF5KCdkaWUnKTtcbiAgICAgICAgYWN0aW9ucy5lbmRBdHRhY2soKTtcbiAgICAgICAgcGxheWVyLmxhc3RBdHRhY2tlZCA9IDA7XG5cbiAgICAgICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICAgICAgICB2YXIgcmVzcGF3blBvc2l0aW9uID0gdXRpbHMuZ2V0UmFuZG9tQXJyYXlFbGVtZW50KHV0aWxzLmdldFN0YWdlKCkuc3Bhd25Qb2ludHMpO1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueCA9IHJlc3Bhd25Qb3NpdGlvbi54O1xuICAgICAgICBwbGF5ZXIucG9zaXRpb24ueSA9IHJlc3Bhd25Qb3NpdGlvbi55O1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnYW1lLnNmeC5wbGF5KCdwZXJtYWRpZScpO1xuICAgICAgICBwbGF5ZXIuYWxwaGEgPSAwLjU7XG4gICAgICAgIHBsYXllci5pc1Blcm1hZGVhZCA9IHRydWU7XG4gICAgICAgIG9uRGVhdGgoKTsgLy8gVE9ETzogdGhpcyBjb3VsZCBwcm9iYWJseSBiZSBiZXR0ZXIgYXJjaGl0ZWN0ZWRcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXBwbHlJbnZ1bG5lcmFiaWxpdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuXG4gICAgICB2YXIgc2V0Q29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAvLyBpbiBjYXNlIGdhbWUgcmVzdGFydHMgYW5kIHBsYXllciBubyBsb25nZXIgZXhpc3RzLi4uXG4gICAgICAgIGlmICghcGxheWVyLmFsaXZlKSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChjb2xvckludGVydmFsKTtcbiAgICAgICAgICBjbGVhckludGVydmFsKHdoaXRlSW50ZXJ2YWwpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwbGF5ZXIubG9hZFRleHR1cmUoY29sb3IpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGNvbG9ySW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0Q29sb3Ioc2V0dGluZ3MuY29sb3IpO1xuICAgICAgfSwgMTUwKTtcbiAgICAgIHZhciB3aGl0ZUludGVydmFsO1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgd2hpdGVJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNldENvbG9yKCd3aGl0ZScpO1xuICAgICAgICB9LCAxNTApO1xuICAgICAgfSwgNzUpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXBsYXllci5hbGl2ZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjbGVhckludGVydmFsKHdoaXRlSW50ZXJ2YWwpO1xuICAgICAgICBjbGVhckludGVydmFsKGNvbG9ySW50ZXJ2YWwpO1xuICAgICAgICBzZXRDb2xvcihzZXR0aW5ncy5jb2xvcik7IC8vIGVuc3VyZSBwbGF5ZXIgY29sb3IgcmV0dXJucyB0byBub3JtYWxcbiAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICB9LCAxNTAwKTtcbiAgICB9LFxuICB9O1xuXG4gIHZhciBwbGF5ZXIgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgc2V0dGluZ3MuY29sb3IpO1xuICBwbGF5ZXIubmFtZSA9IHNldHRpbmdzLm5hbWU7XG4gIHBsYXllci5vcmllbnRhdGlvbiA9IHNldHRpbmdzLm9yaWVudGF0aW9uO1xuICBwbGF5ZXIuYW5jaG9yLnNldFRvKDAuNSwgMC41KTsgLy8gYW5jaG9yIHRvIGNlbnRlciB0byBhbGxvdyBmbGlwcGluZ1xuXG4gIHBsYXllci5zY2FyZiA9IGdhbWUuYWRkLnNwcml0ZSgtMSwgLTEsIHNldHRpbmdzLmNvbG9yICsgJ1NjYXJmJyk7XG4gIHBsYXllci5zY2FyZi5hbmltYXRpb25zLmFkZCgnZmxhcCcsIFswLCAxLCAyLCAzLCA0LCA1XSk7XG4gIHBsYXllci5zY2FyZi5hbmltYXRpb25zLmFkZCgnZGlzaW50ZWdyYXRlJywgWzcsIDgsIDksIDEwLCAxMSwgNl0pO1xuICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9uID0gcGxheWVyLnNjYXJmLmFuaW1hdGlvbnMucGxheSgnZmxhcCcsIDMyLzMsIHRydWUpO1xuICBwbGF5ZXIuc2NhcmYuc2V0U2NhbGVNaW5NYXgoLTEsIDEsIDEsIDEpO1xuICBwbGF5ZXIuYWRkQ2hpbGQocGxheWVyLnNjYXJmKTtcblxuICAvLyB0cmFjayBoZWFsdGhcbiAgcGxheWVyLmhwID0gcGxheWVyLm1heEhwID0gNjsgLy8gVE9ETzogYWxsb3cgc2V0dGluZyBjdXN0b20gaHAgYW1vdW50IGZvciBlYWNoIHBsYXllclxuICBwbGF5ZXIuYWN0aW9ucyA9IGFjdGlvbnM7XG4gIHBsYXllci5hY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpOyAvLyBUT0RPOiBhZGQgZ2lhbnQgbW9kZVxuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHBsYXllcik7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5ib2R5LmJvdW5jZS55ID0gMC4yOyAvLyBUT0RPOiBhbGxvdyBib3VuY2UgY29uZmlndXJhdGlvblxuICBwbGF5ZXIuYm9keS5ncmF2aXR5LnkgPSAzODA7IC8vIFRPRE86IGFsbG93IGdyYXZpdHkgY29uZmlndXJhdGlvblxuXG4gIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTsgLy8gdHJhY2sgaW5wdXQgY2hhbmdlIGZvciB2YXJpYWJsZSBqdW1wIGhlaWdodFxuICBwbGF5ZXIuaXNGYWxsaW5nID0gZmFsc2U7XG4gIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzUGVybWFkZWFkID0gZmFsc2U7XG4gIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuICAvLyBwaGFzZXIgYXBwYXJlbnRseSBhdXRvbWF0aWNhbGx5IGNhbGxzIGFueSBmdW5jdGlvbiBuYW1lZCB1cGRhdGUgYXR0YWNoZWQgdG8gYSBzcHJpdGUhXG4gIHBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBraWxsIHBsYXllciBpZiBoZSBmYWxscyBvZmYgdGhlIHNjcmVlblxuICAgIGlmIChwbGF5ZXIucG9zaXRpb24ueSA+IDY0ICYmIHBsYXllci5ocCAhPT0gMCkgeyAvLyBUT0RPOiBob3cgdG8gYWNjZXNzIG5hdGl2ZSBoZWlnaHQgZnJvbSBnYW1lLmpzP1xuICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDIpO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID4gODUpIHtcbiAgICAgIHBsYXllci5pc0ZhbGxpbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIHBsYXllci5zY2FyZi5hbmltYXRpb24uc3BlZWQgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSAqIDAuNzUgKyAzMi8zO1xuXG4gICAgdmFyIGlucHV0ID0ge1xuICAgICAgbGVmdDogICAoa2V5cy5sZWZ0LmlzRG93biAmJiAha2V5cy5yaWdodC5pc0Rvd24pIHx8XG4gICAgICAgICAgICAgIChnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfTEVGVCkgJiYgIWdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9SSUdIVCkpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWCkgPCAtMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1gpIDwgLTAuMSxcbiAgICAgIHJpZ2h0OiAgKGtleXMucmlnaHQuaXNEb3duICYmICFrZXlzLmxlZnQuaXNEb3duKSB8fFxuICAgICAgICAgICAgICAoZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1JJR0hUKSAmJiAhZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0xFRlQpKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1gpID4gMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1gpID4gMC4xLFxuICAgICAgdXA6ICAgICBrZXlzLnVwLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfVVApIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfQSksXG4gICAgICBkb3duOiAgIGtleXMuZG93bi5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0RPV04pIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWSkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWSkgPiAwLjEsXG4gICAgICBhdHRhY2s6IGtleXMuYXR0YWNrLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1kpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9CKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfTEVGVF9CVU1QRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX1RSSUdHRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9SSUdIVF9CVU1QRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9SSUdIVF9UUklHR0VSKSxcbiAgICB9O1xuXG4gICAgaWYgKGlucHV0LmxlZnQpIHtcbiAgICAgIGFjdGlvbnMucnVuKCdsZWZ0Jyk7XG4gICAgICBwbGF5ZXIuYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChpbnB1dC5yaWdodCkge1xuICAgICAgYWN0aW9ucy5ydW4oJ3JpZ2h0Jyk7XG4gICAgICBwbGF5ZXIuYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmICFwbGF5ZXIuaXNSb2xsaW5nKSB7XG4gICAgICAvLyBhcHBseSBmcmljdGlvblxuICAgICAgaWYgKE1hdGguYWJzKHBsYXllci5ib2R5LnZlbG9jaXR5LngpIDwgMikge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICo9IDAuNTsgLy8gcXVpY2tseSBicmluZyBzbG93LW1vdmluZyBwbGF5ZXJzIHRvIGEgc3RvcFxuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID4gMCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IDI7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPCAwKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKz0gMjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5wdXQudXApIHtcbiAgICAgIHBsYXllci51cFdhc0Rvd24gPSB0cnVlO1xuICAgICAgYWN0aW9ucy5qdW1wKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIudXBXYXNEb3duKSB7XG4gICAgICBwbGF5ZXIudXBXYXNEb3duID0gZmFsc2U7XG4gICAgICBhY3Rpb25zLmRhbXBlbkp1bXAoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuZG93bikge1xuICAgICAgYWN0aW9ucy5kdWNrKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIuaXNEdWNraW5nKSB7XG4gICAgICBhY3Rpb25zLnN0YW5kKCk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmF0dGFjaykge1xuICAgICAgYWN0aW9ucy5hdHRhY2soKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHBsYXllcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUGxheWVyO1xuIiwiLyoqXG4gKiBFYWNoIHRpbWUgYSB1bmlxdWUgc291bmQgZmlsZW5hbWUgaXMgcGFzc2VkIGluLCBhIG5ldyBpbnN0YW5jZSBvZiBjaGlwdHVuZS5qcyB3aWxsIGJlIGNyZWF0ZWQgd2l0aCB0aGF0IHNvdW5kIGFzIGEgYnVmZmVyLlxuICogSWYgdGhlIHBsYXkgbWV0aG9kIGlzIGNhbGxlZCBvbiBzb3VuZCBmaWxlIHBhc3NlZCBpbiBwcmV2aW91c2x5LCBpdHMgcmVzcGVjdGl2ZSBpbnN0YW5jZSB3aWxsIHBsYXkgdGhlIGV4aXN0aW5nIGJ1ZmZlci5cbiAqIFRoaXMgZW5zdXJlcyB0aGUgZmlsZSBzeXN0ZW0gaXMgb25seSBoaXQgb25jZSBwZXIgc291bmQsIGFzIG5lZWRlZC5cbiAqIEl0IHdpbGwgYWxzbyBwcmV2ZW50IHNvdW5kcyBmcm9tICdzdGFja2luZycgLS0gdGhlIHNhbWUgc291bmQgcGxheWVkIHJlcGVhdGVkbHkgd2lsbCBpbnRlcnJ1cHQgaXRzZWxmIGVhY2ggdGltZS5cbiAqL1xudmFyIHNmeCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc291bmRiYW5rID0ge307XG5cbiAgcmV0dXJuIHtcbiAgICBwbGF5OiBmdW5jdGlvbihmaWxlTmFtZSkge1xuICAgICAgaWYgKHNvdW5kYmFua1tmaWxlTmFtZV0pIHtcbiAgICAgICAgc291bmRiYW5rW2ZpbGVOYW1lXS5wbGF5KHNvdW5kYmFua1tmaWxlTmFtZV0uYnVmZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0gPSBuZXcgQ2hpcHR1bmVKc1BsYXllcihuZXcgQ2hpcHR1bmVKc0NvbmZpZygwKSk7XG4gICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0ubG9hZCgnLi9zZngvJyArIGZpbGVOYW1lICsgJy54bScsIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0uYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0ucGxheShidWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNmeDtcbiIsInZhciBzdGFnZUJ1aWxkZXIgPSBmdW5jdGlvbiBzdGFnZUJ1aWxkZXIoZ2FtZSkge1xuICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MnKTtcbiAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICB2YXIgc3RhZ2UgPSB1dGlscy5nZXRTdGFnZSgpO1xuXG4gIGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gc3RhZ2UuYmFja2dyb3VuZENvbG9yO1xuXG4gIHZhciBidWlsZFBsYXRmb3JtcyA9IGZ1bmN0aW9uIGJ1aWxkUGxhdGZvcm1zKCkge1xuICAgIHZhciBwbGF0Zm9ybXMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICAgIHBsYXRmb3Jtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcblxuICAgIHZhciBwbGF0Zm9ybVBvc2l0aW9ucyA9IHN0YWdlLnBsYXRmb3Jtcy5wb3NpdGlvbnM7XG4gICAgcGxhdGZvcm1Qb3NpdGlvbnMuZm9yRWFjaChmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgdmFyIHBsYXRmb3JtID0gcGxhdGZvcm1zLmNyZWF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sIHN0YWdlLnBsYXRmb3Jtcy5jb2xvcik7XG4gICAgICBwbGF0Zm9ybS5zY2FsZS5zZXRUbyg1LCAxKTtcbiAgICAgIHBsYXRmb3JtLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHZhciB3YWxscyA9IFtdO1xuICAgIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgtMywgLTEyLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpKTtcbiAgICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoNjEsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKSk7XG4gICAgd2FsbHMuZm9yRWFjaChmdW5jdGlvbih3YWxsKSB7XG4gICAgICB3YWxsLnNjYWxlLnNldFRvKDMsIDM4KTtcbiAgICAgIHdhbGwuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIH0pO1xuXG4gICAgdmFyIGNlaWxpbmcgPSBwbGF0Zm9ybXMuY3JlYXRlKDAsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKTtcbiAgICBjZWlsaW5nLnNjYWxlLnNldFRvKDMyLCAzKTtcbiAgICBjZWlsaW5nLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICBcbiAgICByZXR1cm4gcGxhdGZvcm1zO1xuICB9O1xuXG4gIHZhciBidWlsZExheWVyID0gZnVuY3Rpb24gYnVpbGRMYXllcihzdWJsYXllcnMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGF5ZXIgPSBnYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgICBzdWJsYXllcnMuZm9yRWFjaChmdW5jdGlvbihzdWJsYXllcikge1xuICAgICAgICB2YXIgYmc7XG5cbiAgICAgICAgaWYgKHN1YmxheWVyLnNjcm9sbGluZykge1xuICAgICAgICAgIGJnID0gZ2FtZS5hZGQudGlsZVNwcml0ZSgwLCAwLCBnYW1lLndpZHRoLCBnYW1lLmhlaWdodCwgc3VibGF5ZXIuaW1hZ2UpO1xuICAgICAgICAgIGxheWVyLmxvb3AgPSBnYW1lLnRpbWUuZXZlbnRzLmxvb3AoUGhhc2VyLlRpbWVyLlFVQVJURVIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYmcudGlsZVBvc2l0aW9uLnggLT0xO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJnID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIHN1YmxheWVyLmltYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdWJsYXllci5hbmltYXRlZCkge1xuICAgICAgICAgIGJnLmFuaW1hdGlvbnMuYWRkKCdiZycpO1xuICAgICAgICAgIGJnLmFuaW1hdGlvbnMucGxheSgnYmcnLCAzMi8zLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxheWVyLmFkZChiZyk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGxheWVyO1xuICAgIH07XG4gIH07XG4gIFxuICByZXR1cm4ge1xuICAgIGJ1aWxkUGxhdGZvcm1zOiBidWlsZFBsYXRmb3JtcyxcbiAgICBidWlsZEZvcmVncm91bmRzOiBidWlsZExheWVyKHN0YWdlLmZvcmVncm91bmRzKSxcbiAgICBidWlsZEJhY2tncm91bmRzOiBidWlsZExheWVyKHN0YWdlLmJhY2tncm91bmRzKSxcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VCdWlsZGVyO1xuIiwidmFyIExvYWRpbmcgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBsb2FkaW5nID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsb2FkaW5nJyk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZycpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfSxcblxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gaW1hZ2VzXG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3RpdGxlJywgJ2ltYWdlcy9zcHJpdGVzL3VpLXRpdGxlLmdpZicsIDY0LCA2NCk7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3ZpY3RvcnlNc2cnLCAnaW1hZ2VzL3Nwcml0ZXMvdWktd2lubmVyLmdpZicsIDUyLCAyMik7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2JsdWVTY2FyZicsICdpbWFnZXMvc3ByaXRlcy9iaXQtc2NhcmYtYmx1ZS5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgncGlua1NjYXJmJywgJ2ltYWdlcy9zcHJpdGVzL2JpdC1zY2FyZi1waW5rLmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdncmVlblNjYXJmJywgJ2ltYWdlcy9zcHJpdGVzL2JpdC1zY2FyZi1ncmVlbi5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgncHVycGxlU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXMvYml0LXNjYXJmLXB1cnBsZS5naWYnLCA1LCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnanVtcCcsICdpbWFnZXMvc3ByaXRlcy9iaXQtanVtcC5naWYnLCAxMCwgMik7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2xhbmQnLCAnaW1hZ2VzL3Nwcml0ZXMvYml0LWxhbmQuZ2lmJywgMTAsIDIpO1xuICAgICAgLy8gY29sb3JzXG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2NsZWFyJywgJ2ltYWdlcy9jb2xvcnMvY2xlYXIuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3doaXRlJywgJ2ltYWdlcy9jb2xvcnMvd2hpdGUuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2JsdWUnLCAnaW1hZ2VzL2NvbG9ycy9ibHVlLmdpZicpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdwaW5rJywgJ2ltYWdlcy9jb2xvcnMvcGluay5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnZ3JlZW4nLCAnaW1hZ2VzL2NvbG9ycy9ncmVlbi5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgncHVycGxlJywgJ2ltYWdlcy9jb2xvcnMvcHVycGxlLmdpZicpO1xuICAgICAgLy8gYXJlbmFzXG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2ZvcmVzdCcsICdpbWFnZXMvYXJlbmFzL2ZvcmVzdC1zdW1tZXIuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3RvbWInLCAnaW1hZ2VzL2FyZW5hcy90b21iLXdhcm0uZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ3dhdGVyZmFsbCcsICdpbWFnZXMvYXJlbmFzL3dhdGVyZmFsbC5naWYnKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnd2F0ZXJmYWxsQW5pbScsICdpbWFnZXMvYXJlbmFzL3dhdGVyZmFsbC1hbmltLmdpZicsIDY0LCA2NCk7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3dhdGVyZmFsbEZnJywgJ2ltYWdlcy9hcmVuYXMvd2F0ZXJmYWxsLWZnLnBuZycsIDY0LCA2NCk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2hhbmdhcicsICdpbWFnZXMvYXJlbmFzL2xldmVsLWhhbmdhci13aXAuZ2lmJyk7XG5cbiAgICAgIC8vIHNvdW5kXG4gICAgICBnYW1lLmJnbSA9IHJlcXVpcmUoJy4uL211c2ljJykoKTtcbiAgICAgIGdhbWUuc2Z4ID0gcmVxdWlyZSgnLi4vc2Z4JykoKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5zdGFydCgpO1xuXG4gICAgICBnYW1lLnN0YXRlLmFkZCgnc3BsYXNoJywgcmVxdWlyZSgnLi9zcGxhc2gnKShnYW1lKSk7XG4gICAgICBnYW1lLnN0YXRlLmFkZCgncGxheScsIHJlcXVpcmUoJy4vcGxheScpKGdhbWUpKTtcbiAgICAgIGdhbWUuc3RhdGUuc3RhcnQoJ3NwbGFzaCcpO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBsb2FkaW5nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMb2FkaW5nO1xuIiwidmFyIFBsYXkgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBwbGF5ID0ge1xuICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBnYW1lLnN1YlVpID0gZ2FtZS5hZGQuZ3JvdXAoKTsgLy8gcGxhY2UgdG8ga2VlcCBhbnl0aGluZyBvbi1zY3JlZW4gdGhhdCdzIG5vdCBVSSB0byBkZXB0aCBzb3J0IGJlbG93IFVJXG5cbiAgICAgIC8vIGdhbWUgb3ZlciB2aWN0b3J5IG1lc3NhZ2UgZGVjbGFyaW5nIHRoZSB3aW5uZXJcbiAgICAgIHNlbGYudmljdG9yeU1zZyA9IGdhbWUuYWRkLnNwcml0ZSg2LCAyMSwgJ3ZpY3RvcnlNc2cnKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy52aXNpYmxlID0gZmFsc2U7XG4gICAgICBzZWxmLnZpY3RvcnlNc2cuYW5pbWF0aW9ucy5hZGQoJ0JsdWUnLCBbMCwgNCwgOCwgMTJdLCAzMi8zLCB0cnVlKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnUGluaycsIFsxLCA1LCA5LCAxM10sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdHcmVlbicsIFsyLCA2LCAxMCwgMTRdLCAzMi8zLCB0cnVlKTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnUHVycGxlJywgWzMsIDcsIDExLCAxNV0sIDMyLzMsIHRydWUpO1xuXG4gICAgICBzZWxmLnRpbWVvdXRzID0gW107IC8vIHN0b3JlIGdhbWUgdGltZW91dHMgdG8gY2FuY2VsIGlmIGdhbWUgcmVzdGFydHNcblxuICAgICAgLy8gbWVudVxuICAgICAgdmFyIGJ1aWxkTWVudSA9IHJlcXVpcmUoJy4uL21lbnUnKTtcbiAgICAgIGJ1aWxkTWVudShnYW1lLCBzZWxmKTsgLy8gVE9ETzogaXMgdGhlcmUgYSBiZXR0ZXIgYXBwcm9hY2ggdGhhbiBpbmplY3RpbmcgdGhlIHdob2xlIHN0YXRlIGludG8gdGhlIG1lbnUgdG8gbGV0IGl0IGFjY2VzcyBmdW5jdGlvbnMgZm9yIHJlc2V0dGluZyBzdGFnZSwgcGxheWVycywgbXVzaWM/XG5cbiAgICAgIHNlbGYucmVzdGFydCgpO1xuICAgICAgZ2FtZS5waHlzaWNzLnN0YXJ0U3lzdGVtKFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQuc3RhcnQoKTtcblxuICAgICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vZGF0YS9zZXR0aW5ncycpXG4gICAgICBnYW1lLmJnbS5wbGF5KHNldHRpbmdzLmJnbS5zZWxlY3RlZCk7XG4gICAgfSxcblxuICAgIHJlc3RhcnQ6IGZ1bmN0aW9uIHJlc3RhcnQoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGxheWVycyA9IHJlcXVpcmUoJy4uL2RhdGEvcGxheWVycycpKGdhbWUpO1xuICAgICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi4vZGF0YS9zZXR0aW5ncycpO1xuICAgICAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbiAgICAgIHZhciBzdGFnZUJ1aWxkZXIgPSByZXF1aXJlKCcuLi9zdGFnZUJ1aWxkZXInKShnYW1lKTtcbiAgICAgIHZhciBzdGFnZSA9IHV0aWxzLmdldFN0YWdlKCk7XG5cbiAgICAgIC8vIGNhbmNlbCBhbnkgdGltZW91dHMgZnJvbSB0aGUgbGFzdCBnYW1lXG4gICAgICBzZWxmLnRpbWVvdXRzLmZvckVhY2goZnVuY3Rpb24odGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gZGVzdHJveSBhbmQgcmVidWlsZCBzdGFnZSBhbmQgcGxheWVyc1xuICAgICAgdmFyIGRlc3Ryb3lHcm91cCA9IGZ1bmN0aW9uIGRlc3Ryb3lHcm91cChncm91cCkge1xuICAgICAgICBpZiAoIWdyb3VwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGdyb3VwLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBncm91cC5jaGlsZHJlblswXS5kZXN0cm95KCk7XG4gICAgICAgIH1cblxuICAgICAgICBncm91cC5kZXN0cm95KCk7XG4gICAgICB9XG5cbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLnBsYXllcnMpO1xuICAgICAgZGVzdHJveUdyb3VwKHNlbGYucGxhdGZvcm1zKTtcbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLmJhY2tncm91bmRzKTtcbiAgICAgIGRlc3Ryb3lHcm91cChzZWxmLmZvcmVncm91bmRzKTtcblxuICAgICAgLy8gVE9ETzogdWdoLCBjbGVhbiB0aGlzIHVwIVxuICAgICAgaWYgKHNlbGYuYmFja2dyb3VuZHMgJiYgc2VsZi5iYWNrZ3JvdW5kcy5sb29wKSB7XG4gICAgICAgIGdhbWUudGltZS5ldmVudHMucmVtb3ZlKHNlbGYuYmFja2dyb3VuZHMubG9vcCk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5mb3JlZ3JvdW5kcyAmJiBzZWxmLmZvcmVncm91bmRzLmxvb3ApIHtcbiAgICAgICAgZ2FtZS50aW1lLmV2ZW50cy5yZW1vdmUoc2VsZi5mb3JlZ3JvdW5kcy5sb29wKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5wbGF0Zm9ybXMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRQbGF0Zm9ybXMoKTtcbiAgICAgIHNlbGYuYmFja2dyb3VuZHMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRCYWNrZ3JvdW5kcygpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoc2VsZi5iYWNrZ3JvdW5kcyk7XG5cbiAgICAgIHNlbGYucGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICBnYW1lLnN1YlVpLmFkZChzZWxmLnBsYXllcnMpO1xuXG4gICAgICBnYW1lLnN1YlVpLmZ4ID0gZ2FtZS5hZGQuZ3JvdXAoKTtcbiAgICAgIGdhbWUuc3ViVWkuYWRkKGdhbWUuc3ViVWkuZngpO1xuXG4gICAgICB2YXIgYWRkUGxheWVyID0gZnVuY3Rpb24gYWRkUGxheWVyKHBsYXllcikge1xuICAgICAgICB2YXIgY2hlY2tGb3JHYW1lT3ZlciA9IGZ1bmN0aW9uIGNoZWNrRm9yR2FtZU92ZXIoKSB7XG4gICAgICAgICAgdmFyIGFsaXZlUGxheWVycyA9IFtdO1xuICAgICAgICAgIHNlbGYucGxheWVycy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKHBsYXllciwgaSkge1xuICAgICAgICAgICAgaWYgKCFwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgICAgICAgYWxpdmVQbGF5ZXJzLnB1c2gocGxheWVyLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChhbGl2ZVBsYXllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzZWxmLnZpY3RvcnlNc2cucGxheShhbGl2ZVBsYXllcnNbMF0pO1xuICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgZ2FtZS5zZngucGxheSgndmljdG9yeScpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgICAgc2VsZi50aW1lb3V0cy5wdXNoKHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVzdGFydCgpO1xuICAgICAgICAgICAgfSwgMzAwMCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNyZWF0ZVBsYXllciA9IHJlcXVpcmUoJy4uL3BsYXllcicpO1xuICAgICAgICB2YXIgbmV3UGxheWVyID0gc2VsZi5wbGF5ZXJzLmFkZChjcmVhdGVQbGF5ZXIoZ2FtZSwgcGxheWVyLCBjaGVja0ZvckdhbWVPdmVyKSk7XG4gICAgICAgIHZhciBwb3MgPSBzdGFnZS5zcGF3blBvaW50c1tpXTtcbiAgICAgICAgbmV3UGxheWVyLnBvc2l0aW9uLnggPSBwb3MueDtcbiAgICAgICAgbmV3UGxheWVyLnBvc2l0aW9uLnkgPSBwb3MueTtcbiAgICAgIH07XG5cbiAgICAgIC8vcGxheWVycy5mb3JFYWNoKGFkZFBsYXllcik7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2V0dGluZ3MucGxheWVyQ291bnQuc2VsZWN0ZWQ7IGkrKykge1xuICAgICAgICBhZGRQbGF5ZXIocGxheWVyc1tpXSwgaSk7XG4gICAgICB9XG5cbiAgICAgIHNlbGYuZm9yZWdyb3VuZHMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRGb3JlZ3JvdW5kcygpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoc2VsZi5mb3JlZ3JvdW5kcyk7XG5cbiAgICAgIGdhbWUuc2Z4LnBsYXkoJ3JvdW5kU3RhcnQnKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBcbiAgICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllcnMsIHRoaXMucGxhdGZvcm1zLCBmdW5jdGlvbiBoYW5kbGVQbGF0Zm9ybUNvbGxpc2lvbihwbGF5ZXIsIHBsYXRmb3JtKSB7XG4gICAgICAgIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmIHBsYXllci5pc0ZhbGxpbmcpIHtcbiAgICAgICAgICBwbGF5ZXIuaXNGYWxsaW5nID0gZmFsc2U7XG4gICAgICAgICAgLy8ga2ljayB1cCBkdXN0XG4gICAgICAgICAgdmFyIGR1c3QgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2xhbmQnKTtcbiAgICAgICAgICBnYW1lLnN1YlVpLmZ4LmFkZChkdXN0KTtcbiAgICAgICAgICBkdXN0LnBvc2l0aW9uLnggPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi54IC0gNDtcbiAgICAgICAgICBkdXN0LnBvc2l0aW9uLnkgPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi55ICsgcGxheWVyLmJvZHkuaGVpZ2h0IC0gMjtcblxuICAgICAgICAgIHZhciBhbmltID0gZHVzdC5hbmltYXRpb25zLmFkZCgnZHVzdCcpO1xuICAgICAgICAgIGR1c3QuYW5pbWF0aW9ucy5wbGF5KCdkdXN0JywgMzIvMyk7XG4gICAgICAgICAgYW5pbS5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGR1c3Qua2lsbCgpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVE9ETzogaG93IGRvIGkgZG8gdGhpcyBvbiB0aGUgcGxheWVyIGl0c2VsZiB3aXRob3V0IGFjY2VzcyB0byBwbGF5ZXJzPyBvciBzaG91bGQgaSBhZGQgYSBmdG4gdG8gcGxheWVyIGFuZCBzZXQgdGhhdCBhcyB0aGUgY2I/XG4gICAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5wbGF5ZXJzLCB0aGlzLnBsYXllcnMsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckNvbGxpc2lvbihwbGF5ZXJBLCBwbGF5ZXJCKSB7XG4gICAgICAgICAvKiBsZXQncyBub3Qga25vY2sgYW55Ym9keSBhcm91bmQgaWYgc29tZXRoaW5nJ3Mgb24gb25lIG9mIHRoZXNlIGR1ZGVzJy9kdWRldHRlcycgaGVhZHMuXG4gICAgICAgICBwcmV2ZW50cyBjYW5ub25iYWxsIGF0dGFja3MgYW5kIHRoZSBsaWtlLCBhbmQgYWxsb3dzIHN0YW5kaW5nIG9uIGhlYWRzLlxuICAgICAgICAgbm90ZTogc3RpbGwgbmVlZCB0byBjb2xsaWRlIGluIG9yZGVyIHRvIHRlc3QgdG91Y2hpbmcudXAsIHNvIGRvbid0IG1vdmUgdGhpcyB0byBhbGxvd1BsYXllckNvbGxpc2lvbiEgKi9cbiAgICAgICAgaWYgKHBsYXllckEuYm9keS50b3VjaGluZy51cCB8fCBwbGF5ZXJCLmJvZHkudG91Y2hpbmcudXApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyKSB7XG4gICAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IGZhbHNlO1xuICAgICAgICAgIHNlbGYudGltZW91dHMucHVzaChzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICAgICAgfSwgMTAwKSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBib3VuY2UoKSB7XG4gICAgICAgICAgZ2FtZS5zZngucGxheSgnYm91bmNlJyk7O1xuXG4gICAgICAgICAgdmFyIGJvdW5jZVZlbG9jaXR5ID0gNTA7XG4gICAgICAgICAgdmFyIHZlbG9jaXR5QSwgdmVsb2NpdHlCO1xuICAgICAgICAgIHZlbG9jaXR5QSA9IHZlbG9jaXR5QiA9IGJvdW5jZVZlbG9jaXR5O1xuICAgICAgICAgIGlmIChwbGF5ZXJBLnBvc2l0aW9uLnggPiBwbGF5ZXJCLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5QiAqPSAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmVsb2NpdHlBICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5ZXJBLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QTtcbiAgICAgICAgICBwbGF5ZXJCLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5QjtcbiAgICAgICAgICBwbGF5ZXJBLmlzUm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAgIHBsYXllckIuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmbGluZygpIHtcbiAgICAgICAgICBnYW1lLnNmeC5wbGF5KCdib3VuY2UnKTtcblxuICAgICAgICAgIHZhciBwbGF5ZXJUb0ZsaW5nO1xuICAgICAgICAgIHZhciBwbGF5ZXJUb0xlYXZlO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLmlzRHVja2luZykge1xuICAgICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckI7XG4gICAgICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxheWVyVG9GbGluZyA9IHBsYXllckE7XG4gICAgICAgICAgICBwbGF5ZXJUb0xlYXZlID0gcGxheWVyQjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvRmxpbmcpO1xuICAgICAgICAgIHZhciBmbGluZ1hWZWxvY2l0eSA9IDc1O1xuICAgICAgICAgIGlmIChwbGF5ZXJUb0ZsaW5nLnBvc2l0aW9uLnggPiBwbGF5ZXJUb0xlYXZlLnBvc2l0aW9uLngpIHtcbiAgICAgICAgICAgIGZsaW5nWFZlbG9jaXR5ICo9IC0xO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5ZXJUb0ZsaW5nLmJvZHkudmVsb2NpdHkueCA9IGZsaW5nWFZlbG9jaXR5O1xuICAgICAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS55ID0gLTc1O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcG9wKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LnBsYXkoJ2JvdW5jZScpO1xuXG4gICAgICAgICAgdmFyIHBsYXllclRvUG9wO1xuICAgICAgICAgIGlmIChwbGF5ZXJBLmlzUm9sbGluZykge1xuICAgICAgICAgICAgcGxheWVyVG9Qb3AgPSBwbGF5ZXJCO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRlbXBvcmFyaWx5RGlzYWJsZUNvbGxpc2lvbihwbGF5ZXJUb1BvcCk7XG4gICAgICAgICAgcGxheWVyVG9Qb3AuYm9keS52ZWxvY2l0eS55ID0gLTc1O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJvdGhSb2xsaW5nID0gcGxheWVyQS5pc1JvbGxpbmcgJiYgcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgICAgIHZhciBib3RoU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgJiYgIXBsYXllckIuaXNEdWNraW5nO1xuICAgICAgICB2YXIgbmVpdGhlclJvbGxpbmcgPSAhcGxheWVyQS5pc1JvbGxpbmcgJiYgIXBsYXllckIuaXNSb2xsaW5nO1xuICAgICAgICB2YXIgZWl0aGVyRHVja2luZyA9IHBsYXllckEuaXNEdWNraW5nIHx8IHBsYXllckIuaXNEdWNraW5nO1xuICAgICAgICB2YXIgZWl0aGVyUnVubmluZyA9IE1hdGguYWJzKHBsYXllckEuYm9keS52ZWxvY2l0eS54KSA+IDI4IHx8IE1hdGguYWJzKHBsYXllckIuYm9keS52ZWxvY2l0eS54KSA+PSAyODtcbiAgICAgICAgdmFyIGVpdGhlclJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyB8fCBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICAgICAgdmFyIGVpdGhlclN0YW5kaW5nID0gIXBsYXllckEuaXNEdWNraW5nIHx8ICFwbGF5ZXJCLmlzRHVja2luZztcblxuICAgICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgICBjYXNlIGJvdGhSb2xsaW5nIHx8IGJvdGhTdGFuZGluZzpcbiAgICAgICAgICAgIGJvdW5jZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBuZWl0aGVyUm9sbGluZyAmJiBlaXRoZXJSdW5uaW5nICYmIGVpdGhlckR1Y2tpbmc6XG4gICAgICAgICAgICBmbGluZygpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBlaXRoZXJSb2xsaW5nICYmIGVpdGhlclN0YW5kaW5nOlxuICAgICAgICAgICAgcG9wKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIG9mIHRoZSB0b3VjaGluZyBwbGF5ZXJzIGlzIGF0dGFja2luZy4uLlxuICAgICAgICBpZiAocGxheWVyQS5pc0F0dGFja2luZyAhPT0gcGxheWVyQi5pc0F0dGFja2luZykge1xuICAgICAgICAgIHZhciB2aWN0aW0gPSBwbGF5ZXJBLmlzQXR0YWNraW5nID8gcGxheWVyQiA6IHBsYXllckE7XG4gICAgICAgICAgaWYgKHBsYXllckEub3JpZW50YXRpb24gIT09IHBsYXllckIub3JpZW50YXRpb24pIHtcbiAgICAgICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpY3RpbS5hY3Rpb25zLnRha2VEYW1hZ2UoMik7IC8vIGF0dGFja2VkIGZyb20gYmVoaW5kIGZvciBkb3VibGUgZGFtYWdlXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH0sIGZ1bmN0aW9uIGFsbG93UGxheWVyQ29sbGlzaW9uKHBsYXllckEsIHBsYXllckIpIHtcbiAgICAgICAgLy8gZG9uJ3QgYWxsb3cgY29sbGlzaW9uIGlmIGVpdGhlciBwbGF5ZXIgaXNuJ3QgY29sbGlkYWJsZS5cbiAgICAgICAgLy8gYWxzbyBkaXNhbGxvdyBpZiBwbGF5ZXIgaXMgaW4gbGltYm8gYmVsb3cgdGhlIHNjcmVlbiA6XVxuICAgICAgICBpZiAoIXBsYXllckEuaXNDb2xsaWRhYmxlIHx8ICFwbGF5ZXJCLmlzQ29sbGlkYWJsZSB8fCBwbGF5ZXJBLnBvc2l0aW9uLnkgPiBnYW1lLmhlaWdodCB8fCBwbGF5ZXJCLnBvc2l0aW9uLnkgPiBnYW1lLmhlaWdodCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbiAgXG4gIHJldHVybiBwbGF5O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5O1xuIiwidmFyIFNwbGFzaCA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHNwbGFzaCA9IHtcbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5iZ20ucGxheSgndGl0bGUnKTtcbiAgICAgIGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnaGFuZ2FyJyk7XG4gICAgICB2YXIgdGl0bGUgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3RpdGxlJyk7XG4gICAgICB0aXRsZS5hbmltYXRpb25zLmFkZCgndGl0bGUnKTtcbiAgICAgIHRpdGxlLmFuaW1hdGlvbnMucGxheSgndGl0bGUnLCAzMi8zLCB0cnVlKTtcblxuICAgICAgdmFyIHN0YXJ0R2FtZSA9IGZ1bmN0aW9uIHN0YXJ0R2FtZSgpIHtcbiAgICAgICAgaWYgKGdhbWUuc3RhdGUuY3VycmVudCA9PT0gJ3NwbGFzaCcpIHtcbiAgICAgICAgICBnYW1lLmJnbS5wbGF5KCdOb25lJyk7XG4gICAgICAgICAgZ2FtZS5zdGF0ZS5zdGFydCgncGxheScpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBzdGFydCBnYW1lIHdoZW4gc3RhcnQvZW50ZXIgaXMgcHJlc3NlZFxuICAgICAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkT25jZShzdGFydEdhbWUpO1xuICAgICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5zdXBwb3J0ZWQgJiYgZ2FtZS5pbnB1dC5nYW1lcGFkLmFjdGl2ZSAmJiBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5jb25uZWN0ZWQpIHtcbiAgICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGRPbmNlKHN0YXJ0R2FtZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHNwbGFzaDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3BsYXNoO1xuIiwidmFyIHV0aWxzID0ge1xuICAvLyBmcm9tIHVuZGVyc2NvcmVcbiAgZGVib3VuY2U6IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuXHR2YXIgdGltZW91dDtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcblx0XHR2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0aWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdFx0fTtcblx0XHR2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcblx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0dGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuXHRcdGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHR9O1xuICB9LFxuXG4gIGNlbnRlcjogZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgZW50aXR5LmFuY2hvci5zZXRUbygwLjUpO1xuICB9LFxuXG4gIC8vIFRPRE86IGNvbnNpZGVyIGluamVjdGluZyBkZXBlbmRlbmNpZXNcbiAgZ2V0U3RhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGFnZXMgPSByZXF1aXJlKCcuL2RhdGEvc3RhZ2VzJyk7XG4gICAgdmFyIHNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXRhL3NldHRpbmdzJyk7XG4gICAgdmFyIHN0YWdlID0gc3RhZ2VzLmZpbHRlcihmdW5jdGlvbihzdGFnZSkge1xuICAgICAgcmV0dXJuIHN0YWdlLm5hbWUgPT09IHNldHRpbmdzLnN0YWdlLnNlbGVjdGVkO1xuICAgIH0pWzBdO1xuICAgIHJldHVybiBzdGFnZTtcbiAgfSxcblxuICBnZXRSYW5kb21BcnJheUVsZW1lbnQ6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIGFycmF5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFycmF5Lmxlbmd0aCldO1xuICB9LFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dGlscztcbiJdfQ==
