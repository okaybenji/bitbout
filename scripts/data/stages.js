var stages = [{
  name: 'Alpha C',
  backgroundColor: '#4DD8FF',
  platforms: {
    positions: [[48, 64], [224, 64], [136, 104], [48, 154], [224, 154]],
    color: 'clear'
  },
  backgrounds: [{
    image: 'suns'
  },{
    image: 'clouds',
    scrolling: true,
  },{
    image: 'ground'
  }],
  foreground: 'foreground',
  spawnPoints: [{x: 72, y: 44}, {x: 242, y: 44}, {x: 72, y: 136}, {x: 242, y: 136}],
  uiColor: '#D66122'
}, {
  name: 'Atari A',
  backgroundColor: '#000',
  platforms: {
    positions: [[136, 32], [48, 64], [224, 64], [20, 112], [252, 112], [88,154], [136, 154], [184,154]],
    color: 'blue'
  },
  backgrounds: [],
  foreground: 'clear',
  spawnPoints: [{x: 72, y: 44}, {x: 242, y: 44}, {x: 44, y: 88}, {x: 272, y: 88}],
  uiColor: '#EEE'
}, {
  name: 'Atari B',
  backgroundColor: '#000',
  platforms: {
    positions: [[12, 172], [60, 172], [108, 172], [156, 172], [204, 172], [252, 172], [260, 172]], // TODO: had a little hole here... better check the math on the platform widths/locations
    color: 'green'
  },
  backgrounds: [],
  foreground: 'clear',
  spawnPoints: [{x: 48, y: 144}, {x: 96, y: 144}, {x: 204, y: 144}, {x: 252, y: 144}],
  uiColor: '#EEE'
}];

module.exports = stages;
