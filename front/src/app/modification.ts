import { ParentsID, FamilyTree, PersonID, Sex } from "./types";
import { genID } from "../lib/ids";

const familyID = (p1: PersonID, p2: PersonID): ParentsID =>
  [p1, p2].sort().join(':') as ParentsID

export const marry = ({ parents, doc }: FamilyTree, p1: PersonID, p2: PersonID): ParentsID | undefined => {
  if (p1 === p2) return undefined

  const id = familyID(p1, p2)
  if (parents.get(id)) return undefined

  doc.transact(() => {
    parents.set(id, {
      id,
      p1,
      p2,
    })
  })

  return id
}

export const createChild = ({ people }: FamilyTree, name: string, sex: Sex, fid?: ParentsID): PersonID => {
  const id = genID('p') as PersonID

  people.doc?.transact(() => {
    people.set(id, {
      id,
      name,
      fid,
      sex,
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

function delFamily({ people, parents }: FamilyTree, fid: ParentsID) {
  people.forEach(p => {
    if (p.fid === fid) {
      people.set(p.id, {
        ...p,
        fid: undefined
      })
    }
  })

  parents.delete(fid)
}

function delPerson(tree: FamilyTree, pid: PersonID) {
  const { people, parents } = tree

  parents.forEach(f => {
    if (f.p1 === pid || f.p2 === pid) {
      delFamily(tree, f.id)
    }
  })

  people.delete(pid)
}

const isFamily = (id: ParentsID | PersonID): id is ParentsID =>
  id.includes(":")

export const deleteStuff = (tree: FamilyTree, del: Set<ParentsID | PersonID>): void => {
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

export const makeChild = ({ people, doc, parents }: FamilyTree, pid: PersonID, fid: ParentsID): void => {

  const person = people.get(pid)
  const family = parents.get(fid)
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
  { people, parents, doc }: FamilyTree,
  cid: PersonID,
  dad: string,
  mom: string,
): [PersonID, PersonID, ParentsID] | undefined => {
  if (!cid) return undefined
  const child = people.get(cid)
  if (!child) return undefined

  const p1 = genID("p") as PersonID
  const p2 = genID("p") as PersonID
  const fid = familyID(p1, p2)

  doc.transact(() => {
    people.set(p1, {
      id: p1,
      name: dad,
      sex: 'm',
    })
    people.set(p2, {
      id: p2,
      name: mom,
      sex: 'f',
    })
    parents.set(fid, {
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

const opposite = (s: Sex): Sex => {
  switch (s) {
    case "m":
      return 'f'

    case "f":
      return 'm'
  }
}

export const createSpouse = ({ people, parents }: FamilyTree, pid: PersonID): [PersonID, ParentsID] | undefined => {
  const person = people.get(pid)
  if (!person) return undefined

  const sid = genID("p") as PersonID
  const fid = familyID(pid, sid)

  people.doc?.transact(() => {
    people.set(sid, {
      id: sid,
      name: "",
      sex: opposite(person.sex),
    })
    parents.set(fid, {
      id: fid,
      p1: pid,
      p2: sid,
    })
  })

  return [sid, fid]
}
