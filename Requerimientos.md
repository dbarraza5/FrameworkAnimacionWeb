# Requerimientos

### Administrador general

- [ ] agrupar la seccion de creacion de grupo junto a la edicion de grupo en el misma pestaña
- [ ] arreglar la exportacion de animacion
- [ ] implementar guardar como
- [ ] implementar redireccion cuando expira la sesion
- [ ] funcinalidad de crear animacion dentro del proyecto
- [ ] agregar assets de otras animaciones al proyecto en el que se este trabajando, estos assets seran de la version en la 
que se importaron al proyecto.

### Edicion de figuras

- [ ] desface en la interfaz cuando selecciona una figura
- [ ] mejorar la seleccion de figuras. tal vez presionando una tecla cuando pasa el mouse por encima de las figura.
- [ ] unir los componente cuando estan en colicion por ejemplo p1 de la recta con el centro de la otra recta  o punto.
- [ ] Funcionalidad de Zoom para diseñar en mas detalle todas las figuras.
- [ ] Funcionalidad de agregar una capa en en la canva para insertar imagenes y poder hacer mas facil el diseño.
- [ ] cuando se seleccione solo una figura deberia poder duplicar esa figura
- [ ] cuando se seleccione figuras debe filtrarse en el administrador

### Edicion de grupos de figuras

- [x] problema con el arbol de grupos por la nueva restructuracion.
- [ ] desface en la interfaz cuando selecciona un grupo o varios
- [ ] implementar la funcionalidad de capas en los grupos

### Edicion de pintura de grupos

- [ ] implementar un modal de guardado cuando se sale de la seccion de pintado.
- [ ] cuando se elimine una figura en la pintura estaba referenciada ese componente deberia de eliminarse de la pintura tambien.


#### vitacora

talvez para simular el zoom y el desplazamiento podemos, virtualizar los datos reales poniendo una capa. por ejemplo
apezar de que el mouse nunca sale del lienzo el puntero virtual podria estar en cualquier parte dentro del lienzo.
  si se desplaza el lienzo debe mostrarse las coordenadas (0,0)  
  ademas debe mostrar si tiene zoom el lienzo