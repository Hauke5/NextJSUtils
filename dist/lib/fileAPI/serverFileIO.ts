
import * as fsNode            from 'fs'
import path                   from 'path'
import { getServerSession }   from 'next-auth';
import { ALL_USERS }          from '@/lib/auth/useUserRole';
import { ApiError }           from '@/lib/fileAPI/apiCall';
import { date, ms }           from '@/lib/utils/date';
import { Log }                from '@/lib/utils/log';
import { authOptions }        from '@/lib/auth/authOptions';
import fs, { Times }          from '@/lib/fileAPI/fsUtil'
import { AccessFileSpec, AppFileIO, FilePathInfo, Permission, Permissions, Versioning }        
                              from './fileIOsupport';

const log            = Log(`serverFileIO`);
const accessLog      = log.bind(log)

const dataRoot       = path.join(process.cwd(),'../data')
const ACCESS_FILE    = '.access.json'


/** 
 * ### serverIO wrapper for server side file system functions.
 * This wrapper 
 * - utilizes the `next-auth` authentication system to test for user authorization
 * - adds a simple access configuration policy to manage access permissions per folder 
 * via a `.access.json` file.
 * - limits access to the `data/<appKey>` sandbox for the app that is calling these functions
 * 
 * ### Access configuration
 * Per default, all types of access to folders within the `data` root folder of the nextjs server instance are
 * available to all
 * 
 * Access rights can be progressively limited along the folder tree within the `data` root folder
 * by placing a `.access.json` Access Control File in a folder, with the following JSON content:
 * ```
 * {
 *  "read": [<list of next-auth user names>],
 *  "write":[<list of next-auth user names>]
 *  "grant":[<list of next-auth user names>]
 * }
 * ```
 * - `read` access allows the user to read the requested file (both hidden and non-hidden) or query details on the requested directory
 * - `write` access allows the user to create, and write to, a file; without `grant` access, `write` access will only be granted for 
 * non-hidden files (i.e. files whose names do not start with a period `.`)
 * - `grant` access allows a user to change hidden files (such as `.access.json` itself)
 * 
 * The user names in this file will be matched with the user currently authorized by `next-auth`.
 * In addition, a public user (`"public"`) can be configured to determine permissions for cases where 
 * no user is logged in. 
 * 
 * Access Control Files are evaluated from the `data` root to the folder of the file for which access is requested.
 * All users must initially be defined in the first encountered Access Control File in the hierarchy tree.
 * Along that path, the initial access rights of a user can be further restricted, but not broadened.
 */
export default function serverFileIO (appKey:string):AppFileIO {
   return {
      pathInfo, isFile, isDir, move, remove, 
      jsonRead, jsonWrite, binRead, textRead, 
      textWrite:  (file:string, content='', versioning=false) => textWrite(file, content, versioning, false), 
      textAppend: (file:string, content='', versioning=false) => textWrite(file, content, versioning, true),
      hasAccess,
   }


   /**
    * Checks if the user has read permission for `file`
    * @returns a boolean as a Promise, indicating if `file` exists and is readable
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    * - reading `file` is denied for the currently authenticated user
    */
   async function hasAccess(file:string):Promise<Permission> {
      try {
         const fileName = checkForValidAppPath(file)
         const {perm} = await hasPermission(fileName)
         accessLog(()=>`hasReadAccess for user '${perm.user}' to '${appKey}:${file}': ${perm.read?'r':'-'}/${perm.write?'w':'-'}`)
         return perm
      } catch(e) {
         const message = `hasReadAccess '${appKey}:${file}'`
         log.error(`${message}: ${e}`)
         const cause = (e instanceof ApiError)? e : 'see server log'
         throw new ApiError(message, {cause})
      }
   }

   /**
    * Provides a fetch function for app API calls. 
    * The `input` parameter will be prepended by `/api/<appKey>` to trigger `Nextjs's` API mechanism.
    * 
    * Checking a file or folder without read or write permission will return a valid response (i.e. not throw an ApiError) 
    * with `isFile:false`, `isDir:false`, `fileList:[]`, `dirList:[]`, and no sharing information
    * @returns the requested `FilePathInfo` as a Promise
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    */
   async function pathInfo(filePath:string):Promise<FilePathInfo> {
      try {
         const pathName = checkForValidAppPath(filePath)
         const {perm, sharing} = await hasPermission(pathName)
         if (perm.read) {
            const isFile = fs.isFileSync(pathName)
            const isDir  = fs.isDirectorySync(pathName)
            const items = isDir? fs.readDirSync(pathName) : []
            const fileList = items.filter(f => fs.isFileSync(path.join(pathName, f)))
            const dirList  = items.filter(f => fs.isDirectorySync(path.join(pathName, f)))
            const times = fs.pathTimesSync(pathName)
            accessLog(()=>`pathInfo (${perm.user}) for '${pathName}'`)
            return {appKey, path:filePath, isFile, isDir, fileList, dirList, sharing, times}
         }
      } catch(e) {
         const message = `filePathInfo '${appKey}:${filePath}'`
         log.error(`${message}: ${e}`)
      }
      return {appKey, path:filePath, isFile:false, isDir:false, fileList:[], dirList:[], sharing:{read:[], write:[], grant:[]}, times:defaultTimes()}

      function defaultTimes():Times {
         return {
            modified: new Date('1/1/1970'),
            created:  new Date('1/1/1970'),
            accessed: new Date('1/1/1970'),
         }
      }
   }

   /**
    * Checks if a `file` exists as a file relative to `data` root and if the user has read permission
    *
    * Checking a file without read or write permission will return a valid response (i.e. not throw an ApiError) of `false`
    * @returns a boolean as a Promise, indicating if `file` exists and is readable
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    */
   async function isFile(file:string):Promise<boolean> {
      try {
         const fileName = checkForValidAppPath(file)
         const {perm} = await hasPermission(fileName)
         const data = fs.isFileSync(fileName)
         accessLog(()=>`isFile (${perm.user}) '${appKey}:${file}': ${data}`)
         return data && perm.read
      } catch(e) {
         const message = `isFile '${appKey}:${file}'`
         log.error(`${message}: ${e}`)
         throw false
      }
   }

   /**
    * Checks if a `path` exists as a directory relative to `data` root and if the user has read permission
    * @returns a boolean as a Promise, indicating if `path` exists and is readable
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    * - reading `file` is denied for the currently authenticated user
    */
   async function isDir(path:string):Promise<boolean> {
      try {
         const pathName = await passReadPermission(path)
         const data = fs.isDirectorySync(pathName)
         accessLog(()=>`isDir '${appKey}:${path}': ${data}`)
         return data
      } catch(e) {
         const message = `isDir '${appKey}:${path}'`
         log.error(`${message}: ${e}`)
         return false
      }
   }

   /** 
    * moves a file of directory from `fromPath` to `toPath` and returns `true` if the operation was successful. 
    * @returns `true` as a Promise
    * @throws *ApiError* if
    * - `appKey` or `fromPath` or `toPath` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `fromPath` or `toPath` attempt to breach the sandboxed `appKey` directory
    * - reading `fromPath` is denied for the currently authenticated user
    * - writing `toPath` is denied for the currently authenticated user
    * - `toPath` refers to a hidden file
    */
   async function move(fromPath:string, toPath:string, versioning:Versioning=false):Promise<true> {
      try {
         const from = await passReadPermission(fromPath)
         const to   = await passWritePermission(toPath)
         checkVersioning(from, versioning)
         const result = await fs.rename(from, to)
         accessLog(()=>`fileMove moved '${appKey}:${fromPath}' to '${appKey}:${toPath}'`)
         if (!result) {
            throw new ApiError(`fileMove failed: '${fromPath}'->'${toPath}'`)
         }
         const removed = !fs.isFileSync(from) && !fs.isDirectorySync(from)
         if (!removed) {
            throw new ApiError(`fileMove failed to remove '${from}'`)
         }
         const created = fs.isFileSync(to) || fs.isDirectorySync(to)
         if (!created) {
            throw new ApiError(`fileMove failed to create '${to}'`)
         }
         return true
      } catch(e) {
         const message = `fileMove '${fromPath}'->'${toPath}'`
         log.error(`${message}: ${e}`)
         const cause = (e instanceof ApiError)? e : 'see server log'
         throw new ApiError(message, {cause})
      }
   }

   /**
    * removes `file`. 
    * @return `true` as a Promise
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    * - writing `file` is denied for the currently authenticated user
    * - `file` refers to a hidden file
    */
   async function remove(file:string, versioning:Versioning=false):Promise<true> {
      try {
         const fileName = await passWritePermission(file)
         checkVersioning(fileName, versioning)
         await fs.remove(fileName)
         accessLog(`deleted '${appKey}:${fileName}'`)
         return true
      } catch(e) {
         const message = `deleting '${appKey}:${file}'`
         log.error(`${message}: ${e}`)
         const cause = (e instanceof ApiError)? e : 'see server log'
         throw new ApiError(message, {cause})
      }
   }

   /**
    * Reads a `file` as a JSON content
    * @returns a JSON object of type `RETURN` as a Promise
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    * - reading `file` is denied for the currently authenticated user
    */
   async function jsonRead<RETURN=any>(file:string):Promise<RETURN> {
      try {
         const fileName = await passReadPermission(file)
         const content = fs.readJsonFileSync<RETURN>(fileName)
         accessLog(`read object from '${fileName}'`)
         return content
      } catch(e) {
         const message = `reading object from '${appKey}:${file}'`
         log.error(`${message}: ${e}`)
         const cause = (e instanceof ApiError)? e : 'see server log'
         throw new ApiError(message, {cause})
      }
   }

   /**
    * Reads a `file` as a TEXT content
    * @returns a string as a Promise
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    * - reading `file` is denied for the currently authenticated user
    */
   async function textRead(file:string):Promise<string> {
      try {
         const fileName = await passReadPermission(file)
         const content = await fs.readTextFile(fileName)
         accessLog(`read text (${content.length} chars) from '${appKey}:${fileName}'`)
         return content
      } catch(e) {
         const message = `reading text from '${appKey}:${file}'`
         log.error(`${message}: ${e}`)
         const cause = (e instanceof ApiError)? e : 'see server log'
         throw new ApiError(message, {cause})
      }
   }

   /**
    * Reads a `file` as binary content
    * @returns a string as a Promise
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    * - reading `file` is denied for the currently authenticated user
    */
   async function binRead(file:string):Promise<string> {
      try {
         const fileName = await passReadPermission(file)
         const content = await fs.readFile(fileName, false)
         accessLog(`read text (${content.length} chars) from '${appKey}:${fileName}'`)
         return content
      } catch(e) {
         const message = `reading text from '${appKey}:${file}'`
         log.error(`${message}: ${e}`)
         const cause = (e instanceof ApiError)? e : 'see server log'
         throw new ApiError(message, {cause})
      }
   }

   /**
    * write `content` as JSON to `file` with optional versioning. 
    * @param versioning *false if omitted*; if `true`, any previous existing `file` is renamed to include an ascending version number.
    * @return `true` as a Promise
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    * - writing `file` is denied for the currently authenticated user
    * - `file` refers to a hidden file
    */
   async function jsonWrite(file:string, content:any, versioning:Versioning=false):Promise<true> {
      try {
         const fileName = await passWritePermission(file)
         checkVersioning(fileName, versioning)
         await fs.writeJsonFile(fileName, content)
         log.info(`wrote object${versioning?' with versioning':''} to '${appKey}:${fileName}'`)
         return true
      } catch(e) {
         const message = `writing object to '${appKey}:${file}'`
         log.error(`${message}: ${e}`)
         const cause = (e instanceof ApiError)? e : 'see server log'
         throw new ApiError(message, {cause})
      }
   }

   /**
    * write or appends `content` to a text `file` with optional versioning. 
    * @param versioning *false if omitted*; if `true`, any previous existing `file` is renamed to include an ascending version number.
    * @param append *false if omitted*; if `true`, appends `content` and a line feed ('\n') to any existing file content.
    * @return `true` as a Promise
    * @throws *ApiError* if
    * - `appKey` or `file` are undefined
    * - `appKey` attempts to breach the sandboxed `data` root directory
    * - `file` attempt to breach the sandboxed `appKey` directory
    * - writing `file` is denied for the currently authenticated user
    * - `file` refers to a hidden file
    */
   async function textWrite(file:string, content='', versioning:Versioning=false, append=false):Promise<true> {
      try {
         const fileName = await passWritePermission(file)
         checkVersioning(fileName, versioning)
         append
            ? await fs.appendFile(fileName, content+'\n')
            : await fs.writeTextFile(fileName, content)
         log.info(`${append?'appended':'wrote'} text (${content.length} chars)${versioning?' with versioning':''} to '${appKey}:${fileName}'`)
         return true
      } catch(e) {
         const message = `writing text to '${appKey}:${file}'`
         log.error(`${message}: ${e}`)
         const cause = (e instanceof ApiError)? e : 'see server log'
         throw new ApiError(message, {cause})
      }
   }



   //--------------------------------------


   function checkForValidAppPath(file:string) {
      if (!appKey || file===undefined) throw new ApiError(`attempted sandbox breach: undefined appKey or file`)
      const appPath = path.join(dataRoot, appKey)
      if (appPath.indexOf(dataRoot)!==0) throw new ApiError(`attempted sandbox breach for appKey '${appKey}'`)
      const fileName = path.join(appPath, file)
      if (fileName.indexOf(appPath)!==0) throw new ApiError(`attempted breach of sandbox '${appKey}' for '${file}'`)
      return fileName
   }


   type HasPermission = {
      perm:    Permission
      perms:   Permissions
      sharing: AccessFileSpec
   }
   async function hasPermission(fileName:string):Promise<HasPermission> {
      return getServerSession(authOptions).then(session => {
         const user = session?.user?.name ?? ALL_USERS
         const perms = getPermissions(fileName)
         const read  = perms[user]?.read  ?? perms[ALL_USERS]?.read ?? false
         const write = perms[user]?.write ?? perms[ALL_USERS]?.write ?? false
         const grant = perms[user]?.grant ?? false
         const sharing = permissionsToAccessSpecs(perms)
         log.debug(()=>`hasPermission(${user}): ${read?'r':'-'}${write?'w':'-'}${grant?'g':'-'} for file '${fileName}'`)
         return ({perm: {user, read, write, grant}, sharing, perms})
      })
   }

   /**
    * assembles the canonical server file path and checks for write permission 
    * @return the resolved canonical file path, or `null` if the current user has no read permission
    */
   async function passReadPermission(file:string):Promise<string> {
      const fileName = checkForValidAppPath(file)
      const {perm} = await hasPermission(fileName)
      if (!perm.read) {
         throw new ApiError(`read access denied for ${perm.user} to '${file}'`)
      }
      return fileName
   }

   /**
    * assembles the canonical server file path and checks for write permission 
    * @return the resolved canonical file path, or `null` if the current user has no write permission
    */
   async function passWritePermission(file:string):Promise<string> {
      const fileName = checkForValidAppPath(file)
      const {perm, perms} = await hasPermission(fileName)

      // ACCESS_FILE can be changed with `grant` permission
      if (isHiddenFile(fileName) && !perm.grant) 
         throw new ApiError(`attempted write access to hidden '${file}'`)

         log.debug(()=>`   '${perm.user}' has${(perms[perm.user].read||perms[ALL_USERS].read)?'':' no'} read access to file '${fileName}'\n`)
         if (!perm.write) {
         throw new ApiError(`write access denied for user '${perms.user}' to '${file}'`)
      }
      return fileName
   }

   function isHiddenFile(fileWithPath:string):boolean {
      const lastSlash = fileWithPath?.lastIndexOf('/')
      const strippedFileName = fileWithPath.slice(lastSlash)
      return strippedFileName.startsWith('.')
   }

   /**
    * Checks the permissions for the currently authenticated user.
    * Determines if the user is authorized to access the requested file in read or write mode.
    * - Rejects both `read` and `write` if `request` references a file outside of the `request.app` sandbox.
    * - Otherwise rejects access unless an `.access.json` files exists along the path that explicitly provides access to `user` 
    * by having an entry `read` or `write` that contains `user`.
    * - Additional instances of `.access.json` further down in the file hierarchy can further restrict, but not broaden access to files.
    * - Finally, missing `read` rights also reject `write` requests
    * @param absfile the canonical absolute path to the file on the server
    * @return Permissions object
    */
   function getPermissions(absfile:string):Permissions {
      const permissions:Permissions = {[ALL_USERS]: {user:ALL_USERS, read:undefined, write:undefined, grant:false}}

      const start = absfile.indexOf(dataRoot)
      const parts = absfile.substring(start+dataRoot.length).split('/') //.filter(p => p !== request.fileName)
      parts.forEach((part,i)=> {
         const dir  = path.join(dataRoot, parts.slice(0,i).join('/'))
         const file = path.join(dir, ACCESS_FILE)
         updatePermissions(permissions, file)
      })
      // in case there were no access files (fields are undefined): allow public use
      if (permissions[ALL_USERS]) {
         permissions[ALL_USERS].read ??= true
         permissions[ALL_USERS].write ??= true
      }
      log.debug(()=>`   permissions for '${absfile}': ${message(permissions)}`)
      return permissions
   }
      
   function updatePermissions(permissions:Permissions, accessFile:string) {
      try {
         // read access file
         const accessSpec = fs.isFileSync(accessFile)
            ? fs.readJsonFileSync<AccessFileSpec>(accessFile)
            : undefined

         if (!accessSpec) return    // no change if no access file

         // the first encounter of an access file from the top level (dataRoot):
         //   if ALL_USERS permissions are still default undefined, then add an entry for each user mentioned.
         //   This allow new users to be defined only for the first instance of an access file, 
         //   ideally at top level (with default permissions), and prevents new users gaining access lower in the tree.
         if ((permissions[ALL_USERS].read===undefined || permissions[ALL_USERS].write===undefined)) {
            // block this option for subsequent calls:
            permissions[ALL_USERS].read ??= true
            permissions[ALL_USERS].write ??= true
            // define all users that are not yet listed in `permissions`:
            accessSpec.read?.forEach(user => permissions[user] ??= {user})
            accessSpec.write?.forEach(user => permissions[user] ??= {user})
            accessSpec.grant?.forEach(user => permissions[user] ??= {user})
         }

         // for all levels: only allow narrowing permissions from here on out:
         // i.e. `undefined` can become `true` or `false`, `true` can become `false`, and `false` must not change
         const usersList = Object.keys(permissions) // all known users, incl. ALL_USERS
         usersList.forEach(user => {
            if (permissions[user].read !== false) // unless previously limited:
               permissions[user].read = accessSpec.read?.includes(user)? true : false
                  
            if (permissions[user].write !== false) // unless previously limited:
               permissions[user].write = accessSpec.write?.includes(user)? true : false
                  
            if (permissions[user].grant !== false) // unless previously limited:
               permissions[user].grant = accessSpec.grant?.includes(user)? true : false    
         })
         log.debug(()=>`      permissions for '${accessFile}': ${message(permissions)}`)
      } catch(e) {
         log.warn(`updating permissions from '${accessFile}': ${e}`)
      }
   }


   /** 
    * Considers using a simple versioning mechanism on `file`.
    * if `<file>` already exists it is renamed as `<file>.<version>`, 
    * where `<version>` is the smallest integer number for which no file exists yet.
    */
   function checkVersioning(file:string, versioning:Versioning) {
      if (fs.isFileSync(file)) switch(versioning) {
         case false:
         case 'off':
         case 0:     
            return
         case 'unlimited':
         case true:
         case -1:    
            return createVersion();
         case 'phased':
         default:    
            createVersion();
            pruneVersions(versioning);
            return
      }

      function createVersion() {
         const name = path.basename(file)
         const dir = path.dirname(file)
         // const list = fsNode.readdirSync(dir).filter(n => n.indexOf(name+'.')>=0).map(n => +n.slice((name.length+1)))
         // const version = list.reduce((acc, l)=>l>acc?l:acc, -1)+1
         const times = fs.pathTimesSync(file)
         const version = date('%YYYY%MM%DD-%hh%mm%ss', times.modified)
         const newName = `${dir}/${name}.${version}`
         fsNode.renameSync(file, newName)
         accessLog(`renamed '${file}' -> '${newName}'`)
      }
      function pruneVersions(versioning:number|'phased') {
         // collect existing versions
         const name = path.basename(file)
         const dir = path.dirname(file)
         const now = new Date()
         const days:boolean[] = []
         const months:boolean[] = []
// console.log(`pruning ${file} in dir '${dir}'`)
         const versions = fs.readDirSync(dir)
            // find the versions of `name`:
            .filter(file => file.indexOf(name)===0)
            // find the version's dates:
            .map(file => {
               const dateStr = file.slice(-15)
               const date = new Date(+dateStr.slice(0,4),+dateStr.slice(4,6)-1,+dateStr.slice(6,8),+dateStr.slice(9,11),+dateStr.slice(11,13),+dateStr.slice(13))
               const days = ms.toDays(now.getTime() - date.getTime())
               return {file, date, days}
            })
            .sort((v1, v2) => v1.days-v2.days)  // youngest first, oldest last
            // isolate the versions to be pruned:
         const prune = versions.filter(version => {
            if (typeof versioning === 'number' && versioning>0) {
               // don't prune younger versions:
               if (version.days < versioning) return false
            } else if (versioning === 'phased') {
               // <24h: don't prune
               if (version.days < 1) return false

               // keep only latest version per day
               if (version.days < 30) { 
                  const day = version.date.getDate()
                  // don't prune if first version that day
                  if (!days[day]) {
                     days[day] = true
                     return false
                  }
               } 
               // keep only latest version per month
               else {
                  const month = version.date.getMonth()
                  // don't prune if first version that month
                  if (!months[month]) {
                     months[month] = true
                     return false
                  }
               }
            }
            return true
         })
         const del = prune.map(v => path.join(dir, v.file))
if (prune.length) console.log(`prune: \n   ${prune.map(v=>`${v.file} (${Math.round(v.days*10)/10})`).join('\n   ')}`)
         del.forEach(file => {
            console.log(`deleted '${file}'`)
            fs.removeSync(file)
         }) 
      }
   }

   function permissionsToAccessSpecs(permissions:Permissions):AccessFileSpec {
      const users = Object.keys(permissions)
      return {
         read:  users.filter(user => permissions[user].read),
         write: users.filter(user => permissions[user].write),
         grant: users.filter(user => permissions[user].grant),
      }
   }

   function message(p:Permissions) {
      const users = Object.keys(p)
      const perms = [
         users.filter(user => p[user].read !==false).map(user => p[user].read ===true?`${user}`:`-${user}`).join(','),
         users.filter(user => p[user].write!==false).map(user => p[user].write===true?`${user}`:`-${user}`).join(','),
         users.filter(user => p[user].grant!==false).map(user => p[user].grant===true?`${user}`:`-${user}`).join(','),
      ]
      return `r=[${perms[0]}], w=[${perms[1]}], g=[${perms[2]}]})`
   }
}
