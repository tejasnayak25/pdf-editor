import { memo } from 'react';

function CheckboxInput({ id, page, type, fontSize, layout, rect, options, isChecked, onValueChange, readonly }) {
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
            <div className={`flex ${layout === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'} gap-2`}>
                {options.map((option, index) => (
                    <label key={index} className="flex items-center gap-2">
                        {readonly ? (<input
                            type={type}
                            name={checkbox_name}
                            className="checkbox checkbox-primary"
                            value={option}
                            checked={isChecked.includes(option)} />
                        ) : (
                        <input
                            type={type}
                            name={checkbox_name}
                            className="checkbox checkbox-primary"
                            value={option}
                            defaultChecked={isChecked.includes(option)}
                            onChange={(e) => {
                                const next = e.target.checked
                                    ? [...isChecked, option]
                                    : isChecked.filter(opt => opt !== option);
                                onValueChange(page, id, next);
                            }} />
                        )}
                        <span style={{ fontSize: fontSize + 'px' }}>{option}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}

export default memo(CheckboxInput);