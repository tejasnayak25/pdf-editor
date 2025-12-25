import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { balloonEditor, getPdf } from './utils';
import { options } from "./pdf-viewer-utils";
import { Document, Page } from 'react-pdf';
import { ALargeSmall, ChevronDown, ChevronLeft, ChevronUp, Save, Text, Trash2, UnfoldHorizontal, UnfoldVertical } from 'lucide-react';

export default function PdfEdit() {
  const { pdf:pdfId } = useParams();
  const [ user ] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const userEmail = user?.email;

  const [ pdf, setPdf ] = useState(null);
  const canvasRef = useRef(null);
  const balloonRef = useRef(null);

  useEffect(() => {
    if(!userEmail) {
      window.location.href = '/login';
      return;
    }
    if(pdfId && userEmail)
      getPdf(pdfId, 'edit', userEmail)
        .then(fetchedPdf => setPdf(fetchedPdf))
        .catch(err => {
          console.error("Error fetching PDF:", err);
          setPdf(null);
        });
  }, [pdfId, userEmail]);

  const [numPages, setNumPages] = useState();
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const goToPage = (page) => {
    if(page < 1 || page > numPages) return;
    setPageNumber(page);
  }

  useEffect(() => {
    const canvasContainer = canvasRef.current;
    if(!canvasContainer) return;

    let mark;

    let balloon = balloonEditor(balloonRef.current);

    const handleMouseDown = (e) => {
      if(balloon.visible) {
        if(balloon.isTarget(e)) {
          return;
        } else {
          balloon.hide();
          return;
        }
      }

      if(e.target.getAttribute('data-tag') === 'pdf-mark') {
        return;
      }

      if(['INPUT', 'SELECT', 'OPTION', 'BUTTON', 'TEXTAREA', 'SPAN'].includes(e.target.nodeName)) {
        return;
      }

      const rect = canvasContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mark = document.createElement('div');
      mark.style.width = '20px';
      mark.style.height = '20px';
      mark.className = 'absolute border-2 border-slate-500 rounded-md bg-slate-300/50';
      mark.style.left = `${x - 10}px`;
      mark.style.top = `${y - 10}px`;
      mark.setAttribute('data-tag', 'pdf-mark');
      canvasContainer.appendChild(mark);

      let elem = mark;

      elem.oncontextmenu = (ev) => {
        ev.preventDefault();
        console.log("Right click on mark", elem.offsetLeft, elem.offsetTop);
        balloon.show(elem.offsetLeft + elem.offsetWidth / 2, elem.offsetTop, elem, user.role === "teacher" ? "edit" : "view", false);
      }
    }

    const handleMouseUp = () => {
      if(!mark) return;
      balloon.show(mark.offsetLeft + mark.offsetWidth / 2, mark.offsetTop, mark, user.role === "teacher" ? "edit" : "view");
      mark = null;
    }

    const handleMouseMove = (e) => {
      if(!mark) return;
      const rect = canvasContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const width = x - (parseInt(mark.style.left) + 10);
      const height = y - (parseInt(mark.style.top) + 10);
      mark.style.width = `${Math.abs(width)}px`;
      mark.style.height = `${Math.abs(height)}px`;
    }



    canvasContainer.onmousedown = handleMouseDown;
    canvasContainer.onmouseup = handleMouseUp;
    canvasContainer.onmousemove = handleMouseMove;
  });

  return (
    <div className='text-slate-900 flex size-full'>
      <div className=' max-h-dvh flex-1 overflow-y-hidden flex justify-center bg-slate-950'>
        {pdf ? (
          <div className='relative'>
            <div className=' relative z-10'>
              <Document options={options} file={pdf.file.url} onLoadSuccess={onDocumentLoadSuccess} className="relative z-11">
                <Page pageNumber={pageNumber} />
              </Document>
              <div ref={canvasRef} className='absolute top-0 left-0 w-full h-full z-12'></div>
              <div ref={balloonRef} className='absolute z-20 p-2 bg-white border border-slate-300 rounded shadow-lg transition-opacity duration-200 flex items-center gap-2' style={{ opacity: 0, visibility: 'hidden' }}>
                <select id='type-selector' defaultValue={"text"} className='border h-10 border-slate-300 rounded px-2 py-1'>
                  <option value="text">Text</option>
                  <option value="radio">Radio</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="free-hand">Free-hand</option>
                </select>

                <ALargeSmall className='w-5 h-5'/>
                <input type="number" name="font-size" id="font-size" className='input shrink-0 w-12 bg-white text-slate-900 border border-slate-300 rounded px-2 py-1' defaultValue={20} />

                <div className='h-10 w-px rounded-md bg-slate-300'></div>

                <button id='vertical-layout-btn' className='layout-btns btn btn-square bg-white border-0 hover:bg-slate-100 text-slate-900 shadow-slate-300 shadow-sm'><UnfoldVertical className='w-5 h-5'/></button>
                <button id='horizontal-layout-btn' className='layout-btns btn btn-square bg-white border-0 hover:bg-slate-100 text-slate-900 shadow-slate-300 shadow-sm'><UnfoldHorizontal className='w-5 h-5'/></button>

                <div className='h-10 w-px rounded-md bg-slate-300'></div>
                <button id='delete-btn' className='btn btn-square btn-error'><Trash2 className='w-5 h-5'/></button>
              </div>
            </div>
            <header className='fixed z-20 top-0 left-0 w-full text-white px-4 py-5 rounded-sm text-lg pointer-events-none flex gap-4 items-center justify-between'>
              <div className='flex gap-4 items-center'>
                <button className='btn btn-ghost btn-square' onClick={() => window.location.href = "/"}>
                  <ChevronLeft className='w-7 h-7 pointer-events-auto' />
                </button> 
                {pdf.name}
              </div>
              {user.role === "teacher" && (
                <button className='btn btn-outline pointer-events-auto flex items-center text-lg px-5 py-4'>
                  <Save className='w-5 h-5 mr-2'/>
                  Save
                </button>
              )}
            </header>
            <p className='fixed z-20 bottom-3 left-3 m-4 text-white px-4 py-2 rounded-sm bg-slate-500/50 flex items-center gap-4'>
              <button onClick={() => goToPage(pageNumber - 1)} className='btn btn-square btn-ghost'><ChevronUp className='w-7 h-7' /></button>
              Page {pageNumber} of {numPages}
              <button onClick={() => goToPage(pageNumber + 1)} className='btn btn-square btn-ghost'><ChevronDown className='w-7 h-7' /></button>
            </p>
          </div>
        ) : (
          <p>Loading PDF...</p>
        )}
      </div>
    </div>
  )
}