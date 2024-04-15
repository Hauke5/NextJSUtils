'use server'
import path          from 'path';
import * as fs       from '@/lib/fileAPI/fsUtil'
import { Log }       from '@/lib/utils';
import { AppDesc }   from '@/lib/apps/useAppDesc';
import { RoleDesc }  from '@/lib/auth/useUserRole';

const log = Log(`appDescServer`)

const roleFile = '.roles.json'


export async function findServerApps():Promise<AppDesc[]> {
   const base = path.join(process.cwd(),`./app/(apps)/`)
   const appDescs:AppDesc[] = fs.readDirSync(base)
      .filter(app => fs.isDirectorySync(path.join(base, app)) && fs.isFileSync(path.join(base, app, 'appDesc.json')))
      .map(app => fs.readJsonFileSync<AppDesc>(path.join(base, app, 'appDesc.json')))
   log.debug(()=>`loading ${appDescs.length} descriptors: \n   ${appDescs.map(d => JSON.stringify(d)).join(`\n   `)}`)
   return appDescs
}

export async function findServerRoleFile():Promise<RoleDesc> {
   const file =  path.join(process.cwd(),'../data', roleFile)
   if (fs.isFileSync(file)) {
      const roleDesc:RoleDesc = fs.readJsonFileSync<RoleDesc>(file)
      return roleDesc
   } else {
      return {
         public: 'Public'
      } as RoleDesc
   }
}
