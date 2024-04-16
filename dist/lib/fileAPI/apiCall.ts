import { Log }       from "@/lib/utils/log"

const log = Log('apiCalls')

export class ApiError extends Error {
   constructor(message:string, ...args:any[]) { super(message, ...args) }
}
      
/**
 * processes an API GET or POST request on the server side and ensures that
 * - the result is returned as an `Response`
 * - any thrown `Errors` are caught and encoded in the response.
 */
export async function apiResponse<RETURN>(action:()=>Promise<RETURN>): Promise<Response> {
   try {
      const data = await action()
      return new Response(JSON.stringify(data), { status: 200, statusText: "OK" })
   } catch(e) {
      if (e instanceof ApiError) {
         const desc = `ApiError ${e}${e.cause? `, cause: ${e.cause}` : ''}`
         log.error(`caught API error: ${desc}`)
         // Error details for `Response` are expected to be sufficiently sanitized to be returned to client
         return new Response(desc, { status: 530, statusText: desc })
      } else {
         const desc = `Other Error`
         log.error(`caught non-API error: ${desc}`)
         // leave out error details in response to client to avoid leaking data
         return new Response(desc, { status: 531, statusText: desc })
      }
   }
}


/**
 * decodes and returns an Api Response;
 * Any error encoded by the server will reconverted to an ApiError and thrown
 * 
 * ### Conventions for nextjs API calls in HelpfulScripts:
 * - on the client: always use this `apiCall` function. Internally it sends a POST request to the server
 * and decodes the result consistently
 * - on the server: always use `apiResponse` to convert the payload result into an API query result .
 *    - report errors by throwing an `ApiError`. When doing so, ensure that any messages 
 * sent with the  `ApiError` are appropriately sanitized to not expose details about the server or the file system.
 *    - All other `Errors` will be caught and sanitized by `apiResponse`, which may make the underlying error 
 * difficult to interpret on the client side.
 */
export async function apiCall<RETURN, REQUEST=any>(url:string, post:REQUEST): Promise<RETURN> {
   try {
      const response = await fetch(url, {
         method: "POST",
         headers: {"Content-Type": "text"},
         body: JSON.stringify(post),
      })
      switch (response.status) {
         case 530:   throw new ApiError(response.statusText)
         case 531:   throw new Error(response.statusText)
         default:
            if (response.status>=200 && response.status<300) 
               return response.json()
            throw new Error(`${response.status}|${response.statusText}`)
      }
   } catch(e) {
      if (!(e instanceof ApiError)) log.warn(`calling api: ${e}`)
      throw e
   }
}
