varying lowp vec2 vUV;

uniform sampler2D uColor;

void main(void){
	gl_FragColor = texture2D(uColor, vUV);
}