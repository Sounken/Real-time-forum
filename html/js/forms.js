//Global variables
var CurrentUsername = null;

if (localStorage.getItem("cookie") != null) {
  socket = new WebSocket("ws://localhost:8080/ws", {
    headers: {
      Cookie: localStorage.getItem("cookie"),
    },
  });
} else {
  // clear all session storage items
  socket = new WebSocket("ws://localhost:8080/ws");
}

socket.onmessage = function (event) {
  //console.log("WebSocket message received:", event.data);
};

var storedCookie = sessionStorage.getItem("cookie");
if (storedCookie == null) {
  document.addEventListener("DOMContentLoaded", function () {
    // Check if user is logged in on page load
    socket.onopen = function () {
      checkLoggedIn(socket);
    };

    // Check for stored cookie on page load
    var storedCookie = sessionStorage.getItem("cookie");
    //console.log("Stored cookie: " + storedCookie);
    if (storedCookie) {
      // Send the stored cookie to the server to check if user is still logged in
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "login",
            data: {
              cookie: storedCookie,
            },
          })
        );

        document.querySelector(".left-sidebar").style.display = "block";
        document.querySelector(".right-sidebar").style.display = "block";
        document.querySelector(".posts").style.display = "block";
        document.querySelector(".container").style.display = "flex";
        document.querySelector(".container").style.justifyContent =
          "space-between";
        document.querySelector(".container").style.marginTop = "20px";
        document.querySelector(".container").style.flexWrap = "wrap";
        document.getElementById("login-form").style.display = "none";
        document.querySelector(".register-form").style.display = "none";
        document.getElementById("logged-in-message").style.display = "block";
        document.getElementById("logout-form").style.display = "block";
      }
    }

    document
      .getElementById("login-form")
      .addEventListener("submit", function (e) {
        e.preventDefault(); // prevent the default form submission

        // Create JSON object with form data
        var data = {
          username: document.getElementById("username").value,
          password: document.getElementById("password").value,
        };

        // Send login request to server via WebSocket
        socket.send(
          JSON.stringify({
            type: "login",
            data: data,
          })
        );
        //console.log("Sent login request to server", data);
      });

    document
      .getElementById("register-button")
      .addEventListener("click", function () {
        document.getElementById("login-form").style.display = "none";
        document.querySelector(".register-form").style.display = "block";
      });

    document
      .getElementById("login-switch-button")
      .addEventListener("click", function (event) {
        event.preventDefault(); // this line will prevent the auto checking empty fields from happening hahaha
        document.getElementById("login-form").style.display = "block";
        document.querySelector(".register-form").style.display = "none";
      });

    document
      .querySelector(".register-form")
      .addEventListener("submit", function (e) {
        e.preventDefault(); // prevent the default form submission

        var data = {
          firstname: document.getElementById("firstname").value,
          lastname: document.getElementById("lastname").value,
          username: document.getElementById("reg-username").value,
          email: document.getElementById("email").value,
          age: document.getElementById("age").value,
          gender: document.getElementById("gender").value,
          password: document.getElementById("reg-password").value,
          cfpassword: document.getElementById("confpassword").value,
        };
        // Send registration request to server via WebSocket
        socket.send(
          JSON.stringify({
            type: "register",
            data: data,
          })
        );
      });

    document
      .getElementById("logout-form")
      .addEventListener("submit", function (e) {
        e.preventDefault(); // prevent the default form submission

        //save the cookie in a variable
        var data = {
          cookie: document.cookie,
        };

        //send logout request to server via websocket with the cookie
        socket.send(
          JSON.stringify({
            type: "logout",
            data: data,
          })
        );

        // Send logout request to server via WebSocket
        //socket.send(JSON.stringify({type: 'logout'}));
        //console.log("Sent logout request to server");
      });

    socket.onmessage = function (event) {
      // Handle server response
      var message = JSON.parse(event.data);
      if (message.type === "status") {
        if (message.data.refresh === "true") {
          // clear session storage and local storage
          sessionStorage.clear();
          localStorage.clear();
          //location.reload();
          //save into local storage that the page has been refreshed
          localStorage.setItem("refreshed", "true");
        }
      }
      if (message.type === "loginResponse") {
        //console.log("Received login response Status > ", message.data.status);
        if (message.data.status === "error") {
          //console.log("Login failed");
          document.getElementById("login-error").style.display = "block";
          setTimeout(function () {
            document.getElementById("login-error").style.display = "none";
            document.getElementById("login-form").style.display = "block";
          }, 5000);
        }
        if (message.data.status === "error2") {
          //clear session storage
          sessionStorage.clear();
          document.getElementById("login-error2").style.display = "block";
          setTimeout(function () {
            document.getElementById("login-error2").style.display = "none";
            document.querySelector(".left-sidebar").style.display = "none";
            document.querySelector(".right-sidebar").style.display = "none";
            document.querySelector(".posts").style.display = "none";
            document.querySelector(".container").style.display = "none";
            document.getElementById("login-form").style.display = "block";
            document.querySelector(".register-form").style.display = "none";
            document.getElementById("logged-in-message").style.display = "none";
            document.getElementById("logout-form").style.display = "none";

          }, 5000);
        }
        if (message.data.status === "error3") {
          console.log("Wrong credentials failed");
          //console.log("Login failed");
          document.getElementById("login-error3").style.display = "block";
          setTimeout(function () {
            document.getElementById("login-error3").style.display = "none";
            document.getElementById("login-form").style.display = "block";
          }, 5000);
        }
        if (message.data.status === "error4") {
          console.log("Wrong credentials failed");
          //console.log("Login failed");
          document.getElementById("login-error4").style.display = "block";
          setTimeout(function () {
            document.getElementById("login-error4").style.display = "none";
            document.getElementById("login-form").style.display = "block";
          }, 5000);
        }
        if (message.data.status === "refresh") {
          // Refresh the page
          console.log("Refreshing page");
          setTimeout(function () {
            window.location.reload();
          }, 2000);
        }
      }
      if (message.type === "loginResponse" && message.data.login === "true") {
        // console.log("Received login response from server", message.data);

        // Save CurrentUsername to sessionStorage
        (CurrentUsername = message.data.username)
        sessionStorage.setItem("username", CurrentUsername);
        //console.log("Received login response from server", message.data);
        checkLoggedIn(socket); // check if user is logged in after login attempt
        //console.log("User is logged in");
        if (message.data.cookie !== undefined) {
          //console.log("Setting cookie: ", message.data.cookie);
          document.cookie = message.data.cookie; // Set the cookie in the browser
          sessionStorage.setItem("cookie", message.data.cookie);
        }

        document.querySelector(".left-sidebar").style.display = "block";
        document.querySelector(".right-sidebar").style.display = "block";
        document.querySelector(".posts").style.display = "block";
        document.querySelector(".container").style.display = "flex";
        document.querySelector(".container").style.justifyContent =
          "space-between";
        document.querySelector(".container").style.marginTop = "20px";
        document.querySelector(".container").style.flexWrap = "wrap";
        document.getElementById("login-form").style.display = "none";
        document.querySelector(".register-form").style.display = "none";
        document.getElementById("logged-in-message").style.display = "block";
        document.getElementById("logout-form").style.display = "block";

        const userName = sessionStorage.getItem("username");

        if (userName) {
          const welcomeMessage = `Welcome to the forum ${userName}`;
          const currentTimeMessage = `Login time ${new Date().toLocaleString()}`;

          document.getElementById("welcome-message").textContent =
            welcomeMessage;
          document.getElementById("current-time-message").textContent =
            currentTimeMessage;
          document.getElementById("logged-in-message").style.display = "block";
        }

        // load the categories script if it has not been loaded yet when user logs in
        if (!document.getElementById("categories-script")) {
          var script = document.createElement("script");
          script.id = "categories-script";
          script.src = "/js/categories.js";
          document.head.appendChild(script);
        }

        //load the posts script if it has not been loaded yet when user logs in
        if (!document.getElementById("posts-script")) {
          var script = document.createElement("script");
          script.id = "posts-script";
          script.src = "/js/posts.js";
          document.head.appendChild(script);
        }

        // load the users script if it has not been loaded yet when user logs in
        if (!document.getElementById("user-script")) {
          var script = document.createElement("script");
          script.id = "user-script";
          script.src = "/js/display-users.js";
          document.head.appendChild(script);
        }

        // load the chat script if it has not been loaded yet when user logs in
        if (!document.getElementById("chat-script")) {
          var script = document.createElement("script");
          script.id = "chat-script";
          script.src = "/js/chat.js";
          document.head.appendChild(script);
        }

        // load display-offline.js script if it has not been loaded yet when user logs in
        if (!document.getElementById("display-offline-script")) {
          var script = document.createElement("script");
          script.id = "display-offline-script";
          script.src = "/js/display-offline.js";
          document.head.appendChild(script);
        }
        // load new-post.js script if it has not been loaded yet when user logs in
        if (!document.getElementById("new-post-script")) {
          var script = document.createElement("script");
          script.id = "new-post-script";
          script.src = "/js/new-post.js";
          document.head.appendChild(script);
        }
      } else if (message.type === "registerResponse") {
        //console.log("Received registration response from server", message.data);
        if (message.data.register === "true") {
          document.querySelector(".register-form").reset(); // clear the form after successful registration

          document.getElementById("login-form").style.display = "none";
          document.querySelector(".register-form").style.display = "none";
          // show the registration success message as a popup that disappears after 3 seconds and then redirects to login page
          document.getElementById("registration-success").style.display =
            "block";
          setTimeout(function () {
            document.getElementById("registration-success").style.display =
              "none";
            document.getElementById("login-form").style.display = "block";
          }, 3000);
        } else {
          // show the registration error message below the form
          document.getElementById("registration-error").innerHTML =
            "<center> Registration failed <br>" + message.data.status;
          +"</center>";
          document.getElementById("registration-error").style.display = "block";
          setTimeout(function () {
            document.getElementById("registration-error").style.display =
              "none";
          }, 3000);
        }
      } else if (message.type === "logoutResponse") {
        //console.log("Received logout response from server", message.data);
        // Clear the session_token cookie
        sessionStorage.removeItem("cookie");
        document.cookie =
          "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        document.querySelector(".left-sidebar").style.display = "none";
        document.querySelector(".right-sidebar").style.display = "none";
        document.querySelector(".posts").style.display = "none";
        document.querySelector(".container").style.display = "none";
        document.getElementById("login-form").style.display = "block";
        document.querySelector(".register-form").style.display = "none";
        document.getElementById("logged-in-message").style.display = "none";
        document.getElementById("logout-form").style.display = "none";

        // Send a message to the server to request the list of users
        message = JSON.stringify({ type: "get_offline_users" });
        socket.send(message);

        // close websocket connection with reason 'logout'
        socket.close(1000, "logout");
        // delete all session storage data
        sessionStorage.clear();

        window.location.reload();
      }

      // handle any errors here
      if (message.type === "error") {
        alert(message.data);
      }
    };
  });

  function checkLoggedIn(socket) {
    // Send request to server to check if user is logged in
    socket.send(
      JSON.stringify({
        type: "loggedInRequest",
      })
    );
  }

  // Will run if the user is logged in
} else {
  //console.log("User is logged in");

  document
    .getElementById("logout-form")
    .addEventListener("submit", function (e) {
      e.preventDefault(); // prevent the default form submission

      //save the cookie in a variable
      var data = {
        cookie: document.cookie,
      };
      //console.log("cookie: ", data.cookie);
      //send logout request to server via websocket with the cookie
      socket.send(
        JSON.stringify({
          type: "logout",
          data: data,
        })
      );
      // Clear the session_token cookie
      sessionStorage.removeItem("cookie");
      // close websocket connection with reason 'logout'
      socket.close(1000, "logout");
      //reload the page
      window.location.reload();
      // Send logout request to server via WebSocket
      //socket.send(JSON.stringify({type: 'logout'}));
      //console.log("Sent logout request to server");
    });
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

  const userName = sessionStorage.getItem("username");

  if (userName) {
    const welcomeMessage = `Welcome to the forum ${userName}`;
    const currentTimeMessage = `Login time ${new Date().toLocaleString()}`;

    document.getElementById("welcome-message").textContent =
      welcomeMessage;
    document.getElementById("current-time-message").textContent =
      currentTimeMessage;
    document.getElementById("logged-in-message").style.display = "block";
  }
  // sleep for 1 second before loading the scripts to make sure the websocket connection is established
  setTimeout(function () {
    console.log(
      "User is logged in... Waiting for 1 second before loading the scripts"
    );
    // load the categories script if it has not been loaded yet when user logs in
    if (!document.getElementById("categories-script")) {
      var script = document.createElement("script");
      script.id = "categories-script";
      script.src = "/js/categories.js";
      document.head.appendChild(script);
    }
    //load the posts script if it has not been loaded yet when user logs in
    if (!document.getElementById("posts-script")) {
      var script = document.createElement("script");
      script.id = "posts-script";
      script.src = "/js/posts.js";
      document.head.appendChild(script);
    }
    // load the users script if it has not been loaded yet when user logs in
    if (!document.getElementById("user-script")) {
      var script = document.createElement("script");
      script.id = "user-script";
      script.src = "/js/display-users.js";
      document.head.appendChild(script);
    }
    // load the chat script if it has not been loaded yet when user logs in
    if (!document.getElementById("chat-script")) {
      var script = document.createElement("script");
      script.id = "chat-script";
      script.src = "/js/chat.js";
      document.head.appendChild(script);
    }
    // load display-offline.js script if it has not been loaded yet when user logs in
    if (!document.getElementById("display-offline-script")) {
      var script = document.createElement("script");
      script.id = "display-offline-script";
      script.src = "/js/display-offline.js";
      document.head.appendChild(script);
    }
    // load new-post.js script if it has not been loaded yet when user logs in
    if (!document.getElementById("new-post-script")) {
      var script = document.createElement("script");
      script.id = "new-post-script";
      script.src = "/js/new-post.js";
      document.head.appendChild(script);
    }
  }, 1000);
}
