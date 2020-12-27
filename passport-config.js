require('dotenv');
const LocalStrategy = require('passport-local');
const { comparePassword } = require('pcypher');
const MongoClient = require('mongodb').MongoClient;


const mongoUrl = `mongodb+srv://adam:${process.env.mongo_pwd}@cluster0.mn0ld.mongodb.net/${process.env.mongo_usr}?retryWrites=true&w=majority`;
const databaseName = 'storeDB';
const USER = 'user';
// function findByUsername(username, func) {
//     let a = MongoClient.connect(mongoUrl, async (err, db) => {
//         if(err) throw err;
//         let storeDB = db.db(databaseName)
//         let item = storeDB.collection(USER).findOne({username: username}, (err, user) => {
//             if(err) throw err;
//             return user
//         })
//         return item
//     })
//     console.log(`In findByUsername(${username})=>`, a)
//     func(a)
// }
let returnValue;
function handleUser(user, password, done){
    if(user == null){
        returnValue = done(null, false, {message: 'No user exists with that username.'})
    }else{
        returnValue = comparePassword(password, user.password).then(bool => {
            // console.log("bool, user", bool, user)
            if(bool){
                console.log("user: ", user)
                return done(null, user)
            }else{
                return done(null,false,{message: 'Wrong password.'})
            }
        })
        .catch(err => console.error(err))
    }
    // console.log(returnValue)
}

function initialize(passport){
    passport.use(new LocalStrategy({}, async (username, password, done) => {
        console.log('in passport.use()')
        MongoClient.connect(mongoUrl,{ useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
            // console.log(err, db)
            if(err) throw err;
            let storeDB = db.db(databaseName)
            storeDB.collection(USER).findOne({username: username}, (err, user) => {
                if(err) throw err;
                handleUser(user, password, done)
                console.log('returnValue: ', returnValue)
            })
        })
        let result = await returnValue
        console.log(result)
        return result
                
        // return findByUsername(username, user => {
        //     if(user == null){
        //         return done(null, false, {message: 'No user exists with that username.'});
        //     }else{
        //         console.log(user)
        //         let bool = comparePassword(password, user.password)
        //         if(bool){
        //             return done(null, user);
        //         }else{
        //             return done(null, false, {message: 'Wrong password.'});
        //         }
        //     }
        // })
        // let user = await findByUsername(username)
        // if(user == null){
        //     return done(null, false, {message: 'No user exists with that username.'});
        // }else{
        //     let bool = await comparePassword(password, user.password)
        //     if(bool){
        //         return done(null, user);
        //     }else{
        //         return done(null, false, {message: 'Wrong password.'});
        //     }
        // }
        // let a = MongoClient.connect(mongoUrl, async (err, db) => {
        //     if(err) return done(err);
        //     let storeDB = db.db(databaseName);
        //     let b = storeDB.collection(USER).findOne({username: username}, async (err, user) => {
        //         if(err) return done(err);
        //         if(user == null){
        //             return done(null, false, {message: 'No user exists with that username.'});
        //         }
        //         try{
        //             // console.log('b', done(null, user))
        //             // console.log(await comparePassword(password, user.password), done(null, user))
        //             let bool = await comparePassword(password, user.password)
        //             if(bool){
        //                 return done(null, user);
        //             }else{
        //                 return done(null, false, {message: 'Wrong password.'});
        //             }
        //         }catch(e){
        //             return done(e);
        //         }
        //     })
        //     console.log("b", b)
        //     return b
        // })
        // console.log("a:",a)
        // return a;
    }));
    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser((id, done) => {
        return MongoClient.connect(mongoUrl, (err, res) => {
            if(err) return done(err);
            let db = res.db(databaseName);
            return db.collection(USER).findOne({_id: id}, async(err, result) => {
                if(err) return done(err);
                return done(null, result)
            })
        })
    });
}
module.exports = initialize;