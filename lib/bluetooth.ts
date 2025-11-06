// Web Bluetooth utilities for connecting to phone lockbox devices

export interface BluetoothDevice {
  id: string
  name: string
  rssi?: number
  isConnected: boolean
  lastConnected?: number
}

const LOCKBOX_SERVICE_UUID = "12345678-1234-1234-1234-123456789012"
const LOCK_CHARACTERISTIC_UUID = "87654321-4321-4321-4321-210987654321"
const STATUS_CHARACTERISTIC_UUID = "abcdef00-1234-5678-1234-567890abcdef"

export async function requestBluetoothDevice(): Promise<BluetoothDevice | null> {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth API is not supported in this browser")
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "LockBox" }, { services: [LOCKBOX_SERVICE_UUID] }],
      optionalServices: [LOCKBOX_SERVICE_UUID],
    })

    return {
      id: device.id,
      name: device.name || "Unknown Device",
      isConnected: device.gatt?.connected || false,
      lastConnected: Date.now(),
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("User cancelled")) {
      return null
    }
    throw error
  }
}

export async function connectToDevice(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer | null> {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth API is not supported")
  }

  try {
    const bluetoothDevice = await (navigator.bluetooth as any).requestDevice({
      filters: [{ name: device.name }],
    })

    const gattServer = await bluetoothDevice.gatt.connect()
    return gattServer
  } catch (error) {
    console.error("Failed to connect to device:", error)
    throw error
  }
}

export async function sendLockCommand(gattServer: BluetoothRemoteGATTServer, duration: number): Promise<void> {
  try {
    const service = await gattServer.getPrimaryService(LOCKBOX_SERVICE_UUID)
    const characteristic = await service.getCharacteristic(LOCK_CHARACTERISTIC_UUID)

    const buffer = new ArrayBuffer(4)
    const view = new Uint32Array(buffer)
    view[0] = duration

    await characteristic.writeValue(buffer)
  } catch (error) {
    console.error("Failed to send lock command:", error)
    throw error
  }
}

export async function getDeviceStatus(gattServer: BluetoothRemoteGATTServer): Promise<string> {
  try {
    const service = await gattServer.getPrimaryService(LOCKBOX_SERVICE_UUID)
    const characteristic = await service.getCharacteristic(STATUS_CHARACTERISTIC_UUID)
    const value = await characteristic.readValue()

    const decoder = new TextDecoder()
    return decoder.decode(value)
  } catch (error) {
    console.error("Failed to get device status:", error)
    throw error
  }
}

export async function disconnectDevice(gattServer: BluetoothRemoteGATTServer): Promise<void> {
  try {
    if (gattServer.connected) {
      gattServer.disconnect()
    }
  } catch (error) {
    console.error("Failed to disconnect:", error)
  }
}

// Local storage for paired devices
const PAIRED_DEVICES_KEY = "paired_bluetooth_devices"

export function savePairedDevice(device: BluetoothDevice): void {
  try {
    const devices = JSON.parse(localStorage.getItem(PAIRED_DEVICES_KEY) || "[]")
    const exists = devices.some((d: BluetoothDevice) => d.id === device.id)
    if (!exists) {
      devices.push(device)
      localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices))
    }
  } catch (error) {
    console.error("Failed to save paired device:", error)
  }
}

export function getPairedDevices(): BluetoothDevice[] {
  try {
    return JSON.parse(localStorage.getItem(PAIRED_DEVICES_KEY) || "[]")
  } catch (error) {
    console.error("Failed to get paired devices:", error)
    return []
  }
}

export function removePairedDevice(deviceId: string): void {
  try {
    const devices = JSON.parse(localStorage.getItem(PAIRED_DEVICES_KEY) || "[]")
    const filtered = devices.filter((d: BluetoothDevice) => d.id !== deviceId)
    localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Failed to remove paired device:", error)
  }
}
