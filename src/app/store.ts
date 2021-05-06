import { ElkNode } from "elkjs/lib/elk.bundled"
import create from "zustand"

import { FamilyTree, PersonID } from "./types"

interface State {
  tree: FamilyTree
  root?: ElkNode
  editing?: PersonID
}

export const useStore = create<State>(() => ({
  tree: {} as FamilyTree,
}))

export const rootSelector = (s: State): ElkNode | undefined =>
  s.root
