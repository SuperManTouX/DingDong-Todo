import React, {useState} from 'react'
import './App.css'
import './bootstrap.css'
import {JSX} from "react/v18/ts5.0";

//1. 仅针对当前着手，显示“You are at move #…”而不是按钮。
//（完成）2. 重写 Board 以使用两个循环来制作方块而不是对它们进行硬编码。
//（完成）3. 添加一个切换按钮，使可以按升序或降序对落子的步数进行排序。
//（完成）4. 当有人获胜时，突出显示致使获胜的三个方块（当没有人获胜时，显示一条关于结果为平局的消息）。
//（完成）5. 在“落子”的历史列表中以 (row, col) 格式显示每步的位置。
type ChestArr = number[9]
type HistoryItem = {
    chest: number[9],
    position: string
}
type SquareProps = {
    content: string,
    onSquareClick: () => void,
    winnerGrid: boolean
}
type BoardProps = {
    chestArr: ChestArr,
    xIsNext: boolean,
    onPlay: (newHistoryItem) => void,
    winnerArr: number[3]
}

function Square({content, onSquareClick, winnerGrid}: SquareProps): JSX.Element {
    return (
        <li onClick={onSquareClick} className={"square " + `${winnerGrid ? 'heightLight' : ''}`}>{content}</li>
    )
}

function Board({chestArr, xIsNext, onPlay, winnerArr}: BoardProps): JSX.Element {
    //赢家棋序
    const winner: number[] = chestArr[winnerArr?.[0]]
    //查找是否有空棋子位
    const noneVacancy: boolean = chestArr.findIndex((item) => {
        return item === null
    }) === -1
    let status: string
    if (winner) {
        status = '胜者是' + winner
    } else {
        //平局显示平局
        if (noneVacancy) {
            status = '平局'
        } else {
            status = (xIsNext ? 'X' : 'O') + '方行动'

        }

    }

    function handleClick(i: number, j: number) {
        //点击的格子已经下过棋子，则退出点击事件
        if (chestArr[j] || winner) {
            return
        }
        //复制新的棋盘
        let newChest: ChestArr = chestArr.slice()
        newChest[j] = xIsNext ? 'X' : 'O'
        let newHistoryItem: HistoryItem = {chest: newChest, position: `(${i + 1},${j - i * 3 + 1})`}
        onPlay(newHistoryItem)
    }

    let boardRowList: JSX.Element = []

    for (let i = 0; i < 3; i++) {
        let boardItemList: JSX.Element = []
        for (let j = i * 3; j < i * 3 + 3; j++) {
            let isWinnerGrid
            //检查是否有赢家
            if (winner) {
                isWinnerGrid = winnerArr?.findIndex((item) => item == j) != -1 && winnerArr?.findIndex((item) => item == j) != undefined
            }
            boardItemList.push(<Square winnerGrid={isWinnerGrid} key={j} content={chestArr[j]}
                                       onSquareClick={() => handleClick(i, j)}/>)

        }
        boardRowList.push(<ul key={i + 'i'} className="board-row aic">{boardItemList}</ul>)

    }


    return (
        <div className="container gy-5">
            <div>{status}</div>
            {boardRowList}
        </div>

    )
}


export default function Game(): JSX.Element {
    let [history, setHistory] = useState<HistoryItem[]>([{chest: Array(9).fill(null), position: ''}])
    let [count, setCount] = useState<number>(history.length - 1)
    let [historyList, setHistoryList] = useState<JSX.Element>([])

    let winnerArr: number[] | null = calculateWinner(history[count].chest)
    //计算属性？每次更新页面自动计算
    let xIsNext: boolean = count % 2 !== 0
    //是升序排序吗
    // let isAsc: boolean = false


    function handlePlay(newHistoryItem) {
        let newHistory: HistoryItem[] = [...history.slice(0, count + 1), newHistoryItem]
        setHistory(newHistory)
        setCount(newHistory.length - 1)
        // 初始化棋子历史
        let computeHistoryList: JSX.Element = history.map((item, index) => {
                let description: string = "Let the game start"
                if (index > 0) {
                    description = 'Go to ' + item.position + (index % 2 !== 0 ? 'X' : 'O') + '方行动'
                }
                return <li key={index}>
                    <button onClick={() => jumpTo(index)} type="button" className="btn btn-primary">{description}</button>
                </li>

            }
        )
        setHistoryList(computeHistoryList)
    }

    function jumpTo(index) {
        setCount(index)
        winnerArr = []
    }

    function reverseHistoryList() {

        setHistoryList(historyList.slice().reverse())
    }


    return (

        <div>
            <div>
                <Board chestArr={history[count]?.chest} xIsNext={xIsNext} onPlay={handlePlay} winnerArr={winnerArr}/>
            </div>
            <div>
                <ul>
                    <button onClick={reverseHistoryList} type="button" className="btn btn-primary">切换升降序
                    </button>
                    {historyList}
                </ul>
            </div>
        </div>


    )
}


function calculateWinner(squares): number[3] | null {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return lines[i];
        }
    }
    return null;
}

