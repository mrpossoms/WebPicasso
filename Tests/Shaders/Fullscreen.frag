varying highp vec2 vUV;

uniform sampler2D uTexture;
uniform lowp vec2 uUVScale;

void main(void){
	highp vec4 FragmentColor = texture2D( uTexture, vUV );
	lowp vec2 b = uUVScale / vec2(640, 480);
	const int samples = 12;
	
	for (int i=1; i<samples; i++) {
		FragmentColor += texture2D( uTexture, vUV + vec2(0.0, b.x * float(i)) );
		FragmentColor += texture2D( uTexture, vUV - vec2(0.0, b.y * float(i)) );
	}
	gl_FragColor = FragmentColor / vec4(samples * 2);
	//gl_FragColor = texture2D(uTexture, vUV) * vec4(1, 0, 0, 1);
}
