# ReactTodo 项目主题色定制方案

## 功能概述
为ReactTodo项目添加主题色切换功能，允许用户在预设的几种主题色之间进行切换，实现界面风格的个性化。

> ⚠️ 注意：目前项目中相关的主题文件（themes.ts, themeStore.ts, theme.css, ThemeSwitcher.tsx）已被移除，本文档提供了一个兼容现有AppLayout.tsx结构的主题实现方案。

## 技术方案

### 1. 技术选型
- **Ant Design主题定制**：利用Ant Design的`ConfigProvider`和主题变量进行全局样式定制
- **CSS变量**：使用CSS变量存储主题色，方便动态切换
- **Zustand状态管理**：存储当前选中的主题配置
- **LocalStorage持久化**：保存用户的主题偏好设置

### 2. 实现步骤（兼容现有AppLayout结构）

#### 步骤一：创建主题配置文件

1. 在`src`目录下创建`theme`文件夹
2. 创建主题配置文件 `src/theme/themes.ts`

```typescript
// 主题类型定义
export interface ThemeConfig {
  key: string;
  name: string;
  primaryColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  bgColor: string;
  textColor: string;
}

// 预设主题配置
export const themes: ThemeConfig[] = [
  {
    key: 'default',
    name: '默认主题',
    primaryColor: '#1890ff',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#f5222d',
    infoColor: '#1890ff',
    bgColor: '#ffffff',
    textColor: '#333333',
  },
  {
    key: 'dark',
    name: '深色主题',
    primaryColor: '#177ddc',
    successColor: '#4eb583',
    warningColor: '#faad14',
    errorColor: '#ff4d4f',
    infoColor: '#177ddc',
    bgColor: '#141414',
    textColor: '#ffffff',
  },
  {
    key: 'purple',
    name: '紫色主题',
    primaryColor: '#722ed1',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#f5222d',
    infoColor: '#722ed1',
    bgColor: '#ffffff',
    textColor: '#333333',
  },
];

// 获取主题配置
export const getThemeById = (key: string): ThemeConfig => {
  return themes.find(theme => theme.key === key) || themes[0];
};

// 将主题配置转换为Ant Design配置
export const convertToAntdTheme = (theme: ThemeConfig) => {
  return {
    token: {
      colorPrimary: theme.primaryColor,
      colorSuccess: theme.successColor,
      colorWarning: theme.warningColor,
      colorError: theme.errorColor,
      colorInfo: theme.infoColor,
      colorBgBase: theme.bgColor,
      colorTextBase: theme.textColor,
    },
  };
};
```

#### 步骤二：创建主题Store

创建`src/store/themeStore.ts`文件，用于管理主题状态：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { themes, getThemeById, type ThemeConfig } from '../theme/themes';

interface ThemeState {
  currentTheme: ThemeConfig;
  setTheme: (themeKey: string) => void;
  getCurrentTheme: () => ThemeConfig;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: themes[0],
      setTheme: (themeKey: string) => {
        const theme = getThemeById(themeKey);
        set({ currentTheme: theme });
        // 应用CSS变量
        applyThemeToDocument(theme);
      },
      getCurrentTheme: () => {
        return get().currentTheme;
      },
    }),
    {
      name: 'theme-storage', // 本地存储的键名
    },
  ),
);

// 应用主题到文档
export const applyThemeToDocument = (theme: ThemeConfig) => {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--theme-${key}`, value);
    }
  });
};
```

#### 步骤三：创建CSS变量文件

创建`src/styles/theme.css`文件，定义CSS变量：

```css
/* 主题CSS变量 */
:root {
  --theme-primaryColor: #1890ff;
  --theme-successColor: #52c41a;
  --theme-warningColor: #faad14;
  --theme-errorColor: #f5222d;
  --theme-infoColor: #1890ff;
  --theme-bgColor: #ffffff;
  --theme-textColor: #333333;
}

/* 使用主题变量的全局样式 */
body {
  background-color: var(--theme-bgColor);
  color: var(--theme-textColor);
  transition: background-color 0.3s, color 0.3s;
}

/* 应用布局相关样式 */
.app-layout {
  background-color: var(--theme-bgColor);
  color: var(--theme-textColor);
  transition: background-color 0.3s, color 0.3s;
}

/* 侧边栏样式 */
.app-layout .ant-layout-sider {
  background-color: var(--theme-bgColor);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

/* 可以在这里添加更多使用主题变量的自定义样式 */
```

#### 步骤四：在主应用中集成主题功能

修改`src/main.tsx`文件，集成主题功能：

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import AppLayout from './Layout/AppLayout';
import { useThemeStore, applyThemeToDocument } from './store/themeStore';
import { convertToAntdTheme } from './theme/themes';
import './styles/theme.css';
import './index.css';

// 初始化主题
const initializeTheme = () => {
  const themeStore = useThemeStore.getState();
  const currentTheme = themeStore.getCurrentTheme();
  applyThemeToDocument(currentTheme);
};

// 先初始化主题
initializeTheme();

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={convertToAntdTheme(useThemeStore.getState().currentTheme)}>
      <AppLayout />
    </ConfigProvider>
  </React.StrictMode>,
);

// 监听主题变化，动态更新UI
useThemeStore.subscribe((newState) => {
  const root = document.getElementById('root')!;
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ConfigProvider theme={convertToAntdTheme(newState.currentTheme)}>
        <AppLayout />
      </ConfigProvider>
    </React.StrictMode>,
  );
});
```

#### 步骤五：创建主题切换组件

创建`src/components/ThemeSwitcher.tsx`组件，用于切换主题：

```tsx
import React from 'react';
import { Select } from 'antd';
import { useThemeStore } from '../store/themeStore';
import { themes } from '../theme/themes';

const { Option } = Select;

const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme } = useThemeStore();

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  return (
    <Select
      value={currentTheme.key}
      onChange={handleThemeChange}
      style={{ width: 120, marginRight: '16px' }}
      size="small"
    >
      {themes.map((theme) => (
        <Option key={theme.key} value={theme.key}>
          {theme.name}
        </Option>
      ))}
    </Select>
  );
};

export default ThemeSwitcher;
```

#### 步骤六：在界面中添加主题切换组件（不修改现有结构）

在`src/Layout/AppLayout.tsx`文件中，**不删除原有返回结构**，只添加主题切换组件：

```tsx
// 在文件顶部导入ThemeSwitcher组件
import React from "react";
import SideMenu from "./SideMenu";
import ListGroupManager from "../components/ListGroupManager";
import { Layout, type MenuProps } from "antd";
import { useTodoStore, useActiveGroup, useSelectTodo } from "@/store/todoStore";
import EditTodo from "@/Layout/EditTodo";
import TODOList from "@/Layout/TODOList";
import ThemeSwitcher from '../components/ThemeSwitcher';

// 保留原有组件实现...
export default function AppLayout() {
  const { setActiveGroupId } = useTodoStore();
  const activeGroup = useActiveGroup();
  const selectTodo = useSelectTodo();

  // 添加一个容器来包裹现有的布局和主题切换器
  const themeSwitcherContainer: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '8px',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  };

  // ... 保留原有代码 ...

  return (
    <>
      {/* 在现有布局外部添加主题切换器，不影响原有结构 */}
      <div style={themeSwitcherContainer}>
        <ThemeSwitcher />
      </div>
      
      {/* 保留原有布局结构完全不变 */}
      <Layout className="w-100 h-100">
        <Sider width="5%" style={siderStyle1}>
          SiderNav
        </Sider>
        <Sider width="18%">
          <SideMenu menuItem={menuItem} onActiveGroupChange={setActiveGroupId} />
        </Sider>
        <Layout>
          <TODOList
            key={useTodoStore.getState().activeGroupId}
            groupName={activeGroup.title}
            todoList={
              activeGroup || {
                id: "",
                title: "",
                tasks: [],
                createdAt: "",
                updatedAt: "",
              }
            }
          ></TODOList>
        </Layout>
        <Layout>
          {selectTodo && (
            <EditTodo
              key={selectTodo.id}
              onTodoChange={useTodoStore.getState().dispatchTodo}
            />
          )}
        </Layout>
        {/* 清单管理模态框 */}
        {listGroupManager.groupModal}
        {/* 标签管理模态框 */}
        {listGroupManager.tagModal}
      </Layout>
    </>
  );
};
```

#### 步骤七：更新CSS样式以支持主题

更新现有的CSS文件，使用CSS变量替换硬编码的颜色值：

例如，修改`src/styles/TODOList.css`：

```css
.todo-list-container {
  background-color: var(--theme-bgColor);
  color: var(--theme-textColor);
  transition: background-color 0.3s, color 0.3s;
}

/* 其他样式也使用CSS变量 */
.todo-item {
  border-left: 4px solid var(--theme-primaryColor);
}

/* 继续更新其他CSS文件... */
```

## 3. 深色主题特殊处理

对于深色主题，需要额外的样式调整以确保在深色背景下的良好可读性。在`src/styles/theme.css`文件中添加以下内容：

```css
/* 深色模式的媒体查询支持 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* 默认深色主题变量（当用户系统为深色模式且未选择主题时） */
    --theme-primaryColor: #177ddc;
    --theme-successColor: #4eb583;
    --theme-warningColor: #faad14;
    --theme-errorColor: #ff4d4f;
    --theme-infoColor: #177ddc;
    --theme-bgColor: #141414;
    --theme-textColor: #ffffff;
  }
}

/* 深色主题特定样式（当用户选择dark主题时） */
:root {
  /* 深色主题下的组件样式覆盖 */
  --theme-dark-bg-secondary: rgba(255, 255, 255, 0.05);
  --theme-dark-border-color: rgba(255, 255, 255, 0.1);
  --theme-dark-text-secondary: rgba(255, 255, 255, 0.65);
}

/* 使用数据属性[data-theme="dark"]来应用深色主题特定样式 */
[data-theme="dark"] {
  /* 深色主题下的侧边栏样式 */
  --theme-sider-bg-color: #0a0a0a;
  --theme-sider-border-color: rgba(255, 255, 255, 0.08);
}

/* 深色主题下的应用布局样式 */
[data-theme="dark"] .app-layout {
  background-color: #141414;
}

[data-theme="dark"] .app-layout .ant-layout-sider {
  background-color: var(--theme-sider-bg-color);
  border-right-color: var(--theme-sider-border-color);
}

/* 深色主题下的待办事项样式 */
[data-theme="dark"] .todo-item {
  background-color: var(--theme-dark-bg-secondary);
  border-color: var(--theme-dark-border-color);
}

/* 深色主题下的输入框样式 */
[data-theme="dark"] .ant-input,
[data-theme="dark"] .ant-select-selector {
  background-color: var(--theme-dark-bg-secondary);
  color: var(--theme-textColor);
  border-color: var(--theme-dark-border-color);
}

/* 深色主题下的模态框样式 */
[data-theme="dark"] .ant-modal-content {
  background-color: var(--theme-sider-bg-color);
  border-color: var(--theme-dark-border-color);
}
```

## 4. 性能优化建议

为了确保主题切换功能不会影响应用性能，以下是一些优化建议：

1. **懒加载主题样式**：对于不常用的主题或大型主题样式文件，可以考虑使用动态导入实现懒加载：
   ```typescript
   // 在themeStore.ts中添加
   const lazyLoadThemeStyles = async (themeKey: string) => {
     if (themeKey === 'dark') {
       // 懒加载深色主题的额外样式
       await import('../styles/dark-theme-extensions.css');
     }
   };
   
   // 在setTheme方法中调用
   setTheme: async (themeKey: string) => {
     const theme = getThemeById(themeKey);
     set({ currentTheme: theme });
     applyThemeToDocument(theme);
     
     // 懒加载特定主题的额外样式
     await lazyLoadThemeStyles(themeKey);
   },
   ```

2. **避免过度渲染**：使用React.memo或useMemo优化主题相关组件的渲染：
   ```tsx
   // 使用React.memo包装主题切换组件
   const ThemeSwitcher: React.FC = React.memo(() => {
     const { currentTheme, setTheme } = useThemeStore();
     // ...组件实现
   });
   
   // 使用useMemo缓存主题配置
   const antdTheme = useMemo(() => {
     return convertToAntdTheme(currentTheme);
   }, [currentTheme]);
   ```

3. **减少CSS变量数量**：只保留必要的主题变量，避免过多的变量导致性能问题
   - 集中管理主题变量，避免在多处重复定义
   - 定期审查和清理未使用的主题变量
   
4. **缓存主题配置**：
   - 利用LocalStorage缓存主题配置，减少初始化时间（zustand的persist中间件已实现此功能）
   - 在应用启动时预加载主题配置，避免白屏或闪烁
   
5. **优化主题切换性能**：
   ```typescript
   // 优化主题切换的实现
   export const applyThemeToDocument = (theme: ThemeConfig) => {
     const root = document.documentElement;
     
     // 批量更新CSS变量，减少重排重绘次数
     const cssVars: Record<string, string> = {};
     Object.entries(theme).forEach(([key, value]) => {
       if (typeof value === 'string') {
         cssVars[`--theme-${key}`] = value;
       }
     });
     
     // 使用CSS变量的批量更新方法
     Object.entries(cssVars).forEach(([name, value]) => {
       root.style.setProperty(name, value);
     });
     
     // 设置data-theme属性，方便CSS选择器使用
     root.setAttribute('data-theme', theme.key);
   };
   ```

6. **考虑使用CSS-in-JS方案**：对于复杂的主题需求，可以考虑使用Styled Components或Emotion等CSS-in-JS方案，它们提供了更好的运行时主题切换支持

## 5. 测试建议

为了确保主题功能的稳定性和用户体验，建议进行以下几方面的测试：

### 5.1 功能测试

确保主题切换功能在不同场景下都能正常工作：

```typescript
// 使用Jest和Testing Library进行主题切换功能测试
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { ThemeProvider } from '../context/ThemeContext';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

describe('ThemeSwitcher', () => {
  it('should switch theme when select option changes', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );
    
    // 找到主题选择下拉框
    const themeSelect = screen.getByRole('combobox');
    
    // 模拟用户切换到深色主题
    fireEvent.change(themeSelect, { target: { value: 'dark' } });
    
    // 验证HTML根元素是否设置了正确的data-theme属性
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
    // 验证主题色是否被正确应用
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-primaryColor');
    expect(primaryColor.trim()).toBe('#177ddc'); // 深色主题的主色
  });
});
```

### 5.2 兼容性测试

测试主题在不同浏览器和设备上的显示效果：

- **浏览器测试**：确保主题在Chrome、Firefox、Safari、Edge等主流浏览器上表现一致
- **响应式测试**：检查主题在不同屏幕尺寸下的显示效果
- **设备测试**：在真实设备上测试主题效果，尤其是移动设备

推荐使用BrowserStack或Sauce Labs等云端测试平台进行跨浏览器兼容性测试。

### 5.3 性能测试

评估主题切换对应用性能的影响：

```typescript
// 使用Chrome DevTools Performance API或其他性能监控工具
const measureThemeSwitchPerformance = async () => {
  performance.mark('theme-switch-start');
  
  // 执行主题切换操作
  const themeStore = useThemeStore.getState();
  await themeStore.setTheme('dark');
  
  performance.mark('theme-switch-end');
  performance.measure('theme-switch', 'theme-switch-start', 'theme-switch-end');
  
  const measure = performance.getEntriesByName('theme-switch')[0];
  console.log(`主题切换耗时: ${measure.duration}ms`);
  
  // 清理性能标记
  performance.clearMarks();
  performance.clearMeasures();
};
```

### 5.4 可访问性测试

检查不同主题下的文字对比度是否符合可访问性标准：

- 使用Chrome DevTools的Accessibility面板检查颜色对比度
- 确保文本与背景的对比度符合WCAG AA标准（至少4.5:1），对于大文本（18pt+）至少3:1
- 检查交互元素（如按钮、链接）的状态颜色是否都满足可访问性要求

### 5.5 用户体验测试

确保主题切换过程平滑，没有明显的闪烁或卡顿：

- 进行真实用户测试，收集用户对主题切换体验的反馈
- 使用慢动作视频记录主题切换过程，检查是否有闪烁或布局跳跃
- 考虑添加主题切换动画，提升用户体验

## 6. 未来扩展方向

主题功能有很多可以进一步扩展的方向，以下是一些值得考虑的功能：

### 6.1 自定义主题色

允许用户自定义主题颜色，提供更个性化的用户体验：

```typescript
// src/types/theme.ts
interface CustomThemeConfig {
  key: string;
  name: string;
  primaryColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
  bgColor: string;
  textColor: string;
  // 用户自定义主题的标识
  isCustom: boolean;
}

// src/store/themeStore.ts
// 添加保存自定义主题的方法
saveCustomTheme: (customTheme: Omit<CustomThemeConfig, 'key' | 'isCustom'>) => {
  const newKey = `custom-${Date.now()}`;
  const theme: CustomThemeConfig = {
    ...customTheme,
    key: newKey,
    name: customTheme.name || `自定义主题 ${new Date().toLocaleDateString()}`,
    isCustom: true
  };
  
  set(state => ({
    customThemes: [...state.customThemes, theme]
  }));
  
  return newKey;
},

// 添加删除自定义主题的方法
deleteCustomTheme: (themeKey: string) => {
  set(state => ({
    customThemes: state.customThemes.filter(theme => theme.key !== themeKey)
  }));
},
```

### 6.2 字体主题

增加字体大小、字重和字体类型的主题设置：

```typescript
// 在themeConfig.ts中扩展主题配置
const lightTheme: ThemeConfig = {
  key: 'light',
  name: '浅色主题',
  primaryColor: '#1890ff',
  // ...其他颜色配置
  
  // 字体配置
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
  fontSize: '14px',
  fontSizeHeading: '18px',
  fontWeight: '400',
  fontWeightBold: '600'
};

// 在theme.css中添加字体相关的CSS变量
:root {
  /* 字体相关变量 */
  --theme-fontFamily: var(--theme-fontFamily, 'system-ui');
  --theme-fontSize: var(--theme-fontSize, '14px');
  --theme-fontSizeHeading: var(--theme-fontSizeHeading, '18px');
  --theme-fontWeight: var(--theme-fontWeight, '400');
  --theme-fontWeightBold: var(--theme-fontWeightBold, '600');
}

/* 应用字体变量 */
body {
  font-family: var(--theme-fontFamily);
  font-size: var(--theme-fontSize);
  font-weight: var(--theme-fontWeight);
}

h1, h2, h3, h4, h5, h6 {
  font-size: var(--theme-fontSizeHeading);
  font-weight: var(--theme-fontWeightBold);
}
```

### 6.3 主题预览功能

在切换主题前可以预览效果，提高用户体验：

```tsx
// src/components/ThemePreview.tsx
import React, { useState } from 'react';
import { Modal, Button, Card, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

interface ThemePreviewProps {
  theme: ThemeConfig;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [previewId] = useState(`preview-${Date.now()}`);

  const showModal = () => {
    // 创建预览容器
    const previewContainer = document.createElement('div');
    previewContainer.id = previewId;
    previewContainer.style.display = 'none';
    document.body.appendChild(previewContainer);
    
    // 应用预览主题
    Object.entries(theme).forEach(([key, value]) => {
      if (typeof value === 'string' && key !== 'key' && key !== 'name') {
        previewContainer.style.setProperty(`--theme-${key}`, value);
      }
    });
    
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    // 清理预览容器
    const previewContainer = document.getElementById(previewId);
    if (previewContainer) {
      document.body.removeChild(previewContainer);
    }
  };

  return (
    <>
      <Button 
        type="text" 
        icon={<EyeOutlined />} 
        onClick={showModal}
        size="small"
      >
        预览
      </Button>
      <Modal
        title={`预览: ${theme.name}`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            关闭
          </Button>
        ]}
        width={400}
      >
        <div style={{ 
          '--theme-primaryColor': theme.primaryColor,
          '--theme-bgColor': theme.bgColor,
          '--theme-textColor': theme.textColor,
          '--theme-successColor': theme.successColor,
          '--theme-warningColor': theme.warningColor,
          '--theme-errorColor': theme.errorColor,
          backgroundColor: 'var(--theme-bgColor)',
          color: 'var(--theme-textColor)',
          padding: '16px',
          borderRadius: '8px',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--theme-textColor)' }}>主题预览</h3>
          <p>这是在{theme.name}下的文本显示效果</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tag style={{ backgroundColor: 'var(--theme-primaryColor)', color: 'white' }}>主色</Tag>
            <Tag style={{ backgroundColor: 'var(--theme-successColor)', color: 'white' }}>成功色</Tag>
            <Tag style={{ backgroundColor: 'var(--theme-warningColor)', color: 'white' }}>警告色</Tag>
            <Tag style={{ backgroundColor: 'var(--theme-errorColor)', color: 'white' }}>错误色</Tag>
          </div>
          <Card 
            size="small" 
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'var(--theme-textColor)'
            }}
          >
            <p>卡片组件预览</p>
          </Card>
        </div>
      </Modal>
    </>
  );
};

export default ThemePreview;
```


### 6.5 智能主题

根据时间或系统主题自动切换应用主题：

```typescript
// src/utils/autoTheme.ts
import { useThemeStore } from '../store/themeStore';

// 根据时间段自动切换主题
export const setupAutoThemeByTime = () => {
  const updateThemeByTime = () => {
    const hour = new Date().getHours();
    const themeStore = useThemeStore.getState();
    
    // 定义时间段
    const isNight = hour >= 19 || hour < 6; // 晚上7点到早上6点
    const isDay = hour >= 6 && hour < 19; // 早上6点到晚上7点
    
    // 根据当前时间设置主题
    if (isNight && themeStore.currentTheme.key !== 'dark') {
      themeStore.setTheme('dark');
    } else if (isDay && themeStore.currentTheme.key !== 'light') {
      themeStore.setTheme('light');
    }
  };
  
  // 初始检查
  updateThemeByTime();
  
  // 设置定时器，每小时检查一次
  const timer = setInterval(updateThemeByTime, 60 * 60 * 1000);
  
  // 返回清理函数
  return () => clearInterval(timer);
};

// 根据系统主题自动切换
export const setupAutoThemeBySystem = () => {
  // 检查系统是否支持暗色模式
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeStore = useThemeStore.getState();
  
  // 初始设置
  if (isDarkMode && themeStore.currentTheme.key !== 'dark') {
    themeStore.setTheme('dark');
  } else if (!isDarkMode && themeStore.currentTheme.key !== 'light') {
    themeStore.setTheme('light');
  }
  
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      themeStore.setTheme('dark');
    } else {
      themeStore.setTheme('light');
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  // 返回清理函数
  return () => mediaQuery.removeEventListener('change', handleChange);
};

// 在App.tsx中使用
useEffect(() => {
  // 可以根据用户设置决定启用哪种自动主题切换
  const cleanupTimeTheme = setupAutoThemeByTime();
  // 或者
  // const cleanupSystemTheme = setupAutoThemeBySystem();
  
  return () => {
    cleanupTimeTheme;
    // cleanupSystemTheme;
  };
}, []);
```

### 6.6 主题模板和分类

提供不同风格的主题模板，并按照场景或风格进行分类：

```typescript
// src/types/theme.ts
enum ThemeCategory {
  GENERAL = 'general', // 通用主题
  PROGRAMMING = 'programming', // 编程风格主题
  NATURE = 'nature', // 自然风格主题
  MINIMALIST = 'minimalist', // 极简风格主题
  VIBRANT = 'vibrant', // 鲜艳风格主题
  PASTEL = 'pastel', // 柔和风格主题
  DARK = 'dark', // 深色主题
  LIGHT = 'light' // 浅色主题
}

interface ThemeConfig {
  key: string;
  name: string;
  category: ThemeCategory;
  primaryColor: string;
  // ...其他主题属性
}

// src/constants/themeTemplates.ts
import { ThemeConfig, ThemeCategory } from '../types/theme';

// 编程风格主题模板
export const programmingThemes: ThemeConfig[] = [
  {
    key: 'vscode-dark',
    name: 'VSCode 深色',
    category: ThemeCategory.PROGRAMMING,
    primaryColor: '#0e639c',
    successColor: '#16c79a',
    warningColor: '#ff9f43',
    errorColor: '#ff518c',
    infoColor: '#0e639c',
    bgColor: '#1e1e1e',
    textColor: '#d4d4d4'
  },
  {
    key: 'jetbrains-light',
    name: 'JetBrains 浅色',
    category: ThemeCategory.PROGRAMMING,
    primaryColor: '#007acc',
    successColor: '#50a14f',
    warningColor: '#c18401',
    errorColor: '#e45649',
    infoColor: '#007acc',
    bgColor: '#ffffff',
    textColor: '#333333'
  }
];

// 自然风格主题模板
export const natureThemes: ThemeConfig[] = [
  {
    key: 'forest',
    name: '森林',
    category: ThemeCategory.NATURE,
    primaryColor: '#2d5d2a',
    successColor: '#4e9f3d',
    warningColor: '#d8e9a8',
    errorColor: '#ff4b5c',
    infoColor: '#1e5f74',
    bgColor: '#f8f5f2',
    textColor: '#2f3e46'
  },
  {
    key: 'ocean',
    name: '海洋',
    category: ThemeCategory.NATURE,
    primaryColor: '#035397',
    successColor: '#34a0a4',
    warningColor: '#fca311',
    errorColor: '#d62828',
    infoColor: '#035397',
    bgColor: '#f8f9fa',
    textColor: '#212529'
  }
];

// 在主题切换器中增加分类筛选功能
const ThemeSwitcherWithCategories: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>(ThemeCategory.GENERAL);
  // ...组件实现
}
```

---

## 7. 总结

主题定制功能为React待办事项应用带来了丰富的视觉体验可能性。通过本指南，我们实现了一个灵活、可扩展的主题系统，主要包含以下几个关键部分：

1. **主题配置系统**：通过TypeScript接口定义主题结构，支持浅色和深色两种基本主题
2. **状态管理**：使用Zustand管理主题状态，支持持久化存储
3. **CSS变量集成**：将主题配置转换为CSS变量，实现全局样式控制
4. **主题切换组件**：提供直观的用户界面，允许用户轻松切换主题
5. **深色主题支持**：实现了完整的深色主题样式覆盖，确保在不同模式下的良好用户体验

这些实现不仅提升了应用的用户体验，还为未来的功能扩展奠定了基础。随着自定义主题色、字体主题、主题分享等功能的加入，应用将能够更好地满足不同用户的个性化需求。

主题系统的设计遵循了现代前端开发的最佳实践，包括组件化设计、状态管理分离、CSS变量使用和响应式设计等。这使得代码具有良好的可维护性和可扩展性，同时也为其他React项目提供了一个完整的主题系统实现参考。

通过主题定制功能，我们的React待办事项应用不仅在功能上更加完善，在视觉体验上也达到了一个新的高度，为用户提供了更加愉悦的使用体验。
按照此方案实施，可以为ReactTodo项目添加完整的主题色切换功能，提升用户体验和个性化选项。