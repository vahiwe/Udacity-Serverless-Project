import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { parseUserId } from '../auth/utils'
const bucketName = process.env.IMAGES_S3_BUCKET
const todoAccess = new TodoAccess()

export async function getAllTodos(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken)
  return todoAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {

  const todoId = uuid.v4()
  const userId = parseUserId(jwtToken)

  return await todoAccess.createTodo({
    todoId: todoId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: new Date(createTodoRequest.dueDate).toISOString(),
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  })
}

export async function updateTodo(
  updatedTodo: UpdateTodoRequest,
  todoId: string,
  jwtToken: string
) {

  const userId = parseUserId(jwtToken)

  return await todoAccess.updateTodo(updatedTodo, todoId, userId)
}

export async function deleteTodo(
  todoId: string,
  jwtToken: string
) {

  const userId = parseUserId(jwtToken)

  return await todoAccess.deleteTodo(todoId, userId)
}

export async function generateUploadUrl(
  todoId: string,
  jwtToken: string
) {

  const userId = parseUserId(jwtToken)

  return await todoAccess.generateUploadUrl(todoId, userId)
}