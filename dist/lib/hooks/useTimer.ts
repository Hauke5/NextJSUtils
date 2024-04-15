'use client'
import { useEffect, useRef, useState } from "react";

export interface Interval {
   /** the count of times the hook has fired  */
   count:      number 
   /** a function that starts the interval timer */
   start:      ()=>void
   /** a function that stops the interval timer */
   stop:       ()=>void
   /** a function returning `true` if the timer is running */
   isRunning:  ()=>boolean
   /** number of ms since starting the timer */
   sinceStart: number
   /** number of ms since last redraw */
   sinceLast:  number
}

/**
 * triggers a state change and redraw every `periodMS` milliseconds.
 * The hook returns an object that reflects the current count of times that the hook has fired, 
 * as well as functions that will start or stop the interval timer.
 * @param periodMS 
 * @param autoStart defaults to `true`; if provided, determines whether the hook will start the timer or not.
 * @returns an object with the following fields:
 * - `count`: the count of times the hook has fired
 * - `start()`: a function that starts the interval timer
 * - `stop()`: a function that stops the interval timer
 * - `isRunning()`: a function returning `true` if the timer is running
 * - `sinceStart`: number of ms since starting the timer
 * - `sinceLast`: number of ms since last redraw
 */
export function useTimer(periodMS:number, autoStart=true):Interval {
   const [timer, setTimer] = useState<NodeJS.Timeout|null>(null)
   const [counter, setCounter] = useState(0)
   const start = useRef(new Date().getTime())
   const lastCall = useRef(new Date().getTime())
   useEffect(()=>{
      if (autoStart && !timer) runTimer()
      return () => stopTimer()
      // eslint-disable-next-line react-hooks/exhaustive-deps
   },[])

   const now = new Date().getTime()
   const sinceStart = now - start.current
   const sinceLast  = now - lastCall.current
   lastCall.current = new Date().getTime()
   return {
      count:      counter, 
      stop:       stopTimer, 
      start:      startTimer,
      isRunning:  () => timer? true : false,
      sinceStart, 
      sinceLast
   }

   function startTimer() {
      if(!timer) {
         start.current = new Date().getTime()
         lastCall.current = new Date().getTime()
         runTimer()
      }
   }
   function runTimer() { 
      setCounter(c=>c+1)
      setTimer(setTimeout(runTimer, periodMS))
   }
   function stopTimer() {
      if (timer) clearTimeout(timer)
      setTimer(null)
   }
}