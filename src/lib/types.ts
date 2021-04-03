import * as Y from "yjs";

export type FamilyID = string
export type PersonID = string

export interface Person {
  id: PersonID
  name: string

  marriages: FamilyID[]

  birthYear?: number
  deathYear?: number
}

export interface Family {
  id: FamilyID
  name?: string
  children: PersonID[]

  startYear?: number
  endYear?: number
}

export interface FamilyTree {
  people: Y.Map<Person>
  families: Y.Map<Family>
}
