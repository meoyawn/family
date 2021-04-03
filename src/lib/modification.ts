import { FamilyID, FamilyTree, PersonID } from "./types";

export const marry = ({ people, families }: FamilyTree, p1: PersonID, p2: PersonID) => {
  if (p1 === p2) return

  const id = [p1, p2].sort().join(':')
  if (families.get(id)) return

  families.doc?.transact(() => {

    families.set(id, {
      id,
      children: [],
    })

    const person1 = people.get(p1)
    if (person1) {
      people.set(p1, {
        ...person1,
        families: person1.families.concat(id),
      })
    }

    const person2 = people.get(p2)
    if (person2) {
      people.set(p2, {
        ...person2,
        families: person2.families.concat(id),
      })
    }
  })
}

export const giveBirth = ({ people, families }: FamilyTree, name: string, fid?: FamilyID) => {
  people.doc?.transact(() => {
    const id = Math.random().toString(36).substring(2)

    people.set(id, {
      id,
      name,
      families: [],
    })

    if (fid) {
      const family = families.get(fid)
      if (family) {
        families.set(fid, {
          ...family,
          children: family.children.concat(id),
        })
      }
    }
  })
}
