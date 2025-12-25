import { useRef } from "react"

export default function Login() {
    let emailRef = useRef();
    let passwordRef = useRef();
    let roleRef = useRef("select");
    function handleLogin() {
        let email = emailRef.current.value;
        let password = passwordRef.current.value;
        let role = roleRef.current.value;
        if (role === "select") {
            alert("Please select a role to login");
            return;
        }
        let user = { email, role, password };
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "/";
    }
    return (
        <div className="size-full min-w-full min-h-dvh flex justify-center items-center">
            <div className="card w-96 bg-white text-slate-900 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl justify-center">Login</h2>
                    <div className="w-full">
                        <label className="label">
                            <span className="label-text">Login as</span>
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
                    <div className="w-full flex justify-center mt-6">
                        <button onClick={handleLogin} className="btn btn-primary px-10">Login</button>
                    </div>
                </div>
            </div>
        </div>
    )
}