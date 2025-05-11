import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import AppRoutes from './routes/AppRoutes'
import './index.css'; 
import { UserProvider } from './context/user.context';
import { ToastContainer } from "react-toastify";


function App() {

  return (
    <div className='w-full' >
      <UserProvider>
        <AppRoutes/>
      </UserProvider>      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default App
