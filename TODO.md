#To do

### movement
* consider adding run modifier key, and walking by default

### attack
* add attack button which adds forward velocity and flashes characters white; while white, attacking characters on contact with other players do 1 damage to non-attacking players facing them and 2 damage to players not facing them, whether attacking or not
* a player may not attack while crouched, and may not crouch while attacking

### misc
* make a menu
* allow restarting the game
* allow using controllers
* credit cal henderson for the hellovetica font from http://www.iamcal.com/misc/fonts/

### phaser
* there appears to be a bug in phaser's physics.arcade.collide's processCallback; it should pass colliding objects as args 1 and 2 in the same order as collideCallback. logging the objects' positions shows two different (correct) positions in collideCallback, but shows the same positions in processCallback.
* phaser's worldWrap is sort of broken in that moving a sprite offscreen down or to the right wraps smoothly, 1 pixel at a time, while moving it up or to the left just pops the entire sprite onto the screen at once. (i may have the directions wrong, haven't tested this today and going off memory.)