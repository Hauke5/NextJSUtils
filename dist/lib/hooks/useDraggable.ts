import { RefObject, useEffect, useRef } 
                        from "react";
import { useRerender }  from "./useRerender";


export interface Moveable {
    pos:        {x:number, y:number}
    startDrag:  (e:MouseEvent)=>void
    drag:       (e:MouseEvent)=>void
    stopDrag:   (e:MouseEvent)=>void
    ref:        RefObject<HTMLDivElement>
}
/**
 * A hook that allows clicking and dragging an element on the screen. 
 * @param initialPos 
 * @returns handles to manage the dragging:
 * - ref:   a reference to be tied to the element that should be moved 
 */
export function useDraggable(ref:HTMLDivElement|null, initialPos:{x:number, y:number}):{x:number, y:number} {
    const rerender = useRerender()
    const pos       = useRef(initialPos)
    const startPos  = useRef<{x:number, y:number}|null>(null)
    useEffect(()=>{
        ref?.addEventListener('mousedown', startDrag)
    },[ref])

    return pos.current

    function startDrag(e:MouseEvent) {
        if (startPos.current===null) {
            e.preventDefault();
            startPos.current = {x:e.clientX-pos.current.x, y:e.clientY-pos.current.y}
            const body = document.getElementsByTagName('body')[0]
            body.addEventListener('mouseup',   stopDrag)
            body.addEventListener('mousemove', drag)
        }
    }

     function drag(e:MouseEvent) {
        if (startPos.current) {
            e.preventDefault();
            pos.current.x = e.clientX - startPos.current.x
            pos.current.y = e.clientY - startPos.current.y
            rerender()
        }
     }

     function stopDrag(e:MouseEvent) {
        if (startPos.current) {
            e.preventDefault();
            startPos.current = null
            const body = document.getElementsByTagName('body')[0]
            body.removeEventListener('mouseup',   stopDrag)
            body.removeEventListener('mousemove', drag)
        }
     }
}