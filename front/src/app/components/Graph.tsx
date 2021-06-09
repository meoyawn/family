import React from "react";

import { rootSelector, useStore } from "../store";
import { ZoomingGroup } from "./ZoomingGroup";
import { Node } from "./Node";
import { Edge } from "./Edge";

export default function Graph(): JSX.Element {
  const root = useStore(rootSelector)

  return (
    <ZoomingGroup>
      {root?.edges?.map(e => (
        <Edge key={e.id} edge={e} />
      ))}
      {root?.children?.map(c => (
        <Node key={c.id} node={c} />
      ))}
    </ZoomingGroup>
  )
}
