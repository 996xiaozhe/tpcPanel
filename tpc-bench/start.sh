#!/bin/bash

# 安装依赖
pip install -r requirements.txt

# 启动 FastAPI 服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 