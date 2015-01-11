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
	

	// Add event on all input and textareas on the site
	addEventToElements(document.body);
	
	// Create observer to override elements added later on
	var newDOMElementsObserver = new MutationObserver(function(mutations) {
		for(var i = 0; i < mutations.length; i++) {
			var mutation = mutations[i];
			
			for (var j = 0; j < mutation.addedNodes.length; j++) {
				var addedNode = mutation.addedNodes[j];

				switch (addedNode.tagName) {
					case 'INPUT':
						addEventToInput(addedNode);
						break;
					case 'TEXTAREA':
						addEventToTextarea(addedNode);
					default:
						if (addedNode.contentEditable == 'true')
							addEventToEditableElement(addedNode);
					break;
				}
				
				if ('querySelectorAll' in addedNode)
					addEventToElements(addedNode);
			}
		}
	});
	newDOMElementsObserver.observe(document.body, { childList: true, addedNodes: true, subtree: true });
	
	// Observe changes in contentEditable
	var attributeObserver = new MutationObserver(function(mutations) {
		for(var i = 0; i < mutations.length; i++) {
			var mutation = mutations[i];
			if (mutation.target.contentEditable == 'true')
				addEventToEditableElement(mutation.target);
			else
				removeEventToEditableElement(mutation.target);
		}
	});
	attributeObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['contenteditable'] });
	
	// Adds events to all relevant elements
	function addEventToElements(rootElement) {
		var inputs = rootElement.getElementsByTagName('input');
		for(var i = 0; i < inputs.length; i++)
			addEventToInput(inputs[i]);
		
		var textareas = rootElement.getElementsByTagName('textarea');
		for(i = 0; i < textareas.length; i++)
			addEventToTextarea(textareas[i]);
			
		var editableElements = rootElement.querySelectorAll('[contenteditable="true"]');
		for(i = 0; i < editableElements.length; i++)
			addEventToEditableElement(editableElements[i]);
	}
	
	// Adds event to input element
	function addEventToInput(inputElement) {
		if (!invalidInputTypes.has(inputElement.type))
			inputElement.addEventListener('keydown', keyDownOverride);
	}
	
	// Adds event to textarea element
	function addEventToTextarea(textAreaElement) {
		textAreaElement.addEventListener('keydown', keyDownOverride);
	}
	
	// Adds event to element with editableContent
	function addEventToEditableElement(editableElement) {
		editableElement.addEventListener('keydown', keyDownOverride);
	}
	
	// Removed event from element with editableContent
	function removeEventToEditableElement(editableElement) {
		editableElement.removeEventListener('keydown', keyDownOverride);
	}
	
	// Replaced current window selection (used for elements with contentEditable)
	function replaceWindowSelectionWithHtml(html) {
		var selection = window.getSelection();
		var range = selection.getRangeAt(0);
		range.deleteContents();
		var div = document.createElement("div");
		div.innerHTML = html;
		var fragment = document.createDocumentFragment()
		
		var child;
		while ((child = div.firstChild)) {
			fragment.appendChild(child);
		}
		range.insertNode(fragment);
		
		var selectionElement = selection.anchorNode.nextSibling;
		range.setStartAfter(selectionElement, 0);
		range.setEndAfter(selectionElement, 0);
		
		selection.removeAllRanges();
		selection.addRange(range);
	}

	// Event override used for all elements
	function keyDownOverride(e) {
		// Stop this event override if it's not an bug affected key or if modifier keys are pressed.
		if (!affectedKeys.has(e.which) || runningOwnEvent || e.altKey === true || e.ctrlKey === true || e.shiftKey === true)
			return;
			
		var ele = e.target;

		// Stop everything about this event
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
	   
		// Send out replacement events. Don't continue if event is canceled by other code.
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
		if (ele.contentEditable == 'true') {
			replaceWindowSelectionWithHtml(String.fromCharCode(e.which));
			return;
		}
		
		// Manually insert the pressed character in input or textarea element
		if (ele.selectionStart === ele.selectionEnd && ele.selectionEnd === ele.value.length) {
			ele.value += String.fromCharCode(e.which);
		}else{
			var endSelectionIndex = ele.selectionStart + 1;
			var beforeSelection = ele.value.substr(0, ele.selectionStart);
			var afterSelection = ele.value.substr(ele.selectionEnd, ele.value.length);
			ele.value = beforeSelection + String.fromCharCode(e.which) + afterSelection;
			ele.setSelectionRange(endSelectionIndex, endSelectionIndex);
		}

	}
	
})();