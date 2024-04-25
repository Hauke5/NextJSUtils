import { HTMLAttributes, ReactNode }  from 'react';

export type BaseProps = HTMLAttributes<HTMLElement>
export type ChildrenOnlyProps = {
   children: ReactNode;
}



