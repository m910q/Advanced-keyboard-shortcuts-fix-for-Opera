'use strict';
(function() {
	var runningOwnEvent = false;
	var affectedKeys = new Set([
		49, // 1
		50, // 2
		54, // 6
		55, // 7
		56, // 8
		57, // 9
		58, // 0
		43, // +
		45, // -
		47  // /
		
	]);
	var invalidInputTypes = new Set(['radio', 'checkbox', 'button', 'color', 'range']);
	
	// Add event on all input an textareas on the site. Don't add input types that does not have any text input
	var inputs = document.getElementsByTagName('input');
	for(var i = 0; i < inputs.length; i++) {
		if (!invalidInputTypes.has(inputs[i].type))
			inputs[i].addEventListener('keydown', keyDownOverride);
	}

	function keyDownOverride(e) {
		// Stop this event override if it's not an affected key or if modifier keys are pressed.
		if (!affectedKeys.has(e.which) || runningOwnEvent || e.altKey === true || e.ctrlKey === true || e.shiftKey === true)
			return;
			
		var ele = e.target;

		// Stop everything about this event
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
	   
		// Send out replacement events. Don't continue if event is stopped.
		runningOwnEvent = true;
		try {
			var replacementEvent = new KeyboardEvent('keydown', e);
			if (!ele.dispatchEvent(replacementEvent))
				return;

			replacementEvent = new KeyboardEvent('keypress', e);
			if (!ele.dispatchEvent(replacementEvent))
				return;
		}
		finally {
			runningOwnEvent = false;
		}
		
		// Manually insert the pressed character
		if (ele.selectionStart === ele.selectionEnd && ele.selectionEnd === ele.value.length) {
			ele.value += String.fromCharCode(e.which);
		}else{
			var endSelectionIndex = ele.selectionStart + 1;
			var beforeSelection = ele.value.substr(0, ele.selectionStart);
			var afterSelection = ele.value.substr(ele.selectionEnd, ele.value.length);
			ele.value = beforeSelection + '1' + afterSelection;
			ele.setSelectionRange(endSelectionIndex, endSelectionIndex);
		}

	}
	
})();