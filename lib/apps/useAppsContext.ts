import { useContext }   from "react"
import { AppsContext, appsContext } 
                        from "./AppsContext"




export function useAppsContext():AppsContext {
   const context = useContext(appsContext)
   if (!context) throw Error(`useAppsContext is called outside the context`)
   return context
}
