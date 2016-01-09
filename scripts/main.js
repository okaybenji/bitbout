var resize = function resize() {
  document.body.style.zoom = window.innerWidth / game.width;
};

var main = {
  preload: function preload() {
    var utils = require('./utils.js');
    //this.sfx = require('./sfx.js');

    resize();
    window.onresize = utils.debounce(resize, 100);
    
    // allow anything up to height of world to fall off-screen up or down
    game.world.setBounds(0, -game.width, game.width, game.height * 3);
    
    // prevent game pausing when it loses focus
    game.stage.disableVisibilityChange = true;
    
    game.load.image('logo', 'images/white.png'); // pre-load logo for splash screen
  },

  create: function create() {
    game.input.gamepad.start();

    game.state.add('splash', require('./states/splash.js')(game));
    game.state.add('play', require('./states/play.js')(game));

    game.state.start('splash');
  }
};

var game = new Phaser.Game(320, 180, Phaser.AUTO, 'game', {
  preload: main.preload,
  create: main.create
}, false, false); // disable anti-aliasing

game.state.add('main', main);
game.state.start('main');
