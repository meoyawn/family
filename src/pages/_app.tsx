import '../tailwind.css'

import React from "react"
import { AppProps } from 'next/app'

import Layout from '../components/Layout'
import { Provider } from "jotai";

// noinspection JSUnusedGlobalSymbols
export default function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <Provider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Provider>
  )
}
