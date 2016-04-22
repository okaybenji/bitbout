var buildMenu = function buildMenu(game, state) {
  var settings = require('./data/settings');

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
  }, {
    name: 'BGM',
    setting: settings.bgm,
    action: function() {
      cycleSetting.call(this);
      game.bgm.play(settings.bgm.selected);
    },
  }, {
    name: 'Stage',
    setting: settings.stage,
    action: function() {
      cycleSetting.call(this);

      // if stage has a default bgm, load it
      var stages = require('./data/stages');
      var selectedStage = stages[settings.stage.options.indexOf(settings.stage.selected)];
      if (selectedStage.theme) {
        settings.bgm.selected = selectedStage.theme;
      }
      game.bgm.play(settings.bgm.selected);

      state.restart();
    },
  }, {
    name: 'Start',
    action: function() {
      state.restart();
    }
  }];

  var changePlayerCount = menu[0].action.bind(menu[0]);
  var changeBgm = menu[1].action.bind(menu[1]);
  var changeStage = menu[2].action.bind(menu[2]);
  var restart = menu[3].action.bind(menu[3]);

  game.input.keyboard.addKey(Phaser.Keyboard.P).onDown.add(changePlayerCount);
  game.input.keyboard.addKey(Phaser.Keyboard.M).onDown.add(changeStage);
  game.input.keyboard.addKey(Phaser.Keyboard.B).onDown.add(changeBgm);
  game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(restart);

  // allow changing map with start button on gamepad
  var padNames = ['pad1', 'pad2', 'pad3', 'pad4'];

  var unassignStartButtons = function() {
    padNames.forEach(function(padName) {
      var startButton = game.input.gamepad[padName].getButton(Phaser.Gamepad.XBOX360_START);
        if (startButton) {
          startButton.onDown.forget();
        }
    });
  };

  var assignStartButtons = function() {
    unassignStartButtons();

    padNames.forEach(function(padName) {
      var startButton = game.input.gamepad[padName].getButton(Phaser.Gamepad.XBOX360_START);
      if (startButton) {
        startButton.onDown.add(changeStage);
      }
    });
  };

  if (game.input.gamepad.supported) {
    if (game.input.gamepad.active) {
      assignStartButtons();
    }
    game.input.gamepad.onConnectCallback = assignStartButtons;
    game.input.gamepad.onDisconnectCallback = assignStartButtons;
  }

  return menu;
};

module.exports = buildMenu;
