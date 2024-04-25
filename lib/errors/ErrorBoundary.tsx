'use client'
import { ReactNode, Suspense } 
                     from 'react';
import { Component } from 'react';
import { Loading }   from './Loading';

interface ErrorState {
   hasError?:   boolean
   error?:      any
   errorInfo?:  any
}

export function ErrorBoundarySuspense({what='', children}:{what?:string, children:ReactNode}) {
   return <Suspense fallback={<Loading what={what}/>}>
      <ErrorBoundary>
         {children}
      </ErrorBoundary>
   </Suspense>
}

export class ErrorBoundary extends Component<{children:ReactNode}, ErrorState> {
   constructor(props) {
      super(props);
      this.state = { hasError: false };
   }

   static getDerivedStateFromError(error:ErrorState) {   
      // Update state so the next render will show the fallback UI.    
      return { hasError: true };  
   }

   componentDidCatch(error:any, errorInfo:any) {    
      this.setState({
         error: error,
         errorInfo: errorInfo
      })
   }
   render():ReactNode {
      if (this.state.errorInfo) {   // Error path
         return <div>
            <h2>Something went wrong.</h2>
            <details style={{ whiteSpace: 'pre-wrap' }}>
               {this.state.error && this.state.error.toString()}
               <br />
               {this.state.errorInfo.componentStack}
            </details>
         </div>
      }
      // Normally, just render children
      return this.props.children;
   }  
}