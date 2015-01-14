'use strict';
(function() {
	var runningOwnEvent = false;
	var affectedKeys = new Map();
	var invalidInputTypes = new Set(['radio', 'checkbox', 'button', 'color', 'range']);
	
	var defaultStorageObject = {
		keyCodes: [
				[48, 48], // 0
				[49, 49], // 1
				[50, 50], // 2
				[54, 54], // 6
				[55, 55], // 7
				[56, 56], // 8
				[57, 57]  // 9
			]
	};
	chrome.storage.local.get({ keyCodes: defaultStorageObject }, function(storage) {
		affectedKeys = new Map(storage.keyCodes);
	});
	chrome.storage.onChanged.addListener(function(storageChange) {
		affectedKeys = new Map(storageChange.keyCodes.newValue);
	});

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
		// Stop this event override if it's not a bug affected key or if modifier keys are pressed.
		if (!affectedKeys.has(e.keyCode) || runningOwnEvent || e.altKey === true || e.ctrlKey === true || e.shiftKey === true)
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
		
		var character = String.fromCharCode(affectedKeys.get(e.keyCode));
		// Manually insert the pressed character in editableContent element
		if (ele.contentEditable == 'true') {
			replaceWindowSelectionWithHtml(character);
			return;
		}
		
		// Manually insert the pressed character in input or textarea element
		if (ele.readOnly === true || ele.disabled === true)
			return;
			
		if (ele.selectionStart === ele.selectionEnd && ele.selectionEnd === ele.value.length) {
			ele.value += character;
		}else{
			var endSelectionIndex = ele.selectionStart + 1;
			var beforeSelection = ele.value.substr(0, ele.selectionStart);
			var afterSelection = ele.value.substr(ele.selectionEnd, ele.value.length);
			ele.value = beforeSelection + character + afterSelection;
			ele.setSelectionRange(endSelectionIndex, endSelectionIndex);
		}

	}
	
})();