import './App.css'
import { Route, Routes } from 'react-router-dom'
import Login from './login/Login'
import Home from './home/Home'
import PdfEdit from './pdf/PdfEdit'
import PdfView from './pdf/PdfView'

function App() {

  return (
    <div className='size-full min-w-full min-h-dvh bg-slate-200'>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pdfs/:pdf/edit" element={<PdfEdit />} />
        <Route path="/pdfs/:pdf/view" element={<PdfView />} />
      </Routes>
    </div>
  )
}

export default App
