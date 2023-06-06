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

    const construir_nodo=(valor)=>{
        return (<li  onClick={(e)=>click_leaf(e,valor)}>
            <input className="form-check-input me-1" type="radio" value={valor} name={props.id_animacion}
                   id={"checkbox-grupo"+valor} onChange={seleccion_nodo}/>
            <label className="form-check-label" htmlFor={"checkbox-grupo"+valor}>{valor}</label>
        </li>)
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
            let tag_nodo = null;

            if("nodes" in nodo){
                tag_nodo = (<li>
                    <span  style={style} className="caret" onClick={(e)=>click_nodo(e, nodo.text)} htmlFor="firstCheckbox">
                    </span>
                    <input className="form-check-input me-1" type="radio" value={nodo.text} name={props.id_animacion}
                           id={"checkbox-grupo"+nodo.text} onChange={seleccion_nodo}/>
                    <label className="form-check-label" htmlFor={"checkbox-grupo"+nodo.text}>{nodo.text}</label>

                    {construir_arbol(nodo.nodes)}
                </li>)

                //lista_tag_nodo.push(tag_nodo)
            }else{
                //lista_tag_nodo.push(<li style={style} onClick={(e)=>click_leaf(e,nodo.text)}>{nodo.text}</li>)
                tag_nodo = construir_nodo(nodo.text);
                //lista_tag_nodo.push(construir_nodo(nodo.text))
            }
            lista_tag_nodo.push(tag_nodo)
        }
        return(<ul className={first?"active":"nested"}>
            {lista_tag_nodo}
        </ul>)
    }

    if(typeof data_tree !== 'undefined'){
        return(<div>
            <ul className="active">
                <li>
                    <span   className="caret" onClick={(e)=>click_nodo(e, "root")} htmlFor="firstCheckbox">
                    </span>
                    <input className="form-check-input me-1" type="radio" value="root" name={props.id_animacion}
                           id={"checkbox-grupo"+"root"} onChange={seleccion_nodo}/>
                    <label className="form-check-label" htmlFor={"checkbox-grupo"+"root"}>root</label>
                    {construir_arbol(data_tree.nodes)}
                </li>
            </ul>


        </div>)
    }
    return (<div></div>)
}

export default ArbolGrupos;