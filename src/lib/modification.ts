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
        marriages: person1.marriages.concat(id),
      })
    }

    const person2 = people.get(p2)
    if (person2) {
      people.set(p2, {
        ...person2,
        marriages: person2.marriages.concat(id),
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
      marriages: [],
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

export const makeChild = ({ people, families }: FamilyTree, pid: PersonID, fid: FamilyID) => {
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
