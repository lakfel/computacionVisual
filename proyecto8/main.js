    var gl;
	var sep = 35;
    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) 
		{
				alert("ERROR");
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }


    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
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


    var shaderProgram;
	
	
	
	var cantLuces = 9;

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

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
        shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
		shaderProgram.lucesShad = new Array(cantLuces);
		for(var i = 0 ; i < cantLuces; i ++)
		{
			shaderProgram.lucesShad[i] = {
				
				enable : gl.getUniformLocation(shaderProgram, "luces[" + i + "].enable"),
				pointLightingLocation : gl.getUniformLocation(shaderProgram, "luces[" + i + "].pointLightingLocation"),
				pointLightingColor: gl.getUniformLocation(shaderProgram, "luces[" + i + "].pointLightingColor"),
				attenuation: gl.getUniformLocation(shaderProgram, "luces[" + i + "].attenuation"),
				spotDirection: gl.getUniformLocation(shaderProgram, "luces[" + i + "].spotDirection"),
				spotCosineCutoff: gl.getUniformLocation(shaderProgram, "luces[" + i + "].spotCosineCutoff"),
				spotExponent: gl.getUniformLocation(shaderProgram, "luces[" + i + "].spotExponent")
			};
		}

		luces = new Array(cantLuces -1);	
		
		for(var i = 0 ; i < cantLuces - 1; i ++)
		{
			var n1 = Math.floor(Math.random() + 0.5);
			var n2 = Math.floor(Math.random() + 0.5);
			var n3 = Math.floor(Math.random() + 0.5);

			luces[i] = 
			{
				//posicion :[sep*Math.cos(2*Math.PI*i/cantLuces), 0.7*sep, sep*Math.sin(2*Math.PI*i/cantLuces)],
				posicion:[0,0.7*sep,0],
				pointLightingColor : [0.1 +  n1 *0.5*Math.random(), 0.1 + n2*0.5*Math.random(),0.1 + n3* 0.5*Math.random()],
				attenuation : 0,
				spotDirectionActual : [-sep*Math.cos(2*Math.PI*i/cantLuces + Math.PI/8), -0.7*sep, -sep*Math.sin(2*Math.PI*i/cantLuces )],
				//spotDirectionActual : [0,-1,0],
				spotDirectionDestino : [ 0.7*(Math.random()*2 - 1)* sep, -0.7*sep , 0.7*(Math.random()*2 - 1)* sep],
				spotCosineCutoff : 0.95,
				spotExponent : 40
			};
		}
		/*luces[0].posicion = [-2*sep,2*sep,-2*sep];
		luces[1].posicion = [-2*sep,2*sep,2*sep];
		luces[2].posicion = [2*sep,2*sep,-2*sep];
		luces[3].posicion = [2*sep,2*sep,2*sep];

		luces[0].pointLightingColor = [0.9,0.1,0.1];
		luces[1].pointLightingColor = [0.1,0.9,0.1];
		luces[2].pointLightingColor = [0.1,0.1,0.9];
		luces[3].pointLightingColor = [0.9,0.1,0.9];

		luces[0].attenuation = 0.05;
		luces[1].attenuation = 0.05;
		luces[2].attenuation = 0.05;
		luces[3].attenuation = 0.05;

		luces[0].spotDirectionDestino = []*/
    }


    function handleLoadedTexture(texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		//gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
        //gl.bindTexture(gl.TEXTURE_2D, null);
    }


    var canTextures = [];
	var topCanTexture;
	var bottomCanTexture;
	var ballTexture;
	var floorTexture;
	var sceneTexture;

    function initTexture() 
	{
		
		var temp = ["proyecto7/cocacolaCan.jpg","proyecto7/cocacolaCan2.png","proyecto7/cocacolaCan3.jpg","proyecto7/cocacolaCan4.png","proyecto7/cocacolaCan5.jpg","proyecto7/cocacolaCan6.png","proyecto7/cocacolaCan7.jpg"];
		
		var canTexture;
		canTexture = gl.createTexture();
		canTexture.image = new Image();
		canTexture.image.onload = function () {
			handleLoadedTexture(canTexture)
		}
		canTexture.image.src = temp[0];
		canTextures.push(canTexture);
		
		var canTexture2;
		canTexture2 = gl.createTexture();
		canTexture2.image = new Image();
		canTexture2.image.onload = function () {
			handleLoadedTexture(canTexture2)
		}
		canTexture2.image.src = temp[1];
		canTextures.push(canTexture2);
		
		var canTexture3;
		canTexture3 = gl.createTexture();
		canTexture3.image = new Image();
		canTexture3.image.onload = function () {
			handleLoadedTexture(canTexture3)
		}
		canTexture3.image.src = temp[2];
		canTextures.push(canTexture3);
	
		var canTexture4;
		canTexture4 = gl.createTexture();
		canTexture4.image = new Image();
		canTexture4.image.onload = function () {
			handleLoadedTexture(canTexture4)
		}
		canTexture4.image.src = temp[3];
		canTextures.push(canTexture4);
		
		var canTexture5;
		canTexture5 = gl.createTexture();
		canTexture5.image = new Image();
		canTexture5.image.onload = function () {
			handleLoadedTexture(canTexture5)
		}
		canTexture5.image.src = temp[4];
		canTextures.push(canTexture5);
		
		var canTexture6;
		canTexture6 = gl.createTexture();
		canTexture6.image = new Image();
		canTexture6.image.onload = function () {
			handleLoadedTexture(canTexture6)
		}
		canTexture6.image.src = temp[5];
		canTextures.push(canTexture6);
		
		var canTexture7;
		canTexture7 = gl.createTexture();
		canTexture7.image = new Image();
		canTexture7.image.onload = function () {
			handleLoadedTexture(canTexture7)
		}
		canTexture7.image.src = temp[6];
		canTextures.push(canTexture7);
        
		
		topCanTexture = gl.createTexture();
        topCanTexture.image = new Image();
        topCanTexture.image.onload = function () {
            handleLoadedTexture(topCanTexture)
        }

        topCanTexture.image.src = "proyecto7/topCan.jpg";
		
		bottomCanTexture = gl.createTexture();
        bottomCanTexture.image = new Image();
        bottomCanTexture.image.onload = function () {
            handleLoadedTexture(bottomCanTexture)
        }

        bottomCanTexture.image.src = "proyecto7/bottomCan.jpg";
		
		ballTexture = gl.createTexture();
        ballTexture.image = new Image();
        ballTexture.image.onload = function () {
            handleLoadedTexture(ballTexture)
        }

        //ballTexture.image.src = "proyecto7/soccerBall.png";
		ballTexture.image.src = "proyecto7/soccerBall3.jpg";
		//ballTexture.image.src = "proyecto7/soccerBall2.jpg";


		floorTexture = gl.createTexture();
        floorTexture.image = new Image();
        floorTexture.image.onload = function () {
            handleLoadedTexture(floorTexture)
        }

		floorTexture.image.src = "proyecto8/grass2.jpg";
		
		sceneTexture = gl.createTexture();
        sceneTexture.image = new Image();
        sceneTexture.image.onload = function () {
            handleLoadedTexture(sceneTexture)
        }

		//sceneTexture.image.src = "proyecto7/tribuna.jpg";
		//sceneTexture.image.src = "proyecto7/cielo2.jpg";
		sceneTexture.image.src = "proyecto7/estadio2.jpg";
		
    }


    var mvMatrix = mat4.create();
    var mvMatrixStack = [];
    var pMatrix = mat4.create();

	

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


    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
		
		var normalMatrix = mat3.create();
        mat4.toInverseMat3(mvMatrix, normalMatrix);
        mat3.transpose(normalMatrix);
        gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
    }


    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    var canVertexPositionBuffer;
    var canVertexTextureCoordBuffer;
    var canVertexIndexBuffer;
	var canVertexNormalBuffer;
	
	var canTopVertexPositionBuffer;
    var canTopVertexTextureCoordBuffer;
    var canTopVertexIndexBuffer;
	var canTopVertexNormalBuffer;

	var canBottomVertexPositionBuffer;
    var canBottomVertexTextureCoordBuffer;
    var canBottomVertexIndexBuffer;
	var canBottomVertexNormalBuffer;
	
	var ballVertexPositionBuffer;
    var ballVertexTextureCoordBuffer;
    var ballVertexIndexBuffer;
	var ballVertexNormalBuffer;

	var floorVertexPositionBuffer;
    var floorVertexTextureCoordBuffer;
    var floorVertexIndexBuffer;
	var floorVertexNormalBuffer;

	var sceneVertexPositionBuffer;
    var sceneVertexTextureCoordBuffer;
    var sceneVertexIndexBuffer;
	var sceneVertexNormalBuffer;

	
	var lataCompleta;
	var ejeLata;
	var controlLata;
	var controlLataInicial;
	var controlLataFinal;
	var controlTopLata;
	var aumento;
	var signo;
	var conteo;

	
	var puntosRecorridoBola;
	var posicionesLatas = [];
	var rotacionesLatas = [];
	var cantidadLatas;
	var latasJugando= [0,0];
	var conteoBola;
	var jugada;
	var dimensionGrass;
	var recorridosBola = [];
	var posturasLatas = {};
	var estadosLatas = [];
	var figurasLatas = [];
	
    function initBuffers() 
	{
		conteoBola = 0;
		var lata = null;
		var tapa = null;
		var bola = null;
		var fondo = null;
		posturasLatas.idle = [];
		posturasLatas.golpes = [];
		var nb = calcularBufferCurva(5 ,[0.4,0,0,0.8,3,1,0.4,8,0.4,0.3,12,0.1]);
		posturasLatas.idle.push(nb.ver);
		nb = calcularBufferCurva(5 ,[-0.2,0,0,0.4,4,-0.4,0,8,-0.6,0.1,12,-0.6]);
		posturasLatas.idle.push(nb.ver);
		nb = calcularBufferCurva(5 ,[0.4,0,0,-0.1,4,0,-0.2,8,0.1,0,12,0]);
		posturasLatas.idle.push(nb.ver);
		nb = calcularBufferCurva(5 ,[0,0,0,0,4,0,0,8,-4.5,0,12,-10]);
		posturasLatas.golpes.push(nb.ver);
		nb = calcularBufferCurva(5 ,[6,4,0,2,11,0,-2,11,0,-6,4,0]);
		posturasLatas.golpes.push(nb.ver);
		nb = calcularBufferCurva(5 ,[0,0,0,0,4,-0.5,0,8,0,0,12,10]);
		posturasLatas.golpes.push(nb.ver);
		nb = calcularBufferCurva(5 ,[0,12,0,-5,2,0,0,2,0,14,12,0]);
		posturasLatas.golpes.push(nb.ver);
		

		cantidadLatas = 8;
		
		configurarLatas();

		

		
		bola = crearEsfera(20, 2.4);
		
		controlTopLata = calcularBufferCurva(10, [-2,0.0,2,0,4,0,2,0.0,-2]);
		conteo = 0;
		aumento = 1;

		ejeLata = calcularBufferCurva(15, [0.0,0,0.0,0,15,0, 5,5.5,0.5]);

		lataCompleta = new cilindro(15,2.5,3.5,4, ejeLata.ver);
		lataCompleta.crearCilindro();
		lata = lataCompleta.cilindro;
		tapa = lataCompleta.tapa;
		fondo = lataCompleta.fondo;
	
		//tribuna
		
	
		
		var aroTribuna = crearAro(36, 200, 120);
		//var aroTribuna = crearEsfera(36, 110);
		
		sceneVertexPositionBuffer = gl.createBuffer()
		dimensionGrass = 3;
		var vertices = aroTribuna.vertices;
		gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        sceneVertexPositionBuffer.itemSize = 3;
        sceneVertexPositionBuffer.numItems = vertices.length/3;
	
		sceneVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexTextureCoordBuffer);
        var textureCoords= aroTribuna.textCords;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        sceneVertexTextureCoordBuffer.itemSize = 2;
        sceneVertexTextureCoordBuffer.numItems = textureCoords.length/2	;

		sceneVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexNormalBuffer);
        var normalVertex = aroTribuna.normales;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        sceneVertexNormalBuffer.itemSize = 3;
        sceneVertexNormalBuffer.numItems = normalVertex.length/3;
		
		sceneVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sceneVertexIndexBuffer);
        var vertexIndices = aroTribuna.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        sceneVertexIndexBuffer.itemSize = 1;
        sceneVertexIndexBuffer.numItems = vertexIndices.length
		
		
		// Piso
		floorVertexPositionBuffer = gl.createBuffer();
		dimensionGrass = 6;
		var ofY = -0.4;
		vertices = [-dimensionGrass,ofY,-dimensionGrass,-dimensionGrass,ofY,dimensionGrass,dimensionGrass,ofY,dimensionGrass,dimensionGrass,ofY,-dimensionGrass];
		gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        floorVertexPositionBuffer.itemSize = 3;
        floorVertexPositionBuffer.numItems = vertices.length/3;
	
		floorVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexTextureCoordBuffer);
        textureCoords= [0,0,0,1,1,1,1,0];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        floorVertexTextureCoordBuffer.itemSize = 2;
        floorVertexTextureCoordBuffer.numItems = textureCoords.length/2	;

		floorVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexNormalBuffer);
        normalVertex = [0.0 , 1.0 , 0.0, 0.0, 1.0, 0.0,0.0 , 1.0 , 0.0, 0.0, 1.0, 0.0];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        floorVertexNormalBuffer.itemSize = 3;
        floorVertexNormalBuffer.numItems = normalVertex.length/3;
		
		floorVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorVertexIndexBuffer);
        vertexIndices = [0,1,2,2,0,3];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        floorVertexIndexBuffer.itemSize = 1;
        floorVertexIndexBuffer.numItems = vertexIndices.length
		

        vertices =  lata.vertices;
		
		//  --------- CREACION DE LOS BUFFERS
	
		// CILINDRO
        canVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        canVertexPositionBuffer.itemSize = 3;
        canVertexPositionBuffer.numItems = vertices.length/3;

        canVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexTextureCoordBuffer);
        textureCoords= lata.textCords;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        canVertexTextureCoordBuffer.itemSize = 2;
        canVertexTextureCoordBuffer.numItems = textureCoords.length/2	;

		canVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexNormalBuffer);
        normalVertex = lata.normales;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        canVertexNormalBuffer.itemSize = 3;
        canVertexNormalBuffer.numItems = normalVertex.length/3;
		
        canVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canVertexIndexBuffer);
        vertexIndices =lata.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        canVertexIndexBuffer.itemSize = 1;
        canVertexIndexBuffer.numItems = vertexIndices.length;
		

		// TAPA
		canTopVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,canTopVertexPositionBuffer);
		vertices = tapa.vertices;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		canTopVertexPositionBuffer.itemSize = 3;
		canTopVertexPositionBuffer.numItems = vertices.length/3;
		
		canTopVertexTextureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,canTopVertexTextureCoordBuffer);
		textureCoords = tapa.textCords;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		canTopVertexTextureCoordBuffer.itemSize = 2;
        canTopVertexTextureCoordBuffer.numItems = textureCoords.length/2	;
		
		canTopVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, canTopVertexNormalBuffer);
        normalVertex = tapa.normales;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        canTopVertexNormalBuffer.itemSize = 3;
        canTopVertexNormalBuffer.numItems = normalVertex.length/3;
		
		canTopVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canTopVertexIndexBuffer);
		vertexIndices = tapa.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        canTopVertexIndexBuffer.itemSize = 1;
        canTopVertexIndexBuffer.numItems = vertexIndices.length;
		
		//FONDO
		canBottomVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,canBottomVertexPositionBuffer);
		vertices = fondo.vertices;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		canBottomVertexPositionBuffer.itemSize = 3;
		canBottomVertexPositionBuffer.numItems = vertices.length/3;
		
		canBottomVertexTextureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,canBottomVertexTextureCoordBuffer);
		textureCoords = fondo.textCords;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		canBottomVertexTextureCoordBuffer.itemSize = 2;
        canBottomVertexTextureCoordBuffer.numItems = textureCoords.length/2	;
		
		canBottomVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, canBottomVertexNormalBuffer);
        normalVertex = fondo.normales;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        canBottomVertexNormalBuffer.itemSize = 3;
        canBottomVertexNormalBuffer.numItems = normalVertex.length/3;
		
		canBottomVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canBottomVertexIndexBuffer);
		vertexIndices = fondo.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        canBottomVertexIndexBuffer.itemSize = 1;
        canBottomVertexIndexBuffer.numItems = vertexIndices.length;
		

       // BOLA
		ballVertexPositionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,ballVertexPositionBuffer);
		vertices = bola.vertices;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		ballVertexPositionBuffer.itemSize = 3;
		ballVertexPositionBuffer.numItems = vertices.length/3;
		
		ballVertexTextureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,ballVertexTextureCoordBuffer);
		textureCoords = bola.textCords;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		ballVertexTextureCoordBuffer.itemSize = 2;
        ballVertexTextureCoordBuffer.numItems = textureCoords.length/2	;
		
		ballVertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, ballVertexNormalBuffer);
        normalVertex = bola.normales;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        ballVertexNormalBuffer.itemSize = 3;
        ballVertexNormalBuffer.numItems = normalVertex.length/3;
		
		ballVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ballVertexIndexBuffer);
		vertexIndices = bola.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        ballVertexIndexBuffer.itemSize = 1;
        ballVertexIndexBuffer.numItems = vertexIndices.length;
		
		
		
    }
	


	function updateCan(verUp)
	{	
		/*
		conteo += aumento;
		if(conteo == 0)
		{
			aumento = 1;
		}
		else if(conteo == controlTopLata.ver.length/3)
		{
			aumento = -1;
		}

		ejeLata = calcularBufferCurva(30, [0.0,-1.25,0.0,0,4,0,controlTopLata.ver[3*conteo],controlTopLata.ver[3*conteo+1],controlTopLata.ver[3*conteo+2]]);
		lataCompleta.actualizarCilindro(ejeLata.ver);
		*/
		var lata = null;
		var tapa = null;
		var fondo = null;

		lata = lataCompleta.cilindro;
		tapa = lataCompleta.tapa;
		fondo = lataCompleta.fondo;
		

		var vertices = lata.vertices;
		gl.bindBuffer(gl.ARRAY_BUFFER, canVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        canVertexPositionBuffer.itemSize = 3;
        canVertexPositionBuffer.numItems = vertices.length/3;

        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexTextureCoordBuffer);
        var textureCoords= lata.textCords;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        canVertexTextureCoordBuffer.itemSize = 2;
        canVertexTextureCoordBuffer.numItems = textureCoords.length/2	;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canVertexIndexBuffer);
        var vertexIndices =lata.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        canVertexIndexBuffer.itemSize = 1;
        canVertexIndexBuffer.numItems = vertexIndices.length;
		
        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexNormalBuffer);
        var normalVertex = lata.normales;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        canVertexNormalBuffer.itemSize = 3;
        canVertexNormalBuffer.numItems = normalVertex.length/3;
		

		// TAPA
		gl.bindBuffer(gl.ARRAY_BUFFER,canTopVertexPositionBuffer);
		vertices = tapa.vertices;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		canTopVertexPositionBuffer.itemSize = 3;
		canTopVertexPositionBuffer.numItems = vertices.length/3;
		
		gl.bindBuffer(gl.ARRAY_BUFFER,canTopVertexTextureCoordBuffer);
		textureCoords = tapa.textCords;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		canTopVertexTextureCoordBuffer.itemSize = 2;
        canTopVertexTextureCoordBuffer.numItems = textureCoords.length/2	;
		
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canTopVertexIndexBuffer);
		vertexIndices = tapa.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        canTopVertexIndexBuffer.itemSize = 1;
        canTopVertexIndexBuffer.numItems = vertexIndices.length;
		
        gl.bindBuffer(gl.ARRAY_BUFFER, canTopVertexNormalBuffer);
        normalVertex = tapa.normales;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        canTopVertexNormalBuffer.itemSize = 3;
        canTopVertexNormalBuffer.numItems = normalVertex.length/3;

		//FONDO
		gl.bindBuffer(gl.ARRAY_BUFFER,canBottomVertexPositionBuffer);
		vertices = fondo.vertices;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		canBottomVertexPositionBuffer.itemSize = 3;
		canBottomVertexPositionBuffer.numItems = vertices.length/3;
		
		gl.bindBuffer(gl.ARRAY_BUFFER,canBottomVertexTextureCoordBuffer);
		textureCoords = fondo.textCords;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
		canBottomVertexTextureCoordBuffer.itemSize = 2;
        canBottomVertexTextureCoordBuffer.numItems = textureCoords.length/2	;
		
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canBottomVertexIndexBuffer);
		vertexIndices = fondo.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
        canBottomVertexIndexBuffer.itemSize = 1;
        canBottomVertexIndexBuffer.numItems = vertexIndices.length;
	
        gl.bindBuffer(gl.ARRAY_BUFFER, canBottomVertexNormalBuffer);
        normalVertex = fondo.normales;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVertex), gl.STATIC_DRAW);
        canBottomVertexNormalBuffer.itemSize = 3;
        canBottomVertexNormalBuffer.numItems = normalVertex.length/3;
		
	}

    var xRot = 0;
    var yRot = 0;
    var zRot = 0;
	var yRot2 =-10;
	
	var rotacionBola = [0,0,0];

    function drawScene()
	{
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 400.0, pMatrix);
		
		//Esta parte se esta adicionando para la luz
		gl.uniform3f(shaderProgram.ambientColorUniform, 0.05,0.05 ,0.05); // COLOR AMBIENTE
		gl.uniform3f(shaderProgram.lucesShad[0].pointLightingLocation,0, distSol*Math.cos(conteoSol), distSol*Math.sin(conteoSol)); // POSICION COLOR
 //gl.uniform3f(shaderProgram.lucesShad[0].pointLightingColor, 0.0,0.0,0.0);
        gl.uniform3f(shaderProgram.lucesShad[0].pointLightingColor, 0.7 * Math.max(Math.cos(conteoSol),0),0.7 * Math.max(Math.cos(conteoSol),0),0.3 * Math.max(Math.cos(conteoSol),0));
		gl.uniform1f(shaderProgram.lucesShad[0].attenuation, 0.02);


		
			
			
		gl.uniform3fv(shaderProgram.lucesShad[0].spotDirection, [0.0, -1.0, 0.0]);
		gl.uniform1f(shaderProgram.lucesShad[0].spotCosineCutoff, 0);
		gl.uniform1f(shaderProgram.lucesShad[0].spotExponent , 6);
		
		for (var i =0; i< cantLuces - 1; i++)
		{
			var cont = 0;
			for (var j =0; j < 3 ; j++)
			{
				if(Math.abs(luces[i].spotDirectionActual[j] - luces[i].spotDirectionDestino[j]) > 0.81)
				{
					cont++;
					if(luces[i].spotDirectionActual[j] - luces[i].spotDirectionDestino[j] > 0)
					{
						luces[i].spotDirectionActual[j] -= 0.8;
					}					
					else
					{
						luces[i].spotDirectionActual[j] += 0.8;
					}
				}
			}
			if(cont == 0)
			{
				luces[i].spotDirectionDestino = [ (Math.random()*3 - 1.5)* sep, -0.7*sep , (Math.random()*2 - 1.5)* sep];
			}
			gl.uniform3fv(shaderProgram.lucesShad[i+1].pointLightingLocation, luces[i].posicion); // POSICION COLOR
			gl.uniform3fv(shaderProgram.lucesShad[i+1].pointLightingColor, luces[i].pointLightingColor);
			gl.uniform1f(shaderProgram.lucesShad[i+1].attenuation, luces[i].attenuation);
			gl.uniform3fv(shaderProgram.lucesShad[i+1].spotDirection, luces[i].spotDirectionActual);
			gl.uniform1f(shaderProgram.lucesShad[i+1].spotCosineCutoff, luces[i].spotCosineCutoff);
			gl.uniform1f(shaderProgram.lucesShad[i+1].spotExponent , luces[i].spotExponent);
			
		}


		//mat4.translate(pMatrix, [0.0, conteoDeg - 15	, -90.0]);
		mat4.translate(pMatrix, [0.0, -10	, -90.0]);
		//mat4.rotate(pMatrix, degToRad(conteoDeg), [1, 0, 0]);
		mat4.rotate(pMatrix, degToRad(15), [1, 0, 0]);
		mat4.rotate(pMatrix, degToRad(yRot2), [0, 1, 0]);
		mat4.translate(pMatrix, [0.0, 4, 0.0]);
		//mat4.translate(pMatrix, [0.0, 0.0, -10.0]);
		
        mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, [0.0, 0 , 20.0]);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sceneVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sceneVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		
		gl.bindBuffer(gl.ARRAY_BUFFER, sceneVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sceneVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sceneVertexIndexBuffer);
        setMatrixUniforms();
		mvPushMatrix();
		mat4.translate(mvMatrix,[0,100,0]);
		setMatrixUniforms();
		gl.drawElements(gl.TRIANGLES, sceneVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		mvPopMatrix();
	
			
		gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, floorVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, floorVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, floorVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

		
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorVertexIndexBuffer);
        setMatrixUniforms();
		for(var i = -15; i <= 15; i++)
		{
			for(var j = -15; j < 15; j++)
			{
				mvPushMatrix();
				mat4.translate(mvMatrix,[2*i*dimensionGrass,0,2*j*dimensionGrass]);
				setMatrixUniforms();
				gl.drawElements(gl.TRIANGLES, floorVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
				mvPopMatrix();
			}
		}
        mat4.identity(mvMatrix);

		
		var pasAu = 0.00005;
		var pasAu2 = 0.00001;
		//conteoBola+= ((cantidadLatas - recorridosBola[latasJugando[0]].destinos[latasJugando[1]].norma)*3)/3;
		if(conteoBola >= 40 && conteoBola <=105)
		{
			pasAu = (((cantidadLatas - recorridosBola[latasJugando[0]].destinos[latasJugando[1]].norma)*0.5)/3)*6/cantidadLatas;			
		}
		else if(conteoBola >= 105)
		{
			pasAu = (((cantidadLatas - recorridosBola[latasJugando[0]].destinos[latasJugando[1]].norma)*0.7)/3)*6/cantidadLatas
			
		}
		
		
		for(var i = 0; i < cantidadLatas; i++)
		{
			
			var contM = 0.055;
			var contM2 = 0.01;
			
			if(latasJugando[1] == i  )
			{
				contM = pasAu;
				contM2 = pasAu2;
				
			}
			if( latasJugando[0] == i && conteoBola <100)
			{
				contM = pasAu*0.65;
				contM2 = pasAu2;
				
			}
			
			mvPushMatrix();
			mat4.translate(mvMatrix, [posicionesLatas[i*3],posicionesLatas[i*3+1],posicionesLatas[i*3+2]]);
			var cuantos = 0;
			for(var j = 0; j < estadosLatas[i].actual.length;j++)
			{
				if(Math.abs(estadosLatas[i].actual[j] - estadosLatas[i].destino[j]) < contM + contM2)
				{
					estadosLatas[i].actual[j] = estadosLatas[i].destino[j];
					cuantos ++;
				}
				else if(estadosLatas[i].actual[j] > estadosLatas[i].destino[j] )
				{
					estadosLatas[i].actual[j] -= contM;
				}
				else if(estadosLatas[i].actual[j] < estadosLatas[i].destino[j] )
				{
					estadosLatas[i].actual[j] += contM;
				}
			}
			if(cuantos >= estadosLatas[i].actual.length -1)
			{
				var pp = Math.random()*3;
				pp = Math.floor(pp);
				var copy = posturasLatas.idle[pp].slice();
				estadosLatas[i].destino = copy;
			}
			lataCompleta.actualizarCilindro(estadosLatas[i].actual);	
			mat4.rotate(mvMatrix, rotacionesLatas[i] + Math.PI/2, [0, 1, 0]);
			updateCan();
			drawCan(canTextures[figurasLatas[i]]);
			mvPopMatrix();
		}
       
		
		conteoBola+= ((cantidadLatas - recorridosBola[latasJugando[0]].destinos[latasJugando[1]].norma)*6)/cantidadLatas;
		
		if(conteoBola >= puntosRecorridoBola.ver.length/3)
		{
			jugada = Math.floor(Math.random()*2);
			latasJugando[0] = latasJugando[1];
			while(latasJugando[1] == latasJugando[0])
			{
				latasJugando[1] = Math.random() * (cantidadLatas);
				latasJugando[1] = Math.floor(latasJugando[1]);
			}
			conteoBola = 0;
			puntosRecorridoBola = recorridosBola[latasJugando[0]].destinos[latasJugando[1]].curva;
	
			rotacionBola = [Math.random()*Math.PI/128,Math.random()*Math.PI/128,Math.random()*Math.PI/128];
		}
		else if(Math.floor(conteoBola) >= 40 && Math.floor(conteoBola) <= 105)
		{
			var copy = posturasLatas.golpes[jugada].slice();
			estadosLatas[latasJugando[1]].destino = copy;
			
		}
		else if(Math.floor(conteoBola) >= 105)
		{
			var copy = posturasLatas.golpes[2 + jugada].slice();
			estadosLatas[latasJugando[1]].destino = copy;
			
		}
		mat4.translate(mvMatrix, [puntosRecorridoBola.ver[Math.floor(conteoBola)*3], puntosRecorridoBola.ver[Math.floor(conteoBola)*3+1], puntosRecorridoBola.ver[Math.floor(conteoBola)*3 +2]]);
		
		
		//mat4.rotate(mvMatrix, degToRad(xRot/20), [1, 0, 0]);
        //mat4.rotate(mvMatrix, degToRad(yRot/20), [0, 1, 0]);
        //mat4.rotate(mvMatrix, degToRad(zRot/20), [0, 0, 1]);

		mat4.rotate(mvMatrix, conteoBola*rotacionBola[0], [1, 0, 0]);
		mat4.rotate(mvMatrix, conteoBola*rotacionBola[1], [0, 1, 0]);
		mat4.rotate(mvMatrix, conteoBola*rotacionBola[2], [0, 0, 1]);

		gl.bindBuffer(gl.ARRAY_BUFFER, ballVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, ballVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, ballVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, ballVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
        gl.bindBuffer(gl.ARRAY_BUFFER, ballVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, ballVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ballTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ballVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, ballVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		
		
    }

	function drawCan(fig)
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, canVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, canVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, canVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, canVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, canVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fig);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, canVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		
		//TAPA 
				
		gl.bindBuffer(gl.ARRAY_BUFFER, canTopVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, canTopVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, canTopVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, canTopVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, canTopVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, canTopVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, topCanTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canTopVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, canTopVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		
		gl.bindBuffer(gl.ARRAY_BUFFER, canBottomVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, canBottomVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, canBottomVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, canBottomVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
        gl.bindBuffer(gl.ARRAY_BUFFER, canBottomVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, canBottomVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bottomCanTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canBottomVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, canBottomVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
	
	
    var lastTime = 0;
	var conteoDeg = 30;
	var pasoA = 0.4;
	var pasoY = 0.5;
	var distSol = 35;
    var pasoSol = Math.PI/400;
	var conteoSol = 0;
    function animate() {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;

            xRot += (90 * elapsed) / 1000.0;
            yRot += (90 * elapsed) / 1000.0;
            zRot += (90 * elapsed) / 1000.0;
			yRot2 += pasoY;
			if(yRot2 >= 40 || yRot2 <= -200)
				pasoY = -pasoY
			conteoDeg += pasoA;
			if(conteoDeg <=-10)
				pasoA = 0.4;
			if(conteoDeg >= 30)
				pasoA = -0.4;
			conteoSol += pasoSol;
        }
        lastTime = timeNow;
    }


    function tick() {
        requestAnimFrame(tick);
        drawScene();
        animate();
    }
	
	function configurarLatas()
	{
		posicionesLatas = [];
		
		for(var i = 0; i < cantidadLatas ; i++)
		{
			posicionesLatas.push(sep*Math.cos(2*i*Math.PI/cantidadLatas));
			posicionesLatas.push(0);
			posicionesLatas.push(sep*Math.sin(2*i*Math.PI/cantidadLatas));
			var pos = Math.random()*3;
			pos = Math.floor(pos);
			var pos1 = Math.random()*3;
			pos1 = Math.floor(pos1);
			var copy = posturasLatas.idle[pos].slice();
			var copy1 = posturasLatas.idle[pos1].slice();
			//rotacionesLatas.push(Math.atan(posicionesLatas[i*3+2]/posicionesLatas[i*3]));
			rotacionesLatas.push(Math.PI/2 + 2*Math.PI*i/cantidadLatas);
			estadosLatas.push({actual : copy, destino: copy1});
			figurasLatas.push(Math.floor(Math.random()*7));
		}	
		recorridosBola = [];
		for(var i = 0; i < cantidadLatas ; i++)
		{
			var nuevo = {};
			nuevo.posSalida = [posicionesLatas[i*3],posicionesLatas[i*3+1],posicionesLatas[i*3+2]];
			nuevo.destinos = [];
			
			if(nuevo.posSalida[0] < 0)
				nuevo.rotacion += Math.PI;
			for(var j = 0; j < cantidadLatas ; j++)
			{
				nuevo.destinos.push({});
				if(i != j)
				{	
					nuevo.idDestino = j;
					
					nuevo.destinos[j].posDestino = [posicionesLatas[j*3],posicionesLatas[j*3+1],posicionesLatas[j*3+2]];
					var vectorV = [posicionesLatas[j*3]-posicionesLatas[i*3],posicionesLatas[j*3+1]-posicionesLatas[i*3+1],posicionesLatas[j*3+2]-posicionesLatas[i*3+2]];
					var nn = Math.abs(vectorV[0]*vectorV[0]) + Math.abs(vectorV[1]*vectorV[1]) + Math.abs(vectorV[2]+vectorV[2]);
					var normaV = Math.sqrt(nn);
					vectorV = [vectorV[0]/normaV, vectorV[1]/normaV,vectorV[2]/normaV];
					var puntoMedio = [posicionesLatas[i*3] + vectorV[0]*normaV/2, 30, posicionesLatas[i*3+2] + vectorV[2]*normaV/2];
					nuevo.destinos[j].curva = calcularBufferCurva(150, [posicionesLatas[i*3],12,posicionesLatas[i*3+2],puntoMedio[0],puntoMedio[1],puntoMedio[2],posicionesLatas[j*3],12,posicionesLatas[j*3+2]]);
					nuevo.destinos[j].norma = Math.min(Math.abs(i-j),cantidadLatas - Math.abs(i-j));
				}
			}
			recorridosBola.push(nuevo);
		}

		var primero = Math.floor(Math.random() * (cantidadLatas));
		var segundo;
		while((segundo = Math.floor(Math.random() * (cantidadLatas))) == primero);
		latasJugando = [primero, segundo];
		puntosRecorridoBola = 
			calcularBufferCurva(100, [
				posicionesLatas[latasJugando[primero]*3], posicionesLatas[latasJugando[primero]*3 +1], posicionesLatas[latasJugando[primero]*3] ,
				0,5,0,
				posicionesLatas[latasJugando[segundo]*3], posicionesLatas[latasJugando[segundo]*3 +1], posicionesLatas[latasJugando[segundo]*3] ,					 ]);
	}

    function webGLStart() {
        var canvas = document.getElementById("mycanvas");
        initGL(canvas);
        initShaders();
        initBuffers();
        initTexture();
		
		document.getElementById("btnMas").addEventListener("click",function()
		{
			cantidadLatas = Math.min(cantidadLatas+1,18);
			configurarLatas();
		});
		document.getElementById("btnMenos").addEventListener("click",function()
		{
			cantidadLatas = Math.max(cantidadLatas-1,2);
			configurarLatas();
		});
		document.getElementById("rad1").addEventListener("click",function()
		{
			ballTexture.image.src = "proyecto7/soccerBall3.jpg";
		});
		document.getElementById("rad2").addEventListener("click",function()
		{
			ballTexture.image.src = "proyecto7/soccerBall2.jpg";
		});
		document.getElementById("rad3").addEventListener("click",function()
		{
			ballTexture.image.src = "proyecto7/soccerBall1.jpg";
		});
		document.getElementById("rad4").addEventListener("click",function()
		{
			ballTexture.image.src = "proyecto7/soccerBall4.png";
		});
		document.getElementById("rad5").addEventListener("click",function()
		{
			ballTexture.image.src = "proyecto7/soccerBall5.jpg";
		});
        gl.clearColor(0, 0, 0, 1.0);
        gl.enable(gl.DEPTH_TEST);
		//gl.enable(gl.CULL_FACE);
		//gl.cullFace(gl.FRONT);

        tick();
    }
	
	
	
	
