var buildMenu = function buildMenu(game, restart) {
  var menuOpen = true;
  var itemHeight = 20;
  var gamepad = game.input.gamepad.pad1; // TODO: add check for gamepad; display msg that it is req'd if not there

  var settings = require('./data/settings.js');

  var fontHighlight = require('./data/font.js');
  var fontNormal = Object.assign({}, fontHighlight, {fill: '#777'});

  var selectFirstItem = function selectFirstItem() {
    var selectedIndex = getSelectedIndex();
    if (selectedIndex !== 0) {
      menu[selectedIndex].selected = false;
      menu[0].selected = true;
      renderMenu();
    }
  };

  var toggleMenu = function toggleMenu() {
    menu.forEach(function(item) {
      if (menuOpen) {
        item.text.visible = false;
      } else {
        item.text.visible = true;
        selectFirstItem();
      }
    });

    menuOpen = !menuOpen;
  };

  var getSelectedIndex = function getSelectedIndex() {
    return menu.reduce(function(acc, item, i) {
      if (item.selected) {
        return i;
      } else {
        return acc;
      }
    }, 0);
  };

  var getSelectedItem = function getSelectedItem() {
    return menu.reduce(function(acc, item) {
      if (item.selected) {
        return item;
      } else {
        return acc;
      }
    });
  };

  var prevItem = function prevItem() {
    var selectedIndex = getSelectedIndex();
    var prevIndex = selectedIndex - 1;
    if (prevIndex === -1) {
      prevIndex = menu.length - 1;
    }
    menu[selectedIndex].selected = false;
    menu[prevIndex].selected = true;

    renderMenu();
  };
  
  var nextItem = function nextItem() {
    var selectedIndex = getSelectedIndex();
    var nextIndex = selectedIndex + 1;
    if (nextIndex === menu.length) {
      nextIndex = 0;
    }
    menu[selectedIndex].selected = false;
    menu[nextIndex].selected = true;

    renderMenu();
  };

  var activateItem = function activateItem() {
    if (!menuOpen) {
      return;
    }

    var item = getSelectedItem();
    item.action();
  };

  var renderMenu = function renderMenu() {
    menu.forEach(function(item) {
      if (item.selected) {
        item.text.setStyle(fontHighlight);
      } else {
        item.text.setStyle(fontNormal);
      }
      var text = item.name + (item.setting ? ': ' + item.setting.selected.toString() : ''); // TODO: why won't this display numeric settings?
      item.text.setText(text);
    });
  };

  var cycleSetting = function cycleSetting() {
    var optionIndex = this.setting.options.indexOf(this.setting.selected);
    optionIndex++;
    if (optionIndex === this.setting.options.length) {
      optionIndex = 0;
    }
    this.setting.selected = this.setting.options[optionIndex];
    renderMenu();
    restart();
  };

  var menu = [{
    name: 'Players',
    setting: settings.playerCount,
    action: cycleSetting,
    selected: true
  }, {
    name: 'BGM',
    setting: settings.bgm,
    action: cycleSetting
  }, {
    name: 'Stage',
    setting: settings.stage,
    action: cycleSetting
  }, {
    name: 'Start',
    action: function() {
      restart();
      toggleMenu();
    }
  }].map(function(item, i) {
    item.text = game.add.text(0, 0, '');
    item.text.setTextBounds(0, i * itemHeight, game.width, game.height);
    return item;
  });

  var startButton = gamepad.getButton(Phaser.Gamepad.XBOX360_START);
  var downButton = gamepad.getButton(Phaser.Gamepad.XBOX360_DPAD_DOWN);
  var upButton = gamepad.getButton(Phaser.Gamepad.XBOX360_DPAD_UP);
  var selectButton = gamepad.getButton(Phaser.Gamepad.XBOX360_A);

  startButton.onDown.add(toggleMenu);
  downButton.onDown.add(nextItem);
  upButton.onDown.add(prevItem);
  selectButton.onDown.add(activateItem);

  renderMenu();
  return menu;
};

module.exports = buildMenu;
