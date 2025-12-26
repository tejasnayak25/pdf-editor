import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getPdf } from "./utils";
import { Document, Page } from "react-pdf";
import { ChevronLeft, ChevronUp, ChevronDown, Save } from "lucide-react";
import { options } from "./pdf-viewer-utils";
import TextInput from "../components/TextInput";

export default function PdfView() {
    const { pdf: pdfId } = useParams();
    const [ user ] = useState(() => {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    });
    const userEmail = user?.email;
    const [ pdf, setPdf ] = useState(null);
    const [ numPages, setNumPages ] = useState(null);
    const [ pageNumber, setPageNumber ] = useState(0);
    const [ config, setConfig ] = useState(null);

    const canvasRef = useRef(null);

    const goToPage = (pageNum) => {
        if(pageNum < 1 || pageNum > numPages) return;
        setPageNumber(pageNum);
    }

    useEffect(() => {
        if(!userEmail) {
          window.location.href = '/login';
          return;
        }
        if(pdfId && userEmail)
          getPdf(pdfId, 'view', userEmail)
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
                .then(data => setConfig(data))
                .catch(err => {
                    console.error("Error fetching PDF config:", err);
                    setConfig(null);
                });
        }
    }, [pdf]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    const handleSave = () => {
        if(!pdf) return;
    }

    return (
        <div className='text-slate-900 flex size-full'>
            <div className=' max-h-dvh flex-1 overflow-y-hidden flex justify-center bg-slate-950'>
                {pdf ? (
                <div className='relative'>
                    <div className=' relative z-10'>
                        <Document options={options} file={pdf.file.url} onLoadSuccess={onDocumentLoadSuccess} className="relative z-11">
                            <Page pageNumber={pageNumber} />
                        </Document>
                        <div ref={canvasRef} className='absolute top-0 left-0 w-full h-full z-12'>
                            {config && config[pageNumber - 1] && config[pageNumber - 1].elements.map(element => {
                                if(element.type === "text") {
                                    return (
                                        <TextInput type="text" fontSize={element.fontSize} rect={element.rect} placeholder={element.placeholder} value={""} onChange={() => {}} />
                                    );
                                }
                            })}
                        </div>
                    </div>
                    <header className='fixed z-20 top-0 left-0 w-full text-white px-4 py-5 rounded-sm text-lg pointer-events-none flex gap-4 items-center justify-between'>
                    <div className='flex gap-4 items-center'>
                        <button className='btn btn-ghost btn-square' onClick={() => window.location.href = "/"}>
                        <ChevronLeft className='w-7 h-7 pointer-events-auto' />
                        </button> 
                        {pdf.name}
                    </div>
                    {user?.role === "student" && (
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
    );
}