import NextAuth from 'next-auth'
// import AppleProvider from 'next-auth/providers/apple'
// import FacebookProvider from 'next-auth/providers/facebook'
// import GoogleProvider from 'next-auth/providers/google'
// import EmailProvider from 'next-auth/providers/email'
import Google from "next-auth/providers/google"
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";
import mongoose from "mongoose";
import connectDb from "@/db/connectDB";
import User from '@/Models/user';
import Payment from '@/Models/payment';

export const authoptions = NextAuth({
    providers: [
      // OAuth authentication providers...
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
      GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET
      }),
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
      })
    //   AppleProvider({
    //     clientId: process.env.APPLE_ID,
    //     clientSecret: process.env.APPLE_SECRET
    //   }),
    //   FacebookProvider({
    //     clientId: process.env.FACEBOOK_ID,
    //     clientSecret: process.env.FACEBOOK_SECRET
    //   }),
    //   GoogleProvider({
    //     clientId: process.env.GOOGLE_ID,
    //     clientSecret: process.env.GOOGLE_SECRET
    //   }),
    //   // Passwordless / email sign in
    //   EmailProvider({
    //     server: process.env.MAIL_SERVER,
    //     from: 'NextAuth.js <no-reply@example.com>'
    //   }),
    ],
  
    callbacks: {
      async signIn({ user, account, profile, email, credentials }) {
        await connectDb()
        
        // Check if the user already exists in the database by their email
        const currentUser = await User.findOne({ email: user.email }) 
        
        if (!currentUser) {
          // Create a new user automatically for any incoming provider
          await User.create({
            email: user.email, 
            username: user.email.split("@")[0], 
          })   
        } 

        return true // CRITICAL: This is now outside the block so Google/Discord logins don't hang or fail
      },

      // CRITICAL: Next-Auth needs a JWT callback to intercept and update cookie tokens dynamically
      async jwt({ token, user, trigger, session }) {
        if (trigger === "update" && session) {
          // Sync changes from your dashboard's update({ username: ... }) call into the token
          token.username = session.username || token.username
        }
        return token
      },
      
      async session({ session, token }) {
        await connectDb()
        const dbUser = await User.findOne({ email: session.user.email })
        
        if (dbUser) {
          // If a live dashboard update session token exists, use it. Otherwise, use the DB value.
          session.user.name = token.username || dbUser.username
        }
        
        return session
      },
    } 
})

export { authoptions as GET, authoptions as POST }
