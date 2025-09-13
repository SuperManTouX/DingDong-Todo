import { Menu } from 'antd';
import type { MenuProps } from 'antd';

const todoMenuItems: MenuProps['items'] = [
    { key: 'edit', label: '编辑' },
    { key: 'delete', label: '删除', danger: true },
];

type RightContextMenuProps = {
    onClick?: (key: string) => void;
};

 const Test: React.FC<RightContextMenuProps> = ({ onClick }) => (
    <Menu items={todoMenuItems} onClick={({ key }) => onClick?.(key)} />
);
export default Test;