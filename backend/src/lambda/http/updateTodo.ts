import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'
import { parseUserId } from '../../auth/utils'
const logger = createLogger('updateTodos')
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

const docClient = new AWS.DynamoDB.DocumentClient()

const todoTable = process.env.TODOS_TABLE
const todoUserIdIndex = process.env.TODO_USER_ID_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('update ToDo event:  ', {...event})
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const userId = parseUserId(jwtToken)
  logger.info('User was authorized', userId)

  const validTodo = await todoExists(todoId, userId)

  if (validTodo.Count === 0) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Todo does not exist'
      })
    }
  }

  logger.info('Todo Exists: ', todoId)

  const dueDate = new Date(updatedTodo.dueDate).toISOString()
  const createdAt = validTodo.Items[0].createdAt

  const updateToDoItem = {
    ...updatedTodo,
    dueDate,
  }

  const updateResult = await docClient.update({
    TableName: todoTable,
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

  logger.info('Updated ToDo event:  ', {...updateResult})

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ''
  }
}

async function todoExists(todoId: string, userId: string) {
  const result = await docClient
    .query({
      TableName: todoTable,
      IndexName: todoUserIdIndex,
      KeyConditionExpression: 'todoId = :i  and userId = :u',
      ExpressionAttributeValues: {
        ':i': todoId,
        ':u': userId
      }
    })
    .promise()

  logger.info('Get Todo: ', result)
  return result
}