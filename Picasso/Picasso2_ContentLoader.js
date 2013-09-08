if(typeof(Picasso) != "undefined"){
	Picasso.ContentLoader = {
		Textures: {},
		_loaded: 0,
		LoadTextures: function(images, textureParams, callback){
			this._loaded = images.length;

			var getName = function(str){
				var name = str.split('/');
				return name[name.length-1];
			}

			for(var i = images.length; i--;){
				var img = images[i];
				var name = getName(img.Url);

				Picasso.LoadTexture(
					img.Url,
					img.Mag,
					img.Min,
					textureParams,
					function(image){
						var name = getName(image.src);
						$P.ContentLoader.Textures[name] = image.GL;
						--Picasso.ContentLoader._loaded;
						if(!Picasso.ContentLoader._loaded){
							callback();
						}
					}
				);
			}
		}
	};
}
