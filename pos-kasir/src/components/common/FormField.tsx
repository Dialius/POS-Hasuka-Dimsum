import React from 'react'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select'
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  error?: string
  required?: boolean
  disabled?: boolean
  hint?: string
  placeholder?: string
  options?: { value: string | number; label: string }[]
  rows?: number
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  disabled,
  hint,
  placeholder,
  options,
  rows = 3
}: FormFieldProps) {
  const baseInputClass = `w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block mb-2 font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          className={baseInputClass}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseInputClass}
        >
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={baseInputClass}
        />
      )}

      {hint && !error && (
        <p className="mt-1 text-sm text-gray-500">{hint}</p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
