import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { exportToPdf, getPdf } from "./utils";
import { Document, Page } from "react-pdf";
import { ChevronLeft, ChevronUp, ChevronDown, Save, History, Loader, Loader2, Printer } from "lucide-react";
import { options } from "./pdf-viewer-utils";
import TextInput from "../components/TextInput";
import RadioInput from "../components/RadioInput";
import CheckboxInput from "../components/CheckboxInput";
import DropdownInput from "../components/DropdownInput";
import CanvasInput from "../components/CanvasInput";

export default function PdfSubmissionView() {
    const { pdf: pdfId, id: submissionId } = useParams();
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
    const valuesRef = useRef({});

    const goToPage = (pageNum) => {
        if(pageNum < 1 || pageNum > numPages) return;
        setPageNumber(pageNum);
    }

    useEffect(() => {
        if(!userEmail) {
          window.location.href = '/login';
          return;
        }
        if(user.role !== "teacher") {
            window.location.href = '/';
            return;
        }
        if(pdfId && userEmail)
          getPdf(pdfId, 'view', userEmail)
            .then(fetchedPdf => {
                setPdf(fetchedPdf);
            })
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

                    console.log("Fetching submission data for ID:", data);

                    if(submissionId) {
                        fetch(`/api/pdfs/${pdfId}/get-submission`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                userEmail: userEmail,
                                submissionId: submissionId,
                            }),
                        }).then(res => res.json())
                        .then(data2 => {
                            if(data2.success) {
                                let submissionData = data2.submission;
                                console.log("Fetched submission data:", submissionData);
                                if(submissionData && submissionData.values) {
                                    valuesRef.current = { ...submissionData.values };
                                    let configCopy = { ...data };
                                    for(let page in configCopy) {
                                        for(let id in configCopy[page].elements) {
                                            if(submissionData.values[id] !== undefined) {
                                                configCopy[page].elements[id].value = submissionData.values[id];
                                            }
                                        }
                                    }

                                    setConfig(configCopy);
                                }
                            }
                        }).catch(err => {
                            console.error("Error fetching version data:", err);
                        });
                    }
                })
                .catch(err => {
                    console.error("Error fetching PDF config:", err);
                    setConfig(null);
                });
        }
    }, [pdf]);

    useEffect(() => {
        const handler = (e) => {
            if(e.key === "ArrowUp") {
                setPageNumber(prev => Math.max(1, prev - 1));
            } else if(e.key === "ArrowDown") {
                setPageNumber(prev => Math.min(numPages || prev + 1, prev + 1));
            }
        };
        document.addEventListener('keydown', handler);
        return () => {
            document.removeEventListener('keydown', handler);
        };
    }, [numPages]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    function exportPdf() {
        exportToPdf(pdf.file.url, config, (pdfBytes) => {
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${pdf.name}.pdf`;
            link.click();
        });
    }

    return (
        <div className='text-slate-900 flex size-full'>
            {
                (!pdf || !config) && (
                    <div className='text-slate-100 bg-slate-950 flex justify-center items-center size-full h-dvh z-30 fixed top-0 left-0'>
                        <Loader2 className="w-12 h-12 animate-spin" />
                    </div>
                )
            }
            <div className=' max-h-dvh flex-1 overflow-y-hidden flex justify-center bg-slate-950'>
                {pdf ? (
                <div className='relative h-dvh'>
                    <div className=' relative z-10 h-dvh'>
                        <Document options={options} file={pdf.file.url} onLoadSuccess={onDocumentLoadSuccess} className="relative z-11">
                            <Page pageNumber={pageNumber} />
                        </Document>
                        <div ref={canvasRef} className='absolute top-0 left-0 w-full h-full z-12'>
                            {config && config[pageNumber] && Object.entries(config[pageNumber].elements).map(([id, element]) => {
                                if(element.type === "text") {
                                    return (
                                        <TextInput key={id} id={id} page={pageNumber} type="text" fontSize={element.fontSize} rect={element.rect} placeholder={element.placeholder} value={element.value || ""} onValueChange={() => {}} readonly />
                                    );
                                } else if(element.type === "radio") {
                                    return (
                                        <RadioInput key={id} id={id} page={pageNumber} type="radio" fontSize={element.fontSize} layout={element.layout} rect={element.rect} options={element.options} selectedValue={element.value} onValueChange={() => {}} readonly />
                                    );
                                } else if(element.type === "checkbox") {
                                    return (
                                        <CheckboxInput key={id} id={id} page={pageNumber} type="checkbox" fontSize={element.fontSize} layout={element.layout} rect={element.rect} options={element.options} isChecked={element.value || []} onValueChange={() => {}} readonly />
                                    );
                                } else if(element.type === "dropdown") {
                                    return (
                                        <DropdownInput key={id} id={id} page={pageNumber} type="dropdown" fontSize={element.fontSize} rect={element.rect} options={element.options} value={element.value} onValueChange={() => {}} readonly />
                                    );
                                } else if(element.type === "canvas") {
                                    return (
                                        <CanvasInput key={id} id={id} page={pageNumber} rect={element.rect} value={element.value || ""} onValueChange={() => {}} readonly />
                                    );
                                }
                            })}
                        </div>
                    </div>
                    <header className='fixed z-20 top-0 left-0 w-full text-white px-4 py-5 rounded-sm text-lg pointer-events-none flex gap-4 items-center justify-between'>
                        <div className='flex gap-4 items-center'>
                            <button className='btn btn-ghost btn-square' onClick={() => window.location.href = `/pdfs/${pdfId}/submissions`} >
                            <ChevronLeft className='w-7 h-7 pointer-events-auto' />
                            </button> 
                            {pdf.name}
                        </div>
                        {user?.role === "teacher" && (
                            <button onClick={exportPdf} className='btn btn-outline pointer-events-auto flex items-center text-lg px-5 py-4'>
                                <Printer className='w-5 h-5 mr-2'/>
                                Export PDF
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