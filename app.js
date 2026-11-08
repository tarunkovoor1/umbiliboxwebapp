/**
 * Main application logic for phone lockbox timer
 */

let activeSession = null
const sessionStartTime = null
const timerInterval = null

// Declare database and BluetoothManager variables
const database = require("./database") // Assuming database is a module
const BluetoothManager = require("./BluetoothManager") // Assuming BluetoothManager is a module
const bluetoothManager = new BluetoothManager()

/**
 * Initialize the application
 */
async function initApp() {
  try {
    // Initialize database
    await database.init()
    console.log("[UmbiliBox] Database initialized")

    // Setup event listeners
    setupEventListeners()

    // Load and display existing sessions
    await loadSessions()

    // Update statistics
    await updateStatistics()

    // Check Bluetooth support
    if (!BluetoothManager.isSupported()) {
      showAlert("Bluetooth is not supported in your browser. Please use Chrome or Edge.", "error")
    }
  } catch (error) {
    console.error("[UmbiliBox] Init error:", error)
    showAlert("Failed to initialize app: " + error.message, "error")
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Bluetooth button
  document.getElementById("bluetoothBtn").addEventListener("click", handleBluetoothClick)
  document.getElementById("scanBtn").addEventListener("click", handleScan)
  document.getElementById("disconnectBtn").addEventListener("click", handleDisconnect)
  document.getElementById("clearHistoryBtn").addEventListener("click", handleClearHistory)

  // Bluetooth manager events
  bluetoothManager.onEvent((eventType, data) => {
    handleBluetoothEvent(eventType, data)
  })
}

/**
 * Handle Bluetooth button click
 */
async function handleBluetoothClick() {
  if (bluetoothManager.isConnected) {
    handleDisconnect()
  } else {
    handleScan()
  }
}

/**
 * Handle Bluetooth scan
 */
async function handleScan() {
  const scanBtn = document.getElementById("scanBtn")
  scanBtn.disabled = true
  scanBtn.textContent = "Scanning..."

  try {
    const success = await bluetoothManager.connectDevice()
    if (success) {
      showAlert("Connected to device!", "success")
    }
  } catch (error) {
    showAlert("Connection failed: " + error.message, "error")
  } finally {
    scanBtn.disabled = false
    scanBtn.textContent = "Scan for Devices"
  }
}

/**
 * Handle Bluetooth disconnect
 */
function handleDisconnect() {
  bluetoothManager.disconnect()
}

/**
 * Handle Bluetooth events
 */
async function handleBluetoothEvent(eventType, data) {
  switch (eventType) {
    case "connected":
      updateConnectionUI(true, data)
      break
    case "disconnected":
      updateConnectionUI(false, null)
      break
    case "sessionComplete":
      handleSessionComplete(data)
      break
    case "error":
      showAlert("Connection error: " + data, "error")
      break
  }
}

/**
 * Handle completed session from Arduino
 */
async function handleSessionComplete(data) {
  try {
    // Create session object
    const session = {
      duration: data.duration || 0, // in seconds
      timeSet: data.timeSet || 0,
      startTime: new Date(data.startTime || Date.now()).toLocaleTimeString(),
      endTime: new Date(data.endTime || Date.now()).toLocaleTimeString(),
      status: "completed",
    }

    console.log("[UmbiliBox] Session complete:", session)

    // Save to database
    await database.addSession(session)

    // Reload sessions and stats
    await loadSessions()
    await updateStatistics()

    // Show notification
    showAlert(`Session completed! Duration: ${formatDuration(session.duration)}`, "success")

    // Clear active session UI if visible
    if (activeSession) {
      document.getElementById("activeSessionSection").classList.add("hidden")
      activeSession = null
    }
  } catch (error) {
    console.error("[UmbiliBox] Error saving session:", error)
    showAlert("Failed to save session: " + error.message, "error")
  }
}

/**
 * Load and display sessions
 */
async function loadSessions() {
  try {
    const sessions = await database.getAllSessions()
    const container = document.getElementById("sessionsContainer")

    if (sessions.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <p class="empty-text">No sessions yet. Start your first session!</p>
                </div>
            `
      return
    }

    container.innerHTML = sessions
      .map(
        (session, index) => `
            <div class="session-item">
                <div class="session-details">
                    <div class="session-duration">${formatDuration(session.duration || 0)}</div>
                    <div class="session-time">${session.startTime || "N/A"} - ${session.endTime || "N/A"}</div>
                    <div class="session-date">${new Date(session.date).toLocaleDateString()} ${new Date(session.date).toLocaleTimeString()}</div>
                </div>
                <div class="session-status">Completed</div>
            </div>
        `,
      )
      .join("")
  } catch (error) {
    console.error("[UmbiliBox] Error loading sessions:", error)
  }
}

/**
 * Update statistics display
 */
async function updateStatistics() {
  try {
    const stats = await database.getStatistics()

    document.getElementById("totalSessions").textContent = stats.totalSessions
    document.getElementById("totalTime").textContent = formatDuration(stats.totalTime)
    document.getElementById("avgSession").textContent = formatDuration(stats.averageTime)
    document.getElementById("longestSession").textContent = formatDuration(stats.longestSession)
  } catch (error) {
    console.error("[UmbiliBox] Error updating statistics:", error)
  }
}

/**
 * Update connection UI
 */
function updateConnectionUI(connected, deviceName) {
  const scanBtn = document.getElementById("scanBtn")
  const disconnectBtn = document.getElementById("disconnectBtn")
  const statusText = document.querySelector(".status-text")
  const bluetoothStatus = document.getElementById("bluetoothStatus")

  if (connected) {
    scanBtn.classList.add("hidden")
    disconnectBtn.classList.remove("hidden")
    statusText.textContent = `Connected to: ${deviceName}`
    bluetoothStatus.textContent = "Disconnect"
  } else {
    scanBtn.classList.remove("hidden")
    disconnectBtn.classList.add("hidden")
    statusText.textContent = "No device connected"
    bluetoothStatus.textContent = "Connect Device"
  }
}

/**
 * Handle clear history
 */
async function handleClearHistory() {
  if (confirm("Are you sure you want to delete all session history? This cannot be undone.")) {
    try {
      await database.clearAllSessions()
      await loadSessions()
      await updateStatistics()
      showAlert("All sessions cleared", "success")
    } catch (error) {
      showAlert("Failed to clear history: " + error.message, "error")
    }
  }
}

/**
 * Show alert message
 */
function showAlert(message, type = "info") {
  const alert = document.getElementById("statusAlert")
  const statusMessage = document.getElementById("statusMessage")

  statusMessage.textContent = message
  alert.classList.remove("hidden")

  // Auto-hide after 5 seconds
  setTimeout(() => {
    alert.classList.add("hidden")
  }, 5000)
}

/**
 * Format duration in seconds to human readable format
 */
function formatDuration(seconds) {
  if (seconds === 0) return "0m"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Start the application when DOM is ready
 */
document.addEventListener("DOMContentLoaded", initApp)
