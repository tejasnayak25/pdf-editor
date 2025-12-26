import { useEffect, useState } from "react";
import { getPdf } from "./utils";
import { useParams } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";

export default function PdfSubmissions() {
    const { pdf: pdfId } = useParams();
    const [pdf, setPdf] = useState(null);
    const [ user ] = useState(() => {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    });
    const [ submissions, setSubmissions ] = useState([]);

    const userEmail = user?.email;

    function fetchSubmissions() {
        fetch(`/api/pdfs/${pdfId}/get-submissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ creator: userEmail }),
        }).then(res => res.json())
        .then(data => {
            setSubmissions(data.submissions);
        })
        .catch(err => {
            console.error("Error fetching submissions:", err);
        });
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
                fetchSubmissions();
            })
            .catch(err => {
              console.error("Error fetching PDF:", err);
              setPdf(null);
            });
    }, [pdfId, userEmail]);
    return (
        <div className='text-slate-900 flex justify-center items-center size-full'>
            {
                (!pdf) && (
                    <div className='text-slate-900 bg-slate-100 flex justify-center items-center size-full h-dvh z-30 fixed top-0 left-0'>
                        <Loader2 className="w-12 h-12 animate-spin" />
                    </div>
                )
            }
            {pdf ? (
                <div className="w-full h-dvh flex flex-col">
                    <header className='w-full text-slate-900 px-4 py-5 rounded-sm text-lg pointer-events-none flex gap-4 items-center justify-between'>
                        <div className='flex gap-4 items-center'>
                            <button className='btn btn-ghost btn-square' onClick={() => window.location.href = "/"}>
                            <ChevronLeft className='w-7 h-7 pointer-events-auto' />
                            </button> 
                            {pdf.name}
                        </div>
                    </header>
                    <p className=" px-10 py-5 text-lg font-semibold">Submissions</p>
                    {submissions.length === 0 ? (
                        <p className="px-10">No submissions found.</p>
                    ) : (
                        <div className="px-10">
                            <table className="table-auto w-full border-collapse border border-slate-600">
                                <thead>
                                    <tr>
                                        <th className="border border-slate-500 bg-slate-300 px-4 py-2">Student Email</th>
                                        <th className="border border-slate-500 bg-slate-300 px-4 py-2">Submitted At</th>
                                        <th className="border border-slate-500 bg-slate-300 px-4 py-2">View Submission</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((submission) => (
                                        <tr key={submission._id}>
                                            <td className="border border-slate-500 px-4 py-2 text-center">{submission.createdBy}</td>
                                            <td className="border border-slate-500 px-4 py-2 text-center">{new Date(submission.createdAt).toLocaleString()}</td>
                                            <td className="border border-slate-500 px-4 py-2 text-center">
                                                <a href={`/pdfs/${pdfId}/submissions/${submission._id}`} className="text-blue-600 hover:underline">View</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )
            : (
                <p>Loading PDF...</p>
            )}
        </div>
    );
}