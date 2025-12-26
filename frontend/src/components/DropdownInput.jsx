export default function DropdownInput({ id, page, type, fontSize, rect, options, value, onValueChange, readonly }) {
    return (
        readonly ? (
            <select
                className="absolute border border-slate-300 rounded px-2 py-1 bg-white"
                style={{
                    fontSize: fontSize + 'px',
                    top: rect?.top + 'px',
                    left: rect?.left + 'px',
                    width: rect?.width + 'px',
                    height: rect?.height + 'px',
                }}
                value={value} disabled>
                    {options.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                    ))}
                </select>
        ) : (
            <select
                className={`absolute border border-slate-300 rounded px-2 py-1 bg-white item-${type}`}
                style={{
                    fontSize: fontSize + 'px',
                    top: rect?.top + 'px',
                    left: rect?.left + 'px',
                    width: rect?.width + 'px',
                    height: rect?.height + 'px',
                }}
                value={value}
                onChange={(e) => onValueChange(page, id, e.target.value)} >
                {options.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                ))}
            </select>
        )
    );
}