import { FamilyID, FamilyTree, PersonID } from "./types";
import { genID } from "../lib/ids";

export const marry = ({ people, families }: FamilyTree, p1: PersonID, p2: PersonID): void => {
  if (p1 === p2) return

  const id = [p1, p2].sort().join(':')
  if (families.get(id)) return

  const person1 = people.get(p1)
  const person2 = people.get(p2)
  if (!person1 || !person2) return;

  families.doc?.transact(() => {

    families.set(id, {
      id,
      children: [],
    })

    people.set(p1, {
      ...person1,
      marriages: person1.marriages.concat(id),
    })

    people.set(p2, {
      ...person2,
      marriages: person2.marriages.concat(id),
    })
  })
}

export const giveBirth = ({ people, families }: FamilyTree, name: string, fid?: FamilyID): PersonID => {
  const family = fid && families.get(fid)
  const id = genID('p')

  people.doc?.transact(() => {
    people.set(id, {
      id,
      name,
      marriages: [],
    })

    if (family) {
      families.set(family.id, {
        ...family,
        children: family.children.concat(id),
      })
    }
  })

  return id
}

export const changeName = ({ people }: FamilyTree, pid: PersonID, name: string): void => {
  const person = people.get(pid)
  if (!person || person.name === name) return

  people.doc?.transact(() => {
    people.set(pid, {
      ...person,
      name,
    })
  })
}

export const makeChild = ({ families }: FamilyTree, pid: PersonID, fid: FamilyID): void => {
  const family = families.get(fid)
  if (!family) return
  if (family.children.includes(pid)) return

  families.doc?.transact(() => {
    families.set(fid, {
      ...family,
      children: family.children.concat(pid),
    })
  })
}
