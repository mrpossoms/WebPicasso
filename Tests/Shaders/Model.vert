attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aTangent;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;
varying vec3 vTangent;
varying vec3 vNormal;
varying mat3 vRotScl;

uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;

void main(void){
	mat3 rotScl = vRotScl = mat3(uModel[0].xyz, uModel[1].xyz, uModel[2].xyz); 
	vec4 worldPos = uModel * vec4(aPosition.xyz, 1.0);
	vec4 viewPos = uView * worldPos;
	vec4 screenPos = uProj * viewPos;
	
	vNormal = normalize(rotScl * aNormal);
	vTangent = normalize(rotScl *aTangent);
	vTexCoord = aTexCoord;
	
	gl_Position = screenPos;
}