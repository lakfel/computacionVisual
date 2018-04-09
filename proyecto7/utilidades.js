/*
	Autor: Johann Felipe González Ávila
	Github:  lakfel
	Esta es una pequeña librería para realizar algunas operaciones de mis proyectos
*/
	

	/**
		Esta función calcula los vertices de una curba de bezer. Dada la cantidad de puntos que se desea que tenga y los puntos  de control
	*/
	function calcularBufferCurva(cantidadPuntos, puntosControlPosicion)
	{
		
		var vertices = [];
		var colores = [];
		var paso = 1 / cantidadPuntos;
		var conteo = 0;
		var puntos = puntosControlPosicion.length/3;
		for(var i = 0; i <= 0.999 + paso ; i += paso)
		{	

			vertices.push(0);
			vertices.push(0);
			vertices.push(0);

			colores.push(0);
			colores.push(0);
			colores.push(0);
			colores.push(1);
			for(var j = 0; j < puntos ; j++)
			{	
				vertices[conteo*3] += puntosControlPosicion[j*3] * combinations(puntos - 1 , j) * Math.pow(1-i, puntos - 1 - j) *Math.pow(i,j);
				vertices[conteo*3 + 1] += puntosControlPosicion[j*3 + 1] * combinations(puntos - 1 , j) * Math.pow(1-i, puntos - 1 - j) *Math.pow(i,j);
				vertices[conteo*3 + 2] += puntosControlPosicion[j*3 + 2	] * combinations(puntos - 1, j) * Math.pow(1-i, puntos - 1 - j) *Math.pow(i,j);
			}
			conteo ++;
		}

		return { ver:vertices };
	}

	function combinations(n,k) 
	{
	  if (n==k || k ==0) {
		return 1;
	  } else {
		k=Math.max(k,n-k);
		return productRange(k+1,n)/productRange(1,n-k);
	  }
	}

	function productRange(a,b) 
	{
	  var product=a,i=a;
	 
	  while (i++<b) {
		product*=i;
	  }
	  return product;
	}
	

	function vectorOrtoNormal(vector, vector2 = null)
	{
		var resp = [];
		if(vector2 == null)
		{
			if(vector[0] != 0 )
				resp = [ (-vector[1] -vector[2])/vector[0],1,1];
			else if(vector[1] != 0)
				resp = [ 1,(-vector[0] -vector[2])/vector[1],1];
			else if(vector[2] != 0)
				resp = [ 1,1(-vector[0] -vector[2])/vector[2]];

			if(resp[0] <0)
				resp = [-resp[0], -resp[1], -resp[2]];
		}
		else
		{
			resp = [ vector[1]*vector2[2]- vector[2]*vector2[1], -(vector[0]*vector2[2] - vector[2]*vector2[0]), vector[0]*vector2[1] - vector[1]*vector2[0]];
		}
		var norma = Math.sqrt(Math.pow(resp[0],2) + Math.pow(resp[1],2) +Math.pow(resp[2],2));
		resp = [resp[0]/norma,resp[1]/norma,resp[2]/norma];
		return resp;
	}	


	function rotarTransladar(posicionInicial, vectorNormal, puntos, mCambioBase = null)
	{
		
		var norma = Math.sqrt(Math.pow(vectorNormal[0],2) + Math.pow(vectorNormal[1],2) +Math.pow(vectorNormal[2],2));
		vectorNormal = [vectorNormal[0]/norma,vectorNormal[1]/norma,vectorNormal[2]/norma];
	
		var vector2 = vectorOrtoNormal(vectorNormal);
		var norma = Math.sqrt(Math.pow(vector2[0],2) + Math.pow(vector2[1],2) +Math.pow(vector2[2],2));
		vector2 = [vector2[0]/norma,vector2[1]/norma,vector2[2]/norma];

		var vector3 = vectorOrtoNormal(vectorNormal, vector2);
		var norma = Math.sqrt(Math.pow(vector3[0],2) + Math.pow(vector3[1],2) +Math.pow(vector3[2],2));
		vector3 = [vector3[0]/norma,vector3[1]/norma,	vector3[2]/norma];

		var cantidad = puntos.length/3;
		
		var cambioBase = [];
		if(mCambioBase == null)
		{
			cambioBase.push(vector2[0]);
			cambioBase.push(vector2[1]);
			cambioBase.push(vector2[2]);
			cambioBase.push(0);

			cambioBase.push(vectorNormal[0]);
			cambioBase.push(vectorNormal[1]);
			cambioBase.push(vectorNormal[2]);
			cambioBase.push(0);
			
			cambioBase.push(vector3[0]);
			cambioBase.push(vector3[1]);
			cambioBase.push(vector3[2]);
			cambioBase.push(0);

			cambioBase.push(0);
			cambioBase.push(0);
			cambioBase.push(0);
			cambioBase.push(1);
		}
		else
		{
			cambioBase = mCambioBase;
		}

		var vertices1 = [];
		var vertices = [];
		for(var i = 0; i < cantidad ; i++)
		{
			vertices1 = [];
			vertices1.push(puntos[i*3]);
			vertices1.push(puntos[i*3+1]);
			vertices1.push(puntos[i*3+2]);

			mat4.multiplyVec3(cambioBase, vertices1, vertices1);
			vertices1 = [vertices1[0] + posicionInicial[0], vertices1[1] + posicionInicial[1], vertices1[2] + posicionInicial[2]];

			vertices.push.apply(vertices, vertices1);
		}

		return {vertices : vertices, cambioBase: cambioBase};
	}