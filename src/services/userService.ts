import { message } from "antd";
import api from "./api";
import { getUserInfo } from "./authService";
import { MAX_UPLOAD_SIZE, SUPPORTED_IMAGE_TYPES } from "@/constants/config";

// 开发环境标志
export const IS_DEV_MODE = import.meta.env.DEV;

/**
 * 生成OSS上传策略
 * @param expiration 过期时间（秒）
 */
export const generatePolicy = (expiration: number): string => {
  const expirationDate = new Date();
  expirationDate.setSeconds(expirationDate.getSeconds() + expiration);

  const policy = {
    expiration: expirationDate.toISOString(),
    conditions: [
      ["content-length-range", 0, MAX_UPLOAD_SIZE], // 限制上传文件大小
    ],
  };

  return btoa(JSON.stringify(policy));
};

/**
 * 生成OSS上传签名
 * @param accessKeySecret 访问密钥
 * @param policy 策略
 */
export const generateSignature = async (
  accessKeySecret: string,
  policy: string,
): Promise<string> => {
  // 使用浏览器原生的Web Crypto API生成HMAC-SHA1签名
  try {
    // 转换accessKeySecret和policy为ArrayBuffer
    const encoder = new TextEncoder();
    const keyData = encoder.encode(accessKeySecret);
    const policyData = encoder.encode(policy);

    // 导入密钥
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );

    // 生成签名
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, policyData);

    // 将ArrayBuffer转换为Base64字符串
    return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  } catch (error) {
    console.error("生成签名失败:", error);
    throw new Error("生成OSS上传签名失败");
  }
};

/**
 * 获取阿里云OSS临时访问凭证
 * @param fileName 文件名
 * @param fileType 文件的MIME类型
 * @returns OSS临时凭证和文件URL信息
 */
export const getAvatarPresignedUrl = async (
  fileName: string,
  fileType: string,
): Promise<{
  credentials: {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
    Expiration: string;
  };
  fileUrl: string;
  objectKey: string;
  bucketName: string;
  region: string;
  fileName: string;
}> => {
  try {
    console.log("Step 1/3: 获取阿里云OSS临时访问凭证 - 开始");
    message.loading("准备上传...");

    // 请求后端API获取OSS临时凭证
    const response = await api.post("/users/avatar/presigned-url", {
      fileName,
      fileType,
    });

    // 验证响应数据
    if (!response || !response.credentials) {
      throw new Error("获取OSS临时访问凭证失败：响应数据格式错误");
    }
    console.log(response);

    console.log("成功获取阿里云OSS临时访问凭证");

    // 处理后端返回的凭证数据
    const credentials = response.credentials;
    const objectKey = response.objectKey;
    const fileUrl = response.fileUrl;

    return {
      credentials: credentials,
      fileUrl,
      objectKey,
      bucketName: "todo-avatar",
      region: response.region,
      fileName: response.fileName,
    };
  } catch (error) {
    console.error("获取阿里云OSS临时访问凭证失败:", error);
    message.error("获取上传凭证失败，请稍后重试");
    throw new Error("Step 1/3: 获取OSS临时访问凭证失败");
  }
};

/**
 * 使用OSS临时凭证上传文件到阿里云OSS
 * @param file 文件对象
 * @param credentials OSS临时访问凭证
 * @param bucketName Bucket名称
 * @param region 区域
 * @param objectKey 对象键
 * @param fileType 文件类型
 * @returns 上传结果
 *
 * ⚠️ 注意：以下是直接上传到阿里云OSS的核心代码 ⚠️
 */
export const uploadFileToCloud = async (
  file: File,
  credentials: {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
  },
  bucketName: string,
  region: string,
  objectKey: string,
  fileType: string,
): Promise<void> => {
  try {
    console.log("Step 2/3: 直接上传文件到阿里云OSS - 开始");
    message.loading("上传中...");

    // 直接上传文件到阿里云OSS的核心代码
    console.log(
      `[阿里云OSS直接上传] 开始上传文件: ${file.name} (${file.size} bytes) 到 ${bucketName}/${objectKey}`,
    );

    // 构建OSS上传URL，添加安全检查
    const safeBucketName = bucketName || "dingdongtodo"; // 默认bucket名称
    const safeRegion = region || "oss-cn-beijing"; // 默认region
    const ossUploadUrl = `https://${safeBucketName}.${safeRegion}.aliyuncs.com`;

    console.log(`构建的OSS上传URL: ${ossUploadUrl}`);

    const formData = new FormData();

    // 生成policy和signature
    const policy = generatePolicy(3600);
    const signature = await generateSignature(
      credentials.AccessKeySecret,
      policy,
    );

    // 添加OSS上传所需参数
    formData.append("key", objectKey);
    formData.append("OSSAccessKeyId", credentials.AccessKeyId);
    formData.append("policy", policy);
    formData.append("signature", signature);
    formData.append("x-oss-security-token", credentials.SecurityToken);
    formData.append("Content-Type", fileType);
    formData.append("success_action_status", "200");
    formData.append("file", file);

    // 直接上传到OSS
    const response = await fetch(ossUploadUrl, {
      method: "POST",
      body: formData,
      headers: {
        // 注意：不要设置Content-Type为application/json，FormData会自动设置
      },
    });

    if (!response.ok) {
      console.error(`[阿里云OSS直接上传] 失败: HTTP状态码 ${response.status}`);
      throw new Error(`阿里云OSS上传失败: 状态码 ${response.status}`);
    }

    console.log(
      `[阿里云OSS直接上传] 成功: 文件 ${file.name} 已上传到阿里云OSS`,
    );
  } catch (error) {
    console.error("直接上传文件到阿里云OSS失败:", error);
    message.error("上传文件到阿里云OSS失败，请稍后重试");
    throw new Error("Step 2/3: 直接上传文件到阿里云OSS失败");
  }
};

/**
 * 更新用户头像URL到数据库
 * @param avatarUrl 头像URL
 * @returns 更新结果
 */
export const updateUserAvatar = async (avatarUrl: string): Promise<any> => {
  try {
    console.log("Step 3/3: 存储头像URL到数据库 - 开始");
    message.loading("保存中...");

    // 更新数据库中的用户头像URL
    const response = await api.put("/users/avatar", {
      avatarUrl,
    });

    console.log("成功更新用户头像URL到数据库");
    return response;
  } catch (error) {
    console.error("更新头像URL到数据库失败:", error);
    message.error("保存头像信息失败，请稍后重试");
    throw new Error("Step 3/3: 存储头像URL到数据库失败");
  }
};

/**
 * 完整的头像上传流程
 * @param file 选择的文件
 * @returns 上传结果和头像URL
 */
export const uploadAvatar = async (
  file: File,
): Promise<{ success: boolean; avatarUrl: string }> => {
  // 初始化返回结果
  let result: { success: boolean; avatarUrl: string } = {
    success: false,
    avatarUrl: "",
  };

  try {
    // 1. 检查文件大小和类型
    console.log("开始头像上传完整流程，文件信息:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // 文件大小检查
    if (file.size > MAX_UPLOAD_SIZE) {
      const errorMsg = `文件大小不能超过${MAX_UPLOAD_SIZE / 1024 / 1024}MB`;
      console.error(errorMsg);
      message.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 文件类型检查
    if (!file.type.startsWith("image/")) {
      const errorMsg = "请选择有效的图片文件";
      console.error(errorMsg);
      message.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 支持的图片格式检查
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      const errorMsg = "只支持JPG、PNG、WebP和GIF格式的图片";
      console.error(errorMsg);
      message.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 2. 生成唯一文件名
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `avatar_${timestamp}.${extension}`;
    console.log("生成的唯一文件名:", fileName);

    try {
      // Step 1: 获取阿里云OSS临时访问凭证
      const ossCredentialsData = await getAvatarPresignedUrl(
        fileName,
        file.type,
      );

      // 生产环境：执行完整上传流程
      // Step 2: 直接上传文件到阿里云OSS
      await uploadFileToCloud(
        file,
        ossCredentialsData.credentials,
        ossCredentialsData.bucketName,
        ossCredentialsData.region,
        ossCredentialsData.objectKey,
        file.type,
      );

      // Step 3: 存储头像URL到数据库
      await updateUserAvatar(ossCredentialsData.fileUrl);
      
      // 重新获取用户信息，确保前端用户状态与后端同步
      try {
        console.log('重新获取最新用户信息...');
        const updatedUserInfo = await getUserInfo();
        console.log('成功获取最新用户信息');
        // 这里不需要手动更新store，authStore应该已经监听了userInfo的变化
      } catch (getUserInfoError) {
        console.error('重新获取用户信息失败，但头像上传已成功:', getUserInfoError);
        // 不抛出错误，因为头像上传本身已经成功
      }

      // 上传成功
      message.success("头像上传成功！");
      console.log("头像上传完整流程成功完成");
      result = {
        success: true,
        avatarUrl: ossCredentialsData.fileUrl,
      };

      return result;
    } catch (stepError) {
      console.error("头像上传流程中的某个步骤失败:", stepError);
      // 错误消息已经在各个步骤中处理，这里只需重新抛出以中断流程
      throw stepError;
    }
  } catch (error) {
    // 确保显示错误消息
    if (!(error instanceof Error) || !error.message.startsWith("Step")) {
      message.error("头像上传失败，请稍后重试");
    }

    return result;
  }
};
