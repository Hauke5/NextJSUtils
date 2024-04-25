/**
 * ## Rerender
 * a react hook to initiate a rerendering of the component.
 * The hook works by using `useState`, initiatized to `0`, and incrementing it with each 
 * call to the `rerender` function returned by the hook.
 */
'use client'
import { useState } from "react";

export interface Rerender { 
   ():number;
   count: ()=>number
   reset: ()=>void
}

const voidRerender:Rerender = ()=>0
voidRerender.count = ()=>0
voidRerender.reset = ()=>undefined;

export {voidRerender}

/**
 * a react hook to initiate a rerendering of the calling component.
 * `useRerender` returns a `rerender` function that, when called, will cause the 
 * component using the hook to be rerendered.
 * the `rerender.count` field will return the current state count.
 * @param options 
 * @returns 
 */
export function useRerender():Rerender {
   const [count,setCount] = useState(0)
   const r = ()=>{
      setCount(c=>c+1)
      return count+1
   }
   r.reset = ()=>setCount(0)
   r.count = ()=>count
   return r
}