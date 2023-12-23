const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'todoApplication.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => console.log('Server Running...'))
  } catch (error) {
    console.log(`DB Error ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`
      break
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`
  }

  data = await database.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ?;`
  const todo = await database.get(getTodoQuery, [todoId])
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status)
  VALUES(?,?,?,?);`
  await database.run(postTodoQuery, [id, todo, priority, status])
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const queryDetails = request.body
  const {status, todo, priority} = queryDetails
  let updateTodoQuery = ''
  let todoStatus = ''
  if (todo !== undefined) {
    updateTodoQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`
    todoStatus = 'Todo'
  } else if (priority !== undefined) {
    updateTodoQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`
    todoStatus = 'Priority'
  } else if (status !== undefined) {
    updateTodoQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`
    todoStatus = 'Status'
  }
  await database.run(updateTodoQuery)
  response.send(`${todoStatus} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  try {
    const {todoId} = request.params
    const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ?;`
    await database.run(deleteTodoQuery, [todoId])
    response.send('Todo Deleted')
  } catch (error) {
    console.log(`query Error ${error.message}`)
  }
})

module.exports = app
