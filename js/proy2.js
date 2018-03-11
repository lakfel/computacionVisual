// Buffers de la esfera central. Posición y color
var sphereVertexPositionBuffer;
var sphereVertexColorBuffer;

// Contexto
var gl; // WEB GL

// Matriz de modelo vista
var mvMatrix = mat4.create();
// Matriz de proyección.
var pMatrix = mat4.create();

// Ángulo de rotación de todo el escenario.
var rSquare = 0;

// Pila para mantener la matriz en cambios
var mvMatrixStack = [];

// Matriz para mantener la rotación
var mvMatrixRotacion = [];

var shaderProgram;

// Iniciación de los shaders
function initShaders()
{
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Could not initialise shaders");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

// Función de cambio de gradoso a radianes
function degToRad(degrees) 
{
	return degrees * Math.PI / 180;
}
	
// Función que calcula el movimiento
var lastTime = 0;
function animate() 
{
    var timeNow = new Date().getTime();
    if (lastTime != 0) 
	{
      var elapsed = timeNow - lastTime;
      rSquare += (40 * elapsed) / 1000.0;
    }
	lastTime = timeNow;
}

// Recupera el shader	
function getShader(gl, id) 
{
	var shaderScript = document.getElementById(id);
	if (!shaderScript) 
	{
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
	if (k.nodeType == 3)
		str += k.textContent;
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment") 
	{
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

  return shader;
}
 // Relaciona las matrices  con las de los shaders
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  }
 
function webGLStart()
 {
    var canvas = document.getElementById("miCanvas");
    initGL(canvas); // Se inicia el contexto
    initShaders(); // Se inicia los shaders
    initBuffers(); // Inicia los buffers

    gl.clearColor(0.9, 0.7, 0.7, 1.0);
    gl.enable(gl.DEPTH_TEST);


	conteo = 0;
	tick();
}

function tick() {
    requestAnimFrame(tick);
	conteo++;
	drawScene();
    animate();
  }


  function initGL(canvas) {
    try {
      gl = canvas.getContext("experimental-webgl");
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    } 
	catch(e) {
		alert( e);
    }
    if (!gl) {
      alert("Could not initialise WebGL, sorry :-( " );
    }
  }


function initBuffers() 
{
	// ESFERA
	// Posiciones
	sphereVertexPositionBuffer = gl.createBuffer();
	sphereVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
	
	var vertices = crearEsfera(2, Math.PI/32);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	sphereVertexPositionBuffer.itemSize = 3; // JS permite darle propiedades aún así no las tenga.
    sphereVertexPositionBuffer.numItems = vertices.length / 3;
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
	
	// Colores
	var colors = crearEsferaColores(0.8, Math.PI/32,0,0,0,1,1,1);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    sphereVertexColorBuffer.itemSize = 4;
    sphereVertexColorBuffer.numItems = colors.length / 4;
	
  }
 
  // Dibuja toda la escena
  function drawScene() 
  {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); // Creamos la ventana
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Limpiamos el canvas 	
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix); // Esto habla es de la perspectiva. 45 grados, la relación entre las dimensiones del viwport, el z minimo, el z maximo y la matriz que nos describe ls proyecciones
	
	mvMatrix = mat4.create();
	
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0 , 0.0, -10]); // Nos
	mat4.rotate(mvMatrix, degToRad(rSquare), [0, 1, 0]);
	
	// La esfera superior
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, sphereVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);
	
  }

function crearEsfera (radio, angulo)
{
	var vertices = [];
	for(var fi = 0; fi  <= Math.PI + angulo; fi += angulo)
	{
		for (var tta = 0 ; tta <= 2 * Math.PI ; tta += angulo)
		{
				var Z1 = radio * Math.cos(fi - angulo);
				var X1 = radio * Math.sin(fi - angulo)* Math.cos(tta - angulo)
				var Y1 = radio * Math.sin(fi - angulo)* Math.sin(tta - angulo)
				
				var X2 = radio * Math.sin(fi - angulo)* Math.cos(tta)
				var Y2 = radio * Math.sin(fi - angulo)* Math.sin(tta)
				
				var Z2 = radio * Math.cos(fi);
				var X3 = radio * Math.sin(fi)* Math.cos(tta - angulo)
				var Y3 = radio * Math.sin(fi)* Math.sin(tta - angulo)
				
				var X4 = radio * Math.sin(fi)* Math.cos(tta)
				var Y4 = radio * Math.sin(fi)* Math.sin(tta)
				
				vertices.push(X1);
				vertices.push(Y1);
				vertices.push(Z1);
				
				vertices.push(X2);
				vertices.push(Y2);
				vertices.push(Z1);
				
				vertices.push(X3);
				vertices.push(Y3);
				vertices.push(Z2);
				
				vertices.push(X3);
				vertices.push(Y3);
				vertices.push(Z2);
				
				vertices.push(X4);
				vertices.push(Y4);
				vertices.push(Z2);
				
				vertices.push(X2);
				vertices.push(Y2);
				vertices.push(Z1);
				
		}
	}
	
	return vertices;


}

function crearEsferaColores (radio, angulo, r1,g1,b1,r2,g2,b2)
{
	var vertices = [];
	for(var fi = 0; fi  <= Math.PI + angulo; fi += angulo)
	{
		for (var tta = 0 ; tta <= 2 * Math.PI ; tta += angulo)
		{
				var rr = 0;
				var gg = 0;
				var bb = 0;
				if(fi <= Math.PI/4 || (fi > Math.PI/2 && fi <= 3*Math.PI/4))
				{
					rr=r1;
					gg=g1;
					bb=b1;
				}
				else
				{
					rr=r2;
					gg=g2;
					bb=b2;
				}
				for(var tt = 0; tt <6; tt++)
				{
					vertices.push(rr);
					vertices.push(gg);
					vertices.push(bb);
					vertices.push(1);
				}
		}
	}
	return vertices;
}

