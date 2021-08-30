var typing = false;
var lastTypingTime;
var i = 0;
$(document).ready(() => {
  socket.emit('join room', chatId);
  socket.on('typing', () => {
    $('.typingDots').show();
  });
  socket.on('stop-typing', () => {
    $('.typingDots').hide();
  });

  $.get(`/api/chat/${chatId}`, (data) => {
    // console.log(data);
    $('#chatName').text(getChatName(data));
  });

  $.get(`/api/chat/${chatId}/message`, (data) => {
    var messages = [];
    var lastSenderId = '';
    // console.log(data);
    data.forEach((message, index) => {
      var html = createMessageHtml(message, data[index + 1], lastSenderId);
      messages.push(html);

      lastSenderId = message.sender._id;
    });
    var messagesHtml = messages.join('');
    addMessagesHtmlToPage(messagesHtml);
    scrollToBottom(false);

    $('.loadingSpinnerContainer').remove();
    $('.chatContainer').css('visibility', 'visible');
  });
});

$('#chatNameButton').click(() => {
  var name = $('#chatNameTextbox').val().trim();
  $.ajax({
    url: '/api/chat/' + chatId,
    type: 'PUT',
    data: { chatName: name },
    success: (data, status, xhr) => {
      if (xhr.status != 204) {
        alert('could not update');
      } else {
        location.reload();
      }
    },
  });
});

$('.sendMessageButton').click(() => {
  messageSubmited();
});

$('.inputTextBox').keydown((event) => {
  updateTyping();
  if (event.which === 13) {
    messageSubmited();
    return false;
  }
});
function updateTyping() {
  if (!connected) return;
  if (!typing) {
    typing = true;
    socket.emit('typing', chatId);
  }

  lastTypingTime = new Date().getTime();

  var timerLength = 3000;
  setTimeout(() => {
    var timeNow = new Date().getTime();
    var timeDiff = timeNow - lastTypingTime;
    if (timeDiff >= timerLength && typing) {
      socket.emit('stop-typing', chatId);

      typing = false;
    }
  }, timerLength);
}
function messageSubmited() {
  const content = $('.inputTextBox').val().trim();

  if (content != '') {
    socket.emit('stop-typing', chatId);
    typing = false;
    sendMessage(content);
    $('.inputTextBox').val('');
  }
}
function sendMessage(content) {
  $.post(
    `/api/messages`,
    { content: content, chatId: chatId },
    (results, status, xhr) => {
      if (xhr.status != 200) {
        alert('something error');
        $('.inputTextBox').val(content);
        return;
      }
      addChatMessageHtml(results);
      socket.emit('new message', results);
    }
  );
}
function addMessagesHtmlToPage(html) {
  $('.chatMessages').append(html);

  // TODO: SCROLL TO BOTTOM
}
function addChatMessageHtml(message) {
  if (!message || !message._id) {
    alert('Message is not valid');
    return;
  }

  var messageDiv = createMessageHtml(message);
  addMessagesHtmlToPage(messageDiv);
  scrollToBottom(true);
}

function createMessageHtml(message, nextMessage, lastSenderId) {
  var sender = message.sender;
  var senderName = sender.firstName + ' ' + sender.lastName;

  var currentSenderId = sender._id;
  var nextSenderId = nextMessage != null ? nextMessage.sender._id : '';

  var isFirst = lastSenderId != currentSenderId;
  var isLast = nextSenderId != currentSenderId;

  var isMine = message.sender._id == userLoggedIn._id;
  //  console.log(message.sender._id, userLoggedIn._id);
  var liClassName = isMine ? 'mine' : 'theirs';
  var nameElement = '';
  if (isFirst) {
    liClassName += ' first';

    if (!isMine) {
      nameElement = `<span class='senderName'>${senderName}</span>`;
    }
  }

  var profileImage = '';
  if (isLast) {
    liClassName += ' last';
    profileImage = `<img src='${sender.profilePic}'>`;
  }

  var imageContainer = '';
  if (!isMine) {
    imageContainer = `<div class='imageContainer'>
                                ${profileImage}
                            </div>`;
  }

  return `

          <li class='message ${liClassName}'>
                ${imageContainer}
                <div class='messageContainer'>
                    ${nameElement}
                    <span class='messageBody'>
                        ${message.content}
                    </span>
                </div>
            </li>`;
}

function scrollToBottom(animated) {
  var container = $('.chatMessages');
  var scrollHeight = container[0].scrollHeight;

  if (animated) {
    container.animate({ scrollTop: scrollHeight }, 'slow');
  } else {
    container.scrollTop(scrollHeight);
  }
}
