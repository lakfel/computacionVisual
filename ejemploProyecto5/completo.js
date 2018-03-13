
// Nos indican los vertices del cuadrado y el triangulo
var triangleVertexPositionBuffer;
var triangleVertexColorBuffer;
var squareVertexPositionBuffer;
var squareVertexColorBuffer;
var gl; // WEB GL
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rTri = 0;
var rSquare = 0;

  var mvMatrixStack = [];

var shaderProgram;
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
  
    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
	
	var lastTime = 0;
  function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
      var elapsed = timeNow - lastTime;

      rTri += (90 * elapsed) / 1000.0;
      rSquare += (75 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
  }
function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
  }

  function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
  }
	
function getShader(gl, id) {
      var shaderScript = document.getElementById(id);
      if (!shaderScript) {
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
      if (shaderScript.type == "x-shader/x-fragment") {
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
 
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  }
 
function webGLStart()
 {
    var canvas = document.getElementById("miCanvas");
    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

   
	
	tick();
}

function tick() {
    requestAnimFrame(tick);
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


function initBuffers() {
    triangleVertexPositionBuffer = gl.createBuffer();  // Esto crea un buffer con GL
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer); // Esto pone un FOCUS sobre el buffer que vamos a manejar
	
	var vertices = [
         0.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ]; // Creamos los vértices. Esto se maneja como un strip de triangulos. Acá no improta pero en elcuadrado si, el orden del 4 vértice.
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); // Llenamos el Buffer., Creando un array de Flots del array de vertices que ya creamos. Recordemos que esto es con el array que est[a Focus en este momento
	
	triangleVertexPositionBuffer.itemSize = 3; // JS permite darle propiedades aún así no las tenga.
    triangleVertexPositionBuffer.numItems = 3;
	
	triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 4;
    triangleVertexColorBuffer.numItems = 3;
	
	
	// Lo correspondiente con el cuadro
	
	squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0 // Esta posición es el tercer vertice del segundo triangulo junto con los dos anteriores.
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
	
	squareVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 1.0, 1.0
	];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;
	
  }
  
  
  function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); // Creamos la ventana ' Recordemos que hay varios tipos de ventanas
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Limpiamos el canvas ??	
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix); // Esto habla es de la perspectiva. 45 grados, la relación entre las dimensiones del viwport, el z minimo, el z maximo y la matriz que nos describe ls proyecciones
	
	mat4.identity(mvMatrix); // Fijar el 000 de la posición
	
	mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]); // Nos movemos para dibujar
	mvPushMatrix();
    mat4.rotate(mvMatrix, degToRad(rTri), [0, 1, 0]);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer); // Hacemos focus sobre el buffer
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems)
	mvPopMatrix();
	
	mat4.translate(mvMatrix, [3.0, 0.0, 1.0]);
	mvPushMatrix();
    mat4.rotate(mvMatrix, degToRad(rSquare), [1, -1, 1]);

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	setMatrixUniforms();
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
	mvPopMatrix();
  }