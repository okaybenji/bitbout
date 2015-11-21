(function() {
  var nativeWidth = 320;
  var nativeHeight = 180;
  var platforms, players;

  var resize = function resize() {
    document.body.style.zoom = window.innerWidth / nativeWidth;
  };

  var preload = function preload() {
    var utils = require('./utils.js');
    resize();
    window.onresize = utils.debounce(resize, 100);
    game.load.image('square', 'images/square.png');
  };

  var create = function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    // work-around for phaser's shoddy world wrap
    var worldMargin = 16;
    game.world.setBounds(-worldMargin, -worldMargin, nativeWidth + worldMargin * 2, nativeHeight + worldMargin * 2);
    
    var buildPlatforms = require('./map.js');
    platforms = buildPlatforms(game);
    
    var createPlayer = require('./player.js');
    players = game.add.group();
    players.add(createPlayer(game, {keys: { up: 'W', down: 'S', left: 'A', right: 'D' }}));
    players.add(createPlayer(game, {x: 306, y: 16, keys: { up: 'I', down: 'K', left: 'J', right: 'L' }}));
  };

  var update = function update() {
    game.physics.arcade.collide(players, platforms);
    game.physics.arcade.collide(players, players, function(playerA, playerB) {
      // TODO: how do i do this on the player itself without access to players? or should i add a ftn to player and set that as the cb?
      // TODO: can/should i check if they are colliding on their left/right sides so players can still bounce on each other's heads?
      var bothRolling = playerA.isRolling && playerB.isRolling;
      var bothStanding = !playerA.isDucking && !playerB.isDucking;
      var neitherRolling = !playerA.isRolling && !playerB.isRolling;
      var eitherDucking = playerA.isDucking || playerB.isDucking;
      var eitherRunning = Math.abs(playerA.body.velocity.x) > 28 || Math.abs(playerB.body.velocity.x) >= 28;
      var eitherRolling = playerA.isRolling || playerB.isRolling;
      var eitherStanding = !playerA.isDucking || !playerB.isDucking;

      function temporarilyDisableCollision(player) {
        player.isCollidable = false;
        setTimeout(function() {
          player.isCollidable = true;
        }, 100);
      }

      if (bothRolling || bothStanding) {
        (function bounce() {
          var bounceVelocity = 100;
          var velocityA = velocityB = bounceVelocity;
          if (playerA.position.x > playerB.position.x) {
            velocityB *= -1;
          } else {
            velocityA *= -1;
          }
          playerA.body.velocity.x = velocityA;
          playerB.body.velocity.x = velocityB;
          playerA.isRolling = false;
          playerB.isRolling = false;
        }());
      } else if (neitherRolling && eitherRunning && eitherDucking) {
        (function fling() {
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
          var flingXVelocity = 150;
          if (playerToFling.position.x > playerToLeave.position.x) {
            flingXVelocity *= -1;
          }
          playerToFling.body.velocity.x = flingXVelocity;
          playerToFling.body.velocity.y = -150;
        }());
      } else if (eitherRolling && eitherStanding) {
        (function pop() {
          var playerToPop;
          if (playerA.isStanding) {
            playerToPop = playerA;
          } else {
            playerToPop = playerB;
          }
          temporarilyDisableCollision(playerToPop);
          playerToPop.body.velocity.y = -150;
        }());
      }
    }, function(playerA, playerB) {
      if (!playerA.isCollidable || !playerB.isCollidable) {
        return false;
      }
      return true;
    });
  };

  var game = new Phaser.Game(nativeWidth, nativeHeight, Phaser.AUTO, '#game', {
    preload: preload,
    create: create,
    update: update,
  }, false, false); // disable anti-aliasing
}());
