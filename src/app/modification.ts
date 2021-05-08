import { FamilyID, FamilyTree, PersonID } from "./types";
import { genID } from "../lib/ids";

const familyID = (p1: PersonID, p2: PersonID): FamilyID =>
  [p1, p2].sort().join(':') as FamilyID

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

export const createChild = ({ people }: FamilyTree, name: string, fid?: FamilyID): PersonID => {
  const id = genID('p') as PersonID

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

  families.forEach(f => {
    if (f.p1 === pid || f.p2 === pid) {
      delFamily(tree, f.id)
    }
  })

  people.delete(pid)
}

const isFamily = (id: FamilyID | PersonID): id is FamilyID =>
  id.includes(":")

export const deleteStuff = (tree: FamilyTree, del: Set<FamilyID | PersonID>): void => {
  if (!del.size) return

  tree.doc.transact(() => {
    del.forEach(id => {
      if (isFamily(id)) {
        delFamily(tree, id)
      } else {
        delPerson(tree, id)
      }
    })
  })
}

export const makeChild = ({ people, doc, families }: FamilyTree, pid: PersonID, fid: FamilyID): void => {

  const person = people.get(pid)
  const family = families.get(fid)
  if (!person || !family) return

  if (person.fid === fid || family.p1 === pid || family.p2 === pid) return;

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

  const p1 = genID("p") as PersonID
  const p2 = genID("p") as PersonID
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

  const sid = genID("p") as PersonID
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
