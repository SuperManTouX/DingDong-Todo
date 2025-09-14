import {DeleteOutlined, EditOutlined} from "@ant-design/icons";
import {ContextMenuProps} from "@/types";
import {Dropdown, type MenuProps, message} from 'antd';

export default function ContextMenu({todo, children}: ContextMenuProps) {

    const items: MenuProps['items'] = [
        {
            key: 'edit',
            icon: <EditOutlined/>,
            label: '编辑',
        },
        {
            key: 'delete',
            icon: <DeleteOutlined/>,
            label: '删除',
        },
    ];
    // 右键菜单
    const handleMenuClick = (key, todo) => {
        // ✅ 这里直接拿到 todo.id
        if (key === 'edit') {
            message.info('点击了编辑')
            console.log('编辑', todo);
        } else if (key === 'delete') {
            console.log('删除', todo);
        }
    }
    return (
        <>
            <Dropdown
                key={todo.id}
                trigger={['contextMenu']}
                menu={{items, onClick: ({key}) => handleMenuClick(key, todo)}}
            >
                {children}
            </Dropdown>

        </>
    );
}