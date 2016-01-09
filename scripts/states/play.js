var Play = function(game) {
  var play = {
    preload: function preload() {

    },

    create: function create() {
      var self = this;
      
      game.physics.startSystem(Phaser.Physics.ARCADE);

      var buildPlatforms = require('../map.js');
      self.platforms = buildPlatforms(game);

      self.sfx = require('../sfx.js');

      game.input.gamepad.start();

      // TODO: why is this font still anti-aliased?
      var fontStyle = { font: "12px Hellovetica", fill: "#eee", align: "center", boundsAlignH: "center", boundsAlignV: "middle" };
      
      // game over message
      self.text = game.add.text(0, 0, '', fontStyle);
      self.text.setTextBounds(0, 0, game.width, game.height);
      
      // menu
      var buildMenu = require('../menu.js');
      self.menu = buildMenu(game, fontStyle);

      self.players = game.add.group();
      self.restart();
    },

    restart: function restart() {
      var self = this;
      
      self.text.visible = false;

      while (self.players.children.length > 0) {
        self.players.children[0].destroy();
      }

      var players = [{
          name: 'Blue',
          color: 'blue',
          gamepad: game.input.gamepad.pad1,
          position: {
            x: 72, y: 44
          },
        }, {
          name: 'Yellow',
          color: 'yellow',
          gamepad: game.input.gamepad.pad2,
          position: {
            x: 248, y: 44
          },
          orientation: 'left',
        }, {
          name: 'Green',
          color: 'green',
          gamepad: game.input.gamepad.pad3,
          keys: {
            up: 'W', down: 'S', left: 'A', right: 'D', attack: 'Q'
          },
          position: {
            x: 72, y: 136
          },
        }, {
          name: 'Purple',
          color: 'purple',
          gamepad: game.input.gamepad.pad4,
          keys: {
            up: 'I', down: 'K', left: 'J', right: 'L', attack: 'U'
          },
          position: {
            x: 248, y: 136
          },
          orientation: 'left',
      }];
      
      
      var addPlayer = function addPlayer(player) {
        var checkForGameOver = function checkForGameOver() {
          var alivePlayers = [];
          self.players.children.forEach(function(player) {
            if (!player.isDead) {
              alivePlayers.push(player.name);
            }
          });
          if (alivePlayers.length === 1) {
            self.text.setText(alivePlayers[0] + '  wins!\nClick  to  restart');
            self.text.visible = true;
            game.input.onDown.addOnce(self.restart, self); // restart game on mouse click
          }
        };
        var createPlayer = require('../player.js');
        self.players.add(createPlayer(game, player, checkForGameOver));
      };
      players.forEach(addPlayer);
    },

    update: function update() {
      var self = this;
      
      game.physics.arcade.collide(this.players, this.platforms);
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
          self.sfx.bounce();

          var bounceVelocity = 100;
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
          self.sfx.bounce();

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
        }

        function pop() {
          self.sfx.bounce();

          var playerToPop;
          if (playerA.isRolling) {
            playerToPop = playerB;
          } else {
            playerToPop = playerA;
          }
          temporarilyDisableCollision(playerToPop);
          playerToPop.body.velocity.y = -150;
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
