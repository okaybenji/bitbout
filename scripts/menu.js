var buildMenu = function buildMenu(game, state) {
  var settings = require('./data/settings.js');

  var cycleSetting = function cycleSetting() {
    var optionIndex = this.setting.options.indexOf(this.setting.selected);
    optionIndex++;
    if (optionIndex === this.setting.options.length) {
      optionIndex = 0;
    }
    this.setting.selected = this.setting.options[optionIndex];
  };

  var menu = [{
    name: 'Players',
    setting: settings.playerCount,
    action: function() {
      cycleSetting.call(this);
      state.restart();
    },
    selected: true
  }, /*{
    name: 'BGM',
    setting: settings.bgm,
    action: function() {
      cycleSetting.call(this);
      state.resetMusic(settings);
    },
  },*/ {
    name: 'Stage',
    setting: settings.stage,
    action: function() {
      cycleSetting.call(this);
      state.restart();
    },
  }, {
    name: 'Start',
    action: function() {
      state.restart();
    }
  }];

  game.input.keyboard.addKey(Phaser.Keyboard.P).onDown.add(menu[0].action.bind(menu[0]));
  game.input.keyboard.addKey(Phaser.Keyboard.M).onDown.add(menu[1].action.bind(menu[1]));
  game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(menu[2].action.bind(menu[2]));

  return menu;
};

module.exports = buildMenu;
