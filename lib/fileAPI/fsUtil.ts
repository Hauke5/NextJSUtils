/**
 * Convenience functions for node file system functions, wrapped in Promises.
 * 
 * ### Usage:
 * ```
 * import * as fs from './fsUtil';
 * const files = fs.readDir('./');
 *     .then((stdout, stderr) => {...})
 *     .catch(err => {...});
 * ```
 */

import * as fs          from 'node:fs';
// import * as fsPromise   from 'node:fs/promises';
import * as path        from 'path';

/**
 * Convenience functions for file system access, wrapped in Promises.
 * - &nbsp;{@link hsNode.fsUtil.realPath realPath}
 * - &nbsp;{@link hsNode.fsUtil.pathExists pathExists}
 * - &nbsp;{@link hsNode.fsUtil.isFile isFile}
 * - &nbsp;{@link hsNode.fsUtil.isDirectory isDirectory}
 * - &nbsp;{@link hsNode.fsUtil.isLink isLink}
 * - &nbsp;{@link hsNode.fsUtil.mkdirs mkdirs}
 * - &nbsp;{@link hsNode.fsUtil.readDir readDir}
 * - &nbsp;{@link hsNode.fsUtil.readFile readFile}
 * - &nbsp;{@link hsNode.fsUtil.readTextFile readTextFile}
 * - &nbsp;{@link hsNode.fsUtil.readJsonFile readJsonFile}
 * - &nbsp;{@link hsNode.fsUtil.writeFile writeFile}
 * - &nbsp;{@link hsNode.fsUtil.writeTextFile writeTextFile}
 * - &nbsp;{@link hsNode.fsUtil.writeJsonFile writeJsonFile}
 * - &nbsp;{@link hsNode.fsUtil.appendFile appendFile}
 * - &nbsp;{@link hsNode.fsUtil.remove remove}
 */


//===============================================================================
//  Low level Promise wrappers

// /**
//  * returns a promise for the stats of the file addressed by `thePath`.
//  * If `thePath` addresses a symbolic link, the stats of the linked file are returned.
//  * @param thePath 
//  */
// async function stat(thePath:string):Promise<fs.Stats> {
//    const p = await realPath(thePath);
//    return await new Promise((resolve, reject) => {
//       fs.stat(p, (err:any, stats:fs.Stats) => {
//          if(err) { 
//             console.log(`error getting stats for ${thePath}: ${err}`);
//             reject(err); 
//          } // reject is hard to test: realpath throws an error before stat can.
//          else { resolve(stats); }
//       });
//    });
// }
// function statSync(thePath:string):fs.Stats|undefined {
//    try {
//       const p = realPathSync(thePath);
//       return p? fs.statSync?.(p) : undefined
//    } catch(e:any) {}   // returns undefined if not existent
// }

// /**
//  * returns a promise for the stats of the file addressed by `thePath`.
//  * If `thePath` addresses a symbolic link, the stats of the link are returned.
//  * @param thePath 
//  */
// async function lstat(thePath:string):Promise<fs.Stats> {
//    const p = path.normalize(thePath);
//    return new Promise((resolve, reject) => 
//          fs.lstat(p, (err:any, stats:any) => err? reject(err) : resolve(stats))
//    );
// }
// function lstatSync(thePath:string):fs.Stats|undefined {
//    try {
//          const p = path.normalize(thePath);
//          return fs.lstatSync(p);
//    } catch(e:any) { error(e) }
// }

// function error(err:any):any {
//    const msg = `*** error in fsUtil: ${err}, stack:\n${err.stack}`;
//    throw new Error(msg);
// }

//===============================================================================
//   Exported functions

const api = {
   realPath, realPathSync, pathExists, pathExistsSync, fileSize, fileSizeSync, 
   isFile, isFileSync, isDirectory, isDirectorySync, isLink, isLinkSync, 
   mkdirs, mkdirsSync, readDir, readDirSync, rename, renameSync, pathTimes, pathTimesSync,
   readFile, readFileSync, readTextFile, readTextFileSync, readJsonFile, readJsonFileSync, 
   writeFile, writeFileSync, writeStream, writeTextFile, writeTextFileSync, writeJsonFile, writeJsonFileSync, 
   appendFile, appendFileSync, remove, removeSync, /*removeAll, removeAllSync*/
}
export default api;

/**
 * determines the canonical path for `thePath`, resolving all symbolic links and '../'in the path.
 * @param thePath the path to check
 * @return promise to provide the real canonical system path.
 */
export async function realPath(thePath:string):Promise<string> {
   return fs.promises.realpath(thePath)
}
export function realPathSync(thePath:string):string|undefined {
   return fs.realpathSync(thePath)
}

/**
 * determines if `thePath` exists and promises to provide `true` or `false`.
 * @param thePath the path to check
 * @return promise to provide `true` or `false`
 */
export async function pathExists(thePath:string):Promise<boolean> {
   try { 
      const stats = await fs.promises.stat(thePath);
      return stats? true : false
   } catch(e:any) {
      return false;
   }
}
export function pathExistsSync(thePath:string):boolean {
   return fs.statSync(thePath)? true : false;
}

export type Times = {
   accessed:   Date
   modified:   Date
   created:    Date
}
export async function pathTimes(thePath:string):Promise<Times> {
   const stat_ = await fs.promises.stat(thePath)
   return {
      accessed:   stat_.atime,
      modified:   stat_.mtime,
      created:    stat_.birthtime 
   }
}
export function pathTimesSync(thePath:string):Times {
   const stat_ = fs.statSync(thePath)  // throw if invalid path
   return {
      accessed:   stat_!.atime,
      modified:   stat_!.mtime,
      created:    stat_!.birthtime 
   }
}


/**
 * determines if `thePath` is a file and promises to return the size in bytes.
 * @param thePath the path to check
 * @return promise to provide the size
 */
export async function fileSize(thePath:string):Promise<number> {
   return (await fs.promises.stat(thePath)).size;
}
export function fileSizeSync(thePath:string):number {
   return fs.statSync(thePath, {throwIfNoEntry:false})?.size ?? -1;
}

/**
 * determines if `thePath` is a file and promises to provide `true` or `false`.
 * @param thePath the path to check
 * @return promise to provide `true` or `false`
 */
export async function isFile(thePath:string):Promise<boolean> {
   try { 
      return (await fs.promises.stat(thePath)).isFile();
   } catch(e:any) {
      return false;
   }
}
export function isFileSync(thePath:string):boolean {
   return fs.statSync(thePath, {throwIfNoEntry:false})?.isFile() ?? false;
}

/**
 * determines if `thePath` is a directory and promises to provide `true` or `false`.
 * @param thePath the path to check
 * @return promise to provide `true` or `false`
 */
export async function isDirectory(thePath:string):Promise<boolean> {
   try { 
      return (await fs.promises.stat(thePath)).isDirectory();
   } catch(e:any) {
      return false;
   }
}
export function isDirectorySync(thePath:string):boolean {
   return fs.statSync(thePath, {throwIfNoEntry:false})?.isDirectory() ?? false;
}

/**
 * determines if `thePath` is a directory and promises to provide `true` or `false`.
 * @param thePath the path to check
 * @return promise to provide `true` or `false`
 */ 
export async function isLink(thePath:string):Promise<boolean> {
   try { 
      return (await fs.promises.lstat(thePath)).isSymbolicLink();
   } catch(e:any) {
      return false;
   }
}
export function isLinkSync(thePath:string):boolean {
   return fs.lstatSync(thePath, {throwIfNoEntry:false})?.isSymbolicLink() ?? false;
}

/**
 * creates any missing directories in `thePath` and promises to return the path name.
 * Characters after the last `/` in `thePath` will be interpreted as a filename, hence no directory willbe created form them.
 * Terminate `thePath` with a final `/` to indicate that all parts should be created.
 * FInally, for precaution `mkdirs` only creates directories within the current working directory.
 * @param thePath the path to check
 * @return promise to provide the path name
 */ 
export async function mkdirs(thePath:string):Promise<string> {    
   const p = path.normalize(path.resolve(process.cwd(),thePath));
   fs.promises.mkdir(p, {recursive:true})
   // let dirs = p.split('/');
   // // create complete successive subdirs from the split
   // dirs = dirs.map((dir, i) => dirs.slice(0,i+1).join('/'));
   // for (let i=0; i<dirs.length; i++) {
   //       const dir = dirs[i];
   //       const exists = await isDirectory(dir);
   //       if (!exists) { try {
   //          await fs.promises.mkdir(dir);
   //       } catch(e:any) { 
   //          if (e?.code !== 'EEXIST') {
   //             console.warn(`error in mkdirs: ${e?.code}`);
   //             console.warn(e); 
   //             throw `mkdir failed for ${dir}: ${p}\n${e}`;
   //          }
   //       }}
   // }
   return p;
}
/** expects a path name (without filename) to be passed in */
export function mkdirsSync(thePath:string):string {    
   const p = path.normalize(path.resolve(process.cwd(),thePath))
   fs.mkdirSync(p, {recursive:true})
   // let dirs = p.split('/');
   // // create complete successive subdirs from the split
   // dirs = dirs.map((dir, i) => dirs.slice(0,i+1).join('/'));
   // for (let i=0; i<dirs.length; i++) {
   //       const dir = dirs[i];
   //       const exists = isDirectorySync(dir);
   //       if (!exists) { try { 
   //          fs.mkdirSync(dir);
   //       } catch(e:any) { 
   //          if (e?.code !== 'EEXIST') {
   //             console.warn(`error in mkdirs: ${e?.code}`);
   //             console.warn(e); 
   //             throw `mkdir failed for ${dir}: ${p}\n${e}`;
   //          }
   //       }}
   // }
   return p;
}

export async function rename(fromPath:string, toPath:string):Promise<boolean> {  
   try {  
      await fs.promises.rename(fromPath, toPath)
      return true
      } 
   catch(e) {
      return false
   }
}

export function renameSync(fromPath:string, toPath:string) {  
   fs.renameSync(fromPath, toPath)
}

/**
 * lists all files in a directory and promises to provide the list.
 * @param thePath the path to check
 * @return promise to provide a list of directory entries.
 */
export async function readDir(thePath:string):Promise<string[]> {
   const p = await realPath(thePath);
   try {
      return p? await fs.promises.readdir(p) : []
   } catch(e) {
      return []
   }
   // return await new Promise((resolve:(files:any)=>void, reject:(err:any)=>void) => {
   //       fs.readdir(p, (err:any, files:any) =>  {
   //          if(err) { reject(err); }
   //          else { 
   //             files.path = p;
   //             resolve(files); 
   //          }
   //       });
   // })
   // .catch(error);
}
export function readDirSync(thePath:string):string[] {
   const p = realPathSync(thePath);
   return p? fs.readdirSync(p) : []
   // (files as any).path = p
   // return files
}

/**
 * reads a file either as binary or text and promises to provide the content.
 * @param thePath the path to read
 * @param isText [default=true] `true`|`false` if file should be read as `utf8`|binary 
 * @return promise to provide file content.
 */
export function readFile(thePath:string, isText=true):Promise<any> {
   return fs.promises.readFile(thePath, isText? 'utf8' : 'binary')
   // return new Promise((resolve:(data:any)=>void, reject:(err:any)=>void) => {
   //    fs.readFile(thePath, isText? 'utf8' : 'binary', (err:any, data:any) => 
   //          err? reject(err) : resolve(data));
   // })
   // .catch(error);
}
export function readFileSync(thePath:string, isText=true):string {
   return fs.readFileSync(thePath, isText? 'utf8' : 'binary')
}

/**
 * reads a text file and promises to provide the content.
 * @param thePath the path to read
 * @return promise to provide file content.
 */
export async function readTextFile(thePath:string):Promise<string> { 
   return readFile(thePath, true)
   // try { return await readFile(thePath, true); }
   // catch(err) { 
   //    error(err); 
   //    throw err
   // }
}
export function readTextFileSync(thePath:string):string { 
   return readFileSync(thePath, true); 
}

/**
 * reads a text file and promises to provide the content.
 * @param thePath the path to read
 * @return promise to provide file content.
 */
export async function readJsonFile<DATA>(thePath:string):Promise<DATA> {
   const data = await readFile(thePath, true);
   return (typeof data === 'string')? JSON.parse(data) : data;
}
export function readJsonFileSync<DATA>(thePath:string):DATA {
   const data = readFileSync(thePath, true);
   return (typeof data === 'string')? JSON.parse(data) : data;
}

/**
 * writes a file either as binary or text and promises to return the file name.
 * @param thePath the path to write to
 * @param content the content to write
 * @param isText `true`|`false` if file should be read as `utf8`|binary 
 * @return promise to provide the file name if successful.
 */
export async function writeFile(thePath:string, content:string, isText:boolean=true):Promise<string> {
   const encoding:any = isText? 'utf8' : 'binary';
   await mkdirs(path.dirname(thePath));
   await fs.promises.writeFile(thePath, content, encoding)
   return thePath
   // new Promise((resolve, reject) => {
   //       fs.writeFile(thePath, content, encoding, (err:any) =>
   //          err? reject(`mkdirs failed in writeFile for '${thePath}': ${err}`) : resolve(thePath));
   // }); 
}
/**
 * synchronously writes a file and returns the file name to the file if successful.
 * @param thePath the path to write
 * @param content the content to write
 * @return the file name if successful.
 */
export function writeFileSync(thePath:string, content:string, isText:boolean=true):string {
   const encoding:any = isText? 'utf8' : 'binary';
   mkdirsSync(path.dirname(thePath));
   fs.writeFileSync(thePath, content, encoding)
   return thePath;
}

/**
 * writes content to a file as a stream and promises to return the file name.
 * @param thePath the path to write to
 * @param content the content to write
 * @return promise to provide the file name if successful.
 */
export async function writeStream(thePath:string, content:string):Promise<string> {
   return await new Promise((resolve, reject) => {
      const s = fs.createWriteStream(thePath, {flags:'w', mode:0o666});
      s.on('error', (src:any) => reject(`writeStream error '${src}' for path '${thePath}'`));
      s.write(content, 'binary', () => resolve(thePath));
      s.end();
   });
}

/**
 * writes a text file and promises to return the file name.
 * @param thePath the path to write
 * @return promise to provide the file name if successful.
 */
export async function writeTextFile(thePath:string, content:string):Promise<string> { 
   return await writeFile(thePath, content, true)
}
/**
 * synchronously writes a text file and returns the file name.
 * @param thePath the path to write
 * @param obj the object to write
 * @return the file name if successful.
 */
export function writeTextFileSync(thePath:string, content:string):string { 
   return writeFileSync(thePath, content, true)
}

/**
 * writes a json file and promises to return the file name.
 * @param thePath the path to write
 * @param obj the object to write
 * @return promise to provide the file name if successful.
 */
export async function writeJsonFile(thePath:string, obj:any):Promise<string> {
   return await writeTextFile(thePath, JSON.stringify(obj))
}
/**
 * synchronously writes a json file and returns the file name.
 * @param thePath the path to write
 * @param obj the object to write
 * @return the file name if successful.
 */
export function writeJsonFileSync(thePath:string, obj:any):string {
   return writeTextFileSync(thePath, JSON.stringify(obj))
}

/**
 * appends to a file either as binary or text and promises to return the file name.
 * @param thePath the path to write to
 * @param content the content to write
 * @param isText `true`|`false` if file should be read as `utf8`|binary 
 * @return promise to provide the realPath of the file written to.
 */
export async function appendFile(thePath:string, content:string, isText:boolean=true):Promise<string> {
   var encoding:any = isText? 'utf8' : {encoding: null};
   await mkdirs(path.dirname(thePath));
   await fs.promises.appendFile(thePath, content, encoding)
   return thePath
   // try { return await new Promise((resolve, reject) => {
   //    fs.appendFile(thePath, content, encoding, (err:any) => err? reject(err) : resolve(thePath));
   // })} catch(e:any) { 
   //    error(e); 
   //    throw e
   // };
}
export function appendFileSync(thePath:string, content:string, isText:boolean=true):string {
   var encoding:any = isText? 'utf8' : {encoding: null};
   mkdirsSync(path.dirname(thePath));
   fs.appendFileSync(thePath, content, encoding);
   return thePath;
}

/**
 * promises to delete a file or folder and return the file or folder name.
 * @param thePath the path to write
 * @return promise to provide the name of the removed file.
 */
export async function remove(thePath:string):Promise<string> {
   const dir:boolean = await isDirectory(thePath);
   await (dir
      ? fs.promises.rmdir(thePath)
      : fs.promises.unlink(thePath)
   )
   return thePath
}
export function removeSync(thePath:string):string {
   const dir:boolean = isDirectorySync(thePath);
   dir? fs.rmdirSync(thePath)
      : fs.unlinkSync(thePath);
   return thePath
}

// /**
//  * promises to delete a file or folder and return the file or folder name.
//  * @param thePath the path to write
//  * @return promise to provide the list of names of the removed files.
//  */
// export async function removeAll(thePath:string):Promise<string[]> {
//    const removed:string[] = [];
//    const dir:boolean = await isDirectory(thePath);
//    if (dir) {
//       const list = await readDir(thePath);
//       await Promise.all(list.map(async i => removed.push(...(await removeAll(`${thePath}/${i}`)))));
//    }
//    removed.push(await remove(thePath));
//    return removed;
// }
// /**
//  * promises to delete a file or folder and return the file or folder name.
//  * @param thePath the path to write
//  * @return promise to provide the list of names of the removed files.
//  */
// export function removeAllSync(thePath:string):string[] {
//    const removed:string[] = [];
//    const dir:boolean = isDirectorySync(thePath);
//    if (dir) {
//       const list = readDirSync(thePath);
//       list.map(i => removed.push(...removeAllSync(`${thePath}/${i}`)));
//    }
//    removed.push(removeSync(thePath));
//    return removed;
// }


