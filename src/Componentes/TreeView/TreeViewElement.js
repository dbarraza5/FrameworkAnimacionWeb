import './TreeViewElement.css'
import {useEffect, useState} from "react";

function TreeViewElement(props){
    const data_tree = props.datos;

    const click_nodo=(event)=>{
        event.target.parentElement.querySelector(".nested").classList.toggle("active");
        event.target.classList.toggle("caret-down");
    }

    const construir_arbol=(lista_nodos, first=false)=>{
        let lista_tag_nodo = []
        for (let i=0; i<lista_nodos.length; i++){
            const nodo = lista_nodos[i];
            if("nodes" in nodo){
                const tag_nodo = (<li><span className="caret" onClick={(e)=>click_nodo(e)}>{nodo.text}</span>
                    {construir_arbol(nodo.nodes)}
                    </li>)
                lista_tag_nodo.push(tag_nodo)
            }else{
                lista_tag_nodo.push(<li>{nodo.text}</li>)
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