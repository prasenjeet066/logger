import { useState, useEffect } from 'react'

interface Store {
  storeName: string;
  _store: string[];
}
interface Bookmarks {
  userId: string;
  store: Store[] | null;
}
interface BookmarksProps {
  datas ? : Bookmarks
  user: any
}
const Bookmarks = ({ datas, user }: BookmarksProps) => {
  const [bookmarks, setBookmarks] = useState < Bookmarks | [] > ([])
  useEffect(() => {
    if (datas.length) {
      setBookmarks(datas)
    }
  }, [datas])
  const handleNewCollection = async () => {
    
  }
  return (
    <div>
      <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-start items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Saved</h1>

        </div>
      </div>
      {
        bookmarks.store === null ? (<div className = 'p-4 h-full w-full flex items-center justify-center'>
          <span>Not have any collection</span>
          <button onClick={()=>{handleNewCollection()}} className='rounded-full outline-none p-2 px-4 bg-gray-800 text-white'>
            {"Add Collection"}
          </button>
        </div>) : (<div>
          
        </div>)
      }
      </div>
    </div>
  )
}

export default Bookmarks;