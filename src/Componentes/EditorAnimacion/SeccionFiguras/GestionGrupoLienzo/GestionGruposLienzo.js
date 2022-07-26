import TreeViewElement from "../../../TreeView/TreeViewElement";


function GestionGruposLienzo(props){
    const arbol=props.animacion.estructura_arbol_grupos()

    return (<div>
        <TreeViewElement datos={arbol.nodes}/>
        <button onClick={()=>{
            const arbol = props.animacion.estructura_arbol_grupos()
            console.log(arbol)
        }}>vamos aver</button>
    </div>)
}

export default GestionGruposLienzo