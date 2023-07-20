const form = document.getElementById("new-post-form");
const titleInput = form.querySelector("input[name=title]");
const contentInput = form.querySelector("textarea[name=content]");
const categorySelect = form.querySelector("select[name=category]");
const submitButton = form.querySelector("button[type=submit]");

// handle form submission event
form.addEventListener("submit", (event) => {
  event.preventDefault();

  // create a new message object
  const message = {
    type: "new_post",
    data: {
      title: titleInput.value,
      content: contentInput.value,
      category: categorySelect.value,
      authur: document.getElementById('username').value,
      username: document.getElementById('username').value,
    },
  };

  // send the message object as a JSON string to the server
  socket.send(JSON.stringify(message));

  // clear the form inputs
  titleInput.value = "";
  contentInput.value = "";
  categorySelect.value = "";

  // disable the submit button temporarily to prevent multiple submissions
  submitButton.disabled = true;
  setTimeout(() => {
    submitButton.disabled = false;
  }, 1000);
});

// handle WebSocket error event
socket.addEventListener("error", (error) => {
  console.error("WebSocket error:", error);
});
