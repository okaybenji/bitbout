var stages = require('./stages');

var settings = {
  playerCount: {
    options: [2, 3, 4],
    selected: 4,
  },
  bgm: {
    options: ['forest', 'waterfall', 'tomb', 'hangar', 'None'],
    selected: 'forest',
  },
  stage: {
    options: stages.map(function(stage) {
      return stage.name;
    }),
    selected: 'Forest',
  }
};

module.exports = settings;
