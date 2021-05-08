import { FamilyID, FamilyTree, PersonID } from "./types";
import { genID } from "../lib/ids";

const familyID = (p1: PersonID, p2: PersonID): FamilyID =>
  [p1, p2].sort().join(':')

export const marry = ({ people, families }: FamilyTree, p1: PersonID, p2: PersonID): void => {
  if (p1 === p2) return

  const id = familyID(p1, p2)
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

export const createPerson = ({ people, families }: FamilyTree, name: string, fid?: FamilyID): PersonID => {
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

export const deleteStuff = ({ people, families }: FamilyTree, del: Set<string>): void => {
  if (!del.size) return

  people.doc?.transact(() => {
    del.forEach(id => {
      if (id.includes(":")) {
        people.forEach(p => {
          if (p.marriages.includes(id)) {
            people.set(p.id, {
              ...p,
              marriages: p.marriages.filter(x => x !== id),
            })
          }
        })
        families.delete(id)
      } else {
        families.forEach(f => {
          if (f.children.includes(id)) {
            families.set(f.id, {
              ...f,
              children: f.children.filter(x => x !== id),
            })
          }
        })
        people.delete(id)
      }
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

export const createParents = (
  { people, families }: FamilyTree,
  cid: PersonID,
): [PersonID, PersonID, FamilyID] | undefined => {
  if (!cid) return undefined

  const p1 = genID("p")
  const p2 = genID("p")
  const fid = familyID(p1, p2)

  people.doc?.transact(() => {
    families.set(fid, {
      id: fid,
      children: [cid],
    })
    people.set(p1, {
      id: p1,
      name: "",
      marriages: [fid],
    })
    people.set(p2, {
      id: p2,
      name: "",
      marriages: [fid],
    })
  })

  return [p1, p2, fid]
}

export const createSpouse = ({ people, families }: FamilyTree, pid: PersonID): PersonID | undefined => {
  const person = people.get(pid)
  if (!person) return undefined

  const sid = genID("p")
  const fid = familyID(pid, sid)

  people.doc?.transact(() => {
    families.set(fid, {
      id: fid,
      children: [],
    })
    people.set(person.id, {
      ...person,
      marriages: person.marriages.concat(fid),
    })
    people.set(sid, {
      id: sid,
      name: "",
      marriages: [fid],
    })
  })

  return sid
}
