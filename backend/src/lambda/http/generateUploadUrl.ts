import 'source-map-support/register'
import { createLogger } from '../../utils/logger'
import { generateUploadUrl } from '../../businessLogic/todos'
const logger = createLogger('deleteTodos')

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Generate Upload Url event:  ', {...event})
  const todoId = event.pathParameters.todoId
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  let url;

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  try {
    url = await generateUploadUrl(todoId, jwtToken)
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
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      uploadUrl: url
    })
  }
}
