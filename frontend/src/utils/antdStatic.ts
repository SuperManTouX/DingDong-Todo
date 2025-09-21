import { App } from 'antd'; 
import type { MessageInstance, NotificationInstance, ModalStaticFunctions } from 'antd/es/app/context'; 

// 导出全局变量，供其他地方直接import使用
export let message: MessageInstance; 
export let notification: NotificationInstance; 
export let modal: ModalStaticFunctions; 

// 创建一个无UI的组件来挂载Antd的静态方法
export const AntdStaticHolder = () => { 
  const app = App.useApp(); 
  /* 挂载到模块变量，其他地方直接 import 使用 */ 
  message = app.message; 
  notification = app.notification; 
  modal = app.modal; 
  return null;          // 无 UI 
};