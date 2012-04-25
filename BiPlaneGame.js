var canvas = null;
var screenSize = $V([640, 400]);
var mouseX = 0;
var mouseY = 0;
var cam = null;
var keyboard = new Keyboard();
var PI = 3.14159;
var player = null;
var isMouseDown = false;
var particles = null;
var greySmoke = null;
var explosion = null;

BiPlaneGame = function(canvasId){
	canvas = document.getElementById(canvasId);
	var planes = new Array();
	var deadPlanes = new Array();
	var sprite = new PicassoSprite(canvasId);
	var bullets = new BulletManager(sprite, planes);
	var rt = new RenderTarget(512, 512);
	particles = new ParticleManager(sprite, 100);
	var countDown = 1000;
	cam = $V([0, 0]);	

	var clouds = LoadTexture("Media/Textures/clouds.png");
	var cloudSheet = new CloudSheet(sprite, clouds);	
	
	var playerTex = LoadTexture("Media/Textures/redBaron.png");
	var health = LoadTexture("Media/Textures/health.png");
	greySmoke = LoadTexture("Media/Textures/greySmoke.png");
	explosion = LoadTexture("Media/Textures/sweetExplosion.png");
	player = new PlayerPlane(sprite, $V([0, 0]), playerTex, health, bullets);
	planes.push(player);
	
	var enemyTex = LoadTexture("Media/Textures/sopwithCamel.png");
	
	for(var i = 0; i < 20; i++){
		var e = new OtherPlane(sprite, $V([640, 400]), enemyTex, bullets);
		e.HP = 0;
		e.IsDead = true;
		deadPlanes.push(e);
		planes.push(e);
	}
	
	
	this.UpdateDraw = function(){
		dc = $V([0,0]);
		if(keyboard.IsKeyDown(87))
			dc = dc.add($V([0,1]));
		if(keyboard.IsKeyDown(83))
			dc = dc.add($V([0,-1]));
		if(keyboard.IsKeyDown(65))
			dc = dc.add($V([1,0]));
		if(keyboard.IsKeyDown(68))
			dc = dc.add($V([-1,0]));
		cam = cam.add(dc.toUnitVector());
		//--------------------------------
		//rt.Bind();
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		//sprite.StartDraw();
		//rt.Bind();
		cloudSheet.Draw(cam);
		
		cam = cam.add($V([(player.Position.e(1) - cam.e(1)) / 10,
									  (player.Position.e(2) - cam.e(2)) / 10]));
		
		bullets.UpdateDraw();
		SpawnPlanes();
		
		for(var pi = 0; pi < planes.length; pi++){
			var plane = planes[pi];
			if(!plane.IsDead){
				plane.Update();
				plane.Draw();
				
				if(plane.IsDead)
					deadPlanes.push(plane);
			}
		}
		
		particles.UpdateDraw();
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
		//rt.Unbind();
		//sprite.StartDraw();
		//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		//sprite.Draw(screenSize.multiply(0.5), screenSize.multiply(0.5), 0, rttTexture, 1);
	}
	
	function SpawnPlanes(){
		if(countDown <= 0){
			if(deadPlanes.length > 0){
				var p = deadPlanes.pop();
				p.IsDead = false;
				p.HP = 10;
				p.Position = Vector.Random(2).toUnitVector();
				p.Position = p.Position.multiply(screenSize.e(1)).add(player.Position);
				countDown = 10000;
			}
		}
		else
			countDown -= 16;
	}
}

function MouseDown(){
	isMouseDown = true;
}

function MouseUp(){
	isMouseDown = false;
}

function Mouse(e){
	var x = 0;
	var y = 0;
	var c = canvas;
	if(e.offsetX == undefined){
		x = e.clientX - c.offsetLeft;
		y = e.clientY - c.offsetTop;
	}
	else{
		x = e.offsetX;
		y = e.offsetY;
	}
	
	mouseX = x;
	mouseY = y;
}

CloudSheet = function(sprite, tex){
	var sr = sprite;
	var texture = tex;
	this.points = [
			$V([0, 0]),
			$V([640, 0]),
			$V([640, 400]),
			$V([0, 400])
		      ];
	this.oldCam = null;

	this.Draw = function(cam){
		if(this.oldCam == null)
			this.oldCam = cam.dup();
		var dc = $V([this.oldCam.e(1) - cam.e(1), this.oldCam.e(2) - cam.e(2)]);
		for(var csi = 0; csi < this.points.length; csi++){
			var p = this.points[csi].add(dc);

			half = screenSize.multiply(0.5);
			
			// keep everything in bounds
			if(p.e(1) > screenSize.e(1) + half.e(1))
				p = $V([-(half.e(1)-1), p.e(2)]);
			if(p.e(1) < -half.e(1))
				p = $V([screenSize.e(1) + half.e(1) - 1, p.e(2)]);
			if(p.e(2) > screenSize.e(2) + half.e(2))
				p = $V([p.e(1), -(half.e(2)-1)]);
			if(p.e(2) < -half.e(2))
				p = $V([p.e(1), screenSize.e(2) + half.e(2)-1]);

			sr.Draw(p, screenSize, 0, texture, 1);
			this.points[csi] = p;
		}
		this.oldCam = cam.dup();
	}
}

PlayerPlane = function(sprite, position, tex, hpTex, bullets){
	this.sr = sprite;
	this.Position = $V([0, 0]);
	this.Angle = 0;
	this.Texture = tex;
	this.HpTex = hpTex;
	this.HP = 100;
	this.fireCoolDown = 0;
	this.bullets = bullets;
	this.IsDead = false;
	
	this.Damage = function(points){
		this.HP -= points;
		particles.SpawnParticle(this.Position, 0, 0, 1, Vector.Random(2).multiply(2), 0, 2, 0, 3000, greySmoke);
	}
	
	this.Update = function(){
		this.Angle = Math.atan2((screenSize.e(2)/2) - mouseY, (screenSize.e(1)/2) - mouseX) + PI;
		var v = $V([Math.cos(this.Angle), Math.sin(this.Angle)]);
		
		if(isMouseDown)
			this.Shoot();
		
		this.Position = this.Position.add(v.multiply(2));
		
		if(this.HP <= 0){
			this.IsDead = true;
			particles.SpawnParticle(this.Position, 0, 0, .25, $V([0,0]), 0, 1, 0, 3000, explosion);
			//for(var psi = 0; psi < 5; psi++)
			//	particles.SpawnParticle(this.Position, 0, 0, 1, Vector.Random(3).multiply(2), 0, 2, 0, 3000, greySmoke);
		}
	}
	
	this.Shoot = function(){
		var v = $V([Math.cos(this.Angle), Math.sin(this.Angle)]);
		if(this.fireCoolDown <= 0){
			this.bullets.Shoot(this, this.Position, v.multiply(6));
			this.fireCoolDown = 100;
		}
		else
			this.fireCoolDown -= 16;
	}
	
	this.Draw = function(){
		//var offset = cam.add();
		//offset = offset.multiply(-1);
		this.sr.Draw(this.Position.add(cam.multiply(-1)).add(screenSize.multiply(.5)), $V([64,64]), -this.Angle + (3 * PI/2), this.Texture, 1);
		this.sr.Draw($V([this.HP * 0.64, 8]), $V([this.HP * 1.28,16]), 0, this.HpTex, 0.75);
	}
}

OtherPlane = function(sprite, position, tex, bullets){
	this.sr = sprite;
	this.Position = $V([0, 0]);
	this.Angle = 0;
	this.TargetAngle = 0;
	this.Texture = tex;
	this.HP = 10;
	this.fireCoolDown = 0;
	this.bullets = bullets;
	this.IsDead = false;
	
	this.Damage = function(points){
		this.HP -= points;
		particles.SpawnParticle(this.Position, 0, 0, 1, Vector.Random(2).multiply(2), 0, 2, 0, 3000, greySmoke);
	}
	
	this.Update = function(){
		this.TargetAngle = -Math.atan2(this.Position.e(1) - player.Position.e(1), this.Position.e(2) - player.Position.e(2)) - PI /2;
		
		if(this.Angle > (2 * PI) - (PI/2) && this.TargetAngle < PI/2){
			this.Angle = this.Angle - (2 * PI);
		}
		else if(this.Angle < (PI/2) && this.TargetAngle > (2 * PI) - (PI/2)){
			this.Angle = this.Angle + (2 * PI);
		}
		this.Angle += (this.TargetAngle - this.Angle) / 50;
		
		if(Math.abs(this.Angle - this.TargetAngle) < PI / 16)
			this.Shoot();
		
		var v = $V([Math.cos(this.Angle), Math.sin(this.Angle)]);
		this.Position = this.Position.add(v.multiply(1));
		
		if(this.HP <= 0){
			this.IsDead = true;
			particles.SpawnParticle(this.Position, 0, .5, 1, $V([0,0]), 0, 1,  0, 1000, explosion);
			//for(var psi = 0; psi < 5; psi++)
			//	particles.SpawnParticle(this.Position, 0, 0, 1, Vector.Random(3).multiply(2), 0, 2, 0, 3000, greySmoke);
		}
	}
	
	this.Shoot = function(){
		var v = $V([Math.cos(this.Angle), Math.sin(this.Angle)]);
		if(this.fireCoolDown <= 0){
			this.bullets.Shoot(this, this.Position, v.multiply(3));
			this.fireCoolDown = 250;
		}
		else
			this.fireCoolDown -= 16;
	}
	
	this.Draw = function(){
		//var offset = cam.add();
		//offset = offset.multiply(-1);
		this.sr.Draw(this.Position.add(cam.multiply(-1)).add(screenSize.multiply(.5)), $V([64,64]), -this.Angle + (3 * PI/2), this.Texture, 1);
	}
}

ParticleManager = function(sprite, count){
	this.sr = sprite;
	this.particles = new Array();
	this.dead = new Array();
	
	for(var dpi = 0; dpi < count; dpi++){
		var p = new Particle();
		this.particles.push(p);
		this.dead.push(p);
	}
	
	this.SpawnParticle = function(pos, ang, scale, alpha, velo, rotVelo, targScale, targAlpha, life, texture){
		if(this.dead.length > 0){
			var p = this.dead.pop();
			p.Reset(pos, ang, scale, alpha, velo, rotVelo, targScale, targAlpha, life, texture);
		}
	}
	
	this.UpdateDraw = function(){
		for(var upi = 0; upi < this.particles.length; upi++){
			var p = this.particles[upi];
			if(p.Lived < p.Life){
				p.Update();
				p.Draw(this.sr);
				
				if(p.Lived >= p.Life){
					this.dead.push(p);
				}
			}
		}
	}
}

Particle = function(){
	this.Pos = $V([0,0]);
	this.Ang = 0;
	this.Scale = 1;
	this.Alpha = 1;
	this.Life = 100;
	
	this.Velo = $V([0, 0]);
	this.AngVelo = 0;
	this.FinalScale = 1;
	this.FinalAlpha = 1;
	this.Lived = 100;
	
	this.Texture = null;
	
	this.Reset = function(pos, ang, scale, alpha, velo, rotVelo, targScale, targAlpha, life, texture){
		this.Pos = pos; this.Ang = ang; this.Scale = scale; this.Alpha = alpha;
		this.Velo = velo; this.AngVelo = rotVelo; this.FinalScale = targScale; this.FinalAlpha = targAlpha; this.Life = life;
		this.Lived = 0;
		this.Texture = texture;
	}
	
	this.Update = function(){
		this.Lived += 16;
		this.Pos = this.Pos.add(this.Velo);
		this.Ang += this.AngVelo;
		
		var ratio = this.Lived / this.Life;
		this.Scale -= ((this.Scale - this.FinalScale) / (Math.abs(this.Scale - this.FinalScale)+1)) * ratio;
		this.Alpha -= ((this.Alpha - this.FinalAlpha) / (Math.abs(this.Alpha - this.FinalAlpha)+1)) * ratio;
	}
	
	this.Draw = function(sprite){
		var w = this.Texture.Image.width;
		var h = this.Texture.Image.height;
		sprite.Draw(this.Pos.add(cam.multiply(-1)).add(screenSize.multiply(.5)), $V([w * this.Scale, h * this.Scale]), this.Ang, this.Texture, this.Alpha);
	}
}

BulletManager = function(sprite, planes){
	this.sr = sprite;
	this.BulletTex = LoadTexture("Media/Textures/tracer.png");
	this.bullets = new Array();
	this.dead = new Array();
	this.planes = planes;
	
	for(var bci = 0; bci < 500; bci++){
		var b = new Bullet(null, $V([0,0]), $V([0,0]));
		this.bullets.push(b);
		this.dead.push(b);
	}
		
	this.Shoot = function(owner, pos, velo){
		if(this.dead.length > 0){
			var b = this.dead.pop();
			b.owner = owner;
			b.position = pos;
			b.velocity = velo;
			b.lived = 0;
		}
	}
	
	this.UpdateDraw = function(){
		for(var bi = 0; bi < this.bullets.length; bi++){
			var b = this.bullets[bi];
			if(b.lived < 3000){
				
				for(var bipi = 0; bipi < this.planes.length; bipi++){
					var p = this.planes[bipi];
					if(!p.IsDead && p != b.owner)
						if(b.position.distanceFrom(p.Position) < 32){
							p.Damage(1);
							b.lived = 3000;
						}
				}
				
				b.Update();
				
				if(b.lived >= 3000)
					this.dead.push(b);
				else
					this.sr.Draw(b.position.add(cam.multiply(-1)).add(screenSize.multiply(.5)), $V([8,8]), 0, this.BulletTex, 0.75);
			}
		}
	}
}

Bullet = function(owner, position, velocity){
	this.owner = owner;
	this.position = position;
	this.velocity = velocity;
	this.lived = 3000;
	
	this.Update = function(){
		this.position = this.position.add(this.velocity);
		this.lived += 16;
	}
}
