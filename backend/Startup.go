package backend

import (
	"bufio"
	"fmt"
	"net/http"
	"os"
)

// StartFileServers starts the file servers
func StartFileServers() {
	//css fileserver
	fs := http.FileServer(http.Dir("html/css"))
	http.Handle("/css/", http.StripPrefix("/css/", fs))

	//js fileserver
	fs = http.FileServer(http.Dir("html/js"))
	http.Handle("/js/", http.StripPrefix("/js/", fs))
}

// StartHandlers starts the handlers
func StartHandlers() {
	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/logout", logoutHandler)
	http.HandleFunc("/signup", signupHandler)
	http.HandleFunc("/check_login", checkLoginHandler)
	http.HandleFunc("/get_logged_in_users", getLoggedInUsersHandler)

}

// StartServer starts the server on port 8080
func StartServer() {
	http.ListenAndServe(":8080", nil)
}

func StartInputHandler() {
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("hello")
	})

	go func() {
		reader := bufio.NewReader(os.Stdin)
		// loop string input
		for {
			text, _ := reader.ReadString('\n')
			if text == "status\n" {
				// Print useful information for debugging
				fmt.Printf(Blue+"Loged in users: %v\n"+Reset, LoggedInUsers)
			}
		}
	}()
}
