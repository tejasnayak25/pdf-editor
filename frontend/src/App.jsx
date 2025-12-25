// import { useState } from 'react'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Login from './login/Login'
import Home from './home/Home'

function App() {

  return (
    <div className='size-full min-w-full min-h-dvh bg-slate-200'>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  )
}

export default App
