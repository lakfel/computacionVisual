/**
* Creación de primitivas en Web-GL
* Primeros pasos Johann Felipe González Ávila
* Universidad de los Andes. Bogotá Colombia
*/

/*
* Constructor. 
*/
function esfera_prim()
{
	// Resolución. Esto índica la resolución de la esfera. Indica cuandos "pisos" va a tener la esfera.
	this.resolucion = 0;
	
	//Radio de la esfera
	this.radio = 0;
	
	// Vertices 
	this.vertices =[];
	
	// Colores  de la esfera
	this.colores =[];
	
}


esfera_prim.prototype.calcularVertices = function()
{
	if(this.resolucion ==  0 || this.radio ==  0)
	{
		throw "No estan definidos los valores de resolucion y radio"; 
	}
	
	var angulo = Math.PI/this.resolucion;
	
	this.vertices = [];
	for(var fi = 0; fi  <= Math.PI ; fi += angulo)
	{
		for (var tta = 0 ; tta <= 2 * Math.PI ; tta += angulo)
		{
				var Z1 = this.radio * Math.cos(fi - angulo);
				var X1 = this.radio * Math.sin(fi - angulo)* Math.cos(tta - angulo)
				var Y1 = this.radio * Math.sin(fi - angulo)* Math.sin(tta - angulo)
				
				var X2 = this.radio * Math.sin(fi - angulo)* Math.cos(tta)
				var Y2 = this.radio * Math.sin(fi - angulo)* Math.sin(tta)
				
				var Z2 = this.radio * Math.cos(fi);
				var X3 = this.radio * Math.sin(fi)* Math.cos(tta - angulo)
				var Y3 = this.radio * Math.sin(fi)* Math.sin(tta - angulo)
				
				var X4 = this.radio * Math.sin(fi)* Math.cos(tta)
				var Y4 = this.radio * Math.sin(fi)* Math.sin(tta)
				
				this.vertices.push(X1);
				this.vertices.push(Y1);
				this.vertices.push(Z1);
				
				this.vertices.push(X2);
				this.vertices.push(Y2);
				this.vertices.push(Z1);
				
				this.vertices.push(X3);
				this.vertices.push(Y3);
				this.vertices.push(Z2);
				
				this.vertices.push(X3);
				this.vertices.push(Y3);
				this.vertices.push(Z2);
				
				this.vertices.push(X4);
				this.vertices.push(Y4);
				this.vertices.push(Z2);
				
				this.vertices.push(X2);
				this.vertices.push(Y2);
				this.vertices.push(Z1);
				
		}
	}
	
}

esfera_prim.prototype.calcularColores = function (pisos, nColores)
{
	if(this.resolucion == 0 || this.radio == 0)
	{
		throw "No estan definidos los valores de resolucion y radio"; 
	}
	
	var angulo = Math.PI/this.resolucion;
	var conteo = 0;
	var index = 0;
	this.olores = [];
	for(var fi = 0; fi  <= Math.PI ; fi += angulo)
	{	
		index =Math.floor(conteo/this.resolucion/pisos)*4
		for (var tta = 0 ; tta <= 2 * Math.PI ; tta += angulo)
		{
			
			for(var tt = 0; tt <6; tt++)
			{
					this.colores.push(nColores[index]);
					this.colores.push(nColores[index + 1]);
					this.colores.push(nColores[index + 2]);
					this.colores.push(nColores[Math.floor(conteo/this.resolucion/pisos)*4 + 3]);
			}
			
				
		}
		conteo ++;
	}
}