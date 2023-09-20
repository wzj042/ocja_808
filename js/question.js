let statusButton;
let toolbarTitle;
let titleInput;
let contentInput;

let analysisInput;
let analysisCard;

let fab;
let footbar;

let quizAnalysisBtn;
let backIndexBtn;
let randomQuizBtn;
let testInfoBtn;
let submitQuizBtn;


let addOptionBtn;
let removeLastBtn;
let delQuizBtn;
let exportJsonBtn;

let startTestBtn;

let normalModeDiv;
let editModeDiv;

let questionJson;
let curQuestion;
let editMode = false;
let analysisMode = false;
let createMode = false;
let isAnswered = false;
let editor;
let optionCode = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
let options = [];
let originQuestion = null;
let doubleClick = false;
let doubleClickTimer = null;

document.addEventListener("DOMContentLoaded", function () {
    // TOOLBAR METHOD
    statusButton = document.querySelector(".status-button");
    toolbarTitle = document.querySelector(".toolbar .title");
    titleInput = document.querySelector("#title-input");
    contentInput = document.querySelector("#content-input");
    fab = document.querySelector(".fab");
    footbar = document.querySelector(".footbar");
    analysisCard = document.querySelector(".analysis-card");
    analysisInput = document.querySelector("#analysis-input");
    quizAnalysisBtn = document.querySelector("#quiz-analysis-btn");
    backIndexBtn = document.querySelector("#back-index-btn");
    randomQuizBtn = document.querySelector("#random-quiz-btn");
    testInfoBtn = document.querySelector("#test-info-btn");
    submitQuizBtn = document.querySelector("#submit-quiz-btn");
    normalModeDiv = document.querySelector(".normal-mode");
    editModeDiv = document.querySelector(".edit-mode");
    addOptionBtn = document.querySelector("#add-option-btn");
    removeLastBtn = document.querySelector("#remove-last-btn");
    delQuizBtn = document.querySelector("#del-quiz-btn");
    exportJsonBtn = document.querySelector("#export-json-btn");
    /**
     * Toolbar 搜索框事件
     * 
     */
    loadData().then((data) => {
        questionJson = data;
        console.log("当前词库共有" + questionJson['questions'].length + "个问题");
        let url = new URL(window.location.href);
        // 通过flask模板语法获取index
        let index = url.searchParams.get("index") - 1;

        // 备份json 以确认是否有变动


        if (index < 0 || index >= questionJson['questions'].length) {
            // 如果是length + 1页面，则为新建问题页面。json新建空问题json
            if (index === questionJson['questions'].length) {
                curQuestion = {
                    "content": "// 看选项",
                    "title": "结果是什么?",
                    "options": ["", "", "", ""],
                    "answer": "",
                    "analysis": "// 没有解析",
                    "id": index + 1
                };
                questionJson['questions'].push(curQuestion);
                createMode = true;
                // 保存json
            } else {
                alert("index out of range");
                // 在body中插入可以返回上一页的按钮
                document.body.innerHTML = "";
                document.body.style = "height:100vh; display: flex; justify-content: center; align-items: center;"
                let button = document.createElement("button");
                button.innerHTML = "返回上一页";
                button.style = "font-size: 30px;padding: 8px;";
                button.addEventListener("click", function () {
                    window.history.back();
                });
                document.body.appendChild(button);
                return;
            }


        }
        let question = questionJson['questions'][index];
        const jsonString = JSON.stringify(question);
        originQuestion = JSON.parse(jsonString);

        curQuestion = question;

        editor = CodeMirror.fromTextArea(document.getElementById("code"), {
            lineNumbers: true,
            readOnly: !editMode,
            mode: "text/x-java",
            theme: "material-darker"
        });

        // 设置input 文字
        titleInput.value = question['title'];
        analysisInput.value = question['analysis'];
        editor.setValue(question['content']);
        // 计算input应显示高度
        autoResize(titleInput);
        autoResize(analysisInput);
        titleInput.addEventListener('input', function () {
            autoResize(titleInput);
        });
        titleInput.addEventListener('change', function () {
            autoResize(titleInput);
        });
        analysisInput.addEventListener('input', function () {
            autoResize(analysisInput);
        });
        analysisInput.addEventListener('change', function () {
            autoResize(analysisInput);
        });

        // 底部按钮事件
        quizAnalysisBtn.addEventListener("click", function () {
            switchAnalysis();
        });
        backIndexBtn.addEventListener("click", function () {
            // 检查是否有修改内容
            if (JSON.stringify(curQuestion) !== JSON.stringify(originQuestion)) {
                if (confirm("当前问题已修改，先保存再退出")) {
                    // 保存json
                    window.location.href = "index.html";
                }
            } else {
                window.location.href = "index.html";
            }
        });
        randomQuizBtn.addEventListener("click", function () {
            randomQuiz();
        });
        testInfoBtn.addEventListener("click", function () {
            switchModal();
        });
        submitQuizBtn.addEventListener("click", function () {
            // 检查当前答案是否匹配已选选项
            if (!isAnswered) {
                checkAnswer();
            } else {
                randomQuiz();
            }
        });
        addOptionBtn.addEventListener("click", function () {
            addOption();


        });
        removeLastBtn.addEventListener("click", function () {
            removeLastOption();
        });
        delQuizBtn.addEventListener("click", function () {
            delQuiz();
        });
        exportJsonBtn.addEventListener("click", function () {
            exportJson();
        });

        fab.addEventListener("click", function () {
            if (editMode) {
                // 保存当前问题
                saveQuestion();
            } else if (!createMode) {
                // if (JSON.stringify(curQuestion) !== JSON.stringify(originQuestion[index])) {
                //     alert("题目未保存！");
                //     return;
                // }
                // 新建问题， 进入当前index = 当前question 长度页面
                window.location.href = "question.html?index=" + parseInt(questionJson['questions'].length + 1);
            } else {
                // 已经在新建问题了！
                alert("已经在新建问题了！");
            }
        });
        // 生成问题选项卡片列表
        showOptionList(question);
        if (createMode) {
            // 新增模式默认进入编辑模式
            switchMode();
        }
    });

    // 响应键盘A-Z,1-9 切换相应序号存在选项的selected class
    document.addEventListener("keydown", function (event) {
        // 检测tab键
        if (event.key === 'Tab') {
            event.preventDefault();
            // 切换编辑模式
            switchMode();
        }
        // alt 键 保存和新增
        if (event.key === 'Alt') {
            event.preventDefault();
            // 编辑模式保存 非编辑模式新建
            // 获取当前模式
            // 输出当前模式
            console.log(`editMode: ${editMode}, createMode: ${createMode}`);
            if (editMode) {
                // 保存当前问题
                saveQuestion();
            }
            else if (!createMode) {
                // 新建问题， 进入当前index = 当前question 长度页面
                window.location.href = "question.html?index=" + parseInt(questionJson['questions'].length + 1);
            }
            else {
                // 已经在新建问题了！
                alert("已经在新建问题了！");
            }

        }

        if (!editMode) {
            inRange = false;


            if (event.key === 'Control' && !doubleClick) {
                event.preventDefault();
                doubleClick = true;
                doubleClickTimer = setTimeout(() => {
                    doubleClick = false;
                }, 500);
                // toolbar提示双击Control切换下一题
                toolbarTitle.innerHTML = "双击Control切换下一题";
                setTimeout(() => {
                    toolbarTitle.innerHTML = editMode ? 'Editable' : 'Readonly';
                }, 1000);
                return;
            }
            if (event.key === 'Control' && doubleClick) {
                event.preventDefault();
                clearTimeout(doubleClickTimer);
                doubleClick = false;
                randomQuiz();
            }

            let index = 0;
            if (event.key >= 'a' && event.key <= 'z' || event.key >= 'A' && event.key <= 'Z') {
                // 确实是否触发方法，输出1
                index = optionCode.indexOf(event.key.toUpperCase());
                inRange = true;
            } else if (event.key >= '1' && event.key <= '7') {
                index = parseInt(event.key) - 1;
                inRange = true;
            }
            
            // 如果为空格 切换分析模式
            if (event.key === ' ') {
                switchAnalysis();
            }

            // 判断空格 或 回车 
            if (event.key === '0' || event.key === 'Enter') {
                // 如果有选中选项，提交判断是否正确，如果返回repeat则随机生成下一题
                if (!isAnswered) {
                    checkAnswer();
                } else {
                    randomQuiz();
                }

            }
            if (event.key === '8') {
                switchAnalysis();
            }
            if (event.key === '9') {
                switchModal();
            }



            if (inRange) {
                if (index < options.length) {
                    if (options[index] != null) {
                        options[index].item.classList.toggle("selected");
                    }
                }
            }
        }
    });

    statusButton.addEventListener("click", function () {
        switchMode();
    });
    // 获取当前页面的 User Agent 字符串
    var userAgent = navigator.userAgent;
    // 手机模式隐藏状态栏
    // 判断当前页面是否运行在移动设备上
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        document.querySelector(".toolbar").style.display = "none";
        fab.style.display = "none";
    } else {
        // 退出页面前检查是否与originQuestion相同
        window.onbeforeunload = function () {
            if (JSON.stringify(curQuestion) != JSON.stringify(originQuestion)) {
                // 输出 cur 和 origin ，对比不同
                console.log(curQuestion);
                console.log(originQuestion);
                return "确认离开当前页面吗？未保存的数据将会丢失";
            }
        }


    }

});

function loadData() {
    if (questionJson != null) {
        // 如果已经加载过该文件，则不需要重复加载
        return Promise.resolve(questionJson);
    } else {
        // 如果还没有加载过该文件，则发起请求并进行缓存
        // 加载res/quesLib.json
        // return fetch("../res/quesLib.json").then((response) => {
        //     return response.json();
        // });



        return fetch("/getJson").then((response) => {
            return response.json();
        });
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';//先重置一下高度
    textarea.scrollTop = 0; //防抖动
    textarea.style.height = textarea.scrollHeight + 'px';//设置高度
}

function randomQuiz() {

    // 如果获取存储变量为空值，初始化
    let res = getLocal();
    if (res.id == null) {
        res = initLocal();
        console.log("初始化");
    } else {
        // 获取值
        console.log("加载");
        // 如果expTime小于当前时间，重新初始化
        if (res.expTime < new Date().getTime()) {
            res = initLocal();
            console.log("超时，重新初始化");
        } else {

            console.log(`${res.index} < ${res.id.length}`);
            if (res.index == res.id.length - 1) {
                res = initLocal();
            } else {
                // 如果index小于id数组长度，获取下一个值
                res.index++;
                res.value = res.id[res.index];
                localStorage.setItem("index", res.index);
                localStorage.setItem("value", res.value);
            }
        }
    }

    console.log(res);
    console.log(res.value);
    window.location.href = "question.html?index=" + (parseInt(res.value) + 1);

    function initLocal() {
        let id = [], expTime, index, value;
        // 打乱id顺序
        for (let i = 0; i < questionJson['questions'].length; i++) {
            let num = Math.floor(Math.random() * questionJson['questions'].length);
            if (id.indexOf(num) == -1) {
                id.push(num);
            } else {
                i--;
            }
        }
        index = 0, value = id[0];
        // exp时间为当前时间+150分钟

        // 150 * 60 * 1000
        // 测试模式调整为30分钟，后面调整为可选择
        expTime = new Date().getTime() + (30 * 60 * 1000);

        localStorage.setItem("id", id);
        localStorage.setItem("expTime", expTime);
        localStorage.setItem("index", index);
        localStorage.setItem("value", value);
        return {
            id, expTime, index, value
        }
    }

    function getLocal() {
        let id, expTime, index, value;
        id = localStorage.getItem("id");

        // id转为整数数组
        if (id != null) {
            id = id.split(",");
            for (let i = 0; i < id.length; i++) {
                id[i] = parseInt(id[i]);
            }
            console.log(id);
        }

        expTime = localStorage.getItem("expTime");
        index = localStorage.getItem("index");
        value = localStorage.getItem("value");
        // 返回可修改对象
        return {
            id, expTime, index, value
        }
    }

}

function addOption() {
    // 最多不超过24个选项
    if (options.length >= 26) {
        alert("最多不超过26个选项！");
        return;
    }
    // 新建选项
    let optionList = document.querySelector(".question-list");
    i = options.length;
    createOption(i, "", optionList);

}

function removeLastOption() {
    // 检查选项数量，不允许少于2个选项
    if (options.length <= 2) {
        alert("至少需要两个选项！");
        return;
    }
    // 删除最后一个选项
    let lastOption = options.pop();
    lastOption.item.remove();

}

function saveQuestion() {
    // 保存当前index页面的问题
    // index 其实等于 题目的id，-1等于索引
    let url = new URL(window.location.href);
    let index = url.searchParams.get("index") - 1;
    // 设置curQuestion相应title, content 为当前页面已输入内容
    curQuestion['title'] = titleInput.value;
    curQuestion['content'] = editor.getValue();
    curQuestion['analysis'] = analysisInput.value;
    // 添加options
    curQuestion['options'] = [];
    for (let i = 0; i < options.length; i++) {
        curQuestion['options'].push(options[i].mEditor.getValue());
    }


    // 遍历options，有selected为1，无则0，多个selected时设置type为多选(1),否则单选(0)
    let selectedCount = 0;
    let answer = "";
    for (let i = 0; i < options.length; i++) {
        if (options[i].item.classList.contains("selected")) {
            selectedCount++;
            answer += 1;
        } else {
            answer += 0;
        }
    }
    if (selectedCount > 1) {
        curQuestion['type'] = 1;
    } else {
        curQuestion['type'] = 0;
    }
    curQuestion['answer'] = answer;
    // 输出当前question 
    console.log(curQuestion);
    // 如果不是新建模式检查题目和originQuestion对比是否有变动
    if (!createMode) {
        if (JSON.stringify(curQuestion) == JSON.stringify(originQuestion[index])) {
            alert("题目未修改！");
            return;
        }
    }
    // 检查题目是否为空
    if (curQuestion['title'] == "") {
        alert("保存失败:题目不能为空！");
        return;
    }
    // 检查选项是否为空
    if (options.length < 2) {
        alert("保存失败:至少需要两个选项！");
        return;
    }
    // 检查答案是否为空
    if (curQuestion['answer'].indexOf("1") == -1) {
        alert("保存失败:答案不能为空！");
        return;
    }

    // 更新到questionJson

    // 如果questionJson index < 长度，则替换，否则添加

    console.log(`index: ${index}, length: ${questionJson['questions'].length}`);
    if (index <= questionJson['questions'].length) {
        questionJson['questions'][index] = curQuestion;
    } else {
        questionJson['questions'].push(curQuestion);
    }
    // 发送请求给flask后端以更新json
    fetch("/updateJson", {
        method: "POST",
        body: JSON.stringify(questionJson),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        // return response.json();
        // 返回'error'则提示不允许修改题库

        // 获取flask后端返回内容

        response.text().then((result) => {
            if (result == 'error') {
                alert("未开放修改题库！");
            } else {
                alert("保存成功！");
                if (createMode) {
                    // 新建模式，切换到只读模式
                    createMode = false;
                    switchMode();
                }
            }
        });
        console.log(result);
    })

    // 更新originQuestion
    originQuestion = JSON.parse(JSON.stringify(curQuestion));



}

function delQuiz() {
    if (confirm("确定删除该题目吗？")) {
        // 暂未允许删除题目
        alert("暂未允许删除题目！");
    }
}

function switchModal() {
    let infoModal = document.querySelector(".modal");
    let recordList = document.querySelector(".record-list");
    // 切换modal显示状态
    if (infoModal.style.display == "flex") {
        infoModal.style.display = "none";
    } else {
        infoModal.style.display = "flex";

        // 获取 /getRecord json, 生成列表并弹窗显示

        fetch("/getRecord").then((response) => {
            return response.json();
        }).then((data) => {
            data = data['quesRecord']
            console.log(data);

            recordList.innerHTML = "";
            for (let i = 0; i < data.length; i++) {
                let record = data[i];
                // record = {createTime": 1685350761.2176547, "total": 3, "correct": 2, "rate": 0.67, "finish": true}
                let li = document.createElement("li");
                // 显示record 为item <finsih:已结束/未结束>- 正确率: <rate:百分比显示> <correct>/<total> - <createTime> - <remainTime:<now-createTime-local.expTime>
                let finish = record['finish'] ? "已结束" : "未结束";
                let rate = record['rate'] * 100;
                let correct = record['correct'];
                let total = record['total'];
                let createTime = new Date(record['createTime'] * 1000 ).toLocaleString();
                let item = `${finish} - 正确率: ${rate.toFixed(2)}% ${correct}/${total} - ${createTime}  ${record['finish'] ? "" : "-"}`;
                li.innerHTML = item;
                recordList.appendChild(li);
            }
        });
        // 滚动到recordList底部
        recordList.scrollTop = recordList.scrollHeight;
        // 点击modal外侧关闭modal
        infoModal.onclick = function (e) {
            if (e.target == infoModal) {
                infoModal.style.display = "none";
            }
        }
    }

}

function exportJson() {
    // 生成json文件
    let dataStr = JSON.stringify(questionJson);
    let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    let exportFileDefaultName = 'quesLib.json';
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}




function checkAnswer() {
    let answer = "";

    for (let i = 0; i < options.length; i++) {
        // 获取options[i].item的class 是否包含selected
        let selected = options[i].item.classList.contains("selected");
        answer += selected ? "1" : "0";
    }

    // 检查是否已选择答案
    if (answer.indexOf("1") == -1) {
        alert("请先选择答案！");
        return;
    }

    // 输出当前答案和参考答案
    console.log("当前答案：" + answer);
    console.log("参考答案：" + curQuestion['answer']);
    let correct = false;
    if (answer === curQuestion['answer']) {
        correct = true;
        // alert("回答正确");
    }
    else {
        // alert("回答错误");
    }
    // 设置toolbar title为已提交(正确/错误)，1s后恢复
    toolbarTitle.innerHTML = "已提交" + (correct ? "(正确)" : "(错误)") + "！";
    setTimeout(() => {
        toolbarTitle.innerHTML = editMode ? 'Editable' : 'Readonly';
    }, 1000);
    // 提交id 、 correct、answer 到后端
    fetch("/submitAnswer", {
        method: "POST",
        body: JSON.stringify(
            {
                "id": curQuestion['id'],
                "correct": correct,
                "answer": answer
            }
        ),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        console.log(response);
    }).then((data) => {
        console.log(data);
    });

    isAnswered = true;
}

function switchAnalysis() {
    analysisMode = !analysisMode;
    analysisCard.style.display = analysisMode ? "flex" : "none";
    autoResize(analysisInput);
    // 使页面滚动到底部
    window.scrollTo(0, document.body.scrollHeight);
}

function switchMode() {
    editMode = !editMode;
    // 获取该控件下的i标签，设置它的class
    let icon = statusButton.querySelector("i");
    icon.className = editMode ? "fa fa-edit" : "fa fa-eye";
    fab.querySelector("i").className = editMode ? "fa fa-save" : "fa fa-plus";
    toolbarTitle.innerHTML = editMode ? 'Editable' : 'Readonly';
    editor.setOption("readOnly", !editMode);
    let answer = curQuestion['answer'];
    for (let i = 0; i < options.length; i++) {
        options[i].mEditor.setOption("readOnly", !editMode);
        // 根据答案选择设置selected
        options[i].item.classList.toggle("selected", answer[i] === '1');
    }
    if (!editMode) {
        // 全部选项设置为未选中
        for (let i = 0; i < options.length; i++) {
            options[i].item.classList.remove("selected");
        }
    }
    analysisMode = !editMode;
    switchAnalysis();
    titleInput.readOnly = !editMode;
    analysisInput.readOnly = !editMode;
    // 切换testmode 和 editmode div
    normalModeDiv.style.display = editMode ? "none" : "flex";
    editModeDiv.style.display = editMode ? "flex" : "none";

}

// 判断是否修改了内容
function checkModified() {
    const jsonString = JSON.stringify(question);
    return jsonString !== JSON.stringify(originQuestion);
}

// 显示传入json列表
function showOptionList(question) {
    let optionList = document.querySelector(".question-list");
    optionList.innerHTML = "";
    for (let i = 0; i < question['options'].length; i++) {
        createOption(i, question['options'][i], optionList);
    }

}

function createOption(i, option, optionList) {
    let item = document.createElement("div");
    let itemTitle = document.createElement("textarea");
    let itemOrder = document.createElement("span");
    item.classList.add("question-card");
    itemTitle.id = "option" + (i + 1);
    itemOrder.innerHTML = optionCode[i] + ".";
    itemOrder.classList.add("order");

    itemTitle.innerHTML = option;
    item.appendChild(itemTitle);

    item.insertBefore(itemOrder, itemTitle);
    optionList.appendChild(item);

    mEditor = CodeMirror.fromTextArea(itemTitle, {
        readOnly: !editMode,
        mode: "text/x-java",
    });
    options[i] = {
        item,
        mEditor
    };

    item.addEventListener("click", function () {
        console.log("click");
        item.classList.toggle("selected");
    });
    autoResize(itemTitle);
}