#To do

### bugfix
* players must reconnect their gamepads when toggling fullscreen in native app
* investigate intermittent issue in which jump button doesn't work on one of four ps4 gamepads
* investigate and fix error: 'openmpt: openmpt_module_read_float_stereo: ERROR: module * not valid'

### attack
* player attacked from behind receives 2 damage, whether he is attacking or not

### movement
* allow jump through platforms from below

### misc
* gzip/zopfli libopenmpt
* consider requiring everything in one place and using dependency injection everywhere else
* add power-ups? like maybe one that does 2x damage (and can knock a player down 2 hearts).
* add a button for atari mode!
* get game working in firefox & safari. may not be worth doing, since gamepad support is terrible in both and safari doesn't support AudioContext for chiptune2.js. see branch pixel-perfect-scaling.

### art
* title screen BG?

### music / sfx
* have toggle music on/off separate from changing music tracks (so changing level doesn't turn off music back on)

### phaser
* there appears to be a bug in phaser's physics.arcade.collide's processCallback; it should pass colliding objects as args 1 and 2 in the same order as collideCallback. logging the objects' positions shows two different (correct) positions in collideCallback, but shows the same positions in processCallback.
* phaser's worldWrap is sort of broken in that moving a sprite offscreen down or to the right wraps smoothly, 1 pixel at a time, while moving it up or to the left just pops the entire sprite onto the screen at once. (i may have the directions wrong, haven't tested this today and going off memory.)
* tileSprites get anti-aliased even when other sprites don't
