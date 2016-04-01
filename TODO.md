#To do

### attack
* player attacked from behind receives 2 damage, whether he is attacking or not

### misc
* come up with better way to show health. height thing is ok, but your character can't foll on its side when dead. :'(
* show who wins without text/font (create 'wins' graphic)
* consider requiring everything in one place and using dependency injection everywhere else
* add power-ups? like maybe one that does 2x damage (and can knock a player down 2 hearts).
* reach out to chasm pixel artist about doing sprites and animations
* consider adding period of invulnerability on spawn like on west prototype (player alpha pulses, player.isCollidable = false)

### music / sfx
* implement MIDI and use a synth to generate the music in real-time
* add/make more bgm
* update submono/subpoly to allow using custom waveforms and add noise with Math.random

### phaser
* there appears to be a bug in phaser's physics.arcade.collide's processCallback; it should pass colliding objects as args 1 and 2 in the same order as collideCallback. logging the objects' positions shows two different (correct) positions in collideCallback, but shows the same positions in processCallback.
* phaser's worldWrap is sort of broken in that moving a sprite offscreen down or to the right wraps smoothly, 1 pixel at a time, while moving it up or to the left just pops the entire sprite onto the screen at once. (i may have the directions wrong, haven't tested this today and going off memory.)
* tileSprites get anti-aliased even when other sprites don't
