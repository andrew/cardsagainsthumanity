var cards = require('./cards.json')
var crypto = require('crypto')
var express = require('express')
var app = express()

app.use(express.cookieParser())
app.use(express.bodyParser())
app.use(express.static(__dirname + '/public'));

var questions = cards.filter(function(card) {
  return card.cardType === "Q"
})

var answers = cards.filter(function(card) {
  return card.cardType === "A"
})

var pub = __dirname + '/public';

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/game/:uid', function(req,res){
  var game = fetchGame(req.params.uid)

  var user = game.players[req.cookies.playerID]
  if (!user){
    var cookie = crypto.randomBytes(8).toString('hex');
    res.cookie('playerID', cookie)

    var user = game.players[cookie] = {}
    if (Object.keys(game.players).length === 1){
      console.log('setting cookie')
      game.judge = cookie

      game.question = pickQuestion()

      // TODO: Remove from questions deck.
    }
    user.answers = []

    for (var i = 0; i < 10; i++) {
      var index = Math.floor(Math.random() * answers.length)
      user.answers.push(answers[index])
      // TODO: Remove from answers deck.
    }

    game.players[cookie] = user
  }

  var _cookie = cookie || req.cookies.playerID;
  var judge = (game.judge === _cookie) ? true : false;

  console.log(game.judge)
  console.log(_cookie)
  console.log(judge)

  res.render('index', {
    game: game,
    user: user,
    judge: judge
  })
});

app.post('/game/:uid', function(req,res){
  console.log('answer')
  var game = fetchGame(req.params.uid)
  var user = game.players[req.cookies.playerID]
  var answer = req.body.answer
  user.answers = user.answers.filter(function(a){
    return answer !== a.text
  })
  var index = Math.floor(Math.random() * answers.length)
  user.answers.push(answers[index])
  game.answers.push(answer)
  res.redirect('/game/'+game.uid)
})

app.post('/game/:uid/winner', function(req,res){
  var game = fetchGame(req.params.uid)
  var user = game.players[req.cookies.playerID]
  game.answers = []
  game.question = pickQuestion()
  var playerKeys = Object.keys(game.players)
  var randomPlayer = Math.floor(Math.random() * playerKeys.length)
  game.judge = playerKeys[randomPlayer]
  console.log(game.judge)
  res.redirect('/game/'+game.uid)
})

var games = {}

function fetchGame(uid, player) {
  if (games[uid]){
    return games[uid]
  } else {
    return games[uid] = {
      uid: uid,
      players: {},
      answers: [],
      judge: null
    }
  }
}

function pickQuestion() {
  return questions[Math.floor(Math.random() * questions.length)]
}

app.listen(7076)
