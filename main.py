# -*- coding: utf-8 -*-
# 一个flask服务端，接受客户端请求的update方法，备份并修改res/questLib json
# 接受客户端请求的get方法，返回res/questLib json

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import shutil
import time
import random

# quesRecord.json example
"""
{
    "quesRecord": [
        {
            "createTime": 1685583211.2089715,
            "total": 4,
            "correct": 3,
            "rate": 0.75,
            "questions": [
             {"id": 7, "correct": 1, answer:"0010"},
             ],

        },
    ]
}
"""


# 用于标记是否允许修改本地数据
DEBUG = True
RECORD_TIMEOUT = 30 * 60  # 30min
app = Flask(__name__)

CORS(app, supports_credentials=True)


# index 路由 和 question 路由

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/index.html')
def home():
    return render_template('index.html')


@app.route('/question.html')
def question():
    query_params = request.args.to_dict()  # 获取查询参数字典
    return render_template('question.html', query_params=jsonify(query_params))


@app.route('/css/<path:filename>')
def css_files(filename):
    return send_from_directory('css', filename)


@app.route('/js/<path:filename>')
def js_files(filename):
    return send_from_directory('js', filename)


@app.route('/lib/<path:filename>')
def lib_files(filename):
    return send_from_directory('lib', filename)


# 监听本地5500 端口

@app.route('/updateJson', methods=['POST'])
def update():
    if request.method == 'POST':
        if not DEBUG:
            return 'error'
        # 读取json
        data = request.get_data()
        data = json.loads(data)
        # 备份
        shutil.copyfile('res/quesLib.json', 'res/quesLib.json.bak')
        # 修改
        # 输出读取内容
        # print(data)
        with open('res/quesLib.json', 'w', encoding="utf=8") as f:
            json.dump(data, f, ensure_ascii=False)
        return 'success'


@app.route('/getJson', methods=['GET'])
def get():
    if request.method == 'GET':
        # 读取json
        with open('res/quesLib.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)

# submitAnswer


@app.route('/submitAnswer', methods=['POST'])
def submitAnswer():
    data = request.get_data()
    data = json.loads(data)
    # 读取传入data id 和 correct
    quesId = data['id']
    correct = 1 if data['correct'] else 0
    answer = data['answer']

    # 检查答题记录json是否存在，不存在则初始化新建一个
    if not os.path.exists('res/quesRecord.json'):
        with open('res/quesRecord.json', 'w', encoding='utf-8') as f:
            json.dump({
                "quesRecord": [
                    {
                        'createTime': time.time(),
                        'total': 0,
                        'correct': 0,
                        'rate': 0,
                        'questions': []
                    }
                ]
            }, f, ensure_ascii=False)

    # 检查题目答题状况json是否存在，不存在则初始化新建一个
    if not os.path.exists('res/quesStatus.json'):
        with open('res/quesStatus.json', 'w', encoding='utf-8') as f:
            json.dump({
                "quesStatus": [
                    {
                        'id': quesId,
                        'correct': correct,
                        'total': 0,
                        'lastTime': time.time()
                    }
                ]
            }, f, ensure_ascii=False)

    # 检查quesStatus中是否存在该题目，不存在则新建记录
    updateRecord = True
    with open('res/quesStatus.json', 'r', encoding='utf-8') as f:
        quesStatus = json.load(f)['quesStatus']

    quesStatusIds = [i['id'] for i in quesStatus]
    if quesId not in quesStatusIds:
        # 初始化为当前上传值
        quesStatus.append({
            'id': quesId,
            'correct': correct,
            'total': 1,
            'lastTime': time.time()
        })
    else:
        # 检查最后上传lastTime与当前时间是否大于3分钟，否则不更新
        # 标记不更新record
        updateRecord = False
        for i in quesStatus:
            if i['id'] == quesId:
                if time.time() - i['lastTime'] > 3 * 60:
                    i['correct'] += correct
                    i['total'] += 1
                    i['lastTime'] = time.time()
                    updateRecord = True
                break

    with open('res/quesStatus.json', 'w', encoding='utf-8') as f:
        json.dump({'quesStatus': quesStatus}, f, ensure_ascii=False)

    # 检查quesRecord最后一条createTime与当前是否位于150min范围内，否则新建记录
    if updateRecord:
        with open('res/quesRecord.json', 'r', encoding='utf-8') as f:
            quesRecord = json.load(f)['quesRecord']

        if time.time() - quesRecord[-1]['createTime'] > RECORD_TIMEOUT:
            quesRecord.append({
                'createTime': time.time(),
                'total': 1,
                'correct': correct,
                'rate': correct,
                'questions': [
                
                ]
            })
        else:
            # 更新最后一条记录
            quesRecord[-1]['total'] += 1
            quesRecord[-1]['correct'] += correct
            quesRecord[-1]['rate'] = round(quesRecord[-1]
                                           ['correct'] / quesRecord[-1]['total'], 2)
            
        # 检测quesRecord 最后一条 questions内是否有该题目，没有则添加

        quesRecordIds = [i['id'] for i in quesRecord[-1]['questions']]
        if quesId not in quesRecordIds:
            quesRecord[-1]['questions'].append({
                'id': quesId,
                'correct': correct,
                'answer': answer
            })


        with open('res/quesRecord.json', 'w', encoding='utf-8') as f:
            json.dump({'quesRecord': quesRecord}, f, ensure_ascii=False)
    else:
        # 3min内已提交过选项，返回"repeat"
        return 'repeat'

    return 'success'

# /getRandom, 获取一个随机打乱顺序不重复长度为70的id数组


@app.route('/getRandom', methods=['GET'])
def getRandom():
    if request.method == 'GET':
        # 读取json
        with open('res/quesLib.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        # 生成随机数组
        randomList = random.sample(range(0, len(data)), 70)
        return jsonify(randomList)

# # 传入quesId，检查quesStatus中该题lastTime是否超过150min,未超过范围返回"repeat"，否则返回"success"
# @app.route('/checkRepeat', methods=['POST'])
# def checkRepeat():
#     if request.method == 'POST':
#         # 读取传入json
#         data = request.get_data()
#         data = json.loads(data)
#         quesId = data['id']

#         # 检查quesStatus中是否存在该题目，不存在返回success
#         with open('res/quesStatus.json', 'r', encoding='utf-8') as f:
#             quesStatus = json.load(f)['quesStatus']
#         quesStatusIds = [i['id'] for i in quesStatus]
#         if quesId not in quesStatusIds:
#             return 'success'
#         else:
#             for i in quesStatus:
#                 if i['id'] == quesId:
#                     if time.time() - i['lastTime'] > 150 * 60:
#                         return 'success'
#                     else:
#                         return 'repeat'
#                     break



# 获取答题记录
@app.route('/getRecord', methods=['GET'])
def getRecord():
    if request.method == 'GET':
        # 读取json
        with open('res/quesRecord.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        # 遍历记录，添加完成度标记字段，与当前时间超过150min的记录，添加结束字段
        for i in data['quesRecord']:
            i['finish'] = True if time.time() - i['createTime'] > RECORD_TIMEOUT else False

        return jsonify(data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5500)
