"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  requestBluetoothDevice,
  getPairedDevices,
  savePairedDevice,
  removePairedDevice,
  type BluetoothDevice,
} from "@/lib/bluetooth"

export default function BluetoothConnection() {
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(true)

  useEffect(() => {
    setIsBluetoothSupported(!!navigator.bluetooth)
    const devices = getPairedDevices()
    setPairedDevices(devices)
    if (devices.length > 0) {
      setSelectedDevice(devices[0])
    }
  }, [])

  const handleScanDevice = async () => {
    setLoading(true)
    setError(null)
    try {
      const device = await requestBluetoothDevice()
      if (device) {
        savePairedDevice(device)
        setPairedDevices([...pairedDevices, device])
        setSelectedDevice(device)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan device")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDevice = (deviceId: string) => {
    removePairedDevice(deviceId)
    setPairedDevices(pairedDevices.filter((d) => d.id !== deviceId))
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(pairedDevices.length > 0 ? pairedDevices[0] : null)
    }
  }

  if (!isBluetoothSupported) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Bluetooth Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            Web Bluetooth API is not supported in your browser. Please use Chrome, Edge, or Samsung Internet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bluetooth Connection</CardTitle>
        <CardDescription>Connect and manage your lockbox devices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

        <Button onClick={handleScanDevice} disabled={loading} className="w-full">
          {loading ? "Scanning..." : "Scan for Device"}
        </Button>

        {pairedDevices.length > 0 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-2">Select Device</label>
              <div className="space-y-2">
                {pairedDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{device.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {device.id.slice(0, 12)}...</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="device"
                        value={device.id}
                        checked={selectedDevice?.id === device.id}
                        onChange={() => setSelectedDevice(device)}
                        className="w-4 h-4"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDevice(device.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {pairedDevices.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            No paired devices. Scan for a device to get started.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
