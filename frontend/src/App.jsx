import React from 'react'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { routes } from './routes/AppRoutes'
const App = () => {
  return <RouterProvider router={routes}/>
}

export default App
