import { Times } from "@/lib/fileAPI/fsUtil"

export type AccessFileSpec = {
   read?:   string[]
   write?:  string[]
   grant?:  string[]
}

export type Permission = {
   user:    string
   /** user has read permission to the directory or files therein */
   read:    boolean
   /** user has write permission to the directory or files therein */
   write:   boolean
   /** user has permission to grant read or write permission for the directory or files therein */
   grant:   boolean
}

export type Permissions = {
   [user:string]: Partial<Permission>
}



export interface FilePathInfo {
   appKey:        string
   path:          string         // the path this info is for
   isFile:        boolean        // path is a file
   isDir:         boolean        // path is a directory
   fileList:      string[]       // if a directory, it contains these files
   dirList:       string[]       // if a directory, it contains these sub-directories
   sharing:       AccessFileSpec // filePath read/write permissions
   times:         Times          // created, last accessed and modified
}

export const Actions:Actions = {
   pathInfo:   'pathInfo',
   hasAccess:  'hasAccess',
   isFile:     'isFile',
   isDir:      'isDir',
   binRead:    'binRead',
   textRead:   'textRead',
   textWrite:  'textWrite',
   textAppend: 'textAppend',
   jsonRead:   'jsonRead',
   jsonWrite:  'jsonWrite',
   move:       'move',
   remove:     'remove',
}
type Actions = {
   pathInfo:   'pathInfo',
   hasAccess:  'hasAccess',
   isFile:     'isFile',
   isDir:      'isDir',
   binRead:    'binRead',
   textRead:   'textRead',
   textWrite:  'textWrite',
   textAppend: 'textAppend',
   jsonRead:   'jsonRead',
   jsonWrite:  'jsonWrite',
   move:       'move',
   remove:     'remove',
}

type hasAccess    = { type:typeof Actions.hasAccess,file:string}
type isFile       = { type:typeof Actions.isFile,   file:string}
type isDir        = { type:typeof Actions.isDir,    path:string}
type pathInfo     = { type:typeof Actions.pathInfo, path:string}
type binRead      = { type:typeof Actions.binRead,  file:string}
type textRead     = { type:typeof Actions.textRead, file:string}
type textWrite    = { type:typeof Actions.textWrite,file:string, content:string, versioning?:Versioning, append?:boolean}
type textAppend   = { type:typeof Actions.textAppend,file:string, content:string, versioning?:Versioning}
type jsonRead     = { type:typeof Actions.jsonRead, file:string}
type jsonWrite    = { type:typeof Actions.jsonWrite,file:string, content:any, versioning?:Versioning}
type move         = { type:typeof Actions.move,     from:string, to:string, versioning?:Versioning}
type remove       = { type:typeof Actions.remove,   path:string, versioning?:Versioning}

export type FileAction = (hasAccess | isFile | isDir | pathInfo | binRead | textRead | textWrite | textAppend | jsonRead | jsonWrite | move | remove) & {
   appKey:  string
   type:    string
}

export type AppFileIO = {
   pathInfo:   (path:string)              => Promise<FilePathInfo|undefined>
   hasAccess:  (file:string)              => Promise<Permission|undefined>
   isFile:     (file:string)              => Promise<boolean|undefined>
   isDir:      (path:string)              => Promise<boolean|undefined>
   binRead:    (file:string)              => Promise<string|undefined>
   textRead:   (file:string)              => Promise<string|undefined>
   textWrite:  (file:string, content:string, versioning?:Versioning) 
                                          => Promise<true|undefined>
   textAppend: (file:string, content:string, versioning?:Versioning) 
                                          => Promise<true|undefined>
   jsonRead:   <RETURN=any>(file:string)  => Promise<RETURN|undefined>
   jsonWrite:  (file:string, content:any, versioning?:Versioning) 
                                          => Promise<true|undefined>
   move:       (from:string, to:string, versioning?:Versioning)         
                                          => Promise<true|undefined>
   remove:     (path:string, versioning?:Versioning)                 
                                          => Promise<true|undefined>
}

/**
 * `false`, `0`, `off`: no versioning
 * `true`, `-1`, 'unlimited': versioning on, every save creates a new version
 * `1`-`n`: upon new save, discard versions older than `n` days
 * `phased`: every version for the past day, every day for the past month, every month after that
 */
export type Versioning = 
   | boolean      // on/off
   | number       // >0=days of versions to keep; 0=off, -1=unlimited versioning
   | 'off'        // no versioning
   | 'unlimited'  // unlimited versioning
   | 'phased'     // phased versioning