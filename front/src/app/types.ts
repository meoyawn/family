import * as Y from "yjs"

export type FamilyID = string & { readonly __tag: unique symbol }
export type PersonID = string & { readonly __tag: unique symbol }
export type Sex = 'm' | 'f'

export interface Person {
  id: PersonID
  name: string
  sex: Sex

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
