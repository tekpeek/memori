package main

import (
	"fmt"
	"memori/server/models"
	"time"
)

func uniformDate(date time.Time) time.Time {
	return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
}

func insertTopic(name string, description string) {
	fmt.Println("Inserting new topic into database.")
	dateOnly := uniformDate(time.Now())
	insertData := models.Topic{Name: name, Description: description, NextRevisionDate: dateOnly, CurrentInterval: 1}
	result := DB.Create(&insertData)
	if result.Error != nil {
		fmt.Println("Error creating topic:", result.Error)
		return
	}
	fmt.Println("New topic inserted.")
}

func updateTopic(id uint) {
	fmt.Println("Updating topic.")
	dateOnly := uniformDate(time.Now())
	result := DB.Model(&models.Topic{}).Where("id = ?", id).Updates(models.Topic{CurrentInterval: 0, NextRevisionDate: dateOnly})
	if result.Error != nil {
		fmt.Println("Error updating data: ", result.Error)
		return
	}
	fmt.Println("Data updated successfully.")
}

func GetTopicDetails(id uint) models.Topic {
	fmt.Println("Fetching Topic Details for Topic:", id)
	var TopicDetails models.Topic
	result := DB.First(&TopicDetails, id)
	if result.Error != nil {
		fmt.Println("Error Fetching details for Topic:", id, result.Error)
		return models.Topic{}
	}
	return TopicDetails
}

func incrementTopic(id uint) {
	fmt.Println("Incrementing Topic: ", id)
	// implement generic topic fetching function
	topicDetails := GetTopicDetails(id)

	newRevisionDate, newInterval := calculateNextRevisionDate(topicDetails.NextRevisionDate, topicDetails.CurrentInterval)
	result := DB.Model(&models.Topic{}).Where("id = ?", id).Updates(models.Topic{CurrentInterval: newInterval, NextRevisionDate: newRevisionDate})
	if result.Error != nil {
		fmt.Println("Error updating data: ", result.Error)
		return
	}
	insertRevisionLog(id, topicDetails.Name, newInterval, "Completed")
	fmt.Println("Data updated successfully.")
}

func insertRevisionLog(id uint, topic string, interval int, status string) {
	fmt.Println("Inserting revision log for topic: ", topic)
	topicDetails := GetTopicDetails(id)
	insertData := models.RevisionLog{TopicID: id, Topic: topicDetails, Interval: interval, Status: status}
	result := DB.Create(&insertData)
	if result.Error != nil {
		fmt.Println("Error inserting data into RevisionLog for ", id, result.Error)
		return
	}
	fmt.Println("Revision log inserted.")
}

func calculateNextInterval(currInterval int) int {
	interval_map := map[int]int{
		0:  1,
		1:  4,
		4:  7,
		7:  14,
		14: 28,
		28: 1,
	}

	return interval_map[currInterval]
}

func calculateNextRevisionDate(currDate time.Time, currInterval int) (time.Time, int) {
	nextInterval := calculateNextInterval(currInterval)
	if uniformDate(currDate).Before(uniformDate(time.Now())) {
		currDate = uniformDate(time.Now())
		currInterval = 1
	}
	nextRevisionDate := currDate.AddDate(0, 0, nextInterval)
	nextRevisionDate = uniformDate(nextRevisionDate)
	fmt.Println("Next Revision Date: ", nextRevisionDate)
	return nextRevisionDate, nextInterval
}

func getTopicList() []models.Topic {
	var topicsList []models.Topic
	result := DB.Find(&topicsList)
	if result.Error != nil {
		fmt.Println("Error fetching all topics.", result.Error)
		return nil
	}
	fmt.Println("Fetched all topics: ", len(topicsList))
	return topicsList
}

func getTodayTopicList() []models.Topic {
	var topicsList []models.Topic
	result := DB.Find(&topicsList, "NEXT_REVISION_DATE <= ?", uniformDate(time.Now()))
	if result.Error != nil {
		fmt.Println("Error fetching all topics.", result.Error)
		return nil
	}
	fmt.Println("Fetched all topics: ", len(topicsList))
	return topicsList
}

func getRevisionListByDate(date time.Time) []models.Topic {
	var topicsList []models.Topic
	result := DB.Find(&topicsList, "NEXT_REVISION_DATE = ?", uniformDate(date))
	if result.Error != nil {
		fmt.Println("Error fetching topics for date.", result.Error)
		return nil
	}
	fmt.Println("Fetched all topics: ", len(topicsList))
	return topicsList
}
