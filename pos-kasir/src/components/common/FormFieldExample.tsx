import FormField from './FormField'
import { useForm } from '../../hooks/useForm'

interface ExampleFormData {
  name: string
  email: string
  age: number
  bio: string
  role: string
}

export default function FormFieldExample() {
  const { values, errors, handleChange, handleSubmit, reset } = useForm<ExampleFormData>({
    initialValues: {
      name: '',
      email: '',
      age: 0,
      bio: '',
      role: 'user'
    },
    validationSchema: {
      name: (value) => value.trim() ? true : 'Name required',
      email: (value) => /\S+@\S+\.\S+/.test(value) ? true : 'Valid email required',
      age: (value) => value > 0 ? true : 'Age must be positive',
      bio: () => true,
      role: () => true
    },
    onSubmit: (data) => {
      console.log('Form submitted:', data)
      alert('Form valid! Check console.')
    }
  })

  return (
    <div className="max-w-md mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Form Example</h2>
      
      <form onSubmit={handleSubmit}>
        <FormField
          label="Name"
          name="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="Enter your name"
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
          hint="We'll never share your email"
        />

        <FormField
          label="Age"
          name="age"
          type="number"
          value={values.age}
          onChange={handleChange}
          error={errors.age}
          required
        />

        <FormField
          label="Bio"
          name="bio"
          type="textarea"
          value={values.bio}
          onChange={handleChange}
          rows={4}
          hint="Tell us about yourself"
        />

        <FormField
          label="Role"
          name="role"
          type="select"
          value={values.role}
          onChange={handleChange}
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
            { value: 'moderator', label: 'Moderator' }
          ]}
        />

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}
