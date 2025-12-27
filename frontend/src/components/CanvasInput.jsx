import { useEffect } from "react";

export default function CanvasInput({ id, page, type, rect, value, onValueChange, readonly }) {
    useEffect(() => {
        const canvas = document.getElementById(id);
        if (!canvas || !rect) return;

        const ctx = canvas.getContext("2d");

        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (value) {
            const img = new Image();
            img.src = value;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
        }

        canvas.style.pointerEvents = readonly ? "none" : "auto";

        let isDrawing = false;

        function getPos(e) {
            const r = canvas.getBoundingClientRect();
            return {
                x: e.clientX - r.left,
                y: e.clientY - r.top
            };
        }

        function onMouseDown(e) {
            if (readonly) return;

            const { x, y } = getPos(e);
            isDrawing = true;

            ctx.beginPath();
            ctx.moveTo(x, y);
        }

        function onMouseMove(e) {
            if (!isDrawing || readonly) return;

            const { x, y } = getPos(e);

            ctx.lineTo(x, y);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }

        function onMouseUp() {
            if (!isDrawing) return;
            isDrawing = false;

            const dataUrl = canvas.toDataURL();
            console.log("Canvas data URL:", dataUrl);
            onValueChange(page, id, dataUrl);
        }

        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, [id, rect, value, readonly, page, onValueChange]);

    return (
        <canvas
            id={id}
            className={`absolute border border-slate-300 rounded bg-white/50 item-${type}`}
            style={{
                top: rect?.top + "px",
                left: rect?.left + "px",
                width: rect?.width + "px",
                height: rect?.height + "px"
            }}
        />
    );
}
