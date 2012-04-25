PicassoSprite = function(canvasId){
	this.Picasso = new Picasso(canvasId);
	this.m_geo = null;
	this.m_effect = null;
	// sprite properites
	this.m_position = $V([0,0]);
	this.m_size = $V([1,1]);
	this.m_angle = 0;
	this.m_texture = null;
	
	// create a quad with the appropriate uvs to act
	// as a sprite.
	var s = 1;				
	var verts = [ s, s, 0,
					 -s, s, 0,
					  s,-s, 0,
					 -s,-s, 0];
	var uvs = [ 1, 0,
					0, 0,
					1, 1,
					0, 1 ];
	this.m_geo= new Geometry([verts, uvs], [3, 2]);
	this.m_effect = new Effect("shader-vs", "shader-fs", ["aVertexPosition", "aUV"]);
	
	this.StartDraw = function(){
		this.Picasso.Draw();
	}
	
	this.Draw = function(position, size, angle, texture, alpha){
		this.m_geo.Draw(this.m_effect, this.uniformCallback, [this.m_effect, position, size, angle, texture, alpha]);
	}
	
	this.uniformCallback = function(data){
		var e = data[0]; // effect
		var pos = data[1]; // position
		var size = data[2]; // size
		var angle = data[3]; // angle
		var tex = data[4]; // texture
		var alpha = data[5]; // alpha
		
		e.SetUniformFloat("uAngle", parseFloat(angle));
		e.SetUniformVec2("uSize", size);
		e.SetUniformVec2("uPosition", pos);
		e.SetTexture("uSampler", tex);
		e.SetUniformFloat("uAlpha", parseFloat(alpha));
		e.SetUniformVec2("uScreenSize", $V([640,400]));
	}
}