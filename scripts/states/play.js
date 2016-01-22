var Play = function(game) {
  var play = {
    create: function create() {
      var self = this;

      self.sfx = require('../sfx.js');
      self.subUi = game.add.group(); // place to keep anything on-screen that's not UI to depth sort below UI

      // game over message
      var font = require('../data/font.js');
      self.text = game.add.text(0, 0, '', font);
      self.text.setTextBounds(0, 0, game.width, game.height);
      
      // menu
      var buildMenu = require('../menu.js');
      self.menu = buildMenu(game, self.restart.bind(self)); // TODO: come up with better way to let menu restart game

      self.restart();
      game.physics.startSystem(Phaser.Physics.ARCADE);
      game.input.gamepad.start();
    },

    restart: function restart() {
      var self = this;
      var players = require('../data/players.js')(game);
      var settings = require('../data/settings');
      var stageBuilder = require('../stageBuilder.js')(game);

      // play music
      if (self.music) {
        self.music.stop();
      }
      if (settings.bgm.selected !== 'None') {
        self.music = game.add.audio(settings.bgm.selected);
        self.music.loopFull();
      }

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
      self.subUi.add(self.platforms);
      self.subUi.add(self.backgrounds);

      self.players = game.add.group();
      self.subUi.add(self.players);

      var addPlayer = function addPlayer(player) {
        var checkForGameOver = function checkForGameOver() {
          if (self.menu.isOpen) {
            return; // we're not really playing a game yet :) this has some problems, though...
          }

          var alivePlayers = [];
          self.players.children.forEach(function(player) {
            if (!player.isDead) {
              alivePlayers.push(player.name);
            }
          });
          if (alivePlayers.length === 1) {
            self.text.setText(alivePlayers[0] + '  wins!\nPress start');
            self.text.visible = true;
            game.input.gamepad.pad1.getButton(Phaser.Gamepad.XBOX360_START).onDown.addOnce(function() {
              self.text.visible = false; // just hides text (menu will open itself)
            });
          }
        };
        var createPlayer = require('../player.js');
        self.players.add(createPlayer(game, player, checkForGameOver));
      };

      //players.forEach(addPlayer);
      for (var i=0; i<settings.playerCount.selected; i++) {
        addPlayer(players[i]);
      }

      self.foreground = stageBuilder.buildForeground();
      self.subUi.add(self.foreground);
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
