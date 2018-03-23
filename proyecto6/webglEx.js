// Esfera
var puntosEsferaPosiciones = [];
var puntosEsferaPosicionesBuffer;
var puntosEsferaColores = [];
var puntosEsferaColoresBuffer;

// Arreglo y buffer puntos movizilados
var puntosLineaPosicion = [];
var puntosLineaPositionBuffer;
var puntosLineaColorBuffer;
var puntosLineaColor = [];

// Arreglo y buffer puntos movizilados
var puntosControlPosicion = [];
var puntosControlPositionBuffer;
var puntosControlColorBuffer;
var puntosControlColor = [];

var puntos;

// Arreglo y buffer puntos para construcción de figura
var puntosConstruccionPosicion = [];
var puntosConstruccionPositionBuffer;
var puntosConstruccionColorBuffer;
var puntosConstruccionColor =[];

// Contexto
var gl; // WEB GL

// Matriz de modelo vista
var mvMatrix = mat4.create();
// Matriz de proyección.
var pMatrix = mat4.create();

//Programa
var shaderProgram;
var conteo;



var rSquare;

var dragging;
var isCursorOverPoint;
var posicionDrag;

var conteo;
var avance;
var latencia;
// Iniciación de los shaders
function initShaders()
{
	rSquare = 0;
	conteo = 0;
	avance = 1;
	latencia = 3;
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

function buscarDrag(x,y)
{
	for(var i = 1; i < puntos +1  ; i ++)
	{
		var dif1 = Math.pow(puntosControlPosicion[i*3] - x,2);
		var dif2 = Math.pow(puntosControlPosicion[i*3 + 1] - y,2);
		var tolerancia = 0.1;
		if( dif1 < tolerancia && dif2 < tolerancia)
			return i;
	}
	return -1;
}

// Función de cambio de gradoso a radianes
function degToRad(degrees) 
{
	return degrees * Math.PI / 180;
}

function calcularBufferCurva(cantidadPuntos)
{
	var vertices = [];
	var colores = [];
	var paso = 1 / cantidadPuntos;
	var conteo = 0;
	for(var i = 0; i <= 0.999 + paso ; i += paso)
	{	
		vertices.push(0);
		vertices.push(0);
		vertices.push(0);

		colores.push(0);
		colores.push(0);
		colores.push(0);
		colores.push(1);
		for(var j = 0; j < puntos + 2; j++)
		{
			vertices[conteo*3] += puntosControlPosicion[j*3] * combinations(puntos + 1, j) * Math.pow(1-i, puntos + 1 - j) *Math.pow(i,j);
			vertices[conteo*3 + 1] += puntosControlPosicion[j*3 + 1] * combinations(puntos + 1, j) * Math.pow(1-i, puntos + 1 - j) *Math.pow(i,j);
		}
		conteo ++;
	}

	return { ver:vertices, col:colores };
}



function productRange(a,b) {
  var product=a,i=a;
 
  while (i++<b) {
    product*=i;
  }
  return product;
}
 
function combinations(n,k) {
  if (n==k || k ==0) {
    return 1;
  } else {
    k=Math.max(k,n-k);
    return productRange(k+1,n)/productRange(1,n-k);
  }
}


// Función que calcula el movimiento
var lastTime = 0;
function animate() 
{
    var timeNow = new Date().getTime();
    if (lastTime != 0) 
	{
      var elapsed = timeNow - lastTime;
      rSquare += (30 * elapsed) / 1000.0;
    }
	lastTime = timeNow;
	conteo += avance;
	var rango = document.getElementById("myRange");
	if( conteo < 0)
	{
		conteo = 0;
		avance = 1;
	}
	else if(Math.floor(conteo / latencia) > rango.value)
	{
		conteo =  rango.value* latencia;
		avance = -1;
	}
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
 
function canvasToHtml(xx,yy)
{
    var canvas = document.getElementById("miCanvas");
	var canvasLT = canvas.getBoundingClientRect();
	var datos = {x:0, y:0};
	datos.x = xx*800/9.3 + canvasLT.left + 400;
	datos.y = -yy*500/5.8 + canvasLT.top + 250;;
	return datos;
}

function webGLStart()
 {
    var canvas = document.getElementById("miCanvas");
	var canvasLT = canvas.getBoundingClientRect();
	canvas.onmousedown = function(ev) 
	{  //Mouse is pressed
     var x = 9.3*(ev.clientX - canvasLT.left-400)/800;
     var y = -5.8*(ev.clientY - canvasLT.top-250)/500;
	
	 posicionDrag = buscarDrag(x,y);
	
	 
     dragging = posicionDrag > 0;
 
     
   };
 
   canvas.onmouseup = function(ev){ //Mouse is released
     dragging = false;
   };
 
   canvas.onmousemove = function(ev) { //Mouse is moved
     var x = 9.3*(ev.clientX - canvasLT.left-400)/800;
     var y = -5.8*(ev.clientY - canvasLT.top-250)/500;
     if(dragging) 
	{
		puntosControlPosicion[posicionDrag*3] = x;
		puntosControlPosicion[posicionDrag*3 + 1] = y;

		/*var iDiv = document.getElementById('pun' + posicionDrag);
		var dat = canvasToHtml(x,y);
		iDiv.style.top = (dat.y+20) + "px";
		iDiv.style.left = dat.x+ "px";*/
    }
 
   };


		
    initGL(canvas); // Se inicia el contexto
    initShaders(); // Se inicia los shaders
    initBuffers(); // Inicia los buffers

    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.enable(gl.DEPTH_TEST);
	
	puntos = 0;

	document.getElementById("btnMas").addEventListener("click",function()
	{

		var xx = Math.random()*6 - 3;
		var yy = Math.random()*5 - 2.5;
		puntosControlPosicion.splice(3 + 3*puntos, 0 , xx);
		puntosControlPosicion.splice(4 + 3*puntos, 0 , yy);
		puntosControlPosicion.splice(5 + 3*puntos, 0 , 0);

		puntosControlColor.splice(4 + 4*puntos, 0 , 0);
		puntosControlColor.splice(5 + 4*puntos, 0 , 0);
		puntosControlColor.splice(6 + 4*puntos, 0 , 0);
		puntosControlColor.splice(7 + 4*puntos, 0 , 1);

		puntos++;

		/*var iDiv = document.createElement('div');
		iDiv.id = 'pun' + puntos;
		iDiv.innerHTML = 'P' + puntos;
		var dat = canvasToHtml(xx,yy);
		iDiv.style.position = 'absolute';
		iDiv.style.top = (dat.y+20) + "px";
		iDiv.style.left = dat.x+ "px";
		document.getElementsByTagName('body')[0].appendChild(iDiv);*/
		
	});

	document.getElementById("btnMenos").addEventListener("click",function()
	{
		puntos--;
		if(puntos >= 0)
		{
			puntosControlPosicion.splice(3 + 3*puntos,1);
			puntosControlPosicion.splice(3 + 3*puntos,1);
			puntosControlPosicion.splice(3 + 3*puntos,1);

			puntosControlColor.splice(4 + 4*puntos,1);
			puntosControlColor.splice(4 + 4*puntos,1);
			puntosControlColor.splice(4 + 4*puntos,1);
			puntosControlColor.splice(4 + 4*puntos,1);
		}
		else
		{
			puntos = 0;
		}
	});

	conteo = 0;
	tick();
}

function tick() 
{
    requestAnimFrame(tick);
	
	draw();
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
	puntosConstruccionColor = [];
	puntosConstruccionColorBuffer = gl.createBuffer();


	puntosConstruccionPosicion = [];
	puntosConstruccionPositionBuffer = gl.createBuffer();
	
	puntosControlPosicion = [-4,0,0,4,0,0];
	puntosControlPositionBuffer = gl.createBuffer();	

	puntosControlColor = [1,0,0,1,1,0,0,1];
	puntosControlColorBuffer = gl.createBuffer();	
	
	puntosLineaPosicion = [];
	puntosLineaPositionBuffer= gl.createBuffer();	
	puntosLineaColorBuffer= gl.createBuffer();	
	puntosLineaColor = [];

	
	puntosEsferaPosiciones = crearEsfera(1, Math.PI/32);
	puntosEsferaPosicionesBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, puntosEsferaPosicionesBuffer); // Hacemos focus sobre el buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(puntosEsferaPosiciones), gl.STATIC_DRAW);
	puntosEsferaPosicionesBuffer.itemSize = 3;
	puntosEsferaPosicionesBuffer.numItems = puntosEsferaPosiciones.length/3;


    puntosEsferaColores = crearEsferaColores(1, Math.PI/32, 0.5, 0.5 , 0 , 0  , 0.2, 0.5);
	puntosEsferaColoresBuffer = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, puntosEsferaColoresBuffer); // Hacemos focus sobre el buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(puntosEsferaColores), gl.STATIC_DRAW);
	puntosEsferaColoresBuffer.itemSize = 3;
	puntosEsferaColoresBuffer.numItems = puntosEsferaColores.length/3;
	
  }
  
  
  // Dibuja toda la escena
  function draw() 
  {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); // Creamos la ventana
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Limpiamos el canvas 	
  
	
	pMatrix = mat4.create();
	mvMatrix = mat4.create();
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -7.0]);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix); 
			
	
	
	
	
	gl.bindBuffer(gl.ARRAY_BUFFER, puntosControlPositionBuffer); // Hacemos focus sobre el buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(puntosControlPosicion), gl.STATIC_DRAW);
	puntosControlPositionBuffer.itemSize = 3;
	puntosControlPositionBuffer.numItems = puntosControlPosicion.length/3;
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, puntosControlPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //
	
	gl.bindBuffer(gl.ARRAY_BUFFER, puntosControlColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(puntosControlColor), gl.STATIC_DRAW);
	puntosControlColorBuffer.itemSize = 4;
	puntosControlColorBuffer.numItems = puntosControlColor.length/4;
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, puntosControlColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	setMatrixUniforms();
		
	
	gl.drawArrays(gl.POINTS, 0, puntosControlPositionBuffer.numItems);
	var rango = document.getElementById("myRange");
	var lblrango = document.getElementById("lblPuntos");
	lblrango.innerHTML = rango.value;
    var curva =  calcularBufferCurva (rango.value);
	
	latencia = 60/rango.value;

    puntosLineaPosicion = curva.ver;
	gl.bindBuffer(gl.ARRAY_BUFFER, puntosLineaPositionBuffer); // Hacemos focus sobre el buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(puntosLineaPosicion), gl.STATIC_DRAW);
	puntosLineaPositionBuffer.itemSize = 3;
	puntosLineaPositionBuffer.numItems = puntosLineaPosicion.length/3;
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, puntosLineaPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    puntosLineaColor = curva.col;
	gl.bindBuffer(gl.ARRAY_BUFFER, puntosLineaColorBuffer); // Hacemos focus sobre el buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(puntosLineaColor), gl.STATIC_DRAW);
	puntosLineaColorBuffer.itemSize = 4;
	puntosLineaColorBuffer.numItems = puntosLineaColorBuffer.length/4;
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, puntosLineaColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	
	setMatrixUniforms();

	gl.drawArrays(gl.LINE_STRIP, 0, puntosLineaPositionBuffer.numItems);
	
	
	var posicion = Math.floor(conteo / latencia);
	mat4.translate(mvMatrix, [puntosLineaPosicion[posicion*3],puntosLineaPosicion[posicion*3 +1],0]);
	mat4.rotate(mvMatrix, degToRad(rSquare), [1,1,0]);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, puntosEsferaPosicionesBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, puntosEsferaPosicionesBuffer.itemSize, gl.FLOAT, false, 0, 0);


	gl.bindBuffer(gl.ARRAY_BUFFER, puntosEsferaColoresBuffer); // Hacemos focus sobre el buffer
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, puntosEsferaColoresBuffer.itemSize, gl.FLOAT, false, 0, 0);

	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLES, 0, puntosEsferaPosicionesBuffer.numItems);

	
	


  }
  
function crearEsfera (radio, angulo)
{
	var vertices = [];
	for(var fi = 0; fi  <= Math.PI ; fi += angulo)
	{
		for (var tta = 0 ; tta <= 2 * Math.PI ; tta += angulo)
		{
				var Z1 = radio * Math.cos(fi - angulo)/2;
				var X1 = radio * Math.sin(fi - angulo)* Math.cos(tta - angulo)/4;
				var Y1 = radio * Math.sin(fi - angulo)* Math.sin(tta - angulo)/5;
				
				var X2 = radio * Math.sin(fi - angulo)* Math.cos(tta)/4;
				var Y2 = radio * Math.sin(fi - angulo)* Math.sin(tta)/8;
				
				var Z2 = radio * Math.cos(fi);
				var X3 = radio * Math.sin(fi)* Math.cos(tta - angulo)/4;
				var Y3 = radio * Math.sin(fi)* Math.sin(tta - angulo)/8;
				
				var X4 = radio * Math.sin(fi)* Math.cos(tta)/4;
				var Y4 = radio * Math.sin(fi)* Math.sin(tta)/8;
				
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

