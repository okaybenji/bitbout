#To do

### movement
* consider adding run modifier key, and walking by default
* somewhere along the way, the game stopped allowing players to stand on each others' heads... fix this
* disable analog stick jumping (it's too awkward)

### attack
* player attacked from behind receives 2 damage, whether he is attacking or not

### misc
* for some reason, the restart method is spawning clones...
* allow pressing any key to restart
* fix positioning of hearts when health not full
* make a menu
* dying on platform leaves dead body
* credit cal henderson for the hellovetica font from http://www.iamcal.com/misc/fonts/
* reach out to pixel artist about doing sprites and animations
* program animations for 2-4 players upon spawning to auto-run to random starting platforms

### sound effects
* jump
* attack
* take damage
* die
* bgm

### phaser
* there appears to be a bug in phaser's physics.arcade.collide's processCallback; it should pass colliding objects as args 1 and 2 in the same order as collideCallback. logging the objects' positions shows two different (correct) positions in collideCallback, but shows the same positions in processCallback.
* phaser's worldWrap is sort of broken in that moving a sprite offscreen down or to the right wraps smoothly, 1 pixel at a time, while moving it up or to the left just pops the entire sprite onto the screen at once. (i may have the directions wrong, haven't tested this today and going off memory.)