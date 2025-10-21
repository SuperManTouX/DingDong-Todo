import type { CSSProperties } from "react";

// 自定义图标组件
const CustomHabitIcon = ({
  style,
  className,
}: {
  style?: CSSProperties;
  className: string;
}) => {
  return (
    <span
      style={style}
      role="img"
      aria-label="pie-chart"
      className={
        "anticon anticon-pie-chart sideNav-icon ant-menu-item-icon" +
        " " +
        className
      }
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
          fill="none"
          stroke="#ffffff"
          stroke-width="3"
          stroke-linejoin="round"
        />
        <path
          d="M24.0084 12.0001L24.0072 24.0089L32.4866 32.4883"
          stroke="#ffffff"
          stroke-width="3"
          stroke-linecap="butt"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  );
};

export default CustomHabitIcon;
