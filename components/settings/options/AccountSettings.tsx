import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AccountSettings({userData}) {
  return (
    <>
      <div className = 'p-2'>
        <div className = 'w-full m-4 rounded-lg bg-indigo-100 flex flex-row items-center justify-between p-4 gap-4'>
          <div>
             <Avatar className="w-24 h-24 -mt-12 border-4 border-white cursor-pointer" >
                    <AvatarImage src={userData.avatarUrl} />
                    <AvatarFallback className="text-2xl">
                      {userData.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
          </div>
          <div className='flex flex-col flex-1'>
            <span className='font-semibold text-md border-b pb-2'>
              {userData.displayName}
            </span>
            <button className = 'flex w-full bg-indigo-600 text-white rounded-full px-4'>
              {"Edit Now"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
