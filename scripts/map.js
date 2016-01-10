var buildPlatforms = function buildPlatforms(game) {
  var platforms = game.add.group();
  platforms.enableBody = true;

  var settings = require('./data/settings.js');
  var stages = require('./data/stages.js');

  var stage = stages.filter(function(stage) {
    return stage.name === settings.stage.selected;
  })[0];
  var platformPositions = stage.platforms.positions;

  platformPositions.forEach(function(position) {
    var platform = platforms.create(position[0], position[1], stage.platforms.color);
    platform.scale.setTo(24, 4);
    platform.body.immovable = true;
  });

  var walls = [];
  walls.push(platforms.create(-16, 32, stage.platforms.color));
  walls.push(platforms.create(304, 32, stage.platforms.color));
  walls.forEach(function(wall) {
    wall.scale.setTo(16, 74);
    wall.body.immovable = true;
  });
  
  return platforms;
};

module.exports = buildPlatforms;
