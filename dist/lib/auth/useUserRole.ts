'use client'
import { useEffect, useState }  
                           from 'react'
import { useSession }      from 'next-auth/react'
import { useAppsContext }  from '@/lib/apps/useAppsContext'

export const  ALL_USERS       = 'public'

export enum Role {
   Admin    = 'Admin',
   Owner    = 'Owner',
   Public   = 'Public',
   Unknown  = 'Unknown',
}


export const defaultRole:RoleDesc = {
   public: Role.Public
}

export interface RoleDesc {
   [user:string]: Role
}

/**
* A hook to return the role of the current user. Roles are retrieved from a `<appKey/.roles.json` file . 
* This allows different apps to define their individual roles.
* @returns the role of the currently signed in user
*/
export function useUserRole():{user:string, role:Role} {
   const { data }          = useSession()
   const {roles}           = useAppsContext()
   const [role, setRole]   = useState<Role>(Role.Unknown)

   const user = data?.user?.name ?? ALL_USERS
   useEffect(()=>{ 
      if (user) setRole(roles[user] ?? Role.Unknown)
   },[user])

   return {user, role}
}
