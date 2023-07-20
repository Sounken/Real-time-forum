package backend

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/gorilla/websocket"
)

// Session map to store all sessions
var sessions = make(map[string]Session)

// Setting the client cookie with a generated session token
func SetClientCookieWithSessionToken(conn *websocket.Conn, db *sql.DB, username string) string {
	// Creating a random session token and an expired time (30 minutes from the current time)
	u2, err := uuid.NewV4()
	if err != nil {
		//fmt.Fprintln(os.Stderr, err)
		return "500 INTERNAL SERVER ERROR: GENERATING SESSION TOKEN FAILED"
	}
	session_token := u2.String()
	expired_time := time.Now().Add(1800 * time.Second)
	privilege := GetUserPrivilege(db, username)

	// Removing old session with the same username if that user was logged-in somewhere else before
	// TODO: Fix so it send to the frontend that the user is logged in somewhere else and removes the old session
	for old_session_token, old_session := range sessions {
		if strings.Compare(old_session.Username, username) == 0 {
			delete(sessions, old_session_token)
		}
	}

	// Creating a new session for the given user with the above-generated session token and expired time
	sessions[session_token] = Session{Username: username, Privilege: privilege, Cookie: session_token, ExpiredTime: expired_time}

	// Creating a new cookie with the session token and expired time
	cookie := &http.Cookie{
		Name:    "session_token",
		Value:   session_token,
		Expires: expired_time,
		Path:    "/",
	}

	// Setting the cookie using conn.WriteMessage() if conn is not nil
	if conn != nil {
		conn.WriteJSON(ServerMessage{
			Type: "loginResponse",
			Data: map[string]string{
				"login":  "true",
				"cookie": cookie.String(),
			},
		})
	}

	//fmt.Println("DEBUG: ", session_token)

	// Returning the cookie struct <<< NOT SURE IF WE NEED THIS >>>
	return session_token

	// Returning the username of the logged-in user
	//return username
}

// Checking if the given session has already been expired
func sessionExpired(session Session) bool {
	return session.ExpiredTime.Before(time.Now())
}

// Authenticating the user with the client cookie
func AuthenticateUser(w http.ResponseWriter, r *http.Request) string {

	// Getting the session token from the requested cookie
	cookie, err := r.Cookie("session_token")
	if err == http.ErrNoCookie {
		//fmt.Fprintln(os.Stderr, err)
		return "401 UNAUTHORIZED: CLIENT COOKIE NOT SET OR SESSION EXPIRED"
	}
	if err != nil {
		//fmt.Fprintln(os.Stderr, err)
		return "400 BAD REQUEST: REQUEST NOT ALLOWED"
	}
	session_token := cookie.Value

	// Getting the corresponding session from the given session token
	session, status := sessions[session_token]
	if !status {
		http.SetCookie(w, &http.Cookie{Name: "session_token", Value: "", Expires: time.Now(), Path: "/"})
		return "401 UNAUTHORIZED: INVALID SESSION TOKEN"
	}

	// Checking if the session has already been expired and removing it if that is the case
	if sessionExpired(session) {
		delete(sessions, session_token)
		http.SetCookie(w, &http.Cookie{Name: "session_token", Value: "", Expires: time.Now(), Path: "/"})
		return "401 UNAUTHORIZED: SESSION EXPIRED"
	}

	return session.Username
}

// Checking if a given user is currently logged-in
func UserLoggedIn(username string) bool {
	for _, session := range sessions {
		if strings.Compare(session.Username, username) == 0 {
			fmt.Println("UserLoggedIn: ", session.Username, " ", username)
			return true
		}
	}

	return false
}

// Logging the currently logged-in user out
func LogUserOut(conn *websocket.Conn, r *http.Request) string {
	fmt.Println("LogUserOut called")

	if r == nil {
		fmt.Println("DEBUG: r == nil")
	}

	// Getting the session token from the requested cookie
	cookie, err := r.Cookie("session_token")
	if err == http.ErrNoCookie {
		//fmt.Fprintln(os.Stderr, err)
		return "401 UNAUTHORIZED: CLIENT COOKIE NOT SET OR SESSION EXPIRED"
	}
	if err != nil {
		//fmt.Fprintln(os.Stderr, err)
		return "400 BAD REQUEST: REQUEST NOT ALLOWED"
	}
	session_token := cookie.Value

	// Get username from session
	var username string
	for _, session := range sessions {
		if strings.Compare(session.Cookie, session_token) == 0 {
			username = session.Username
			fmt.Println(Yellow + "Server >> User " + username + " has logged out!" + Reset)
		}
	}

	// Remove the user from the LoggedInUsers map
	delete(LoggedInUsers, username)

	var templist []ServerUser

	// Remove the user from the LoggedInUsers map
	for _, v := range LoggedInUsers {
		templist = append(templist, ServerUser{Username: v.Username, Privilege: v.Privilege})
	}

	Broadcast <- ServerMessage{Type: "users", Users: templist}

	// Removing the current session and resetting the client cookie
	delete(sessions, session_token)

	// Send response to the client via the websocket connection
	conn.WriteJSON(ServerMessage{Type: "logoutResponse", Data: map[string]string{"logout": "true"}})

	return "200 OK"
}

// Refreshing the current session of the requested client (in case of a logged-in user)
func RefreshSession(w http.ResponseWriter, r *http.Request) {

	// Authenticating the user with the client cookie
	mess := AuthenticateUser(w, r)
	if strings.Compare(mess[:4], "400 ") == 0 ||
		strings.Compare(mess[:4], "401 ") == 0 || !UserLoggedIn(mess) {
		return
	}

	// Generating a new expired time (5 minutes from the current time)
	new_expired_time := time.Now().Add(300 * time.Second)

	for session_token, session := range sessions {
		if strings.Compare(session.Username, mess) == 0 {

			// Updating the session of the current user with the newly-generated expired time
			session.ExpiredTime = new_expired_time

			// Setting the cookie of the current client with the newly-generated expired time
			http.SetCookie(w, &http.Cookie{Name: "session_token", Value: session_token, Expires: new_expired_time, Path: "/"})

			break
		}
	}
}

// Get session token from cookie
func GetSessionTokenFromCookie(r *http.Request) string {

	// Getting the session token from the requested cookie
	cookie, err := r.Cookie("session_token")
	if err == http.ErrNoCookie {
		//fmt.Fprintln(os.Stderr, err)
		return ""
	}
	if err != nil {
		//fmt.Fprintln(os.Stderr, err)
		return ""
	}
	session_token := cookie.Value

	return session_token
}

// Check if session token exists in the session map and is valid (not expired)
func CheckIfSessionTokenIsValid(session_token string) bool {
	_, status := sessions[session_token]
	return status
}
