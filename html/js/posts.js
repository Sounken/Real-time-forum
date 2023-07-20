function requestComments(postId) {
  //save post title to global variable as a string
  //console.log("Requesting comments for post", postId);
  // save postID to session storage
  sessionStorage.setItem("postID", postId);
  // create a new message object
  const message = {
    type: "get_comments",
    data: {
      content: postId,
      username: document.getElementById("username").value,
    },
  };

  // send the message object as a JSON string to the server
  //console.log("Sending message to server", message);
  socket.send(JSON.stringify(message));
}

// Just a fancy way to scroll to the bottom of the comments list when the modal is opened (We dont need this i just like it //MVH Mathisen)
function scrollToBottom(element, abortCallback) {
  const scrollDuration = 10000; // Duration in milliseconds
  const step = 1; // Step in milliseconds
  const initialScrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const scrollDistance = scrollHeight - initialScrollTop;
  let startTime = null;

  const scrollStep = (timestamp) => {
    if (startTime === null) startTime = timestamp;
    const progress = timestamp - startTime;
    const newScrollTop =
      initialScrollTop + (scrollDistance * progress) / scrollDuration;
    element.scrollTop = newScrollTop;

    if (abortCallback() || progress >= scrollDuration) {
      // Abort scrolling or finish scrolling
      element.scrollTop = scrollHeight;
    } else {
      requestAnimationFrame(scrollStep);
    }
  };

  requestAnimationFrame(scrollStep);
}

function openCommentsModal(comments) {
  //console.log("Opening comments modal for post", comments);

  // Create a modal to display the comments and the input field for new comments
  const modal = document.createElement("div");
  modal.classList.add("comments-modal");
  modal.style.display = "block";

  // Add a close button to the modal
  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.classList.add("close-btn");
  closeButton.onclick = () => {
    modal.remove();
  };
  modal.appendChild(closeButton);

  // Display the comments
  const commentsList = document.createElement("ol");
  commentsList.setAttribute("id", "comments-list");
  modal.appendChild(commentsList);

  if (comments && comments.length != 0) {
    //console.log("Comments found");
    for (const comment of comments) {
      //console.log("Adding comment to modal", comment);
      const commentListItem = document.createElement("li");
      const blockquote = document.createElement("blockquote");

      const commentContent = document.createElement("p");
      commentContent.textContent = comment.content;

      const commentFooter = document.createElement("footer");
      commentFooter.textContent = `Comment by ${comment.username}`;

      blockquote.appendChild(commentContent);
      blockquote.appendChild(commentFooter);
      commentListItem.appendChild(blockquote);
      commentsList.appendChild(commentListItem);
    }
  } else {
    //console.log("No comments yet");
    const commentListItem = document.createElement("li");
    const blockquote = document.createElement("blockquote");

    const commentContent = document.createElement("p");
    commentContent.textContent = "No comments yet for this post!";

    const commentFooter = document.createElement("footer");
    commentFooter.textContent = `Comment by Be the first to comment`;

    blockquote.appendChild(commentContent);
    blockquote.appendChild(commentFooter);
    commentListItem.appendChild(blockquote);
    commentsList.appendChild(commentListItem);
  }

  // Add a textarea for new comments
  const newCommentForm = document.createElement("form");
  newCommentForm.setAttribute("id", "add-comment");

  const inputContainer = document.createElement("div");
  inputContainer.classList.add("input-container");

  const newCommentTextarea = document.createElement("textarea");
  newCommentTextarea.setAttribute("id", "respond");
  newCommentTextarea.placeholder = "Write a comment...";
  
  const newCommentLabel = document.createElement("label");
  newCommentLabel.setAttribute("for", "respond");
  newCommentLabel.textContent = "Your comment";
  newCommentLabel.style.fontSize = "16px";
  
  const textareaWrapper = document.createElement("div");
  textareaWrapper.classList.add("textarea-wrapper");
  textareaWrapper.appendChild(newCommentLabel);
  textareaWrapper.appendChild(newCommentTextarea);
  
  inputContainer.appendChild(textareaWrapper);

  const submitButton = document.createElement("input");
  submitButton.type = "submit";
  submitButton.value = "Submit";
  inputContainer.appendChild(submitButton);

  newCommentForm.appendChild(inputContainer);

  newCommentForm.onsubmit = (event) => {
    event.preventDefault();
    // Send the new comment to the server
    // create a new message object
    const message = {
      type: "new_comment",
      data: {
        content: newCommentTextarea.value,
        username: sessionStorage.getItem("username"),
        postid: sessionStorage.getItem("postID"),
      },
    };

    // send the message object as a JSON string to the server
    socket.send(JSON.stringify(message));
    //console.log("Sending new comment to server", message);

    // update the comments list
    const commentListItem = document.createElement("li");
    const blockquote = document.createElement("blockquote");

    const commentContent = document.createElement("p");
    commentContent.textContent = newCommentTextarea.value;

    const commentFooter = document.createElement("footer");
    commentFooter.textContent = `Comment by ${
      document.getElementById("username").value
    }`;

    blockquote.appendChild(commentContent);
    blockquote.appendChild(commentFooter);
    commentListItem.appendChild(blockquote);
    commentsList.appendChild(commentListItem);

    // Reset the textarea
    newCommentTextarea.value = "";

    //scroll to bottom of comments list
    scrollToBottom(commentsList, abortScrolling);
  };

  modal.appendChild(newCommentForm);

  // Add the modal to the body
  document.body.appendChild(modal);

  let userInteracted = false;
  const abortScrolling = () => userInteracted;

  // Scroll to the bottom of the comments list
  scrollToBottom(commentsList, abortScrolling);

  // Listen for user interaction to abort scrolling
  modal.addEventListener("mousedown", () => {
    userInteracted = true;
  });
  modal.addEventListener("keydown", () => {
    userInteracted = true;
  });
}

// Listen for new messages from the server
socket.addEventListener("message", (event) => {
  message = JSON.parse(event.data);
  // console.log("Received message from server: ", message);

  if (message.type === "comments") {
    //console.log("Received comments from server", message.comment);
    const postId = message.comment.content;
    const comments = message.comment;
    openCommentsModal(comments);
  }

  if (message.type === "posts") {
    // Update the posts list
    const postsDiv = document.querySelector(".posts");
    //console.log("Received posts from server", message.posts);
    // Clear the posts list before adding new posts
    postsDiv.innerHTML =
      "<h1 style=\"font-family: 'Roboto Mono', monospace; font-weight: bold; font-size: 30px;\">Recent Posts</h1>";

    if (message.posts) {
      for (const post of message.posts) {
        const postDiv = document.createElement("div");
        postDiv.classList.add("post");

        const hr2 = document.createElement("hr");
        postDiv.appendChild(hr2);

        const postTitle = document.createElement("h4");
        postTitle.classList.add("post-title");
        postTitle.textContent = post.title;

        const postContent = document.createElement("p");
        postContent.classList.add("post-content");
        postContent.textContent = post.content;

        const postMeta = document.createElement("div");
        postMeta.classList.add("post-meta");
        postMeta.textContent = `Category: ${post.category}`;

        const postAuthor = document.createElement("span");
        postAuthor.classList.add("post-author");
        postAuthor.textContent = `Posted by: ${post.username}`;

        //convert timestamp to date
        const date = new Date(post.createdat);

        const postDate = document.createElement("span");
        postDate.classList.add("post-date");
        postDate.textContent = `Post created: ${date.toDateString()}`;

        const commentButton = document.createElement("button");
        commentButton.classList.add("comment-btn");
        commentButton.textContent = "Comment";
        commentButton.onclick = () => requestComments(post.title);

        postMeta.appendChild(postAuthor);
        postMeta.appendChild(postDate);
        postMeta.appendChild(commentButton);

        postDiv.appendChild(postTitle);
        postDiv.appendChild(postContent);
        postDiv.appendChild(postMeta);

        //add hr after each post
        const br = document.createElement("br");
        postDiv.appendChild(br);
        const hr = document.createElement("hr");
        postDiv.appendChild(hr);

        postsDiv.appendChild(postDiv);
        // console.log("Received posts from server", message.posts);

        document.querySelector(".left-sidebar").style.display = "block";
        document.querySelector(".right-sidebar").style.display = "block";
        document.querySelector(".posts").style.display = "block";
        document.querySelector(".container").style.display = "flex";
        document.getElementById("login-form").style.display = "none";
        document.querySelector(".register-form").style.display = "none";
        document.getElementById("logged-in-message").style.display = "block";
        document.getElementById("logout-form").style.display = "block";
      }
    } else {
      const noPostsDiv = document.createElement("div");
      noPostsDiv.textContent = "Please login to see posts";
      postsDiv.appendChild(noPostsDiv);
      // hide the new-post-form
      document.querySelector(".new-post-form").style.display = "none";
    }
  }
});

// Send a message to the server to request the list of posts
message = JSON.stringify({ type: "get_posts" });
socket.send(message);
//console.log("Sending get_posts to server", message)

console.log("Posts.js loaded Getting posts from server...");
