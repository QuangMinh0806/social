import { forwardRef } from 'react';
import { Check } from 'lucide-react';

const Checkbox = forwardRef(({
    id,
    checked = false,
    onChange,
    disabled = false,
    label,
    description,
    className = '',
    size = 'md',
    ...props
}, ref) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const checkIconSizes = {
        sm: 12,
        md: 16,
        lg: 20
    };

    return (
        <div className={`flex items-start ${className}`}>
            <div className="relative">
                <input
                    ref={ref}
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="sr-only"
                    {...props}
                />
                <div
                    className={`
            ${sizeClasses[size]}
            border-2 rounded-md cursor-pointer transition-all duration-200
            ${checked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }
            ${disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:shadow-sm'
                        }
            flex items-center justify-center
          `}
                    onClick={() => !disabled && onChange && onChange({ target: { checked: !checked } })}
                >
                    {checked && (
                        <Check
                            size={checkIconSizes[size]}
                            className="text-white"
                            strokeWidth={3}
                        />
                    )}
                </div>
            </div>

            {(label || description) && (
                <div className="ml-3 flex-1">
                    {label && (
                        <label
                            htmlFor={id}
                            className={`
                block text-sm font-medium text-gray-900 cursor-pointer
                ${disabled ? 'opacity-50' : ''}
              `}
                        >
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className={`text-sm text-gray-500 ${disabled ? 'opacity-50' : ''}`}>
                            {description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;