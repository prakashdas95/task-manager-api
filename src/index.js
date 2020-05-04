const express = require('express');
//just to ensure that file run not grabbing anything
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express();
const port = process.env.PORT

//auto parse the incoming json to object to use 
app.use(express.json())
//registered the user routers
app.use(userRouter)
//registered the task routers
app.use(taskRouter)


//port
app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

