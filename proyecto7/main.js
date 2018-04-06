    var gl;

    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
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

    function initShaders() {
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

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
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


    var canTexture;
	var topCanTexture;
	var bottomCanTexture;
	var ballTexture;
	
    function initTexture() {
        canTexture = gl.createTexture();
        canTexture.image = new Image();
        canTexture.image.onload = function () {
            handleLoadedTexture(canTexture)
        }

        canTexture.image.src = "proyecto7/cocacolaCan2.jpg";
		
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
		//ballTexture.image.src = "proyecto7/soccerBall3.jpg";
		ballTexture.image.src = "proyecto7/soccerBall2.jpg";
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
    }


    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    var canVertexPositionBuffer;
    var canVertexTextureCoordBuffer;
    var canVertexIndexBuffer;
	
	var canTopVertexPositionBuffer;
    var canTopVertexTextureCoordBuffer;
    var canTopVertexIndexBuffer;
	
	var ballVertexPositionBuffer;
    var ballVertexTextureCoordBuffer;
    var ballVertexIndexBuffer;

    function initBuffers() {
        canVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexPositionBuffer);
		
		var lata = crearAro(36,2.5,0.7);
		var tapa = crearCirculo(36,0.7);
		var bola = crearEsfera(36, 0.7);
		
        var vertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];
		vertices = lata.vertices;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        canVertexPositionBuffer.itemSize = 3;
        canVertexPositionBuffer.numItems = vertices.length/3;

        canVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexTextureCoordBuffer);
        var textureCoords = [
          // Front face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,

          // Back face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,

          // Top face
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,

          // Bottom face
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,

          // Right face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,

          // Left face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
        ];
		textureCoords = lata.textCords;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        canVertexTextureCoordBuffer.itemSize = 2;
        canVertexTextureCoordBuffer.numItems = textureCoords.length/2	;

        canVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canVertexIndexBuffer);
        var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];
		cubeVertexIndices = lata.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
        canVertexIndexBuffer.itemSize = 1;
        canVertexIndexBuffer.numItems = cubeVertexIndices.length;
		
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
		
		canTopVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canTopVertexIndexBuffer);
		cubeVertexIndices = tapa.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
        canTopVertexIndexBuffer.itemSize = 1;
        canTopVertexIndexBuffer.numItems = cubeVertexIndices.length;
		
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
		
		ballVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ballVertexIndexBuffer);
		cubeVertexIndices = bola.coords;
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
        ballVertexIndexBuffer.itemSize = 1;
        ballVertexIndexBuffer.numItems = cubeVertexIndices.length;
		
		
    }


    var xRot = 0;
    var yRot = 0;
    var zRot = 0;

    function drawScene()
	{
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [0.0, 0.0, -5.0]);

        mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
        mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
        mat4.rotate(mvMatrix, degToRad(zRot), [0, 0, 1]);

        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, canVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, canVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, canVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, canTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canVertexIndexBuffer);
        setMatrixUniforms();
        //gl.drawElements(gl.TRIANGLES, canVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		
		//TAPA 
		
		//mat4.translate(mvMatrix, [0.0, 1.25, 0.0]);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, canTopVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, canTopVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, canTopVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, canTopVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, topCanTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, canTopVertexIndexBuffer);
        setMatrixUniforms();
        //gl.drawElements(gl.TRIANGLES, canTopVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		
		//mat4.translate(mvMatrix, [0.0, -2.5, 0.0]);
	
		
		
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bottomCanTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        setMatrixUniforms();
        //gl.drawElements(gl.TRIANGLES, canTopVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		
		gl.bindBuffer(gl.ARRAY_BUFFER, ballVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, ballVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, ballVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, ballVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ballTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ballVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, ballVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		
		
    }


    var lastTime = 0;

    function animate() {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;

            xRot += (90 * elapsed) / 1000.0;
            yRot += (90 * elapsed) / 1000.0;
            zRot += (90 * elapsed) / 1000.0;
        }
        lastTime = timeNow;
    }


    function tick() {
        requestAnimFrame(tick);
        drawScene();
        animate();
    }

    function webGLStart() {
        var canvas = document.getElementById("mycanvas");
        initGL(canvas);
        initShaders();
        initBuffers();
        initTexture();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        tick();
    }
	
	function crearAro (cantidadCuadros, h , r)
	{
		var vertices = [];
		var coords = [];
		var textCords = [];
		var paso = 2*Math.PI / cantidadCuadros;
		var pasoText = 1 / cantidadCuadros;
		for(var i =0; i < cantidadCuadros; i++)
		{	
			
			vertices.push(r*Math.cos(paso*i));
			vertices.push(0.5*h);
			vertices.push(r*Math.sin(paso*i));
			
			vertices.push(r*Math.cos(paso*(i+1)));
			vertices.push(0.5*h);
			vertices.push(r*Math.sin(paso*(i+1)));
			
			vertices.push(r*Math.cos(paso*(i+1)));
			vertices.push(-0.5*h);
			vertices.push(r*Math.sin(paso*(i+1)));
			
			vertices.push(r*Math.cos(paso*(i)));
			vertices.push(-0.5*h);
			vertices.push(r*Math.sin(paso*(i)));
			
			coords.push(i*4);
			coords.push(i*4 + 3);
			coords.push(i*4 + 1);
			
			coords.push(i*4 + 1);
			coords.push(i*4 + 3);
			coords.push(i*4 + 2);
			
			textCords.push(i*pasoText);
			textCords.push(0);
			
			textCords.push((i+1)*pasoText);
			textCords.push(0);
			
			textCords.push((i+1)*pasoText);
			textCords.push(1);
			
			textCords.push((i)*pasoText);
			textCords.push(1);
			
		}
		
		var ret = {vertices : vertices, coords : coords, textCords : textCords};
		return ret;
	}
	
	function crearCirculo(cantidadCuadros, r)
	{
		var vertices = [];
		var coords = [];
		var textCords = [];
		var paso = 2*Math.PI / cantidadCuadros;
		var pasoText = 1 / cantidadCuadros;
		
		vertices.push(0);
		vertices.push(0);
		vertices.push(0);
		
		textCords.push(0.5);
		textCords.push(0.5);
		
		for(var i =0; i < cantidadCuadros; i++)
		{
			
			
			vertices.push(r*Math.cos(paso*i));
			vertices.push(0);
			vertices.push(r*Math.sin(paso*i));
			
			vertices.push(r*Math.cos(paso*(i+1)));
			vertices.push(0);
			vertices.push(r*Math.sin(paso*(i+1)));
			
			coords.push(0);
			coords.push(i*2 + 1);
			coords.push(i*2 + 2);
			
			textCords.push(0.5 + 0.5*Math.cos(paso*i));
			textCords.push(0.5 + 0.5*Math.sin(paso*i));
			
			textCords.push(0.5 + 0.5*Math.cos(paso*(i+1)));
			textCords.push(0.5 + 0.5*Math.sin(paso*(i+1)));
			
		}
		
		var ret = {vertices : vertices, coords : coords, textCords : textCords};
		return ret;
		
	}
	
	function crearEsfera (pisos, r)
	{
		var vertices = [];
		var paso = 2*Math.PI/pisos;
		var paso2 = 1 / pisos;
		var coords = [];
		var textCords = [];
		
		for(var i = 0; i   <  pisos/2  ; i++)
		{
		for (var j = 0 ; j  < pisos ; j++)
			{	
		
				vertices.push(r*Math.sin(i*paso) * Math.cos(j*paso));
				vertices.push(r*Math.sin(i*paso) * Math.sin(j*paso));
				vertices.push(r*Math.cos(i*paso));
				
				vertices.push(r*Math.sin(i*paso) * Math.cos((j+1)*paso));
				vertices.push(r*Math.sin(i*paso) * Math.sin((j+1)*paso));
				vertices.push(r*Math.cos(i*paso));
				
				vertices.push(r*Math.sin((i+1)*paso) * Math.cos((j+1)*paso));
				vertices.push(r*Math.sin((i+1)*paso) * Math.sin((j+1)*paso));
				vertices.push(r*Math.cos((i+1)*paso));
				
				vertices.push(r*Math.sin((i+1)*paso) * Math.cos((j)*paso));
				vertices.push(r*Math.sin((i+1)*paso) * Math.sin((j)*paso));
				vertices.push(r*Math.cos((i+1)*paso));
				
				coords.push(i*pisos*4 + j*4);
				coords.push(i*pisos*4 + j*4 + 3);
				coords.push(i*pisos*4 + j*4 + 1);
				
				coords.push(i*pisos*4 + j*4 + 1);
				coords.push(i*pisos*4 + j*4 + 3);
				coords.push(i*pisos*4 + j*4 + 2);
				
				/*textCords.push(i*paso /Math.PI) ;
				textCords.push(j*paso /(Math.PI*2)) ;
				
				textCords.push(i*paso /Math.PI) ;
				textCords.push((j+1)*paso /(Math.PI*2)) ;
				
				textCords.push((i+1)*paso /Math.PI) ;
				textCords.push((j+1)*paso /(Math.PI*2)) ;
				
				textCords.push((i+1)*paso /Math.PI) ;
				textCords.push(j*paso /(Math.PI*2)) ;
				*/
				textCords.push(0.5 + 0.5 * r*Math.sin(i*paso) * Math.cos(j*paso) /(1 - r*Math.cos(i*paso))) ;
				textCords.push(0.5 + 0.5 *r*Math.sin(i*paso) * Math.sin(j*paso) /(1 - r*Math.cos(i*paso))) ;
				
				textCords.push(0.5 + 0.5 * r*Math.sin(i*paso) * Math.cos((j+1)*paso) /(1 - r*Math.cos(i*paso))) ;
				textCords.push(0.5 + 0.5 *r*Math.sin(i*paso) * Math.sin((j+1)*paso) /(1 - r*Math.cos(i*paso))) ;
				
				textCords.push(0.5 + 0.5 * r*Math.sin((i+1)*paso) * Math.cos((j+1)*paso) /(1 - r*Math.cos((i+1)*paso))) ;
				textCords.push(0.5 + 0.5 *r*Math.sin((i+1)*paso) * Math.sin((j+1)*paso) /(1 - r*Math.cos((i+1)*paso))) ;
				
				textCords.push(0.5 + 0.5 * r*Math.sin((i+1)*paso) * Math.cos(j*paso) /(1 - r*Math.cos((i+1)*paso))) ;
				textCords.push(0.5 + 0.5 *r*Math.sin((i+1)*paso) * Math.sin(j*paso) /(1 - r*Math.cos((i+1)*paso))) ;
				/*
				textCords.push(1-2*i/pisos) ;
				textCords.push(1- j /(pisos)) ;
				
				textCords.push(1-2*i/pisos) ;
				textCords.push(1- (j+1) /(pisos)) ;

				textCords.push(1-2*(i+1)/pisos) ;
				textCords.push(1- (j+1) /(pisos)) ;

				textCords.push(1-2*(i+1)/pisos) ;
				textCords.push(1- j /(pisos)) ;
				*/
			}
		}
		var ret = {vertices : vertices, coords : coords, textCords : textCords};
		return ret;
	};
