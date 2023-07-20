let currentChatUser = null;

// When the WebSocket connection is opened
socket.addEventListener("open", (event) => {
  console.log("WebSocket connection opened (Update Users Handler)");

  // Listen for new messages from the server
  socket.addEventListener("message", (event) => {
    console.log("Message received from server: " + event.data);
    const message = JSON.parse(event.data);
  
    if (message.type === "users") {
      // Update the user list
      const usersDiv = document.getElementById("user-list");
      // Clear the user list before adding new users
      usersDiv.innerHTML = "<h2>Logged In Users</h2>";
  
      if (message.users) {
        let count = 0;
        for (const user of message.users) {
          if (count >= 10) {
            break; // Limit the list to a maximum of 10 users
          }
          const userContainer = document.createElement("div");
          userContainer.className = "user-container";
          const usernameElem = document.createElement("span");
          usernameElem.className = "username";
          usernameElem.textContent = user.username;
          userContainer.appendChild(usernameElem);
          
  
          // Create a green circle element to indicate that the user is logged in
          const greenCircle = document.createElement("span");
          greenCircle.style.backgroundColor = "green";
          greenCircle.style.width = "10px";
          greenCircle.style.height = "10px";
          greenCircle.style.borderRadius = "50%";
          greenCircle.style.display = "inline-block";
          greenCircle.style.marginRight = "10px";
  
          // Add the green circle element to the user element
          userElem.appendChild(greenCircle);
  
          // Add the gif only if the chat window is not open for this user
          if (currentChatUser === null || currentChatUser.id !== user.id) {
            const gif = document.createElement("img");
            // add class to the gif
            gif.className = "bubble";
            gif.src = "css/bubble.gif";
            gif.style.marginLeft = "10px";
            const bubbleGif = document.createElement("img");
            bubbleGif.src = "css/bubble.gif";
            bubbleGif.className = "bubble";
            bubbleGif.style.display = "none"; // Initially hidden
            userContainer.appendChild(bubbleGif);            
          }
  
          // Add a click event listener to each user element that opens a chat window when clicked
          userElem.addEventListener("click", () => {
            openChatWindow(user);
            console.log("Clicked on user: " + user.username);
            currentChatUser = user;
          });
  
          usersDiv.appendChild(userContainer);
          count++;
        }
      }
    }
  });

  // Send a message to the server to request the list of users
  const message = JSON.stringify({ type: "get_users" });
  socket.send(message);
});

// Create a chat window element and append it to the DOM
const chatWindow = document.createElement("div");
chatWindow.id = "chat-window";
document.body.appendChild(chatWindow);

// Function to open a chat window between two users
function openChatWindow(user) {
  // Populate the chat window with the conversation history between the two users (if it exists)
  getChatHistory(user, (chatHistory) => {
    const history = JSON.parse(chatHistory);

    // Create a header container for the chat window
    const headerContainer = document.createElement("div");
    headerContainer.className = "header-container";
    headerContainer.style.position = 'sticky';
    // Set the top position of the header container to 0 so that it sticks to the top of the chat window
    headerContainer.style.top = '0';
    headerContainer.style.zIndex = '1';

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
      // Remove the chat-window class from the chat window
      chatWindow.classList.remove("chat-window");
    });

    // Append the close button to the chat header
    chatHeader.appendChild(closeButton);

    // Create a container for the chat messages
    const chatContainer = document.createElement("div");
    chatWindow.classList.add("chat-window"); // Add the chat-window class
    chatContainer.className = "chat-container";

    // Loop through each message in the chat history and display it in the chat window
    history.chathistory.forEach((message) => {
      const messageContainer = document.createElement("div");
      messageContainer.className = message.from === user.id ? "message sent" : "message received";
      
      const messageText = document.createElement("p");
      messageText.textContent = message.text;
      messageContainer.appendChild(messageText);
      
      chatContainer.appendChild(messageContainer);
    });
    
    // Create a container for the message input and send button
    const inputContainer = document.createElement("div");
    inputContainer.className = "input-container";
    
    // Create the message input field
    const messageInput = document.createElement("input");
    messageInput.type = "text";
    messageInput.placeholder = "Type your message...";
    inputContainer.appendChild(messageInput);

    // Add an event listener to the message input field to detect when the Enter key is pressed
    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        // Prevent the default behavior of the Enter key, which is to add a new line
        event.preventDefault();
        // Call the sendMessage function to send the message
        sendMessage(user, messageInput.value);
        console.log("Sending message: " + messageInput.value);
        // Clear the message input field
        messageInput.value = "";
      }
    });

    // Create the send button
    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";
    sendButton.addEventListener("click", () => {
      sendMessage(user, messageInput.value);
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
  });
}


// Function to get the conversation history between two users
function getChatHistory(user, callback) {
  // Send a message to the server to request the conversation history
  const message = JSON.stringify({ type: "get_chat_history", user: user });
  socket.send(message);

  // Listen for the response from the server
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    //console.log("Message received from backend!: " + JSON.stringify(message));
    if (message.type === "chat_history") {
      const chatHistory = JSON.stringify(message);
      callback(chatHistory);
    }
  });
}

// Function to send a message to another user via the WebSocket connection
function sendMessage(user, messageText) {
  // Construct the message object
  const message = {
    type: "message",
    from: sessionStorage.getItem("username"),
    to: user.username,
    text: messageText,
  };

/*   console.log("Message: " + JSON.stringify(message));
  console.log("Message type: " + message.type);
  console.log("Message from: " + message.from);
  console.log("Message to: " + message.to); */

  // Send the message to the server
  socket.send(JSON.stringify(message));

  //update chat window
  const chatContainer = document.querySelector(".chat-container");
  const messageContainer = document.createElement("div");
  messageContainer.className = "message sent";

  const messageTextElem = document.createElement("p");
  messageTextElem.textContent = messageText;
  messageContainer.appendChild(messageTextElem);

  chatContainer.appendChild(messageContainer);

  // Clear the message input field
  const messageInput = document.querySelector(".input-container input");
  messageInput.value = "";

  // Scroll the chat window to the bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
