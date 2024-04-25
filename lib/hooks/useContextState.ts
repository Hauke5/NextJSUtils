'use client'
import { useState }  from "react"

export type UpdateContext<CONTEXT extends {}> = (context:Partial<CONTEXT>)=>void

/**
 * ## useContextState
 * Convenience function in the creation of `Context`s. 
 * Provides a context state and implements an `updateContext` function  that allows 
 * for partial updates to the state.
 */
export function useContextState<CONTEXT extends {}>():{context:CONTEXT|undefined, updateContext:(context:Partial<CONTEXT>)=>void}
export function useContextState<CONTEXT extends {}>(initialContext:CONTEXT):{context:CONTEXT, updateContext:(context:Partial<CONTEXT>)=>void}
export function useContextState<CONTEXT extends {}>(initialContext?:CONTEXT):{context:CONTEXT|undefined, updateContext:(context:Partial<CONTEXT>)=>void} {
   const [context, setContext] = useState<CONTEXT|undefined>(initialContext)
   return {context, updateContext}

   function updateContext(newContext:Partial<CONTEXT>) {
      setContext(current => Object.assign({}, current, newContext))
   }
}
