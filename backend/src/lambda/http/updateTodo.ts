import 'source-map-support/register'
import { createLogger } from '../../utils/logger'
import { updateTodo } from '../../businessLogic/todos'
const logger = createLogger('updateTodos')
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('update ToDo event:  ', {...event})
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
  try {
    await updateTodo(updatedTodo, todoId, jwtToken)
  } catch(e) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: e.message
      })
    }
  }

  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ''
  }
}
