var buildMenu = function buildMenu(game, restart) {
  var menuOpen = true;
  var itemHeight = 20;
  var gamepad = game.input.gamepad.pad1;

  var numPlayers, maxPlayers;
  numPlayers = maxPlayers = 4;

  var fontHighlight = require('./data/font.js');
  var fontNormal = Object.assign({}, fontHighlight);
  fontNormal.fill = '#777';

  var toggleMenu = function() {
    menu.forEach(function(item) {
      if (menuOpen) {
        item.text.visible = false;
      } else {
        item.text.visible = true;
        // select first menu item
        var selectedIndex = getSelectedIndex();
        if (selectedIndex !== 0) {
          menu[selectedIndex].selected = false;
          menu[0].selected = true;
          updateMenu();
        }
      }
    });

    menuOpen = !menuOpen;
  };

  var getSelectedIndex = function() {
    return menu.reduce(function(acc, item, i) {
      if (item.selected) {
        return i;
      } else {
        return acc;
      }
    }, 0);
  };

  var getSelectedItem = function() {
    return menu.reduce(function(acc, item, i) {
      if (item.selected) {
        return item;
      } else {
        return acc;
      }
    });
  };

  var prevItem = function() {
    var selectedIndex = getSelectedIndex();
    var prevIndex = selectedIndex - 1;
    if (prevIndex === -1) {
      prevIndex = menu.length - 1;
    }
    menu[selectedIndex].selected = false;
    menu[prevIndex].selected = true;

    updateMenu();
  };
  
  var nextItem = function() {
    var selectedIndex = getSelectedIndex();
    var nextIndex = selectedIndex + 1;
    if (nextIndex === menu.length) {
      nextIndex = 0;
    }
    menu[selectedIndex].selected = false;
    menu[nextIndex].selected = true;

    updateMenu();
  };

  var activateItem = function() {
    if (!menuOpen) {
      return;
    }

    var item = getSelectedItem();
    item.action();
  };

  var updateMenu = function() {
    menu.forEach(function(item) {
      if (item.selected) {
        item.text.setStyle(fontHighlight);
      } else {
        item.text.setStyle(fontNormal);
      }
    });
  };

  var menu = [{
    name: 'Players',
    value: numPlayers,
    action: function() {
      numPlayers++;
      if (numPlayers > maxPlayers) {
        numPlayers = 2;
      }
      restart(numPlayers);
    },
    selected: true
  }, {
    name: 'BGM',
    value: 'A',
    action: function() {
      console.log('No BGM yet...');
    }
  }, {
    name: 'Stage',
    value: 'Alpha',
    action: function() {
      console.log('Only one stage so far...');
    }
  }, {
    name: 'Start',
    action: function() {
      restart(numPlayers);
      toggleMenu();
    }
  }];

  menu = menu.map(function(item, i) {
    var text = item.name + (item.value ? ': ' + item.value.toString() : '');
    item.text = game.add.text(0, 0, text);
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

  updateMenu();
  return menu;
};

module.exports = buildMenu;
