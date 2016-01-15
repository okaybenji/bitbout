var stages = [{
  name: 'Alpha C',
  backgroundColor: '#4DD8FF',
  platforms: {
    positions: [[48, 64], [224, 64], [136, 104], [48, 154,], [224, 154]],
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
  foreground: 'foreground'
}, {
  name: 'Atari',
  backgroundColor: '#000',
  platforms: {
    positions: [[48, 64], [224, 64], [136, 104], [48, 154,], [224, 154]],
    color: 'blue'
  },
  backgrounds: [],
  foreground: 'clear'
}, {
  name: 'Void',
  backgroundColor: '#000',
  platforms: {
    positions: [],
    color: 'clear'
  },
  backgrounds: [],
  foreground: 'clear'
}];

module.exports = stages;
