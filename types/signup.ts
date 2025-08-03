// types/signup.ts
export interface StepProps {
  formData: any
  errors: any
  isLoading: boolean
  onFieldChange: (field: string, value: any) => void
  onAction?: (action: string, data?: any) => void
}

export interface StepConfig {
  id: string
  title: string
  description: string
  icon: any
  component: React.ComponentType<StepProps>
  validate: (formData: any) => Record<string, string>
}