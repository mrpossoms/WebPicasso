if(typeof(Picasso.Sprite) != "undefined"){
	var s = Picasso.Sprite;
		s.SetNormalMap = function(tex){
			var gl = $GL;
		
			// set the texture (really only needs to be done once...)
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.uniform1i(SpriteEffect.GetUniLoc("uNorm"), 1);
		};
		s.SetAmbient = function(r, g, b, a){
			var gl = $GL;
			gl.uniform4fv(SpriteEffect.GetUniLoc("uAmbientColor"), [r, g, b, a]);
		};
		s.SetLightPos = function(x, y){
			var gl = $GL;
			gl.uniform2fv(SpriteEffect.GetUniLoc("uLightPos"), [x, y]);
		};
		s.SetLight = function(r, g, b, a){
			var gl = $GL;
			gl.uniform4fv(SpriteEffect.GetUniLoc("uLightColor"), [r, g, b, a]);
		};
}