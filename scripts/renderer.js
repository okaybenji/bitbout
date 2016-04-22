// see photonstorm.com/phaser/pixel-perfect-scaling-a-phaser-game
var renderer = function(game) {

  var resize = function resize() {
    if (pixel.canvas) {
      Phaser.Canvas.removeFromDOM(pixel.canvas);
    }

    pixel.scale = window.innerHeight / game.height;
    pixel.canvas = Phaser.Canvas.create(game.width * pixel.scale, game.height * pixel.scale);
    pixel.context = pixel.canvas.getContext('2d');
    Phaser.Canvas.addToDOM(pixel.canvas);
    Phaser.Canvas.setSmoothingEnabled(pixel.context, false);
    pixel.width = pixel.canvas.width;
    pixel.height = pixel.canvas.height;
  };

  resize();
  var utils = require('./utils')
  window.onresize = utils.debounce(resize, 100);

  var render = function() {
    pixel.context.drawImage(game.canvas, 0, 0, game.width, game.height, 0, 0, pixel.width, pixel.height);
  };

  return render;
};

module.exports = renderer;
