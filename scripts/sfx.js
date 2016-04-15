/**
 * Each time a unique sound filename is passed in, a new instance of chiptune.js will be created with that sound as a buffer.
 * If the play method is called on sound file passed in previously, its respective instance will play the existing buffer.
 * This ensures the file system is only hit once per sound, as needed.
 * It will also prevent sounds from 'stacking' -- the same sound played repeatedly will interrupt itself each time.
 */
var sfx = function() {
  var soundbank = {};

  return {
    play: function(fileName) {
      if (soundbank[fileName]) {
        soundbank[fileName].play(soundbank[fileName].buffer);
      } else {
        soundbank[fileName] = new ChiptuneJsPlayer(new ChiptuneJsConfig(0));
        soundbank[fileName].load('./sfx/' + fileName + '.xm', function(buffer) {
          soundbank[fileName].buffer = buffer;
          soundbank[fileName].play(buffer);
        });
      }
    }
  };
};

module.exports = sfx;
