

// Buffers de la esfera central. Posición y color
var sphereVertexPositionBuffer;
var sphereVertexColorBuffer;

// Buffers de los soportes superiores. Posición y color
var cubo1VertexPositionBuffer;
var cubo2VertexPositionBuffer;
var cubo1VertexColorBuffer;
var cubo2VertexColorBuffer;

// Buffers para  las líneas que cualegan de los soportes
var linea1VertexPositionBuffer;
var linea1VertexColorBuffer;

// Buffers para cada una de las esferas de la ilsutración.
var triangleVertexPositionBuffer;
var triangleVertexColorBuffer;

// Buffers para las líneas que conectan las esferas
var squareVertexPositionBuffer;
var squareVertexColorBuffer;

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

// Movimientos aleatorios en y
var rndy = [];
var dys = [];
var resys = [];

// Rotaciones aleatorias en Y
var grasys = [];


var conteo;
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
      rSquare += (15 * elapsed) / 1000.0;
    }
	lastTime = timeNow;
}

// Guarda la matriz actual
function mvPushMatrix() 
{
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}
//Retorna a la [ultima amtriz guardada
 function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
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

    gl.clearColor(0.6, 0.6, 0.6, 1.0);
    gl.enable(gl.DEPTH_TEST);

	for(var i = 0; i <30; i++)
	{	
		rndy.push(Math.random()/20);
		dys.push(0);
		resys.push(0);
		grasys.push((Math.random()*2 -1)*Math.PI);
	}
	
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
	
	// UNA ESFERA
	//   -- Posiciones
    triangleVertexPositionBuffer = gl.createBuffer();  // Esto crea un buffer con GL
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer); // Esto pone un FOCUS sobre el buffer que vamos a manejar
	var vertices = crearEsfera(0.1, Math.PI/32); // Creamos los vértices. Esto se maneja como un strip de triangulos. Acá no improta pero en elcuadrado si, el orden del 4 vértice.
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); // Llenamos el Buffer., Creando un array de Flots del array de vertices que ya creamos. Recordemos que esto es con el array que est[a Focus en este momento
	triangleVertexPositionBuffer.itemSize = 3; // JS permite darle propiedades aún así no las tenga.
    triangleVertexPositionBuffer.numItems = vertices.length / 3;
	
	//   -- Colores. Estos se calculan en proceso
	triangleVertexColorBuffer = gl.createBuffer();
	
    
	
	// La linea que conecta todas las esferas.
	//    -- Posiciones
	
	squareVertexPositionBuffer = gl.createBuffer();
	
	
	//   -- Colores
	squareVertexColorBuffer = gl.createBuffer();
	colors = [];
	for(var i = 0; i<30; i++)
	{
			colors.push(0.8);
			colors.push(0.8);
			colors.push(0.8);
			colors.push(1);
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 30;
	
	// Linea que conecta desde el soporte a las elipses
	// -- posiciones
	vertices = [];
	vertices.push(0);
	vertices.push(-0.5);
	vertices.push(0);
	vertices.push(0);
	vertices.push(0.5);
	vertices.push(0);
	linea1VertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	linea1VertexPositionBuffer.itemSize = 3;
	linea1VertexPositionBuffer.numItems = 2;
	
	
	//   -- Colores
	colors = [];
	colors.push(0.8);
	colors.push(0.8);
	colors.push(0.8);
	colors.push(1);
	colors.push(0.8);
	colors.push(0.8);
	colors.push(0.8);
	colors.push(1);
	linea1VertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	linea1VertexColorBuffer.itemSize = 4;
	linea1VertexColorBuffer.numItems = 2;
	
	// ESFERA SUPERIOR
	//  -- Posiciones
	sphereVertexPositionBuffer = gl.createBuffer();
	sphereVertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
	
	vertices = crearEsfera(0.8, Math.PI/32);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	sphereVertexPositionBuffer.itemSize = 3; // JS permite darle propiedades aún así no las tenga.
    sphereVertexPositionBuffer.numItems = vertices.length / 3;
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
	
	// Colores
	colors = crearEsferaColores(0.8, Math.PI/32,0,0,0,1,1,1);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    sphereVertexColorBuffer.itemSize = 4;
    sphereVertexColorBuffer.numItems = colors.length / 4;
	
	// Cubos superiores
	cubo1VertexPositionBuffer = gl.createBuffer();
	vertices = crearCubo(4, 0.5, 0.5);
	gl.bindBuffer(gl.ARRAY_BUFFER, cubo1VertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubo1VertexPositionBuffer.itemSize = 3;
	cubo1VertexPositionBuffer.numItems = 36;
	
	colors = [];
	for(var i = 0; i < 36; i++)
	{
		colors.push(0.8);
		colors.push(0.3);
		colors.push(0.3);
		colors.push(1);
	}
	cubo1VertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubo1VertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	cubo1VertexColorBuffer.itemSize = 4;
	cubo1VertexColorBuffer.numItems = 36;
	
	
	cubo2VertexPositionBuffer = gl.createBuffer();
	vertices = crearCubo(0.5, 0.5, 6);
	gl.bindBuffer(gl.ARRAY_BUFFER, cubo2VertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cubo2VertexPositionBuffer.itemSize = 3;
	cubo2VertexPositionBuffer.numItems = 36;
	
	cubo2VertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubo2VertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	cubo2VertexColorBuffer.itemSize = 4;
	cubo2VertexColorBuffer.numItems = 36
	
  }
  
  // Funcion que dibuja una elipse dados los deltas, y los colores que se quieren en las esferas
  function drawElipse(deltax, deltay, deltaz, r1, g1, b1, r2, g2, b2)
  {
	// Se calculan los colores ( Si se guarda la info sería más eficiente)
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    var colors = crearEsferaColores(1, Math.PI/32,r1,g1,b1,r2,g2,b2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	triangleVertexColorBuffer.itemSize = 4;
    triangleVertexColorBuffer.numItems = colors.length / 4;
	// Son 30 esferas. Se re calcula las translaciones para formar la elipse a partir de la misma esfera
	for(var i = 0; i < 30; i++)
	{			

		// Movimientos aleatorios
		if(conteo % 10 == 0)
		{
			for(var j = 0; j < 30; j++)
			{
					resys[j]=rndy[j];
					rndy[j] = Math.random()/10;
					dys[j] = (rndy[j] - resys[j])/9;
					
			}
			conteo =1;
		}
		if(conteo % 5 == 0)
			grasys[j] = grasys[j] + (Math.random()*2 -1)*Math.PI;
		mvMatrix = mat4.create();
		mat4.set(mvMatrixRotacion, mvMatrix); // Fijar el 000 de la posición
		mat4.translate(mvMatrix, [2*((i-30)/50) *Math.cos(2*Math.PI*i/16) + deltax ,i/20 + deltay + dys[i]*(conteo-1) + resys[i], 2*((i-30)/50)*Math.sin(2*Math.PI*i/16) + deltaz ]); // Nos movemos para dibujar
		mvPushMatrix();
		mat4.rotate(mvMatrix, grasys[i], [1, 0, 1]);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer); // Hacemos focus sobre el buffer
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
		
		gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		

		setMatrixUniforms();
		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems)
		mvPopMatrix();		
	}
	
	// Se dibujan las lineas que conecta la elipse
	mvMatrix = mat4.create();
	mat4.set(mvMatrixRotacion, mvMatrix);
	mat4.translate(mvMatrix, [ deltax ,deltay ,  deltaz ]);
	setMatrixUniforms();
	
	var vertices2 = [];
	for(var i = 0; i < 30; i++)
	{
		vertices2.push(2*((i-30)/50) *Math.cos(2*Math.PI*i/16));
		vertices2.push(i/20  + dys[i]*(conteo-1) + resys[i]);
		vertices2.push(2*((i-30)/50)*Math.sin(2*Math.PI*i/16));
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer); // Esto pone un FOCUS sobre el buffer que vamos a manejar
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices2), gl.STATIC_DRAW);
	squareVertexPositionBuffer.itemSize = 3;
	squareVertexPositionBuffer.numItems = 30;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.LINE_STRIP, 0, squareVertexPositionBuffer.numItems)
		
  }
  
  // Dibuja toda la escena
  function drawScene() 
  {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); // Creamos la ventana
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Limpiamos el canvas 	
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix); // Esto habla es de la perspectiva. 45 grados, la relación entre las dimensiones del viwport, el z minimo, el z maximo y la matriz que nos describe ls proyecciones
	
	mat4.identity(mvMatrixRotacion);
	mat4.translate(mvMatrixRotacion, [0.0 , 0.0, -10]); // Nos
	mat4.rotate(mvMatrixRotacion, degToRad(rSquare), [0, 1, 0]);
	
	mvMatrix = mat4.create();
	mat4.set(mvMatrixRotacion, mvMatrix);
	mvPushMatrix();
	mat4.translate(mvMatrix, [0.0 , 2.5, 0.0]);
	
	// La esfera superior
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, sphereVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);
	
	//Los cubos superiores
	gl.bindBuffer(gl.ARRAY_BUFFER, cubo1VertexPositionBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubo1VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	gl.bindBuffer(gl.ARRAY_BUFFER, cubo1VertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubo1VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, cubo1VertexPositionBuffer.numItems);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, cubo2VertexPositionBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubo2VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	gl.bindBuffer(gl.ARRAY_BUFFER, cubo2VertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubo2VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, cubo2VertexPositionBuffer.numItems);
	mvPopMatrix();
	
	// Todas las lineas. Es la misma desplazada y escalada
	
	mvPushMatrix();
	mat4.translate(mvMatrix, [-2 , (2.5 + (-1.3 + 29/20))/2, 0.0]);
	mat4.scale(mvMatrix, [0.0 , (3.8 - 29/20)-0.2, 0.0]);
	setMatrixUniforms();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexPositionBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, linea1VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, linea1VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.LINE_STRIP, 0, linea1VertexPositionBuffer.numItems);
	mvPopMatrix();
	
	mvPushMatrix();
	mat4.translate(mvMatrix, [2 , (2.5 + (-1 + 29/20))/2, 0.0]);
	mat4.scale(mvMatrix, [0.0 , (3.5 - 29/20), 0.0]);
	setMatrixUniforms();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexPositionBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, linea1VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, linea1VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.LINE_STRIP, 0, linea1VertexPositionBuffer.numItems);
	mvPopMatrix();
	
	mvPushMatrix();
	mat4.translate(mvMatrix, [0 , (2.5 + (-2.3 + 29/20))/2, 3]);
	mat4.scale(mvMatrix, [0.0 , (4.8 - 29/20), 0.0]);
	setMatrixUniforms();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexPositionBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, linea1VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, linea1VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.LINE_STRIP, 0, linea1VertexPositionBuffer.numItems);
	mvPopMatrix();
	
	mvPushMatrix();
	mat4.translate(mvMatrix, [0 , (2.5 + (-2 + 29/20))/2, -3]);
	mat4.scale(mvMatrix, [0.0 , (4.5 - 29/20), 0.0]);
	setMatrixUniforms();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexPositionBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, linea1VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	gl.bindBuffer(gl.ARRAY_BUFFER, linea1VertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, linea1VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.LINE_STRIP, 0, linea1VertexPositionBuffer.numItems);
	mvPopMatrix();
	
	
	
	
	//Se dibujan todas las elipsess
	drawElipse(-2,-1.3,0,1,0,0,0,0,1);
	drawElipse(2,-1,0,0,1,0,1,0.4,0.5);
	drawElipse(0,-2,-3,0,1,1,1,0,1);
	drawElipse(0,-2.3,3,1,1,0,0,1,1);
	
  }
  
function crearEsfera (radio, angulo)
{
	var vertices = [];
	for(var fi = 0; fi  <= Math.PI; fi += angulo)
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
function crearEsfera (radio, angulo)
{
	var vertices = [];
	for(var fi = 0; fi  <= Math.PI ; fi += angulo)
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

function crearCubo(longX, longY, longZ)
{
	var verticees = [];
	//Z fijo
	verticees.push(-longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(longX/2);
	verticees.push(-longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	//Y Fijo
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(-longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(-longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(longZ/2);
	
	//X fijo
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(-longX/2);
	verticees.push(longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(-longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(longX/2);
	verticees.push(-longY/2);
	verticees.push(longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(-longZ/2);
	
	verticees.push(longX/2);
	verticees.push(longY/2);
	verticees.push(longZ/2);
	
	return verticees;
}

function crearEsferaColores (radio, angulo, r1,g1,b1,r2,g2,b2)
{
	var vertices = [];
	for(var fi = 0; fi  <= Math.PI; fi += angulo)
	{
		for (var tta = 0 ; tta <= 2 * Math.PI ; tta += angulo)
		{
				var rr = 0;
				var gg = 0;
				var bb = 0;
				if(fi <= Math.PI/2)
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

