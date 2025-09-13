import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
// import './index.css'
import './currentCSS.css'
import '@ant-design/v5-patch-for-react-19';
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
        {/*<Test></Test>*/}
        {/*<Drag></Drag>*/}
    </StrictMode>,
)
