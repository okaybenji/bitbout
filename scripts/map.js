var buildPlatforms = function buildPlatforms(game) {
  var platforms = game.add.group();
  platforms.enableBody = true;
  var platformPositions = [[48, 64], [208, 64], 
                               [128, 104],
                           [48, 154,], [208, 154]];

  platformPositions.forEach(function(position) {
    var platform = platforms.create(position[0], position[1], 'square');
    platform.scale.setTo(24, 4);
    platform.body.immovable = true;
  });

  var walls = [];
  walls.push(platforms.create(-16, 32, 'square'));
  walls.push(platforms.create(304, 32, 'square'));
  walls.forEach(function(wall) {
    wall.scale.setTo(16, 74);
    wall.body.immovable = true;
  });
  
  return platforms;
};

module.exports = buildPlatforms;
