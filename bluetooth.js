/**
 * Web Bluetooth API integration for HM-10 module communication
 */

class BluetoothManager {
  constructor() {
    this.device = null
    this.server = null
    this.characteristic = null
    this.isConnected = false
    this.listeners = []
  }

  /**
   * Request Bluetooth device and establish connection
   */
  async connectDevice() {
    try {
      // Request device with UUID filter for HM-10
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { name: "HM-10" },
          { services: ["0000ffe0-0000-1000-8000-00805f9b34fb"] }, // Generic GATT service
        ],
        optionalServices: ["0000ffe0-0000-1000-8000-00805f9b34fb"],
      })

      console.log("[v0] Device selected:", this.device.name)

      // Connect to GATT server
      this.server = await this.device.gatt.connect()
      console.log("[v0] GATT server connected")

      // Get service and characteristic
      const service = await this.server.getPrimaryService("0000ffe0-0000-1000-8000-00805f9b34fb")
      this.characteristic = await service.getCharacteristic("0000ffe1-0000-1000-8000-00805f9b34fb")

      // Start listening for notifications
      await this.characteristic.startNotifications()
      this.characteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleCharacteristicValueChanged.bind(this),
      )

      this.isConnected = true
      this.notifyListeners("connected", this.device.name)
      console.log("[v0] Bluetooth connected successfully")

      return true
    } catch (error) {
      console.error("[v0] Connection error:", error)
      this.notifyListeners("error", error.message)
      return false
    }
  }

  /**
   * Handle incoming Bluetooth data
   */
  handleCharacteristicValueChanged(event) {
    const value = event.target.value
    const decoder = new TextDecoder()
    const data = decoder.decode(value)

    console.log("[v0] Received data:", data)

    try {
      // Parse incoming data (JSON format expected from Arduino)
      const parsedData = JSON.parse(data)
      if (parsedData.type === "SESSION_COMPLETE") {
        this.notifyListeners("sessionComplete", parsedData)
      }
    } catch (e) {
      console.warn("[v0] Could not parse incoming data:", data)
    }
  }

  /**
   * Send data to Arduino via Bluetooth
   */
  async sendData(data) {
    if (!this.isConnected || !this.characteristic) {
      throw new Error("Device not connected")
    }

    try {
      const encoder = new TextEncoder()
      const encoded = encoder.encode(JSON.stringify(data))
      await this.characteristic.writeValue(encoded)
      console.log("[v0] Data sent:", data)
    } catch (error) {
      console.error("[v0] Send error:", error)
      throw error
    }
  }

  /**
   * Disconnect from Bluetooth device
   */
  disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect()
      this.isConnected = false
      this.notifyListeners("disconnected")
      console.log("[v0] Bluetooth disconnected")
    }
  }

  /**
   * Subscribe to connection events
   */
  onEvent(callback) {
    this.listeners.push(callback)
  }

  /**
   * Notify all listeners of events
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach((listener) => listener(eventType, data))
  }

  /**
   * Check if Bluetooth is supported
   */
  static isSupported() {
    return !!(navigator.bluetooth && navigator.bluetooth.requestDevice)
  }
}

// Create global Bluetooth manager
const bluetoothManager = new BluetoothManager()
