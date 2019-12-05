// Universal query dispatcher
// ** Has to be running on two seperate servers **
// ** Connect to dorm dispatcher **
var app = require('express')();
var bodyParser = require('body-parser')
var server = require('http').Server(app);
var io = require('socket.io')(server);
const request = require('request');
const uuidv4 = require('uuid/v4');

// Constants
const PORT = 4100;

// Google IP List
// IP_ADDR: IN_USE
let googleIPList = {};

// Data structure: { available: bool, getSearchResult: fn }
let socketDict = {};
let socketIdList = []

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

app.get('/', function(req, res){
  res.send(`<h1>Mother Server</h1>`);
});

app.get('/api/', function(req, res){
  res.send(`<h1>XINAHN API</h1>`);
});
let cacheSuggestions = {}
app.get('/api/suggestion', (req, res) => {
  const q = req.query.q;
  if (cacheSuggestions[encodeURI(q)]) {
    console.log('[CACHE] using cache for request: ' + q)
    return res.send([ q, cacheSuggestions[encodeURI(q)] ]);
  }
  try {
    request(
      `https://www.baidu.com/sugrec?ie=utf-8&json=1&prod=pc&from=pc_web&wd=${encodeURI(q)}`,
      (err, response, body) => {
        try {
          if　(err) return res.send([ q, []]);
          if (body.startsWith('<')) {
            console.log('[ERROR] Baidu rejecting keyword search.');
            return res.send([ q, [] ]);
          }
          let result = JSON.parse(body);
          let ourResponse = [];
          if (result.g)
            for(let s of result.g) {
              ourResponse.push(s.q)
            }
          cacheSuggestions[encodeURI(q)] = ourResponse;
          return res.send([ q, ourResponse]);
        } catch {
          console.log('[ERROR] Baidu rejecting keyword search.');
          return res.send([ q, [] ]);
        }
      }
    );
  } catch {
    console.log('[CACHE] suggestion cache went wrong: ' + q);
    return res.send([ q, [] ]);
  }
})

app.post('/api/search', (req, res) => {
  const {
    query,
    page,
  } = req.body;
  console.log(`[SERVER] WEB_SEARCH query: ${query}, page: ${page}`);
  const requestId = uuidv4();

  let socketId = '';
  for (let s of socketIdList) {
    if (socketDict[s].available) {
      socketDict[s].available = false;
      socketId = s;
      break;
    }
  }
  console.log('[SERVER] Sending request to socket: ', socketId);
  if (!socketId) return res.send({
    errCode: 400,
    errMsg: 'server is busy'
  });

  socketDict[socketId]
    .getSearchResult({ query, page, requestId })
    .then((result) => {
      // Resolved, release the socket
      socketDict[socketId].available = true;
      return res.send(result);
    })
})

io.on('connection', (socket) => {
  socket.on('/auth', ({ authKey }) => {
    if (authKey === 'YOUR_AUTH_KEY') {
      console.log('[SERVER] Minion online! :D');
      let googleip = '';
      for (let gip in googleIPList) {
        if (!googleIPList[gip]) {
          googleIPList[gip] = true;
          googleip = gip;
        }
      }
      socket.emit('auth_success', { GOOGLE_IP: googleip });
      socket.googleip = googleip;
      if (socketIdList.indexOf(socket.id) === -1) {
        socketIdList.push(socket.id);
        socketDict[socket.id] = {
          available: true,
          getSearchResult: ({ query, page, requestId }) => {
            return new Promise((resolve, reject) => {
              socket.emit(
                'search',
                {
                  requestId,
                  query,
                  page,
                },
              );
              socket.on(requestId, result => {
                // console.log('[SERVER] getting result: ', result);
                resolve(result);
              });
            });
          }
        };
      }
    }
  })

  socket.on('disconnect', () => {
    try {
      delete socketDict[socket.id];
      googleIPList[socket.googleip] = false;
      socketIdList.splice(socketIdList.indexOf(socket.id), 1);
      console.log('[SERVER] Minion disconnected D:');
      console.log(socketDict, socketIdList, socket.googleip);
    } catch {

    }
  });
});

server.listen(PORT, function(){
  console.log('[SERVER] Server up and running at %s port', PORT);
});
  
