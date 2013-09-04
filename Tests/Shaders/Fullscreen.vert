attribute vec3 aVertexPosition;attribute vec2 aUV;varying lowp vec2 vUV;uniform vec2 uUVScale;void main(void){	gl_Position = vec4(aVertexPosition.xy, 0, 1);	vUV = aUV * uUVScale;}
