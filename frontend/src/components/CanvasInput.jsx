import { useEffect } from "react";

export default function CanvasInput({ id, page, type, rect, value, onValueChange, readonly }) {
    useEffect(() => {
        const canvas = document.getElementById(id);
        if(canvas) {
            canvas.width = rect?.width;
            canvas.height = rect?.height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if(value) {
                const img = new Image();
                img.src = value;
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
            }
            canvas.style.pointerEvents = readonly ? 'none' : 'auto';
            
            function handleDraw(e) {
                if(!readonly) {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                    const dataUrl = canvas.toDataURL();
                    onValueChange(page, id, dataUrl);
                }
            }

            canvas.addEventListener('mousedown', (e) => {
                if(!readonly) {
                    handleDraw(e);
                    function onMouseMove(ev) {
                        handleDraw(ev);
                    }
                    function onMouseUp() {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    }
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                }
            });

            return () => {
                canvas.removeEventListener('mousedown', handleDraw);
            };
        }
    }, [id, value, rect, readonly]);
    
    return (
        <canvas
            id={id}
            className={`absolute border border-slate-300 rounded bg-white/50 item-${type}`}
            style={{
                top: rect?.top + 'px',
                left: rect?.left + 'px',
                width: rect?.width + 'px',
                height: rect?.height + 'px',
            }}
        >
        </canvas>
    );
}