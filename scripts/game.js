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
    game.load.image('rectangle', 'images/rectangle.png');
  };

  var create = function create() {
    // work-around for Phaser's shoddy world wrap
    var worldMargin = 16;
    game.world.setBounds(-worldMargin, -worldMargin, nativeWidth + worldMargin * 2, nativeHeight + worldMargin * 2);
    game.physics.startSystem(Phaser.Physics.ARCADE);

    (function addPlayer() {
      player = game.add.sprite(20, 160, 'square');
      player.scale.setTo(8, 8);
      game.physics.arcade.enable(player);
      player.body.bounce.y = 0.2;
      player.body.gravity.y = 300;
      //player.body.collideWorldBounds = true;
    }());

    (function buildLevel() {
      platforms = game.add.group();
      platforms.enableBody = true;
      var platformPositions = [[-64, 32], [0,32], [64,32], [192,32], [256,32], [320, 32],
                               [64, 80], [128, 80], [192,80],
                               [-64, 112], [0, 112], [256, 112], [320, 112],
                               [128, 128],
                               [-64, 176], [0, 176], [64, 176], [192, 176], [256, 176], [320, 176]];

      platformPositions.forEach(function(position) {
        var platform = platforms.create(position[0], position[1], 'rectangle');
        platform.scale.setTo(8, 6);
        platform.body.immovable = true;
      });
    }());
  };

  var update = function update() {
    game.physics.arcade.collide(player, platforms);

    // controls/movement
    cursors = game.input.keyboard.createCursorKeys();
    player.body.velocity.x = 0; //  Reset the players velocity (movement)

    switch (true) {
      case cursors.left.isDown:
        player.body.velocity.x = -64;
        break;
      case cursors.right.isDown:
        player.body.velocity.x = 64;
        break;
      default:
        break;
    }

    //  jump
    if (cursors.up.isDown && player.body.touching.down) {
      player.body.velocity.y = -200;
    }

    console.log('game.world.wrap', game.world.wrap);
    game.world.wrap(player, 0, true);
  };

  var game = new Phaser.Game(nativeWidth, nativeHeight, Phaser.AUTO, '#game', {
    preload: preload,
    create: create,
    update: update,
  });
}());
