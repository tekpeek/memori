package main

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

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
	date := c.Param("date")
	parsedDate, error := time.Parse("2006-01-02", date)
	if error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected YYYY-MM-DD (e.g., 2026-08-17)"})
		return
	}
	result := getRevisionListByDate(parsedDate)
	if result == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch revisions from database"})
		return
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
	router.POST("/topics", createTopic)
	router.PUT("/topics/:id/reset", initUpdateTopic)
	router.PUT("/increment/:id", initIncrementTopic)
	router.GET("/topics", getTopics)
	router.GET("/revisions/today", getTodayRevisions)
	router.GET("/revisions/:date", getRevisionByDate)
	router.Run("localhost:8080")
}
