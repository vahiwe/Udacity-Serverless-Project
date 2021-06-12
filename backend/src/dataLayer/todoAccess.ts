import * as AWS  from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { S3 } from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
const XAWS = AWSXRay.captureAWS(AWS)

// import { Group } from '../models/Group'
import { TodoItem } from '../models/TodoItem'

export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly s3: S3 = createS3Client(),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly userIdIndex = process.env.USER_ID_INDEX,
    private readonly todoUserIdIndex = process.env.TODO_USER_ID_INDEX,
    private readonly bucketName = process.env.IMAGES_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {

    const result = await this.docClient
    .query({
      TableName: this.todoTable,
      IndexName: this.userIdIndex,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: {
        ':u': userId
      }
    })
    .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(group: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todoTable,
      Item: group
    }).promise()

    return group
  }

  async updateTodo(updatedTodo, todoId: string, userId: string) {
    const validTodo =  await this.todoExists(todoId, userId)

    if (validTodo.Count === 0) {
      throw new Error(`Todo does not exist`);
    }
    
    const dueDate = new Date(updatedTodo.dueDate).toISOString()
    const createdAt = validTodo.Items[0].createdAt

    const updateToDoItem = {
      ...updatedTodo,
      dueDate,
    }

    await this.docClient.update({
      TableName: this.todoTable,
      Key: {
        todoId: todoId,
        createdAt: createdAt
      },
      UpdateExpression: "SET #na = :n, #du=:due, #do=:do",
      ExpressionAttributeValues:{
          ":n": updateToDoItem.name,
          ":due": updateToDoItem.dueDate,
          ":do": updateToDoItem.done
      },
      ExpressionAttributeNames:{
        "#na": "name",
        "#du": "dueDate",
        "#do": "done"
      },
      ReturnValues:"UPDATED_NEW"
    }).promise()

    return

  }

  async deleteTodo(todoId: string, userId: string) {
    const validTodo =  await this.todoExists(todoId, userId)

    if (validTodo.Count === 0) {
      throw new Error(`Todo does not exist`);
    }
    
    const createdAt = validTodo.Items[0].createdAt

    // TODO: Remove a TODO item by id
    const key = {
      todoId,
      createdAt
    }

    await this.docClient.delete({
      TableName: this.todoTable,
      Key: key
    }).promise()

    return

  }

  async generateUploadUrl(todoId: string, userId: string) {
    const validTodo =  await this.todoExists(todoId, userId)

    if (validTodo.Count === 0) {
      throw new Error(`Todo does not exist`);
    }
    
    const url = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: Number(this.urlExpiration)
    })

    return url

  }

  async todoExists(todoId: string, userId: string) {
    const result = await this.docClient
    .query({
      TableName: this.todoTable,
      IndexName: this.todoUserIdIndex,
      KeyConditionExpression: 'todoId = :i  and userId = :u',
      ExpressionAttributeValues: {
        ':i': todoId,
        ':u': userId
      }
    })
    .promise()
    
    return result
  }

}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}

function createS3Client() {
  return new XAWS.S3({
    signatureVersion: 'v4'
  })
}