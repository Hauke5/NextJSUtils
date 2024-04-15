'use client'
import { useAppDesc }   from '@/lib/apps/useAppDesc';
import { getAppFileIO } from './clientFileIO';



/**
 * provides API access to the app's sandbox in the server file system.
 * The server checks via Next-Auth for the currently authenticated user, 
 * then determines if the user has read or write access as required by the 
 * call made. Use `.access.json` files in the `data` subdirectories to configure
 * this access.
 */
export function useAppFileIO() {
   const appKey = useAppDesc().key
   return getAppFileIO(appKey)
}

