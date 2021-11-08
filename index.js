const express = require('express');
const app = express();
const cors = require('cors');
var admin = require('firebase-admin')
require('dotenv').config();
const port = process.env.PORT || 5000
const { MongoClient } = require('mongodb');



app.use(cors())
app.use(express.json())
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e4xul.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});  

// jwt token 


var serviceAccount = require('./doctors-portal sdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
 
async function verifyToken(req,res,next){
  if(req.headers?.authorization.startsWith('Bearer ')){
    const token=req.headers.authorization.split(' ')[1]
    try{
      const decodedToken=await admin.auth().verifyIdToken(token)
    req.decodedEmail =decodedToken.email
    }
  catch{

  }
  }
  next()
}


// -----------
async function run() {
  try {
    await client.connect();
    const database = client.db('doctors_portal');
    const appointmentsCollection = database.collection('appointments');
    const usersCollection=database.collection('users');
  
// get method
app.get('/appointments',async(req,res)=>{
  const email =req.query.email 
  const dateQuery = (req.query.date)
  const date = new Date(dateQuery).toLocaleDateString()
  console.log(date)
  const query ={email :email , date:date}
  const appointments= await appointmentsCollection.find(query).toArray()
  res.json(appointments)
}) 

    // -post method 
    app.post('/appointments', async(req,res)=>{
      const appointment = req.body
      const result =await appointmentsCollection.insertOne(appointment)
      res.json(result)
    })
// post method
app.post('/users', async(req,res)=>{
  const user=req.body
  const result =await usersCollection.insertOne(user)
  console.log(result)
})

// upser user data 

app.put('/users', async(req,res)=>{
  const user= req.body
  const filter ={email : user.email}
    const options = { upsert : true }
    const updateDoc={ $set : user }
    const result=await usersCollection.updateOne (filter,updateDoc,options)
    res.json(result)
})


// make role 

app.put('/users/admin', verifyToken,  async(req,res)=>{
  const user =req.body
  const requester=req.decodedEmail
  if(requester){
    const requesterAccount= await usersCollection.findOne({email:requester})
    if(requesterAccount.role='admin'){
        const filter = { email: user.email };
        const updateDoc = { $set: { role: 'admin' } };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.json(result);
    }
  }else{
    res.status(403).josn({message: ' you do not have access to make admin'})
  }

})


// for 
app.get('/users/:email',async(req,res)=>{
  const email =req.params.email 
  const query ={ email :email  }
  const user =await usersCollection.findOne(query)
  let isAdmin =false
   if(user?.role== 'admin'){
     isAdmin=true ;
   }
   res.json({admin: isAdmin})
}) 




  } finally {
    
  }
}
run().catch(console.dir);

// -------------

app.get('/', (req, res) => {
  res.send('hello doctors portal!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
