export default function CheckboxInput({ id, type, fontSize, layout, rect, options, isChecked, onChange }) {
    let checkbox_name = `checkbox-group-${id}`;
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
                            name={checkbox_name}
                            className="checkbox checkbox-primary"
                            value={option}
                            defaultChecked={isChecked.includes(option)}
                            onChange={onChange} />
                        <span style={{ fontSize: fontSize + 'px' }}>{option}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}