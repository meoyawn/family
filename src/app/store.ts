import { ElkNode } from "elkjs/lib/elk.bundled"
import create from "zustand"
import { zoomIdentity, ZoomTransform } from "d3-zoom";

import { FamilyTree, PersonID } from "./types"

interface State {
  tree: FamilyTree
  root?: ElkNode
  editing?: PersonID
  transform: ZoomTransform
}

export const useStore = create<State>(() => ({
  tree: {} as FamilyTree,
  transform: zoomIdentity,
}))

export const rootSelector = (s: State): ElkNode | undefined =>
  s.root

export const transformSelector = (s: State): ZoomTransform =>
  s.transform
