import Redis from 'ioredis'


const redisclient = new Redis({
    host : process.env.REDIS_HOST,
    port : process.env.REDIS_PORT,
    password : process.env.REDIS_PASSWORD
})

redisclient.on('connect',() => { 
    console.log('redis connected')
 })

 export default redisclient