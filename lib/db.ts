// IndexedDB utility for managing phone lockbox sessions
interface LockSession {
  id: string
  duration: number // in seconds
  startTime: number
  endTime?: number
  isActive: boolean
  notes?: string
}

const DB_NAME = "PhoneLockboxDB"
const STORE_NAME = "sessions"
const DB_VERSION = 1

let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("startTime", "startTime", { unique: false })
        store.createIndex("isActive", "isActive", { unique: false })
      }
    }
  })
}

export async function createSession(duration: number, notes?: string): Promise<LockSession> {
  const database = await initDB()
  const session: LockSession = {
    id: Date.now().toString(),
    duration,
    startTime: Date.now(),
    isActive: true,
    notes,
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(session)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(session)
  })
}

export async function updateSession(id: string, updates: Partial<LockSession>): Promise<LockSession> {
  const database = await initDB()
  const session = await getSession(id)
  const updated = { ...session, ...updates }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(updated)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(updated)
  })
}

export async function getSession(id: string): Promise<LockSession> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result)
      } else {
        reject(new Error("Session not found"))
      }
    }
  })
}

export async function getAllSessions(): Promise<LockSession[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function getActiveSessions(): Promise<LockSession[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index("isActive")
    const request = index.getAll(true)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

export async function deleteSession(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
