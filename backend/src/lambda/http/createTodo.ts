import 'source-map-support/register'
import * as uuid from 'uuid'
import * as AWS  from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'
import { parseUserId } from '../../auth/utils'
const logger = createLogger('createTodo')

const docClient = new AWS.DynamoDB.DocumentClient()

const todoTable = process.env.TODOS_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Create ToDo event:  ', {...event})
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  const dueDate = new Date(newTodo.dueDate).toISOString()

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const userId = parseUserId(jwtToken)

  const newToDoItem = {
    todoId,
    createdAt,
    done: false,
    userId,
    ...newTodo,
    dueDate,
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  }

  await docClient
      .put({
        TableName: todoTable,
        Item: newToDoItem
      })
      .promise()

  
  logger.info('New ToDo event created:  ', {...newToDoItem})
  
  // TODO: Implement creating a new TODO item
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      item: newToDoItem
    })
  }
}
