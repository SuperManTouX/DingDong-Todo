import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import './currentCSS.css'

// import App from './App.tsx'
// import TaskApp from "./TaskApp";
import TODOList from "./TODOList";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*<App />*/}
    {/*  <TaskApp></TaskApp>*/}
      <TODOList></TODOList>
  </StrictMode>,
)
