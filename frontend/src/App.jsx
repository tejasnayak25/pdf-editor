import './App.css'
import { Route, Routes } from 'react-router-dom'
import Signup from './signup/Signup'
import Login from './login/Login'
import Home from './home/Home'
import PdfEdit from './pdf/PdfEdit'
import PdfView from './pdf/PdfView'
import PdfSubmissions from './pdf/PdfSubmissions'
import PdfSubmissionView from './pdf/PdfSubmissionView'

function App() {

  return (
    <div className='size-full min-w-full min-h-dvh bg-slate-200'>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pdfs/:pdf/edit" element={<PdfEdit />} />
        <Route path="/pdfs/:pdf/view" element={<PdfView />} />
        <Route path="/pdfs/:pdf/submissions" element={<PdfSubmissions />} />
        <Route path="/pdfs/:pdf/submissions/:id" element={<PdfSubmissionView />} />
      </Routes>
    </div>
  )
}

export default App
