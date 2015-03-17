(function() {
'use strict';

angular.module('material.components.toolbar')
  .directive('mdToolbarFlexible', mdToolbarFlexibleDirective)
  .directive('mdToolbarFlexibleItem', mdToolbarFlexibleItemDirective);

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
          	var wrapper;

          	var debouncedContentScroll = $$rAF.throttle(onContentScroll);

          	var scrollBlock = function(e) {
          		e.preventDefault();
          	};
          	//var debouncedUpdateHeight = $mdUtil.debounce(updateToolbarHeight, 5 * 1000);

	        // Wait for $mdContentLoaded event from mdContent directive.
	        // If the mdContent element is a sibling of our toolbar, hook it up
	        // to scroll events.
	        scope.$on('$mdContentLoaded', onMdContentLoad);

	        function onMdContentLoad($event, newContentEl) {
	          // Toolbar and content must be siblings
	        	if (element.parent().parent()[0] === newContentEl.parent()[0]) {
	        		wrapper = element
		            	.wrap('<div style="overflow:hidden; display: inline"></div>')
		            	.css('display', 'block')
		            	.parent();

		            wrapper.parent()
		            	.on('wheel', debouncedContentScroll);
		            // unhook old content event listener if exists
		            if (contentElement) {
		              contentElement.off('wheel', debouncedContentScroll);
		              contentElement.off('scroll', scrollBlock);
		            }
					//flexibleHeight = element.prop('offsetHeight');
		            newContentEl.on('wheel', debouncedContentScroll);
		            newContentEl.attr('flexible-shrink', 'true');

		            contentElement = newContentEl;
		            //$$rAF(updateToolbarHeight);
		            scope.$broadcast('$mdToolbarFlexibleLoaded', element, wrapper.parent());
		        }
	        }

	        /*function updateToolbarHeight() {
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
	        }*/

	        function onContentScroll(e) {
	          if(contentElement.scrollTop() == 0) {
	          	var orgEvent = e.originalEvent;
	          	var deltaY = orgEvent.deltaY || orgEvent.detail || orgEvent.wheelDelta / 40;
	          	
	          	if((deltaY < 0 && wrapper.height() > 0) || (deltaY > 0 && wrapper.height() < element.height())) {
	          		e.preventDefault();
	          		if ( orgEvent.deltaMode === 1 ) {
			            var lineHeight = parseInt(contentElement.css('fontSize'), 10) || parseInt(element.css('fontSize'), 10) || 16;
			            deltaY *= lineHeight;
			        } else if ( orgEvent.deltaMode === 2 ) {
			            var pageHeight = contentElement.height();
			            deltaY *= pageHeight;
			        }
			        var delta = deltaY * shrinkSpeedFactor;
		          	element.css(
			            $mdConstant.CSS.TRANSFORM,
			            'translate3d(0,' + delta + 'px,0)'
			        );
			        wrapper.css('height', (wrapper.height()+delta)+'px');
			        element.trigger('$mdToolbarFlexibleResize', [(element.height()-wrapper.height())/element.height(), element]);				        
	          	}

	          } 
	        }
	  	}
	  };
  }

  function mdToolbarFlexibleItemDirective($$rAF, $mdConstant, $mdUtil, $mdTheming) {
  	return {
	    restrict: 'EA',
	    controller: angular.noop,
	    link: function(scope, element, attr) {
	    	attr.animate && (attr.animate = JSON.parse(attr.animate));
	    	var parentFlexible = element.closest('md-toolbar-flexible')[0],
	    		anchor,
	    		anchorPos,
	    		state = {};
	    	scope.$on('$mdToolbarFlexibleLoaded', function(event, flexible, toolbar) {
	    		if(parentFlexible == flexible[0]) {
	    			anchor = attr.anchor||'bottom';
	    			anchorPos = element.css(anchor);
	    			if(anchorPos=='auto') {
	    				if(['bottom', 'right'].indexOf(anchor) == -1) {
	    					anchorPos = (flexible.position()[anchor]+element.position()[anchor]);
	    				} else if(anchor == 'bottom') {
	    					anchorPos = toolbar.height() - (flexible.position().top+element.position().top+element.height());
	    				} else {
	    					anchorPos = toolbar.width() - (flexible.position().left+element.position().left+element.width());
	    				}
	    				anchorPos += 'px';
	    			}
	    			if(['fixed', 'absolute'].indexOf(element.css('position')) == -1) {
	    				element.css('position', 'absolute').css(anchor, anchorPos);
	    			}

	    			for(var i in attr.animate) {
	    				var iniState = element.css(i).match(/^([\d.]+)(\D*)/);
	    				var toState = attr.animate[i].match(/^([\d.]+)(\D*)/);
	    				var iniValue = parseInt(iniState[1],10);
	    				var toValue = parseInt(toState[1],10);
	    				state[i] = {ini: iniValue, diff: toValue - iniValue, unit: iniState[2]};
	    			}

	    			toolbar.append(element);

					flexible.on('$mdToolbarFlexibleResize', function(e, ratio, flexible) {
						var tmpState = {};
						for(var i in state) {
							tmpState[i] = (Math.round((state[i].ini + (state[i].diff * ratio)) * 100) / 100) + (state[i].unit||'');
						}
			    		element.css(tmpState);
			    	});	    			
	    		}
	    	});
	    }
	};
  }

})();