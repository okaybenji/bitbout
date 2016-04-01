var resize = function resize() {
  document.body.style.zoom = window.innerWidth / game.width;
};

var main = {
  preload: function preload() {
    var utils = require('./utils.js');

    resize();
    window.onresize = utils.debounce(resize, 100);
    
    // allow anything up to height of world to fall off-screen up or down
    game.world.setBounds(0, -game.width, game.width, game.height * 3);
    
    // prevent game pausing when it loses focus
    game.stage.disableVisibilityChange = true;
    
    // assets used in splash screen intro animation
    game.load.image('purple', 'images/purple.png');
  },

  create: function create() {
    game.input.gamepad.start();

    game.state.add('splash', require('./states/splash.js')(game));
    game.state.add('play', require('./states/play.js')(game));

    game.state.start('splash');
  }
};

var game = new Phaser.Game(64, 64, Phaser.AUTO, 'game', {
  preload: main.preload,
  create: main.create
}, false, false); // disable anti-aliasing

game.state.add('main', main);
game.state.start('main');
