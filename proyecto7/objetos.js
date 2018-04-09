/*
	Autor: Johann Felipe González Ávila
	Github:  lakfel
	Esta es una pequeña librería para realizar figuras geométricas para mis proyectos propios. Intentaré documentarla para que sea del uso de todos.
*/

	/**
		Crea una esfera con determinados pisos. Esto solo muestra la cantidad de divisiones en un eje que tendra la esfera
		A mayor cantidad de pisos mejor definición y a su vez mayor esfuerzo en procesamiento
		Retorna un objeto JSON con 3 elementos
			vertices. Las posiciones de los puntos que generan la esfera en 3D
			coords. Los índices de los puntos de 3 en 3 que generan los trianulos para generar la esfera
			textCords. La transformación (x,y,z) - (u,v) para poder mapear una textura sobre la esfera. Esta esta en desarrollo y he probado varias 		  proyecciones. Aún falla en algunos casos.
	*/
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
				vertices.push(r*Math.cos(i*paso));
				vertices.push(r*Math.sin(i*paso) * Math.sin(j*paso));
				
				vertices.push(r*Math.sin(i*paso) * Math.cos((j+1)*paso));
				vertices.push(r*Math.cos(i*paso));
				vertices.push(r*Math.sin(i*paso) * Math.sin((j+1)*paso));
				
				vertices.push(r*Math.sin((i+1)*paso) * Math.cos((j+1)*paso));
				vertices.push(r*Math.cos((i+1)*paso));
				vertices.push(r*Math.sin((i+1)*paso) * Math.sin((j+1)*paso));
				
				vertices.push(r*Math.sin((i+1)*paso) * Math.cos((j)*paso));
				vertices.push(r*Math.cos((i+1)*paso));
				vertices.push(r*Math.sin((i+1)*paso) * Math.sin((j)*paso));
				
				coords.push(i*pisos*4 + j*4);
				coords.push(i*pisos*4 + j*4 + 3);
				coords.push(i*pisos*4 + j*4 + 1);
				
				coords.push(i*pisos*4 + j*4 + 1);
				coords.push(i*pisos*4 + j*4 + 3);
				coords.push(i*pisos*4 + j*4 + 2);
				

				textCords.push(j*paso /(Math.PI*2)) ;
				textCords.push(i*paso /Math.PI) ;
				
				textCords.push((j+1)*paso /(Math.PI*2)) ;
				textCords.push(i*paso /Math.PI) ;
				
				
				textCords.push((j+1)*paso /(Math.PI*2)) ;
				textCords.push((i+1)*paso /Math.PI) ;
				
				
				textCords.push(j*paso /(Math.PI*2)) ;
				textCords.push((i+1)*paso /Math.PI) ;
				
				/*
				textCords.push(0.5 + 0.5 * r*Math.sin(i*paso) * Math.cos(j*paso) /(1 - r*Math.cos(i*paso))) ;
				textCords.push(0.5 + 0.5 *r*Math.sin(i*paso) * Math.sin(j*paso) /(1 - r*Math.cos(i*paso))) ;
				
				textCords.push(0.5 + 0.5 * r*Math.sin(i*paso) * Math.cos((j+1)*paso) /(1 - r*Math.cos(i*paso))) ;
				textCords.push(0.5 + 0.5 *r*Math.sin(i*paso) * Math.sin((j+1)*paso) /(1 - r*Math.cos(i*paso))) ;
				
				textCords.push(0.5 + 0.5 * r*Math.sin((i+1)*paso) * Math.cos((j+1)*paso) /(1 - r*Math.cos((i+1)*paso))) ;
				textCords.push(0.5 + 0.5 *r*Math.sin((i+1)*paso) * Math.sin((j+1)*paso) /(1 - r*Math.cos((i+1)*paso))) ;
				
				textCords.push(0.5 + 0.5 * r*Math.sin((i+1)*paso) * Math.cos(j*paso) /(1 - r*Math.cos((i+1)*paso))) ;
				textCords.push(0.5 + 0.5 *r*Math.sin((i+1)*paso) * Math.sin(j*paso) /(1 - r*Math.cos((i+1)*paso))) ;
				*/
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
	
	/**
		Crea una circulo con una cantidad de triangulos. A mayor cantidad mayor definición.
		Retorna un objeto JSON con 3 elementos
			vertices. Las posiciones de los puntos que generan la esfera en 3D
			coords. Los índices de los puntos de 3 en 3 que generan los trianulos para generar la esfera
			textCords. La transformación (x,y,z) - (u,v) para poder mapear una textura sobre la esfera. Esta esta en desarrollo y he probado varias 		  proyecciones. Aún falla en algunos casos.
	*/
	function crearCirculo(cantidadCuadros, r, posInicial = null, vectorNormal = null)
	{
		var vertices = [];
		var coords = [];
		var textCords = [];
		var paso = 2*Math.PI / cantidadCuadros;
		var pasoText = 1 / cantidadCuadros;
		var offset = [0,0,0];
		if(posInicial != null && vectorNormal == null)
		{
			offset= posInicial;
		}

		vertices = offset;
		
		textCords.push(0.5);
		textCords.push(0.5);
		
		for(var i =0; i < cantidadCuadros; i++)
		{
			
			
			vertices.push(r*Math.cos(paso*i) + offset[0]);
			vertices.push(offset[1]);
			vertices.push(r*Math.sin(paso*i) + offset[2]);
			
			vertices.push(r*Math.cos(paso*(i+1)) + offset[0]);
			vertices.push(offset[1]);
			vertices.push(r*Math.sin(paso*(i+1)) + offset[2]);
			
			coords.push(0);
			coords.push(i*2 + 1);
			coords.push(i*2 + 2);
			
			textCords.push(0.5 + 0.5*Math.cos(paso*i));
			textCords.push(0.5 + 0.5*Math.sin(paso*i));
			
			textCords.push(0.5 + 0.5*Math.cos(paso*(i+1)));
			textCords.push(0.5 + 0.5*Math.sin(paso*(i+1)));
			
		}
		if(posInicial != null && vectorNormal != null)
		{	
			var res = rotarTransladar(posInicial,vectorNormal, vertices);
			vertices = res.vertices;
		}
		

		var ret = {vertices : vertices, coords : coords, textCords : textCords};
		return ret;
		
	}
	
	/**
		Crea una aro con una altura determinada. Utilizado para manejar una lata junto con los circulos
		Retorna un objeto JSON con 3 elementos
			vertices. Las posiciones de los puntos que generan la esfera en 3D
			coords. Los índices de los puntos de 3 en 3 que generan los trianulos para generar la esfera
			textCords. La transformación (x,y,z) - (u,v) para poder mapear una textura sobre la esfera. Esta esta en desarrollo y he probado varias 		  proyecciones. Aún falla en algunos casos.
	*/
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
	
	/**
		Crea un cilindro articulado. Es decir conformado por varios Aros. La diferencia es que va a tener un eje conformado por varios puntos que en principio creará una línea. Esta linéa se espera pueda ser manipulada para darle la sensación de movimiento al cilindro
	*/
	function crearCilindroArticulado (cantidadCuadros, h , r, puntos = 2)
	{
		var vertices = [];
		var coords = [];
		var textCords = [];
		var paso = 2*Math.PI / cantidadCuadros;
		var pasoText = 1 / cantidadCuadros;
		var divJ = h / (puntos-1);
		var divJC = 1/ (puntos-1);
		var puntosEje = [];
		
		for(var j =0; j < puntos - 1; j++)
		{
			puntosEje.push(0);
			puntosEje.push(-0.5*h + divJ*j);
			puntosEje.push(0);
			for(var i =0; i < cantidadCuadros; i++)
			{	
			
				vertices.push(r*Math.cos(paso*i));
				vertices.push(-0.5*h + divJ*j);
				vertices.push(r*Math.sin(paso*i));
				
				vertices.push(r*Math.cos(paso*(i+1)));
				vertices.push(-0.5*h + divJ*j);
				vertices.push(r*Math.sin(paso*(i+1)));
				
				vertices.push(r*Math.cos(paso*(i+1)));
				vertices.push(-0.5*h + divJ*(j+1));
				vertices.push(r*Math.sin(paso*(i+1)));
				
				vertices.push(r*Math.cos(paso*(i)));
				vertices.push(-0.5*h + divJ*(j+1));
				vertices.push(r*Math.sin(paso*(i)));
				
				coords.push(j*4*cantidadCuadros + i*4);
				coords.push(j*4*cantidadCuadros + i*4 + 3);
				coords.push(j*4*cantidadCuadros + i*4 + 1);
				
				coords.push(j*4*cantidadCuadros + i*4 + 1);
				coords.push(j*4*cantidadCuadros + i*4 + 3);
				coords.push(j*4*cantidadCuadros + i*4 + 2);
				
				textCords.push(i*pasoText);
				textCords.push(1 - j*divJC);
				
				textCords.push((i+1)*pasoText);
				textCords.push(1 - j*divJC);
				
				textCords.push((i+1)*pasoText);
				textCords.push(1 - (j+1)*divJC);
				
				textCords.push((i)*pasoText);
				textCords.push(1 - (j+1)*divJC);
			}
		}
		puntosEje.push(0);
		puntosEje.push(0.5*h);
		puntosEje.push(0);
		var ret = {vertices : vertices, coords : coords, textCords : textCords, puntosEje : puntosEje};
		return ret;
	}


	/**
		Crea un cilindro articulado. Es decir conformado por varios Aros. La diferencia es que va a tener un eje conformado por varios puntos que en principio creará una línea. Esta linéa se espera pueda ser manipulada para darle la sensación de movimiento al cilindro
	*/
	function crearCilindroArticuladoConEje (cantidadCuadros, r, eje)
	{
		var puntos = eje.length/3
		var vertices = [];
		var vertices2 = [];
		var verticesR = [];
		var coords = [];
		var textCords = [];
		var paso = 2*Math.PI / cantidadCuadros;
		var pasoText = 1 / cantidadCuadros;
		var divJC = 1/ (puntos-1);
		var puntosEje = eje;
		var vector = [0,0,0];
		
		var temp1 = null;
		
		var cambioBase = []
		var norma = 0;
		for(var j =0; j < puntos - 1; j++)
		{
			vector = [eje[3*(j+1)] - eje[3*j],eje[3*(j+1) +1] - eje[3*j +1] ,eje[3*(j+1) +2] - eje[3*j +2]];
			norma = Math.sqrt(Math.pow(vector[0],2) + Math.pow(vector[1],2) +Math.pow(vector[2],2));
			vector = [vector[0]/norma,vector[1]/norma,vector[2]/norma];
	
			for(var i =0; i < cantidadCuadros; i++)
			{	
				
				vertices2= [];
				vertices2.push(r*Math.cos(paso*i));
				vertices2.push(0);
				vertices2.push(r*Math.sin(paso*i));
		
				vertices2.push(r*Math.cos(paso*(i+1)));
				vertices2.push(0);
				vertices2.push(r*Math.sin(paso*(i+1)));
				
				temp1 = rotarTransladar([eje[3*j],eje[3*j+1], eje[3*j+2]],vector, vertices2);
				vertices.push.apply(vertices,temp1.vertices);
				
				temp1 = rotarTransladar([eje[3*(j+1)],eje[3*(j+1)+1], eje[3*(j+1)+2]],vector, vertices2, temp1.cambioBase);
				vertices.push.apply(vertices,temp1.vertices);
				
				coords.push(j*4*cantidadCuadros + i*4);
				coords.push(j*4*cantidadCuadros + i*4 + 2);
				coords.push(j*4*cantidadCuadros + i*4 + 1);
				
				coords.push(j*4*cantidadCuadros + i*4 + 1);
				coords.push(j*4*cantidadCuadros + i*4 + 2);
				coords.push(j*4*cantidadCuadros + i*4 + 3);
				
				textCords.push(i*pasoText);
				textCords.push(1 - j*divJC);
				
				textCords.push((i+1)*pasoText);
				textCords.push(1 - j*divJC);
				
				textCords.push((i)*pasoText);
				textCords.push(1 - (j+1)*divJC);

				textCords.push((i+1)*pasoText);
				textCords.push(1 - (j+1)*divJC);
				
			}
		}
		for(var j =0; j < puntos - 2; j++)
		{
			for(var i =0; i < cantidadCuadros; i++)
			{
				coords.push((j)*4*cantidadCuadros + i*4 +2);
				coords.push((j+1)*4*cantidadCuadros + i*4 );
				coords.push((j)*4*cantidadCuadros + i*4 + 3);
				
				coords.push((j)*4*cantidadCuadros + i*4 + 3);
				coords.push((j+1)*4*cantidadCuadros + i*4 );
				coords.push((j+1)*4*cantidadCuadros + i*4 +1);
				
			}
		}
		
		var ret = {vertices : vertices, coords : coords, textCords : textCords, puntosEje : puntosEje};
		return ret;
	}
	

	function cilindro(definicion, h, r, pisos, eje = null)
	{
		this.cilindro = null;
		this.tapa = null;
		this.fondo = null;
		this.definicion = definicion;
		this.h = h; // Se va a eliminar
		this.r = r;
		this.pisos = pisos;
		this.eje = eje;
	}

	cilindro.prototype.crearCilindro = function()
	{
		//this.cilindro = crearCilindroArticuladoConEje(this.definicion, this.r, [0,-this.h/2,0,0.2,-this.h/4,0.5,0.1,this.h/4,0.05,0,this.h/2,0]);
		/*this.cilindro = crearCilindroArticuladoConEje(this.definicion, this.r,
			[0 , -this.h/2 , 0 ,
			 0.2,-this.h/4 ,0.5, 
			 0,0,0,
             0.1,this.h/4,0.05,
             0,this.h/2,0]);*/
		this.cilindro = crearCilindroArticuladoConEje(this.definicion, this.r, this.eje);
		this.tapa = crearCirculo(this.definicion, this.r,[this.eje[this.eje.length -3],this.eje[this.eje.length -2],this.eje[this.eje.length -1]], [this.eje[this.eje.length -3] - this.eje[this.eje.length -6] ,this.eje[this.eje.length -2] - this.eje[this.eje.length -5],this.eje[this.eje.length -1] - this.eje[this.eje.length -4]]);
		this.fondo = crearCirculo(this.definicion, this.r, [this.eje[0],this.eje[1],this.eje[2]] ,[this.eje[3] - this.eje[0], this.eje[4] - this.eje[1], this.eje[5]- this.eje[2]]);
	}

	cilindro.prototype.actualizarCilindro = function(nEje)
	{	
		var tempo = null;
		this.eje = nEje;
		this.cilindro = crearCilindroArticuladoConEje(this.definicion, this.r, nEje);
		this.tapa = crearCirculo(this.definicion, this.r, [this.eje[this.eje.length -3],this.eje[this.eje.length -2],this.eje[this.eje.length -1]],[nEje[nEje.length -3] - nEje[nEje.length -6] ,nEje[nEje.length -2] - nEje[nEje.length -5],nEje[nEje.length -1] - nEje[nEje.length -4]]);
		this.fondo = crearCirculo(this.definicion, this.r, [this.eje[0],this.eje[1],this.eje[2]], [nEje[3] - nEje[0], nEje[4] - nEje[1], nEje[5]- nEje[2]]);
	}
