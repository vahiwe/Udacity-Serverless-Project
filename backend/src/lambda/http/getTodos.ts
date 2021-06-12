import 'source-map-support/register'
import { createLogger } from '../../utils/logger'
import { getAllTodos } from '../../businessLogic/todos'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
const logger = createLogger('getTodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user
  logger.info('Get ToDo event:  ', {...event})
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  
  logger.info('Getting all groups')

  const items = await getAllTodos(jwtToken)

  logger.info('Get events:  ', {...items})

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items
    })
  }
}
