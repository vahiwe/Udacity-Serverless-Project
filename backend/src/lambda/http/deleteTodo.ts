import 'source-map-support/register'

import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'
import { parseUserId } from '../../auth/utils'
const logger = createLogger('deleteTodos')

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

const docClient = new AWS.DynamoDB.DocumentClient()

const todoTable = process.env.TODOS_TABLE
const todoUserIdIndex = process.env.TODO_USER_ID_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Delete ToDo event:  ', {...event})
  const todoId = event.pathParameters.todoId
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

  const createdAt = validTodo.Items[0].createdAt

  // TODO: Remove a TODO item by id
  const key = {
    todoId,
    createdAt
  }

  logger.info('Removing item with key: ', key)

  await docClient.delete({
    TableName: todoTable,
    Key: key
  }).promise()

  return {
    statusCode: 200,
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