import {useState} from "react";

const ArbolGrupos=(props)=>{

    const data_tree = props.datos;
    const [lista_nodos_flat, setListaNodosFlat] = useState({})
    const [nombre_nodo, setNombreNodo] = useState("")
    const [nodo_select, setNodoSelect] = useState(null)

    const click_nodo=(event, nombre_grupo)=>{
        event.target.parentElement.querySelector(".nested").classList.toggle("active");
        event.target.classList.toggle("caret-down");
        //setNombreNodo(nombre_grupo)
    }

    const click_leaf=(event, nombre_grupo)=>{
        setNombreNodo(nombre_grupo)
        //console.log(nombre_grupo)
    }

    const seleccion_nodo=(event)=>{
        //console.log(event.target.value)
        //setNodoSelect(event.target.value)
        props.setNombreGrupo(event.target.value)
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


            if("nodes" in nodo){
                const tag_nodo = (<li>
                    <span  style={style} className="caret" onClick={(e)=>click_nodo(e, nodo.text)} htmlFor="firstCheckbox">
                    </span>
                    <input className="form-check-input me-1" type="radio" value={nodo.text} name={props.id_animacion}
                           id={"checkbox-grupo"+nodo.text} onChange={seleccion_nodo}/>
                    <label className="form-check-label" htmlFor={"checkbox-grupo"+nodo.text}>{nodo.text}</label>

                    {construir_arbol(nodo.nodes)}
                </li>)
                lista_tag_nodo.push(tag_nodo)
            }else{
                //lista_tag_nodo.push(<li style={style} onClick={(e)=>click_leaf(e,nodo.text)}>{nodo.text}</li>)
                lista_tag_nodo.push(<li style={style} onClick={(e)=>click_leaf(e,nodo.text)}>
                    <input className="form-check-input me-1" type="radio" value={nodo.text} name={props.id_animacion}
                           id={"checkbox-grupo"+nodo.text} onChange={seleccion_nodo}/>
                    <label className="form-check-label" htmlFor={"checkbox-grupo"+nodo.text}>{nodo.text}</label>
                </li>)
            }
        }
        return(<ul className={first?"active":"nested"}>
            {lista_tag_nodo}
        </ul>)
    }

    if(typeof data_tree !== 'undefined'){
        return(<div>
            {construir_arbol(data_tree, true)}
        </div>)
    }
    return (<div></div>)
}

export default ArbolGrupos;