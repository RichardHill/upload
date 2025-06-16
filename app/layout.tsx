import type { Metadata } from 'next'
import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs'
import './globals.css'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;


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
    <ClerkProvider publishableKey={publishableKey}>
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