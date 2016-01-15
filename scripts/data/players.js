var Players = function(game) {
    var players = [{
      name: 'Orange',
      color: 'orange',
      gamepad: game.input.gamepad.pad1,
      position: {
        x: 72, y: 44
      },
      keys: {
        up: 'W', down: 'S', left: 'A', right: 'D', attack: 'Q'
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
      name: 'Pink',
      color: 'pink',
      gamepad: game.input.gamepad.pad3,
      position: {
        x: 72, y: 136
      },
      keys: {
        up: 'I', down: 'K', left: 'J', right: 'L', attack: 'U'
      },
    }, {
      name: 'Purple',
      color: 'purple',
      gamepad: game.input.gamepad.pad4,
      position: {
        x: 248, y: 136
      },
      orientation: 'left',
      keys: {
        up: 'T', down: 'G', left: 'F', right: 'H', attack: 'R'
      },
  }];
  
  return players;
};

module.exports = Players;
