import { useState } from 'react'
import LoginScreen from './components/LoginScreen'
import BukaShiftScreen from './components/BukaShiftScreen'

function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'bukaShift'>('login')

  return (
    <div className="min-h-screen flex flex-col w-full h-screen font-sans">
      <div className="flex-1 flex items-center justify-center p-6">
        {currentScreen === 'login' && <LoginScreen onLogin={() => setCurrentScreen('bukaShift')} />}
        {currentScreen === 'bukaShift' && <BukaShiftScreen />}
      </div>
    </div>
  )
}

export default App
