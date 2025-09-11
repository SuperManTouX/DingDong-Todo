import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
// import './index.css'
import './currentCSS.css'

// import App from './TicTacToe.tsx'
// import TaskApp from "./TaskApp";
// import TODOListOriginal from "./TODOListOriginal";
import TODOList from "./TODOList";


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/*<App />*/}
        {/*  <TaskApp></TaskApp>*/}
        {/*  <TODOListOriginal></TODOListOriginal>*/}
        <TODOList></TODOList>
        {/*<Drag></Drag>*/}
    </StrictMode>,
)
