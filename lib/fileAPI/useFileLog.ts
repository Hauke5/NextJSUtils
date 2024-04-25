import { date } from "../utils"
import { IoChannels, Log } from "../utils/log"
import { getAppFileIO }    from "./clientFileIO"
import { useAppFileIO }    from "./useAppFileIO"


export function useFileLog(prefix:string, dir:string) {
   const fileAppend = useAppFileIO().textAppend
   return log(prefix, dir, fileAppend)
}


export function FileLog(apiKey:string, prefix:string, file:string) {
   const fileAppend = getAppFileIO(apiKey).textAppend
   return log(prefix, file, fileAppend)
}

function log(prefix:string, dir:string, fileAppend:(file: string, content: string) => Promise<true | undefined>) {
   const localLog = Log(prefix, {INFO: ['darkmagenta', 'bold']})
   const fileLog = Log(prefix)
   const file = `${dir}/${date(fileLog.config().dateFormat)}`
   const io:IoChannels = {
      DEBUG:(msg:string)=>fileAppend(file, msg),
      INFO: (msg:string)=>fileAppend(file, msg),
      WARN: (msg:string)=>fileAppend(file, msg),
      ERROR:(msg:string)=>fileAppend(file, msg),
   }
   fileLog.config({useColors:false}, io)
   return {record}

   /**
    * reports an info message to the log and adds an entry to a server-side log. 
    * The message will actually be reported to the log only if the current 
    * reporting level is DEBUG or lower.
    * @param msg the message to report. For msg types, refer to [info](utils.FileLog.FileLog.info).
    * @return the message printed
    */
   function record(msg:any) { 
      localLog(msg)
      fileLog(msg)
   }
}

