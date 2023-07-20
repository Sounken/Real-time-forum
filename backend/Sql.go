package backend

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"sort"
	"strconv"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var time_format = "2006-01-02 15:04:05"

// Opening the database
func OpenDatabase() *sql.DB {
	db, err := sql.Open("sqlite3", "database/forum.db?parseTime=true")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return nil
	}

	return db
}

// Closing the database
func CloseDatabase(db *sql.DB) {
	db.Close()
}

// Function to check if user exist in database, return user privilege
func GetUserPrivilege(db *sql.DB, username string) int {
	var expected_user User

	row := db.QueryRow("select id,privilege,username,passwrd,email,created_at from user where username = ?", username)
	err := row.Scan(&expected_user.ID, &expected_user.Privilege, &expected_user.Username, &expected_user.Password, &expected_user.Email, &expected_user.CreatedAt)
	if err != nil {
		return 0
	}

	return expected_user.Privilege
}

// Function checks if the email exist in the database, return true if exist, false if not
func CheckIfEmailExist(db *sql.DB, email string) bool {
	fmt.Println("Checking if email exist")
	var expected_user User

	row := db.QueryRow("select id,privilege,username,passwrd,email,created_at from user where email = ?", email)
	err := row.Scan(&expected_user.ID, &expected_user.Privilege, &expected_user.Username, &expected_user.Password, &expected_user.Email, &expected_user.CreatedAt)
	return err == nil
}

// Function to check if user exist in database, return true if exist, false if not
func CheckIfUserExist(db *sql.DB, username string) bool {
	var expected_user User

	row := db.QueryRow("select id,privilege,username,passwrd,email,created_at from user where username = ?", username)
	err := row.Scan(&expected_user.ID, &expected_user.Privilege, &expected_user.Username, &expected_user.Password, &expected_user.Email, &expected_user.CreatedAt)
	return err == nil
}

// Function to register a user in the database
func RegisterUser(db *sql.DB, username string, age int, gender string, fname string, lname string, email string, password string) string {
	// Set privilege to 1 CHANGE LATER!!!
	prev := 1

	// Insert the user into the database
	_, err := db.Exec("insert into user(privilege,username,passwrd,email,fname,lname,age,gender,created_at) values(?,?,?,?,?,?,?,?,?)", prev, username, password, email, fname, lname, age, gender, time.Now().Local().Format(time_format))
	if err != nil {
		log.Fatal(err)
	}
	return "200 OK"
}

// Function to check if the password is correct
func CheckIfPasswordIsCorrect(db *sql.DB, username string, password string) bool {
	var expected_user User

	row := db.QueryRow("select id,privilege,username,passwrd,email,created_at from user where username = ?", username)
	err := row.Scan(&expected_user.ID, &expected_user.Privilege, &expected_user.Username, &expected_user.Password, &expected_user.Email, &expected_user.CreatedAt)
	if err != nil {
		return false
	}

	if expected_user.Password == password {
		return true
	}

	return false
}

func GetPrivilegeLevel(db *sql.DB, username string) int {
	var expected_user User

	row := db.QueryRow("select id,privilege,username,passwrd,email,created_at from user where username = ?", username)
	err := row.Scan(&expected_user.ID, &expected_user.Privilege, &expected_user.Username, &expected_user.Password, &expected_user.Email, &expected_user.CreatedAt)
	if err != nil {
		return 0
	}

	return expected_user.Privilege
}

// Getting all the categories from the database
func GetAllCategories(db *sql.DB) ([]Category, string) {

	// Creating a variable to hold the categories
	var category Category
	var categories []Category

	// Selecting all fields from the category table
	rows, err := db.Query("select id,category_name,descript,created_at from category")
	if err != nil {
		//fmt.Fprintln(os.Stderr, err)
		return nil, "500 INTERNAL SERVER ERROR: CATEGORY DATA CORRUPTED"
	}
	defer rows.Close()

	// Looping through each row and saving the returned category
	for rows.Next() {
		err := rows.Scan(&category.ID, &category.CategoryName, &category.Description, &category.CreatedAt)
		if err != nil {
			//fmt.Fprintln(os.Stderr, err)
			return nil, "500 INTERNAL SERVER ERROR: CATEGORY DATA CORRUPTED"
		}

		// Appending the returned category to the categories list
		categories = append(categories, category)
	}

	return categories, "200 OK"
}

func GetLatestPosts(db *sql.DB) ([]Post, error) {
	// Update the query to join the post and category_relation tables and select the category_name
	query := `SELECT p.id, p.user_id, p.title, p.content, p.created_at, u.username, c.category_name
				FROM post p
				JOIN user u ON p.user_id = u.id
				JOIN category_relation cr ON p.id = cr.post_id
				JOIN category c ON cr.category_id = c.id
				ORDER BY p.created_at DESC LIMIT 5`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var p Post
		err := rows.Scan(&p.ID, &p.UserID, &p.Title, &p.Content, &p.CreatedAt, &p.UserName, &p.CategoryName) // Add the CategoryName field
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}

	// update posts with correct username
	for i := 0; i < len(posts); i++ {
		temp, _ := GetUser(db, posts[i].UserID)
		temp2 := string(temp.Username)
		posts[i].UserName = temp2
	}

	// sort posts by date and time created (newest first)
	sort.Slice(posts, func(i, j int) bool {
		return posts[i].CreatedAt.After(posts[j].CreatedAt)
	})

	return posts, nil
}

// Get user depending on userID
func GetUser(db *sql.DB, userID int) (User, error) {
	var user User
	row := db.QueryRow("select id,privilege,username,passwrd,email,created_at from user where id = ?", userID)
	err := row.Scan(&user.ID, &user.Privilege, &user.Username, &user.Password, &user.Email, &user.CreatedAt)
	if err != nil {
		return User{}, err
	}
	return user, nil
}

// Get user depending on username
func GetUserID(db *sql.DB, username string) string {
	// Prepare the SQL query to retrieve the user ID based on the username
	query := "SELECT id FROM user WHERE username = ?"

	// Execute the query and retrieve the user ID
	var userID string
	err := db.QueryRow(query, username).Scan(&userID)
	if err != nil {
		fmt.Printf(Red+"Server >> Error getting user ID: %s"+Reset, err)
	}

	return userID
}

// Get username depending on userID
func GetUsernameFromId(db *sql.DB, id string) string {
	// Prepare the SQL query to retrieve the user ID based on the username
	query := "SELECT username FROM user WHERE id = ?"

	// Execute the query and retrieve the user ID
	var username string
	err := db.QueryRow(query, id).Scan(&username)
	if err != nil {
		fmt.Printf(Red+"Server >> Error getting user ID: %s"+Reset, err)
	}

	return username
}

// Get chat history for a user from another user from the database
func GetChatHistory(user string, from string, offset int) []Message {
	db := OpenDatabase()
	defer db.Close()

	rows, err := db.Query("SELECT from_user, to_user, is_read, message, created_at FROM message WHERE (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?) ORDER BY created_at DESC LIMIT 10 OFFSET ?", user, from, from, user, offset)

	if err != nil {
		fmt.Printf(Red+"Server >> Error getting chat history: %s"+Reset, err)
	}

	messages := []Message{}
	for rows.Next() {
		var fromUser, toUser string
		var isread int
		var message string
		var created_at string
		err = rows.Scan(&fromUser, &toUser, &isread, &message, &created_at)
		if err != nil {
			fmt.Printf(Red+"Server >> Error reading chat history: %s"+Reset, err)
		}

		toUser = GetUsernameFromId(db, toUser)
		fromUser = GetUsernameFromId(db, fromUser)

		msg := Message{
			From:      fromUser,
			To:        toUser,
			Read:      isread,
			Text:      message,
			CreatedAt: created_at,
		}
		messages = append(messages, msg)
	}

	return messages
}

func AddMessageToHistory(fromUser string, toUser string, messageText string) {
	isread := 0
	//DEBUG PRINT
	// fmt.Println("Adding message to database")
	// fmt.Printf("From: %s To: %s Message: %s IsRead: %d ", fromUser, toUser, messageText, isread)

	// Connect to database
	db := OpenDatabase()
	defer db.Close()
	// Insert message into database
	_, err := db.Exec("INSERT INTO message (from_user, to_user, is_read, message,created_at) VALUES (?, ?, ?, ?,?)", fromUser, toUser, isread, messageText, time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		// Handle error
		fmt.Printf(Red+"Server >> Error adding message to database: %s "+Reset, err)
	}
}

func GetAllUsers(db *sql.DB) ([]User, error) {
	rows, err := db.Query("SELECT id,privilege,username,passwrd,email,created_at FROM user")
	if err != nil {
		return nil, err
	}

	var users []User

	for rows.Next() {
		var user User
		var createdAt time.Time
		err := rows.Scan(&user.ID, &user.Privilege, &user.Username, &user.Password, &user.Email, &createdAt)
		if err != nil {
			return nil, err
		}
		user.CreatedAt = time.Now().Format(time_format)
		users = append(users, user)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return users, nil
}

func AddPost(db *sql.DB, title string, content string, category string, username string) {
	liked := 0
	disliked := 0
	dummy := 0

	// Get user ID
	userID := GetUserID(db, username)

	// Insert post into database
	_, err := db.Exec("insert into post(user_id,title,content,created_at,updated_at,liked_no,disliked_no,img_url,approved,dummy) values(?,?,?,?,?,?,?,?,?,?)", userID, title, content, time.Now().Format(time_format), time.Now().Format(time_format), liked, disliked, "", 1, dummy)
	if err != nil {
		// Handle error
		fmt.Printf(Red+"Server >> Error adding post to database: %s "+Reset, err)
	}
	fmt.Println(Green + "Server >> Post added to database" + Reset)
}

func CreateCategory(db *sql.DB, category string, username string) {
	Description := "This is is not used yet in this version of the forum"

	// insert into category table
	_, err := db.Exec("insert into category(category_name,descript,created_at) values(?,?,?)", category, Description, time.Now().Local().Format(time_format))
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(Green + "Server >> Category added to database" + Reset)
}

func GetCommentsByPostTitle(db *sql.DB, postTitle string) ([]Comment, error) {
	query := `
        SELECT comment.id, comment.user_id, comment.post_id, user.username, comment.content, comment.created_at, comment.updated_at, comment.liked_no, comment.disliked_no
        FROM post
        JOIN comment ON post.id = comment.post_id
        JOIN user ON comment.user_id = user.id
        WHERE post.title = ?;
    `
	rows, err := db.Query(query, postTitle)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := []Comment{}
	for rows.Next() {
		var comment Comment
		err := rows.Scan(&comment.ID, &comment.UserID, &comment.PostID, &comment.Username, &comment.Content, &comment.CreatedAt, &comment.UpdatedAt, &comment.LikedNo, &comment.DislikedNo)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}

	// is comment empty?
	if len(comments) == 0 {
		return nil, nil
	}

	/* 	for _, v := range comments {
		fmt.Println(v.Username)
	} */

	return comments, nil
}

func InsertComment(db *sql.DB, postTitle string, username string, content string) {
	// Get post ID
	postID := GetPostID(db, content)

	// Get user ID
	userID := GetUserID(db, username)

	// Insert comment into database
	_, err := db.Exec("insert into comment(user_id,post_id,content,created_at,updated_at,liked_no,disliked_no) values(?,?,?,?,?,?,?)", userID, postID, postTitle, time.Now().Format(time_format), time.Now().Format(time_format), 0, 0)
	if err != nil {
		// Handle error
		fmt.Printf(Red+"Server >> Error adding comment to database: %s "+Reset, err)
	}
	fmt.Println(Green + "Server >> Comment added to database" + Reset)
}

func GetPostID(db *sql.DB, postTitle string) int {
	var postID int
	err := db.QueryRow("select id from post where title = ?", postTitle).Scan(&postID)
	if err != nil {
		fmt.Println("Error 1: ", err)
	}

	return postID
}

func GetCategoryID(db *sql.DB, categoryName string) int {
	//fmt.Println("Category name: ", categoryName)
	var categoryID int
	err := db.QueryRow("select id from category where category_name = ?", categoryName).Scan(&categoryID)
	if err != nil {
		fmt.Println("Error 2: ", err)
	}

	fmt.Println("Category ID: ", categoryID)
	return categoryID
}

func AddPostCategoryRelation(db *sql.DB, postTitle string, categoryName string) {
	// Get post ID
	postID := GetPostID(db, postTitle)
	// Get category ID
	categoryID, _ := strconv.Atoi(categoryName)

	// insert into post_category table
	_, err := db.Exec("insert into category_relation(post_id,category_id) values(?,?)", postID, categoryID)
	if err != nil {
		fmt.Println("Error 3: ", err)
	}

	fmt.Println(Green + "Server >> Post Category relation added to database" + Reset)
}

func GetUsernamebyEmail(db *sql.DB, email string) string {
	fmt.Println("Getting username from email")
	var username string

	err := db.QueryRow("SELECT username FROM USER user WHERE email = ?", email).Scan(&username)
	if err != nil {
		fmt.Println("username cannot be retrieved")
	}
	return username
}
func GetPostsByCategory(db *sql.DB, category_name string) ([]Post, error) {
	//fmt.Println("Category name: ", category_name)
	// Update the query to join the post and category_relation tables and select the category_name
	query := `SELECT p.id, p.user_id, p.title, p.content, p.created_at, u.username, c.category_name
          FROM post p
          JOIN user u ON p.user_id = u.id
          JOIN category_relation cr ON p.id = cr.post_id
          JOIN category c ON cr.category_id = c.id
          WHERE c.category_name = ?
          ORDER BY p.created_at DESC`

	rows, err := db.Query(query, category_name)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var p Post
		err := rows.Scan(&p.ID, &p.UserID, &p.Title, &p.Content, &p.CreatedAt, &p.UserName, &p.CategoryName) // Add the CategoryName field
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}

	// update posts with correct username
	for i := 0; i < len(posts); i++ {
		temp, _ := GetUser(db, posts[i].UserID)
		temp2 := string(temp.Username)
		posts[i].UserName = temp2
	}

	// sort posts by date and time created (newest first)
	sort.Slice(posts, func(i, j int) bool {
		return posts[i].CreatedAt.After(posts[j].CreatedAt)
	})

	return posts, nil
}
