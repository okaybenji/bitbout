var createPlayer = function createPlayer(game, config) {
  config = config || {};
  var xPos = config.x || 4;
  var yPos = config.y || 8;
  var orientation = config.orientation || 'left';
  config.keys = config.keys || {};
  var keys = {
    up: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.up] || 'UP'),
    down: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.down] || 'DOWN'),
    left: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.left] || 'LEFT'),
    right: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.right] || 'RIGHT'),
  };

  var player = game.add.sprite(xPos, yPos, 'square');
  player.orientation = orientation;
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
      if (player.body.touching.down) {
        player.body.velocity.y = -200;
        setTimeout(function() {
          // todo: uncouple key tracking from movement
          if (!keys.up.isDown) {
            player.body.velocity.y = 50;
          }
        }, 100);
      // wall jumps
      } else if (player.body.touching.left) {
        player.body.velocity.y = -240;
        player.body.velocity.x = 90;
      } else if (player.body.touching.right) {
        player.body.velocity.y = -240;
        player.body.velocity.x = -90;
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
