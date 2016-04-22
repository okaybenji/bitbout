var main = {
  preload: function preload() {
    // allow anything up to height of world to fall off-screen up or down
    game.world.setBounds(0, -game.width, game.width, game.height * 3);

    // prevent game pausing when it loses focus
    game.stage.disableVisibilityChange = true;

    // assets used in loading screen
    game.load.spritesheet('loading', 'images/sprites/ui-loading.gif', 11, 6);
  },

  create: function create() {
    game.state.add('loading', require('./states/loading')(game));
    game.state.start('loading');
  },
};

var game = new Phaser.Game(64, 64, Phaser.CANVAS, '', {
  preload: main.preload,
  create: main.create,
}, false, false); // disable anti-aliasing

game.state.add('main', main);
game.state.start('main');
