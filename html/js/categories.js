function addCategoryButton() {
  const categoriesDiv = document.querySelector(".left-sidebar");
  const createCategoryButton = document.createElement("button");
  createCategoryButton.textContent = "Create Category";
  createCategoryButton.className = "create-category-button";
  categoriesDiv.appendChild(createCategoryButton);

  createCategoryButton.addEventListener("click", () => {
    showPopup();
  });
}

function showPopup() {
  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
<div class="popup-container">
  <div class="popup-content">
    <span class="close">&times;</span>
    <h2>Create Category</h2>
    <form id="create-category-form">
      <label for="category-name">Category Name:</label>
      <input type="text" id="category-name" name="category-name" required>
      <button type="submit">Create</button>
    </form>
  </div>
</div>
  `;

  document.body.appendChild(popup);

  const closeButton = document.querySelector(".close");
  closeButton.addEventListener("click", closePopup);

  const createCategoryForm = document.querySelector("#create-category-form");
  createCategoryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const categoryName = document.querySelector("#category-name").value;
    // Send the category to the server to be created
    //const message = JSON.stringify({ type: "create_category", name: categoryName });

    // create a new message object
    const message = {
      type: "create_category",
      data: {
        category: categoryName,
        username: document.getElementById("username").value,
      },
    };

    socket.send(JSON.stringify(message));
    //console.log("Category created", message);

    closePopup();
  });
}

function closePopup() {
  const popup = document.querySelector(".popup");
  if (popup) {
    document.body.removeChild(popup);
  }
}

// Listen for new messages from the server
socket.addEventListener("message", (event) => {
  //console.log("Received message from server: ", event.data);
  message = JSON.parse(event.data);

  if (message.type === "postsbyCategory" && message.posts.length > 0) {
    console.log("Received NEW posts from server", message.posts[0].category);

    const postsDiv = document.querySelector(".posts");
    //console.log("Received posts from server", message.posts);
    // Clear the posts list before adding new posts
    postsDiv.innerHTML = "<h1 style=\"font-family: 'Roboto Mono', monospace; font-weight: bold; font-size: 30px;\">Posts for " + message.posts[0].category + "</h1>";

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
  } 
  if (message.type === "postsbyCategory" && message.posts.length === 0) {
    // create a new div element with a h1 tag that says no posts found.
    const postsDiv = document.querySelector(".posts");
    postsDiv.innerHTML = "<h1 style=\"font-family: 'Roboto Mono', monospace; font-weight: bold; font-size: 30px;\">Be the first one to make a post" + "</h1>";
    document.querySelector(".posts").style.display = "block";
  }

  if (message.type === "categories") {
    // console.log("Received categories from server", message.categories);
    // Update the categories list
    const categoriesUl = document.querySelector(".left-sidebar ul");
    // Clear the categories list before adding new categories
    categoriesUl.innerHTML = "";

    if (message.categories) {
      const categoriesUl = document.querySelector(".left-sidebar ul");
      // Clear the categories list before adding new categories
      categoriesUl.innerHTML = "";
      //clear the category select before adding new categories
      const categorySelect = document.querySelector("#category");
      categorySelect.innerHTML = "<option value=''>Select a category</option>";

      const categoryLi = document.createElement("li");
      const categoryLink = document.createElement("a");
      categoryLink.textContent = "Recent Posts";
      categoryLink.setAttribute("href", "#");
      categoryLi.appendChild(categoryLink);
      categoriesUl.appendChild(categoryLi);

      //insert hr after home
      const hr = document.createElement("hr");
      categoryLi.appendChild(hr);

      categoryLink.addEventListener("click", (event) => {
        //console.log("Clicked category");
        event.preventDefault();
        message = JSON.stringify({ type: "get_posts" });
        socket.send(message);  
      });

      for (const category of message.categories) {
        const categoryLi = document.createElement("li");
        const categoryLink = document.createElement("a");
        categoryLink.textContent = category.categoryname;
        categoryLink.setAttribute("href", "#");
        categoryLi.appendChild(categoryLink);
        categoriesUl.appendChild(categoryLi);

        const option = document.createElement("option");
        option.value = category.id;
        option.text = category.categoryname;
        categorySelect.appendChild(option);

        // Event listener to hide post div and show new div containing posts from the clicked category
        categoryLink.addEventListener("click", (event) => {
          //console.log("Clicked category", category);
          event.preventDefault();
          const postDiv = document.querySelector(".posts");
          if (postDiv) {
            postDiv.style.display = "none";
          }
          const newDiv = document.querySelector(`#category-${category.id}`);
          if (newDiv) {
            newDiv.style.display = "block";
          } else {
            // Create a new div with the posts from the clicked category
            const newCategoryDiv = document.createElement("div");
            newCategoryDiv.id = `category-${category.id}`;
            const message = JSON.stringify({
              type: "postsByCategory",
              data: {
                Text: category.categoryname,
              },
            });
            //console.log("Sending message to server", message);
            socket.send(message);
          }
        });
      }
      // Add the create category if button doesn't already exist
      if (!document.querySelector(".create-category-button"))
        addCategoryButton();
    } else {
      const categoriesUl = document.querySelector(".left-sidebar ul");
      // Clear the categories list before adding new categories
      categoriesUl.innerHTML = "";

      const categoryLi = document.createElement("li");
      categoryLi.textContent = "Please login to see categories";
      categoriesUl.appendChild(categoryLi);
    }
  }
});

// Send a message to the server to request the list of categories
message = JSON.stringify({ type: "get_categories" });
socket.send(message);

console.log("Categories.js loaded Getting categories from server...");
