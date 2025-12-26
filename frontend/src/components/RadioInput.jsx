import { memo } from 'react';

function RadioInput({ id, page, type, fontSize, layout, rect, options, selectedValue, onValueChange, readonly }) {
    let radio_name = `radio-group-${id}`;
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
                        {readonly ? (
                            <input
                                type={type}
                                name={radio_name}
                                className="radio radio-primary"
                                value={option}
                                checked={selectedValue === option}
                                onChange={() => onValueChange(page, id, option)} />
                        ) : (
                            <input
                                type={type}
                                name={radio_name}
                                className="radio radio-primary"
                                value={option}
                                defaultChecked={selectedValue === option}
                                onChange={() => onValueChange(page, id, option)} />
                        )}
                        <span style={{ fontSize: fontSize + 'px' }}>{option}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}

export default memo(RadioInput);