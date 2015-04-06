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
          		if(wrapper.height() > 0) {
          			contentElement.scrollTop(0);
          			e.preventDefault();
          			e.stopPropagation();
          		}
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
		            newContentEl.on('scroll', scrollBlock);
		            newContentEl.attr('flexible-shrink', 'true');

		            contentElement = newContentEl;
		            //$$rAF(updateToolbarHeight);
		            element.toolbarFlexibleLoaded = true;
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
	          	var deltaY = (orgEvent.deltaY || orgEvent.detail || orgEvent.wheelDelta / 40) * -1;
	          	
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
			        if(wrapper.height()+delta > element.height()) {
			        	delta = element.height() - wrapper.height();
			        }
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

	    	var toolbarFlexibleLoaded = function(event, flexible, toolbar) {
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

	    			if(attr.animate) {
		    			var dummy = angular.element('<div></div>').appendTo(toolbar).css(attr.animate);
		    			for(var i in attr.animate) {
		    				var iniMatch, toMatch;
		    				var functionReg = /^(\w+)\((.+)\)$/;
		    				var numberReg = /^((?:-)?[\d.]+)(\D*)/;
		    				//var hexcolorReg = /^#([0-9a-f]{3}|[0-9a-f]{6})/;
		    				if(iniMatch = element.css(i).match(functionReg)) {
		    					toMatch = dummy.css(i).match(functionReg);
		    					state[i] = {fn: iniMatch[1], attr: []};
		    					var iniAttr = iniMatch[2].split(',').map(function(item) {return item.trim()});
		    					var toAttr = toMatch[2].split(',').map(function(item) {return item.trim()});
		    					for(var j = 0; j < iniAttr.length; j++) {
		    						var iniAttrMatch = iniAttr[j].match(numberReg);
		    						var toAttrMatch = toAttr[j].match(numberReg);
		    						var iniValue = parseFloat(iniAttrMatch[1],10);
			    					var toValue = parseFloat(toAttrMatch[1],10);
		    						state[i].attr.push({ini: iniValue, diff: toValue - iniValue, unit: iniAttrMatch[2]});
		    					}
		    				} else {
		    					iniMatch = element.css(i).match(numberReg);
			    				toMatch = dummy.css(i).match(numberReg);
			    				var iniValue = parseFloat(iniMatch[1],10);
			    				var toValue = parseFloat(toMatch[1],10);
			    				state[i] = {ini: iniValue, diff: toValue - iniValue, unit: iniMatch[2]};
		    				}
		    			}
		    			dummy.remove();
	    			}
	    			toolbar.append(element);

					flexible.on('$mdToolbarFlexibleResize', function(e, ratio, flexible) {
						var tmpState = {};
						var getValue = function(state) {
							return (Math.round((state.ini + (state.diff * ratio)) * 100) / 100) + (state.unit||'');
						}
						for(var i in state) {
							if(state[i].fn) {
								var tmpAttr = [];
								state[i].attr.forEach(function(attr) {
									tmpAttr.push(getValue(attr));
								});
								tmpState[i] = state[i].fn+'('+tmpAttr.join(', ')+')';
							} else {
								tmpState[i] = getValue(state[i]);
							}
						}

			    		element.css(tmpState);
			    	});	    			
	    		}
	    	};

	    	if(parentFlexible.toolbarFlexibleLoaded) {
	    		toolbarFlexibleLoaded(null, parentFlexible, parentFlexible.parent());
	    	} else {
	    		scope.$on('$mdToolbarFlexibleLoaded', toolbarFlexibleLoaded);
	    	}
	    }
	};
  }

})();