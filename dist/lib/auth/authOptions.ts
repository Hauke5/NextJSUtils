/**
 * Server-side `authOptions`
 */
import CredentialsProvider from 'next-auth/providers/credentials'
import Auth0Provider       from "next-auth/providers/auth0";
import process             from 'process'
import crypto              from 'crypto'
import path                from 'path'
import * as fs             from '../fileAPI/fsUtil'
import { NextAuthOptions } from 'next-auth';


type CredentialData = Record<"username" | "password", string> | undefined

interface PasswordFile {
   [user:string]: string
}



const credentials = CredentialsProvider({
   // The name to display on the sign in form (e.g. 'Sign in with...')
   name: 'Credentials',
   // The credentials is used to generate a suitable form on the sign in page.
   // You can specify whatever fields you are expecting to be submitted.
   // e.g. domain, username, password, 2FA token, etc.
   credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" }
   },
   async authorize(credentials:CredentialData) {
      const user = credentials?.username ?? '?'
      try {
         const passwordFile = path.join(process.cwd(), '../data/passwd.json')
         console.info(`CredentialsProvider authorizing via '${passwordFile}'`)
         const users = fs.readJsonFileSync<PasswordFile>(passwordFile)
   
         const hash = crypto.createHash('sha256');
         hash.update(credentials?.password ?? '');
         const pw = hash.digest('hex');
         if (users?.[user] === pw) {
            console.info(`CredentialsProvider validated user ${user}`)
            return { name: user, id:user}
         } else {
            console.warn(`CredentialsProvider invalid password for user ${user}; new hash = '${pw}'`)
         }
      } catch(e:any) {
         console.warn(`CredentialsProvider error authenticating ${user}: ${e}`)
      }
      return null
   } 
})

const auth0 = Auth0Provider({
   clientId: process.env.AUTH0_CLIENT_ID ?? '',
   clientSecret: process.env.AUTH0_CLIENT_SECRET ?? '',
   issuer: process.env.AUTH0_ISSUER
})

      
export const authOptions:NextAuthOptions = {
   // Configure one or more authentication providers
   providers: [
      credentials,
      auth0,
      // ...add more providers here
   ],
   secret: '+hOOj1Unwn50XWTQpUZDIAmaZ8FAY3toinXnIdTG+t4='
}

