'use strict';

var validCharCodes = new Set([
	43, // +
	45, // -
	47, // /
	48, // 0
	49, // 1
	50, // 2
	54, // 6
	55, // 7
	56, // 8
	57, // 8
]);

var lastKeyDownKeyCode;
var keyCodes = new Map();
var keyCodeTable = document.getElementById('keyCodeTable');
var addNewCharCodeInput = document.getElementById('addNewCharCodeInput');
init();


function init() {
	loadFromStorage();
	addNewCharCodeInput.addEventListener('keydown', function(e) {
		lastKeyDownKeyCode = e.keyCode;
	});
	addNewCharCodeInput.addEventListener('keypress', function(e) {
		if (validCharCodes.has(e.charCode) && !keyCodes.has(lastKeyDownKeyCode))
			addKeyCode(lastKeyDownKeyCode, e.charCode);
		e.preventDefault();
	});
}

function addKeyCode(keyCode, charCode, skipSave) {
	if (keyCodes.has(keyCode))
		removeKeyCode(keyCode, true);
		
	keyCodes.set(keyCode, charCode);
	
	var tr = document.createElement('tr');
	tr.setAttribute('data-keyCode', keyCode);
	
	var tdRemove = document.createElement('td');
	var removeButton = document.createElement('button');
	removeButton.textContent = 'X';
	removeButton.addEventListener('click', deleteButtonEvent);
	tdRemove.appendChild(removeButton);
	
	var tdKeyCode = document.createElement('td');
	tdKeyCode.textContent = keyCode;
	
	var tdCharCode = document.createElement('td');
	tdCharCode.innerHTML = '<strong>' + String.fromCharCode(charCode) + '</strong>'; // (' + charCode + ')';
	
	tr.appendChild(tdRemove);
	tr.appendChild(tdKeyCode);
	tr.appendChild(tdCharCode);
	keyCodeTable.appendChild(tr);
	
	if (skipSave !== true)
		saveToStorage();
}

function deleteButtonEvent(e) {
	var ele = e.target;
	while (ele.tagName !== 'TR') {
		if (ele.tagName === 'BODY')
			return;
		ele = ele.parentElement;
	}
	var keyCode = parseInt(ele.getAttribute('data-keyCode'));
	removeKeyCode(keyCode);
}

function removeKeyCode(keyCode, skipSave) {
	keyCodes.delete(keyCode);
	if (skipSave !== true)
		saveToStorage();
	
	var tr = keyCodeTable.querySelector('tr[data-keyCode="'+ keyCode +'"]');
	if (tr)
		tr.parentElement.removeChild(tr);
}

function loadFromStorage() {
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

	chrome.storage.local.get(defaultStorageObject, function(storage) {
		for (var i = 0; i < storage.keyCodes.length; i++)
			addKeyCode(storage.keyCodes[i][0], storage.keyCodes[i][1], true);
	});
}

function saveToStorage() {
	console.log('Saving...');
  
  var storageObject = { keyCodes: [] };
  
  keyCodes.forEach(function(value, key) {
	storageObject.keyCodes.push([key, value]);
  });
 
  chrome.storage.local.set(storageObject);
}
