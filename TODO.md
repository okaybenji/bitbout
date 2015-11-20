#To do
### movement
* if players run into each other with one standing and above a certain velocity and one crouched but below roll velocity, give standing player forward and upward velocity so he flies over crouching player
* if players run into each other with one standing and one crouched and rolling, give standing player upward velocity so crouching player rolls under him

###attack
* make each player a group to hold their hearts
* give players health, represented by 3 hearts floating behind them; 1/2 heart = 1 hp
* update players to store directions they face when they press left or right ctrls; flip player group to match orientation
* add attack button which adds forward velocity and flashes characters white; while white, attacking characters on contact with other players do 1 damage to non-attacking players facing them and 2 damage to players not facing them, whether attacking or not
* a player may not attack while crouched, and may not crouch while attacking
* if both players are white/attacking and facing each other, knock them away from each other as though they ran into each other while both standing