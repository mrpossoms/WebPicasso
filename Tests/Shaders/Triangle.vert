attribute vec3 aVertexPosition;
attribute vec3 aColor;

varying lowp vec3 vColor;

void main(void){
	gl_Position = vec4(aVertexPosition.xy, 0, 1);
	vColor = aColor;
}
