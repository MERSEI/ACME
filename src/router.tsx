import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import { RoomsPage } from '@/features/rooms/RoomsPage'
import { FolderPage } from '@/features/browser/FolderPage'
import { NotFound } from '@/components/NotFound'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <RoomsPage /> },
      { path: '/room/:roomId', element: <FolderPage /> },
      { path: '/room/:roomId/folder/:folderId', element: <FolderPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
