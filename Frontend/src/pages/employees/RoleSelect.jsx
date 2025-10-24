import React from 'react';
import { useAuthStore } from '../../stores/authStore.js';

const RoleSelect = ({ name, value, onChange, className = '' }) => {
    const getAvailableRoles = useAuthStore(state => state.getAvailableRoles);
    const currentUser = useAuthStore(state => state.user);

    const available = getAvailableRoles ? getAvailableRoles() : [];

    // Ensure the currently selected value is included even if it's above current user's level
    const ensureIncludes = (list, val) => {
        if (!val) return list;
        const exists = list.find(r => r.value === val);
        if (exists) return list;
        // If the current value is higher, include it but mark as readonly label
        return [
            { value: val, label: val.charAt(0).toUpperCase() + val.slice(1) },
            ...list
        ];
    }

    const options = ensureIncludes(available, value);

    return (
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${className}`}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

export default RoleSelect;