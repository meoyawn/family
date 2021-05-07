import React from "react";

import Person from "./Person";
import { ZoomingGroup } from "./ZoomingGroup";
import { rootSelector, useStore } from "../store";
import Edge from "./Edge";

export default function Graph(): JSX.Element {
  const root = useStore(rootSelector)

  return (
    <ZoomingGroup>
      {root?.children?.map(c => (
        <Person key={c.id} node={c} />
      ))}
      {root?.edges?.map(e => (
        <Edge key={e.id} edge={e} />
      ))}
    </ZoomingGroup>
  )
}
