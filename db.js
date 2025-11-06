/**
 * Database management for lockbox sessions using IndexedDB
 */

const DB_NAME = "LockboxDB"
const DB_VERSION = 1
const STORE_NAME = "sessions"

class LockboxDatabase {
  constructor() {
    this.db = null
    this.initialized = false
  }

  /**
   * Initialize the database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.initialized = true
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
          store.createIndex("date", "date", { unique: false })
          store.createIndex("completed", "completed", { unique: false })
        }
      }
    })
  }

  /**
   * Add a new session to the database
   */
  async addSession(session) {
    if (!this.initialized) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add({
        ...session,
        date: new Date().toISOString(),
        completed: true,
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Get all sessions
   */
  async getAllSessions() {
    if (!this.initialized) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("date")
      const request = index.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        // Sort by date descending (most recent first)
        const sessions = request.result.sort((a, b) => new Date(b.date) - new Date(a.date))
        resolve(sessions)
      }
    })
  }

  /**
   * Clear all sessions
   */
  async clearAllSessions() {
    if (!this.initialized) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get session statistics
   */
  async getStatistics() {
    const sessions = await this.getAllSessions()

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageTime: 0,
        longestSession: 0,
      }
    }

    const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const averageTime = Math.floor(totalTime / sessions.length)
    const longestSession = Math.max(...sessions.map((s) => s.duration || 0))

    return {
      totalSessions: sessions.length,
      totalTime,
      averageTime,
      longestSession,
    }
  }
}

// Create global database instance
const database = new LockboxDatabase()
