'use strict';

angular.module('zafiro')
  .animation('.zafiroRoot', function() {
    return {
      addClass: function(element, className, done) {
        if(className == 'moveLeft' || className == 'moveRight') {
          //if(element.hasClass('active')) {
            element.removeClass('moveLeft');
            element.animate({
              transform: "scale(0.75)",
              border: "1px solid gray"
            }, 300, function() {
              element.animate({
                left: className=='moveLeft'?'-1200px':'2400px'
              }, 700, done);
            });
            
         // }
        }
        return function(cancel) {
          if(cancel) element.stop();
        }
      },
      removeClass: function(element, className, done) {
        if(className == 'moveLeft' || className == 'moveRight') {

        }
        return function(cancel) {
          if(cancel) element.stop();
        }

      }
    }
  });