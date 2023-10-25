export default{undoLine}

export function undoLine(stackredo, stackundo){
    polyline=stackundo.peek();
    if (polyline==null){
        console.log("Rien dans le undo stack")
    }
    stackredo.push(polyline);
    stackundo.pop()
    polyline.remove();
}