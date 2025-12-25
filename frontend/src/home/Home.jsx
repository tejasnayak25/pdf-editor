import { LogOut, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Home() {
    const [ user, setUser ] = useState(() => {
        const userData = localStorage.getItem("user");
        return userData ? JSON.parse(userData) : null;
    });
    const [ cardOpen, setCardOpen ] = useState(false);
    const [ selectedFile, setSelectedFile ] = useState(null);

    const pdfNameRef = useRef();
    const pdfDescRef = useRef();
    const uploadRef = useRef();
    const accessRef = useRef();

    useEffect(() => {
        if (!user) {
            window.location.href = "/login";
            return;
        }
    }, [user]);

    function handleLogout() {
        localStorage.removeItem("user");
        setUser(null);
    }

    function handleFileChange(event) {
        setSelectedFile(event.target.files[0]);
    }

    function handleUpload() {
        let name = pdfNameRef.current.value;
        let description = pdfDescRef.current.value;
        let accessList = accessRef.current.value.split(",").map(email => email.trim()).filter(email => email.length > 0);
        if (!name) {
            alert("Please enter a name for the PDF");
            return;
        }
        if (!selectedFile) {
            alert("Please select a PDF file to upload");
            return;
        }
        let formdata = new FormData();
        formdata.append("name", name);
        formdata.append("description", description);
        formdata.append("file", selectedFile);
        formdata.append("accessList", JSON.stringify(accessList));
        fetch("/api/upload", {
            method: "POST",
            body: formdata
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            alert("PDF uploaded successfully");
            setCardOpen(false);
            pdfNameRef.current.value = "";
            pdfDescRef.current.value = "";
            accessRef.current.value = "";
            setSelectedFile(null);
        })
        .catch(err => {
            console.error(err);
            alert("Error uploading PDF");
        });
    }
    
    return (
        <div className="size-full min-w-full min-h-dvh p-10 text-slate-900 flex flex-col gap-5">
            <header className="flex gap-5 justify-between items-center">
                <h1 className="text-2xl font-bold">PDF Editor</h1>
                <button className=" btn btn-outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </button>
            </header>
            <main className="mt-5 w-full flex-1">
                <p className="mt-5 text-lg">Your PDFs</p>
                <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-5">
                    { user && user.role === "teacher" && (
                        <div onClick={() => setCardOpen(true)} className="card m-4 bg-white text-slate-900 border-2 border-dashed border-slate-500 shadow-xl hover:shadow-2xl cursor-pointer">
                            <div className="card-body flex justify-center items-center flex-col gap-4">
                                <Upload className="h-12 w-12 mx-auto text-slate-500" />
                                <h2 className="card-title">Upload PDF</h2>
                            </div>
                        </div>
                    ) }
                </div>
            </main>

            <div className={`fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center transition-opacity ${cardOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="bg-white text-slate-900 p-6 rounded-lg w-96">
                    <h2 className="text-2xl font-bold mb-4">Upload PDF</h2>
                    <div className="w-full">
                        <label className="label mb-1 mt-4">
                            <span className="label-text">Name:</span>
                        </label>
                        <input ref={pdfNameRef} type="text" placeholder="Enter PDF name" className="input input-bordered w-full bg-slate-200 text-slate-900 autofill:text-slate-900 placeholder:text-slate-500" />
                    </div>
                    <div className="w-full">
                        <label className="label mb-1 mt-4">
                            <span className="label-text">Description: (Optional)</span>
                        </label>
                        <textarea ref={pdfDescRef} placeholder="Enter PDF description" className="textarea textarea-bordered w-full bg-slate-200 text-slate-900 autofill:text-slate-900 placeholder:text-slate-500"></textarea>
                    </div>
                    <div className="w-full flex flex-col">
                        <label className="label mb-1 mt-4">
                            <span className="label-text">Selected File:</span>
                        </label>
                        <button onClick={() => uploadRef.current?.click()} className="btn btn-outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                        </button>
                        <input ref={uploadRef} onChange={handleFileChange} type="file" accept="application/pdf" className="hidden" />
                        <p className="mt-1 text-slate-700 italic">{ selectedFile?.name || "No file selected" }</p>
                    </div>
                    <div className="w-full">
                        <label className="label mb-1 mt-4">
                            <span className="label-text">Allow access to:</span>
                        </label>
                        <textarea ref={accessRef} placeholder="Enter emails separated by commas" className="textarea textarea-bordered w-full bg-slate-200 text-slate-900 autofill:text-slate-900 placeholder:text-slate-500"></textarea>
                    </div>
                    <div className="flex justify-end gap-4 mt-5">
                        <button onClick={() => setCardOpen(false)} className="btn btn-outline">Cancel</button>
                        <button onClick={handleUpload} className="btn btn-primary">Upload</button>
                    </div>
                </div>
            </div>
        </div>
    )
}