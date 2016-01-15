var buildMenu = function buildMenu(game, restart) {
  var itemHeight = 20;
  var gamepad = game.input.gamepad.pad1;
  var settings = require('./data/settings.js');
  var fontHighlight = require('./data/font.js');
  var fontNormal = Object.assign({}, fontHighlight, {fill: '#777'});

  var title = game.add.text(0, -itemHeight, 'OPTIONS', fontHighlight);
  title.setTextBounds(0, 0, game.width, game.height);

  var selectFirstItem = function selectFirstItem() {
    var selectedIndex = getSelectedIndex();
    if (selectedIndex !== 0) {
      menu[selectedIndex].selected = false;
      menu[0].selected = true;
      renderMenu();
    }
  };

  var selectStart = function selectStart() {
    var startIndex = menu.length - 1;
    var selectedIndex = getSelectedIndex();
    if (selectedIndex !== startIndex) {
      menu[selectedIndex].selected = false;
      menu[startIndex].selected = true;
      renderMenu();
    }
  };

  var toggleMenu = function toggleMenu() {
    menu.forEach(function(item) {
      if (menu.isOpen) {
        item.text.visible = false;
      } else {
        item.text.visible = true;
        selectStart();
      }
    });

    title.visible = menu.isOpen = !menu.isOpen;
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
    if (!menu.isOpen) {
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
  menu.isOpen = true;

  // gamepad controls
  if (game.input.gamepad.supported && game.input.gamepad.active && game.input.gamepad.pad1.connected) {
    var startButton = gamepad.getButton(Phaser.Gamepad.XBOX360_START);
    var downButton = gamepad.getButton(Phaser.Gamepad.XBOX360_DPAD_DOWN);
    var upButton = gamepad.getButton(Phaser.Gamepad.XBOX360_DPAD_UP);
    var selectButton = gamepad.getButton(Phaser.Gamepad.XBOX360_A);

    startButton.onDown.add(toggleMenu);
    downButton.onDown.add(nextItem);
    upButton.onDown.add(prevItem);
    selectButton.onDown.add(activateItem);
  }

  //keyboard controls
  // TODO: update menu system to handle RIGHT as activate and LEFT as active in reverse
  // e.g. left increases player count, right decreases it
  game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(toggleMenu);
  game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onDown.add(nextItem);
  game.input.keyboard.addKey(Phaser.Keyboard.UP).onDown.add(prevItem);
  game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(activateItem);

  renderMenu();
  return menu;
};

module.exports = buildMenu;
