import '../tailwind.css'

import React from "react"
import { AppProps } from 'next/app'
import { Provider } from "jotai";

import Layout from '../components/Layout'

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
