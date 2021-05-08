import '../tailwind.css'

import React from "react"
import { AppProps } from 'next/app'

import AppLayout from '../app/components/AppLayout'

// noinspection JSUnusedGlobalSymbols
export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <AppLayout>
      <Component {...pageProps} />
    </AppLayout>
  )
}
