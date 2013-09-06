if(typeof(Picasso) == "undefined"){
	// initialize picasso namespace!
	var $GL;

	Picasso = {
		//------------------------------------------------------------------------
		// CORE PROPERTIES
		_gl: null,     // GL context
		_cvs: null,    // Canvas element
		_xhr: null,    // XMLHttpRequest
		//------------------------------------------------------------------------
		// RENDERING PROPERTIES
		//------------------------------------------------------------------------
		// FUNCTIONS
		Init: function(canvas, defaultGLCalls, GLInitCalls){
			try{
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
				$GL = this._gl = canvas.getContext(
					"experimental-webgl",
					{antialias: true}
				); // get the gl context

				this._cvs = canvas; // keep reference to canvas	

				// get check extensions for additional openGL functionality
				this._glExtensionTextureFloat = $GL.getExtension( 'OES_texture_float' );
				this._glExtensionStandardDerivatives = $GL.getExtension( 'OES_standard_derivatives' );

				this._anisoFiltering = $GL.getExtension( 'EXT_texture_filter_anisotropic' ) ||
					$GL.getExtension( 'MOZ_EXT_texture_filter_anisotropic' ) ||
					$GL.getExtension( 'WEBKIT_EXT_texture_filter_anisotropic' );


				this._glExtensionCompressedTextureS3TC = $GL.getExtension( 'WEBGL_compressed_texture_s3tc' ) ||
					$GL.getExtension( 'MOZ_WEBGL_compressed_texture_s3tc' ) ||
					$GL.getExtension( 'WEBKIT_WEBGL_compressed_texture_s3tc' );
				
				if(typeof(GLInitCalls) == "function"){
					// execute user init calls
					GLInitCalls($GL);
				}
				else{
					// default init calls
					$GL.enable($GL.BLEND);
					$GL.blendFunc($GL.SRC_ALPHA, $GL.ONE_MINUS_SRC_ALPHA);	// enable alpha blending
				}
				
				// setup the default picasso GL calls COULD REMOVE
				if(defaultGLCalls){
					$GL.enable($GL.DEPTH_TEST);
					$GL.depthFunc($GL.LEQUAL);
				}

				window.onresize = function(){
					canvas.width = window.innerWidth;
					canvas.height = window.innerHeight;
					Picasso.Init(canvas, defaultGLCalls, GLInitCalls);
					Picasso.SetViewport(0, 0, canvas.width, canvas.height);
				};
			}
			catch(e){
				console.log("Picasso.Init() Error: " + e.message);
			}
		},
		_syncPOST: function(url){
			var _xhr = this._xhr;
			if(_xhr == null)_xhr = new XMLHttpRequest();
			
			// open, and send the request
			_xhr.open("POST", url, false);
			_xhr.send();
			return _xhr.responseText;
		},
		LoadShader: function(url){
			var _gl = $GL;
			var source = this._syncPOST(url);
			var shader = null;
			
			var type = url.split('.'); type = type[type.length-1].toLowerCase();

			switch(type){
				case "vert":
					shader = _gl.createShader(_gl.VERTEX_SHADER);
					break;
				case "frag":
					shader = _gl.createShader(_gl.FRAGMENT_SHADER);
					break;
				default:
					return null;
			}
			
			shader.Url = url; // keep url for diagnostics
			_gl.shaderSource(shader, source);
			_gl.compileShader(shader);
			if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) {
				console.log(url + "\nAn error occurred compiling the shaders: " + _gl.getShaderInfoLog(shader));
				return null;
			}
			return shader;
		},
		LoadTexture: function(url, mag, min, texParams, callback){
			var _gl = $GL;
			var gl_texture = _gl.createTexture();
			
			var img = new Image();
			img.onload = function(e){
				_gl.bindTexture(_gl.TEXTURE_2D, gl_texture);
				_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, img); // this line will only work if the page is live

				_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, mag);
				_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, min);
				_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
				_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);

				// if a callback has been provided for additional openGL
				// texture parameters, then go ahead and call it before
				// finishing texture creation.
				if(texParams) texParams(_gl);

				_gl.bindTexture(_gl.TEXTURE_2D, null);
				img.GL = gl_texture; // keep reference to the image
		
				// if there is stuff to do
				if(callback) callback(img);
			};
			img.onerror = function(){ img.src = url; };
			img.src = url;
			
			return img;
		},
		EnableAnisotropic: function(){
			if(Picasso._anisoFiltering){
				var _gl = $GL;
				_gl.texParameterf(
					_gl.TEXTURE_2D,
					Picasso._anisoFiltering.TEXTURE_MAX_ANISOTROPY_EXT,
					4
				);
			}
		},
		GetTextels: function(texture){
			if(texture == null || texture.width == null) return null;

			// create a temp canvas element to read textel data from
			var cvs = document.createElement("CANVAS");
			cvs.width = texture.width; 
			cvs.height = texture.height;
			
			var cvsCtx = cvs.getContext("2d"); // Get canvas 2d context
			cvsCtx.drawImage(texture, 0, 0); // Draw the texture
			var textels = cvsCtx.getImageData(0,0, cvs.width, cvs.height); // Read the texels/pixels back
			return textels;		
		},
		BindMesh: function(mesh, effect){
			var _gl = $GL;
			
			// bind all the buffers for this geometry
			for(var di = effect.iAttribs.length; di--;){
				_gl.bindBuffer(_gl.ARRAY_BUFFER, mesh.Buffers[di]); // set the buffer
				_gl.vertexAttribPointer(effect.iAttribs[di], mesh.Sizes[di], _gl.FLOAT, false, 0, 0);
			}
			
			$GL.useProgram(effect.ShaderProgram);
		},
		Clear: function(r, g, b, a){
			var _gl = $GL;
			_gl.clearColor(r,g,b,a);
			_gl.clear(_gl.COLOR_BUFFER_BIT|_gl.DEPTH_BUFFER_BIT);
		},
		SetViewport: function(x, y, w, h){
			$GL.viewport(x, y, w, h);
		},
		DrawMesh: function(mesh){
			var _gl = $GL;
			_gl.drawArrays(_gl.TRIANGLES, 0, mesh.VertCount);
		},
		//------------------------------------------------------------------------
		// CLASSES
		Effect: function(vertex, fragment, attribs){
			var _gl = $GL;
			var shader = this.ShaderProgram = _gl.createProgram();
			var uniforms = this._uniforms = new Array();
			
			_gl.attachShader(shader, vertex);
			_gl.attachShader(shader, fragment);
			_gl.linkProgram(shader);

			if (!_gl.getProgramParameter(shader, _gl.LINK_STATUS)) {
				console.log("Vertex: " + vertex.Url + "\nFragment: " + fragment.Url + "\nUnable to initalize the shader program!");
			}
			
			// itterate over all attributes and enable them for the program
			var iAttribs = new Array(attribs.length), Attribs = new Array();
			for(var vai = attribs.length; vai--;){
				var attrib = _gl.getAttribLocation(shader, attribs[vai]);
				_gl.enableVertexAttribArray(attrib);
				iAttribs[vai] = attrib; Attribs[attribs[vai]] = attrib;
			}
			this.iAttribs = iAttribs; this.Attribs = Attribs;
			
			this.GetUniLoc = function(id){
				if(uniforms[id] == null)
					return uniforms[id] = _gl.getUniformLocation(shader, id);
				return uniforms[id];
			};
		},
		//------------------------------------------------------------------------
		Mesh: function(buffers, elementSizes){
			var _gl = $GL;
			this.Buffers = Array(buffers.length); // buffers for geometry (array of arrays)
			this.Sizes = elementSizes; // byte sizes for each element
			this.VertCount = buffers[0].length / elementSizes[0]; // calc the vert count.

			// be sure that our provided vertex data is correct
			if(this.VertCount > Math.floor(this.VertCount)){
				console.log("Vertex data, or expected size are wrong. Vertex count must be an integer.");
				return null;
			}

			// create and add the buffers
			for(var bi = buffers.length; bi--;){
				var b = _gl.createBuffer(); // create a new buffer
				b.Size = elementSizes[bi];
				_gl.bindBuffer(_gl.ARRAY_BUFFER, b);
				_gl.bufferData(_gl.ARRAY_BUFFER, new Float32Array(buffers[bi]), _gl.STATIC_DRAW);
				this.Buffers[bi] = b; // add the new buffer.		
			}
		}
	};
}
