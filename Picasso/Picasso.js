  var rttFramebuffer;
  var rttTexture;

Picasso = function(canvasID){
	// get our canvas
	var canvas = document.getElementById(canvasID);
	gl = "test";	

	initWebGL(canvas);	// init the GL context

	// proceed if we accquired the GL context
	if(gl){
		// if successful
	}
	//-----------------------------------------------
	function initWebGL(canvas){
		try{
			gl = canvas.getContext("experimental-webgl");
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);	// enable alpha blending
		}
		catch(e){
			alert(e);
		}
	}
	//-----------------------------------------------------
	this.Draw = function(){
		gl.clearColor(0.47, 0.74, 1, 1); // black
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	}
}

/*
 * Effect - A collection of one fragment program and one vertex program
 *	    as well as an array of string attribute identifiers. 
 *	Parameters
 *		vertProg - id of the GLSL vertex program
 *		fragProg - id of the GLSL fragment program
 *		attribs - string of program attribute identifiers
 */
Effect = function(vertProg, fragProg, attribs){

	this.vertShader = GetShader(vertProg);
	this.fragShader = GetShader(fragProg);
	this.vertAttribs = attribs; // should be an array

	this.ShaderProgram = gl.createProgram();
	gl.attachShader(this.ShaderProgram, this.vertShader);
	gl.attachShader(this.ShaderProgram, this.fragShader);
	gl.linkProgram(this.ShaderProgram);

	if (!gl.getProgramParameter(this.ShaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initalize the shader program!");
	}

	// itterate over all attributes and enable them for the program
	{
		var newAttribs = new Array();
		for(var vai = 0; vai < this.vertAttribs.length; vai++){
			var attrib = gl.getAttribLocation(this.ShaderProgram, this.vertAttribs[vai]);
			gl.enableVertexAttribArray(attrib);
			newAttribs.push(attrib);
		}
		this.vertAttribs = newAttribs;
	}
	//----------------------------------------------------
	this.Apply = function(){
		gl.useProgram(this.ShaderProgram);
	}
	//----------------------------------------------------
	this.GetAttrib = function(index){
		return this.vertAttribs[index];
	}
	//----------------------------------------------------
	this.SetTexture = function(id, texture){
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture.Texture);
		gl.uniform1i(gl.getUniformLocation(this.ShaderProgram, id), 0);
	}
	//----------------------------------------------------
	this.SetUniformMatrix = function(id, matrix){
		var pUniform = gl.getUniformLocation(this.ShaderProgram, id);
		gl.uniformMatrix4fv(pUniform, false, new Float32Array(matrix.flatten()));
	}
	//----------------------------------------------------
	this.SetUniformVec2 = function(id, v){
		var pUniform = gl.getUniformLocation(this.ShaderProgram, id);
		gl.uniform2fv(pUniform, new Float32Array(v.flatten()));
	}
		//----------------------------------------------------
	this.SetUniformFloat = function(id, f){
		var pUniform = gl.getUniformLocation(this.ShaderProgram, id);
		gl.uniform1f(pUniform, f, false);
	}
}

/*
 * Geometry - A user definable collection of buffers which is used
 * 					to represent a mesh.
 *	Parameters
 *				buffers - array of buffers, such as position, UV, and normal buffers
 *							each represents a property of the vertex.
 *				elementSizes - an array of integer which defines the size of one
 *									   element in the corresponding buffer.
 */
Geometry = function(buffers, elementSizes){
	this.Buffers = Array(); // buffers for geometry (array of arrays)
	this.Sizes = elementSizes; // byte sizes for each element
	this.VertCount = buffers[0].length / elementSizes[0]; // calc the vert count.

	// be sure that our provided vertex data is correct
	if(this.VertCount > Math.floor(this.VertCount)){
		alert("Vertex data, or expected size are wrong. Vertex count must be an integer.");
		return null;
	}

	// create and add the buffers
	for(var bi = 0; bi < buffers.length; bi++){
		var b = gl.createBuffer(); // create a new buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, b);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffers[bi]), gl.STATIC_DRAW);
		this.Buffers.push(b); // add the new buffer.		
	}
	//---------------------------------------------------
	this.Draw = function(effect, setUniforms, uniformData){
		// bind all the buffers for this geometry
		for(var di = 0; di < this.Buffers.length; di++){
			gl.bindBuffer(gl.ARRAY_BUFFER, this.Buffers[di]); // set the buffer
			gl.vertexAttribPointer(effect.GetAttrib(di), this.Sizes[di], gl.FLOAT, false, 0, 0);
		}

		effect.Apply();
		setUniforms(uniformData); // call back and set the appropriate uniforms
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.VertCount);
	}
}
//------------------------------------------------------------------------------
RenderTarget = function(w, h){
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	// framebuffer
	/*this.FrameBuffer*/ rttFramebuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);//this.FrameBuffer);
	rttFramebuffer.width = parseInt(w);
	rttFramebuffer.height = parseInt(h);
	// colorbuffer
	/*this.Texture*/rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture); //this.Texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var RenderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, RenderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, RenderBuffer);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//-------------------------------------------
	RenderTarget.prototype.Bind = function(){
		//gl.bindRenderbuffer(gl.RENDERBUFFER, this.RenderBuffer);
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		//gl.bindTexture(gl.TEXTURE_2D, this.Texture);
		
	}
	//-------------------------------------------
	RenderTarget.prototype.Unbind = function(){	
		//gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//gl.bindTexture(gl.TEXTURE_2D, null);
	}
}
//------------------------------------------------------------------------------
Texture = function(src){
		this.Texture = gl.createTexture();
		this.Image = new Image();
}
//----------------------------------------------
// Global functions
//----------------------------------------------
function GetShader(id){
	var shaderScript = document.getElementById(id);

	if(!shaderScript) return null; // if we didn't get it, fail

	var src = "";
	var currChild = shaderScript.firstChild;

	while(currChild){
		if(currChild.nodeType == currChild.TEXT_NODE)
			src += currChild.textContent;

		currChild = currChild.nextSibling;
	}
	// now that we have the source, it's time to compile
	var shader;
	if(shaderScript.type == "x-shader/x-fragment")
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	else if(shaderScript.type == "x-shader/x-vertex")
		shader = gl.createShader(gl.VERTEX_SHADER);
	else
		return null; // fail if not a valid shader

	// compile
	gl.shaderSource(shader, src);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}
//-------------------------------------------------------
function GetShaderStr(src){
	// now that we have the source, it's time to compile
	var shader;
	if(shaderScript.type == "x-shader/x-fragment")
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	else if(shaderScript.type == "x-shader/x-vertex")
		shader = gl.createShader(gl.VERTEX_SHADER);
	else
		return null; // fail if not a valid shader

	// compile
	gl.shaderSource(shader, src);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}
//-------------------------------------------------------
LoadTexture = function(src){
	var tex = new Texture(src);
	tex.Image.onload = function(){HandleTextureLoaded(tex); }
	tex.Image.src = src;
	
	return tex;
}
//-------------------------------------------------------
function HandleTextureLoaded(tex){
		gl.bindTexture(gl.TEXTURE_2D, tex.Texture);
		//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.Image); // this line will only work if the page is live
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MINMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
}
