import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AccountSettings({ userData }) {
  return (
    <div className="p-2">
      <div className="w-full m-4 rounded-lg bg-indigo-100 flex items-center justify-between p-4 gap-4">
        <Avatar className="w-24 h-24 -mt-12 border-4 border-white cursor-pointer">
          <AvatarImage src={userData.avatarUrl} alt={userData.displayName} />
          <AvatarFallback className="text-2xl">
            {userData.displayName?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <span className="font-semibold text-md border-b pb-2">
            {userData.displayName}
          </span>
          <button
            className="
              flex w-full bg-indigo-600 text-white rounded-full px-4 py-2 mt-2
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
              transition-colors duration-200
            "
          >
            Edit Now
          </button>
        </div>
      </div>
    </div>
  )
}