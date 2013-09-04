if(typeof(Picasso) != "undefined"){
	Picasso.GPUParticles = {
		_d: 1.0 / 64,
		_GPUPosEffect: null,
		_GPUVeloEffect: null,
		_GPUDisplayEffect: null,
		_PosResetEffect: null,
		_VeloResetEffect: null,
		CreateSystem: function(tex, subSystems){
			var gl = $GL;			
			var P = Picasso.GPUParticles;
			var width = tex.width;
			
			var positions = [];
			var dataCoords = [];
			
			// fraction of the U texture coord space that should
			// be used for this particular subsystem
			var uScale = 1 / subSystems;
			var textel = 1 / width;
			
			for(var i = subSystems; i--;)
				for(var y = width; y >= 0; y--) // for each row
					for(var x = width; x >= 0; x--){ // for each column
					var row = y, col = x;
					var u = row / width, v = col / width;
					positions.push(0, 0, 0);
					dataCoords.push(((col * uScale / width) + uScale * i));
					dataCoords.push(row / width);
				}

			if(!P._GPUPosEffect){
				var GPUattr = ["aPosition", "aData"];
				var GPUPartVec = Picasso.LoadShader("Media/Shaders/GPUParticles/Fullscreen.vert", "vertex");
				var GPUPos  = Picasso.LoadShader("Media/Shaders/GPUParticles/GPUParticlePos.frag", "pixel");
				var GPUVelo = Picasso.LoadShader("Media/Shaders/GPUParticles/GPUParticleVelo.frag", "pixel");
				var PosVert = Picasso.LoadShader("Media/Shaders/GPUParticles/GPUPosReset.vert", "vertex");
				var PosFrag = Picasso.LoadShader("Media/Shaders/GPUParticles/GPUParticleResetPos.frag", "pixel");
				var VeloFrag = Picasso.LoadShader("Media/Shaders/GPUParticles/GPUParticleResetVelo.frag", "pixel");
				
				var GPUVertexDisp = Picasso.LoadShader("Media/Shaders/GPUParticles/GPUParticle.vert", "vertex");
				var GPUFragDisp = Picasso.LoadShader("Media/Shaders/GPUParticles/GPUParticle.frag", "pixel");
				
				P._GPUPosEffect = new Picasso.Effect(GPUPartVec, GPUPos, GPUattr);
				P._GPUVeloEffect = new Picasso.Effect(GPUPartVec, GPUVelo, GPUattr);
				P._GPUDisplayEffect = new Picasso.Effect(GPUVertexDisp, GPUFragDisp, GPUattr);
				P._PosResetEffect = new Picasso.Effect(GPUPartVec, PosFrag, GPUattr);
				P._VeloResetEffect = new Picasso.Effect(GPUPartVec, VeloFrag, GPUattr);
			}
			
			return { 
				Mesh: new Picasso.Mesh([positions, dataCoords], [3, 2]),
				SubSystems: subSystems,
				Width: width * subSystems,
				Height: width,
				Uscale: uScale
			};
		},
		CreateState: function(System, boom){
			var P = Picasso.GPUParticles, posTex, velTex, defaultPos;
			var width = System.Width;
			var height = System.Height;
			
			// create position texture
			{
				var data = [], posReset = [], d = P._d;
				var subWidth = width / System.SubSystems;
				var halfx = subWidth * 0.5 * d;
				var halfy = subWidth * 0.5 * d;
				
					for(var y  = height; y--;)
						for(var x = width; x--;){
							var cox = d * (x % subWidth), coy = d * y;
							//alert(cox + ", " + coy);						
							data.push(cox - halfx, coy - halfy, boom?1:0, 1);
							if(x < height)
								posReset.push(cox - halfx, coy - halfy, 0, 1);
						}

				posTex = P._createVT(width, height, data);
				defaultPos = P._createVT(height, height, posReset);
			}
			
			// create velocity texture
			{
				var data = [];
				// create a texture of positions 0, 0, 0, 1
				for(var i = width * width; i--;)
					for(var j = 4; j--;)
						//data.push(0);
						data.push((Math.random() - 0.5) * (boom ? 0.25 : 0.0));	

				velTex = P._createVT(width, height, data);
			}
			
			return { Positions: posTex, DefaultPositions: defaultPos, Velocities: velTex, Uscale: System.Uscale };
		},
		_createVT: function(w, h, data){
			var gl = $GL;
			
			var tex = new Picasso.PostProcess.FullscreenRT(
				w, h,
				gl.NEAREST,
				gl.NEAREST,
				{Format: gl.RGBA, Type: gl.FLOAT},
				function(gl){
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				}
			);

			gl.bindTexture(gl.TEXTURE_2D, tex.Texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
			data = new Float32Array(data);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				w,
				h,
				0,
				gl.RGBA,
				gl.FLOAT,
				data
			);
			
			//var vt = tex.Texture;
			//vt.RT = tex;
			
			return tex;
		},
		Bind: function(system, texture){
			var P = Picasso.GPUParticles;
			var gl = $GL;
			Picasso.BindMesh(system.Mesh, P._GPUDisplayEffect);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, texture.GL);
			gl.uniform1i(P._GPUDisplayEffect.GetUniLoc("uTexture"), 1);
			gl.uniform1f(P._GPUDisplayEffect.GetUniLoc("uScale"), system.Uscale);
		},
		SetUniforms: function(bulletPositions, bulletVelocities){
			var P = Picasso.GPUParticles;
			var gl = $GL;
			gl.useProgram(P._GPUVeloEffect.ShaderProgram);
			gl.uniform3fv(P._GPUVeloEffect.GetUniLoc("uBulletPositions"), new Float32Array(bulletPositions));
			gl.uniform3fv(P._GPUVeloEffect.GetUniLoc("uBulletVelocities"), new Float32Array(bulletVelocities));
		},
		SetInstanceUniforms: function(state, matrices){
			var P = Picasso.GPUParticles;
			var gl = $GL;
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, state.Positions.Texture);
			gl.uniform1i(P._GPUDisplayEffect.GetUniLoc("uPosition"), 0);
			gl.uniformMatrix4fv(P._GPUDisplayEffect.GetUniLoc("uModel"), gl.TRUE, matrices);
		},
		ResetPosition: function(state){
			var P = Picasso.GPUParticles;
			var gl = $GL;
			var w = state.Positions.width || state.Positions.DisplayWidth;
			var h = state.Positions.height || state.Positions.DisplayHeight;
			gl.viewport(0, 0, w, h);

			var setPosUniforms = function(){
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, state.Positions.Texture);
				gl.uniform1i(P._PosResetEffect.GetUniLoc("uPosition"), 0);
				
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, state.DefaultPositions.Texture);
				gl.uniform1i(P._PosResetEffect.GetUniLoc("uOriginalPos"), 1);
				
				gl.uniform1f(P._PosResetEffect.GetUniLoc("uScale"), state.Uscale);
			};
			
			Picasso.PostProcess.BindRT(state.Positions);
			Picasso.PostProcess.DrawFitScreen(P._PosResetEffect, state.Positions, setPosUniforms);
			Picasso.PostProcess.UnbindRT(state.Positions);
		},
		ResetVelocity: function(state){
			var P = Picasso.GPUParticles;
			var gl = $GL;
			var w = state.Velocities.width || state.Velocities.DisplayWidth;
			var h = state.Velocities.height || state.Velocities.DisplayHeight;
			gl.viewport(0, 0, w, h);
			
			Picasso.PostProcess.BindRT(state.Velocities);
			Picasso.PostProcess.DrawFitScreen(P._VeloResetEffect, state.Velocities, null);
			Picasso.PostProcess.UnbindRT(state.Velocities);
		},
		Update: function(state, matrices){
			var P = Picasso.GPUParticles;
			var gl = $GL;
			var w = state.Positions.width || state.Positions.DisplayWidth;
			var h = state.Positions.height || state.Positions.DisplayHeight;
			gl.viewport(0, 0, w, h);

			var setPosUniforms = function(){
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, state.Positions.Texture);
				gl.uniform1i(P._GPUPosEffect.GetUniLoc("uPosition"), 0);
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, state.Velocities.Texture);
				gl.uniform1i(P._GPUPosEffect.GetUniLoc("uVelocity"), 1);
				
				gl.uniform1f(P._GPUPosEffect.GetUniLoc("uTime"), 0.1);
				gl.uniform1f(P._GPUPosEffect.GetUniLoc("uScale"), state.Uscale);
				
				gl.uniformMatrix4fv(
					P._GPUPosEffect.GetUniLoc("uModel"),
					gl.TRUE, matrices
				);
			};	

			var setVelUniforms = function(){
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, state.Positions.Texture);
				gl.uniform1i(P._GPUVeloEffect.GetUniLoc("uPosition"), 0);
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, state.Velocities.Texture);
				gl.uniform1i(P._GPUVeloEffect.GetUniLoc("uVelocity"), 1);

				gl.uniform1f(P._GPUVeloEffect.GetUniLoc("uTime"), 0.1);
				gl.uniform1f(P._GPUVeloEffect.GetUniLoc("uScale"), state.Uscale);

				gl.uniformMatrix4fv(
					P._GPUVeloEffect.GetUniLoc("uModel"),
					gl.TRUE, matrices
				);
			};
			
			Picasso.PostProcess.BindRT(state.Positions);
			Picasso.PostProcess.DrawFitScreen(P._GPUPosEffect, state.Positions, setPosUniforms);
			Picasso.PostProcess.UnbindRT(state.Positions);
			
			Picasso.PostProcess.BindRT(state.Velocities);
			Picasso.PostProcess.DrawFitScreen(P._GPUVeloEffect, state.Velocities, setVelUniforms);
			Picasso.PostProcess.UnbindRT(state.Velocities);
		},
		Draw: function(system){
			var gl = $GL;
			gl.drawArrays(gl.POINTS, 0, system.Mesh.VertCount);
		}
	};
}