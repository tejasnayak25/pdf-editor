import { Delete, Link, LogOut, Trash, Trash2, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Home() {
    const [ user, setUser ] = useState(() => {
        const userData = localStorage.getItem("user");
        return userData ? JSON.parse(userData) : null;
    });
    const [ cardOpen, setCardOpen ] = useState(false);
    const [ selectedFile, setSelectedFile ] = useState(null);
    const [ pdfs, setPdfs ] = useState([]);

    const pdfNameRef = useRef();
    const pdfDescRef = useRef();
    const uploadRef = useRef();
    const accessRef = useRef();

    function refreshPdfs() {
        fetch(`/api/user/${user.email}`)
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    console.log("User data fetched:", data.user);
                    setPdfs(data.user.pdfs || []);
                } else {
                    setPdfs([]);
                }
            })
            .catch(err => {
                console.error("Error fetching user data:", err);
            });
    }

    useEffect(() => {
        if (!user) {
            window.location.href = "/login";
            return;
        } else {
            fetch(`/api/user/${user.email}`)
                .then(res => res.json())
                .then(data => {
                    if(data.success) {
                        console.log("User data fetched:", data.user);
                        setPdfs(data.user.pdfs || []);
                    } else {
                        setPdfs([]);
                    }
                })
                .catch(err => {
                    console.error("Error fetching user data:", err);
                });
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
        formdata.append("createdBy", user.email);

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
            refreshPdfs();
        })
        .catch(err => {
            console.error(err);
            alert("Error uploading PDF");
        });
    }

    function handleDelete(pdfId, path) {
        if(window.confirm("Are you sure you want to delete this PDF? This action cannot be undone.")) {
            fetch("/api/delete-pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: pdfId,
                    path: path,
                    email: user.email
                })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    alert("PDF deleted successfully");
                    setPdfs(prevPdfs => prevPdfs.filter(pdf => pdf._id !== pdfId));
                } else {
                    alert("Error deleting PDF: " + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Error deleting PDF");
            });
        }
    }
    
    const isTeacher = user?.role === "teacher";
    const hasPdfs = pdfs.length > 0;

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

                { !hasPdfs && !isTeacher && (<p className="m-4 text-slate-700 italic">No PDFs found.</p> )}
                { (hasPdfs || isTeacher) && (
                    <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-1 gap-5">
                        { isTeacher && (
                            <div onClick={() => setCardOpen(true)} className="card m-4 bg-white text-slate-900 border-2 border-dashed border-slate-500 shadow-xl hover:shadow-2xl cursor-pointer">
                                <div className="card-body flex justify-center items-center flex-col gap-4">
                                    <Upload className="h-12 w-12 mx-auto text-slate-500" />
                                    <h2 className="card-title">Upload PDF</h2>
                                </div>
                            </div>
                        ) }
                        { pdfs.map((pdf, index) => (
                            <div key={index} className="card m-4 bg-white text-slate-900 shadow-xl hover:shadow-2xl">
                                <div className="card-body">
                                    <a href={`/pdfs/${pdf._id}/view`} target="_blank" rel="noreferrer" className="card-title flex items-center gap-2 hover:underline">{pdf.name} <Link className="w-4 h-4" /></a>
                                    <p className="text-slate-700">{pdf.description || "No description provided."}</p>
                                    <p className="text-slate-700 text-sm">{pdf.createdAt ? new Date(pdf.createdAt).toLocaleString() : ""}</p>
                                    <div className="card-actions flex justify-end gap-2 items-center mt-2">
                                        <a href={`/pdfs/${pdf._id}/submissions`} target="_blank" rel="noreferrer" className="btn btn-primary">View Submissions</a>
                                        { isTeacher && (
                                            <a href={`/pdfs/${pdf._id}/edit`} className="btn btn-outline">Edit</a>
                                        ) }
                                        { isTeacher && (
                                            <button onClick={() => handleDelete(pdf._id, pdf.file.path)} className="btn btn-square btn-error"><Trash2 className="w-4 h-4" /></button>
                                        ) }
                                    </div>
                                </div>
                            </div>
                        )) }
                    </div>
                ) }
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