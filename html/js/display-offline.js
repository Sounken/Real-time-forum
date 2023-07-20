// function to sort users in alphabetical order
function sortUsers(users) {
  return users.sort((a, b) => {
    return a.username.localeCompare(b.username);
  });
}

// Listen for new messages from the server
socket.addEventListener("message", (event) => {
  //console.log("Message received from server: " + event.data)
  message = JSON.parse(event.data);

  if (message.type === "offline_users") {
    // Update the user list
    const usersDiv = document.getElementById("offline-list");
    // Clear the user list before adding new users
    usersDiv.innerHTML = "";

    // Sort the users
    const sortedUsers = sortUsers(message.users);

    if (sortedUsers) {
      for (const user of sortedUsers) {
        const userElem = document.createElement("div");

        // Create a red circle element to indicate that the user is offline
        const redCircle = document.createElement("span");
        redCircle.style.backgroundColor = "red";
        redCircle.style.width = "10px";
        redCircle.style.height = "10px";
        redCircle.style.borderRadius = "50%";
        redCircle.style.display = "inline-block";
        redCircle.style.marginRight = "10px";
        redCircle.style.marginLeft = "10px";

        // Add the red circle element to the user element
        userElem.appendChild(redCircle);
        userElem.appendChild(document.createTextNode(user.username));

        // Add a click event listener to each user element that opens a chat window when clicked
        userElem.addEventListener("click", () => {
          openChatWindow(user);
          console.log("Clicked on user: " + user.username);
        });

        usersDiv.appendChild(userElem);
      }
    }
  }
});

// Send a message to the server to request the list of users
message = JSON.stringify({ type: "get_offline_users" });
socket.send(message);

console.log("Display-offline.js loaded Getting users from server...");