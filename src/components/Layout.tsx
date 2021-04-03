import React, { PropsWithChildren } from "react"

export default function Layout({ children }: PropsWithChildren<unknown>): JSX.Element {
  return (
    <div className="w-full">
      {children}
    </div>
  )
}
