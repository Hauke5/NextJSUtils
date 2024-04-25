'use client'
import Link          from 'next/link'
import { MouseEvent, ReactNode, useState } 
                     from 'react'
import { BaseProps } from '@/lib/components/BaseProps'
import { Icon }      from '../Icon'
import styles        from './Menu.module.scss'

type Dir = 'hor' | 'ver'

export const menuSeparator = (menudir:'hor'|'ver'): MenuSeparator => ({
   dir:menudir
})
export const menuSpacer = (size:number):MenuSpacer => ({
   size
})

export interface MenuSeparator {
   /** if set, draws a horizontal or vertical separator */
   dir: Dir
}
export interface MenuSpacer {
   /** addds a space of specified `size` pixels in the menu bar */
   size: number
}
export interface MenuAction {
   ():void|Promise<void>
}
export interface MenuItemSpec {
   /** optional `id` tag */
   id?:              string
   /** css style for the menu item */
   className?:       StringAccessor
   /** the MDI icon string, if any */
   icon?:            StringAccessor
   /** the CSS class to use for the icon */
   classNameIcon?:   StringAccessor
   /** the icon label, if any */
   label?:           ReactAccessor
   /** the className of the icon label */
   classNameLabel?:  StringAccessor
   /** an optional `title` hint upon hovering, taking precedence over a `title` tag */
   hint?:            StringAccessor
   /** the action when clicked */
   action?:          MenuAction
   /** optional dynamic link for menu button */
   link?:            string
   /** condition for highlighting the menu button, if any */
   isActive?:        ()=>boolean
   /** condition for disabling the menu button, if any */
   isDisabled?:      ()=>boolean
   /** 
    * a `use...` hook that will be called before evaluating  
    * any other `MenuItemDesc` items. The current descriptor 
    * will be passed into the hook and be replaced by its result 
    */
   hook?:            (desc:MenuItemSpec)=>MenuItemSpec
   subItems?:        MenuItem[]
}

export type MenuItem = MenuItemSpec | MenuSeparator | MenuSpacer

type StringAccessor = string | (()=>string)
type ReactAccessor = ReactNode | (()=>ReactNode)

interface MenuItemProps extends BaseProps {
   desc:    MenuItem
   theme?:  'dark'|'light'
}

function MenuItemSeparator(dir:Dir, className:string) {
   return <div className={`${dir==='hor'?styles.menuHorSeparator:styles.menuVerSeparator} ${className}`} />
}
function MenuItemSpace(space:number, className:string) {
   return <div className={`${styles.menuSpacer} ${className}`} style={{width:`${space}px`}} /> 
}

function MenuItem({desc, className, title, onClick, theme='light',  ...props}:MenuItemProps) {
   const [expanded, setExpanded] = useState(false)

   if (!desc) return <></>
   if ((desc as MenuSeparator).dir) return MenuItemSeparator((desc as MenuSeparator).dir, className??'')
   if ((desc as MenuSpacer).size)   return MenuItemSpace((desc as MenuSpacer).size, className??'')
   return <MenuItemActive item={desc as MenuItemSpec} />

   function MenuItemActive({item}: {item:MenuItemSpec}) {
      // let an optional hook modify the descriptor
      item = item.hook?.(item) ?? item
      const icon  = typeof item.icon  === 'function' ? item.icon()  :  item.icon
      const label = typeof item.label === 'function' ? item.label() :  item.label
      const iconClass  = typeof item.classNameIcon  === 'function'? item.classNameIcon()  : item.classNameIcon
      const labelClass = typeof item.classNameLabel === 'function'? item.classNameLabel() : item.classNameLabel ?? ''
      const hint = typeof item.hint === 'function'? item.hint() : item.hint ?? title

      const disabled = item.isDisabled?.() ?? false
      const active   = item.isActive?.() ?? false
      if (disabled)     (props as any)['menu-disabled'] = 'true'
      else if (active)  (props as any)['menu-active']   = 'true'

      const click = (e:MouseEvent) => {
         e.preventDefault()
         if (item.subItems) setExpanded(exp=>!exp)
         else item.action?.()
      }
      const expandSubmenu = (e:MouseEvent) => {
         e.preventDefault()
         if (item.subItems) setExpanded(true)
      }
      const leaveSubmenu = (e:MouseEvent) => {
         e.preventDefault()
         setExpanded(false)
      }

      return <div id={item.id} title={hint} className={`${styles.menuItem} ${item.className??''} ${className??''}`} 
                  onClick={click} onMouseOver={expandSubmenu}  onMouseLeave={leaveSubmenu} {...props}>
         {item.link
            ? <Link href={item.link}>{getItem()}</Link>
            : getItem()
         }
         </div>

      function getItem() {
         return <>
            {icon && <Icon mdi={icon} size={20} className={iconClass}/>}
            {typeof label==='string' ? <div className={`${styles.menuLabel} ${labelClass}`}>{label}</div> : label}
            {item.subItems && <Menu items={item.subItems} menudir={'ver'} theme={theme} expanded={expanded}/>}
         </>
      }
   }
}


export type MenuDesc = MenuItem[]

export interface MenuProps extends BaseProps {
   items:      MenuItem[]
   'menudir'?: Dir
   expanded?:  boolean
   theme?:      'dark'|'light'
}
/** 
 * creates a horizontal, expanded menu bar with `items`.   
 * If `menudir` is 'ver', the menu bar is displayed in vertical orientation instead
 * If `expanded` is false, the menu bar will initially be collapsed. This is typically used 
 * for drop down menus, i.e. an item in `items` that has `subItems` defined.
 */
export function Menu({items, menudir='hor', expanded=true, theme='light', className, ...props}:MenuProps) {
   const menuProps = {
      menudir: menudir==='hor'?'menuHor':'menuVer',
      theme,
      ...props
   }
   return <div className={`${styles.menuBar} ${className??''}`} menu-bar='true' {...menuProps}>
      {expanded && items.map((item,i) => <MenuItem desc={item} key={`${i}`} theme={theme}/>)}
   </div>
}