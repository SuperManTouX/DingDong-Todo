// @ts-ignore
import {ControllerProps} from "@/types";
import {ShowType} from "@/constants";

export default function Controller({onSwitchShow, onCompleteAll, isAllDone,}: ControllerProps) {
    return (

        <li className=' rounded p-1 gap-3 d-flex justify-content-between'>
            <span>
                <input className="me-2" type="checkbox" checked={isAllDone}
                       onChange={(e) => onCompleteAll({type: 'completedAll', completeOrUncomplete: e.target.checked})
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
            </span>

        </li>
    );
}