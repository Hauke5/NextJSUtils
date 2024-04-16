import { NextRequest }  from "next/server";
import { Log }          from "@/lib/utils";
import { apiResponse, ApiError }   
                        from "@/lib/fileAPI/apiCall";
import { FileAction, Actions }   
                        from "@/lib/fileAPI/fileIOsupport";
import server           from "@/lib/fileAPI/serverFileIO"

const log = Log(`fileAPI`)


/** file API */
export async function POST(request: NextRequest) {
   const action = await request.json() as FileAction
   const result = await processAction(action, action.appKey)
   log.debug(`${action.type}(${action.appKey}): ok`)
   return result  
}

async function processAction(action:FileAction, appKey:string) {
   const io = server(appKey)
   const type:string = action.type
   switch (action.type) {
      case Actions.hasAccess: return apiResponse(()=>io.hasAccess(action.file))
      case Actions.isFile:    return apiResponse(()=>io.isFile(action.file))
      case Actions.isDir:     return apiResponse(()=>io.isDir(action.path))
      case Actions.pathInfo:  return apiResponse(()=>io.pathInfo(action.path))
      case Actions.textRead:  return apiResponse(()=>io.textRead(action.file))
      case Actions.textWrite: return apiResponse(()=>io.textWrite(action.file, action.content, action.versioning))
      case Actions.textAppend:return apiResponse(()=>io.textAppend(action.file, action.content, action.versioning))
      case Actions.jsonRead:  return apiResponse(()=>io.jsonRead(action.file))
      case Actions.jsonWrite: return apiResponse(()=>io.jsonWrite(action.file, action.content, action.versioning))
      case Actions.move:      return apiResponse(()=>io.move(action.from, action.to))
      case Actions.remove:    return apiResponse(()=>io.remove(action.path))
      default:          throw new ApiError(`received unknown action ${type}`)
   }
}