import type { Metadata } from 'next'
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs'
import './globals.css'



export const metadata: Metadata = {
  title: 'ReTrade - Sign In',
  description: 'Genereated by Green Cloud Computing Ltd',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body>
        <SignedIn>
          {children}
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </body>
    </html>
  </ClerkProvider>
  )
}