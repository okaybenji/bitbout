var Players = function(game) {
    var players = [{
      name: 'Blue',
      color: 'blue',
      gamepad: game.input.gamepad.pad1,
      position: {
        x: 72, y: 44
      },
    }, {
      name: 'Yellow',
      color: 'yellow',
      gamepad: game.input.gamepad.pad2,
      position: {
        x: 248, y: 44
      },
      orientation: 'left',
    }, {
      name: 'Green',
      color: 'green',
      gamepad: game.input.gamepad.pad3,
      keys: {
        up: 'W', down: 'S', left: 'A', right: 'D', attack: 'Q'
      },
      position: {
        x: 72, y: 136
      },
    }, {
      name: 'Purple',
      color: 'purple',
      gamepad: game.input.gamepad.pad4,
      keys: {
        up: 'I', down: 'K', left: 'J', right: 'L', attack: 'U'
      },
      position: {
        x: 248, y: 136
      },
      orientation: 'left',
  }];
  
  return players;
};

module.exports = Players;
