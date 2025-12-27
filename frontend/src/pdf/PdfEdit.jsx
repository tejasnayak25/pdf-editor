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
  const [ config, setConfig ] = useState(null);

  const [ pdf, setPdf ] = useState(null);
  const canvasRef = useRef(null);
  const balloonRef = useRef(null);
  const pagesRef = useRef({});
  const balloonsRef = useRef({});
  const containerRectRef = useRef(null);

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

  useEffect(() => {
        if(!pdf) return;
        if(pdf.config) {
            fetch(pdf.config.url)
                .then(res => res.json())
                .then(data => {                  
                  setConfig(data);
                })
                .catch(err => {
                    console.error("Error fetching PDF config:", err);
                    setConfig(null);
                });
        }
  }, [pdf]);

  const [numPages, setNumPages] = useState();
  const [pageNumber, setPageNumber] = useState(0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPage = (page) => {
    if(page < 1 || page > numPages) return;
    balloonsRef.current[pageNumber]?.hide();
    setPageNumber(page);
  }

  const initializeEditor = () => {
    const canvasContainer = canvasRef.current;
    if(!canvasContainer) return;

    canvasContainer.innerHTML = '';

    containerRectRef.current = canvasContainer.getBoundingClientRect();

    balloonsRef.current[pageNumber] = balloonEditor(balloonRef.current, canvasContainer, pageNumber, pagesRef.current);

    balloonsRef.current[pageNumber].init(pageNumber, (user?.role === "teacher") ? "edit" : "view", config ? config[pageNumber] : null);
  }

  useEffect(() => {
    const canvasContainer = canvasRef.current;
    if(!canvasContainer) return;

    let mark;

    const handleMouseDown = (e) => {
      if(balloonsRef.current[pageNumber].visible) {
        console.log(e.target);
        if(e.target.classList.contains("dialog-editor") || e.target.closest(".dialog-editor")) {
          return;
        }
        if(['INPUT', 'SELECT', 'OPTION', 'BUTTON', 'TEXTAREA', 'SPAN'].includes(e.target.nodeName)) {
          return;
        }
        if(balloonsRef.current[pageNumber].isTarget(e)) {
          return;
        } else {
          balloonsRef.current[pageNumber].hide();
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
      mark.style.width = '200px';
      mark.style.height = '50px';
      mark.className = 'absolute border-2 border-slate-500 rounded-md bg-slate-300/50';
      mark.style.left = `${x - 10}px`;
      mark.style.top = `${y - 10}px`;
      mark.setAttribute('data-tag', 'pdf-mark');
      canvasContainer.appendChild(mark);
    }

    const handleMouseUp = () => {
      if(!mark) return;
      balloonsRef.current[pageNumber].show(mark.offsetLeft + mark.offsetWidth / 2, mark.offsetTop, mark, (user?.role === "teacher") ? "edit" : "view");
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

    return () => {
      canvasContainer.onmousedown = null;
      canvasContainer.onmouseup = null;
      canvasContainer.onmousemove = null;
    };
  }, [pageNumber, user?.role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeEditor();
    }, 0);
    return () => clearTimeout(timer);
  }, [pageNumber, user?.role]);

  useEffect(() => {
    document.onkeydown = (e) => {
      if(e.key === "Escape") {
        balloonsRef.current[pageNumber]?.hide();
      } else if(e.key === "Delete") {
        balloonRef.current?.querySelector('#delete-btn')?.click();
      } else if(e.key === "ArrowUp") {
        goToPage(pageNumber - 1);
      } else if(e.key === "ArrowDown") {
        goToPage(pageNumber + 1);
      }
    }
    return () => {
      document.onkeydown = null;
    }
  }, [pageNumber]);

  const handleSave = async () => {
    if(!pdf) return;
    try {
      let pdfData = {
        pdf_id: pdfId,
        pages: {},
        creator: userEmail,
      };
      for(const pageNum in pagesRef.current) {
        const page = pagesRef.current[pageNum];
        if(!page) {
          if(config && config[pageNum]) {
            pdfData.pages[pageNum] = config[pageNum];
          }
          continue;
        };
        const balloons = balloonsRef.current[pageNum];
        if(!balloons) continue;
        let pageData = balloons.prepareData(pageNum);
        if(pageData.elements && Object.keys(pageData.elements).length === 0) continue;
        pdfData.pages[pageNum] = pageData;
      }

      await fetch('/api/save-pdf-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData),
      })
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          alert("PDF saved successfully!");
        } else {
          alert("Error saving PDF: " + data.message);
        }
      })
      .catch(err => {
        console.error("Error saving PDF:", err);
        alert("Error saving PDF.");
      });
    }
    catch(err) {
      console.error("Error saving PDF:", err);
    }
  }

  return (
    <div className='text-slate-900 flex size-full'>
      <div className=' max-h-dvh flex-1 overflow-y-hidden flex justify-center bg-slate-950'>
        {pdf ? (
          <div className='relative h-dvh'>
            <div className=' relative z-10 h-dvh'>
              <Document options={options} file={pdf.file.url} onLoadSuccess={onDocumentLoadSuccess} className="relative z-11">
                <Page pageNumber={pageNumber} onRenderSuccess={() => {
                  // Capture stable rect after page renders
                  setTimeout(() => {
                    if(canvasRef.current) {
                      containerRectRef.current = canvasRef.current.getBoundingClientRect();
                      initializeEditor();
                    }
                  }, 0);
                }} />
              </Document>
              <div ref={canvasRef} className='absolute top-0 left-0 w-full h-full z-12'></div>
              <div ref={balloonRef} className='absolute z-20 p-2 bg-white border border-slate-300 rounded shadow-lg transition-opacity duration-200 flex items-center gap-2' style={{ opacity: 0, visibility: 'hidden' }}>
                <select id='type-selector' defaultValue={"text"} className='border h-10 border-slate-300 rounded px-2 py-1'>
                  <option value="text">Text</option>
                  <option value="radio">Radio</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="canvas">Canvas</option>
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
              {user?.role === "teacher" && (
                <button onClick={handleSave} className='btn btn-outline pointer-events-auto flex items-center text-lg px-5 py-4'>
                  <Save className='w-5 h-5 mr-2'/>
                  Save
                </button>
              )}
            </header>
            <p className='fixed z-20 bottom-3 left-3 m-4 text-white px-4 py-2 rounded-sm bg-slate-500/50 flex flex-col justify-center items-center gap-4'>
              <button onClick={() => goToPage(pageNumber - 1)} className='btn btn-square btn-ghost'><ChevronUp className='w-7 h-7' /></button>
              <input type="number" name="page-number" id="page-number" min={1} max={numPages} value={pageNumber} onChange={(e) => goToPage(Number(e.target.value))} className='input w-10 bg-white border border-slate-300 text-center text-slate-900' />
              <span>/</span>
              {numPages}
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