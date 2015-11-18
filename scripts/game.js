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
    game.physics.arcade.collide(players, players);
  };

  var game = new Phaser.Game(nativeWidth, nativeHeight, Phaser.AUTO, '#game', {
    preload: preload,
    create: create,
    update: update,
  }, false, false); // disable anti-aliasing
}());
