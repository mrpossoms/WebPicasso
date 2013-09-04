/*
	Yo sober kirk, I;m fuickgin hammered. So forgive me for any bullshit
	cored. Hoewever, #^@$%(^@$)(%^*@$()%^@$%^$%@^)(*^@$)(%*^$)(%^*@$%^@$
	So hwere goes my coding. Deald with it sincerly your
	brogrammer, druck kirk.
*/
if(typeof(Picasso) != "undefined"){
	Picasso.Camera = {
		_position: $V([0, 0, 0]),
		_look: $V([0, 0, -1]),
		_up: $V([0, 1, 0]),
		_fovy: 90, _near: 1, _far: 100,
		_aspect: 1,
		_stankyView: true,
		_stankyProj: true,
		_proj: Matrix.I(4),
		_view: Matrix.I(4),
		Init: function(fov, aspect, near, far, pos, look){
			var t = Picasso.Camera;
			t._near = near;
			t._far = far;
			t._aspect = aspect;
			t._stanky = true;
			t._position = pos;
			t._look = look;
		},
		SetPosition: function(v){
			var t = Picasso.Camera;
			t._position = v;
			t._stankyView = true;
		},
		SetLook: function(v){
			var t = Picasso.Camera;
			t._look = v;
			t._stankyView = true;
		},
		GetProjection: function(){
			var t = Picasso.Camera;
			if(t._stankyProj){
				t._proj = makePerspective(t._fovy, t._aspect, t._near, t._far);
				t._stankyProj = false;
			}
			return t._proj;
		},
		GetView: function(){
			var t = Picasso.Camera;
			if(t._stankyView){
				t._up = t.GetUp();
				t._view = makeLookAt(t._position, t._look, t._up);
				t._stankyView = false;
			}
			return  t._view;
		},
		GetUp: function(){
			var t = Picasso.Camera;
			if(t._stankyView){
				var viewDir = t._look.subtract(t._position);
				t._up = viewDir.cross($V([-1,0,0])).toUnitVector();
			}
			return t._up;
		}
	};
}
