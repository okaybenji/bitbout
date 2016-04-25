var stages = [{
  "name": "Forest",
  "theme": "forest",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [27, 6],
      [10, 13],
      [44, 13],
      [5, 22],
      [49, 22],
      [18, 31],
      [27, 31],
      [36, 31],
      [5, 44],
      [49, 44],
      [27, 60]
    ],
    "color": "white"
  },
  "backgrounds": [{
    "image": "forest"
  }, {
    "image": "forestBg1",
    "pulse": true,
    "pulseDuration": 4000,
  }, {
    "image": "forestBg2",
    "pulse": true,
    "pulseDelay": 3000,
    "pulseDuration": 5000,
  }],
  "foregrounds": [],
  "spawnPoints": [
    { "x": 15, "y": 6 },
    { "x": 49, "y": 6 },
    { "x": 10, "y": 15 },
    { "x": 54, "y": 15 }
  ],
  "uiColor": "#28D6F1"
},{
  "name": "Waterfall",
  "theme": "waterfall",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [10, 7],
      [45, 7],
      [27, 15],
      [10, 25],
      [45, 25],
      [10, 44],
      [45, 44],
      [27, 52],
      [10, 62],
      [45, 62]
    ],
    "color": "white"
  },
  "backgrounds": [{
    "image": "waterfall",
  },
  {
    "image": "waterfallBg",
    "animated": true,
  }],
  "foregrounds": [{
    "image": "waterfallFg",
    "animated": true,
    "animSpeed": 32/16,
    "frames": [0, 0, 0, 1, 2, 2, 2, 1],
    "scrolling": true,
    "pulse": true,
    "minAlpha": 0.95
  }],
  "spawnPoints": [
    { "x": 15, "y": 0 },
    { "x": 49, "y": 0 },
    { "x": 15, "y": 18 },
    { "x": 49, "y": 18 }
  ],
  "uiColor": "#28F129"
},{
  "name": "Tomb",
  "theme": "tomb",
  "backgroundColor": "#000",
  "platforms": {
    "positions": [
      [10, 13],
      [44, 13],
      [27, 21],
      [10, 31],
      [44, 31]
    ],
    "color": "white"
  },
  "backgrounds": [{
    "image": "tomb"
  },{
    "image": "tombBg",
    "animated": true
  }],
  "foregrounds": [{
    "image": "clear"
  }],
  "spawnPoints": [
    { "x": 15, "y": 6 },
    { "x": 49, "y": 6 },
    { "x": 15, "y": 24 },
    { "x": 49, "y": 24 }
  ],
  "uiColor": "#783E08"
},{
  "name": "Hangar",
  "theme": "hangar",
  "backgroundColor": "#000",
  "gravity": 150,
  "platforms": {
    "positions": [
      [8, 34],
      [12, 34],
      [22, 34],
      [31, 34],
      [41, 34],
      [46, 34],
    ],
    "color": "white"
  },
  "backgrounds": [{
    "image": "hangar"
  }, {
    "image": "hangarBg1",
    "animated": true,
    "frames": [0, 0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1],
    "animSpeed": 10,
  }, {
    "image": "hangarBg2",
    "animated": true,
    "animSpeed": 96/3,
  }],
  "foregrounds": [{
    "image": "clear",
  }],
  "spawnPoints": [
    { "x": 21, "y": 27 },
    { "x": 26, "y": 27 },
    { "x": 38, "y": 27 },
    { "x": 43, "y": 27 }
  ],
  "uiColor": "#8D8D8D"
}];

/**
 * Creates a deep copy of an array (for non-destructive manipulation).
 */
var copyArray = function(array) {
  if (!Array.isArray(array)) {
    return array;
  }

  var copy = array.slice(0);
  for (var i=0, ii=copy.length; i<ii; i++) {
    copy[i] = copyArray(copy[i]);
  }

  return copy;
};

/**
 * Applies passed function to passed number or all numbers in passed array or object's properties.
 * Non-destructive. Returns new value.
 * @param {Mixed} x object, array, or number e.g. allPays
 * @param {Function} ftn
 * @return {Mixed} processed object, array, or number
 */
var applyMath = function(x, ftn) {
  var a; // this will hold copy of x prevent side effects

  if (typeof x === 'number') {
    a = x;
    a = ftn(a);
  } else if (Array.isArray(x)) { // since arrays are objects, too
    a = copyArray(x);
    a = a.map(function(y) {
      return applyMath(y, ftn);
    });
  } else if (typeof x === 'object') {
    a = Object.assign({}, x);
    for (var key in a) {
      if (a.hasOwnProperty(key)) {
        a[key] = applyMath(a[key], ftn);
      }
    }
  } else {
    return x;
  }

  return a;
};

stages = applyMath(stages, function(x) {
  return x *= 8;
});

module.exports = stages;
