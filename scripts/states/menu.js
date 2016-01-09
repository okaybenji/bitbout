var Menu = function(game) {
  var menu = {
    create: function create() {
      var self = this;

      var fontStyle = { font: "12px Hellovetica", fill: "#eee", align: "center", boundsAlignH: "center", boundsAlignV: "middle" };
      
      // menu
      self.menu = game.add.text(0, 0, 'Start', fontStyle);
      self.menu.setTextBounds(0, 0, game.width, game.height);
      self.menu.inputEnabled = true;
      self.menu.events.onInputUp.add(function() {
        self.menu.visible = false;
        console.log('closed menu');
      });
      self.menu.events.onInputOver.add(function(target) {
        target.fill = "#FEFFD5";
      });
      
      var optionStyle = { fill: 'white', align: 'left', stroke: 'rgba(0,0,0,0)', strokeThickness: 4};
      var txt = game.add.text(30, 28, 'Start', optionStyle);
      txt.inputEnabled = true;
      txt.events.onInputUp.add(function () { console.log('You did it!') });
    }
  };
  
  return menu;
}

module.exports = Menu;
