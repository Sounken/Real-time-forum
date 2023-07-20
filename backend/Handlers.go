package backend

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

// indexHandler handles the index page
func indexHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "html/index.html")
}

// loginHandler handles the login endpoint
func loginHandler(w http.ResponseWriter, r *http.Request) {
	//redirect to index page if user is doing a GET request
	if r.Method == http.MethodGet {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}
	// open the database
	db := OpenDatabase()
	defer CloseDatabase(db)

	// Make sure the path is /login-api
	if r.URL.Path != "/login" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	// Get the username/Email and password from the form
	username := r.FormValue("username")
	password := r.FormValue("password")

	fmt.Println("Username:", username)
	fmt.Println("password:", password)

	/* 	// Check if the user exist in the database
	   	if CheckIfUserExist(db, username) {
	   		// If the user exist, check if the password is correct
	   		if CheckIfPasswordIsCorrect(db, username, password) {
	   			// If the user exist and the password is correct, set session,cookie and redirect to the chat page
	   			fmt.Printf(Green+"Server >> User %s has logged in!\n"+Reset, username)

	   			// Set the session and get the session token
	   			sessionToken := SetClientCookieWithSessionToken(w, db, username)

	   			// Add the user session to the loggedInUsers map
	   			session := &Session{
	   				Username:    username,
	   				Privilege:   GetPrivilegeLevel(db, username),
	   				Cookie:      sessionToken,
	   				ExpiredTime: time.Now().Add(1 * time.Hour), // set expiration time to 1 hour from now WE MAY WANT TO CHANGE THIS!!!!!!
	   			}
	   			LoggedInUsers[sessionToken] = session

	   			// Send the userlist and  categories to the client
	   			BroadcastToClients()

	   		} else {
	   			// If the user exist but the password is incorrect
	   			fmt.Printf(Red+"Server >> User %s tried to login but the password is incorrect!\n"+Reset, username)
	   		}

	   	} else {
	   		// If the user doesn't exist, redirect to the login page
	   		fmt.Printf(Red+"Server >> User %s tried to login but doesn't exist!\n"+Reset, username)
	   	} */

	// Print the username and password for debugging
	// fmt.Printf("The username is: %s and the password is: %s\n", username, password)
}

// logoutHandler handles the logout endpoint
func logoutHandler(w http.ResponseWriter, r *http.Request) {
	//LogUserOut(w, r)
	var templist []ServerUser

	// Remove the user from the LoggedInUsers map
	for _, v := range LoggedInUsers {
		templist = append(templist, ServerUser{Username: v.Username, Privilege: v.Privilege})
	}

	// Send the list of users to the client to update the user list
	Broadcast <- ServerMessage{Type: "users", Users: templist}
}

// signupHandler handles the signup endpoint
func signupHandler(w http.ResponseWriter, r *http.Request) {
	// open the database
	db := OpenDatabase()
	defer CloseDatabase(db)

	// Make sure the path is /register-api
	if r.URL.Path != "/signup" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	// Make sure the method is POST and not GET
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		fmt.Println("Method not allowed")
		return
	}

	// Get the username/Email and password from the form
	username := r.FormValue("username")
	ageStr := r.FormValue("age")
	// Convert the age from string to int
	age, _ := strconv.Atoi(ageStr)
	gender := r.FormValue("gender")
	fname := r.FormValue("firstname")
	lname := r.FormValue("lastname")
	email := r.FormValue("email")
	password := r.FormValue("password")
	passwordConfirm := r.FormValue("confpassword")

	// prints debug info
	fmt.Println("username:", username)
	fmt.Println("age:", age)
	fmt.Println("gender:", gender)
	fmt.Println("firstname:", fname)
	fmt.Println("lastname:", lname)
	fmt.Println("email:", email)
	fmt.Println("password:", password)
	fmt.Println("confirmedpw", passwordConfirm)

	// Check if the user exist in the database
	if CheckIfUserExist(db, username) {
		// If the user exist, redirect to the login page
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		fmt.Printf(Red+"Server >> User %s tried to register but already exist!\n"+Reset, username)
	} else {
		// Check if the password and the password confirm are the same
		if password != passwordConfirm {
			// If the password and the password confirm are not the same, redirect to the login page
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			fmt.Printf(Red+"Server >> User %s tried to register but the password and the password confirm are not the same!\n"+Reset, username)
			return
		}
		// If the user doesn't exist, Register the user and redirect to the chat page
		fmt.Printf(Green+"Server >> User %s has registered!\n"+Reset, username)

		// Insert the user into the database
		RegisterUser(db, username, age, gender, fname, lname, email, password)

		// Redirect to the chat page
		http.Redirect(w, r, "/chat", http.StatusSeeOther)
	}

	// Print the form values for debugging
	fmt.Println(Yellow + "================================" + Reset)
	fmt.Printf("The username is: %s\n", username)
	fmt.Printf("The age is: %d\n", age)
	fmt.Printf("The Gender is: %s\n", gender)
	fmt.Printf("The First Name is: %s\n", fname)
	fmt.Printf("The Last Name is: %s\n", lname)
	fmt.Printf("The Email is: %s\n", email)
	fmt.Printf("The Password is %s\n", password)
	fmt.Printf("The Password Confirm is %s\n", passwordConfirm)
	fmt.Println(Yellow + "================================" + Reset)

}

func checkLoginHandler(w http.ResponseWriter, r *http.Request) {
	// Variable to store whether or not the user is logged in
	logged_in := false
	// open the database
	db := OpenDatabase()
	defer CloseDatabase(db)

	// check if the user is logged in
	// Get the session token from the cookie
	sessionToken := GetSessionTokenFromCookie(r)

	// Check if the session token is valid
	if CheckIfSessionTokenIsValid(sessionToken) {
		// If the session token is valid, set logged_in to true
		logged_in = true
	} else {
		// If the session token is not valid, set logged_in to false
		logged_in = false
	}

	// return a JSON response indicating whether or not the user is logged in
	response := map[string]bool{"logged_in": logged_in}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getLoggedInUsersHandler(w http.ResponseWriter, r *http.Request) {
	var users []string
	for user := range LoggedInUsers {
		users = append(users, user)
	}
	response := map[string][]string{"users": users}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
