import React, { PropsWithChildren } from "react"

export default function AppLayout({ children }: PropsWithChildren<unknown>): JSX.Element {
  return (
    <div className="w-full">
      {children}
    </div>
  )
}
