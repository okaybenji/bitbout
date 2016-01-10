#To do

### attack
* player attacked from behind receives 2 damage, whether he is attacking or not

### titles
* fix disabling anti-aliasing on text

### misc
* allow pressing any key to restart
* fix positioning of hearts when health not full
* make a menu
* add spectators that push players into arena on spawn.
* add power-ups, like maybe one that does 2x damage (and can knock a player down 2 hearts). these will be tossed in by spectators.
* credit cal henderson for the hellovetica font from http://www.iamcal.com/misc/fonts/
* reach out to pixel artist about doing sprites and animations
* program animations for 2-4 players upon spawning to auto-run to random starting platforms
* consider adding period of invulnerability on spawn like on west prototype (player alpha pulses, player.isCollidable = false)

### sound effects
* make some 16-bit sfx (or build/acquire an FM websynth!) http://www.taktech.org/takm/WebFMSynth/
* add and make more bgm
* update submono/subpoly to allow using custom waveforms and add noise with Math.random

### phaser
* there appears to be a bug in phaser's physics.arcade.collide's processCallback; it should pass colliding objects as args 1 and 2 in the same order as collideCallback. logging the objects' positions shows two different (correct) positions in collideCallback, but shows the same positions in processCallback.
* phaser's worldWrap is sort of broken in that moving a sprite offscreen down or to the right wraps smoothly, 1 pixel at a time, while moving it up or to the left just pops the entire sprite onto the screen at once. (i may have the directions wrong, haven't tested this today and going off memory.)