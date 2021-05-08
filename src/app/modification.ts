import { FamilyID, FamilyTree, PersonID } from "./types";
import { genID } from "../lib/ids";

const familyID = (p1: PersonID, p2: PersonID): FamilyID =>
  [p1, p2].sort().join(':')

export const marry = ({ families, doc }: FamilyTree, p1: PersonID, p2: PersonID): FamilyID | undefined => {
  if (p1 === p2) return undefined

  const id = familyID(p1, p2)
  if (families.get(id)) return undefined

  doc.transact(() => {
    families.set(id, {
      id,
      p1,
      p2,
    })
  })

  return id
}

export const createPerson = ({ people }: FamilyTree, name: string, fid?: FamilyID): PersonID => {
  const id = genID('p')

  people.doc?.transact(() => {
    people.set(id, {
      id,
      name,
      fid,
    })
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

function delFamily({ people, families }: FamilyTree, fid: FamilyID) {
  console.log(fid, 'delete family')

  people.forEach(p => {
    if (p.fid === fid) {
      people.set(p.id, {
        ...p,
        fid: undefined
      })
    }
  })

  families.delete(fid)
}

function delPerson(tree: FamilyTree, pid: PersonID) {
  const { people, families } = tree

  console.log(pid, 'delete person')

  families.forEach(f => {
    if (f.p1 === pid || f.p2 === pid) {
      delFamily(tree, f.id)
    }
  })

  people.delete(pid)
}

export const deleteStuff = (tree: FamilyTree, del: Set<string>): void => {
  if (!del.size) return

  tree.doc.transact(() => {
    del.forEach(id => {
      if (id.includes(":")) {
        delFamily(tree, id)
      } else {
        delPerson(tree, id)
      }
    })
  })
}

export const makeChild = ({ people, doc }: FamilyTree, pid: PersonID, fid: FamilyID): void => {

  const person = people.get(pid)
  if (!person) return

  if (person.fid === fid) return;

  doc.transact(() => {
    people.set(pid, {
      ...person,
      fid,
    })
  })
}

export const createParents = (
  { people, families, doc }: FamilyTree,
  cid: PersonID,
): [PersonID, PersonID, FamilyID] | undefined => {
  if (!cid) return undefined
  const child = people.get(cid)
  if (!child) return undefined

  const p1 = genID("p")
  const p2 = genID("p")
  const fid = familyID(p1, p2)

  doc.transact(() => {
    people.set(p1, {
      id: p1,
      name: "",
    })
    people.set(p2, {
      id: p2,
      name: "",
    })
    families.set(fid, {
      id: fid,
      p1,
      p2,
    })
    people.set(cid, {
      ...child,
      fid,
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
    people.set(sid, {
      id: sid,
      name: "",
    })
    families.set(fid, {
      id: fid,
      p1: pid,
      p2: sid,
    })
  })

  return sid
}
