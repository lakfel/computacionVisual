/*
 WebGL Path Tracing (http://madebyevan.com/webgl-path-tracing/)
 License: MIT License (see below)

 Copyright (c) 2010 Evan Wallace

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

////////////////////////////////////////////////////////////////////////////////
// shader strings
////////////////////////////////////////////////////////////////////////////////

// vertex shader for drawing a textured quad

var renderVertexSource =
' attribute vec3 vertex;' +
' varying vec2 texCoord;' +
' void main() {' +
'   texCoord = vertex.xy * 0.5 + 0.5;' +
'   gl_Position = vec4(vertex, 1.0);' +
' }';

// fragment shader for drawing a textured quad
var renderFragmentSource =
' precision highp float;' +
' varying vec2 texCoord;' +
' uniform sampler2D texture;' +
' void main() {' +
'   gl_FragColor = texture2D(texture, texCoord);' +
' }';

// vertex shader for drawing a line
var lineVertexSource =
' attribute vec3 vertex;' +
' uniform vec3 cubeMin;' +
' uniform vec3 cubeMax;' +
' uniform mat4 modelviewProjection;' +
' void main() {' +
'   gl_Position = modelviewProjection * vec4(mix(cubeMin, cubeMax, vertex), 1.0);' +
' }';

// fragment shader for drawing a line
var lineFragmentSource =
' precision highp float;' +
' uniform vec3 uColor;' +
' void main() {' +
'   gl_FragColor = vec4(uColor, 1.0);' +
' }';

// constants for the shaders
var bounces = '4';
var epsilon = '0.0001';
var infinity = '10000.0';
var lightSize = 0.1;
var lightVal = 0.5;

// vertex shader, interpolate ray per-pixel
var tracerVertexSource =
' attribute vec3 vertex;' +
' uniform vec3 eye, ray00, ray01, ray10, ray11;' +
' varying vec3 initialRay;' +
' void main() {' +
'   vec2 percent = vertex.xy * 0.5 + 0.5;' +
'   initialRay = mix(mix(ray00, ray01, percent.y), mix(ray10, ray11, percent.y), percent.x);' +
'   gl_Position = vec4(vertex, 1.0);' +
' }';

// start of fragment shader
var tracerFragmentSourceHeader =
' precision highp float;' +
' uniform vec3 eye;' +
' varying vec3 initialRay;' +
' uniform float textureWeight;' +
' uniform float timeSinceStart;' +
' uniform sampler2D texture;' +
' uniform float glossiness;' +
' vec3 roomCubeMin = vec3(-1.0, -1.0, -1.0);' +
' vec3 roomCubeMax = vec3(1.0, 1.0, 1.0);' +
' uniform sampler2D uSampler;';

// compute the near and far intersections of the cube (stored in the x and y components) using the slab method
// no intersection means vec.x > vec.y (really tNear > tFar)
var intersectCubeSource =
' vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {' +
'   vec3 tMin = (cubeMin - origin) / ray;' +
'   vec3 tMax = (cubeMax - origin) / ray;' +
'   vec3 t1 = min(tMin, tMax);' +
'   vec3 t2 = max(tMin, tMax);' +
'   float tNear = max(max(t1.x, t1.y), t1.z);' +
'   float tFar = min(min(t2.x, t2.y), t2.z);' +
'   return vec2(tNear, tFar);' +
' }';

// given that hit is a point on the cube, what is the surface normal?
// TODO: do this with fewer branches
var normalForCubeSource =
' vec3 normalForCube(vec3 hit, vec3 cubeMin, vec3 cubeMax)' +
' {' +
'   if(hit.x < cubeMin.x + ' + epsilon + ') return vec3(-1.0, 0.0, 0.0);' +
'   else if(hit.x > cubeMax.x - ' + epsilon + ') return vec3(1.0, 0.0, 0.0);' +
'   else if(hit.y < cubeMin.y + ' + epsilon + ') return vec3(0.0, -1.0, 0.0);' +
'   else if(hit.y > cubeMax.y - ' + epsilon + ') return vec3(0.0, 1.0, 0.0);' +
'   else if(hit.z < cubeMin.z + ' + epsilon + ') return vec3(0.0, 0.0, -1.0);' +
'   else return vec3(0.0, 0.0, 1.0);' +
' }';

// compute the near intersection of a sphere
// no intersection returns a value of +infinity
var intersectCylinderSource =
' 	float intersectCylinder(vec3 origin, vec3 ray, vec3 CylinderCenter, float CylinderRadius, float CylinderHeight) {' +
'   vec3 toCylinder = origin - CylinderCenter;' +
'   float a = dot(ray, ray) - ray.y* ray.y;' +
'   float b = 2.0 * (dot(toCylinder, ray) - toCylinder.y * ray.y);' +
'   float c = dot(toCylinder, toCylinder) - CylinderRadius*CylinderRadius - toCylinder.y * toCylinder.y;' +
'   float discriminant = b*b - 4.0*a*c;' +
'   if(discriminant > 0.0) {' +
'     	float t1 = (-b - sqrt(discriminant)) / (2.0 * a);' +
'     	float t2 = (-b + sqrt(discriminant)) / (2.0 * a);' +
'     	float th1 = (CylinderCenter.y + CylinderHeight / 2.0 - origin.y) / ray.y;' +
'     	float th2 = (CylinderCenter.y - CylinderHeight / 2.0 - origin.y) / ray.y;' +
'		vec2 vth1 = origin.xz + ray.xz*th1 - CylinderCenter.xz;' +
'		vec2 vth2 = origin.xz + ray.xz*th2 - CylinderCenter.xz;' +
//'		float xth1 = origin.x + ray.x * th1;' +
//'		float zth1 = origin.z + ray.z * th1;' +
//'		float xth2 = origin.x + ray.x * th2;' +
//'		float zth2 = origin.z + ray.z * th2;' +
'		float h1 = origin.y + ray.y *t1;' +
'		float h2 = origin.y + ray.y *t2;' +
'		if(h1 >= (CylinderCenter.y - CylinderHeight / 2.0) && h1 <= (CylinderCenter.y + CylinderHeight / 2.0)){' +
'			return t1;' +
'		}' +
'		else if(h2 >= (CylinderCenter.y - CylinderHeight/ 2.0) && h2 <= (CylinderCenter.y + CylinderHeight/ 2.0)){' +
'			if( dot(vth1,vth1) < (CylinderRadius*CylinderRadius)){'+
'				return th1;' +
'			}' +
'			else {' +
'				return th2;' +
'			}' +
'		}' +
'		else if(dot(vth1,vth1) < (CylinderRadius*CylinderRadius) && dot(vth2,vth2) < (CylinderRadius*CylinderRadius)){' +
'			return min(th1, th2);' + 
'		}' +
'   }' +
'   return ' + infinity + ';' +
' }';



// given that hit is a point on the sphere, what is the surface normal?
var normalForCylinderSource =
' vec3 normalForCylinder(vec3 hit, vec3 CylinderCenter, float CylinRadius) {' +
'	vec2 hitNormal = hit.xz - CylinderCenter.xz;' + 
'	if(dot(hitNormal,hitNormal) == (CylinRadius * CylinRadius)){' +
'		return vec3(hitNormal.x, 0.0 , hitNormal.y)/CylinRadius;' +
'	}' +
'	else if(hit.y > CylinderCenter.y){' +
'		return vec3 (0.0, 1.0 , 0.0);' +
'	}' +
'	else {' +
'		return vec3 (0.0, -1.0 , 0.0);' +
'	}' +
' }';

// compute the near intersection of a sphere
// no intersection returns a value of +infinity
var intersectSphereSource =
' float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {' +
'   vec3 toSphere = origin - sphereCenter;' +
'   float a = dot(ray, ray);' +
'   float b = 2.0 * dot(toSphere, ray);' +
'   float c = dot(toSphere, toSphere) - sphereRadius*sphereRadius;' +
'   float discriminant = b*b - 4.0*a*c;' +
'   if(discriminant > 0.0) {' +
'     float t = (-b - sqrt(discriminant)) / (2.0 * a);' +
'     if(t > 0.0) return t;' +
'   }' +
'   return ' + infinity + ';' +
' }';

// given that hit is a point on the sphere, what is the surface normal?
var normalForSphereSource =
' vec3 normalForSphere(vec3 hit, vec3 sphereCenter, float sphereRadius) {' +
'   return (hit - sphereCenter) / sphereRadius;' +
' }';

// use the fragment position for randomness
var randomSource =
' float random(vec3 scale, float seed) {' +
'   return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);' +
' }';

// random cosine-weighted distributed vector
// from http://www.rorydriscoll.com/2009/01/07/better-sampling/
var cosineWeightedDirectionSource =
' vec3 cosineWeightedDirection(float seed, vec3 normal) {' +
'   float u = random(vec3(12.9898, 78.233, 151.7182), seed);' +
'   float v = random(vec3(63.7264, 10.873, 623.6736), seed);' +
'   float r = sqrt(u);' +
'   float angle = 6.283185307179586 * v;' +
    // compute basis from normal
'   vec3 sdir, tdir;' +
'   if (abs(normal.x)<.5) {' +
'     sdir = cross(normal, vec3(1,0,0));' +
'   } else {' +
'     sdir = cross(normal, vec3(0,1,0));' +
'   }' +
'   tdir = cross(normal, sdir);' +
'   return r*cos(angle)*sdir + r*sin(angle)*tdir + sqrt(1.-u)*normal;' +
' }';

// random normalized vector
var uniformlyRandomDirectionSource =
' vec3 uniformlyRandomDirection(float seed) {' +
'   float u = random(vec3(12.9898, 78.233, 151.7182), seed);' +
'   float v = random(vec3(63.7264, 10.873, 623.6736), seed);' +
'   float z = 1.0 - 2.0 * u;' +
'   float r = sqrt(1.0 - z * z);' +
'   float angle = 6.283185307179586 * v;' +
'   return vec3(r * cos(angle), r * sin(angle), z);' +
' }';

// random vector in the unit sphere
// note: this is probably not statistically uniform, saw raising to 1/3 power somewhere but that looks wrong?
var uniformlyRandomVectorSource =
' vec3 uniformlyRandomVector(float seed) {' +
'   return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));' +
' }';

// compute specular lighting contribution
var specularReflection =
' vec3 reflectedLight = normalize(reflect(light - hit, normal));' +
' specularHighlight = max(0.0, dot(reflectedLight, normalize(hit - origin)));';

// update ray using normal and bounce according to a diffuse reflection
var newDiffuseRay =
' ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);';

// update ray using normal according to a specular reflection
var newReflectiveRay =
' ray = reflect(ray, normal);' +
  specularReflection +
' specularHighlight = 2.0 * pow(specularHighlight, 20.0);';

// update ray using normal and bounce according to a glossy reflection
var newGlossyRay =
' ray = normalize(reflect(ray, normal)) + uniformlyRandomVector(timeSinceStart + float(bounce)) * glossiness;' +
  specularReflection +
' specularHighlight = pow(specularHighlight, 3.0);';

var yellowBlueCornellBox =
' if(hit.x < -0.9999) surfaceColor = vec3(0.1, 0.5, 1.0);' + // blue
' else if(hit.x > 0.9999) surfaceColor = vec3(1.0, 0.9, 0.1);'; // yellow

var redGreenCornellBox =
' if(hit.x < -0.9999) surfaceColor = vec3(1.0, 0.3, 0.1);' + // red
' else if(hit.x > 0.9999) surfaceColor = vec3(0.3, 1.0, 0.1);'; // green

function makeShadow(objects) {
   return '' +
' float shadow(vec3 origin, vec3 ray) {' +
    concat(objects, function(o){ return o.getShadowTestCode(); }) +
'   return 1.0;' +
' }';
}

function makeCalculateColor(objects) {
  return '' +
' vec3 calculateColor(vec3 origin, vec3 ray, vec3 light, vec3 colorMask, float size, vec3 lightDirection, float ies[91]) {' +
//'   vec3 colorMask = vec3(1.0);' +
'   vec3 accumulatedColor = vec3(0.0);' +
  
    // main raytracing loop
//'	for(int i = 0; i < lights.length(); i++){' +
//'		vec3 light = lights[i];' +
'   	for(int bounce = 0; bounce < ' + bounces + '; bounce++) {' +
		// compute the intersection with everything
'     	vec2 tRoom = intersectCube(origin, ray, roomCubeMin, roomCubeMax);' +
		concat(objects, function(o){ return o.getIntersectCode(); }) +

		// find the closest intersection
'     	float t = ' + infinity + ';' +
'     	if(tRoom.x < tRoom.y) t = tRoom.y;' +
		concat(objects, function(o){ return o.getMinimumIntersectCode(); }) +

		// info about hit
'     	vec3 hit = origin + ray * t;' +
'     	vec3 surfaceColor = vec3(0.75);' +
'     	float specularHighlight = 0.1;' +
'     	vec3 normal;' +

		// calculate the normal (and change wall color)
'     	if(t == tRoom.y) {' +
'       	normal = -normalForCube(hit, roomCubeMin, roomCubeMax);' +
			[yellowBlueCornellBox, redGreenCornellBox][environment] +
			newDiffuseRay +
'     	} else if(t == ' + infinity + ') {' +
'       	break;' +
'     	} else {' +
'       	if(false) ;' + // hack to discard the first 'else' in 'else if'
			concat(objects, function(o){ return o.getNormalCalculationCode(); }) +
			[newDiffuseRay, newReflectiveRay, newGlossyRay][material] +
'     	}' 	+

		// compute diffuse lighting contribution
'     	vec3 toLight = light - hit;' +
'     	vec3 toLight2 =  hit - light;' +
'     	float diffuse = 3.0* max(0.0, dot(normalize(toLight), normal)) / (dot(toLight,toLight)/ size );' +
'		float diffuse2 = 0.0;' +
'		float cosinePat = dot(normalize(lightDirection), normalize(toLight2));' +
'		float anglePat = acos(cosinePat)* '+ (180/Math.PI).toFixed(1) + ';' +  
'       float fpattern = floor(acos(cosinePat)* '+ (180/Math.PI).toFixed(1) + '); ' +
'       int pattern = int(fpattern); ' +
'       if(pattern >= 0 && pattern <= 90) {'+
'       for( int i = 0; i <= 90; i++) {if(i == pattern) {diffuse  *= mix(ies[i],ies[i+1], anglePat - fpattern ) ;}}} else {diffuse = 0.0;} ' +
//'       for( int i = 0; i <= 90; i++) {if(i == pattern) {diffuse  *= ies[i] ;}}} else {diffuse = 0.0;} ' +
//'       diffuse  *= texture2D(uSampler, vec2(anglePat, 0.0)).r;} else {diffuse = 0.0;} ' +
		// trace a shadow ray to the light
'     	float shadowIntensity = shadow(hit + normal * ' + epsilon + ', toLight);' +
/*'     	shadowIntensity += shadow(hit + vec3(0.008,0.0,0.0) + normal * ' + epsilon + ', toLight);' +
'     	shadowIntensity += shadow(hit + vec3(0.0,0.008,0.0) + normal * ' + epsilon + ', toLight);' +
'     	shadowIntensity += shadow(hit + vec3(0.0,0.0,0.008) + normal * ' + epsilon + ', toLight);' +

'     	shadowIntensity += shadow(hit + vec3(-0.008,0.0,0.0) + normal * ' + epsilon + ', toLight);' +
'     	shadowIntensity += shadow(hit + vec3(0.0,-0.008,0.0) + normal * ' + epsilon + ', toLight);' +
'     	shadowIntensity += shadow(hit + vec3(0.0,0.0,-0.008) + normal * ' + epsilon + ', toLight);' +

'     	shadowIntensity /= 7.0;' +
*/

		// do light bounce
'     	colorMask *= surfaceColor;' +
'     	accumulatedColor += colorMask * ( diffuse * shadowIntensity);' +
'     	accumulatedColor += colorMask * specularHighlight * shadowIntensity;' +

		// calculate next origin
'     	origin = hit;' +
'     	origin = hit;' +
'   	}' +
//'   }' +

'   return accumulatedColor;' +
' }';
}

function makeMain(lights) {
	var str = '';	
  for(var i = 0; i < lights.length; i++)
	  str += lights[i].getPushingCode(i);
  return '' +
' void main() {' +
//'   vec3 newLight = light + uniformlyRandomVector(timeSinceStart + 5.0) * ' + lightSize + ';' +
'	vec3 resultLight = vec3(0.0);' +
//'   vec3 newLight = light + uniformlyRandomVector(timeSinceStart + 5.0) * ' + lightSize + ';' +
	str + 
'	resultLight = resultLight/ ' + lights.length.toFixed(2) + ';' +
'   vec3 texture = texture2D(texture, gl_FragCoord.xy / 512.0).rgb;' +
'   gl_FragColor = vec4(mix(resultLight, texture, textureWeight), 1.0);' +
' }';
}

function makeTracerFragmentSource(objects, ligths) {
  return tracerFragmentSourceHeader +
  concat(objects, function(o){ return o.getGlobalCode(); }) +
  concat(lights, function(o){ return o.getGlobalCode(); }) +
  intersectCubeSource +
  normalForCubeSource +
  intersectCylinderSource +
  normalForCylinderSource + 
  intersectSphereSource +
  normalForSphereSource +
  randomSource +
  cosineWeightedDirectionSource +
  uniformlyRandomDirectionSource +
  uniformlyRandomVectorSource +
  makeShadow(objects) +
  makeCalculateColor(objects) +
  makeMain(ligths);
}

////////////////////////////////////////////////////////////////////////////////
// utility functions
////////////////////////////////////////////////////////////////////////////////

function getEyeRay(matrix, x, y) {
  return matrix.multiply(Vector.create([x, y, 0, 1])).divideByW().ensure3().subtract(eye);
}

function setUniforms(program, uniforms) {

  for(var name in uniforms) {
    var value = uniforms[name];
    var location = gl.getUniformLocation(program, name);
    if(location == null) continue;
	if(name.includes("texture") && name.includes("light"))
	{
		location = gl.getUniformLocation(program, "uSampler");
		gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureLight1);
        gl.uniform1i(location, 0);
	}
    else if(value instanceof Vector && value.elements.length == 3) {
      gl.uniform3fv(location, new Float32Array([value.elements[0], value.elements[1], value.elements[2]]));
    } else if(value instanceof Matrix) {
      gl.uniformMatrix4fv(location, false, new Float32Array(value.flatten()));
    } 
	else if(value instanceof Vector)
	{
		gl.uniform1fv(location, new Float32Array(value.elements));	
	}
	else
	{
      gl.uniform1f(location, value);
    }
  }
}

function concat(objects, func) {
  var text = '';
  for(var i = 0; i < objects.length; i++) {
    text += func(objects[i]);
  }
  return text;
}

Vector.prototype.ensure3 = function() {
  return Vector.create([this.elements[0], this.elements[1], this.elements[2]]);
};

Vector.prototype.ensure4 = function(w) {
  return Vector.create([this.elements[0], this.elements[1], this.elements[2], w]);
};

Vector.prototype.divideByW = function() {
  var w = this.elements[this.elements.length - 1];
  var newElements = [];
  for(var i = 0; i < this.elements.length; i++) {
    newElements.push(this.elements[i] / w);
  }
  return Vector.create(newElements);
};

Vector.prototype.componentDivide = function(vector) {
  if(this.elements.length != vector.elements.length) {
    return null;
  }
  var newElements = [];
  for(var i = 0; i < this.elements.length; i++) {
    newElements.push(this.elements[i] / vector.elements[i]);
  }
  return Vector.create(newElements);
};

Vector.min = function(a, b) {
  if(a.length != b.length) {
    return null;
  }
  var newElements = [];
  for(var i = 0; i < a.elements.length; i++) {
    newElements.push(Math.min(a.elements[i], b.elements[i]));
  }
  return Vector.create(newElements);
};

Vector.max = function(a, b) {
  if(a.length != b.length) {
    return null;
  }
  var newElements = [];
  for(var i = 0; i < a.elements.length; i++) {
    newElements.push(Math.max(a.elements[i], b.elements[i]));
  }
  return Vector.create(newElements);
};

Vector.prototype.minComponent = function() {
  var value = Number.MAX_VALUE;
  for(var i = 0; i < this.elements.length; i++) {
    value = Math.min(value, this.elements[i]);
  }
  return value;
};

Vector.prototype.maxComponent = function() {
  var value = -Number.MAX_VALUE;
  for(var i = 0; i < this.elements.length; i++) {
    value = Math.max(value, this.elements[i]);
  }
  return value;
};

function compileSource(source, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw 'compile error: ' + gl.getShaderInfoLog(shader);
  }
  return shader;
}

function compileShader(vertexSource, fragmentSource) {
  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, compileSource(vertexSource, gl.VERTEX_SHADER));
  gl.attachShader(shaderProgram, compileSource(fragmentSource, gl.FRAGMENT_SHADER));
  gl.linkProgram(shaderProgram);
  if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw 'link error: ' + gl.getProgramInfoLog(shaderProgram);
  }
  return shaderProgram;
}

////////////////////////////////////////////////////////////////////////////////
// class Sphere
////////////////////////////////////////////////////////////////////////////////

function Sphere(center, radius, id) {
  this.center = center;
  this.radius = radius;
  this.centerStr = 'sphereCenter' + id;
  this.radiusStr = 'sphereRadius' + id;
  this.intersectStr = 'tSphere' + id;
  this.temporaryTranslation = Vector.create([0, 0, 0]);
  this.xRotation = 0;
  this.yRotation = 0;
  this.zRotation = 0;
}

Sphere.prototype.getGlobalCode = function() {
  return '' +
' uniform vec3 ' + this.centerStr + ';' +
' uniform float ' + this.radiusStr + ';';
};

Sphere.prototype.getIntersectCode = function() {
  return '' +
' float ' + this.intersectStr + ' = intersectSphere(origin, ray, ' + this.centerStr + ', ' + this.radiusStr + ');';
};

Sphere.prototype.getShadowTestCode = function() {
  return '' +
  this.getIntersectCode() + 
' if(' + this.intersectStr + ' < 1.0) return 0.0;';
};

Sphere.prototype.getMinimumIntersectCode = function() {
  return '' +
' if(' + this.intersectStr + ' < t) t = ' + this.intersectStr + ';';
};

Sphere.prototype.getNormalCalculationCode = function() {
  return '' +
' else if(t == ' + this.intersectStr + ') normal = normalForSphere(hit, ' + this.centerStr + ', ' + this.radiusStr + ');';
};

Sphere.prototype.setUniforms = function(renderer) {
  renderer.uniforms[this.centerStr] = this.center.add(this.temporaryTranslation);
  renderer.uniforms[this.radiusStr] = this.radius;
};

Sphere.prototype.temporaryTranslate = function(translation) {
  this.temporaryTranslation = translation;
};

Sphere.prototype.translate = function(translation) {
  this.center = this.center.add(translation);
};

Sphere.prototype.getMinCorner = function() {
  return this.center.add(this.temporaryTranslation).subtract(Vector.create([this.radius, this.radius, this.radius]));
};

Sphere.prototype.getMaxCorner = function() {
  return this.center.add(this.temporaryTranslation).add(Vector.create([this.radius, this.radius, this.radius]));
};

Sphere.prototype.intersect = function(origin, ray) {
  return Sphere.intersect(origin, ray, this.center.add(this.temporaryTranslation), this.radius);
};

Sphere.intersect = function(origin, ray, center, radius) {
  var toSphere = origin.subtract(center);
  var a = ray.dot(ray);
  var b = 2*toSphere.dot(ray);
  var c = toSphere.dot(toSphere) - radius*radius;
  var discriminant = b*b - 4*a*c;
  if(discriminant > 0) {
    var t = (-b - Math.sqrt(discriminant)) / (2*a);
    if(t > 0) {
      return t;
    }
  }
  return Number.MAX_VALUE;
};

////////////////////////////////////////////////////////////////////////////////
// class Cylinder
////////////////////////////////////////////////////////////////////////////////

function Cylinder(center, radius, height, id) {
  this.center = center;
  this.radius = radius;
  this.height = height;
  this.centerStr = 'cylinderCenter' + id;
  this.radiusStr = 'cylinderRadius' + id;
  this.intersectStr = 'tCylinder' + id;
  this.heightStr = 'cylinderHeight' + id;
  this.temporaryTranslation = Vector.create([0, 0, 0]);
  this.xRotation = 0;
  this.yRotation = 0;
  this.zRotation = 0;
}

Cylinder.prototype.getGlobalCode = function() {
  return '' +
' uniform vec3 ' + this.centerStr + ';' +
' uniform float ' + this.radiusStr + ';'+
' uniform float ' + this.heightStr + ';';
};

Cylinder.prototype.getIntersectCode = function() {
  return '' +
' float ' + this.intersectStr + ' = intersectCylinder(origin, ray, ' + this.centerStr + ', ' + this.radiusStr + ', ' + this.heightStr +');';
};

Cylinder.prototype.getShadowTestCode = function() {
  return '' +
  this.getIntersectCode() + 
  'vec3 temporalHit = origin + ray * ' + this.intersectStr + ';' +
' if(temporalHit.y  < ' + this.centerStr + '.y + ' + this.heightStr + '/ 2.0 && temporalHit.y  > ' + this.centerStr + '.y - ' + this.heightStr + '/ 2.0 && ' + this.intersectStr + ' <  2.0) return 0.0;';
};

Cylinder.prototype.getMinimumIntersectCode = function() {
  return '' +
' if(' + this.intersectStr + ' < t ) t = ' + this.intersectStr + ';';
};

Cylinder.prototype.getNormalCalculationCode = function() {
  return '' +
' else if(t == ' + this.intersectStr + ') normal = normalForCylinder(hit, ' + this.centerStr + ', ' + this.radiusStr + ');';
};

Cylinder.prototype.setUniforms = function(renderer) {
  renderer.uniforms[this.centerStr] = this.center.add(this.temporaryTranslation);
  renderer.uniforms[this.radiusStr] = this.radius;
  renderer.uniforms[this.heightStr] = this.height;
};

Cylinder.prototype.temporaryTranslate = function(translation) {
  this.temporaryTranslation = translation;
};

Cylinder.prototype.translate = function(translation) {
  this.center = this.center.add(translation);
};

Cylinder.prototype.getMinCorner = function() {
  return this.center.add(this.temporaryTranslation).subtract(Vector.create([this.radius, this.height/2, this.radius]));
};

Cylinder.prototype.getMaxCorner = function() {
  return this.center.add(this.temporaryTranslation).add(Vector.create([this.radius, this.height/2, this.radius]));
};

Cylinder.prototype.intersect = function(origin, ray) {
  return Cylinder.intersect(origin, ray, this.center.add(this.temporaryTranslation), this.radius, this.height);
};

Cylinder.intersect = function(origin, ray, CylinderCenter, CylinderRadius, CylinderHeight) {
   var toCylinder = origin.subtract(CylinderCenter);
   var a = ray.dot(ray) - ray.e(2)* ray.e(2);
   var b = 2.0 * (toCylinder.dot(ray) - toCylinder.e(2)* ray.e(2));
   var c = toCylinder.dot(toCylinder) - CylinderRadius*CylinderRadius - toCylinder.e(2)* toCylinder.e(2);
   var discriminant = b*b - 4.0*a*c;
   if(discriminant > 0.0) {
     	var t1 = (-b - Math.sqrt(discriminant)) / (2.0 * a);
     	var t2 = (-b + Math.sqrt(discriminant)) / (2.0 * a);
     	var th1 = (CylinderCenter.e(1)- CylinderHeight / 2 - origin.e(1)) / ray.e(1);
     	var th2 = (CylinderCenter.e(1)- CylinderHeight / 2 - origin.e(1)) / ray.e(1);
		var tempo;
		var originXZ = new Vector();
		tempo = [origin.e(1),origin.e(3)];
		originXZ.setElements(tempo);
		var rayXZt1 = new Vector();
		tempo = [ray.e(1)*th1,ray.e(3)*th1];
		rayXZt1.setElements(tempo);
		var rayXZt2 = new Vector();
		tempo = [ray.e(1)*th2,ray.e(3)*th2];
		rayXZt2.setElements(tempo);
		var cylXZ = new Vector;
		tempo = [CylinderCenter.e(1),CylinderCenter.e(3)];
		cylXZ.setElements(tempo);
		var vth1 = (originXZ.add(rayXZt1)).subtract(cylXZ);
		var vth2 = (originXZ.add(rayXZt2)).subtract(cylXZ);
		//'		float xth1 = origin.x + ray.x * th1;
//'		float zth1 = origin.z + ray.z * th1;
//'		float xth2 = origin.x + ray.x * th2;
//'		float zth2 = origin.z + ray.z * th2;
		var h1 = origin.e(2) + ray.e(2) *t1;
		var h2 = origin.e(2) + ray.e(2) *t2;
		if(h1 >= CylinderCenter.e(2) - CylinderHeight/2 && h1 <= CylinderCenter.e(2) + CylinderHeight/2){
			return t1;
		}
		else if(h2 >= CylinderCenter.e(2) - CylinderHeight/2 && h2 <= CylinderCenter.e(2) + CylinderHeight/2){
			if( vth1.dot(vth1) < CylinderRadius*CylinderRadius){
				return th1;
			}
			else {
				return th2;
			}
		}
		else if(vth1.dot(vth1) < CylinderRadius*CylinderRadius && vth2.dot(vth2) < CylinderRadius*CylinderRadius){
			return min(th1, th2); 
		}
   }
   return Number.MAX_VALUE;
 };


////////////////////////////////////////////////////////////////////////////////
// class Cube
////////////////////////////////////////////////////////////////////////////////

function Cube(minCorner, maxCorner, id) {
  this.minCorner = minCorner;
  this.maxCorner = maxCorner;
  this.minStr = 'cubeMin' + id;
  this.maxStr = 'cubeMax' + id;
  this.intersectStr = 'tCube' + id;
  this.temporaryTranslation = Vector.create([0, 0, 0]);
  this.xRotation = 0;
  this.yRotation = 0;
  this.zRotation = 0;
}

Cube.prototype.getGlobalCode = function() {
  return '' +
' uniform vec3 ' + this.minStr + ';' +
' uniform vec3 ' + this.maxStr + ';';
};

Cube.prototype.getIntersectCode = function() {
  return '' +
' vec2 ' + this.intersectStr + ' = intersectCube(origin, ray, ' + this.minStr + ', ' + this.maxStr + ');';
};

Cube.prototype.getShadowTestCode = function() {
  return '' +
  this.getIntersectCode() + 
' if(' + this.intersectStr + '.x > 0.0 && ' + this.intersectStr + '.x < 1.0 && ' + this.intersectStr + '.x < ' + this.intersectStr + '.y) return 0.0;';
};

Cube.prototype.getMinimumIntersectCode = function() {
  return '' +
' if(' + this.intersectStr + '.x > 0.0 && ' + this.intersectStr + '.x < ' + this.intersectStr + '.y && ' + this.intersectStr + '.x < t) t = ' + this.intersectStr + '.x;';
};

Cube.prototype.getNormalCalculationCode = function() {
  return '' +
  // have to compare intersectStr.x < intersectStr.y otherwise two coplanar
  // cubes will look wrong (one cube will "steal" the hit from the other)
' else if(t == ' + this.intersectStr + '.x && ' + this.intersectStr + '.x < ' + this.intersectStr + '.y) normal = normalForCube(hit, ' + this.minStr + ', ' + this.maxStr + ');';
};

Cube.prototype.setUniforms = function(renderer) {
  renderer.uniforms[this.minStr] = this.getMinCorner();
  renderer.uniforms[this.maxStr] = this.getMaxCorner();
};

Cube.prototype.temporaryTranslate = function(translation) {
  this.temporaryTranslation = translation;
};

Cube.prototype.translate = function(translation) {
  this.minCorner = this.minCorner.add(translation);
  this.maxCorner = this.maxCorner.add(translation);
};

Cube.prototype.getMinCorner = function() {
  return this.minCorner.add(this.temporaryTranslation);
};

Cube.prototype.getMaxCorner = function() {
  return this.maxCorner.add(this.temporaryTranslation);
};

Cube.prototype.intersect = function(origin, ray) {
  return Cube.intersect(origin, ray, this.getMinCorner(), this.getMaxCorner());
};

Cube.intersect = function(origin, ray, cubeMin, cubeMax) {
  var tMin = cubeMin.subtract(origin).componentDivide(ray);
  var tMax = cubeMax.subtract(origin).componentDivide(ray);
  var t1 = Vector.min(tMin, tMax);
  var t2 = Vector.max(tMin, tMax);
  var tNear = t1.maxComponent();
  var tFar = t2.minComponent();
  if(tNear > 0 && tNear < tFar) {
    return tNear;
  }
  return Number.MAX_VALUE;
};

////////////////////////////////////////////////////////////////////////////////
// class Light
////////////////////////////////////////////////////////////////////////////////

function Light(id, posicion, color, iesN) {
  this.temporaryTranslation = Vector.create([0, 0, 0]);
  this.lightId = 'light' + id;
  this.id = id;
  this.light = Vector.create(posicion);
  this.lightSize = 0.1;
  this.sizeL = 2.0;
  this.colorStr = this.lightId + 'Color';
  this.color = color;
  this.xRotation = 0;
  this.yRotation = 0;
  this.zRotation = 0;
  this.iesSTR = this.lightId + 'IES';
  this.ies = iesN;
  this.textureSTR = this.lightId + 'texture';
  this.texture  = texture;
}

function darDireccion(xRot, yRot, zRot)
{
	var direccion = Line.create(Vector.Zero(3),Vector.j.x(-1));
	direccion = direccion.rotate(xRot, Line.X);
	direccion = direccion.rotate(yRot, Line.Y);
	direccion = direccion.rotate(zRot, Line.Z);
	return direccion;
}

Light.prototype.getPushingCode = function(index)
{
	var tempo = darDireccion(this.xRotation, this.yRotation, this.zRotation);
	var vecto = 'vec3  direc' + this.id + ' = vec3(' + tempo.direction.e(1).toFixed(1) + ',' + tempo.direction.e(2).toFixed(1) + ',' +tempo.direction.e(3).toFixed(1) + ');' ;
	return '' + vecto +
	'vec3 new' + this.lightId + ' = ' + this.lightId + ' + uniformlyRandomVector(timeSinceStart + 5.0) * ' + this.lightSize + ';' +
	'resultLight += calculateColor(eye, initialRay, ' + this.lightId + ', vec3(' + this.color.e(1) + ', ' + this.color.e(2) + ', ' + this.color.e(3) + ' ), ' + this.sizeL.toFixed(1) + ', direc' + this.id + ', ' + this.iesSTR + ');';
};

Light.prototype.getGlobalCode = function() {
  return 'uniform vec3 ' + this.lightId + ';' +
		'uniform float ' + this.iesSTR + '[91];';
		//'uniform sampler ' + this.colorStr;
};

Light.prototype.getIntersectCode = function() {
  return '';
};

Light.prototype.getShadowTestCode = function() {
  return '';
};

Light.prototype.getMinimumIntersectCode = function() {
  return '';
};

Light.prototype.getNormalCalculationCode = function() {
  return '';
};

Light.prototype.setUniforms = function(renderer) 
{
  renderer.uniforms[this.lightId] = this.light.add(this.temporaryTranslation);
  renderer.uniforms[this.iesSTR] = this.ies;
  renderer.uniforms[this.textureSTR] = this.texture;
  //renderer.uniforms[this.colorStr] = this.color;
};

Light.clampPosition = function(position) {
  for(var i = 0; i < position.elements.length; i++) {
    position.elements[i] = Math.max(this.lightSize - 1, Math.min(1 - this.lightSize, position.elements[i]));
  }
};

Light.prototype.temporaryTranslate = function(translation) {
  //var tempLight = this.light.add(translation);
  //Light.clampPosition(tempLight);
  //this.temporaryTranslation = tempLight.subtract(this.light);
  this.temporaryTranslation = translation;
};

Light.prototype.translate = function(translation) {
	this.light = this.light.add(translation);
  //this.light = this.light.add(translation);
  //Light.clampPosition(this.light);
};

Light.prototype.getMinCorner = function() {
  return this.light.add(this.temporaryTranslation).subtract(Vector.create([this.lightSize, this.lightSize, this.lightSize]));
};

Light.prototype.getMaxCorner = function() {
  return this.light.add(this.temporaryTranslation).add(Vector.create([this.lightSize, this.lightSize, this.lightSize]));
};

Light.prototype.intersect = function(origin, ray) {
  return Sphere.intersect(origin, ray, this.light);
};

Light.intersect = function(origin, ray, center) {
 var radius = 0.1;
  var toSphere = origin.subtract(center);
  var a = ray.dot(ray);
  var b = 2*toSphere.dot(ray);
  var c = toSphere.dot(toSphere) - radius*radius;
  var discriminant = b*b - 4*a*c;
  if(discriminant > 0) {
    var t = (-b - Math.sqrt(discriminant)) / (2*a);
    if(t > 0) {
      return t;
    }
  }
  return Number.MAX_VALUE;
};

////////////////////////////////////////////////////////////////////////////////
// class PathTracer
////////////////////////////////////////////////////////////////////////////////
/*  Esto pinta la ventana que vemos. Al parecer hace solo una superposición de texturas todo el tiempo 
La ventana que vemos está normalizado de -1 a 1 en x e y*/
function PathTracer() {
  var vertices = [
    -1, -1,
    -1, +1,
    +1, -1,
    +1, +1
  ];

  // create vertex buffer
  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // create framebuffer
  // Asumo que crea la textura y la almacena acá
  this.framebuffer = gl.createFramebuffer();

  // create textures
  var type = gl.getExtension('OES_texture_float') ? gl.FLOAT : gl.UNSIGNED_BYTE;

 //textureLight1 = gl.createTexture();
//	gl.bindTexture(gl.TEXTURE_2D, textureLight1);
//	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 91, 1, 0,
 //             gl.LUMINANCE, gl.FLOAT, new Float32Array(IES_1.elements));
 
	// set the filtering so we don't need mips and it's not filtered
//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


  this.textures = [];
  //2 texturas pq? no se
  for(var i = 0; i < 2; i++) {
      this.textures.push(gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 512, 512, 0, gl.RGB, type, null);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);

  // create render shader
  // El programa que pinta todo es suuuuper normal. Solo punta un plano y coloca la textura ahí
  this.renderProgram = compileShader(renderVertexSource, renderFragmentSource);
  this.renderVertexAttribute = gl.getAttribLocation(this.renderProgram, 'vertex');
  gl.enableVertexAttribArray(this.renderVertexAttribute);

  // objects and shader will be filled in when setObjects() is called
  this.objects = [];
  this.sampleCount = 0;
  this.tracerProgram = null;
}

PathTracer.prototype.setObjects = function(objects, ligths) {
  this.uniforms = {};
  this.sampleCount = 0;
  this.objects = objects;
  this.lights = lights;
  // create tracer shader
  if(this.tracerProgram != null) {
    gl.deleteProgram(this.shaderProgram);
  }
  this.tracerProgram = compileShader(tracerVertexSource, makeTracerFragmentSource(objects, lights));
  this.tracerVertexAttribute = gl.getAttribLocation(this.tracerProgram, 'vertex');
  gl.enableVertexAttribArray(this.tracerVertexAttribute);
};

PathTracer.prototype.setLights = function(lights) {
  //this.uniforms = {};
  //this.sampleCount = 0;
  this.lights = lights;

};

PathTracer.prototype.update = function(matrix, timeSinceStart) {
  // calculate uniforms
  for(var i = 0; i < this.objects.length; i++) {
    this.objects[i].setUniforms(this);
  }
  for(var i = 0; i < this.lights.length; i++) {
    this.lights[i].setUniforms(this);
  }
  this.uniforms.eye = eye;
  this.uniforms.glossiness = glossiness;
  this.uniforms.ray00 = getEyeRay(matrix, -1, -1);
  this.uniforms.ray01 = getEyeRay(matrix, -1, +1);
  this.uniforms.ray10 = getEyeRay(matrix, +1, -1);
  this.uniforms.ray11 = getEyeRay(matrix, +1, +1);
  this.uniforms.timeSinceStart = timeSinceStart;
  this.uniforms.textureWeight = this.sampleCount / (this.sampleCount + 1);

  // set uniforms
  gl.useProgram(this.tracerProgram);
  setUniforms(this.tracerProgram, this.uniforms);

  // render to texture
  gl.useProgram(this.tracerProgram);
  gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[1], 0);
  gl.vertexAttribPointer(this.tracerVertexAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // ping pong textures
  this.textures.reverse();
  this.sampleCount++;
};

var texture;

PathTracer.prototype.render = function() {
  gl.useProgram(this.renderProgram);

  gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.vertexAttribPointer(this.renderVertexAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

////////////////////////////////////////////////////////////////////////////////
// class Renderer
////////////////////////////////////////////////////////////////////////////////
/* Esto pinta absolutamente todo*/
function Renderer() {
	
  /*Estos vertices se utilizan para pintar las líneas del cuadrado que encierran el objeto seleccionado */	
  var vertices = [
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
    1, 1, 0,
    0, 0, 1,
    1, 0, 1,
    0, 1, 1,
    1, 1, 1
	/*0.5, 1.5, 0.5,
	0.5, -0.5, 0.5,
	0, 0, 1,
	1, 0, 0,
	0, 0, 0,
	1, 0, 1*/
  ];
  
  
  var verticesLamp = [
    0.25, 0.5, 0.25,
    0.75, 0.5, 0.25,
    0.35, 1, 0.35,
    0.65, 1, 0.35,
    0.25, 0.5, 0.75,
    0.75, 0.5, 0.75,
    0.35, 1, 0.65,
    0.65, 1, 0.65
	/*0.5, 1.5, 0.5,
	0.5, -0.5, 0.5,
	0, 0, 1,
	1, 0, 0,
	0, 0, 0,
	1, 0, 1*/
  ];
  
  var indices = [
    0, 1, 1, 3, 3, 2, 2, 0,
    4, 5, 5, 7, 7, 6, 6, 4,
    0, 4, 1, 5, 2, 6, 3, 7
	//8, 9, 9, 10, 9, 11, 9, 12, 9, 13
  ];
  
  var indicesLamp = [
    0, 1, 4, 1, 4, 5,
	0, 1, 3, 0, 3, 2,
	1, 5, 3, 5, 3, 7,
	5, 7, 4, 7, 4, 6,
	4, 0, 6, 0, 6, 2,
	2, 3, 6, 3, 6, 7
  ];

  var indicesLampLines = [
    0, 1, 1, 5, 5, 4, 4, 0,
	4, 6, 6, 2, 2, 0, 2, 3,
	3, 1, 3, 7, 7, 5, 7, 6
	
  ];
  
  // create vertex buffer
  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // create index buffer
  this.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
  // create vertex buffer
  this.vertexLampBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexLampBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesLamp), gl.STATIC_DRAW);

  // create index buffer
  this.indexLampBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexLampBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesLamp), gl.STATIC_DRAW);
  
  this.indexLampLineBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexLampLineBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesLampLines), gl.STATIC_DRAW);

  // create line shader
  this.lineProgram = compileShader(lineVertexSource, lineFragmentSource);
  this.vertexAttribute = gl.getAttribLocation(this.lineProgram, 'vertex');
  gl.enableVertexAttribArray(this.vertexAttribute);

  this.objects = [];
  this.lights = [];
  this.selectedObject = null;
  this.objectIsLight = false;
  this.pathTracer = new PathTracer();
}

Renderer.prototype.setObjects = function(objects, lights) {
  this.objects = objects;
  this.lights = lights;
  this.selectedObject = null;
  this.pathTracer.setObjects(objects, this.lights);
};

Renderer.prototype.setLights = function(lights) {
  this.lights = lights;
  this.selectedlight = null;
  this.pathTracer.setLights(lights);
};


Renderer.prototype.update = function(modelview, projection, timeSinceStart) {
  this.modelview = modelview;
  this.projection = projection;
  this.modelviewProjection = this.projection.multiply(this.modelview);
  var jitter = Matrix.Translation(Vector.create([Math.random() * 2 - 1, Math.random() * 2 - 1, 0]).multiply(1 / 512)); // Hace una muy peque;a traslación no se porque
  var inverse = jitter.multiply(this.modelviewProjection).inverse();
  this.pathTracer.update(inverse, timeSinceStart);
};
//Esto dibuja las lineas
Renderer.prototype.render = function() {
	this.pathTracer.render();
  	gl.useProgram(this.lineProgram);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexLampBuffer);
	gl.vertexAttribPointer(this.vertexLampBuffer, 3, gl.FLOAT, false, 0, 0);
    var location = gl.getUniformLocation(this.lineProgram, "uColor");
  for(var i = 0; i < this.lights.length; i++)
  {
	var transV = this.lights[i].light.x(-1);
	var trans1 = Matrix.Translation(transV);
	var trans2 = Matrix.Translation(this.lights[i].light);
	var rotMat = Matrix.Rotation(this.lights[i].xRotation, Vector.create([1,0,0]));
	rotMat = rotMat.x(Matrix.Rotation(this.lights[i].yRotation, Vector.create([0,1,0])));
	rotMat = rotMat.x(Matrix.Rotation(this.lights[i].zRotation, Vector.create([0,0,1])));
	rotMat.ensure4x4();
	rotMat.tran
	rotMat = this.projection.multiply(this.modelview.x(trans2.x(rotMat.x(trans1))));
	//this.modelviewProjection  = rotMat;
	setUniforms(this.lineProgram, {
	  cubeMin: this.lights[i].getMinCorner(),
	  cubeMax: this.lights[i].getMaxCorner(),
	  modelviewProjection: rotMat
	});
	
	gl.uniform3fv(location, new Float32Array([0.75,0.75,0.75]));
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexLampBuffer);
	gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
	
	gl.uniform3fv(location, new Float32Array(this.lights[i].color.elements));
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexLampLineBuffer);
	gl.drawElements(gl.LINES, 24, gl.UNSIGNED_SHORT, 0);
  }
  gl.uniform3fv(location, new Float32Array([0.0,0.0,0.0]));
  
  if(this.selectedObject != null) {
    gl.useProgram(this.lineProgram);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.vertexAttribPointer(this.vertexAttribute, 3, gl.FLOAT, false, 0, 0);
	if(this.selectedObject.light && false)
	{
		var transV = this.selectedObject.light.x(-1);
		var trans1 = Matrix.Translation(transV);
		var trans2 = Matrix.Translation(this.selectedObject.light);
		var rotMat = Matrix.Rotation(this.selectedObject.xRotation, Vector.create([1,0,0]));
		rotMat = rotMat.x(Matrix.Rotation(this.selectedObject.yRotation, Vector.create([0,1,0])));
		rotMat = rotMat.x(Matrix.Rotation(this.selectedObject.zRotation, Vector.create([0,0,1])));
		rotMat.ensure4x4();
		rotMat.tran
		rotMat = this.projection.multiply(this.modelview.x(trans2.x(rotMat.x(trans1))));
		this.modelviewProjection  = rotMat;
	}
    setUniforms(this.lineProgram, {
      cubeMin: this.selectedObject.getMinCorner(),
      cubeMax: this.selectedObject.getMaxCorner(),
      modelviewProjection: this.modelviewProjection
    });
    gl.drawElements(gl.LINES, 24, gl.UNSIGNED_SHORT, 0);
  }
};

////////////////////////////////////////////////////////////////////////////////
// class UI
////////////////////////////////////////////////////////////////////////////////

function UI() {
  this.renderer = new Renderer();
  this.moving = false;
  this.currentLight = 0;
}

UI.prototype.setObjects = function(objects, lights) {
  this.objects = objects;
  this.lights = lights;
  //this.objects.splice(0, 0, new Light());
  this.renderer.setObjects(this.objects, this.lights);
};

UI.prototype.setLights = function(lights) {
  this.lights = lights;
  
  //this.objects.splice(0, 0, new Light());
  this.renderer.setLights(this.lights);
};

UI.prototype.update = function(timeSinceStart) {
  this.modelview = makeLookAt(eye.elements[0], eye.elements[1], eye.elements[2], 0, 0, 0, 0, 1, 0);
  this.projection = makePerspective(55, 1, 0.1, 100);
  this.modelviewProjection = this.projection.multiply(this.modelview);
  //this.renderer.update(this.modelviewProjection, timeSinceStart);
	this.renderer.update(this.modelview, this.projection, timeSinceStart);
};

UI.prototype.mouseDown = function(x, y) {
  var t;
  var origin = eye;
  var ray = getEyeRay(this.modelviewProjection.inverse(), (x / 512) * 2 - 1, 1 - (y / 512) * 2);

  // test the selection box first
  if(this.renderer.selectedObject != null) {
    var minBounds = this.renderer.selectedObject.getMinCorner();
    var maxBounds = this.renderer.selectedObject.getMaxCorner();
    t = Cube.intersect(origin, ray, minBounds, maxBounds);

    if(t < Number.MAX_VALUE) {
      var hit = origin.add(ray.multiply(t));

      if(Math.abs(hit.elements[0] - minBounds.elements[0]) < 0.001) this.movementNormal = Vector.create([-1, 0, 0]);
      else if(Math.abs(hit.elements[0] - maxBounds.elements[0]) < 0.001) this.movementNormal = Vector.create([+1, 0, 0]);
      else if(Math.abs(hit.elements[1] - minBounds.elements[1]) < 0.001) this.movementNormal = Vector.create([0, -1, 0]);
      else if(Math.abs(hit.elements[1] - maxBounds.elements[1]) < 0.001) this.movementNormal = Vector.create([0, +1, 0]);
      else if(Math.abs(hit.elements[2] - minBounds.elements[2]) < 0.001) this.movementNormal = Vector.create([0, 0, -1]);
      else this.movementNormal = Vector.create([0, 0, +1]);

      this.movementDistance = this.movementNormal.dot(hit);
      this.originalHit = hit;
      this.moving = true;

      return true;
    }
  }

  t = Number.MAX_VALUE;
  this.renderer.selectedObject = null;

  for(var i = 0; i < this.objects.length; i++) {
    var objectT = this.objects[i].intersect(origin, ray);
    if(objectT < t) {
      t = objectT;
      this.renderer.selectedObject = this.objects[i];
    }
  }
  for(var i = 0; i < this.lights.length; i++) {
    var objectT = this.lights[i].intersect(origin, ray);
    if(objectT < t) {
      t = objectT;
      this.renderer.selectedObject = this.lights[i];
    }
  }

  return (t < Number.MAX_VALUE);
};

UI.prototype.mouseMove = function(x, y) {
  if(this.moving) {
    var origin = eye;
    var ray = getEyeRay(this.modelviewProjection.inverse(), (x / 512) * 2 - 1, 1 - (y / 512) * 2);

    var t = (this.movementDistance - this.movementNormal.dot(origin)) / this.movementNormal.dot(ray);
    var hit = origin.add(ray.multiply(t));
    this.renderer.selectedObject.temporaryTranslate(hit.subtract(this.originalHit));

    // clear the sample buffer
    this.renderer.pathTracer.sampleCount = 0;
  }
};

UI.prototype.mouseUp = function(x, y) {
  if(this.moving) {
    var origin = eye;
    var ray = getEyeRay(this.modelviewProjection.inverse(), (x / 512) * 2 - 1, 1 - (y / 512) * 2);

    var t = (this.movementDistance - this.movementNormal.dot(origin)) / this.movementNormal.dot(ray);
    var hit = origin.add(ray.multiply(t));
    this.renderer.selectedObject.temporaryTranslate(Vector.create([0, 0, 0]));
    this.renderer.selectedObject.translate(hit.subtract(this.originalHit));
    this.moving = false;
  }
};

UI.prototype.render = function() {
  this.renderer.render();
};

UI.prototype.selectLight = function() {
  
  this.renderer.selectedObject = this.lights[currentLight];
};

UI.prototype.addLight = function() {
  var nLight = new Light(nextLightId++, [0.0, 0.2, -0.6], Vector.create([1.0,1.0,1.0]), IES_T[0]);
  addOptionSelect(nLight.lightId);
  this.lights.push(nLight);
  this.renderer.setObjects(this.objects, this.lights);
};

UI.prototype.deleteLight = function() 
{
  if(this.lights.length > 1 )
  {
	  this.lights.splice(currentLight, 1);
	  currentLight = 0 ;
	  selectChange();
	  deleteOptionSelect(currentLight);
	  this.renderer.setObjects(this.objects, this.lights);
  }
};

UI.prototype.addSphere = function() {
  this.objects.push(new Sphere(Vector.create([0, 0, 0]), 0.25, nextObjectId++));
  this.renderer.setObjects(this.objects, this.lights);
};

UI.prototype.addCylinder = function() {
  this.objects.push(new Cylinder(Vector.create([0, 0, 0]), 0.25, 0.5, nextObjectId++));
  this.renderer.setObjects(this.objects, this.lights);
};

UI.prototype.addCube = function() {
  this.objects.push(new Cube(Vector.create([-0.25, -0.25, -0.25]), Vector.create([0.25, 0.25, 0.25]), nextObjectId++));
  this.renderer.setObjects(this.objects, this.lights);
};

UI.prototype.deleteSelection = function() {
  for(var i = 0; i < this.objects.length; i++) {
    if(this.renderer.selectedObject == this.objects[i]) {
      this.objects.splice(i, 1);
      this.renderer.selectedObject = null;
      this.renderer.setObjects(this.objects, this.lights);
      break;
    }
  }
};

UI.prototype.updateMaterial = function() {
  var newMaterial = parseInt(document.getElementById('material').value, 10);
  if(material != newMaterial) {
    material = newMaterial;
    this.renderer.setObjects(this.objects, this.lights);
  }
};

UI.prototype.updateEnvironment = function() {
  var newEnvironment = parseInt(document.getElementById('environment').value, 10);
  if(environment != newEnvironment) {
    environment = newEnvironment;
    this.renderer.setObjects(this.objects, this.lights);
  }
};

UI.prototype.updateGlossiness = function() {
  var newGlossiness = parseFloat(document.getElementById('glossiness').value);
  if(isNaN(newGlossiness)) newGlossiness = 0;
  newGlossiness = Math.max(0, Math.min(1, newGlossiness));
  if(material == MATERIAL_GLOSSY && glossiness != newGlossiness) {
    this.renderer.pathTracer.sampleCount = 0;
  }
  glossiness = newGlossiness;
};

////////////////////////////////////////////////////////////////////////////////
// main program
////////////////////////////////////////////////////////////////////////////////

var gl;
var ui;
var error;
var canvas;
var inputFocusCount = 0;

var angleX = 0;
var angleY = 0;
var zoomZ = 2.5;
var eye = Vector.create([0, 0, 0]);
var light = Vector.create([0.4, 0.5, -0.6]);
var lights = [];

var nextObjectId = 0;
var nextLightId = 0;

var MATERIAL_DIFFUSE = 0;
var MATERIAL_MIRROR = 1;
var MATERIAL_GLOSSY = 2;
var material = MATERIAL_DIFFUSE;
var glossiness = 0.6;

var YELLOW_BLUE_CORNELL_BOX = 0;
var RED_GREEN_CORNELL_BOX = 1;
var environment = YELLOW_BLUE_CORNELL_BOX;

function tick(timeSinceStart) {
  eye.elements[0] = zoomZ * Math.sin(angleY) * Math.cos(angleX);
  eye.elements[1] = zoomZ * Math.sin(angleX);
  eye.elements[2] = zoomZ * Math.cos(angleY) * Math.cos(angleX);

  document.getElementById('glossiness-factor').style.display = (material == MATERIAL_GLOSSY) ? 'inline' : 'none';

  ui.updateMaterial();
  ui.updateGlossiness();
  ui.updateEnvironment();
  ui.update(timeSinceStart);
  ui.render();
}

function makeStacks() {
  var objects = [];

  // lower level
  objects.push(new Cube(Vector.create([-0.5, -0.75, -0.5]), Vector.create([0.5, -0.7, 0.5]), nextObjectId++));

  // further poles
  objects.push(new Cube(Vector.create([-0.45, -1, -0.45]), Vector.create([-0.4, -0.45, -0.4]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.4, -1, -0.45]), Vector.create([0.45, -0.45, -0.4]), nextObjectId++));
  objects.push(new Cube(Vector.create([-0.45, -1, 0.4]), Vector.create([-0.4, -0.45, 0.45]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.4, -1, 0.4]), Vector.create([0.45, -0.45, 0.45]), nextObjectId++));

  // upper level
  objects.push(new Cube(Vector.create([-0.3, -0.5, -0.3]), Vector.create([0.3, -0.45, 0.3]), nextObjectId++));

  // closer poles
  objects.push(new Cube(Vector.create([-0.25, -0.7, -0.25]), Vector.create([-0.2, -0.25, -0.2]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.2, -0.7, -0.25]), Vector.create([0.25, -0.25, -0.2]), nextObjectId++));
  objects.push(new Cube(Vector.create([-0.25, -0.7, 0.2]), Vector.create([-0.2, -0.25, 0.25]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.2, -0.7, 0.2]), Vector.create([0.25, -0.25, 0.25]), nextObjectId++));

  // upper level
  objects.push(new Cube(Vector.create([-0.25, -0.25, -0.25]), Vector.create([0.25, -0.2, 0.25]), nextObjectId++));

  return objects;
}

function makeTableAndChair() {
  var objects = [];

  // table top
  objects.push(new Cube(Vector.create([-0.5, -0.35, -0.5]), Vector.create([0.3, -0.3, 0.5]), nextObjectId++));

  // table legs
  objects.push(new Cube(Vector.create([-0.45, -1, -0.45]), Vector.create([-0.4, -0.35, -0.4]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.2, -1, -0.45]), Vector.create([0.25, -0.35, -0.4]), nextObjectId++));
  objects.push(new Cube(Vector.create([-0.45, -1, 0.4]), Vector.create([-0.4, -0.35, 0.45]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.2, -1, 0.4]), Vector.create([0.25, -0.35, 0.45]), nextObjectId++));

  // chair seat
  objects.push(new Cube(Vector.create([0.3, -0.6, -0.2]), Vector.create([0.7, -0.55, 0.2]), nextObjectId++));

  // chair legs
  objects.push(new Cube(Vector.create([0.3, -1, -0.2]), Vector.create([0.35, -0.6, -0.15]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.3, -1, 0.15]), Vector.create([0.35, -0.6, 0.2]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.65, -1, -0.2]), Vector.create([0.7, 0.1, -0.15]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.65, -1, 0.15]), Vector.create([0.7, 0.1, 0.2]), nextObjectId++));

  // chair back
  objects.push(new Cube(Vector.create([0.65, 0.05, -0.15]), Vector.create([0.7, 0.1, 0.15]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.65, -0.55, -0.09]), Vector.create([0.7, 0.1, -0.03]), nextObjectId++));
  objects.push(new Cube(Vector.create([0.65, -0.55, 0.03]), Vector.create([0.7, 0.1, 0.09]), nextObjectId++));

  // sphere on table
  objects.push(new Sphere(Vector.create([-0.1, -0.05, 0]), 0.25, nextObjectId++));

  return objects;
}

function makeSphereAndCube() {
  var objects = [];
  objects.push(new Cube(Vector.create([-0.25, -1, -0.25]), Vector.create([0.25, -0.75, 0.25]), nextObjectId++));
  objects.push(new Sphere(Vector.create([0, -0.75, 0]), 0.25, nextObjectId++));
  return objects;
}

function makeSphereColumn() {
  var objects = [];
  objects.push(new Sphere(Vector.create([0, 0.75, 0]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0, 0.25, 0]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0, -0.25, 0]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0, -0.75, 0]), 0.25, nextObjectId++));
  return objects;
}

function makeSphereCylinderColumn() {
  var objects = [];
  objects.push(new Sphere(Vector.create([0, 0.75, 0]), 0.25, nextObjectId++));
  objects.push(new Cylinder(Vector.create([0, 0.25, 0]), 0.25, 0.5, nextObjectId++));
  objects.push(new Sphere(Vector.create([0, -0.25, 0]), 0.25, nextObjectId++));
  objects.push(new Cylinder(Vector.create([0, -0.75, 0]), 0.25, 0.5,nextObjectId++));
  return objects;
}

function makeCubeAndSpheres() {
  var objects = [];
  objects.push(new Cube(Vector.create([-0.25, -0.25, -0.25]), Vector.create([0.25, 0.25, 0.25]), nextObjectId++));
  objects.push(new Sphere(Vector.create([-0.25, 0, 0]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([+0.25, 0, 0]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0, -0.25, 0]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0, +0.25, 0]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0, 0, -0.25]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0, 0, +0.25]), 0.25, nextObjectId++));
  return objects;
}

function makeSpherePyramid() {
  var root3_over4 = 0.433012701892219;
  var root3_over6 = 0.288675134594813;
  var root6_over6 = 0.408248290463863;
  var objects = [];

  // first level
  objects.push(new Sphere(Vector.create([-0.5, -0.75, -root3_over6]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0.0, -0.75, -root3_over6]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0.5, -0.75, -root3_over6]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([-0.25, -0.75, root3_over4 - root3_over6]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0.25, -0.75, root3_over4 - root3_over6]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0.0, -0.75, 2.0 * root3_over4 - root3_over6]), 0.25, nextObjectId++));

  // second level
  objects.push(new Sphere(Vector.create([0.0, -0.75 + root6_over6, root3_over6]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([-0.25, -0.75 + root6_over6, -0.5 * root3_over6]), 0.25, nextObjectId++));
  objects.push(new Sphere(Vector.create([0.25, -0.75 + root6_over6, -0.5 * root3_over6]), 0.25, nextObjectId++));

  // third level
  objects.push(new Sphere(Vector.create([0.0, -0.75 + 2.0 * root6_over6, 0.0]), 0.25, nextObjectId++));

  return objects;
}

var XNEG = 0, XPOS = 1, YNEG = 2, YPOS = 3, ZNEG = 4, ZPOS = 5;

function addRecursiveSpheresBranch(objects, center, radius, depth, dir) {
  objects.push(new Sphere(center, radius, nextObjectId++));
  if(depth--) {
    if(dir != XNEG) addRecursiveSpheresBranch(objects, center.subtract(Vector.create([radius * 1.5, 0, 0])), radius / 2, depth, XPOS);
    if(dir != XPOS) addRecursiveSpheresBranch(objects, center.add(Vector.create([radius * 1.5, 0, 0])),      radius / 2, depth, XNEG);
    
    if(dir != YNEG) addRecursiveSpheresBranch(objects, center.subtract(Vector.create([0, radius * 1.5, 0])), radius / 2, depth, YPOS);
    if(dir != YPOS) addRecursiveSpheresBranch(objects, center.add(Vector.create([0, radius * 1.5, 0])),      radius / 2, depth, YNEG);
    
    if(dir != ZNEG) addRecursiveSpheresBranch(objects, center.subtract(Vector.create([0, 0, radius * 1.5])), radius / 2, depth, ZPOS);
    if(dir != ZPOS) addRecursiveSpheresBranch(objects, center.add(Vector.create([0, 0, radius * 1.5])),      radius / 2, depth, ZNEG);
  }
}

function makeRecursiveSpheres() {
  var objects = [];
  addRecursiveSpheresBranch(objects, Vector.create([0, 0, 0]), 0.3, 2, -1);
  return objects;
}

var textureLight1;

window.onload = function() {
  gl = null;
  error = document.getElementById('error');
  canvas = document.getElementById('canvas');

  

  try { gl = canvas.getContext('experimental-webgl'); } catch(e) {}

  if(gl) {
    error.innerHTML = 'Loading...';
var IES = Vector.create([1260.3 ,1261.6 ,1266.5 ,1272.5 ,1278.0 ,1283.2 ,1287.4 ,1289.2 ,1288.5 ,1285.4 ,1279.3 ,1269.0 ,1253.7 ,1234.1 ,1210.8 ,
1184.0 ,1153.8 ,1120.4 ,1084.7 ,1047.1 ,1008.2 ,968.50 ,928.10 ,886.36 ,841.88 ,793.00 ,740.12 ,683.48 ,622.58 ,559.76 ,
496.00 ,431.55 ,367.45 ,303.92 ,241.43 ,185.79 ,142.77 ,109.56 ,84.471 ,65.244 ,50.388 ,39.409 ,31.270 ,25.219 ,20.650 ,
17.104 ,14.346 ,12.217 ,10.589 ,9.3359 ,8.3377 ,7.5170 ,6.8298 ,6.2675 ,5.7851 ,5.3563 ,4.9726 ,4.6505 ,4.3469 ,4.0585 ,
3.7912 ,3.5362 ,3.3010 ,3.0631 ,2.8734 ,2.6583 ,2.4085 ,2.1999 ,2.0327 ,1.8824 ,1.7196 ,1.5481 ,1.4002 ,1.2654 ,1.1525 ,
1.0437 ,0.9485 ,0.8532 ,0.7617 ,0.6761 ,0.6033 ,0.5399 ,0.4743 ,0.4062 ,0.3411 ,0.2741 ,0.1996 ,0.1437 ,0.0923 ,0.0328 ,
0.0066 ]);
for(var i = 0; i < IES.elements.length; i++) IES.elements[i] = IES.elements[i]/1289.2;

	textureLight1 = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, textureLight1);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 91, 1, 0,
              gl.LUMINANCE, gl.FLOAT, new Float32Array(IES.elements));
 
	// set the filtering so we don't need mips and it's not filtered
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	for(var i = 0; i < 91; i++) IES_T[0].elements[i] = IES_T[0].elements[i]/1289.2;
	for(var i = 0; i < 91; i++) IES_T[1].elements[i] = IES_T[1].elements[i]/1843.8;
	for(var i = 0; i < 91; i++) IES_T[2].elements[i] = IES_T[2].elements[i]/1087.2;
    // keep track of whether an <input> is focused or not (will be no only if inputFocusCount == 0)
    var inputs = document.getElementsByTagName('input');
    for(var i= 0; i < inputs.length; i++) {
      inputs[i].onfocus = function(){ inputFocusCount++; };
      inputs[i].onblur = function(){ inputFocusCount--; };
    }

    material = parseInt(document.getElementById('material').value, 10);
    environment = parseInt(document.getElementById('environment').value, 10);
    ui = new UI();
	
	currentLight = 0;
	 
	//lights.push(new Light(nextLightId++, [0.0, -0.35, 0.95], Vector.create([1.0,1.0,1.0]), IES_1));
	lights.push(new Light(nextLightId++, [0.0, -0.35, 0.95], Vector.create([1.0,1.0,1.0]), IES_T[0]));
	//lights.push(new Light(nextLightId++, [0.0, -0.35, 0.95], Vector.create([1.0,1.0,1.0]), IES_3));

	//lights.push(new Light(nextLightId++, [0.4, -0.5, -0.6], Vector.create([1.0,0.0,0.0])));
	
	addOptionSelect(lights[0].lightId);
	//addOptionSelect(lights[1].lightId);
	//addOptionSelect(lights[2].lightId);
	//lights[0].xRotation = Math.PI/2;
	//addOptionSelect(lights[1].lightId);
	updateRanges();
    ui.setObjects(makeStacks(), lights);
	
    var start = new Date();
    error.style.zIndex = -1;
    setInterval(function(){ tick((new Date() - start) * 0.001); }, 1000 / 600);
  } else {
    error.innerHTML = 'Your browser does not support WebGL.<br>Please see <a href="http://www.khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">Getting a WebGL Implementation</a>.';
  }
};

function elementPos(element) {
  var x = 0, y = 0;
  while(element.offsetParent) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  }
  return { x: x, y: y };
}

function eventPos(event) {
  return {
    x: event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
    y: event.clientY + document.body.scrollTop + document.documentElement.scrollTop
  };
}

function canvasMousePos(event) {
  var mousePos = eventPos(event);
  var canvasPos = elementPos(canvas);
  return {
    x: mousePos.x - canvasPos.x,
    y: mousePos.y - canvasPos.y
  };
}

var mouseDown = false, oldX, oldY;

document.onmousedown = function(event) {
  var mouse = canvasMousePos(event);
  oldX = mouse.x;
  oldY = mouse.y;

  if(mouse.x >= 0 && mouse.x < 512 && mouse.y >= 0 && mouse.y < 512) {
    mouseDown = !ui.mouseDown(mouse.x, mouse.y);

    // disable selection because dragging is used for rotating the camera and moving objects
    return false;
  }

  return true;
};

document.onmousemove = function(event) {
  var mouse = canvasMousePos(event);

  if(mouseDown) {
    // update the angles based on how far we moved since last time
    angleY -= (mouse.x - oldX) * 0.01;
    angleX += (mouse.y - oldY) * 0.01;

    // don't go upside down
    angleX = Math.max(angleX, -Math.PI / 2 + 0.01);
    angleX = Math.min(angleX, Math.PI / 2 - 0.01);

    // clear the sample buffer
    ui.renderer.pathTracer.sampleCount = 0;

    // remember this coordinate
    oldX = mouse.x;
    oldY = mouse.y;
  } else {
    var canvasPos = elementPos(canvas);
    ui.mouseMove(mouse.x, mouse.y);
  }
};

document.onmouseup = function(event) {
  mouseDown = false;

  var mouse = canvasMousePos(event);
  ui.mouseUp(mouse.x, mouse.y);
};

document.onkeydown = function(event) {
  // if there are no <input> elements focused
  if(inputFocusCount == 0) {
    // if backspace or delete was pressed
    if(event.keyCode == 8 || event.keyCode == 46) {
      ui.deleteSelection();

      // don't let the backspace key go back a page
      return false;
    }
  }
};

document.onwheel = function()
{
	
}
function addOptionSelect(name)
{
	var select = document.getElementById('lightsSelect');
	var opt = document.createElement('option');
    opt.value = name;
    opt.innerHTML = name;
    select.appendChild(opt);
}

function deleteOptionSelect(index)
{
	var select = document.getElementById('lightsSelect');
	select.remove(index);
}

var currentLight;

function selectChange()
{
	var select = document.getElementById('lightsSelect');
	var value = select.value;
	currentLight = select.selectedIndex;
	var numSelect = document.getElementById('iesSelect').selectedIndex;
	lights[currentLight].ies = IES_T[numSelect];
	updateRanges();
	
}

function updateRanges()
{
	var redRange = document.getElementById('redRange');
	var forRedRange = document.getElementById('forRedRange');
	var greenRange = document.getElementById('greenRange');
	var forGreenRange = document.getElementById('forGreenRange');
	var blueRange = document.getElementById('blueRange');
	var forBlueRange = document.getElementById('forBlueRange');
	var sizeRange = document.getElementById('sizeRange');
	var forSize = document.getElementById('forSizeRange');
	var rotationXRange = document.getElementById('rotationXRange');
	var forRotationXRange  = document.getElementById('forRotationXRange');
	var rotationYRange =  document.getElementById('rotationYRange');
	var forRotationYRange =  document.getElementById('forRotationYRange');
	var rotationZRange =  document.getElementById('rotationZRange');
	var forRotationZRange =  document.getElementById('forRotationZRange');
	
	var value = (255 * lights[currentLight].color.elements[0]) + "";
	redRange.value = value;
	value = 255 * (lights[currentLight].color.elements[1]) + "";
	greenRange.value = value;
	value = 255 * (lights[currentLight].color.elements[2]) + "";
	blueRange.value = value;
	sizeRange.value = lights[currentLight].sizeL;
	rotationXRange.value = lights[currentLight].xRotation * 180 / Math.PI;
	rotationYRange.value = lights[currentLight].yRotation * 180 / Math.PI;
	rotationZRange.value = lights[currentLight].zRotation * 180 / Math.PI;
	
	forRedRange.innerHTML = redRange.value;
	forGreenRange.innerHTML = greenRange.value;
	forBlueRange.innerHTML = blueRange.value;
	forSizeRange.innerHTML = sizeRange.value;
	forRotationXRange.innerHTML = rotationXRange.value ;
	forRotationYRange.innerHTML = rotationYRange.value ;
	forRotationZRange.innerHTML = rotationZRange.value ;
}

function onChangeRanges()
{
	
	var redRange = document.getElementById('redRange');
	var greenRange = document.getElementById('greenRange');
	var blueRange = document.getElementById('blueRange');
	var sizeRange = document.getElementById('sizeRange');
	var rotationXRange =  document.getElementById('rotationXRange');
	var rotationYRange =  document.getElementById('rotationYRange');
	var rotationZRange =  document.getElementById('rotationZRange');

	lights[currentLight].color.setElements([redRange.value/255, greenRange.value/255, blueRange.value/255]);
	lights[currentLight].sizeL = sizeRange.value/1;
	lights[currentLight].xRotation = rotationXRange.value * Math.PI / 180;
	lights[currentLight].yRotation = rotationYRange.value * Math.PI / 180;
	lights[currentLight].zRotation = rotationZRange.value * Math.PI / 180;
	updateRanges();
	ui.setObjects(ui.renderer.objects, lights);
	ui.selectLight();
}

function readFile(e) {
  var archivo = e.target.files[0];
  if (!archivo) {
    return;
  }
  var lector = new FileReader();
  lector.onload = function(e) {
    var contenido = e.target.result;
    mostrarContenido(contenido);
  };
  
  lector.readAsText(archivo);
}

function mostrarContenido(contenido) {
  var elemento = document.getElementById('contenido-archivo');
  //elemento.innerHTML = contenido;
}
var IES_T = []
IES_T.push(Vector.create([1260.3 ,1261.6 ,1266.5 ,1272.5 ,1278.0 ,1283.2 ,1287.4 ,1289.2 ,1288.5 ,1285.4 ,1279.3 ,1269.0 ,1253.7 ,1234.1 ,1210.8,
1184.0 ,1153.8 ,1120.4 ,1084.7 ,1047.1 ,1008.2 ,968.50 ,928.10 ,886.36 ,841.88 ,793.00 ,740.12 ,683.48 ,622.58 ,559.76 ,
496.00 ,431.55 ,367.45 ,303.92 ,241.43 ,185.79 ,142.77 ,109.56 ,84.471 ,65.244 ,50.388 ,39.409 ,31.270 ,25.219 ,20.650 ,
17.104 ,14.346 ,12.217 ,10.589 ,9.3359 ,8.3377 ,7.5170 ,6.8298 ,6.2675 ,5.7851 ,5.3563 ,4.9726 ,4.6505 ,4.3469 ,4.0585 ,
3.7912 ,3.5362 ,3.3010 ,3.0631 ,2.8734 ,2.6583 ,2.4085 ,2.1999 ,2.0327 ,1.8824 ,1.7196 ,1.5481 ,1.4002 ,1.2654 ,1.1525 ,
1.0437 ,0.9485 ,0.8532 ,0.7617 ,0.6761 ,0.6033 ,0.5399 ,0.4743 ,0.4062 ,0.3411 ,0.2741 ,0.1996 ,0.1437 ,0.0923 ,0.0328 ,
0.0066 ]));
IES_T.push(Vector.create([1843.8,1839.4,1835.1,1831.0,1827.4,1823.7,1823.6,1823.4,1819.9,1812.9,1806.0,1777.0,1748.0,1704.1,1645.2,
1586.4,1500.9,1415.3,1324.9,1229.6,1134.2,1036.8,939.42,837.91,732.28,626.65,528.02,429.39,337.70,252.94,
168.19,122.70,77.214,47.280,32.901,18.523,13.964,9.4045,6.3485,4.7953,3.2422,2.7003,2.1584,1.7908,1.5974,
1.4041,1.2949,1.1856,1.0898,1.0075,0.9251,0.8571,0.7890,0.7242,0.6626,0.6010,0.5441,0.4872,0.4326,0.3803,
0.3281,0.2835,0.2389,0.1974,0.1590,0.1206,0.0916,0.0627,0.0475,0.0461,0.0447,0.0419,0.0391,0.0372,0.0362,
0.0351,0.0339,0.0326,0.0320,0.0321,0.0323,0.0321,0.0320,0.0323,0.0329,0.0335,0.0360,0.0384,0.0403,0.0415,
0.0428]));
IES_T.push(Vector.create([1087.2,1057.1,1000.9,926.47,836.48,734.18,627.13,521.52,423.62,337.99,262.83,198.35,148.19,110.73,82.408,
60.649,44.499,33.556,26.627,21.962,18.386,15.531,13.234,11.330,9.7462,8.5501,7.7849,7.3221,6.9855,6.6988,
6.4549,6.2566,6.0947,5.9487,5.7962,5.6257,5.4428,5.2592,5.0815,4.9110,4.7457,4.5855,4.4296,4.2765,4.1249,
3.9749,3.8271,3.6823,3.5410,3.4045,3.2732,3.1458,3.0198,2.8947,2.7723,2.6536,2.5385,2.4261,2.3163,2.2102,
2.1079,2.0083,1.9105,1.8132,1.7167,1.6219,1.5303,1.4424,1.3573,1.2739,1.1917,1.1108,1.0310,0.9523,0.8745,
0.7987,0.7251,0.6540,0.5854,0.5194,0.4551,0.3891,0.3186,0.2478,0.1859,0.1358,0.0934,0.0651,0.0499,0.0322,
0.0212]));




//iesdocument.getElementById('file-input').addEventListener('change', readFile, false);
