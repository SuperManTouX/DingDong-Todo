import api from './api';
import type { Tag } from '@/types';

/**
 * 标签服务类，提供标签的增删改查功能
 */
class TagService {
  /**
   * 获取所有标签
   * @returns 标签数组
   */
  async getAllTags(): Promise<Tag[]> {
    try {
      const response = await api.get<Tag[]>('/todo-tags');
      return response;
    } catch (error) {
      console.error('获取标签列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个标签详情
   * @param id 标签ID
   * @returns 标签对象
   */
  async getTagById(id: string): Promise<Tag> {
    try {
      const response = await api.get<Tag>(`/todo-tags/${id}`);
      return response;
    } catch (error) {
      console.error(`获取标签ID: ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 创建新标签
   * @param tag 标签数据（不包含id）
   * @returns 创建的标签对象
   */
  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    try {
      const response = await api.post<Tag>('/todo-tags', tag);
      return response;
    } catch (error) {
      console.error('创建标签失败:', error);
      throw error;
    }
  }

  /**
   * 更新标签
   * @param id 标签ID
   * @param updates 要更新的字段
   * @returns 更新后的标签对象
   */
  async updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    try {
      const response = await api.put<Tag>(`/todo-tags/${id}`, updates);
      return response;
    } catch (error) {
      console.error(`更新标签ID: ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 删除标签
   * @param id 标签ID
   * @returns 删除成功的消息或状态
   */
  async deleteTag(id: string): Promise<void> {
    try {
      await api.delete(`/todo-tags/${id}`);
    } catch (error) {
      console.error(`删除标签ID: ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取标签与任务的关联关系
   * @returns 任务标签关联映射
   */
  async getTaskTagMappings(): Promise<any> {
    try {
      const response = await api.get('/todo-tags/task-tag-mappings');
      return response;
    } catch (error) {
      console.error('获取任务标签映射失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export default new TagService();