const Koa = require('koa')
const cors = require('koa2-cors')
const sign = require('./sign')
const axios = require('axios')
const Router = require('koa-router')
const appid = 'xxx'
const secret = 'xxx'
const fs = require('fs')

const app = new Koa()
app.use(cors())

const route = new Router()
route.get('/config', async (ctx, next) => {
  const ticket = await getApiTicket()
  console.log(ctx.query.url)
  const s = sign(ticket, ctx.query.url)
  s.appId = appid
  ctx.body = s
})

app.use(route.routes())
app.use(route.allowedMethods())
app.listen(3003)

function getAccessToken () {
  let token = require('./access_token')
  if (token.expire > Date.now() / 1000) {
    console.log('use cache token')
    return Promise.resolve(token.access_token)
  } else {
    return axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`)
    .then(data => {
      const newToken = data.data
      newToken.expire = Math.floor(Date.now() / 1000) + 7000
      const newTokenString = JSON.stringify(newToken)
      console.log(newToken)
      fs.writeFileSync('access_token.json', newTokenString)
      return newToken.access_token
    })
  }
}

function getApiTicket () {
  let ticket = require('./jsapi_ticket')
  if (ticket.expire > Date.now() / 1000) {
    console.log('use cache ticket')
    return Promise.resolve(ticket.ticket)
  } else {
    return getAccessToken()
    .then(token => {
      return axios.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`)
    })
    .then(data => {
      const newTicket = data.data
      newTicket.expire = Math.floor(Date.now() / 1000) + 7000
      const newTicketString = JSON.stringify(newTicket)
      console.log(newTicketString)
      fs.writeFileSync('jsapi_ticket.json', newTicketString)
      return newTicket.ticket
    })
  }
}
