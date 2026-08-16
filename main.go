package main

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateTopicRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func createTopic(c *gin.Context) {
	var request CreateTopicRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	println(request.Description, request.Name)
	insertTopic(request.Name, request.Description)
	c.JSON(http.StatusOK, gin.H{"message": "success"})
}

func initUpdateTopic(c *gin.Context) {
	update_id := c.Param("id")
	fmt.Println(update_id)
	result, err := strconv.Atoi(update_id)
	if err != nil {
		fmt.Println("Error converting id to integer!")
		return
	}
	updateTopic(uint(result))
	c.JSON(http.StatusOK, gin.H{"message": "success"})
}

func initIncrementTopic(c *gin.Context) {
	increment_id := c.Param("id")
	fmt.Println(increment_id)
	result, err := strconv.Atoi(increment_id)
	if err != nil {
		fmt.Println("Error converting id to integer!")
		return
	}
	incrementTopic(uint(result))
	c.JSON(http.StatusOK, gin.H{"message": "success"})
}

func getTopics(c *gin.Context) {
	result := getTopicList()
	if result == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error fetching topics"})
		return
	}
	c.IndentedJSON(http.StatusOK, result)
}

func getTodayRevisions(c *gin.Context) {
	result := getTodayTopicList()
	if result == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error fetching topics"})
		return
	}
	c.IndentedJSON(http.StatusOK, result)
}

func getRevisionByDate(c *gin.Context) {
	result := getRevisionListByDate()
	if result == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error fetching topics"})
	}
	c.IndentedJSON(http.StatusOK, result)
}

type album struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

var albums = []album{
	{ID: "1", Name: "avinash"},
	{ID: "2", Name: "akash"},
}

func getDetails(call *gin.Context) {
	call.IndentedJSON(http.StatusOK, albums[1])
}

func main() {
	println(albums)
	ConnectDatabase()
	router := gin.Default()

	// Serve static frontend files
	router.Static("/public", "./public")
	router.StaticFile("/", "./public/index.html")

	router.GET("/get", getDetails)
	router.POST("/create", createTopic)
	router.PUT("/update/:id", initUpdateTopic)
	router.PUT("/increment/:id", initIncrementTopic)
	router.GET("/getTopics", getTopics)
	router.GET("/revisions/today", getTodayRevisions)
	router.GET("/revisions/:date", getRevisionByDate)
	router.Run("localhost:8080")
}
