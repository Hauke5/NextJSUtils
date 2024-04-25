'use client'

import { Log }    from '@/lib/utils/log'

const log = Log(`useStorage`)

export interface StorageType {
   setItem:    <ITEM=any>(key:string, value:ITEM)=>boolean
   getItem:    <ITEM=any>(key:string)=>ITEM|null
   removeItem: (key:string)=>void
}

export function useLocalStorage() {
   return useStorage('local')
}

export function useSessionStorage() {
   return useStorage('session')
}

export function getLocalStorage() {
   return getStorage('local')
}

export function getSessionStorage() {
   return getStorage('session')
}

function useStorage(storageType:'local'|'session'):StorageType  {
   return getStorage(storageType)
}

function getStorage(storageType:'local'|'session'):StorageType  {
   const storage = getStorageByType(storageType)
   return {setItem, getItem, removeItem}

   function getItem<ITEM=any>(key:string):ITEM|null {
      if (!storage) {
         log.debug(()=>`no storage defined`)
         return null
      }
      try {
         const val = storage.getItem(key) ?? null
         if (val!==null) return JSON.parse(val) as ITEM
      } catch(e) {
         log.warn(`getting '${key}': ${e}`)
      }
      return null
   }
   /** sets an `item` for `key` and returns `true` if successful, `false` if not  */
   function setItem<ITEM=any>(key:string, value:ITEM):boolean {
      if (!storage) {
         log.debug(()=>`no storage defined`)
         return false
      }
      try {
         storage.setItem(key, JSON.stringify(value))
      } catch(e) {
         log.warn(`setting '${key}': ${e}`)
         return false
      }
      return true
   }
   function removeItem(key:string) {
      if (!storage) {
         log.debug(()=>`no storage defined`)
         return
      }
      storage.removeItem(key)
   }
}


function getStorageByType(storageType:'local'|'session') {
   if (typeof localStorage==='object')
   if (storageType==='local') {
      return localStorage
   } else if (storageType==='session') {
      return sessionStorage
   }
}
   