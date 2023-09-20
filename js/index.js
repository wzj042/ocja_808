// 页面组件
let searchButton;
let searchBox;
let searchBoxInput;
let closeButton;
let toolbarTitle;
let searchHint;

// 页面变量
// res/question.json
let questionJson;
/**
 * 支持查找关键词并显示包含文字的item，显示所有列表，点击
 */

document.addEventListener("DOMContentLoaded", function () {
  // 获取页面组件
  searchHint = document.querySelector(".search-hint");

  // 加载res下的json文件

  loadData().then((data) => {
      questionJson = data;
      console.log("当前词库共有" + questionJson['questions'].length + "个问题");
      
      // 生成问题列表
      showList(questionJson);
    });
  // TOOLBAR METHOD
  searchButton = document.querySelector(".search-button");
  searchBox = document.querySelector("#search-box");
  searchBoxInput = document.querySelector("#search-box input[type='text']");
  toolbarTitle = document.querySelector(".toolbar .title");
  closeButton = document.querySelector("#close-button");
  
  
  /**
   * Toolbar 搜索框事件
   * 1. 点击搜索按钮，显示搜索框
   * 2.搜索框显示下点击搜索按钮，搜索内容
   * 3.搜索框显示下点击关闭按钮，关闭搜索框
   * 4.搜索框显示下响应enter键，搜索内容
   */
  {

    searchButton.addEventListener("click", function () {
      if (searchBox.style.display === "inline-block") {
        searchQuetsion(searchBoxInput.value);
        return;
      }
      setTimeout(() => {
        searchBoxInput.classList.add('active');
        searchBoxInput.focus();
      }, 233);
      searchBox.style.display = "inline-block";
    });
    
    searchBoxInput.addEventListener("keydown", function (event) {
      if (event.key === 'Enter') {
        searchHint.style.display = "none";
        searchQuetsion(searchBoxInput.value);
        return;
      }
    });

    closeButton.addEventListener("click", function () {
      searchBox.style.display = "none";
      searchHint.style.display = "none";
      showList(questionJson);
    });
  }

});

// 搜索问题
function searchQuetsion(searchContent) {
  if (searchContent !== "") {
    // 查询questionJson中'question title, content, option中包含searchContent的列表，高亮设置关键字，更新列表
    
    let newQuestionJson = {
      "questions": []
    };  
    for (let i = 0; i < questionJson['questions'].length; i++) {
      let question = questionJson['questions'][i];
      // 克隆一份question
      question = JSON.parse(JSON.stringify(question));
      let index = question['title'].indexOf(searchContent);
      let addquestion = null;
      if (index !== -1) {
        addquestion = question;
        addquestion['title'] = addquestion['title'].replace(searchContent, "<span class='highlight'>" + searchContent + "</span>");
      } else if ((index=question['content'].indexOf(searchContent)) !== -1) {
        addquestion = question;
        addquestion['content'] = addquestion['content'].replace(searchContent, "<span class='highlight'>" + searchContent + "</span>");
        // 如果content过长，优先显示替换内容部分
        if (addquestion['content'].length > 100) {
          addquestion['content'] = addquestion['content'].substring(index-50, index+50);
        }
      } // 匹配选项内容，如果匹配到则添加到列表中
      else {
        question['content'] = '选项:';
        for (let j = 0; j < question['options'].length; j++) {
          let option = question['options'][j];
          if ((index=option.indexOf(searchContent)) !== -1) {
            addquestion = question;
            addquestion['content'] += addquestion['options'][j].replace(searchContent, "<span class='highlight'>" + searchContent + "</span>");
            break;
          }
        }
      }

      if (addquestion !== null) {
        newQuestionJson['questions'].push(addquestion);
      }
      
    }
    
    showList(newQuestionJson);
    if (newQuestionJson['questions'].length === 0) {
      searchHint.style.display = "block";
      searchHint.innerHTML = "没有找到相关问题";
    } else {
      // 显示搜索条数，条数高亮显示
      searchHint.style.display = "block";
      searchHint.innerHTML = "共找到<span class='highlight'>" + newQuestionJson['questions'].length + "</span>个相关问题";
    }
  }
  return;
}

function loadData() {
  if (questionJson != null) {
      // 如果已经加载过该文件，则不需要重复加载
      return Promise.resolve(questionJson);
  } else {
      // 如果还没有加载过该文件，则发起请求并进行缓存
      return fetch("/getJson").then((response) => {
          return response.json();
      });
  }
}

// 显示传入json列表
function showList(questionJson) {
  let questionList = document.querySelector(".listview");
  questionList.innerHTML = "";
      for (let i = 0; i < questionJson['questions'].length; i++) {
        let item = document.createElement("div");
        let questionItem = document.createElement("li");
        let itemTitle = document.createElement("h2");
        let itemDesc = document.createElement("p");
        let curQuestion = questionJson['questions'][i];
        item.classList.add("listview-item");
        questionItem.classList.add("listview-item-content");
        itemTitle.classList.add("listview-item-title");
        itemDesc.classList.add("listview-item-desc");

        itemTitle.innerHTML = curQuestion['title'];
        itemDesc.innerHTML = curQuestion['content'];
        
        questionItem.appendChild(itemTitle);
        questionItem.appendChild(itemDesc);
        item.appendChild(questionItem);
        questionList.appendChild(item);
        // 设置item点击携带该子json的index跳转到另一个页面
        item.addEventListener("click", function () {
          // 跳转到question页面
          window.location.href = "question.html?index=" + curQuestion['id'];
        });
      }
}