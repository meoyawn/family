import { FamilyTree } from "./types";

export const addPerson = ({ people }: FamilyTree, name: string) => {
  people.doc?.transact(() => {
    const id = Math.random().toString(36)
    people.set(id, {
      id,
      name,
      families: [],
    })
  })
}
