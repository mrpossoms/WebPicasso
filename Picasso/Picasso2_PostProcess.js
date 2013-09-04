if(typeof(Picasso) != "undefined"){
	Picasso.PostProcess = {
		Init: function(){
			var s = 1;				
			var verts = [ s, -s, 0,
						 -s, -s, 0,
						  s,s, 0,
						 -s,s, 0];
			var uvs = [ 1, 0,
						0, 0,
						1, 1,
						0, 1 ];
			this.__proto__.Quad = new Picasso.Mesh([verts, uvs], [3, 2]);
		},
		RenderTarget: function(w, h, mag, min, props, texParams){
			var _gl = $GL;
			var framebuffer = _gl.createFramebuffer();
			var renderbuffer = _gl.createRenderbuffer();
			
			_gl.bindFramebuffer(_gl.FRAMEBUFFER, framebuffer);
			framebuffer.w = w; framebuffer.h = h;
			props = props || {};
			
			var format = props.Format || _gl.RGBA;
			var type = props.Type || _gl.UNSIGNED_BYTE;
			var texture = _gl.createTexture();
			_gl.bindTexture(_gl.TEXTURE_2D, texture);
			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, mag);
			_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, min);
			
			if(texParams) texParams(_gl); // set additional texture parameters
			
			_gl.texImage2D(_gl.TEXTURE_2D, 0, format, w, h, 0, format, type, null);
			_gl.generateMipmap(_gl.TEXTURE_2D);
			
			_gl.bindRenderbuffer(_gl.RENDERBUFFER, renderbuffer);
			_gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, w, h);
			
			_gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, texture, 0);
			_gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, renderbuffer);
			
			_gl.bindTexture(_gl.TEXTURE_2D, null);
			_gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
			_gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
			
			this.Framebuffer = framebuffer;
			this.Renderbuffer = renderbuffer;
			this.Texture = texture;
		},
		BindRT: function(rt){
			var _gl = $GL;
			_gl.bindFramebuffer(_gl.FRAMEBUFFER, rt.Framebuffer);
			_gl.viewport(0, 0, rt.Framebuffer.w, rt.Framebuffer.h);

		},
		UnbindRT: function(rt){
			var _gl = $GL;
			// now that drawing is done generate the texture
			_gl.bindTexture(_gl.TEXTURE_2D, rt.Texture);
			_gl.generateMipmap(_gl.TEXTURE_2D);
			_gl.bindTexture(_gl.TEXTURE_2D, null);
			// unbind the frame buffer
			_gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
		},
		FullscreenRT: function(w, h, mag, min, props, texParams){
				var log2 = function(x){
					var log = Math.log;
					return log(x) / log(2);
				};
				
				var ceil = Math.ceil;
				var pow = Math.pow;
				// 2^ceil(log2(x))
				w = pow(2, ceil(log2(w)));
				h = pow(2, ceil(log2(h)));
				var fb = new Picasso.PostProcess.RenderTarget(w, h, mag, min, props, texParams);
				fb.DisplayWidth = w; fb.DisplayHeight = h;
				return fb;
		},
		DrawFitScreen: function(effect, rt, setUniforms){
			var _gl = $GL, w = _gl.drawingBufferWidth, h = _gl.drawingBufferHeight;
			Picasso.BindMesh(Quad, effect);
			_gl.uniform2fv(effect.GetUniLoc("uUVScale"), [1, 1]);
			
			_gl.activeTexture(_gl.TEXTURE0);
			_gl.bindTexture(_gl.TEXTURE_2D, rt.Texture);
			_gl.uniform1i(effect.GetUniLoc("uTexture"), 0);
			
			if(setUniforms) setUniforms();

			//Picasso.DrawMesh(Quad); TODO
			_gl.drawArrays(_gl.TRIANGLE_STRIP, 0, Quad.VertCount);
		},
		DrawFullScreen: function(effect, rt){
			var _gl = $GL, w = _gl.drawingBufferWidth, h = _gl.drawingBufferHeight;
			Picasso.BindMesh(Quad, effect);
			_gl.uniform2fv(effect.GetUniLoc("uUVScale"), [rt.DisplayWidth / rt.Framebuffer.w, rt.DisplayHeight / rt.Framebuffer.h]);
			
			_gl.activeTexture(_gl.TEXTURE0);
			_gl.bindTexture(_gl.TEXTURE_2D, rt.Texture);
			_gl.uniform1i(effect.GetUniLoc("uTexture"), 0);
			
			//Picasso.DrawMesh(Quad); TODO
			_gl.drawArrays(_gl.TRIANGLE_STRIP, 0, Quad.VertCount);
		}
	};
}
