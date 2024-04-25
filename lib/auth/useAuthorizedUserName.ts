import { useSession }   from "next-auth/react";
import { ALL_USERS }    from "./types";

/**
 * provides the name of the user currently authorized via next-auth, 
 * or ALL_USERS if no one is logged in
 */
export function useAuthorizedUserName():string {
   const session = useSession()
   // const [user, setUser] = useState(session.data?.user?.name ?? ALL_USERS)
   // useEffect(()=>{
   //    const name = session.data?.user?.name
   //    if (name) setUser(name)
   // },[session.data?.user?.name])
   return session.data?.user?.name ?? ALL_USERS
}