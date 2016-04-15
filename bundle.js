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
    options: ['hangar', 'title', 'None'],
    selected: 'hangar',
  },
  stage: {
    options: stages.map(function(stage) {
      return stage.name;
    }),
    selected: 'Hangar',
  }
};

module.exports = settings;

},{"./stages":3}],3:[function(require,module,exports){
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
  "theme": "title",
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

      game.subUi.add(dust); // mount below ui elements (winner message)
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

},{"./data/settings":2,"./utils":13}],10:[function(require,module,exports){
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
      game.subUi.add(self.platforms);
      game.subUi.add(self.backgrounds);

      self.players = game.add.group();
      game.subUi.add(self.players);

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
              self.restart();
            }, 3000);
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

      self.foreground = stageBuilder.buildForeground();
      game.subUi.add(self.foreground);

      game.sfx.play('roundStart');
    },

    update: function update() {
      var self = this;
      
      game.physics.arcade.collide(this.players, this.platforms, function handlePlatformCollision(player, platform) {
        if (player.body.touching.down && player.isFalling) {
          player.isFalling = false;
          // kick up dust
          var dust = game.add.sprite(0, 0, 'land');
          game.subUi.add(dust);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL2RhdGEvcGxheWVycy5qcyIsInNjcmlwdHMvZGF0YS9zZXR0aW5ncy5qcyIsInNjcmlwdHMvZGF0YS9zdGFnZXMuanMiLCJzY3JpcHRzL21haW4uanMiLCJzY3JpcHRzL21lbnUuanMiLCJzY3JpcHRzL211c2ljLmpzIiwic2NyaXB0cy9wbGF5ZXIuanMiLCJzY3JpcHRzL3NmeC5qcyIsInNjcmlwdHMvc3RhZ2VCdWlsZGVyLmpzIiwic2NyaXB0cy9zdGF0ZXMvbG9hZGluZy5qcyIsInNjcmlwdHMvc3RhdGVzL3BsYXkuanMiLCJzY3JpcHRzL3N0YXRlcy9zcGxhc2guanMiLCJzY3JpcHRzL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUGxheWVycyA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgICB2YXIgcGxheWVycyA9IFt7XG4gICAgICBuYW1lOiAnQmx1ZScsXG4gICAgICBjb2xvcjogJ2JsdWUnLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnVycsIGRvd246ICdTJywgbGVmdDogJ0EnLCByaWdodDogJ0QnLCBhdHRhY2s6ICdRJ1xuICAgICAgfSxcbiAgICB9LCB7XG4gICAgICBuYW1lOiAnUGluaycsXG4gICAgICBjb2xvcjogJ3BpbmsnLFxuICAgICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDIsXG4gICAgICBvcmllbnRhdGlvbjogJ2xlZnQnLFxuICAgIH0sIHtcbiAgICAgIG5hbWU6ICdHcmVlbicsXG4gICAgICBjb2xvcjogJ2dyZWVuJyxcbiAgICAgIGdhbWVwYWQ6IGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQzLFxuICAgICAga2V5czoge1xuICAgICAgICB1cDogJ0knLCBkb3duOiAnSycsIGxlZnQ6ICdKJywgcmlnaHQ6ICdMJywgYXR0YWNrOiAnVSdcbiAgICAgIH0sXG4gICAgfSwge1xuICAgICAgbmFtZTogJ1B1cnBsZScsXG4gICAgICBjb2xvcjogJ3B1cnBsZScsXG4gICAgICBnYW1lcGFkOiBnYW1lLmlucHV0LmdhbWVwYWQucGFkNCxcbiAgICAgIG9yaWVudGF0aW9uOiAnbGVmdCcsXG4gICAgICBrZXlzOiB7XG4gICAgICAgIHVwOiAnVCcsIGRvd246ICdHJywgbGVmdDogJ0YnLCByaWdodDogJ0gnLCBhdHRhY2s6ICdSJ1xuICAgICAgfSxcbiAgfV07XG4gIFxuICByZXR1cm4gcGxheWVycztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVycztcbiIsInZhciBzdGFnZXMgPSByZXF1aXJlKCcuL3N0YWdlcycpO1xuXG52YXIgc2V0dGluZ3MgPSB7XG4gIHBsYXllckNvdW50OiB7XG4gICAgb3B0aW9uczogWzIsIDMsIDRdLFxuICAgIHNlbGVjdGVkOiA0LFxuICB9LFxuICBiZ206IHtcbiAgICBvcHRpb25zOiBbJ2hhbmdhcicsICd0aXRsZScsICdOb25lJ10sXG4gICAgc2VsZWN0ZWQ6ICdoYW5nYXInLFxuICB9LFxuICBzdGFnZToge1xuICAgIG9wdGlvbnM6IHN0YWdlcy5tYXAoZnVuY3Rpb24oc3RhZ2UpIHtcbiAgICAgIHJldHVybiBzdGFnZS5uYW1lO1xuICAgIH0pLFxuICAgIHNlbGVjdGVkOiAnSGFuZ2FyJyxcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZXR0aW5ncztcbiIsInZhciBzdGFnZXMgPSBbe1xuICBcIm5hbWVcIjogXCJBXCIsXG4gIFwidGhlbWVcIjogXCJOb25lXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzEwLCA3XSxcbiAgICAgIFs0NSwgN10sXG4gICAgICBbMjcsIDE1XSxcbiAgICAgIFsxMCwgMjVdLFxuICAgICAgWzQ1LCAyNV0sXG4gICAgICBbMTAsIDQ0XSxcbiAgICAgIFs0NSwgNDRdLFxuICAgICAgWzI3LCA1Ml0sXG4gICAgICBbMTAsIDYyXSxcbiAgICAgIFs0NSwgNjJdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwieWVsbG93XCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbXSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAwIH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiAwIH0sXG4gICAgeyBcInhcIjogMTQsIFwieVwiOiAxOCB9LFxuICAgIHsgXCJ4XCI6IDQ4LCBcInlcIjogMTggfVxuICBdLFxuICBcInVpQ29sb3JcIjogXCIjMjhGMTI5XCJcbn0se1xuICBcIm5hbWVcIjogXCJCXCIsXG4gIFwiYmFja2dyb3VuZENvbG9yXCI6IFwiIzAwMFwiLFxuICBcInBsYXRmb3Jtc1wiOiB7XG4gICAgXCJwb3NpdGlvbnNcIjogW1xuICAgICAgWzI3LCA2XSxcbiAgICAgIFsxMCwgMTNdLFxuICAgICAgWzQ1LCAxM10sXG4gICAgICBbNCwgMjJdLFxuICAgICAgWzUwLCAyMl0sXG4gICAgICBbMTgsIDMxXSxcbiAgICAgIFsyNywgMzFdLFxuICAgICAgWzM3LCAzMV0sXG4gICAgICBbNCwgNDRdLFxuICAgICAgWzUwLCA0NF0sXG4gICAgICBbMjcsIDYwXVxuICAgIF0sXG4gICAgXCJjb2xvclwiOiBcImdyYXlcIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFtdLFxuICBcImZvcmVncm91bmRcIjogXCJjbGVhclwiLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA5LCBcInlcIjogMTUgfSxcbiAgICB7IFwieFwiOiA1NCwgXCJ5XCI6IDE1IH1cbiAgXSxcbiAgXCJ1aUNvbG9yXCI6IFwiIzI4RDZGMVwiXG59LHtcbiAgXCJuYW1lXCI6IFwiSGFuZ2FyXCIsXG4gIFwidGhlbWVcIjogXCJoYW5nYXJcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbOCwgMzRdLFxuICAgICAgWzEyLCAzNF0sXG4gICAgICBbMjIsIDM0XSxcbiAgICAgIFszMSwgMzRdLFxuICAgICAgWzQxLCAzNF0sXG4gICAgICBbNDYsIDM0XSxcbiAgICBdLFxuICAgIFwiY29sb3JcIjogXCJncmF5XCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kc1wiOiBbe1xuICAgIGltYWdlOiAnaGFuZ2FyJ1xuICB9XSxcbiAgXCJmb3JlZ3JvdW5kXCI6IFwiY2xlYXJcIixcbiAgXCJzcGF3blBvaW50c1wiOiBbXG4gICAgeyBcInhcIjogMTAsIFwieVwiOiAyNyB9LFxuICAgIHsgXCJ4XCI6IDE5LCBcInlcIjogMjcgfSxcbiAgICB7IFwieFwiOiA0MSwgXCJ5XCI6IDI3IH0sXG4gICAgeyBcInhcIjogNTAsIFwieVwiOiAyNyB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiM4RDhEOERcIlxufSx7XG4gIFwibmFtZVwiOiBcIldhdGVyZmFsbFwiLFxuICBcInRoZW1lXCI6IFwidGl0bGVcIixcbiAgXCJiYWNrZ3JvdW5kQ29sb3JcIjogXCIjMDAwXCIsXG4gIFwicGxhdGZvcm1zXCI6IHtcbiAgICBcInBvc2l0aW9uc1wiOiBbXG4gICAgICBbMTAsIDEzXSxcbiAgICAgIFs0NSwgMTNdLFxuICAgICAgWzI3LCAyMV0sXG4gICAgICBbMTAsIDMxXSxcbiAgICAgIFs0NSwgMzFdXG4gICAgXSxcbiAgICBcImNvbG9yXCI6IFwiYnJvd25cIlxuICB9LFxuICBcImJhY2tncm91bmRzXCI6IFt7XG4gICAgaW1hZ2U6ICd3YXRlcmZhbGwnXG4gIH1dLFxuICBcImZvcmVncm91bmRcIjogXCJjbGVhclwiLFxuICBcInNwYXduUG9pbnRzXCI6IFtcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiA0OCwgXCJ5XCI6IDYgfSxcbiAgICB7IFwieFwiOiAxNCwgXCJ5XCI6IDI0IH0sXG4gICAgeyBcInhcIjogNDgsIFwieVwiOiAyNCB9XG4gIF0sXG4gIFwidWlDb2xvclwiOiBcIiM3ODNFMDhcIlxufV07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VzO1xuIiwidmFyIHJlc2l6ZSA9IGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS56b29tID0gd2luZG93LmlubmVySGVpZ2h0IC8gZ2FtZS5oZWlnaHQ7XG59O1xuXG52YXIgbWFpbiA9IHtcbiAgcHJlbG9hZDogZnVuY3Rpb24gcHJlbG9hZCgpIHtcbiAgICB2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbiAgICByZXNpemUoKTtcbiAgICB3aW5kb3cub25yZXNpemUgPSB1dGlscy5kZWJvdW5jZShyZXNpemUsIDEwMCk7XG4gICAgXG4gICAgLy8gYWxsb3cgYW55dGhpbmcgdXAgdG8gaGVpZ2h0IG9mIHdvcmxkIHRvIGZhbGwgb2ZmLXNjcmVlbiB1cCBvciBkb3duXG4gICAgZ2FtZS53b3JsZC5zZXRCb3VuZHMoMCwgLWdhbWUud2lkdGgsIGdhbWUud2lkdGgsIGdhbWUuaGVpZ2h0ICogMyk7XG4gICAgXG4gICAgLy8gcHJldmVudCBnYW1lIHBhdXNpbmcgd2hlbiBpdCBsb3NlcyBmb2N1c1xuICAgIGdhbWUuc3RhZ2UuZGlzYWJsZVZpc2liaWxpdHlDaGFuZ2UgPSB0cnVlO1xuICAgIFxuICAgIC8vIGFzc2V0cyB1c2VkIGluIGxvYWRpbmcgc2NyZWVuXG4gICAgZ2FtZS5sb2FkLmltYWdlKCdsb2FkaW5nJywgJ2ltYWdlcy9sb2FkaW5nLmdpZicpO1xuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgIGdhbWUuc3RhdGUuYWRkKCdsb2FkaW5nJywgcmVxdWlyZSgnLi9zdGF0ZXMvbG9hZGluZycpKGdhbWUpKTtcbiAgICBnYW1lLnN0YXRlLnN0YXJ0KCdsb2FkaW5nJyk7XG4gIH1cbn07XG5cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDY0LCA2NCwgUGhhc2VyLkFVVE8sICdnYW1lJywge1xuICBwcmVsb2FkOiBtYWluLnByZWxvYWQsXG4gIGNyZWF0ZTogbWFpbi5jcmVhdGVcbn0sIGZhbHNlLCBmYWxzZSk7IC8vIGRpc2FibGUgYW50aS1hbGlhc2luZ1xuXG5nYW1lLnN0YXRlLmFkZCgnbWFpbicsIG1haW4pO1xuZ2FtZS5zdGF0ZS5zdGFydCgnbWFpbicpO1xuIiwidmFyIGJ1aWxkTWVudSA9IGZ1bmN0aW9uIGJ1aWxkTWVudShnYW1lLCBzdGF0ZSkge1xuICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MnKTtcblxuICB2YXIgY3ljbGVTZXR0aW5nID0gZnVuY3Rpb24gY3ljbGVTZXR0aW5nKCkge1xuICAgIHZhciBvcHRpb25JbmRleCA9IHRoaXMuc2V0dGluZy5vcHRpb25zLmluZGV4T2YodGhpcy5zZXR0aW5nLnNlbGVjdGVkKTtcbiAgICBvcHRpb25JbmRleCsrO1xuICAgIGlmIChvcHRpb25JbmRleCA9PT0gdGhpcy5zZXR0aW5nLm9wdGlvbnMubGVuZ3RoKSB7XG4gICAgICBvcHRpb25JbmRleCA9IDA7XG4gICAgfVxuICAgIHRoaXMuc2V0dGluZy5zZWxlY3RlZCA9IHRoaXMuc2V0dGluZy5vcHRpb25zW29wdGlvbkluZGV4XTtcbiAgfTtcblxuICB2YXIgbWVudSA9IFt7XG4gICAgbmFtZTogJ1BsYXllcnMnLFxuICAgIHNldHRpbmc6IHNldHRpbmdzLnBsYXllckNvdW50LFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcbiAgICAgIHN0YXRlLnJlc3RhcnQoKTtcbiAgICB9LFxuICAgIHNlbGVjdGVkOiB0cnVlXG4gIH0sIHtcbiAgICBuYW1lOiAnQkdNJyxcbiAgICBzZXR0aW5nOiBzZXR0aW5ncy5iZ20sXG4gICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgIGN5Y2xlU2V0dGluZy5jYWxsKHRoaXMpO1xuICAgICAgZ2FtZS5iZ20ucGxheShzZXR0aW5ncy5iZ20uc2VsZWN0ZWQpO1xuICAgIH0sXG4gIH0sIHtcbiAgICBuYW1lOiAnU3RhZ2UnLFxuICAgIHNldHRpbmc6IHNldHRpbmdzLnN0YWdlLFxuICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBjeWNsZVNldHRpbmcuY2FsbCh0aGlzKTtcblxuICAgICAgLy8gaWYgc3RhZ2UgaGFzIGEgZGVmYXVsdCBiZ20sIGxvYWQgaXRcbiAgICAgIHZhciBzdGFnZXMgPSByZXF1aXJlKCcuL2RhdGEvc3RhZ2VzJyk7XG4gICAgICB2YXIgc2VsZWN0ZWRTdGFnZSA9IHN0YWdlc1tzZXR0aW5ncy5zdGFnZS5vcHRpb25zLmluZGV4T2Yoc2V0dGluZ3Muc3RhZ2Uuc2VsZWN0ZWQpXTtcbiAgICAgIGlmIChzZWxlY3RlZFN0YWdlLnRoZW1lKSB7XG4gICAgICAgIHNldHRpbmdzLmJnbS5zZWxlY3RlZCA9IHNlbGVjdGVkU3RhZ2UudGhlbWU7XG4gICAgICB9XG4gICAgICBnYW1lLmJnbS5wbGF5KHNldHRpbmdzLmJnbS5zZWxlY3RlZCk7XG5cbiAgICAgIHN0YXRlLnJlc3RhcnQoKTtcbiAgICB9LFxuICB9LCB7XG4gICAgbmFtZTogJ1N0YXJ0JyxcbiAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgc3RhdGUucmVzdGFydCgpO1xuICAgIH1cbiAgfV07XG5cbiAgdmFyIGNoYW5nZVBsYXllckNvdW50ID0gbWVudVswXS5hY3Rpb24uYmluZChtZW51WzBdKTtcbiAgdmFyIGNoYW5nZUJnbSA9IG1lbnVbMV0uYWN0aW9uLmJpbmQobWVudVsxXSk7XG4gIHZhciBjaGFuZ2VTdGFnZSA9IG1lbnVbMl0uYWN0aW9uLmJpbmQobWVudVsyXSk7XG4gIHZhciByZXN0YXJ0ID0gbWVudVszXS5hY3Rpb24uYmluZChtZW51WzNdKTtcblxuICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuUCkub25Eb3duLmFkZChjaGFuZ2VQbGF5ZXJDb3VudCk7XG4gIGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5NKS5vbkRvd24uYWRkKGNoYW5nZVN0YWdlKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkIpLm9uRG93bi5hZGQoY2hhbmdlQmdtKTtcbiAgZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkVOVEVSKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnN1cHBvcnRlZCAmJiBnYW1lLmlucHV0LmdhbWVwYWQuYWN0aXZlKSB7XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICAgIGlmIChnYW1lLmlucHV0LmdhbWVwYWQucGFkMi5jb25uZWN0ZWQpIHtcbiAgICAgIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQyLmdldEJ1dHRvbihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUQVJUKS5vbkRvd24uYWRkKHJlc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDMuY29ubmVjdGVkKSB7XG4gICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMy5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZChyZXN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQ0LmNvbm5lY3RlZCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDQuZ2V0QnV0dG9uKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RBUlQpLm9uRG93bi5hZGQocmVzdGFydCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG1lbnU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGJ1aWxkTWVudTtcbiIsInZhciBiZ20gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBsYXllciA9IG5ldyBDaGlwdHVuZUpzUGxheWVyKG5ldyBDaGlwdHVuZUpzQ29uZmlnKC0xKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBwbGF5OiBmdW5jdGlvbihmaWxlTmFtZSkge1xuICAgICAgaWYgKGZpbGVOYW1lID09PSAnTm9uZScpIHtcbiAgICAgICAgcGxheWVyLnN0b3AuY2FsbChwbGF5ZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGxheWVyLmxvYWQoJy4vbXVzaWMvJyArIGZpbGVOYW1lICsgJy54bScsIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgIHBsYXllci5wbGF5KGJ1ZmZlcik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYmdtO1xuIiwidmFyIGNyZWF0ZVBsYXllciA9IGZ1bmN0aW9uIGNyZWF0ZVBsYXllcihnYW1lLCBvcHRpb25zLCBvbkRlYXRoKSB7XG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBvcmllbnRhdGlvbjogJ3JpZ2h0JyxcbiAgICBrZXlzOiB7XG4gICAgICB1cDogJ1VQJyxcbiAgICAgIGRvd246ICdET1dOJyxcbiAgICAgIGxlZnQ6ICdMRUZUJyxcbiAgICAgIHJpZ2h0OiAnUklHSFQnLFxuICAgICAgYXR0YWNrOiAnU0hJRlQnXG4gICAgfSxcbiAgICBzY2FsZToge1xuICAgICAgeDogMSxcbiAgICAgIHk6IDJcbiAgICB9LFxuICAgIGNvbG9yOiAncGluaycsXG4gICAgZ2FtZXBhZDogZ2FtZS5pbnB1dC5nYW1lcGFkLnBhZDEsXG4gIH07XG5cbiAgdmFyIHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuXG4gIHZhciBrZXlzID0ge1xuICAgIHVwOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy51cF0pLFxuICAgIGRvd246IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLmRvd25dKSxcbiAgICBsZWZ0OiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5sZWZ0XSksXG4gICAgcmlnaHQ6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZFtzZXR0aW5ncy5rZXlzLnJpZ2h0XSksXG4gICAgYXR0YWNrOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmRbc2V0dGluZ3Mua2V5cy5hdHRhY2tdKSxcbiAgfTtcblxuICB2YXIgZ2FtZXBhZCA9IHNldHRpbmdzLmdhbWVwYWQ7XG5cbiAgdmFyIGFjdGlvbnMgPSB7XG4gICAgYXR0YWNrOiBmdW5jdGlvbiBhdHRhY2soKSB7XG4gICAgICB2YXIgZHVyYXRpb24gPSAyMDA7XG4gICAgICB2YXIgaW50ZXJ2YWwgPSA2MDA7XG4gICAgICB2YXIgdmVsb2NpdHkgPSAxMDA7XG5cbiAgICAgIHZhciBjYW5BdHRhY2sgPSAoRGF0ZS5ub3coKSA+IHBsYXllci5sYXN0QXR0YWNrZWQgKyBpbnRlcnZhbCkgJiYgIXBsYXllci5pc0R1Y2tpbmcgJiYgIXBsYXllci5pc1Blcm1hZGVhZDtcbiAgICAgIGlmICghY2FuQXR0YWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcGxheWVyLmlzQXR0YWNraW5nID0gdHJ1ZTtcbiAgICAgIHBsYXllci5sYXN0QXR0YWNrZWQgPSBEYXRlLm5vdygpO1xuXG4gICAgICBnYW1lLnNmeC5wbGF5KCdhdHRhY2snKTtcblxuICAgICAgc3dpdGNoKHBsYXllci5vcmllbnRhdGlvbikge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLXZlbG9jaXR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IHZlbG9jaXR5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBwbGF5ZXIubG9hZFRleHR1cmUoJ3doaXRlJyk7XG4gICAgICBzZXRUaW1lb3V0KGFjdGlvbnMuZW5kQXR0YWNrLCBkdXJhdGlvbik7XG4gICAgfSxcblxuICAgIGVuZEF0dGFjazogZnVuY3Rpb24gZW5kQXR0YWNrKCkge1xuICAgICAgaWYgKHBsYXllci5hbGl2ZSAmJiBwbGF5ZXIuaXNBdHRhY2tpbmcpIHtcbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKHNldHRpbmdzLmNvbG9yKTtcbiAgICAgICAgcGxheWVyLmlzQXR0YWNraW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJ1bjogZnVuY3Rpb24gcnVuKGRpcmVjdGlvbikge1xuICAgICAgdmFyIG1heFNwZWVkID0gMzI7XG4gICAgICB2YXIgYWNjZWxlcmF0aW9uID0gcGxheWVyLmJvZHkudG91Y2hpbmcuZG93biA/IDggOiAzOyAvLyBwbGF5ZXJzIGhhdmUgbGVzcyBjb250cm9sIGluIHRoZSBhaXJcbiAgICAgIHBsYXllci5vcmllbnRhdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgLy8gaWYgcGxheWVyIGlzIGdvaW5nIGZhc3RlciB0aGFuIG1heCBydW5uaW5nIHNwZWVkIChkdWUgdG8gYXR0YWNrLCBldGMpLCBzbG93IHRoZW0gZG93biBvdmVyIHRpbWVcbiAgICAgICAgICBpZiAocGxheWVyLmJvZHkudmVsb2NpdHkueCA8IC1tYXhTcGVlZCkge1xuICAgICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCArPSBhY2NlbGVyYXRpb247XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSBNYXRoLm1heChwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC0gYWNjZWxlcmF0aW9uLCAtbWF4U3BlZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID4gbWF4U3BlZWQpIHtcbiAgICAgICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggLT0gYWNjZWxlcmF0aW9uO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gTWF0aC5taW4ocGxheWVyLmJvZHkudmVsb2NpdHkueCArIGFjY2VsZXJhdGlvbiwgbWF4U3BlZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAganVtcDogZnVuY3Rpb24ganVtcCgpIHtcbiAgICAgIGlmICghcGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiAhcGxheWVyLmJvZHkudG91Y2hpbmcubGVmdCAmJiAhcGxheWVyLmJvZHkudG91Y2hpbmcucmlnaHQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgZHVzdDtcblxuICAgICAgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmRvd24pIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMDA7XG4gICAgICAgIGdhbWUuc2Z4LnBsYXkoJ2p1bXAnKTtcbiAgICAgICAgZHVzdCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnanVtcCcpO1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnggPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi54IC0gNDtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi55ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueSArIHBsYXllci5ib2R5LmhlaWdodCAtIDI7XG4gICAgICAvLyB3YWxsIGp1bXBzXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLmxlZnQpIHtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSA9IC0xMjA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggPSA0NTtcbiAgICAgICAgZ2FtZS5zZngucGxheSgnanVtcCcpO1xuICAgICAgICBkdXN0ID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsYW5kJyk7XG4gICAgICAgIGR1c3QucG9zaXRpb24ueCA9IHBsYXllci5ib2R5LnBvc2l0aW9uLnggKyAyO1xuICAgICAgICBkdXN0LnBvc2l0aW9uLnkgPSBwbGF5ZXIuYm9keS5wb3NpdGlvbi55IC0gcGxheWVyLmJvZHkuaGVpZ2h0O1xuICAgICAgICBkdXN0LmFuZ2xlID0gOTA7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnRvdWNoaW5nLnJpZ2h0KSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAtMTIwO1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID0gLTQ1O1xuICAgICAgICBnYW1lLnNmeC5wbGF5KCdqdW1wJyk7XG4gICAgICAgIGR1c3QgPSBnYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2xhbmQnKTtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi54ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueDtcbiAgICAgICAgZHVzdC5wb3NpdGlvbi55ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueSArIHBsYXllci5ib2R5LmhlaWdodDtcbiAgICAgICAgZHVzdC5hbmdsZSA9IC05MDtcbiAgICAgIH1cblxuICAgICAgZ2FtZS5zdWJVaS5hZGQoZHVzdCk7IC8vIG1vdW50IGJlbG93IHVpIGVsZW1lbnRzICh3aW5uZXIgbWVzc2FnZSlcbiAgICAgIHZhciBhbmltID0gZHVzdC5hbmltYXRpb25zLmFkZCgnZHVzdCcpO1xuICAgICAgZHVzdC5hbmltYXRpb25zLnBsYXkoJ2R1c3QnLCAzMi8zKTtcbiAgICAgIGFuaW0ub25Db21wbGV0ZS5hZGQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGR1c3Qua2lsbCgpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIGRhbXBlbkp1bXA6IGZ1bmN0aW9uIGRhbXBlbkp1bXAoKSB7XG4gICAgICAvLyBzb2Z0ZW4gdXB3YXJkIHZlbG9jaXR5IHdoZW4gcGxheWVyIHJlbGVhc2VzIGp1bXAga2V5XG4gICAgICAgIHZhciBkYW1wZW5Ub1BlcmNlbnQgPSAwLjU7XG5cbiAgICAgICAgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPCAwKSB7XG4gICAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueSAqPSBkYW1wZW5Ub1BlcmNlbnQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZHVjazogZnVuY3Rpb24gZHVjaygpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNBdHRhY2tpbmcgfHwgcGxheWVyLmlzUGVybWFkZWFkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFwbGF5ZXIuaXNEdWNraW5nICYmIHBsYXllci5ocCA+IDIpIHtcbiAgICAgICAgcGxheWVyLnNjYWxlLnNldFRvKHNldHRpbmdzLnNjYWxlLngsIHNldHRpbmdzLnNjYWxlLnkgLyAyKTtcbiAgICAgICAgYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG4gICAgICAgIHBsYXllci55ICs9IHNldHRpbmdzLnNjYWxlLnk7XG4gICAgICB9XG4gICAgICBwbGF5ZXIuaXNEdWNraW5nID0gdHJ1ZTtcblxuICAgICAgKGZ1bmN0aW9uIHJvbGwoKSB7XG4gICAgICAgIHZhciBjYW5Sb2xsID0gTWF0aC5hYnMocGxheWVyLmJvZHkudmVsb2NpdHkueCkgPiAyNSAmJiBwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duO1xuICAgICAgICBpZiAoY2FuUm9sbCkge1xuICAgICAgICAgIHBsYXllci5pc1JvbGxpbmcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KCkpO1xuICAgIH0sXG5cbiAgICBzdGFuZDogZnVuY3Rpb24gc3RhbmQoKSB7XG4gICAgICBpZiAocGxheWVyLmhwID4gMikge1xuICAgICAgICBwbGF5ZXIueSAtPSBzZXR0aW5ncy5zY2FsZS55O1xuICAgICAgfVxuICAgICAgYWN0aW9ucy5hcHBseUhlYWx0aEVmZmVjdHMoKTtcbiAgICAgIHBsYXllci5pc0R1Y2tpbmcgPSBmYWxzZTtcbiAgICAgIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgdGFrZURhbWFnZTogZnVuY3Rpb24gdGFrZURhbWFnZShhbW91bnQpIHtcbiAgICAgIC8vIHByZXZlbnQgdGFraW5nIG1vcmUgZGFtYWdlIHRoYW4gaHAgcmVtYWluaW5nIGluIGN1cnJlbnQgbGlmZVxuICAgICAgaWYgKGFtb3VudCA+IDEgJiYgKHBsYXllci5ocCAtIGFtb3VudCkgJSAyICE9PSAwKSB7XG4gICAgICAgIGFtb3VudCA9IDE7XG4gICAgICB9XG5cbiAgICAgIHBsYXllci5ocCAtPSBhbW91bnQ7XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPCAwKSB7XG4gICAgICAgIHBsYXllci5ocCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAocGxheWVyLmhwICUgMiA9PT0gMCkge1xuICAgICAgICBhY3Rpb25zLmRpZSgpO1xuICAgICAgfVxuICAgICAgYWN0aW9ucy5hcHBseUhlYWx0aEVmZmVjdHMoKTtcbiAgICB9LFxuXG4gICAgYXBwbHlIZWFsdGhFZmZlY3RzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBuZXdQbGF5ZXJIZWlnaHQgPSBNYXRoLm1heChNYXRoLnJvdW5kKHBsYXllci5ocCAvIDIpLCAxKTtcbiAgICAgIHBsYXllci5zY2FsZS5zZXRUbyhzZXR0aW5ncy5zY2FsZS54LCBuZXdQbGF5ZXJIZWlnaHQpO1xuICAgICAgYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG5cbiAgICAgIGlmIChwbGF5ZXIuaHAgPT09IDApIHtcbiAgICAgICAgcmV0dXJuOyAvLyBiaXQncyBiZWNvbWluZyBhIGdob3N0OyBsZWF2ZXMgaXRzIHNjYXJmIChvciBsYWNrIHRoZXJlb2YpIGFsb25lXG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ocCAlIDIgPT09IDEpIHtcbiAgICAgICAgcGxheWVyLnNjYXJmLnZpc2libGUgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBsYXllci5zY2FyZi52aXNpYmxlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXBwbHlPcmllbnRhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICBwbGF5ZXIuc2NhbGUuc2V0VG8ocGxheWVyLm9yaWVudGF0aW9uID09PSAnbGVmdCcgPyBzZXR0aW5ncy5zY2FsZS54IDogLXNldHRpbmdzLnNjYWxlLngsIHBsYXllci5zY2FsZS55KTtcbiAgICB9LFxuXG4gICAgZGllOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocGxheWVyLmhwID4gMCkge1xuICAgICAgICBhY3Rpb25zLmFwcGx5SW52dWxuZXJhYmlsaXR5KCk7XG5cbiAgICAgICAgZ2FtZS5zZngucGxheSgnZGllJyk7XG4gICAgICAgIGFjdGlvbnMuZW5kQXR0YWNrKCk7XG4gICAgICAgIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuXG4gICAgICAgIHZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICAgICAgdmFyIHJlc3Bhd25Qb3NpdGlvbiA9IHV0aWxzLmdldFJhbmRvbUFycmF5RWxlbWVudCh1dGlscy5nZXRTdGFnZSgpLnNwYXduUG9pbnRzKTtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnggPSByZXNwYXduUG9zaXRpb24ueDtcbiAgICAgICAgcGxheWVyLnBvc2l0aW9uLnkgPSByZXNwYXduUG9zaXRpb24ueTtcbiAgICAgICAgcGxheWVyLmJvZHkudmVsb2NpdHkueCA9IDA7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FtZS5zZngucGxheSgncGVybWFkaWUnKTtcbiAgICAgICAgcGxheWVyLmFscGhhID0gMC41O1xuICAgICAgICBwbGF5ZXIuaXNQZXJtYWRlYWQgPSB0cnVlO1xuICAgICAgICBvbkRlYXRoKCk7IC8vIFRPRE86IHRoaXMgY291bGQgcHJvYmFibHkgYmUgYmV0dGVyIGFyY2hpdGVjdGVkXG4gICAgICB9XG4gICAgfSxcblxuICAgIGFwcGx5SW52dWxuZXJhYmlsaXR5OiBmdW5jdGlvbigpIHtcbiAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSBmYWxzZTtcblxuICAgICAgdmFyIHNldENvbG9yID0gZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgLy8gaW4gY2FzZSBnYW1lIHJlc3RhcnRzIGFuZCBwbGF5ZXIgbm8gbG9uZ2VyIGV4aXN0cy4uLlxuICAgICAgICBpZiAoIXBsYXllci5hbGl2ZSkge1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoY29sb3JJbnRlcnZhbCk7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbCh3aGl0ZUludGVydmFsKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGxheWVyLmxvYWRUZXh0dXJlKGNvbG9yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBjb2xvckludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldENvbG9yKHNldHRpbmdzLmNvbG9yKTtcbiAgICAgIH0sIDE1MCk7XG4gICAgICB2YXIgd2hpdGVJbnRlcnZhbDtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHdoaXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZXRDb2xvcignd2hpdGUnKTtcbiAgICAgICAgfSwgMTUwKTtcbiAgICAgIH0sIDc1KTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFwbGF5ZXIuYWxpdmUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2xlYXJJbnRlcnZhbCh3aGl0ZUludGVydmFsKTtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChjb2xvckludGVydmFsKTtcbiAgICAgICAgc2V0Q29sb3Ioc2V0dGluZ3MuY29sb3IpOyAvLyBlbnN1cmUgcGxheWVyIGNvbG9yIHJldHVybnMgdG8gbm9ybWFsXG4gICAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSB0cnVlO1xuICAgICAgfSwgMTUwMCk7XG4gICAgfSxcbiAgfTtcblxuICB2YXIgcGxheWVyID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIHNldHRpbmdzLmNvbG9yKTtcbiAgcGxheWVyLm5hbWUgPSBzZXR0aW5ncy5uYW1lO1xuICBwbGF5ZXIub3JpZW50YXRpb24gPSBzZXR0aW5ncy5vcmllbnRhdGlvbjtcbiAgcGxheWVyLmFuY2hvci5zZXRUbygwLjUsIDAuNSk7IC8vIGFuY2hvciB0byBjZW50ZXIgdG8gYWxsb3cgZmxpcHBpbmdcblxuICBwbGF5ZXIuc2NhcmYgPSBnYW1lLmFkZC5zcHJpdGUoLTEsIC0xLCBzZXR0aW5ncy5jb2xvciArICdTY2FyZicpO1xuICBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9ucy5hZGQoJ3NjYXJmJyk7XG4gIHBsYXllci5zY2FyZi5hbmltYXRpb24gPSBwbGF5ZXIuc2NhcmYuYW5pbWF0aW9ucy5wbGF5KCdzY2FyZicsIDMyLzMsIHRydWUpO1xuICBwbGF5ZXIuc2NhcmYuc2V0U2NhbGVNaW5NYXgoLTEsIDEsIDEsIDEpO1xuICBwbGF5ZXIuYWRkQ2hpbGQocGxheWVyLnNjYXJmKTtcblxuICAvLyB0cmFjayBoZWFsdGhcbiAgcGxheWVyLmhwID0gcGxheWVyLm1heEhwID0gNjsgLy8gVE9ETzogYWxsb3cgc2V0dGluZyBjdXN0b20gaHAgYW1vdW50IGZvciBlYWNoIHBsYXllclxuICBwbGF5ZXIuYWN0aW9ucyA9IGFjdGlvbnM7XG4gIHBsYXllci5hY3Rpb25zLmFwcGx5SGVhbHRoRWZmZWN0cygpOyAvLyBUT0RPOiBhZGQgZ2lhbnQgbW9kZVxuXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHBsYXllcik7XG4gIHBsYXllci5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gIHBsYXllci5ib2R5LmJvdW5jZS55ID0gMC4yOyAvLyBUT0RPOiBhbGxvdyBib3VuY2UgY29uZmlndXJhdGlvblxuICBwbGF5ZXIuYm9keS5ncmF2aXR5LnkgPSAzODA7IC8vIFRPRE86IGFsbG93IGdyYXZpdHkgY29uZmlndXJhdGlvblxuXG4gIHBsYXllci51cFdhc0Rvd24gPSBmYWxzZTsgLy8gdHJhY2sgaW5wdXQgY2hhbmdlIGZvciB2YXJpYWJsZSBqdW1wIGhlaWdodFxuICBwbGF5ZXIuaXNGYWxsaW5nID0gZmFsc2U7XG4gIHBsYXllci5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzRHVja2luZyA9IGZhbHNlO1xuICBwbGF5ZXIuaXNBdHRhY2tpbmcgPSBmYWxzZTtcbiAgcGxheWVyLmlzUGVybWFkZWFkID0gZmFsc2U7XG4gIHBsYXllci5sYXN0QXR0YWNrZWQgPSAwO1xuICBwbGF5ZXIuaXNDb2xsaWRhYmxlID0gdHJ1ZTtcblxuICAvLyBwaGFzZXIgYXBwYXJlbnRseSBhdXRvbWF0aWNhbGx5IGNhbGxzIGFueSBmdW5jdGlvbiBuYW1lZCB1cGRhdGUgYXR0YWNoZWQgdG8gYSBzcHJpdGUhXG4gIHBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBraWxsIHBsYXllciBpZiBoZSBmYWxscyBvZmYgdGhlIHNjcmVlblxuICAgIGlmIChwbGF5ZXIucG9zaXRpb24ueSA+IDY0ICYmIHBsYXllci5ocCAhPT0gMCkgeyAvLyBUT0RPOiBob3cgdG8gYWNjZXNzIG5hdGl2ZSBoZWlnaHQgZnJvbSBnYW1lLmpzP1xuICAgICAgYWN0aW9ucy50YWtlRGFtYWdlKDIpO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS55ID4gODUpIHtcbiAgICAgIHBsYXllci5pc0ZhbGxpbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIHBsYXllci5zY2FyZi5hbmltYXRpb24uc3BlZWQgPSBNYXRoLmFicyhwbGF5ZXIuYm9keS52ZWxvY2l0eS54KSAqIDAuNzUgKyAzMi8zO1xuXG4gICAgdmFyIGlucHV0ID0ge1xuICAgICAgbGVmdDogICAoa2V5cy5sZWZ0LmlzRG93biAmJiAha2V5cy5yaWdodC5pc0Rvd24pIHx8XG4gICAgICAgICAgICAgIChnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfTEVGVCkgJiYgIWdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfRFBBRF9SSUdIVCkpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWCkgPCAtMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1gpIDwgLTAuMSxcbiAgICAgIHJpZ2h0OiAgKGtleXMucmlnaHQuaXNEb3duICYmICFrZXlzLmxlZnQuaXNEb3duKSB8fFxuICAgICAgICAgICAgICAoZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX1JJR0hUKSAmJiAhZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0xFRlQpKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmF4aXMoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVElDS19MRUZUX1gpID4gMC4xIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX1JJR0hUX1gpID4gMC4xLFxuICAgICAgdXA6ICAgICBrZXlzLnVwLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmlzRG93bihQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX0RQQURfVVApIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuaXNEb3duKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfQSksXG4gICAgICBkb3duOiAgIGtleXMuZG93bi5pc0Rvd24gfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5pc0Rvd24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9EUEFEX0RPV04pIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuYXhpcyhQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1NUSUNLX0xFRlRfWSkgPiAwLjEgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5heGlzKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfU1RJQ0tfUklHSFRfWSkgPiAwLjEsXG4gICAgICBhdHRhY2s6IGtleXMuYXR0YWNrLmlzRG93biB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfWCkgfHxcbiAgICAgICAgICAgICAgZ2FtZXBhZC5qdXN0UHJlc3NlZChQaGFzZXIuR2FtZXBhZC5YQk9YMzYwX1kpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9CKSB8fFxuICAgICAgICAgICAgICBnYW1lcGFkLmp1c3RQcmVzc2VkKFBoYXNlci5HYW1lcGFkLlhCT1gzNjBfTEVGVF9CVU1QRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9MRUZUX1RSSUdHRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9SSUdIVF9CVU1QRVIpIHx8XG4gICAgICAgICAgICAgIGdhbWVwYWQuanVzdFByZXNzZWQoUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9SSUdIVF9UUklHR0VSKSxcbiAgICB9O1xuXG4gICAgaWYgKGlucHV0LmxlZnQpIHtcbiAgICAgIGFjdGlvbnMucnVuKCdsZWZ0Jyk7XG4gICAgICBwbGF5ZXIuYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChpbnB1dC5yaWdodCkge1xuICAgICAgYWN0aW9ucy5ydW4oJ3JpZ2h0Jyk7XG4gICAgICBwbGF5ZXIuYWN0aW9ucy5hcHBseU9yaWVudGF0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS50b3VjaGluZy5kb3duICYmICFwbGF5ZXIuaXNSb2xsaW5nKSB7XG4gICAgICAvLyBhcHBseSBmcmljdGlvblxuICAgICAgaWYgKE1hdGguYWJzKHBsYXllci5ib2R5LnZlbG9jaXR5LngpIDwgMikge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54ICo9IDAuNTsgLy8gcXVpY2tseSBicmluZyBzbG93LW1vdmluZyBwbGF5ZXJzIHRvIGEgc3RvcFxuICAgICAgfSBlbHNlIGlmIChwbGF5ZXIuYm9keS52ZWxvY2l0eS54ID4gMCkge1xuICAgICAgICBwbGF5ZXIuYm9keS52ZWxvY2l0eS54IC09IDI7XG4gICAgICB9IGVsc2UgaWYgKHBsYXllci5ib2R5LnZlbG9jaXR5LnggPCAwKSB7XG4gICAgICAgIHBsYXllci5ib2R5LnZlbG9jaXR5LnggKz0gMjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5wdXQudXApIHtcbiAgICAgIHBsYXllci51cFdhc0Rvd24gPSB0cnVlO1xuICAgICAgYWN0aW9ucy5qdW1wKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIudXBXYXNEb3duKSB7XG4gICAgICBwbGF5ZXIudXBXYXNEb3duID0gZmFsc2U7XG4gICAgICBhY3Rpb25zLmRhbXBlbkp1bXAoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQuZG93bikge1xuICAgICAgYWN0aW9ucy5kdWNrKCk7XG4gICAgfSBlbHNlIGlmIChwbGF5ZXIuaXNEdWNraW5nKSB7XG4gICAgICBhY3Rpb25zLnN0YW5kKCk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LmF0dGFjaykge1xuICAgICAgYWN0aW9ucy5hdHRhY2soKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHBsYXllcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlUGxheWVyO1xuIiwiLyoqXG4gKiBFYWNoIHRpbWUgYSB1bmlxdWUgc291bmQgZmlsZW5hbWUgaXMgcGFzc2VkIGluLCBhIG5ldyBpbnN0YW5jZSBvZiBjaGlwdHVuZS5qcyB3aWxsIGJlIGNyZWF0ZWQgd2l0aCB0aGF0IHNvdW5kIGFzIGEgYnVmZmVyLlxuICogSWYgdGhlIHBsYXkgbWV0aG9kIGlzIGNhbGxlZCBvbiBzb3VuZCBmaWxlIHBhc3NlZCBpbiBwcmV2aW91c2x5LCBpdHMgcmVzcGVjdGl2ZSBpbnN0YW5jZSB3aWxsIHBsYXkgdGhlIGV4aXN0aW5nIGJ1ZmZlci5cbiAqIFRoaXMgZW5zdXJlcyB0aGUgZmlsZSBzeXN0ZW0gaXMgb25seSBoaXQgb25jZSBwZXIgc291bmQsIGFzIG5lZWRlZC5cbiAqIEl0IHdpbGwgYWxzbyBwcmV2ZW50IHNvdW5kcyBmcm9tICdzdGFja2luZycgLS0gdGhlIHNhbWUgc291bmQgcGxheWVkIHJlcGVhdGVkbHkgd2lsbCBpbnRlcnJ1cHQgaXRzZWxmIGVhY2ggdGltZS5cbiAqL1xudmFyIHNmeCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc291bmRiYW5rID0ge307XG5cbiAgcmV0dXJuIHtcbiAgICBwbGF5OiBmdW5jdGlvbihmaWxlTmFtZSkge1xuICAgICAgaWYgKHNvdW5kYmFua1tmaWxlTmFtZV0pIHtcbiAgICAgICAgc291bmRiYW5rW2ZpbGVOYW1lXS5wbGF5KHNvdW5kYmFua1tmaWxlTmFtZV0uYnVmZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0gPSBuZXcgQ2hpcHR1bmVKc1BsYXllcihuZXcgQ2hpcHR1bmVKc0NvbmZpZygwKSk7XG4gICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0ubG9hZCgnLi9zZngvJyArIGZpbGVOYW1lICsgJy54bScsIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0uYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgIHNvdW5kYmFua1tmaWxlTmFtZV0ucGxheShidWZmZXIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNmeDtcbiIsInZhciBzdGFnZUJ1aWxkZXIgPSBmdW5jdGlvbiBzdGFnZUJ1aWxkZXIoZ2FtZSkge1xuICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MnKTtcbiAgdmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICB2YXIgc3RhZ2UgPSB1dGlscy5nZXRTdGFnZSgpO1xuXG4gIGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gc3RhZ2UuYmFja2dyb3VuZENvbG9yO1xuXG4gIHZhciBidWlsZFBsYXRmb3JtcyA9IGZ1bmN0aW9uIGJ1aWxkUGxhdGZvcm1zKCkge1xuICAgIHZhciBwbGF0Zm9ybXMgPSBnYW1lLmFkZC5ncm91cCgpO1xuICAgIHBsYXRmb3Jtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcblxuICAgIHZhciBwbGF0Zm9ybVBvc2l0aW9ucyA9IHN0YWdlLnBsYXRmb3Jtcy5wb3NpdGlvbnM7XG4gICAgcGxhdGZvcm1Qb3NpdGlvbnMuZm9yRWFjaChmdW5jdGlvbihwb3NpdGlvbikge1xuICAgICAgdmFyIHBsYXRmb3JtID0gcGxhdGZvcm1zLmNyZWF0ZShwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sIHN0YWdlLnBsYXRmb3Jtcy5jb2xvcik7XG4gICAgICBwbGF0Zm9ybS5zY2FsZS5zZXRUbyg1LCAxKTtcbiAgICAgIHBsYXRmb3JtLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHZhciB3YWxscyA9IFtdO1xuICAgIHdhbGxzLnB1c2gocGxhdGZvcm1zLmNyZWF0ZSgtMywgLTEyLCBzdGFnZS5wbGF0Zm9ybXMuY29sb3IpKTtcbiAgICB3YWxscy5wdXNoKHBsYXRmb3Jtcy5jcmVhdGUoNjEsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKSk7XG4gICAgd2FsbHMuZm9yRWFjaChmdW5jdGlvbih3YWxsKSB7XG4gICAgICB3YWxsLnNjYWxlLnNldFRvKDMsIDM4KTtcbiAgICAgIHdhbGwuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIH0pO1xuXG4gICAgdmFyIGNlaWxpbmcgPSBwbGF0Zm9ybXMuY3JlYXRlKDAsIC0xMiwgc3RhZ2UucGxhdGZvcm1zLmNvbG9yKTtcbiAgICBjZWlsaW5nLnNjYWxlLnNldFRvKDMyLCAzKTtcbiAgICBjZWlsaW5nLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICBcbiAgICByZXR1cm4gcGxhdGZvcm1zO1xuICB9O1xuXG4gIHZhciBidWlsZEJhY2tncm91bmRzID0gZnVuY3Rpb24gYnVpbGRCYWNrZ3JvdW5kcygpIHtcbiAgICB2YXIgYmFja2dyb3VuZHMgPSBnYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgc3RhZ2UuYmFja2dyb3VuZHMuZm9yRWFjaChmdW5jdGlvbihsYXllcikge1xuICAgICAgdmFyIGJnO1xuICAgICAgaWYgKGxheWVyLnNjcm9sbGluZykge1xuICAgICAgICBiZyA9IGdhbWUuYWRkLnRpbGVTcHJpdGUoMCwgMCwgZ2FtZS53aWR0aCwgZ2FtZS5oZWlnaHQsIGxheWVyLmltYWdlKTtcbiAgICAgICAgYmFja2dyb3VuZHMubG9vcCA9IGdhbWUudGltZS5ldmVudHMubG9vcChQaGFzZXIuVGltZXIuUVVBUlRFUiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmcudGlsZVBvc2l0aW9uLnggLT0xO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJnID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsIGxheWVyLmltYWdlKTtcbiAgICAgIH1cbiAgICAgIGJhY2tncm91bmRzLmFkZChiZyk7XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIGJhY2tncm91bmRzO1xuICB9O1xuXG4gIHZhciBidWlsZEZvcmVncm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9yZWdyb3VuZCA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCBzdGFnZS5mb3JlZ3JvdW5kKTtcbiAgICByZXR1cm4gZm9yZWdyb3VuZDtcbiAgfTtcbiAgXG4gIHJldHVybiB7XG4gICAgYnVpbGRQbGF0Zm9ybXM6IGJ1aWxkUGxhdGZvcm1zLFxuICAgIGJ1aWxkRm9yZWdyb3VuZDogYnVpbGRGb3JlZ3JvdW5kLFxuICAgIGJ1aWxkQmFja2dyb3VuZHM6IGJ1aWxkQmFja2dyb3VuZHNcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhZ2VCdWlsZGVyO1xuIiwidmFyIExvYWRpbmcgPSBmdW5jdGlvbihnYW1lKSB7XG4gIHZhciBsb2FkaW5nID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsb2FkaW5nJyk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZycpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgfSxcblxuICAgIHByZWxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gaW1hZ2VzXG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ3RpdGxlJywgJ2ltYWdlcy9zcHJpdGVzaGVldC10aXRsZS5naWYnLCA2NCwgNjQpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCd2aWN0b3J5TXNnJywgJ2ltYWdlcy9zcHJpdGVzaGVldC13aW5uZXIuZ2lmJywgNTIsIDIyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnYmx1ZVNjYXJmJywgJ2ltYWdlcy9zcHJpdGVzaGVldC1zY2FyZi1ibHVlYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdwaW5rU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXNoZWV0LXNjYXJmLXBpbmtiaXQuZ2lmJywgNSwgMik7XG4gICAgICBnYW1lLmxvYWQuc3ByaXRlc2hlZXQoJ2dyZWVuU2NhcmYnLCAnaW1hZ2VzL3Nwcml0ZXNoZWV0LXNjYXJmLWdyZWVuYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdwdXJwbGVTY2FyZicsICdpbWFnZXMvc3ByaXRlc2hlZXQtc2NhcmYtcHVycGxlYml0LmdpZicsIDUsIDIpO1xuICAgICAgZ2FtZS5sb2FkLnNwcml0ZXNoZWV0KCdqdW1wJywgJ2ltYWdlcy9zcHJpdGVzaGVldC1qdW1wLmdpZicsIDEwLCAyKTtcbiAgICAgIGdhbWUubG9hZC5zcHJpdGVzaGVldCgnbGFuZCcsICdpbWFnZXMvc3ByaXRlc2hlZXQtbGFuZC5naWYnLCAxMCwgMik7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2NsZWFyJywgJ2ltYWdlcy9jbGVhci5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnd2hpdGUnLCAnaW1hZ2VzL3doaXRlLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdwaW5rJywgJ2ltYWdlcy9waW5rLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCd5ZWxsb3cnLCAnaW1hZ2VzL3llbGxvdy5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnYmx1ZScsICdpbWFnZXMvYmx1ZS5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgncHVycGxlJywgJ2ltYWdlcy9wdXJwbGUucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ29yYW5nZScsICdpbWFnZXMvb3JhbmdlLnBuZycpO1xuICAgICAgZ2FtZS5sb2FkLmltYWdlKCdncmVlbicsICdpbWFnZXMvZ3JlZW4ucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2dyYXknLCAnaW1hZ2VzL2dyYXkucG5nJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2Jyb3duJywgJ2ltYWdlcy9icm93bi5wbmcnKTtcbiAgICAgIGdhbWUubG9hZC5pbWFnZSgnd2F0ZXJmYWxsJywgJ2ltYWdlcy93YXRlcmZhbGwuZ2lmJyk7XG4gICAgICBnYW1lLmxvYWQuaW1hZ2UoJ2hhbmdhcicsICdpbWFnZXMvbGV2ZWwtaGFuZ2FyLXdpcC5naWYnKTtcblxuICAgICAgLy8gc291bmRcbiAgICAgIGdhbWUuYmdtID0gcmVxdWlyZSgnLi4vbXVzaWMnKSgpO1xuICAgICAgZ2FtZS5zZnggPSByZXF1aXJlKCcuLi9zZngnKSgpO1xuICAgIH0sXG5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG5cbiAgICAgIGdhbWUuc3RhdGUuYWRkKCdzcGxhc2gnLCByZXF1aXJlKCcuL3NwbGFzaCcpKGdhbWUpKTtcbiAgICAgIGdhbWUuc3RhdGUuYWRkKCdwbGF5JywgcmVxdWlyZSgnLi9wbGF5JykoZ2FtZSkpO1xuICAgICAgZ2FtZS5zdGF0ZS5zdGFydCgnc3BsYXNoJyk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIGxvYWRpbmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRpbmc7XG4iLCJ2YXIgUGxheSA9IGZ1bmN0aW9uKGdhbWUpIHtcbiAgdmFyIHBsYXkgPSB7XG4gICAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGdhbWUuc3ViVWkgPSBnYW1lLmFkZC5ncm91cCgpOyAvLyBwbGFjZSB0byBrZWVwIGFueXRoaW5nIG9uLXNjcmVlbiB0aGF0J3Mgbm90IFVJIHRvIGRlcHRoIHNvcnQgYmVsb3cgVUlcblxuICAgICAgLy8gZ2FtZSBvdmVyIHZpY3RvcnkgbWVzc2FnZSBkZWNsYXJpbmcgdGhlIHdpbm5lclxuICAgICAgc2VsZi52aWN0b3J5TXNnID0gZ2FtZS5hZGQuc3ByaXRlKDYsIDIxLCAndmljdG9yeU1zZycpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSBmYWxzZTtcbiAgICAgIHNlbGYudmljdG9yeU1zZy5hbmltYXRpb25zLmFkZCgnQmx1ZScsIFswLCA0LCA4LCAxMl0sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdQaW5rJywgWzEsIDUsIDksIDEzXSwgMzIvMywgdHJ1ZSk7XG4gICAgICBzZWxmLnZpY3RvcnlNc2cuYW5pbWF0aW9ucy5hZGQoJ0dyZWVuJywgWzIsIDYsIDEwLCAxNF0sIDMyLzMsIHRydWUpO1xuICAgICAgc2VsZi52aWN0b3J5TXNnLmFuaW1hdGlvbnMuYWRkKCdQdXJwbGUnLCBbMywgNywgMTEsIDE1XSwgMzIvMywgdHJ1ZSk7XG5cbiAgICAgIC8vIG1lbnVcbiAgICAgIHZhciBidWlsZE1lbnUgPSByZXF1aXJlKCcuLi9tZW51Jyk7XG4gICAgICBidWlsZE1lbnUoZ2FtZSwgc2VsZik7IC8vIFRPRE86IGlzIHRoZXJlIGEgYmV0dGVyIGFwcHJvYWNoIHRoYW4gaW5qZWN0aW5nIHRoZSB3aG9sZSBzdGF0ZSBpbnRvIHRoZSBtZW51IHRvIGxldCBpdCBhY2Nlc3MgZnVuY3Rpb25zIGZvciByZXNldHRpbmcgc3RhZ2UsIHBsYXllcnMsIG11c2ljP1xuXG4gICAgICBzZWxmLnJlc3RhcnQoKTtcbiAgICAgIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgICAgZ2FtZS5pbnB1dC5nYW1lcGFkLnN0YXJ0KCk7XG5cbiAgICAgIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL2RhdGEvc2V0dGluZ3MnKVxuICAgICAgZ2FtZS5iZ20ucGxheShzZXR0aW5ncy5iZ20uc2VsZWN0ZWQpO1xuICAgIH0sXG5cbiAgICByZXN0YXJ0OiBmdW5jdGlvbiByZXN0YXJ0KCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBsYXllcnMgPSByZXF1aXJlKCcuLi9kYXRhL3BsYXllcnMnKShnYW1lKTtcbiAgICAgIHZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJy4uL2RhdGEvc2V0dGluZ3MnKTtcbiAgICAgIHZhciB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XG4gICAgICB2YXIgc3RhZ2VCdWlsZGVyID0gcmVxdWlyZSgnLi4vc3RhZ2VCdWlsZGVyJykoZ2FtZSk7XG4gICAgICB2YXIgc3RhZ2UgPSB1dGlscy5nZXRTdGFnZSgpO1xuXG4gICAgICAvLyBkZXN0cm95IGFuZCByZWJ1aWxkIHN0YWdlIGFuZCBwbGF5ZXJzXG4gICAgICB2YXIgZGVzdHJveUdyb3VwID0gZnVuY3Rpb24gZGVzdHJveUdyb3VwKGdyb3VwKSB7XG4gICAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoZ3JvdXAuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGdyb3VwLmNoaWxkcmVuWzBdLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyb3VwLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgZGVzdHJveUdyb3VwKHNlbGYucGxheWVycyk7XG4gICAgICBkZXN0cm95R3JvdXAoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgZGVzdHJveUdyb3VwKHNlbGYuYmFja2dyb3VuZHMpO1xuXG4gICAgICAvLyBUT0RPOiB1Z2gsIGNsZWFuIHRoaXMgdXAhXG4gICAgICBpZiAoc2VsZi5iYWNrZ3JvdW5kcyAmJiBzZWxmLmJhY2tncm91bmRzLmxvb3ApIHtcbiAgICAgICAgZ2FtZS50aW1lLmV2ZW50cy5yZW1vdmUoc2VsZi5iYWNrZ3JvdW5kcy5sb29wKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLmZvcmVncm91bmQpIHtcbiAgICAgICAgc2VsZi5mb3JlZ3JvdW5kLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5wbGF0Zm9ybXMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRQbGF0Zm9ybXMoKTtcbiAgICAgIHNlbGYuYmFja2dyb3VuZHMgPSBzdGFnZUJ1aWxkZXIuYnVpbGRCYWNrZ3JvdW5kcygpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoc2VsZi5wbGF0Zm9ybXMpO1xuICAgICAgZ2FtZS5zdWJVaS5hZGQoc2VsZi5iYWNrZ3JvdW5kcyk7XG5cbiAgICAgIHNlbGYucGxheWVycyA9IGdhbWUuYWRkLmdyb3VwKCk7XG4gICAgICBnYW1lLnN1YlVpLmFkZChzZWxmLnBsYXllcnMpO1xuXG4gICAgICB2YXIgYWRkUGxheWVyID0gZnVuY3Rpb24gYWRkUGxheWVyKHBsYXllcikge1xuICAgICAgICB2YXIgY2hlY2tGb3JHYW1lT3ZlciA9IGZ1bmN0aW9uIGNoZWNrRm9yR2FtZU92ZXIoKSB7XG4gICAgICAgICAgdmFyIGFsaXZlUGxheWVycyA9IFtdO1xuICAgICAgICAgIHNlbGYucGxheWVycy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKHBsYXllciwgaSkge1xuICAgICAgICAgICAgaWYgKCFwbGF5ZXIuaXNQZXJtYWRlYWQpIHtcbiAgICAgICAgICAgICAgYWxpdmVQbGF5ZXJzLnB1c2gocGxheWVyLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChhbGl2ZVBsYXllcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzZWxmLnZpY3RvcnlNc2cucGxheShhbGl2ZVBsYXllcnNbMF0pO1xuICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgZ2FtZS5zZngucGxheSgndmljdG9yeScpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi52aWN0b3J5TXNnLnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgc2VsZi5yZXN0YXJ0KCk7XG4gICAgICAgICAgICB9LCAzMDAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBjcmVhdGVQbGF5ZXIgPSByZXF1aXJlKCcuLi9wbGF5ZXInKTtcbiAgICAgICAgdmFyIG5ld1BsYXllciA9IHNlbGYucGxheWVycy5hZGQoY3JlYXRlUGxheWVyKGdhbWUsIHBsYXllciwgY2hlY2tGb3JHYW1lT3ZlcikpO1xuICAgICAgICB2YXIgcG9zID0gc3RhZ2Uuc3Bhd25Qb2ludHNbaV07XG4gICAgICAgIG5ld1BsYXllci5wb3NpdGlvbi54ID0gcG9zLng7XG4gICAgICAgIG5ld1BsYXllci5wb3NpdGlvbi55ID0gcG9zLnk7XG4gICAgICB9O1xuXG4gICAgICAvL3BsYXllcnMuZm9yRWFjaChhZGRQbGF5ZXIpO1xuICAgICAgZm9yICh2YXIgaT0wOyBpPHNldHRpbmdzLnBsYXllckNvdW50LnNlbGVjdGVkOyBpKyspIHtcbiAgICAgICAgYWRkUGxheWVyKHBsYXllcnNbaV0sIGkpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLmZvcmVncm91bmQgPSBzdGFnZUJ1aWxkZXIuYnVpbGRGb3JlZ3JvdW5kKCk7XG4gICAgICBnYW1lLnN1YlVpLmFkZChzZWxmLmZvcmVncm91bmQpO1xuXG4gICAgICBnYW1lLnNmeC5wbGF5KCdyb3VuZFN0YXJ0Jyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgXG4gICAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5wbGF5ZXJzLCB0aGlzLnBsYXRmb3JtcywgZnVuY3Rpb24gaGFuZGxlUGxhdGZvcm1Db2xsaXNpb24ocGxheWVyLCBwbGF0Zm9ybSkge1xuICAgICAgICBpZiAocGxheWVyLmJvZHkudG91Y2hpbmcuZG93biAmJiBwbGF5ZXIuaXNGYWxsaW5nKSB7XG4gICAgICAgICAgcGxheWVyLmlzRmFsbGluZyA9IGZhbHNlO1xuICAgICAgICAgIC8vIGtpY2sgdXAgZHVzdFxuICAgICAgICAgIHZhciBkdXN0ID0gZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdsYW5kJyk7XG4gICAgICAgICAgZ2FtZS5zdWJVaS5hZGQoZHVzdCk7XG4gICAgICAgICAgZHVzdC5wb3NpdGlvbi54ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueCAtIDQ7XG4gICAgICAgICAgZHVzdC5wb3NpdGlvbi55ID0gcGxheWVyLmJvZHkucG9zaXRpb24ueSArIHBsYXllci5ib2R5LmhlaWdodCAtIDI7XG5cbiAgICAgICAgICB2YXIgYW5pbSA9IGR1c3QuYW5pbWF0aW9ucy5hZGQoJ2R1c3QnKTtcbiAgICAgICAgICBkdXN0LmFuaW1hdGlvbnMucGxheSgnZHVzdCcsIDMyLzMpO1xuICAgICAgICAgIGFuaW0ub25Db21wbGV0ZS5hZGQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkdXN0LmtpbGwoKTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFRPRE86IGhvdyBkbyBpIGRvIHRoaXMgb24gdGhlIHBsYXllciBpdHNlbGYgd2l0aG91dCBhY2Nlc3MgdG8gcGxheWVycz8gb3Igc2hvdWxkIGkgYWRkIGEgZnRuIHRvIHBsYXllciBhbmQgc2V0IHRoYXQgYXMgdGhlIGNiP1xuICAgICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMucGxheWVycywgdGhpcy5wbGF5ZXJzLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJDb2xsaXNpb24ocGxheWVyQSwgcGxheWVyQikge1xuICAgICAgICAgLyogbGV0J3Mgbm90IGtub2NrIGFueWJvZHkgYXJvdW5kIGlmIHNvbWV0aGluZydzIG9uIG9uZSBvZiB0aGVzZSBkdWRlcycvZHVkZXR0ZXMnIGhlYWRzLlxuICAgICAgICAgcHJldmVudHMgY2Fubm9uYmFsbCBhdHRhY2tzIGFuZCB0aGUgbGlrZSwgYW5kIGFsbG93cyBzdGFuZGluZyBvbiBoZWFkcy5cbiAgICAgICAgIG5vdGU6IHN0aWxsIG5lZWQgdG8gY29sbGlkZSBpbiBvcmRlciB0byB0ZXN0IHRvdWNoaW5nLnVwLCBzbyBkb24ndCBtb3ZlIHRoaXMgdG8gYWxsb3dQbGF5ZXJDb2xsaXNpb24hICovXG4gICAgICAgIGlmIChwbGF5ZXJBLmJvZHkudG91Y2hpbmcudXAgfHwgcGxheWVyQi5ib2R5LnRvdWNoaW5nLnVwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllcikge1xuICAgICAgICAgIHBsYXllci5pc0NvbGxpZGFibGUgPSBmYWxzZTtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcGxheWVyLmlzQ29sbGlkYWJsZSA9IHRydWU7XG4gICAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGJvdW5jZSgpIHtcbiAgICAgICAgICBnYW1lLnNmeC5wbGF5KCdib3VuY2UnKTs7XG5cbiAgICAgICAgICB2YXIgYm91bmNlVmVsb2NpdHkgPSA1MDtcbiAgICAgICAgICB2YXIgdmVsb2NpdHlBLCB2ZWxvY2l0eUI7XG4gICAgICAgICAgdmVsb2NpdHlBID0gdmVsb2NpdHlCID0gYm91bmNlVmVsb2NpdHk7XG4gICAgICAgICAgaWYgKHBsYXllckEucG9zaXRpb24ueCA+IHBsYXllckIucG9zaXRpb24ueCkge1xuICAgICAgICAgICAgdmVsb2NpdHlCICo9IC0xO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2ZWxvY2l0eUEgKj0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXllckEuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlBO1xuICAgICAgICAgIHBsYXllckIuYm9keS52ZWxvY2l0eS54ID0gdmVsb2NpdHlCO1xuICAgICAgICAgIHBsYXllckEuaXNSb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgcGxheWVyQi5pc1JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGZsaW5nKCkge1xuICAgICAgICAgIGdhbWUuc2Z4LnBsYXkoJ2JvdW5jZScpO1xuXG4gICAgICAgICAgdmFyIHBsYXllclRvRmxpbmc7XG4gICAgICAgICAgdmFyIHBsYXllclRvTGVhdmU7XG4gICAgICAgICAgaWYgKHBsYXllckEuaXNEdWNraW5nKSB7XG4gICAgICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQjtcbiAgICAgICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJBO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwbGF5ZXJUb0ZsaW5nID0gcGxheWVyQTtcbiAgICAgICAgICAgIHBsYXllclRvTGVhdmUgPSBwbGF5ZXJCO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0ZW1wb3JhcmlseURpc2FibGVDb2xsaXNpb24ocGxheWVyVG9GbGluZyk7XG4gICAgICAgICAgdmFyIGZsaW5nWFZlbG9jaXR5ID0gNzU7XG4gICAgICAgICAgaWYgKHBsYXllclRvRmxpbmcucG9zaXRpb24ueCA+IHBsYXllclRvTGVhdmUucG9zaXRpb24ueCkge1xuICAgICAgICAgICAgZmxpbmdYVmVsb2NpdHkgKj0gLTE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXllclRvRmxpbmcuYm9keS52ZWxvY2l0eS54ID0gZmxpbmdYVmVsb2NpdHk7XG4gICAgICAgICAgcGxheWVyVG9GbGluZy5ib2R5LnZlbG9jaXR5LnkgPSAtNzU7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwb3AoKSB7XG4gICAgICAgICAgZ2FtZS5zZngucGxheSgnYm91bmNlJyk7XG5cbiAgICAgICAgICB2YXIgcGxheWVyVG9Qb3A7XG4gICAgICAgICAgaWYgKHBsYXllckEuaXNSb2xsaW5nKSB7XG4gICAgICAgICAgICBwbGF5ZXJUb1BvcCA9IHBsYXllckI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBsYXllclRvUG9wID0gcGxheWVyQTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGVtcG9yYXJpbHlEaXNhYmxlQ29sbGlzaW9uKHBsYXllclRvUG9wKTtcbiAgICAgICAgICBwbGF5ZXJUb1BvcC5ib2R5LnZlbG9jaXR5LnkgPSAtNzU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYm90aFJvbGxpbmcgPSBwbGF5ZXJBLmlzUm9sbGluZyAmJiBwbGF5ZXJCLmlzUm9sbGluZztcbiAgICAgICAgdmFyIGJvdGhTdGFuZGluZyA9ICFwbGF5ZXJBLmlzRHVja2luZyAmJiAhcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgICAgIHZhciBuZWl0aGVyUm9sbGluZyA9ICFwbGF5ZXJBLmlzUm9sbGluZyAmJiAhcGxheWVyQi5pc1JvbGxpbmc7XG4gICAgICAgIHZhciBlaXRoZXJEdWNraW5nID0gcGxheWVyQS5pc0R1Y2tpbmcgfHwgcGxheWVyQi5pc0R1Y2tpbmc7XG4gICAgICAgIHZhciBlaXRoZXJSdW5uaW5nID0gTWF0aC5hYnMocGxheWVyQS5ib2R5LnZlbG9jaXR5LngpID4gMjggfHwgTWF0aC5hYnMocGxheWVyQi5ib2R5LnZlbG9jaXR5LngpID49IDI4O1xuICAgICAgICB2YXIgZWl0aGVyUm9sbGluZyA9IHBsYXllckEuaXNSb2xsaW5nIHx8IHBsYXllckIuaXNSb2xsaW5nO1xuICAgICAgICB2YXIgZWl0aGVyU3RhbmRpbmcgPSAhcGxheWVyQS5pc0R1Y2tpbmcgfHwgIXBsYXllckIuaXNEdWNraW5nO1xuXG4gICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICAgIGNhc2UgYm90aFJvbGxpbmcgfHwgYm90aFN0YW5kaW5nOlxuICAgICAgICAgICAgYm91bmNlKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIG5laXRoZXJSb2xsaW5nICYmIGVpdGhlclJ1bm5pbmcgJiYgZWl0aGVyRHVja2luZzpcbiAgICAgICAgICAgIGZsaW5nKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIGVpdGhlclJvbGxpbmcgJiYgZWl0aGVyU3RhbmRpbmc6XG4gICAgICAgICAgICBwb3AoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgb25seSBvbmUgb2YgdGhlIHRvdWNoaW5nIHBsYXllcnMgaXMgYXR0YWNraW5nLi4uXG4gICAgICAgIGlmIChwbGF5ZXJBLmlzQXR0YWNraW5nICE9PSBwbGF5ZXJCLmlzQXR0YWNraW5nKSB7XG4gICAgICAgICAgdmFyIHZpY3RpbSA9IHBsYXllckEuaXNBdHRhY2tpbmcgPyBwbGF5ZXJCIDogcGxheWVyQTtcbiAgICAgICAgICBpZiAocGxheWVyQS5vcmllbnRhdGlvbiAhPT0gcGxheWVyQi5vcmllbnRhdGlvbikge1xuICAgICAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmljdGltLmFjdGlvbnMudGFrZURhbWFnZSgyKTsgLy8gYXR0YWNrZWQgZnJvbSBiZWhpbmQgZm9yIGRvdWJsZSBkYW1hZ2VcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSwgZnVuY3Rpb24gYWxsb3dQbGF5ZXJDb2xsaXNpb24ocGxheWVyQSwgcGxheWVyQikge1xuICAgICAgICAvLyBkb24ndCBhbGxvdyBjb2xsaXNpb24gaWYgZWl0aGVyIHBsYXllciBpc24ndCBjb2xsaWRhYmxlLlxuICAgICAgICAvLyBhbHNvIGRpc2FsbG93IGlmIHBsYXllciBpcyBpbiBsaW1ibyBiZWxvdyB0aGUgc2NyZWVuIDpdXG4gICAgICAgIGlmICghcGxheWVyQS5pc0NvbGxpZGFibGUgfHwgIXBsYXllckIuaXNDb2xsaWRhYmxlIHx8IHBsYXllckEucG9zaXRpb24ueSA+IGdhbWUuaGVpZ2h0IHx8IHBsYXllckIucG9zaXRpb24ueSA+IGdhbWUuaGVpZ2h0KSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuICBcbiAgcmV0dXJuIHBsYXk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXk7XG4iLCJ2YXIgU3BsYXNoID0gZnVuY3Rpb24oZ2FtZSkge1xuICB2YXIgc3BsYXNoID0ge1xuICAgIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICBnYW1lLmJnbS5wbGF5KCd0aXRsZScpO1xuICAgICAgZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdoYW5nYXInKTtcbiAgICAgIHZhciB0aXRsZSA9IGdhbWUuYWRkLnNwcml0ZSgwLCAwLCAndGl0bGUnKTtcbiAgICAgIHRpdGxlLmFuaW1hdGlvbnMuYWRkKCd0aXRsZScpO1xuICAgICAgdGl0bGUuYW5pbWF0aW9ucy5wbGF5KCd0aXRsZScsIDMyLzMsIHRydWUpO1xuXG4gICAgICB2YXIgc3RhcnRHYW1lID0gZnVuY3Rpb24gc3RhcnRHYW1lKCkge1xuICAgICAgICBpZiAoZ2FtZS5zdGF0ZS5jdXJyZW50ID09PSAnc3BsYXNoJykge1xuICAgICAgICAgIGdhbWUuYmdtLnBsYXkoJ05vbmUnKTtcbiAgICAgICAgICBnYW1lLnN0YXRlLnN0YXJ0KCdwbGF5Jyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIHN0YXJ0IGdhbWUgd2hlbiBzdGFydC9lbnRlciBpcyBwcmVzc2VkXG4gICAgICBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuRU5URVIpLm9uRG93bi5hZGRPbmNlKHN0YXJ0R2FtZSk7XG4gICAgICBpZiAoZ2FtZS5pbnB1dC5nYW1lcGFkLnN1cHBvcnRlZCAmJiBnYW1lLmlucHV0LmdhbWVwYWQuYWN0aXZlICYmIGdhbWUuaW5wdXQuZ2FtZXBhZC5wYWQxLmNvbm5lY3RlZCkge1xuICAgICAgICBnYW1lLmlucHV0LmdhbWVwYWQucGFkMS5nZXRCdXR0b24oUGhhc2VyLkdhbWVwYWQuWEJPWDM2MF9TVEFSVCkub25Eb3duLmFkZE9uY2Uoc3RhcnRHYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIFxuICByZXR1cm4gc3BsYXNoO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcGxhc2g7XG4iLCJ2YXIgdXRpbHMgPSB7XG4gIC8vIGZyb20gdW5kZXJzY29yZVxuICBkZWJvdW5jZTogZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG5cdHZhciB0aW1lb3V0O1xuXHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXHRcdHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGltZW91dCA9IG51bGw7XG5cdFx0XHRpZiAoIWltbWVkaWF0ZSkgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHR9O1xuXHRcdHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuXHRcdGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0aWYgKGNhbGxOb3cpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cdH07XG4gIH0sXG5cbiAgY2VudGVyOiBmdW5jdGlvbihlbnRpdHkpIHtcbiAgICBlbnRpdHkuYW5jaG9yLnNldFRvKDAuNSk7XG4gIH0sXG5cbiAgLy8gVE9ETzogY29uc2lkZXIgaW5qZWN0aW5nIGRlcGVuZGVuY2llc1xuICBnZXRTdGFnZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0YWdlcyA9IHJlcXVpcmUoJy4vZGF0YS9zdGFnZXMnKTtcbiAgICB2YXIgc2V0dGluZ3MgPSByZXF1aXJlKCcuL2RhdGEvc2V0dGluZ3MnKTtcbiAgICB2YXIgc3RhZ2UgPSBzdGFnZXMuZmlsdGVyKGZ1bmN0aW9uKHN0YWdlKSB7XG4gICAgICByZXR1cm4gc3RhZ2UubmFtZSA9PT0gc2V0dGluZ3Muc3RhZ2Uuc2VsZWN0ZWQ7XG4gICAgfSlbMF07XG4gICAgcmV0dXJuIHN0YWdlO1xuICB9LFxuXG4gIGdldFJhbmRvbUFycmF5RWxlbWVudDogZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gYXJyYXlbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyYXkubGVuZ3RoKV07XG4gIH0sXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzO1xuIl19
