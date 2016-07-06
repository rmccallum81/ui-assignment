import restify from 'restify';
import fs from 'fs';

const server = restify.createServer({
  name: 'ui-assignment-api'
});

const db = JSON.parse(fs.readFileSync('server/db.json', 'utf8')).commits;

server.use(restify.CORS());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// A breaking improvement to this API would be to put the results array into a parameter of
// an object which would allow sending of metadata such as total number of items or URLs for
// the next and previous set of results
server.get('/commits', (req, res) => {
  // Start and limit should always be positive integers
  if (req.query.start && (!Number.isInteger(+req.query.start) || parseInt(req.query.start) < 0)){
    // Should always return when sending a response or the rest of the code will still execute
    return res.send(400);
  }
  if (req.query.limit && (!Number.isInteger(+req.query.limit) || parseInt(req.query.limit) < 0)){
    return res.send(400);
  }
  let start = parseInt(req.query.start)||0;
  let end = start + parseInt(req.query.limit);
  let commits = db.slice(start, end||undefined);
  return res.json(commits);
});

// Getting a specific commit is never used and as such should not have an available interface

// This should write back to the file though I'm not sure that is the intent of this exercise
server.patch('/commits/:sha/commit', (req, res) => {
  let sha = req.params.sha;
  let commit = db.find((commit,i)=>{
    return commit.sha === sha;
  });
  // Commit not found
  if( commit === undefined ) {
    return res.send(404);
  }
  // Only the message should be updated as the rest of the data is read-only
  let bodyKeys = Object.keys(req.body);
  if( bodyKeys.length === 0 || bodyKeys.length > 1 || bodyKeys[0] !== 'message' ) {
    return res.send(400);
  }
  Object.assign(commit.commit, req.body);
  return res.json(commit);
});

server.listen(8080);
