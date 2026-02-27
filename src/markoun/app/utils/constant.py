from fastapi import status
from pydantic_settings import BaseSettings


class Constant(BaseSettings):
    # 权限
    ROLE_ADMIN_DESCRIPTION: str = "System administrator, manages all data"
    ROLE_USER_DESCRIPTION: str = "System user, can view their own data"
    ROLE_GUEST_DESCRIPTION: str = "Guest, can view public data"

    # 返回值
    RESP_SUCCESS: dict = {"status": status.HTTP_200_OK, "message": "success"}
    RESP_SERVER_ERROR: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Internal server error",
    }
    RESP_TOKEN_NOT_MATCH: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access token validation failed",
    }
    RESP_TOKEN_VERIFY_ERR: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access token parsing failed",
    }
    RESP_TOKEN_NOT_EXISTED: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access token not found, please log in first",
    }
    RESP_TOKEN_INVALID: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Invalid access token",
    }
    RESP_TOKEN_EXPIRED: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Access token expired, please log in again",
    }

    RESP_USER_FORBIDDEN: dict = {
        "status_code": status.HTTP_403_FORBIDDEN,
        "detail": "Insufficient permissions",
    }
    RESP_USER_INCORRECT_PASSWD: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Incorrect username or password",
    }
    RESP_USER_EXISTS: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Username already exists",
    }
    RESP_USER_EMAIL_EXISTS: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "Email is already registered",
    }
    RESP_USER_NOT_EXISTS: dict = {
        "status_code": status.HTTP_401_UNAUTHORIZED,
        "detail": "User does not exist",
    }

    # 业务
    SERV_READ_FILE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Failed to read file",
    }
    SERV_LOAD_TREE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Failed to load file tree",
    }
    SERV_REMOVE_ITEM_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Failed to delete file or directory",
    }
    SERV_FILE_EXISTED: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "File already exists",
    }
    SERV_FILE_CREATE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Failed to create file",
    }
    SERV_DIR_EXISTED: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Directory already exists",
    }
    SERV_FILE_UPLOAD_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "File upload failed",
    }
    SERV_FILE_NOT_EXISTED: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "File does not exist",
    }
    SERV_FILE_SAVE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Failed to save file",
    }
    SERV_SETTING_UPDATE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Failed to update system settings",
    }
    SERV_SETTING_UPDATE_PERMISSION_DENIED: dict = {
        "status_code": status.HTTP_403_FORBIDDEN,
        "detail": "Failed to update system settings: permission denied",
    }
    SERV_SETTING_NOT_EXISTED: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "System setting does not exist",
    }
    SERV_DISABLE_REGISTRATION: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "User registration is disabled",
    }
    SERV_PASSWD_UPDATE_FAIL: dict = {
        "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        "detail": "Failed to update password",
    }


CONSTANT = Constant()
