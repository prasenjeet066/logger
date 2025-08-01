import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"



export default function PrivacyAndPersonalSettings() {
  const activeFormActions = [
  {
    label: 'You can lock your account',
    id: 'lock_profile',
    default: false
  },
  {
    
    label: 'Hide following list from all',
    id: 'hide_following_list',
    default: false
    
  },
  {
    
    label: 'Anyone can send massage ',
    id: 'public_send_massage',
    default: true
    
  }]
  return (
    <>
      <div className = 'p-2'>
        <div className = 'flex flex-col gap-4 border-b'>
          {
            activeFormActions.map((ac)=>(
              <div className="flex items-center space-x-2">
                <Label htmlFor={ac.id}>{ac.label}</Label>
      <Switch id={ac.id} />
    </div>
            ))
          }
        </div>
      </div>
          
    </>
  )
}