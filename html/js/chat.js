//Global variables
let CurrentReceiver = "";
let messageCount = 0;
let lastMessageTime = Date.now();

function displayMessageInChat(sender, messageText) {
  const chatContainer = document.querySelector(".chat-container");

  const messageContainer = document.createElement("div");
  messageContainer.className = sender === "user" ? "message sent" : "message received";

  const timestamp = document.createElement("small");
  timestamp.className = "timestamp";
  timestamp.textContent = new Date().toLocaleString(); // Set the current timestamp
  messageContainer.appendChild(timestamp);

  const messageElem = document.createElement("p");
  messageElem.textContent = messageText;
  messageContainer.appendChild(messageElem);

  chatContainer.appendChild(messageContainer);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessageToOpenAI(messageText) {
  const apiKey = "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";
  const prompt = `Your prompt text: ${messageText}`;

  // Display the user's message in the chat window
  displayMessageInChat("user", messageText);

  try {
    const response = await fetch("https://api.openai.com/v1/engines/text-davinci-003/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 100,
        n: 1,
        stop: null,
        temperature: 1,
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      // Handle the OpenAI API response
      const botResponse = data.choices[0].text;
      // Display the Bot's response in your chat window
      displayMessageInChat("bot", botResponse);
    }
  } catch (error) {
    console.error("Error while fetching data from OpenAI API:", error);
  }
}

// Debounce function to prevent spamming the server with messages
function debounce(func, wait) {
  let timeout;
  let isCooldown = false;

  return function (...args) {
    const context = this;

    if (!isCooldown) {
      func.apply(context, args);
      isCooldown = true;

      setTimeout(() => {
        isCooldown = false;
      }, wait);
    }
  };
}

// debouncedSendMessage is a function that can be called multiple times
const debouncedSendMessage = (user, messageText) =>
  debounce(sendMessage, 1000)(user, messageText);

// Throttle function to prevent loading all chat messages.
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function (...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
          console.log("Throttled function ran");
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// function to sort users by last message
function moveUserToTop(userId) {
  console.log("Moving user to top: " + userId);
  const usersDiv = document.getElementById("user-list");
  const userContainer = document.getElementById("user-" + userId);
  //console.log("userContainer: ", userContainer)
  if (userContainer) {
    console.log("userContainer: ", userContainer);
    usersDiv.removeChild(userContainer);
    usersDiv.insertBefore(userContainer, usersDiv.children[0]);
  }
}

// shows a bubble when a user gets a message from another user (if the chat window is not open)
function showBubbleGif(recipientId) {
  //console.log("Showing bubble gif for recipient " + recipientId);
  var bubbles = document.querySelectorAll(
    '.bubble[data-recipient="' + recipientId + '"]'
  );
  for (var i = 0; i < bubbles.length; i++) {
    bubbles[i].style.display = "block";
    moveUserToTop(recipientId);
  }
}

// hides a bubble when a user gets a message from another user (if the chat window is open)
function hideBubbleGif(recipientId) {
  //console.log("Showing bubble gif for recipient " + recipientId);
  var bubbles = document.querySelectorAll(
    '.bubble[data-recipient="' + recipientId + '"]'
  );
  for (var i = 0; i < bubbles.length; i++) {
    bubbles[i].style.display = "none";
  }
}

// function to standardize the message text
function standardizeInput(message) {
  // remove leading and trailing spaces
  message = message.trim();

  // remove any extra spaces between words
  message = message.replace(/\s+/g, " ");

  return message;
}

// Create a chat window element and append it to the DOM
const chatWindow = document.createElement("div");
chatWindow.id = "chat-window";
document.body.appendChild(chatWindow);

// Create a typing indicator element
const typingIndicator = document.createElement("div");
typingIndicator.className = "typing-indicator";
typingIndicator.style.display = "none"; // Initially hide the typing indicator

// Create three dots for the typing indicator
for (let i = 0; i < 3; i++) {
  const dot = document.createElement("div");
  dot.className = "typing-dot";
  typingIndicator.appendChild(dot);
}

// Create a container for the chat window header and the typing indicator
function openChatWindow(user) {
  console.log("The user is: ", user);
  if (user.username === "Special-Friend") {
    // Create a header container for the chat window
    const headerContainer = document.createElement("div");
    headerContainer.className = "header-container";
    headerContainer.style.position = "sticky";
    // Set the top position of the header container to 0 so that it sticks to the top of the chat window
    headerContainer.style.top = "0";
    headerContainer.style.zIndex = "1";

    // Create a header for the chat window
    const chatHeader = document.createElement("div");
    chatHeader.className = "chat-header-bot";
    chatHeader.textContent = "Dont be lonely, talk to me!";

    headerContainer.appendChild(chatHeader);

    // Create a close button for the chat window
    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.addEventListener("click", () => {
      chatWindow.innerHTML = "";
      lastChatUser = currentChatUser;
      currentChatUser = null;
      // Remove the chat-window class from the chat window
      chatWindow.classList.remove("chat-window");
    });

    // Append the close button to the chat header
    chatHeader.appendChild(closeButton);

    // Create a container for the chat messages
    const chatContainer = document.createElement("div");
    chatWindow.classList.add("chat-window"); // Add the chat-window class
    chatContainer.className = "chat-container";

    // Create a container for the message input and send button
    const inputContainer = document.createElement("div");
    inputContainer.className = "input-container-chat";

    // Create the message input field
    const messageInput = document.createElement("input");
    messageInput.type = "text";
    messageInput.placeholder = "Type your message...";
    inputContainer.appendChild(messageInput);

    messageInput.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        // Prevent the default behavior of the Enter key, which is to add a new line
        event.preventDefault();
        // Call the sendMessageToOpenAI function to send the message
        await sendMessageToOpenAI(messageInput.value);
        // Clear the message input field
        messageInput.value = "";
      }
      // Scroll to the bottom of the chat window
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    // Create the send button
    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";
    sendButton.addEventListener("click", async () => {
      await sendMessageToOpenAI(messageInput.value);
      console.log("Sending message: " + messageInput.value);
      // Clear the message input field
      messageInput.value = "";
    });
    inputContainer.appendChild(sendButton);

    // Add the header container, chat container, and input container to the chat window
    chatWindow.innerHTML = "";
    chatWindow.appendChild(headerContainer);
    chatWindow.appendChild(chatContainer);
    chatWindow.appendChild(inputContainer);

    // Scroll to the bottom of the chat window
    chatContainer.scrollTop = chatContainer.scrollHeight;

    //stop function
    return;
  }
  hideBubbleGif(user.username);
  console.log("Opening chat window with user: " + user.username);

  // Set the current receiver to the user that was clicked
  CurrentReceiver = user.username;

  // Populate the chat window with the conversation history between the two users (if it exists)
  getChatHistory(user, (chatHistory) => {
    const history = JSON.parse(chatHistory);

    // Create a header container for the chat window
    const headerContainer = document.createElement("div");
    headerContainer.className = "header-container";
    headerContainer.style.position = "sticky";
    // Set the top position of the header container to 0 so that it sticks to the top of the chat window
    headerContainer.style.top = "0";
    headerContainer.style.zIndex = "1";

    // Create a header for the chat window
    const chatHeader = document.createElement("div");
    chatHeader.className = "chat-header";
    chatHeader.textContent = "Chatting with " + user.username;

    headerContainer.appendChild(chatHeader);

    // Create a close button for the chat window
    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.addEventListener("click", () => {
      chatWindow.innerHTML = "";
      lastChatUser = currentChatUser;
      currentChatUser = null;
      // Remove the chat-window class from the chat window
      chatWindow.classList.remove("chat-window");
    });

    // Append the close button to the chat header
    chatHeader.appendChild(closeButton);

    // Create a container for the chat messages
    const chatContainer = document.createElement("div");
    chatWindow.classList.add("chat-window"); // Add the chat-window class
    chatContainer.className = "chat-container";

    // Array to store received messages
    const receivedMessages = [];

    // Loop through each message in the chat history and display it in the chat window
    history.chathistory.reverse().forEach((message) => {
      console.log(
        "message.from:",
        message.from,
        "user.id:",
        sessionStorage.getItem("username")
      );
      const messageContainer = document.createElement("div");
      messageContainer.className =
        message.from === sessionStorage.getItem("username")
          ? "message sent"
          : "message received";

      const timestamp = document.createElement("small");
      timestamp.className = "timestamp";
      timestamp.textContent = new Date(message.createdat).toLocaleString();
      messageContainer.appendChild(timestamp);

      const messageText = document.createElement("p");
      messageText.textContent = message.text;
      messageContainer.appendChild(messageText);

      chatContainer.appendChild(messageContainer);

      // Add received messages to the array
      if (message.from !== user.id) {
        receivedMessages.push(message);
      }
    });

    // Create a container for the message input and send button
    const inputContainer = document.createElement("div");
    inputContainer.className = "input-container-chat";

    // Create the message input field
    const messageInput = document.createElement("input");
    messageInput.type = "text";
    messageInput.placeholder = "Type your message...";
    inputContainer.appendChild(messageInput);

    // Create the typing indicator
    inputContainer.appendChild(typingIndicator);

    let typingTimer; // Declare a variable to store the typing timer

    // Add an event listener to the message input field to detect when a key is pressed and send a typing event to the server
    messageInput.addEventListener("keydown", (event) => {
      // Clear any existing typing timer
      clearTimeout(typingTimer);

      // Construct the message object
      const stopTypingMessage = {
        type: "typing",
        data: {
          from: sessionStorage.getItem("username"),
          to: user.username,
        },
      };

      // send the message object as a JSON string to the server
      socket.send(JSON.stringify(stopTypingMessage));

      // Set a timer to send a stoptyping message after 3 seconds of inactivity
      typingTimer = setTimeout(() => {
        // Construct the message object
        const stopTypingMessage = {
          type: "stopTyping",
          data: {
            from: sessionStorage.getItem("username"),
            to: user.username,
          },
        };

        // send the message object as a JSON string to the server
        socket.send(JSON.stringify(stopTypingMessage));
      }, 3000); // The number of milliseconds to wait before sending the stoptyping message (3000ms = 3s)
    });

    // Add an event listener to the message input field to detect when the Enter key is pressed
    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        // Prevent the default behavior of the Enter key, which is to add a new line
        event.preventDefault();
        // Call the sendMessage function to send the message
        debouncedSendMessage(user, messageInput.value);
        //console.log("Sending message: " + messageInput.value);
        // Clear the message input field
        messageInput.value = "";
      }
      // Scroll to the bottom of the chat window
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    // Create the send button
    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";
    sendButton.addEventListener("click", () => {
      debouncedSendMessage(user, messageInput.value);
      console.log("Sending message: " + messageInput.value);
      // Clear the message input field
      messageInput.value = "";
    });
    inputContainer.appendChild(sendButton);

    // Add the header container, chat container, and input container to the chat window
    chatWindow.innerHTML = "";
    chatWindow.appendChild(headerContainer);
    chatWindow.appendChild(chatContainer);
    chatWindow.appendChild(inputContainer);

    document.querySelector(".left-sidebar").style.display = "block";
    document.querySelector(".right-sidebar").style.display = "block";
    document.querySelector(".posts").style.display = "block";
    document.querySelector(".container").style.display = "flex";
    document.querySelector(".container").style.justifyContent = "space-between";
    document.querySelector(".container").style.marginTop = "20px";
    document.querySelector(".container").style.flexWrap = "wrap";
    document.getElementById("login-form").style.display = "none";
    document.querySelector(".register-form").style.display = "none";
    document.getElementById("logged-in-message").style.display = "block";
    document.getElementById("logout-form").style.display = "block";

    // Variables for handling chat history loading
    let start = 0;
    let limit = 10;
    let isLoading = false;

    // Throttled function to load more messages when scrolling up
    const loadMoreMessages = throttle(() => {
      if (!isLoading && chatContainer.scrollTop === 0) {
        isLoading = true;
        start += limit;
        getChatHistory(
          user,
          (chatHistory) => {
            const history = JSON.parse(chatHistory);
            const newMessages = history.chathistory;

            // Store the scroll height before adding new messages
            const oldScrollHeight = chatContainer.scrollHeight;

            newMessages.forEach((message) => {
              const messageContainer = document.createElement("div");
              messageContainer.className =
                message.from === sessionStorage.getItem("username")
                  ? "message sent"
                  : "message received";

              const timestamp = document.createElement("small");
              timestamp.className = "timestamp";
              timestamp.textContent = new Date(
                message.createdat
              ).toLocaleString();
              messageContainer.appendChild(timestamp);

              const messageText = document.createElement("p");
              messageText.textContent = message.text;
              messageContainer.appendChild(messageText);

              // Prepend the new messages to the chat container
              chatContainer.insertBefore(
                messageContainer,
                chatContainer.firstChild
              );
            });

            // Set the scroll position to the difference between the new scroll height and the old scroll height
            chatContainer.scrollTop =
              chatContainer.scrollHeight - oldScrollHeight;

            isLoading = false;
          },
          start,
          limit
        );
      }
    }, 500);

    // Add scroll event listener to the chat container
    chatContainer.addEventListener("scroll", loadMoreMessages);

    // Scroll to the bottom of the chat window
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

// Function to get the conversation history between two users
function getChatHistory(user, callback, start = 0, limit = 10) {
  const message = JSON.stringify({
    type: "get_chat_history",
    user: user,
    from: sessionStorage.getItem("username"),
    start: start,
    limit: limit,
  });

  socket.send(message);

  // Function to handle the response from the server
  function handleChatHistoryResponse(event) {
    const message = JSON.parse(event.data);
    if (message.type === "chat_history") {
      const chatHistory = JSON.stringify(message);
      callback(chatHistory);

      // Remove the event listener once the response is received and processed
      socket.removeEventListener("message", handleChatHistoryResponse);
    }
  }

  // Add event listener to handle the response from the server
  socket.addEventListener("message", handleChatHistoryResponse);
}

function sendMessage(user, messageText) {
  const currentTime = Date.now();
  const timeDiff = currentTime - lastMessageTime;

  // Reset the message count if more than 3 seconds have passed since the last message
  if (timeDiff > 750) {
    messageCount = 0;
    lastMessageTime = currentTime;
  }

  // If the message count is less than the allowed limit, send the message
  if (messageCount < 1) {
    messageCount++;

    // Construct the message object
    const message = {
      type: "message",
      from: sessionStorage.getItem("username"),
      to: user.username,
      text: messageText,
    };

    message.text = standardizeInput(message.text);
    // Send the message to the server
    if (message.text.length > 0 && message.text.length < 100) {
      socket.send(JSON.stringify(message));
    } else {
      alert("Message must be between 1 and 100 characters");
    }

    // Update the chat window with the new message
    if (message.text.length > 0 && message.text.length < 100) {
      const chatContainer = document.querySelector(".chat-container");
      const messageContainer = document.createElement("div");
      messageContainer.className = "message sent";

      const timestamp = document.createElement("small");
      timestamp.className = "timestamp";
      timestamp.textContent = new Date().toLocaleTimeString();
      messageContainer.appendChild(timestamp);

      if (message.from != user.username) {
        const messageTextElem = document.createElement("p");
        messageTextElem.textContent = messageText;
        messageContainer.appendChild(messageTextElem);
      }

      chatContainer.appendChild(messageContainer);
      // Scroll the chat window to the bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
      // Clear the message input field
      const messageInput = document.querySelector(
        ".input-container-chat input"
      );
      messageInput.value = "";
    }
  } else {
    // Show a warning message to the user
    const warningMessage = "Please do not spam the chat.";
    const chatContainer = document.querySelector(".chat-container");
    const warningContainer = document.createElement("div");
    warningContainer.className = "warning-message";

    const warningTextElem = document.createElement("p");
    warningTextElem.textContent = warningMessage;
    warningContainer.appendChild(warningTextElem);

    chatContainer.appendChild(warningContainer);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Listen for received messages from the server
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "message") {
    console.log("Received message: ", message);
    const chatContainer = document.querySelector(".chat-container");

    if (chatContainer) {
      // Check if the chat container exists
      const receivedMessageContainer = document.createElement("div");
      receivedMessageContainer.className = "message received";

      const timestamp = document.createElement("small");
      timestamp.className = "timestamp";
      timestamp.textContent = new Date().toLocaleTimeString();
      receivedMessageContainer.appendChild(timestamp);

      const receivedMessageTextElem = document.createElement("p");
      receivedMessageTextElem.textContent = message.text;
      receivedMessageContainer.appendChild(receivedMessageTextElem);

      chatContainer.appendChild(receivedMessageContainer);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    } else if (message.from != sessionStorage.getItem("username")) {
      // Show bubble.gif when the chat window is not open and the message is not from the current user
      //console.log("Debug: ", message.text, message.type, message.username);
      showBubbleGif(message.username);
    }
  }
  if (message.type === "typing") {
    if (
      message.data.to === sessionStorage.getItem("username") &&
      message.data.from === CurrentReceiver
    ) {
      //console.log("Typing indicator received from server:");
      typingIndicator.style.display = "block"; // Show the typing indicator
    }
  } else if (message.type === "stopTyping") {
    //console.log("Stop typing indicator received from server:");
    if (
      message.data.to === sessionStorage.getItem("username") &&
      message.data.from === CurrentReceiver
    ) {
      typingIndicator.style.display = "none"; // Hide the typing indicator
    }
  }
});
