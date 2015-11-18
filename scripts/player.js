var createPlayer = function createPlayer(game, config) {
  config = config || {};
  var xPos = config.x || 4;
  var yPos = config.y || 8;
  config.keys = config.keys || {};
  var keys = {
    up: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.up] || 'UP'),
    down: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.down] || 'DOWN'),
    left: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.left] || 'LEFT'),
    right: game.input.keyboard.addKey(Phaser.Keyboard[config.keys.right] || 'RIGHT'),
  };

  var player = game.add.sprite(xPos, yPos, 'square');
  player.scale.setTo(4, 8);
  game.physics.arcade.enable(player);
  player.body.bounce.y = 0.1;
  player.body.gravity.y = 380;

  // phaser apparently automatically calls any function named update attached to a sprite!
  player.update = function() {
    game.world.wrap(player, 0, true);

    (function friction() {
      if (player.body.touching.down) {
        if (player.body.velocity.x > 0) {
          player.body.velocity.x -= 4;
        } else if (player.body.velocity.x < 0) {
          player.body.velocity.x += 4;
        }
      }
    }());

    (function playerControls() {
      (function run() {
        var maxSpeed = 64;
        switch (true) {
          // players have less control in the air
          case keys.left.isDown:
            if (player.body.touching.down) {
              player.body.velocity.x = Math.max(player.body.velocity.x - 8, -maxSpeed);
            } else {
              player.body.velocity.x = Math.max(player.body.velocity.x - 3, -maxSpeed);
            }
            break;
          case keys.right.isDown:
            if (player.body.touching.down) {
              player.body.velocity.x = Math.min(player.body.velocity.x + 8, maxSpeed);
            } else {
              player.body.velocity.x = Math.min(player.body.velocity.x + 3, maxSpeed);
            }
            break;
        }
      }());

      (function jump() {
        if (keys.up.isDown) {
          switch (true) {
            case player.body.touching.down:
              player.body.velocity.y = -200;
              break;
            // wall jumps
            case player.body.touching.left:
              player.body.velocity.y = -240;
              player.body.velocity.x = 90;
              break;
            case player.body.touching.right:
              player.body.velocity.y = -240;
              player.body.velocity.x = -90;
              break;
          }
        }
      }());

      (function duck() {
        // is this bad practice? adding boolean to phaser's keys
        if (typeof keys.down.wasDown === 'undefined') {
          keys.down.wasDown = false;
        }

        if (keys.down.isDown) {
          player.scale.setTo(4, 4);
          if (!keys.down.wasDown) {
            player.y += 8;
          }
          keys.down.wasDown = true;
        } else if (keys.down.wasDown) {
          keys.down.wasDown = false;
          player.y -= 8;
          player.scale.setTo(4, 8);
        }
      }());
    }());
  };

  return player;
};

module.exports = createPlayer;