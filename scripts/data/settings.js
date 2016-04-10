var stages = require('./stages');

var settings = {
  playerCount: {
    options: [2, 3, 4],
    selected: 4,
  },
  bgm: {
    options: ['test.xm', 'title.xm', 'None'],
    selected: 'test.xm',
  },
  stage: {
    options: stages.map(function(stage) {
      return stage.name;
    }),
    selected: 'A',
  }
};

module.exports = settings;
