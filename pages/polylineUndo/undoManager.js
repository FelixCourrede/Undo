import undocommand from './undoCommand'
import Stack from './stack';


export class undoManager{
stackundo=new Stack();
stackredo=new Stack();

undo(){
        undocommand(stackredo,stackundo)
    }

redoLine(stackredo, stackundo, polyline, dessin ){
    polyline=stackredo.peek();
    if (polyline==null){
        console.log("Rien dans le redo stack")
        return;
    }
    stackundo.push(polyline)
    stackredo.pop()
    dessin.add(polyline)
}}
export default {undoManager}