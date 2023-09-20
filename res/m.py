import json

# 读取json文件
with open('res/questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

i = 1;
# 遍历lists数组并修改
for item in data['questions']:
    option_len = len(item['options'])
    ans_list = item['answers']
    item['id'] = i
    i+=1
    # 生成optIon len 长度的全0字符串，遍历 ans list ,将ans list 中的str转换为int， 将该全0字符串中该int 位置 替换为1，最后设置回 item['answer']
    item['answers'] = ''.join(['1' if i in ans_list else '0' for i in range(option_len)])
    
    print('title:{}, optionlen: {}, ans_list: {}'.format(item['questionTitle'],option_len, ans_list))

# # 保存修改后的json文件
with open('quesLib.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)


# 输出当前项目的requirement.txt
# pip freeze > requirements.txt