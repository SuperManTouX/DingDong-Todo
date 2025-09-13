// @ts-ignore
import {ControllerProps} from "@/types";
import {ShowType, ShowTypeLabels, type ShowTypeValue} from "@/constants";
import {Dropdown} from "react-bootstrap";

export default function Controller({onSwitchShow, onCompleteAll, isAllDone, showType}: ControllerProps) {
    return (

        <li className=' rounded p-1 gap-3 d-flex justify-content-between'>
            <span>
                <input className="me-2" type="checkbox" checked={isAllDone}
                       onChange={(e) => onCompleteAll({type: 'completedAll', completeOrUncomplete: e.target.checked})
                       }/>

                <Dropdown className="d-inline-block" onSelect={(eventKey,) => {
                    onSwitchShow(Number(eventKey) as ShowTypeValue)

                }}>
                                        <Dropdown.Toggle variant="primary" id="dropdown-basic">
                                            {
                                                ShowTypeLabels[showType]
                                            }
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            {Object.values(ShowType).map((value) => {
                                                return <Dropdown.Item key={value}
                                                                      eventKey={value}>{ShowTypeLabels[Number(value)]}</Dropdown.Item>
                                            })}

                                        </Dropdown.Menu>
                                    </Dropdown>
            </span>

        </li>
    );
}