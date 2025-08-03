import { Mail, User, Lock, Tag, FileText } from "lucide-react"
import type { StepConfig } from "@/types/signup"

import { 
  EmailStep, 
  validateEmailStep,
  ProfileStep, 
  validateProfileStep,
  PasswordStep, 
  validatePasswordStep,
  CategoryStep, 
  validateCategoryStep,
  TermsStep, 
  validateTermsStep 
} from "@/components/auth/steps"

export const signupSteps: StepConfig[] = [
  {
    id: "email",
    title: "Email",
    description: "Your email address",
    icon: Mail,
    component: EmailStep,
    validate: validateEmailStep,
  },
  {
    id: "profile",
    title: "Profile",
    description: "User information",
    icon: User,
    component: ProfileStep,
    validate: validateProfileStep,
  },
  {
    id: "password",
    title: "Password",
    description: "Security setup",
    icon: Lock,
    component: PasswordStep,
    validate: validatePasswordStep,
  },
  {
    id: "category",
    title: "Category",
    description: "Account type",
    icon: Tag,
    component: CategoryStep,
    validate: validateCategoryStep,
  },
  {
    id: "terms",
    title: "Terms",
    description: "Finalize",
    icon: FileText,
    component: TermsStep,
    validate: validateTermsStep,
  },
]