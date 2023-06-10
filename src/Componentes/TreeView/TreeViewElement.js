import './TreeViewElement.css'
import {useEffect, useState} from "react";

function TreeViewElement(props){
    const data_tree = props.datos;
    const [lista_nodos_flat, setListaNodosFlat] = useState({})
    const list_aux_selec = []
    const [lista_seleccionados, seleccionGrupos] = useState(props.lista_select_)
    const [nombre_nodo, setNombreNodo] = useState("")


    const setListaSeleccionados=(lista_)=>{
        props.setListaSeleccionados(lista_);
        seleccionGrupos(lista_);
    }

    useEffect(()=>{
        seleccionGrupos(props.lista_select_)
    }, [props.lista_select_])

    const click_nodo=(event, nombre_grupo)=>{
        event.target.parentElement.querySelector(".nested").classList.toggle("active");
        event.target.classList.toggle("caret-down");
        setNombreNodo(nombre_grupo)
    }

    const click_leaf=(event, nombre_grupo)=>{
        setNombreNodo(nombre_grupo)
        //console.log(nombre_grupo)
    }


    const seleccionarRama=(nodo, first=false)=>{
        if(first){
            list_aux_selec.push(nodo.text)
        }
        if("nodes" in nodo){
            for (let i=0; i<nodo.nodes.length; i++){
                const nodo_hijo = nodo.nodes[i];
                list_aux_selec.push(nodo_hijo.text)
                seleccionarRama(nodo_hijo)
            }
        }
    }

    const seleccion_grupo=(e, nombre_grupo)=>{
        const select = e.target.checked;
        const nodo_ = lista_nodos_flat[nombre_grupo];
        seleccionarRama(nodo_, true)
        if(select){
            setListaSeleccionados(lista_seleccionados.concat(list_aux_selec))
            //setListaSeleccionados(lista_seleccionados.concat([nombre_grupo]))
        }else{
            setListaSeleccionados(lista_seleccionados.filter((nombre)=>!list_aux_selec.includes(nombre)))
        }
    }

    const construir_arbol=(lista_nodos, first=false)=>{
        let lista_tag_nodo = []
        for (let i=0; i<lista_nodos.length; i++){
            const nodo = lista_nodos[i];
            lista_nodos_flat[nodo.text] = nodo
            let style=null
            if(nodo.text === nombre_nodo){
                style = {color: "red"}
            }

            const checked={
                checked: lista_seleccionados.includes( nodo.text) ? "checked": "",
            }

            if("nodes" in nodo){
                const tag_nodo = (<li>
                    <span  style={style} className="caret" onClick={(e)=>click_nodo(e, nodo.text)} htmlFor="firstCheckbox">
                    </span>
                    <input className="form-check-input me-1" type="checkbox" value=""
                           id={"checkbox-grupo"+nodo.text} onChange={(e)=>seleccion_grupo(e, nodo.text)} {...checked}/>
                    <label className="form-check-label" htmlFor={"checkbox-grupo"+nodo.text}>{nodo.text}</label>

                    {construir_arbol(nodo.nodes)}
                    </li>)
                lista_tag_nodo.push(tag_nodo)
            }else{
                //lista_tag_nodo.push(<li style={style} onClick={(e)=>click_leaf(e,nodo.text)}>{nodo.text}</li>)
                lista_tag_nodo.push(<li style={style} onClick={(e)=>click_leaf(e,nodo.text)}>
                    <input className="form-check-input me-1" type="checkbox" value="" {...checked}
                           id={"checkbox-grupo"+nodo.text} onChange={(e)=>seleccion_grupo(e, nodo.text)}/>
                    <label className="form-check-label" htmlFor={"checkbox-grupo"+nodo.text}>{nodo.text}</label>
                </li>)
            }
        }
        return(<ul className={first?"active":"nested"}>
            {lista_tag_nodo}
        </ul>)
    }
    //console.log("VER ARBOL :)")
    //console.log(data_tree)
    if(typeof data_tree !== 'undefined'){
        return(<div>
            {construir_arbol(data_tree, true)}
        </div>)
    }
    return (<div></div>)
}


export default TreeViewElement