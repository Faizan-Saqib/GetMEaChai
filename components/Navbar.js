"use client"
import React, { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from "next-auth/react"
import Link from 'next/link'

const Navbar = () => {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-700 text-white">
      <Link href="/" className="logo font-bold text-2xl flex justify-center items-center ">
        <div className="img"><img className='h-12 w-12' src="/tea.gif" alt="logo" /></div>
        <h1>GetMEaPie</h1>
      </Link>
      
      <div className='flex gap-4'>
        {session && (
          <div className="relative inline-block text-left" ref={dropdownRef}>
            {/* Dropdown Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 rounded-xl bg-[#0052cc] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#0043a4] active:scale-98"
            >
              <span>Welcome {session.user.email}</span>
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu Canvas */}
            {isOpen && (
              <div className="absolute left-0 mt-2 w-56 origin-top-left rounded-xl bg-[#2d3748] p-1.5 shadow-xl ring-1 ring-black/5 z-50">
                <div className="flex flex-col space-y-0.5">
                  <Link 
                    href="/dashboard" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-700/50 hover:text-white"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href={`/${session.user.name}`}
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-700/50 hover:text-white"
                  >
                    Your Page
                  </Link>
                  <hr className="my-1 border-slate-700" />
                  <button 
                    onClick={() => signOut({ callbackUrl: '/' })} 
                    className="w-full text-left rounded-lg px-4 py-2.5 text-sm text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {session && (
          <button 
            type="button" 
            className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded text-sm px-4 py-2.5 text-center leading-5" 
            onClick={() => signOut({ callbackUrl: '/' })}
          >   
            Logout
          </button>
        )}

        {!session && (
          <Link href="/login">
            <button 
              type="button" 
              className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded text-sm px-4 py-2.5 text-center leading-5"
            >   
              Login
            </button>
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
