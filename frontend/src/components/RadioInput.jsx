export default function RadioInput({ type, fontSize, layout, rect, options, selectedValue, onChange }) {
    return (
        <div
            className="absolute border border-slate-300 rounded px-2 py-1 bg-white"
            style={{
                top: rect?.top + 'px',
                left: rect?.left + 'px',
                width: rect?.width + 'px',
                height: rect?.height + 'px',
            }}
        >
            <div className={`flex ${layout === 'horizontal' ? 'flex-row' : 'flex-col'} gap-2`}>
                {options.map((option, index) => (
                    <label key={index} className="flex items-center gap-2">
                        <input
                            type={type}
                            name="radio-group"
                            value={option.value}
                            defaultChecked={selectedValue === option.value}
                            onChange={onChange} />
                        <span style={{ fontSize: fontSize + 'px' }}>{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}