$(document).ready(() => {
  $.get('/api/chat/', (data, status, xhr) => {
    if (xhr.status === 400) {
      alert('Could not get chat list.');
    } else {
      outputChatList(data, $('.resultContainer'));
    }
  });
});

function outputChatList(chatList, container) {
  chatList.forEach((chat) => {
    var html = createChatHtml(chat);
    container.append(html);
  });

  if (chatList.length == 0) {
    container.append("<span class='noResults'>Nothing to show.</span>");
  }
}

function createChatHtml(chatData) {
  var chatName = getChatName(chatData);
  // console.log(chatName);
  var image = getChatImageElements(chatData);
  //console.log(image);
  var latestMessage = getLatestMessage(chatData.latestMessage);

  return `<a href='/messages/${chatData._id}' class='resultListItem'>
                  ${image}
                  <div class='resultsDetailsContainer ellipsis'>
                      <span class='heading ellipsis'>${chatName}</span>
                      <span class='subText ellipsis'>${latestMessage}</span>
                  </div>
              </a>`;
}
function getLatestMessage(latestMessage) {
  if (latestMessage != null) {
    var sender = latestMessage.sender;
    return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
  }

  return 'New chat';
}

function getChatName(chatData) {
  if (!chatData.chatName) {
    //console.log(chatData.users);
    const arr = [];
    const listUser = chatData.users;
    listUser.map((data) => {
      arr.push(data.firstName + ' ' + data.lastName);
    });
    return arr.join(',');
  }
  return chatData.chatName;
}
function getChatImageElements(chatData) {
  var chatImage = getUserChatImageElement(chatData.users[0]);

  var groupChatClass = '';
  if (chatData.users.length > 1) {
    chatImage += getUserChatImageElement(chatData.users[1]);
    groupChatClass = 'groupChatImage';
  }
  return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
}

function getUserChatImageElement(user) {
  if (!user || !user.profilePic) {
    return alert('User passed into function is invalid');
  }

  return `<img src='${user.profilePic}' alt='User's profile pic'>`;
}
