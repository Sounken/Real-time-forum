let currentChatUser = null;
let lastChatUser = null;

// function to sort users with the last chat user at the top, followed by alphabetical order
function sortUsers(users) {
  return users.sort((a, b) => {
    if (a.id === lastChatUser?.id) {
      return -1;
    }
    if (b.id === lastChatUser?.id) {
      return 1;
    }
    return a.username.localeCompare(b.username);
  });
}

socket.addEventListener("message", (event) => {
  message = JSON.parse(event.data);

  if (message.type === "users") {
    const usersDiv = document.getElementById("user-list");
    usersDiv.innerHTML = "";

    if (message.users) {
      // Add a our special realtime bot user
      message.users.push({ id: "Special-Friend", username: "Special-Friend" });

      let count = 0;
      const sortedUsers = sortUsers(message.users);
      for (const user of sortedUsers) {
        if (count >= 10) {
          break;
        }
        const userContainer = document.createElement("div");
        userContainer.className = "user-container";
        userContainer.id = "user-" + user.username;

        const greenCircle = document.createElement("span");
        greenCircle.style.backgroundColor = "green";
        greenCircle.style.width = "10px";
        greenCircle.style.height = "10px";
        greenCircle.style.borderRadius = "50%";
        greenCircle.style.display = "inline-block";
        greenCircle.style.marginRight = "10px";
        greenCircle.style.marginLeft = "10px";
        userContainer.appendChild(greenCircle);

        const usernameElem = document.createElement("span");
        usernameElem.className = "username";
        usernameElem.textContent = user.username;
        userContainer.appendChild(usernameElem);

        // If the user has a last message, display it in the user list (this is the last message they sent or received)
        if (currentChatUser === null || currentChatUser.id !== user.id) {
          const bubbleGif = document.createElement("img");
          bubbleGif.src = "css/bubble.gif";
          bubbleGif.className = "bubble";
          bubbleGif.style.marginLeft = "10px";
          bubbleGif.setAttribute("data-recipient", user.username);
          //console.log("Added recipient ID: " + user.username)
          userContainer.appendChild(bubbleGif);
        }

        userContainer.addEventListener("click", () => {
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

// event listener for when a logoutresponse is received
socket.addEventListener("message", (event) => {
  message = JSON.parse(event.data);

  if (message.type === "logoutResponse") {
    if (message.success) {
      console.log("Logout successful");

      moveUserToTop(message.username);
    } else {
      console.log("Logout failed");
    }
  }
});

message = JSON.stringify({ type: "get_users" });
socket.send(message);

console.log("Display-users.js loaded Getting users from server...");
