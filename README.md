UmbiliBox: Smart Phone Lockbox Companion App

UmbiliBox is a physical lockbox that holds your phone for a set amount of time to help you focus. This is its web app, built as my semester-long design project for **Intro to Engineering & Design. The app connects to the box over Bluetooth Low Energy, starts timed lock sessions, and tracks your focus habits over time.

The problem:
Phones are the biggest distraction while studying, and willpower alone often isn't enough. A box that locks the phone away removes the temptation. The app makes it easy to use and shows your progress, which helps you build the habit.

Features:
- Bluetooth control: pair with the lockbox from the browser and send lock commands with the session length.
- Quick lock and live timer: start a session in one tap and watch a countdown while the phone is locked.
- Session history: each session is saved with its duration, start/end time, and optional notes.
- Analytics dashboard: line, bar, and pie charts of focus time and session patterns.
- Insights: current daily streak, most productive weekday, average sessions per day, total focus time, and whether this week is up or down from last week.

How it works:
- The app uses the Web Bluetooth API to find the device, connect to its GATT server, and write the lock duration to a custom characteristic. It reads a status characteristic to track the box's state.
- Session data is stored in IndexedDB with indexes on start time and active status. The app needs no backend and works without an internet connection.
- A custom React hook keeps checking for the active session so the timer and other components stay in sync.
