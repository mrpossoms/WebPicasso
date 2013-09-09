precision highp float;

varying highp vec2 vTexCoord;
varying highp vec3 vNormal;
varying lowp vec3 vTangent;
varying mediump mat3 vRotScl;

uniform sampler2D uTexture;
uniform sampler2D uSpecularMap;
uniform sampler2D uNormalMap;
uniform sampler2D uDepthMap;
uniform vec4 uTint;

			float unpack (vec4 colour)
			{
				vec4 bitShifts = vec4(1.0 / (256.0 * 256.0 * 256.0),
											1.0 / (256.0 * 256.0),
											1.0 / 256.0,
											1.0);
				return dot(colour, bitShifts);
			}

void main(void){
	// define light position and calculate the direction
	mediump vec3 lightPos = vec3(1, -1, -2);
	lowp vec3 lightDir = normalize(-lightPos);
	
	lowp vec2 uv = (vTexCoord - vec2(0, 0.5)) * vec2(1, -1) + vec2(0, 0.5);
	lowp vec3 halfVec = normalize(vec3(0, 0, 1) + lightDir);
	
	// purturbe the normal using the normal map
	lowp vec3 biNormal = normalize(cross(vNormal, vTangent));
	lowp mat3 tanSpace = mat3(vTangent, biNormal, vNormal);
	lowp vec3 normal = normalize(tanSpace * (texture2D(uNormalMap, uv) * 2.0 - 1.0).xyz);
	
	lowp vec4 color = texture2D(uTexture, uv);//vec4((vNormal * 0.5) + 0.5, 1);
	lowp vec4 diffuse = vec4(vec3(dot(lightDir, normal)), 1);
	lowp vec4 specular = texture2D(uSpecularMap, uv) * pow(dot(halfVec, normal), 64.0);
	
	lowp float alpha = color.a;
	if(alpha < 0.5) alpha = 0.0;
	
	gl_FragColor = vec4((color.xyz * diffuse.xyz) + specular.xyz, alpha) * uTint;
}