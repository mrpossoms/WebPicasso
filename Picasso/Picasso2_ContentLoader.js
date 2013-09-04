if(typeof(Picasso) != "undefined"){
	Picasso.ContentLoader = {
		Textures: {},
		_loaded: 0,
		LoadTextures: function(images, callback){
			this._loaded = images.length;

			for(var i = 0; i--;){
				var img = images[i];
				var name = img.Url.split('/'); name = name[name.length-1];

				Picasso.LoadTexture(
					img.Url,
					img.Mag.
					img.Min,
					function(image){
						Textures[name] = image;
						--Picasso.ContentLoader._loaded;
						if(Picasso.ContentLoader._loaded){
							callback();
						}
					}
				);
			}
		}
	};
}
