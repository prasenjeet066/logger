import { useState } from "react"
interface SuperAccess {
  role: 'admin' | 'context' | 'moderator';
  createdAt: Date | null;
  expireAt: Date | null;
  verificationWays: {
    emailOtp: boolean;
    phoneOtp: boolean;
    fingerPrint: boolean;
  };
}
export function SuperAccessSettings({ user }) {
  
  const [superAccess, UpdateSuperAccess] = useState < SuperAccess > ({
    role: 'context',
    verificationWays: {
      emailOtp: true
    }
  })
  const sendReq = async () => {
    const fetchData = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(superAccess),
    })
    if (fetchData.ok) {
      alert('Done')
    }else{
      alert('error'
      )
    }
  }
  
  return (
    <div>
      <button onClick = {sendReq()}>
        Click For Super Access 
        </button>
    </div>
  )
}