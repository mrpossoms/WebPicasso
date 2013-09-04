if(typeof(Picasso) != "undefined"){
	
	Picasso.Sprite = {
		Init: function(vert, frag, canvasId){
			// create a quad with the appropriate uvs to act
			// as a sprite.
			var s = 0.5;				
			var verts = [ s, s, 0,
						 -s, s, 0,
						  s,-s, 0,
						 -s,-s, 0];
			var uvs = [ 1, 0,
						0, 0,
						1, 1,
						0, 1 ];
			this.__proto__.Quad = new Picasso.Mesh([verts, uvs], [3, 2]);
			this.__proto__.SpriteEffect = new Picasso.Effect(vert, frag, ["aVertexPosition", "aUV"]);
			
			with(this){
				Bind();
				SetAspectRatio(canvasId);
				SetPos(0, 0); SetScale(1, 1); SetRotation(0);
				SetPan(0, 0); SetZoom(1);
			}
		},
		SetPos: function(x, y){
			var gl = $GL;
			
			var pUniform = SpriteEffect.GetUniLoc("uPosition");
			gl.uniform2fv(pUniform, new Float32Array([x, y]));
		},
		SetScale: function(x, y){
			var gl = $GL;
			
			var pUniform = SpriteEffect.GetUniLoc("uScale");
			gl.uniform2fv(pUniform, new Float32Array([x, y]));
		},
		SetRotation: function(t){
			var gl = $GL;
			
			var pUniform = SpriteEffect.GetUniLoc("uRotation");
			gl.uniform1f(pUniform, t, false);
		},
		SetPan: function(x, y){
			var gl = $GL;
			
			var pUniform = SpriteEffect.GetUniLoc("uPan");
			gl.uniform2fv(pUniform, new Float32Array([x, y]));
		},
		SetZoom: function(z){
			var gl = $GL;
			
			var pUniform = SpriteEffect.GetUniLoc("uZoom");
			gl.uniform1f(pUniform, z < 0 ? 0 : z, false);
		},
		Bind: function(){
			Picasso.BindMesh(Quad, SpriteEffect);
		},
		Draw: function(){
			//Picasso.DrawMesh(Quad); TODO
			var gl = $GL;
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, Quad.VertCount);
		},
		SetTexture: function(tex){
			var gl = $GL;
		
			// set the texture (really only needs to be done once...)
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.uniform1i(SpriteEffect.GetUniLoc("uColor"), 0);
		},
		SetAspectRatio: function(id){
			var ratio = 1;
			if(typeof(id) == "string"){
				var ele = document.getElementById(id);
				var ratio = ele.clientWidth / ele.clientHeight;
			}
			else
				ratio = id;
			// Calculate the aspect ratio and set the aspect ratio uniform
			var gl = $GL;
			var pUniform = SpriteEffect.GetUniLoc("uAspectRatio");
			gl.uniform1f(pUniform, ratio, false);
		}
	};
}