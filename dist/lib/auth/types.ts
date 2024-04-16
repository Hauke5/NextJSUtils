
export const  ALL_USERS  = 'public';

export enum Role {
   Admin    = 'Admin',
   Owner    = 'Owner',
   Public   = 'Public',
   Unknown  = 'Unknown',
}


export const defaultRole:RoleDesc = {
   public: Role.Public
}

export type RoleDesc = {
   [user:string]: Role
}
