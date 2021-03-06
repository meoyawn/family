import create from "zustand"
import { ElkNode } from "elkjs/lib/elk-api"
import { zoomIdentity, ZoomTransform } from "d3-zoom"

import { ParentsID, FamilyTree, PersonID } from "./types"
import { PointTuple } from "../lib/geometry"

interface State {
  tree: FamilyTree

  transform: ZoomTransform
  zooming: boolean

  selected: Set<PersonID | ParentsID>

  root?: ElkNode
  editing?: PersonID

  arrowStart?: PointTuple
  arrowEnd?: PointTuple
}

export const useStore = create<State>(() => ({
  tree: {} as FamilyTree,
  transform: zoomIdentity,
  selected: new Set(),
  zooming: false,
}))

export const rootSelector = (s: State): ElkNode | undefined =>
  s.root

export const transformSelector = (s: State): ZoomTransform =>
  s.transform

export const zoomingSelector = (s: State): boolean =>
  s.zooming

export const editingSelector = (s: State): PersonID | undefined =>
  s.editing

export const arrowStartSelector = (s: State): PointTuple | undefined =>
  s.arrowStart

export const arrowEndSelector = (s: State): PointTuple | undefined =>
  s.arrowEnd

export const selectedSelector = (s: State): Set<PersonID | ParentsID> =>
  s.selected
