'use client'
import { signIn, signOut, useSession } 
                        from 'next-auth/react'
import { mdiAccountCog, mdiAccountGroup, mdiLogin, mdiLogout, mdiShieldAccount } 
                        from '@mdi/js'
import { useUserRole }  from './useUserRole'
import { ALL_USERS }    from './types'
import { Icon }         from '../components/Icon'
import styles           from './Auth.module.scss'


const roleIcons = {
   Admin:         mdiAccountCog,
   Owner:         mdiShieldAccount,
}

/**
 * Customized header to display on every page in case user is signed in.
 * After signing in, a user's role will be loaded from a `.roles.json` file in the `data/<appKey>/` directory.
 * @param props 
 * @returns a JSX.Element
 */
export function SignedInAs() {
   const { data, status }  = useSession()
   const { role }          = useUserRole()
   
   const roleIcon = roleIcons[role as keyof typeof roleIcons] ?? mdiAccountGroup

   return <div className={styles.signedIn}>
      <div className={styles.session}>
         <small>Signed in as</small>
         <span className={styles.user}>{data?.user?.name ?? ALL_USERS} </span>            
      </div> 
      {roleIcon && <Icon mdi={roleIcon} className={`${styles.role} ${styles[role]}`} title={`${role} role`}/>}
      <div className={styles.button} >
         {status==='authenticated'
            ? <Icon mdi={mdiLogout} size={22} className={styles.signOut} onClick={()=>signOut({})} title='log out'/>
            : <Icon mdi={mdiLogin}  size={22} className={styles.signIn} onClick={()=>signIn()} title='sign in'/>
         }
      </div>
   </div>
}


// export function SignIn() {
//    return <div className={styles.signIn}>
//       <button onClick={() => signIn()}>Sign in</button>
//    </div>
// }

