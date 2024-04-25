'use client'
import { usePathname }     from 'next/navigation';
import { ReactNode }       from 'react';
import { useAppsContext }  from '@/lib/apps/useAppsContext';

export interface AppDesc {
   key:     string
   title:   ReactNode
   desc:    string
   color:   string
   hide?:   boolean
}


/** returns the app descriptor that matches the current filePath */
export function useAppDesc():AppDesc {
   const {apps}  = useAppsContext()
   const path  = usePathname()
   const appKey = path?.split('/')[1]
   const desc = apps.find(desc => desc.key===appKey) ?? {key:appKey, title:'', desc:'', color:''}
   return desc
}

