if(typeof(Picasso) != "undefined"){
	Picasso.MeshFactory = {
		// creates a mesh object from a JSON format
		FromJSON: function(data){
			var positions = data.Positions;
			var texcoords = data.UVs;
			var normals = data.Normals;

			var buffer = new Array();
			var sizes = new Array();

			if(positions.length){ buffer.push(positions); sizes.push(3); } 
			if(texcoords.length){ buffer.push(texcoords); sizes.push(2); }
			if(normals.length){ buffer.push(normals); sizes.push(3); }

			return new Picasso.Mesh(buffer, sizes);
		},
		Load: function(url){
			var json = Picasso._syncPOST(url);
			var model = JSON.parse(json);
			return this.FromJSON(model);
		}
	};
}
