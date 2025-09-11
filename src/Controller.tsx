

// @ts-ignore
enum ShowType {
    all = 'all',
    completed = 'completed',
    uncompleted = 'uncompleted'
}
export default function Controller({onSwitchShow,onCompleteAll,isAllDone,}:ControllerProps) {
    return (

        <li className='gap-3 d-flex'>
            <input type="checkbox" checked={isAllDone} onChange={(e)=> onCompleteAll({type: 'completeAll', completeOrUncomplete: e.target.checked})
            }/>
            <button type="button" onClick={() => {

                onSwitchShow(ShowType.all)
            }} className="btn btn-primary btn-sm">所有
            </button>
            <button type="button" onClick={() => {
                onSwitchShow(ShowType.uncompleted)
            }} className="btn btn-primary btn-sm">未完成
            </button>
            <button type="button" onClick={() => {
                onSwitchShow(ShowType.completed)
            }} className="btn btn-primary btn-sm">已完成
            </button>
        </li>
    );
}