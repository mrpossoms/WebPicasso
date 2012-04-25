
const KEY_UP		 = 38;
const KEY_DOWN  = 40;
const KEY_LEFT	= 37;
const KEY_RIGHT	= 39; 
var keys = null;

/*
 *	Class:	Keyboard	-	Listens for keystrokes from the keyboard. Allows smooth keyboard input without
 *									glittchy delays in key state changes.
 */
function Keyboard(){

	keys = new Array(222);
	
	for(var i = 0; i < keys.length; i++){
		keys[i] = Boolean(false);
	}

	this.DOWN = function(code){
		keys[code.keyCode] = true;
	}
	
	this.UP = function(code){
		keys[code.keyCode] =  false; 
	}
	
	document.onkeydown = this.DOWN;
	document.onkeyup = this.UP;
	
	this.isKeyDown = function(code){

		if(code < 8 || code > 222){
			alert("not a valid keycode");
			return false;
		}
		return keys[code];
	}
}

