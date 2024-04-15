import { Log }          from '@/lib/utils/log';
import { apiCall }      from './apiCall';
import { AppFileIO, FileAction, FilePathInfo, Permission, Actions } 
                        from "./fileIOsupport"

const log = Log(`clientFileIO`)



/** returns file IO functions to access server files in the `appKey` namespace  */
export function getAppFileIO(appKey:string):AppFileIO{
   if (!appKey) throw Error(`undefined appKey in getAppFileIO`)
   return {
      pathInfo:   async (path:string)                                   => {
         const info = await callFileActionAPI<FilePathInfo>({type:Actions.pathInfo, appKey, path})
         if (info) {
            const times = info.times
            times.accessed = new Date(times.accessed)
            times.created = new Date(times.created)
            times.modified = new Date(times.modified)
         }
         return info
      },
      hasAccess:  (file:string)                                   => callFileActionAPI<Permission>({type:Actions.hasAccess, appKey, file}),
      isFile:     (file:string)                                   => callFileActionAPI<boolean>({type:Actions.isFile, appKey, file}),
      isDir:      (path:string)                                   => callFileActionAPI<boolean>({type:Actions.isDir, appKey, path}),
      binRead:    (file:string)                                   => callFileActionAPI<string>({type:Actions.binRead, appKey, file}), 
      textRead:   (file:string)                                   => callFileActionAPI<string>({type:Actions.textRead, appKey, file}), 
      textWrite:  (file:string, content:string, versioning=false) => callFileActionAPI<true>({type:Actions.textWrite, appKey, file, content, versioning}),
      textAppend: (file:string, content:string, versioning=false) => callFileActionAPI<true>({type:Actions.textAppend, appKey, file, content, versioning}),
      jsonRead:   <RETURN=any>(file:string)                       => callFileActionAPI<RETURN>({type:Actions.jsonRead, appKey, file}),
      jsonWrite:  (file:string, content:any, versioning=false)    => callFileActionAPI<true>({type:Actions.jsonWrite, appKey, file, content, versioning}),
      move:       (from:string, to:string)                        => callFileActionAPI<true>({type:Actions.move, appKey, from, to}),
      remove:     (path:string)                                   => callFileActionAPI<true>({type:Actions.remove, appKey, path}),
   }
}

async function callFileActionAPI<RETURN>(action:FileAction):Promise<RETURN|undefined> {
   try {
      return await apiCall<RETURN>(`/api/hs/file`, action)
   } catch(e:any) { 
      log.warn(`calling '${action.type}': ${e}, cause: ${e.cause}`)
      switch(action.type) {
         case Actions.hasAccess: return {user:'', read:false, write:false, grant:false} as RETURN
         case Actions.isFile:
         case Actions.isDir:     return false as RETURN
         case Actions.pathInfo: 
         case Actions.binRead: 
         case Actions.textRead: 
         case Actions.jsonRead:  return undefined  // return without alert
         default:    // return with alert
            if (typeof alert==='function') alert(`calling ${action.type}: ${e}`)
            return undefined
      }
   }
}

