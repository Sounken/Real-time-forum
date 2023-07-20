// establish a WebSocket connection to the backend
const socket = new WebSocket("ws://localhost:8080/ws");

// when the WebSocket connection is opened
socket.addEventListener("open", (event) => {
  // send a message to the backend to get the list of users
  socket.send(JSON.stringify({type: "get_users"}));
});

// when a message is received from the backend
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "users") {
    // update the div with the list of users
    const usersDiv = document.getElementById("user-list");
    usersDiv.innerHTML = "";

    for (const user of data.users) {
      const userElem = document.createElement("div");
      userElem.textContent = user.name;
      usersDiv.appendChild(userElem);
    }
  }
});
