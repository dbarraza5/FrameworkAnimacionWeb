# Documentacion de requerimientos

(*) cuando se seleccionan pares de figuras todos los grupos se ponene
de color seleccionado  
(*) el rectangulo de seleccion no se actualiza cuando se infla o rota los grupos
### Cosas que faltan

trabajo en el movimiento de las figuras usando el mouse.
falta el mover los atributos usando el mouse.

    1.- la recta debe mostrarse sus puntos para ser seleccionado por el mouse para poder moverlos.
    2.- debe haber un apartado informativo de que se esta haciendo como :
        a.- se esta trabajando un sola figura.
        b.- en un grupo de figuras
        c.- en un grupo etc...
    3.- debe crearse una seleccion multiple de figuras para poder aplicar varas formas de movimientos como:
        a.- rotacio
        b.- inflar
        c.- reducir, etc...
        d.- eliminar
    4.- implementar el duplicado de grupos y figuras.
    
    5.- fallo de inflar y despues mover
    
    6.- mostrar edicion de un solo grupo.
        a.- centrar grupo ´para poder editar figuras.
        b.- aumentar la vista para poder editar de mejor forma.
        c.- seleccion de figuras para la edicion.
        d.- debe haber otra vista solo para editar grupos en general.
    7.- aprender nodejs para poder guardar los datos.
    
    8.- implementar la funcionalidad de capas en los grupos
    
    9(*)- volver a la edicion de grupos sin tener que agregar elementos
    10(*)- no elimina un punto de un grupo.
    
    99.- La relatividad especial del tiempo puede resolver el problema de ajuste de los tiempos de los movimientos,
    cuando los grupos disminuyen su tamaño o figura en general.
    100.- las etiquetas pueden ser un de ayuda para aplicar movimientos sin aplicarlo a un id especifico de un 
    grupo o figura.
    
## Apartado Importacion de grupos de figuras

    1.- fucionar 2 grupos en vez de dejar uno hijo del otro.
    2.- si hay grupos con el mismo nombre debe darse la opcion de renombrar el grupo en conflicto.
    3.- debe dar se la opcion de asignacion automatica de nombres en caso de conflictos , en el caso  que el usuario no quiera
    ir uno por uno dando  los nuevos nombre.
    
## backup del proyecto
    1.- implementar un deshacer y ir hacia delante algunos pasos.
    2.- tener un backup que se suba a la nuve cada x tiempo.
        a.- estos backup tendra la misma estructura pero no se mostraran al usuario.qb
        
### bugs de trabajo de figuras
    1.- al duplicar las figuras no se refleja en el apartado de administracion.
    2(*).- al agregar un circulo no se guarda en el buckup    
### bugs de trabajo de grupos
    1.- al duplicar los grupos no se ven reflajadas los cambios en el argol de grupos.
    2.- tiene problemas con el efecto espejo no registra el cambio para guardar
    3.- tiene problemas con rotar no registra el cambio para guardar
    3.- tiene problemas con cambio de tamaño no registra el cambio para guardar
    4(*).- en la seccion de grupos al cambiar la raiz no se actualiza en el lienzo  
    
### requerimiento de pintado
    1.- un boton para aumentar el porcenjaje de zoom
    2.- que se pueda desplazar el lienzo en caso de que el zoom este muy cerca
    3.- una forma de borrar las alistas agregadas ya sea por el lienzo o por una tabla
    4.- boton con el que se pueda aplicar los cambios.
    5.- crear un area de seleccion de zoom para mayor control.
    6.- crear otra forma de arrastrar los puntos cuando estos no son visibles
## Atajos de teclado

| Atajo | Descripcion |
|---|---|
| Q+E | Mover lista de figuras de un grupo. |
| Q+B | Remover lista de figuras de un grupo. |
| Q+D | Duplicar lista de figuras de un grupo. |
| Q+R | Rotar lista de figuras de un grupo. |


### pendientes

    - no se actualiza las lineas marcadas de los contorno 
    cuando se selecciona un elemento de las figuras o el cambio del centrado
    - deberia haber un editar solo para un grupo y poder hacerle zoom para modificarlo
    -
    
    
### intrucciones de pintado

1.- cuando se selecciona un punto se agrega a la lista de puntos de pintado  
2.- cuando se selecciona y se mantiene apretado y se arrastra hasta otro punto no seleccionado
este punto nuevo se indexa entre el punto seleccionado y el que sigue.  
3.- aprete s mantenido para seleccionar punto que quiere borrar con la tecla DEL

bugs  
1.- cuando se ingressa en el pintado y depues va a otras secciones y vuelve no pesca nuevamente el pintado
pasa especificamente cuando se modifica el grupo.  
2.- se necesita un boton de reset de  centrado y de zoom  
3.- implementar trasparencia  
  
cuando seleccione alguna de las pesteñas deberia cambiarse de trabajo
a.- puse el trabajo de pintado y el de grupo pero de las figura es mas complejo porque no estan separa por pestaña

deberia documentarse debidamente cada operacion que se puede hacer sobre lienzo