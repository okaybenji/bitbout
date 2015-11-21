var createPlayer = function createPlayer(game, options) {
  
  var defaults = {
    x: 4,
    y: 8,
    orientation: 'left',
    keys: {
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
    },
  };
  
  var settings = Object.assign({}, defaults, options);

  var keys = {
    up: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.up]),
    down: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.down]),
    left: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.left]),
    right: game.input.keyboard.addKey(Phaser.Keyboard[settings.keys.right]),
  };

  var player = game.add.sprite(settings.x, settings.y, 'square');
  player.orientation = settings.orientation;
  player.isRolling = false;
  player.isDucking = false;
  player.isCollidable = true;
  player.scale.setTo(4, 8);
  game.physics.arcade.enable(player);
  player.body.bounce.y = 0.1;
  player.body.gravity.y = 380;

  var movement = {
    run: function run(direction) {
      var maxSpeed = 64;
      var acceleration = player.body.touching.down ? 8 : 3; // players have less control in the air

      player.orientation = direction;

      switch (direction) {
        case 'left':
          player.body.velocity.x = Math.max(player.body.velocity.x - acceleration, -maxSpeed);
          break;
        case 'right':
          player.body.velocity.x = Math.min(player.body.velocity.x + acceleration, maxSpeed);
          break;
      }
    },

    jump: function jump() {
      // soften upward velocity when player releases jump key
      var dampenJump = function dampenJump() {
        var dampenToPercent = 0.5;
        // TODO: decouple key tracking from movement
        keys.up.onUp.addOnce(function() {
          if (player.body.velocity.y < 0) {
            player.body.velocity.y *= dampenToPercent;
          }
        });
      };

      if (player.body.touching.down) {
        player.body.velocity.y = -200;
        dampenJump();
      // wall jumps
      } else if (player.body.touching.left) {
        player.body.velocity.y = -240;
        player.body.velocity.x = 90;
        dampenJump();
      } else if (player.body.touching.right) {
        player.body.velocity.y = -240;
        player.body.velocity.x = -90;
        dampenJump();
      }

    },

    duck: function duck() {
      if (!player.isDucking) {
        player.scale.setTo(4, 4);
        player.y += 8;
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
      player.y -= 8;
      player.scale.setTo(4, 8);
      player.isDucking = false;
      player.isRolling = false;
    }
  };

  // phaser apparently automatically calls any function named update attached to a sprite!
  player.update = function() {
    game.world.wrap(player, 0, true);

    if (keys.left.isDown && !keys.right.isDown) {
      movement.run('left');
    } else if (keys.right.isDown && !keys.left.isDown) {
      movement.run('right');
    }

    if (keys.up.isDown) {
      movement.jump();
    }

    if (keys.down.isDown) {
      movement.duck();
    } else if (player.isDucking) {
      movement.stand();
    }

    (function friction() {
      // here's an idea which solves the sliding glitch, but it doesn't feel as good
      /*if (player.body.touching.down && !keys.left.isDown && !keys.right.isDown) {
        if (player.body.velocity.x !== 0) {
          player.body.velocity.x -= player.body.velocity.x / 8;
        }
      }*/
      if (player.body.touching.down && !player.isRolling) {
        if (player.body.velocity.x > 0) {
          player.body.velocity.x -= 4;
        } else if (player.body.velocity.x < 0) {
          player.body.velocity.x += 4;
        }
      }
    }());
  };

  return player;
};

module.exports = createPlayer;
