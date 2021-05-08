import * as Y from "yjs";

export type FamilyID = string
export type PersonID = string

export interface Person {
  id: PersonID
  name: string

  sex?: 'm' | 'f'
  fid?: FamilyID
  birthYear?: number
  deathYear?: number
}

export interface Family {
  id: FamilyID
  p1: PersonID
  p2: PersonID

  name?: string
  startYear?: number
  endYear?: number
}

export interface FamilyTree {
  doc: Y.Doc
  people: Y.Map<Person>
  families: Y.Map<Family>
}
