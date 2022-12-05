import './TreeViewElement.css'
import {useEffect, useState} from "react";

function TreeViewElement(props){
    const data_tree = props.datos;
    const [lista_seleccionados, setListaSeleccionados] = useState([])
    const [nombre_nodo, setNombreNodo] = useState("")

    const click_nodo=(event, nombre_grupo)=>{
        event.target.parentElement.querySelector(".nested").classList.toggle("active");
        event.target.classList.toggle("caret-down");
        setNombreNodo(nombre_grupo)
    }

    const click_leaf=(event, nombre_grupo)=>{
        setNombreNodo(nombre_grupo)
        console.log(nombre_grupo)
    }

    console.log("[LISTA SELECCIONADOS]")
    console.log(lista_seleccionados)

    const seleccion_grupo=(e, nombre_grupo)=>{
        const select = e.target.checked;
        if(select){
            setListaSeleccionados(lista_seleccionados.concat([nombre_grupo]))
        }else{
            setListaSeleccionados(lista_seleccionados.filter((nombre)=>nombre!==nombre_grupo))
        }
    }

    const construir_arbol=(lista_nodos, first=false)=>{
        let lista_tag_nodo = []
        for (let i=0; i<lista_nodos.length; i++){
            const nodo = lista_nodos[i];
            let style=null
            if(nodo.text === nombre_nodo){
                style = {color: "blue"}
            }
            if("nodes" in nodo){
                const tag_nodo = (<li>
                    <span  style={style} className="caret" onClick={(e)=>click_nodo(e, nodo.text)} htmlFor="firstCheckbox">
                    </span>
                    <input className="form-check-input me-1" type="checkbox" value=""
                           id={"checkbox-grupo"+nodo.text} onChange={(e)=>seleccion_grupo(e, nodo.text)}/>
                    <label className="form-check-label" htmlFor={"checkbox-grupo"+nodo.text}>{nodo.text}</label>

                    {construir_arbol(nodo.nodes)}
                    </li>)
                lista_tag_nodo.push(tag_nodo)
            }else{
                //lista_tag_nodo.push(<li style={style} onClick={(e)=>click_leaf(e,nodo.text)}>{nodo.text}</li>)
                lista_tag_nodo.push(<li style={style} onClick={(e)=>click_leaf(e,nodo.text)}>
                    <input className="form-check-input me-1" type="checkbox" value=""
                           id={"checkbox-grupo"+nodo.text} onChange={(e)=>seleccion_grupo(e, nodo.text)}/>
                    <label className="form-check-label" htmlFor={"checkbox-grupo"+nodo.text}>{nodo.text}</label>
                </li>)
            }
        }
        return(<ul className={first?"active":"nested"}>
            {lista_tag_nodo}
        </ul>)
    }

    useEffect(() => {
    }, []);

    return(<div>
        {construir_arbol(data_tree, true)}
    </div>)
}


export default TreeViewElement