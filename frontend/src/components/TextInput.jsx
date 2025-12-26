import { memo } from 'react';

function TextInput({ id, page, type, fontSize, rect, placeholder, value, onValueChange, readonly }) {
    return (
        <input
            type={type}
            defaultValue={value}
            readOnly={readonly}
            onChange={(e) => onValueChange(page, id, e.target.value)}
            placeholder={placeholder}
            className={`border border-slate-300 rounded px-2 py-1 ${readonly ? "focus:outline-none" : "focus:outline-none focus:ring-2 focus:ring-blue-500"} absolute`}
            style={{
                fontSize: fontSize + 'px',
                top: rect?.top + 'px',
                left: rect?.left + 'px',
                width: rect?.width + 'px',
                height: rect?.height + 'px',
            }}
        />
    );
}

export default memo(TextInput);