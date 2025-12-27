import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { dataURLToBlob, exportToPdf, getPdf } from "./utils";
import { Document, Page } from "react-pdf";
import { ChevronLeft, ChevronUp, ChevronDown, Save, History, Loader, Loader2, Printer } from "lucide-react";
import { options } from "./pdf-viewer-utils";
import TextInput from "../components/TextInput";
import RadioInput from "../components/RadioInput";
import CheckboxInput from "../components/CheckboxInput";
import DropdownInput from "../components/DropdownInput";
import CanvasInput from "../components/CanvasInput";

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
    const [ navOpen, setNavOpen ] = useState(false);
    const [ versionMode, setVersionMode ] = useState('draft');
    const [ draftVersions, setDraftVersions ] = useState([]);
    const [ submittedVersions, setSubmittedVersions ] = useState([]);
    const [ versionWinOpen, setVersionWinOpen ] = useState(false);

    const canvasRef = useRef(null);
    const valuesRef = useRef({});

    const goToPage = (pageNum) => {
        if(pageNum < 1 || pageNum > numPages) return;
        setPageNumber(pageNum);
    }

    function fetchVersions() {
        if(!pdfId || !userEmail) return;
        fetch(`/api/pdfs/${pdfId}/get-user-drafts-submissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userEmail }),
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                setDraftVersions(data.drafts);
                setSubmittedVersions(data.submissions);
            } else {
                alert("Error fetching versions.");
            }
        })
        .catch(err => {
            console.error("Error fetching versions:", err);
            alert("Error fetching versions.");
        });
    }

    useEffect(() => {
        if(!userEmail) {
          window.location.href = '/login';
          return;
        }
        if(user.role !== "student") {
            window.location.href = '/';
            return;
        }
        if(pdfId && userEmail)
          getPdf(pdfId, 'view', userEmail)
            .then(fetchedPdf => {
                setPdf(fetchedPdf);
                fetchVersions();
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

                    let versionId = new URLSearchParams(window.location.search).get('version');

                    if(draftVersions.length > 0 || submittedVersions.length > 0) {
                        let versions = [...draftVersions, ...submittedVersions];
                        let versionData = versions.find(v => v._id === versionId);
                        if(versionId && versionData) {
                            valuesRef.current = { ...versionData.values };
                            let configCopy = { ...data };
                            for(let page in configCopy) {
                                for(let id in configCopy[page].elements) {
                                    if(versionData.values[id] !== undefined) {
                                        configCopy[page].elements[id].value = versionData.values[id];
                                    }
                                }
                            }

                            setConfig(configCopy);
                            return;
                        }
                    }

                    if(versionId) {
                        fetch(`/api/pdfs/${pdfId}/get-version`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                userEmail: userEmail,
                                versionId: versionId,
                            }),
                        }).then(res => res.json())
                        .then(data2 => {
                            if(data2.success) {
                                let versionData = data2.version;
                                if(versionData && versionData.values) {
                                    valuesRef.current = { ...versionData.values };
                                    let configCopy = { ...data };
                                    for(let page in configCopy) {
                                        for(let id in configCopy[page].elements) {
                                            if(versionData.values[id] !== undefined) {
                                                configCopy[page].elements[id].value = versionData.values[id];
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

    const handleValueChange = useCallback((page, id, value) => {
        valuesRef.current[id] = value;
        setConfig(prev => {
            const configCopy = { ...prev };
            if(!configCopy[page]) {
                configCopy[page] = { elements: {} };
            }
            if(!configCopy[page].elements[id]) {
                configCopy[page].elements[id] = {};
            }
            configCopy[page].elements[id].value = value;
            return configCopy;
        });
    }, []);

    const handleSave = (mode = "draft") => {
        if(!pdf) return;

        let values = valuesRef.current;

        let formdata = new FormData();

        Object.entries(values).forEach(([key, value]) => {
            if(value instanceof String && value.startsWith("data:image/")) {
                const blob = dataURLToBlob(value);
                formdata.append(key, blob, `${key}.png`);
                values[key] = `file://${key}.png`;
            } else {
                values[key] = value;
            }
        });

        formdata.append('userEmail', userEmail);
        formdata.append('values', JSON.stringify(values));

        fetch(`/api/pdfs/${pdfId}/save-${mode}`, {
            method: 'POST',
            body: formdata,
        }).then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(`Form data saved successfully as ${mode}!`);
                if(mode === "draft") {
                    setDraftVersions(prev => [{ _id: data.id, createdAt: Date.now() }, ...prev]);
                } else {
                    setSubmittedVersions(prev => [{ _id: data.id, createdAt: Date.now() }, ...prev]);
                }
            } else {
                alert("Error saving form data.");
            }
        }).catch(err => {
            console.error("Error saving form data:", err);
            alert("Error saving form data.");
        });
    }

    function gotoVersion(version) {
        if(!pdf) return;
        window.open(`/pdfs/${pdfId}/view?version=${version._id}`, '_self');     
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
                                        <TextInput key={id} id={id} page={pageNumber} type="text" fontSize={element.fontSize} rect={element.rect} placeholder={element.placeholder} value={element.value || ""} onValueChange={handleValueChange} />
                                    );
                                } else if(element.type === "radio") {
                                    return (
                                        <RadioInput key={id} id={id} page={pageNumber} type="radio" fontSize={element.fontSize} layout={element.layout} rect={element.rect} options={element.options} selectedValue={element.value} onValueChange={handleValueChange} />
                                    );
                                } else if(element.type === "checkbox") {
                                    return (
                                        <CheckboxInput key={id} id={id} page={pageNumber} type="checkbox" fontSize={element.fontSize} layout={element.layout} rect={element.rect} options={element.options} isChecked={element.value || []} onValueChange={handleValueChange} />
                                    );
                                } else if(element.type === "dropdown") {
                                    return (
                                        <DropdownInput key={id} id={id} page={pageNumber} type="dropdown" fontSize={element.fontSize} rect={element.rect} options={element.options} value={element.value} onValueChange={handleValueChange} />
                                    );
                                } else if(element.type === "canvas") {
                                    return (
                                        <CanvasInput key={id} id={id} page={pageNumber} rect={element.rect} value={element.value || ""} onValueChange={handleValueChange} />
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
                        <div className="flex gap-4 items-center">
                            {user?.role === "student" && (
                                <button onClick={exportPdf} className='btn btn-outline pointer-events-auto flex items-center text-lg px-5 py-4'>
                                <Printer className='w-5 h-5 mr-2'/>
                                Export PDF
                                </button>
                            )}
                            {user?.role === "student" && (
                                <button onClick={() => setNavOpen(!navOpen)} className='btn btn-outline pointer-events-auto flex items-center text-lg px-5 py-4'>
                                <Save className='w-5 h-5 mr-2'/>
                                Save
                                </button>
                            )}
                        </div>
                        {user?.role === "student" && (
                            <div className={`${navOpen ? 'flex opacity-100' : 'hidden opacity-0'} transition-opacity delay-150 absolute top-16 right-4 flex-col gap-0.5 bg-slate-800 text-slate-900 p-0.5 rounded-md shadow-lg w-52 pointer-events-auto`}>
                                <button onClick={() => handleSave("draft")} className="btn btn-ghost bg-slate-900 text-white hover:bg-slate-800">Save Draft</button>
                                <button onClick={() => handleSave("submission")} className="btn btn-ghost bg-slate-900 text-white hover:bg-slate-800">Submit PDF</button>
                            </div>
                        )}
                    </header>
                    <p className='fixed z-20 bottom-3 left-3 m-4 text-white px-4 py-2 rounded-sm bg-slate-500/50 flex flex-col justify-center items-center gap-4'>
                        <button onClick={() => goToPage(pageNumber - 1)} className='btn btn-square btn-ghost'><ChevronUp className='w-7 h-7' /></button>
                        <input type="number" name="page-number" id="page-number" min={1} max={numPages} value={pageNumber} onChange={(e) => goToPage(Number(e.target.value))} className='input w-10 bg-white border border-slate-300 text-center text-slate-900' />
                        <span>/</span>
                        {numPages}
                        <button onClick={() => goToPage(pageNumber + 1)} className='btn btn-square btn-ghost'><ChevronDown className='w-7 h-7' /></button>
                    </p>
                    <button className="btn btn-circle btn-xl fixed bottom-3 right-3 bg-slate-700/50 hover:bg-slate-600/70 text-white p-4 z-20" onClick={() => setVersionWinOpen(!versionWinOpen)}>
                        <History className="w-10 h-10" />
                    </button>
                    <div className={`fixed bottom-20 right-3 p-3 w-80 rounded-xl bg-slate-800 text-slate-100 z-20 ${versionWinOpen ? 'block' : 'hidden'}`}>
                        <ul className="flex gap-5 list-none">
                            <li onClick={() => setVersionMode("draft")} className={`flex-1 text-center active:scale-95 transition-all cursor-pointer ${versionMode === 'draft' ? 'underline' : ''} underline-offset-8`}>Draft</li>
                            <li onClick={() => setVersionMode("submitted")} className={`flex-1 text-center active:scale-95 transition-all cursor-pointer ${versionMode === 'submitted' ? 'underline' : ''} underline-offset-8`}>Submitted</li>
                        </ul>
                        <ul className="mt-3 flex flex-col gap-3 list-none">
                            {
                                versionMode === 'draft' ? (draftVersions.length === 0 ?
                                    <p className="text-center text-slate-300">No draft versions available.</p>
                                    :
                                    draftVersions.map((version, index) => (
                                        <li key={index} onClick={() => gotoVersion(version)} className="p-2 bg-slate-600/50 rounded-md hover:bg-slate-600/70 cursor-pointer">
                                            <div className="flex flex-col justify-center items-start">
                                                <span>Version {version._id}</span>
                                                <span className="text-sm text-slate-300">{new Date(version.createdAt).toLocaleString()}</span>
                                            </div>
                                        </li>
                                    ))
                                ) : (submittedVersions.length === 0 ?
                                    <p className="text-center text-slate-300">No submitted versions available.</p>
                                    : submittedVersions.map((version, index) => (
                                        <li key={index} onClick={() => gotoVersion(version)} className="p-2 bg-slate-600/50 rounded-md hover:bg-slate-600/70 cursor-pointer">
                                            <div className="flex flex-col justify-center items-start">
                                                <span>Version {version._id}</span>
                                                <span className="text-sm text-slate-300">{new Date(version.createdAt).toLocaleString()}</span>
                                            </div>
                                        </li>
                                    ))
                                )
                            }
                        </ul>
                    </div>
                </div>
                ) : (
                <p>Loading PDF...</p>
                )}
            </div>
        </div>
    );
}