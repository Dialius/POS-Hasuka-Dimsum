import { useState } from 'react'

interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: Record<keyof T, (value: any) => string | true>
  onSubmit: (values: T) => void | Promise<void>
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (fieldName?: keyof T): boolean => {
    if (!validationSchema) return true

    const newErrors: Partial<Record<keyof T, string>> = {}
    const fields = fieldName ? [fieldName] : (Object.keys(validationSchema) as Array<keyof T>)

    fields.forEach(field => {
      const validator = validationSchema[field]
      if (validator) {
        const result = validator(values[field])
        if (result !== true) {
          newErrors[field] = result
        }
      }
    })

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const fieldName = name as keyof T
    
    setValues(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))

    // Clear error on change
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const setFieldValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
  }

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setFieldValue
  }
}
