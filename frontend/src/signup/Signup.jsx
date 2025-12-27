import { useRef } from "react"

export default function Signup() {
    let emailRef = useRef();
    let passwordRef = useRef();
    let roleRef = useRef("select");
    function handleSignup() {
        let email = emailRef.current.value;
        let password = passwordRef.current.value;
        let role = roleRef.current.value;
        if (role === "select") {
            alert("Please select a role to signup");
            return;
        }
        let user = { email, role, password };
        
        fetch("http://localhost:4000/api/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        }).then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = "/login";
            } else {
                alert("Signup failed");
            }
        }).catch(() => {
            alert("Signup failed");
        });
    }
    return (
        <div className="size-full min-w-full min-h-dvh flex justify-center items-center">
            <div className="card w-96 bg-white text-slate-900 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl justify-center">Create Account</h2>
                    <div className="w-full">
                        <label className="label">
                            <span className="label-text">Singup as</span>
                        </label>
                        <select ref={roleRef} defaultValue={"select"} className="select select-bordered w-full bg-slate-200 text-slate-900">
                            <option value={"select"} disabled>Select Role</option>
                            <option value={"teacher"}>Teacher</option>
                            <option value={"student"}>Student</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="label">
                            <span className="label-text">Email</span>
                        </label>
                        <input ref={emailRef} type="text" placeholder="abc@xyz.com" className="input input-bordered w-full bg-slate-200 text-slate-900 autofill:text-slate-900 placeholder:text-slate-500" />
                    </div>
                    <div className="w-full">
                        <label className="label">
                            <span className="label-text">Password</span>
                        </label>
                        <input ref={passwordRef} type="password" placeholder="******" className="input input-bordered w-full bg-slate-200 text-slate-900 autofill:text-slate-900 placeholder:text-slate-500" />
                    </div>
                    <div className="w-full flex justify-center items-center flex-col gap-5 mt-6">
                        <button onClick={handleSignup} className="btn btn-primary px-10">Signup</button>
                        <a href="/login" className="link px-10">Already have an account?</a>
                    </div>
                </div>
            </div>
        </div>
    )
}