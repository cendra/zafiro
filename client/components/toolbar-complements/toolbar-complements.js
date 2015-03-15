(function() {
'use strict';

angular.module('material.components.toolbar')
  .directive('mdToolbarFlexible', mdToolbarFlexibleDirective);
 // .directive('mdToolbarFlexibleItem', mdToolbarFlexibleItemDirective);

  function mdToolbarFlexibleDirective($$rAF, $mdConstant, $mdUtil, $mdTheming) {

	  return {
	    restrict: 'E',
	    controller: angular.noop,
	    link: function(scope, element, attr) {
	      	$mdTheming(element);

	      	var toolbar = element.parent();

	      	var shrinkSpeedFactor = attr.mdShrinkSpeedFactor || element.parent().attr('md-shrink-speed-factor') || 0.5;

	      	var flexibleHeight;
	      	var toolbarHeight;
          	var contentElement;

          	var debouncedContentScroll = $$rAF.throttle(onContentScroll);
          	var debouncedUpdateHeight = $mdUtil.debounce(updateToolbarHeight, 5 * 1000);

	        // Wait for $mdContentLoaded event from mdContent directive.
	        // If the mdContent element is a sibling of our toolbar, hook it up
	        // to scroll events.
	        scope.$on('$mdContentLoaded', onMdContentLoad);

	        function onMdContentLoad($event, newContentEl) {
	          // Toolbar and content must be siblings
	        	if (element.parent().parent()[0] === newContentEl.parent()[0]) {
		            // unhook old content event listener if exists
		            if (contentElement) {
		              contentElement.off('scroll', debouncedContentScroll);
		            }
					flexibleHeight = element.prop('offsetHeight');
		            newContentEl.on('scroll', debouncedContentScroll);
		            newContentEl.attr('flexible-shrink', 'true');

		            contentElement = newContentEl;
		            $$rAF(updateToolbarHeight);
		            scope.$broadcast('$mdToolbarFlexibleLoaded', element);
		        }
	        }

	        function updateToolbarHeight() {
	          toolbarHeight = toolbar.prop('offsetHeight');
	          // Add a negative margin-top the size of the toolbar to the content el.
	          // The content will start transformed down the toolbarHeight amount,
	          // so everything looks normal.
	          //
	          // As the user scrolls down, the content will be transformed up slowly
	          // to put the content underneath where the toolbar was.
	          contentElement.css(
	            'margin-top',
	            (-toolbarHeight * shrinkSpeedFactor) + 'px'
	          );
	          onContentScroll();
	        }

	        function onContentScroll(e) {
	          if(contentElement.scrollTop() == 0) {
	          	contentElement.scrollTop(0.1);
	          } 
	        }
	  	}
	  };
  }

})();