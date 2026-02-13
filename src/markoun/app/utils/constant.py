from fastapi import status
from pydantic_settings import BaseSettings


class Constant(BaseSettings):
    # 权限
    ROLE_ADMIN_DESCRIPTION: str = "系统管理员，管理所有数据"
    ROLE_USER_DESCRIPTION: str = "系统用户，查看自己用户数据"
    ROLE_GUEST_DESCRIPTION: str = "访客，查看公开数据"

    # 返回值
    RESP_SUCCESS: dict = {"status": status.HTTP_200_OK, "message": "success"}
    RESP_SERVER_ERROR: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "服务器错误",
    }
    RESP_TOKEN_NOT_MATCH: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access Token校验失败",
    }
    RESP_TOKEN_VERIFY_ERR: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access Token解析失败",
    }
    RESP_TOKEN_NOT_EXISTED: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access Token不存在，请先登录",
    }
    RESP_TOKEN_INVALID: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access Token不合法",
    }
    RESP_TOKEN_EXPIRED: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access Token过期，需要重新登录",
    }

    RESP_USER_FORBIDDEN: dict = {
        "status_code": status.HTTP_403_FORBIDDEN,
        "detail": "当前用户权限不足",
    }
    RESP_USER_INCORRECT_PASSWD: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "用户名或密码错误",
    }
    RESP_USER_EXISTS: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "用户名已存在",
    }
    RESP_USER_EMAIL_EXISTS: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "邮箱已被注册",
    }
    RESP_USER_NOT_EXISTS: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "用户不存在",
    }

    RESP_USER_SESSION_NOT_EXISTS: dict = {
        "status_code": status.HTTP_404_NOT_FOUND,
        "detail": "会话记录不存在",
    }
    RESP_USER_SESSION_NULL: dict = {
        "status_code": status.HTTP_404_NOT_FOUND,
        "detail": "请求发送了一个空会话",
    }
    RESP_INVALID_MODEL: dict = {
        "status_code": status.HTTP_404_NOT_FOUND,
        "detail": "无效的模型",
    }

    # 业务
    SERV_READ_FILE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "读取本地文件失败",
    }
    SERV_LOAD_TREE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "读取本地文件树失败",
    }
    SERV_REMOVE_ITEM_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "文件/文件夹删除失败",
    }
    SERV_FILE_EXISTED: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "文件已存在",
    }
    SERV_FILE_CREATE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "文件创建失败",
    }
    SERV_DIR_EXISTED: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "文件夹已存在",
    }
    SERV_FILE_UPLOAD_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "文件上传失败",
    }
    SERV_FILE_NOT_EXISTED: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "文件不存在",
    }
    SERV_FILE_SAVE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "文件保存失败",
    }
    SERV_SETTING_UPDATE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "系统设置更新失败",
    }
    SERV_SETTING_UPDATE_PERMISSION_DENIED: dict = {
        "status_code": status.HTTP_403_FORBIDDEN,
        "detail": "系统设置更新失败，权限不足",
    }
    SERV_SETTING_NOT_EXISTED: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "系统设置不存在，更新失败",
    }


CONSTANT = Constant()
