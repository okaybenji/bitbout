var buildMenu = function buildMenu(game, font) {
  var menu = game.add.text(0, 0, 'Start', font);
  menu.setTextBounds(0, 0, game.width, game.height);
  menu.inputEnabled = true;
  menu.events.onInputUp.add(function() {
    menu.visible = false;
    console.log('closed menu');
  });
  menu.events.onInputOver.add(function(target) {
    target.fill = "#FEFFD5";
  });
  
  menu.events.onInputOut.add(function(target) {
    target.fill = font.fill;
  });
  
  return menu;
};

module.exports = buildMenu;
