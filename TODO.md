#To do

### movement
* add run. hold x (xbox) to run. (y, b, triggers will still be attack buttons).

### attack
* player attacked from behind receives 2 damage, whether he is attacking or not

### titles
* fix disabling anti-aliasing on text (is this a chrome issue?)
* maybe add a menu color setting to stage data so you can just use #EEE on dark levels and #111 on bright ones
* make (and use) a cool pixel-y font

### levels
* make more of these
* at one point, accidentally put clouds in foreground. the ridges gave a really cool natural temporary hiding fog effect, while the transparency ensured the game would still be playable. make a level like this on purpose!

### misc
* add groups for background, player, and foreground layers so that players and stage can be changed independently.
* fix positioning of hearts when health not full
* add spectators that push players into arena on spawn.
* add power-ups, like maybe one that does 2x damage (and can knock a player down 2 hearts). these will be tossed in by spectators.
* credit whoever the forum user was who inspired your cloud look
* reach out to chasm pixel artist about doing sprites and animations
* program animations for 2-4 players upon spawning to auto-run to random starting platforms
* consider adding period of invulnerability on spawn like on west prototype (player alpha pulses, player.isCollidable = false)

### graphics
* can anti-aliasing on clouds be removed? (see *phaser* below)

### menu
* while in menu, run demo with currently selected settings (selected num players duking it out on selected stage, etc.)

### music
* figure out how to handle loading... at least have a loading screen. maybe load music tracks in BG after game starts? (or just implement MIDI and use a synth to generate the music in real-time! then you'll have like 0 load-time.)
* add/make more bgm

### sound effects
* make some 16-bit sfx (or build/acquire an FM websynth!) http://www.taktech.org/takm/WebFMSynth/
* update submono/subpoly to allow using custom waveforms and add noise with Math.random

### phaser
* there appears to be a bug in phaser's physics.arcade.collide's processCallback; it should pass colliding objects as args 1 and 2 in the same order as collideCallback. logging the objects' positions shows two different (correct) positions in collideCallback, but shows the same positions in processCallback.
* phaser's worldWrap is sort of broken in that moving a sprite offscreen down or to the right wraps smoothly, 1 pixel at a time, while moving it up or to the left just pops the entire sprite onto the screen at once. (i may have the directions wrong, haven't tested this today and going off memory.)
* tileSprites get anti-aliased even when other sprites don't
