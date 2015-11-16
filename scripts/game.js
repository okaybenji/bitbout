(function game() {
  var nativeWidth = 320;
  var nativeHeight = 180;
  var player, platforms;

  var resize = function resize() {
    var zoom = $(window).width() / nativeWidth * 100;
    $("html").css("zoom", zoom + "%");
  };

  var preload = function preload() {
    resize();
    game.load.image('square', 'images/square.png');
  };

  var create = function create() {
    // work-around for Phaser's shoddy world wrap
    var worldMargin = 16;
    game.world.setBounds(-worldMargin, -worldMargin, nativeWidth + worldMargin * 2, nativeHeight + worldMargin * 2);
    
    game.physics.startSystem(Phaser.Physics.ARCADE);

    (function addPlayer() {
      player = game.add.sprite(8, 16, 'square');
      player.scale.setTo(4, 8);
      game.physics.arcade.enable(player);
      player.body.bounce.y = 0.1;
      player.body.gravity.y = 380;
    }());

    (function buildLevel() {
      platforms = game.add.group();
      platforms.enableBody = true;
      var platformPositions = [[48, 64], [208, 64], 
                                   [128, 104],
                               [48, 154,], [208, 154]];

      platformPositions.forEach(function(position) {
        var platform = platforms.create(position[0], position[1], 'square');
        platform.scale.setTo(24, 4);
        platform.body.immovable = true;
      });
      
      var walls = [];
      walls.push(platforms.create(-16, 32, 'square'));
      walls.push(platforms.create(304, 32, 'square'));
      walls.forEach(function(wall) {
        wall.scale.setTo(16, 74);
        wall.body.immovable = true;
      });
    }());
  };

  var update = function update() {
    game.physics.arcade.collide(player, platforms);
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
      cursors = game.input.keyboard.createCursorKeys();

      (function run() {
        var maxSpeed = 64;
        switch (true) {
          // players have less control in the air
          case cursors.left.isDown:
            if (player.body.touching.down) {
              player.body.velocity.x = Math.max(player.body.velocity.x - 8, -maxSpeed);
            } else {
              player.body.velocity.x = Math.max(player.body.velocity.x - 3, -maxSpeed);
            }
            break;
          case cursors.right.isDown:
            if (player.body.touching.down) {
              player.body.velocity.x = Math.min(player.body.velocity.x + 8, maxSpeed);
            } else {
              player.body.velocity.x = Math.min(player.body.velocity.x + 3, maxSpeed);
            }
            break;
        }
      }());

      (function jump() {
        if (cursors.up.isDown) {
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
        // is this bad practice? adding boolean to phaser's cursors
        if (typeof cursors.down.wasDown === 'undefined') {
          cursors.down.wasDown = false;
        }

        if (cursors.down.isDown) {
          player.scale.setTo(4, 4);
          if (!cursors.down.wasDown) {
            player.y += 8;
          }
          cursors.down.wasDown = true;
        } else if (cursors.down.wasDown) {
          cursors.down.wasDown = false;
          player.y -= 8;
          player.scale.setTo(4, 8);
        }
      }());
    }());
  };

  var game = new Phaser.Game(nativeWidth, nativeHeight, Phaser.AUTO, '#game', {
    preload: preload,
    create: create,
    update: update,
  });
}());
