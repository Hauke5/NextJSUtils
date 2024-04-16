import { MouseEvent }   from "react"
import { BaseProps }    from '@/lib/apps/BaseProps'
import styles           from "./Icon.module.scss"


export interface IconProps extends BaseProps { 
   mdi:string, 
   children?:React.ReactNode, 
   size?:number, 
   pre?:boolean, 
}
/**
 * ## Icon
 * renders an `svg` path icon before or after any optional children
 * ### Props
 * - mdi _required_: an icon path string to be rendered in an svg `path` command. These can be imported e.g., from `@mdi/js`
 * - size _optional_: the size in pixel for the icon; defaults to 25
 * - className _optional_: an optional css class
 * - pre _optional_: if present, icon will be shown left of the children; otherwise on the right
 * - onClick _optional_: a callback for a `click` event
 * @param param0 
 * @returns 
 */
export function Icon({children, mdi, className='', size=25, pre=false, onMouseUp, onClick, ...props}: IconProps) {
   const clicked = (e:MouseEvent<HTMLElement>) => {
      e.preventDefault()
      if (onMouseUp) onMouseUp(e)
      else onClick?.(e)
   }
   return <div className={`${styles.icon} ${className}`} style={{minWidth:`${size}px`}} {...props}
               onMouseUp={onMouseUp?clicked:undefined} 
               onClick={onClick?clicked:undefined} >
      {!pre && children && <span className={styles.post}>{children}</span>}
      <svg style={{width:`${size}px`}} preserveAspectRatio='xMinYMin meet' viewBox={`0 0 25 25`}>
            <path d={mdi} />
      </svg>
      {pre && children && <span className={styles.post}>{children}</span>}
   </div>
}

