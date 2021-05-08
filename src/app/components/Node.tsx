import React from "react";
import { ElkNode } from "elkjs/lib/elk-api";

import Person from "./Person";
import { Family } from "./Family";

export const Node = ({ node }: { node: ElkNode }): JSX.Element => {
  return node.id.includes(':')
    ? <Family node={node} />
    : <Person node={node} />
}
