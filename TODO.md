#To do

### attack
* player attacked from behind receives 2 damage, whether he is attacking or not

### misc
* allow pressing start/option button on controllers to start game and change map
* get game working in firefox & safari. for firefox, see: http://www.photonstorm.com/phaser/pixel-perfect-scaling-a-phaser-game
* update itch.io releases to bitbout v1.0.1
* gzip/zopfli libopenmpt
* write task to build itch.io and native app releases for you!
* consider requiring everything in one place and using dependency injection everywhere else
* add power-ups? like maybe one that does 2x damage (and can knock a player down 2 hearts).
* physics got weird after scaling down. try scaling up resolution but sticking to 64x64 grid. EDIT: can't do this until after game jam because movement will no longer stick to the grid.
* add a button for atari mode!

### art
* title screen BG?

### music / sfx
* have toggle music on/off separate from changing music tracks (so changing level doesn't turn off music back on)

### phaser
* there appears to be a bug in phaser's physics.arcade.collide's processCallback; it should pass colliding objects as args 1 and 2 in the same order as collideCallback. logging the objects' positions shows two different (correct) positions in collideCallback, but shows the same positions in processCallback.
* phaser's worldWrap is sort of broken in that moving a sprite offscreen down or to the right wraps smoothly, 1 pixel at a time, while moving it up or to the left just pops the entire sprite onto the screen at once. (i may have the directions wrong, haven't tested this today and going off memory.)
* tileSprites get anti-aliased even when other sprites don't
