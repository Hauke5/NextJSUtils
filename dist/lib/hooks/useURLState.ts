import { usePathname, useRouter, useSearchParams } 
            from "next/navigation";
import { Dispatch, SetStateAction, useEffect } 
            from "react";

/** 
 * stores a component state as a query for `<key>` in the URL.
 * The interface is designed to mimick that of `useState`, except that it works on a global context.
 */
export function useURLState<T extends string = string>(key:string, initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
export function useURLState<T extends string = string>(key:string): [T|undefined, Dispatch<SetStateAction<T>>];
export function useURLState<T extends string = string>(key:string, initialState?: T | (() => T)): [T|undefined, Dispatch<SetStateAction<T>>] {
   const pathname = usePathname()
   const query    = useSearchParams()
   const router   = useRouter()
   const state  = query.get(key) as T ?? undefined
   useEffect(()=>{
      if (state) {
         if (state !== query.get(key)) setState(state)
      } else if (initialState!==undefined)
         setState(typeof initialState === 'function'? initialState() : initialState) 
   },[state])
   return [state, setState]

   function setState(s:T) {
// console.log(`useURLState(${key}): ${s}`)
      if (s.length>0) {
         const map = new Map(query.entries())
         map.set(key, s)
         const href = `${pathname}?${map.size? Array
            .from(map.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('&') : ''}`
         router.push(href)
      }
   }
}